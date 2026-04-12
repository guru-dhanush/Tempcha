-- ═══════════════════════════════════════════════════════════════════
-- FlashRoom DB Optimizations
-- Indexes, constraints, triggers, RPC functions, views
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. CHECK CONSTRAINTS ─────────────────────────────────────────
-- Validate data at DB level — don't rely only on app-level validation

alter table public.rooms
  add constraint rooms_name_length           check (char_length(name) between 1 and 60),
  add constraint rooms_brand_color_format    check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint rooms_duration_range        check (session_duration_minutes between 15 and 720),
  add constraint rooms_auto_open_hour_range  check (auto_open_hour is null or auto_open_hour between 0 and 23),
  add constraint rooms_auto_close_hour_range check (auto_close_hour is null or auto_close_hour between 0 and 23),
  add constraint rooms_max_participants_range check (max_participants between 1 and 1000);

alter table public.messages
  add constraint messages_content_length check (char_length(content) between 1 and 500);

alter table public.participants
  add constraint participants_alias_length check (char_length(alias) between 1 and 40),
  add constraint participants_token_length check (char_length(token) >= 16);

alter table public.sessions
  add constraint sessions_closes_after_opens check (closes_at > opened_at);

-- ─── 2. INDEXES ───────────────────────────────────────────────────
-- Cover every WHERE clause and JOIN we make in the app

-- rooms
create index if not exists idx_rooms_owner_id       on public.rooms(owner_id);
create index if not exists idx_rooms_slug           on public.rooms(slug) where is_active = true;
create index if not exists idx_rooms_owner_active   on public.rooms(owner_id, is_active);

-- sessions — most queried table at runtime
create index if not exists idx_sessions_room_id         on public.sessions(room_id);
create index if not exists idx_sessions_room_active     on public.sessions(room_id, closed_at) where closed_at is null;
create index if not exists idx_sessions_closes_at       on public.sessions(closes_at) where closed_at is null;
create index if not exists idx_sessions_opened_at       on public.sessions(opened_at desc);

-- messages — heavy read during active sessions
create index if not exists idx_messages_session_id      on public.messages(session_id);
create index if not exists idx_messages_session_created on public.messages(session_id, created_at asc);
create index if not exists idx_messages_pinned          on public.messages(session_id) where pinned = true;

-- participants
create index if not exists idx_participants_session_id  on public.participants(session_id);
create index if not exists idx_participants_token       on public.participants(token);
create index if not exists idx_participants_alias       on public.participants(session_id, alias);

-- reactions
create index if not exists idx_reactions_message_id     on public.reactions(message_id);
create index if not exists idx_reactions_session_id     on public.reactions(session_id);
create index if not exists idx_reactions_msg_alias      on public.reactions(message_id, alias);

-- typing indicators
create index if not exists idx_typing_session_id        on public.typing_indicators(session_id);
create index if not exists idx_typing_updated_at        on public.typing_indicators(updated_at);

-- reported messages
create index if not exists idx_reports_session_id       on public.reported_messages(session_id);

-- ─── 3. UPDATED_AT TRIGGER ────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- ─── 4. AUTO-CLOSE STALE TYPING INDICATORS ────────────────────────
-- Typing indicators older than 5s are stale — clean them periodically

create or replace function public.cleanup_stale_typing()
returns void language plpgsql security definer as $$
begin
  delete from public.typing_indicators
  where updated_at < now() - interval '5 seconds';
end;
$$;

-- ─── 5. RPC: close_session ─────────────────────────────────────────
-- Atomic: snapshot analytics → delete ephemeral data → mark closed
-- Replaces 5 separate API calls with 1 DB round trip

create or replace function public.rpc_close_session(p_session_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_msg_count   int;
  v_part_count  int;
begin
  -- Count before deletion
  select count(*) into v_msg_count  from public.messages     where session_id = p_session_id;
  select count(*) into v_part_count from public.participants where session_id = p_session_id;

  -- Update session record with analytics
  update public.sessions set
    closed_at         = now(),
    message_count     = v_msg_count,
    participant_count = v_part_count,
    peak_participants = greatest(peak_participants, v_part_count)
  where id = p_session_id
    and closed_at is null;  -- idempotent guard

  -- Purge all ephemeral data atomically
  delete from public.reactions         where session_id = p_session_id;
  delete from public.typing_indicators where session_id = p_session_id;
  delete from public.messages          where session_id = p_session_id;
  delete from public.participants      where session_id = p_session_id;

  return jsonb_build_object(
    'success',           true,
    'message_count',     v_msg_count,
    'participant_count', v_part_count
  );
end;
$$;

-- ─── 6. RPC: join_room ─────────────────────────────────────────────
-- Atomic: check capacity → upsert participant in one round trip

create or replace function public.rpc_join_room(
  p_session_id  uuid,
  p_alias       text,
  p_alias_color text,
  p_token       text
)
returns jsonb language plpgsql security definer as $$
declare
  v_max_participants  int;
  v_current_count     int;
begin
  -- Get capacity from room via session
  select r.max_participants
  into   v_max_participants
  from   public.rooms r
  join   public.sessions s on s.room_id = r.id
  where  s.id = p_session_id
    and  s.closed_at is null;

  if not found then
    return jsonb_build_object('error', 'Session not found or closed');
  end if;

  -- Check if token already exists (rejoin)
  if exists (select 1 from public.participants where token = p_token) then
    -- Update last_seen and return ok
    update public.participants set last_seen_at = now() where token = p_token;
    return jsonb_build_object('success', true, 'rejoined', true);
  end if;

  -- Count current participants
  select count(*) into v_current_count
  from   public.participants
  where  session_id = p_session_id;

  if v_current_count >= v_max_participants then
    return jsonb_build_object('error', 'Room is full');
  end if;

  -- Insert new participant
  insert into public.participants (session_id, alias, alias_color, token)
  values (p_session_id, p_alias, p_alias_color, p_token);

  return jsonb_build_object('success', true, 'rejoined', false);
end;
$$;

-- ─── 7. RPC: pin_message ───────────────────────────────────────────
-- Atomic: unpin all → pin target in one round trip

create or replace function public.rpc_pin_message(p_message_id uuid)
returns void language plpgsql security definer as $$
declare
  v_session_id uuid;
begin
  select session_id into v_session_id
  from   public.messages
  where  id = p_message_id;

  if not found then
    raise exception 'Message not found';
  end if;

  update public.messages set pinned = false where session_id = v_session_id;
  update public.messages set pinned = true  where id = p_message_id;
end;
$$;

-- ─── 8. RPC: kick_participant ──────────────────────────────────────
-- Atomic: verify ownership → remove participant in one query

create or replace function public.rpc_kick_participant(
  p_session_id uuid,
  p_alias      text,
  p_owner_id   uuid
)
returns jsonb language plpgsql security definer as $$
declare
  v_owner_id uuid;
begin
  -- Verify session belongs to this owner
  select r.owner_id into v_owner_id
  from   public.sessions s
  join   public.rooms r on r.id = s.room_id
  where  s.id = p_session_id;

  if not found or v_owner_id <> p_owner_id then
    return jsonb_build_object('error', 'Forbidden');
  end if;

  delete from public.participants
  where session_id = p_session_id and alias = p_alias;

  return jsonb_build_object('success', true);
end;
$$;

-- ─── 9. RPC: get_room_by_slug ─────────────────────────────────────
-- Single query: room + active session + recent messages

create or replace function public.rpc_get_room_by_slug(p_slug text)
returns jsonb language plpgsql security definer as $$
declare
  v_room    jsonb;
  v_session jsonb;
  v_messages jsonb;
begin
  -- Room
  select to_jsonb(r) into v_room
  from   public.rooms r
  where  r.slug = p_slug and r.is_active = true;

  if not found then return null; end if;

  -- Active session
  select to_jsonb(s) into v_session
  from   public.sessions s
  where  s.room_id = (v_room->>'id')::uuid
    and  s.closed_at is null
    and  s.closes_at > now()
  order  by s.opened_at desc
  limit  1;

  -- Messages (only if session active)
  if v_session is not null then
    select jsonb_agg(m order by m.created_at asc) into v_messages
    from   public.messages m
    where  m.session_id = (v_session->>'id')::uuid;
  end if;

  return jsonb_build_object(
    'room',     v_room,
    'session',  v_session,
    'messages', coalesce(v_messages, '[]'::jsonb)
  );
end;
$$;

-- ─── 10. VIEW: room_analytics ─────────────────────────────────────
-- Pre-aggregated stats per room — avoids repeated COUNT queries in dashboard

create or replace view public.room_analytics as
select
  r.id                                                         as room_id,
  r.owner_id,
  r.name,
  r.slug,
  count(s.id)                                                  as total_sessions,
  count(s.id) filter (where s.closed_at is not null)          as completed_sessions,
  coalesce(sum(s.participant_count), 0)                       as total_participants,
  coalesce(sum(s.message_count), 0)                           as total_messages,
  coalesce(max(s.peak_participants), 0)                       as peak_participants_ever,
  max(s.opened_at)                                            as last_session_at,
  count(s.id) filter (where s.closed_at is null)              as active_sessions
from   public.rooms r
left   join public.sessions s on s.room_id = r.id
group  by r.id, r.owner_id, r.name, r.slug;

-- ─── 11. RPC: get_dashboard_stats ─────────────────────────────────
-- Single query for everything the dashboard overview needs

create or replace function public.rpc_get_dashboard_stats(p_owner_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_rooms',        count(distinct r.id),
    'active_sessions',    count(distinct s.id) filter (where s.closed_at is null),
    'total_sessions',     count(distinct s.id),
    'total_participants', coalesce(sum(s.participant_count), 0),
    'total_messages',     coalesce(sum(s.message_count), 0)
  ) into v_result
  from  public.rooms r
  left  join public.sessions s on s.room_id = r.id
  where r.owner_id = p_owner_id;

  return v_result;
end;
$$;

-- ─── 12. GRANT RPC ACCESS ─────────────────────────────────────────

grant execute on function public.rpc_close_session     to authenticated, anon;
grant execute on function public.rpc_join_room         to authenticated, anon;
grant execute on function public.rpc_pin_message       to authenticated;
grant execute on function public.rpc_kick_participant  to authenticated;
grant execute on function public.rpc_get_room_by_slug  to authenticated, anon;
grant execute on function public.rpc_get_dashboard_stats to authenticated;
grant execute on function public.cleanup_stale_typing  to authenticated, anon;

grant select on public.room_analytics to authenticated;
