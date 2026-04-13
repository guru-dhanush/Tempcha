-- ═══════════════════════════════════════════════════════════════════
-- Private Conversations — 1:1 participant → staff
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Room type + retention columns ────────────────────────────
alter table public.rooms
  add column if not exists room_type        text not null default 'group'
    check (room_type in ('group','private','hybrid')),
  add column if not exists retention_policy text not null default 'ephemeral'
    check (retention_policy in ('ephemeral','24h','7d','permanent')),
  add column if not exists participant_can_export boolean not null default false;

-- ─── 2. Conversations table (one per participant per session) ──────
create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.sessions(id) on delete cascade,
  room_id           uuid not null references public.rooms(id)    on delete cascade,
  participant_token text not null,
  participant_alias text not null,
  participant_color text not null default '#7C3AED',
  status            text not null default 'open'
    check (status in ('open','resolved','assigned')),
  assigned_to       text,                    -- staff alias
  unread_count      int  not null default 0, -- unread for admin
  last_message_at   timestamptz,
  last_message_preview text,
  created_at        timestamptz default now(),
  resolved_at       timestamptz,
  -- one conversation per participant per session
  unique (session_id, participant_token)
);

-- ─── 3. Conversation messages ──────────────────────────────────────
create table public.conversation_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 500),
  sender_type     text not null check (sender_type in ('participant','staff')),
  sender_alias    text not null,
  read_at         timestamptz,   -- null = unread by the other side
  created_at      timestamptz default now()
);

-- ─── 4. Indexes ────────────────────────────────────────────────────
create index idx_conversations_session_id      on public.conversations(session_id);
create index idx_conversations_room_id         on public.conversations(room_id);
create index idx_conversations_token           on public.conversations(participant_token);
create index idx_conversations_status          on public.conversations(status);
create index idx_conversations_last_message    on public.conversations(last_message_at desc);
create index idx_conv_messages_conversation_id on public.conversation_messages(conversation_id);
create index idx_conv_messages_created_at      on public.conversation_messages(conversation_id, created_at asc);

-- ─── 5. RLS ────────────────────────────────────────────────────────
alter table public.conversations         enable row level security;
alter table public.conversation_messages enable row level security;

-- Participants: read/write their own conversation by token
create policy "Participant read own conversation" on public.conversations
  for select using (true); -- filtered by token in app

create policy "Participant insert conversation" on public.conversations
  for insert with check (true);

create policy "Participant update own conversation" on public.conversations
  for update using (true);

-- Messages: anyone in the conversation can read/write
create policy "Public read conv messages" on public.conversation_messages
  for select using (true);

create policy "Public insert conv messages" on public.conversation_messages
  for insert with check (true);

-- ─── 6. Realtime ───────────────────────────────────────────────────
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_messages;

-- ─── 7. RPC: start_or_get_conversation ────────────────────────────
-- Atomic: get existing conversation or create new one
create or replace function public.rpc_start_conversation(
  p_session_id        uuid,
  p_room_id           uuid,
  p_participant_token text,
  p_participant_alias text,
  p_participant_color text
)
returns jsonb language plpgsql security definer as $$
declare
  v_conversation jsonb;
begin
  -- Check session is still active
  if not exists (
    select 1 from public.sessions
    where id = p_session_id and closed_at is null and closes_at > now()
  ) then
    return jsonb_build_object('error', 'Session not found or closed');
  end if;

  -- Upsert conversation
  insert into public.conversations
    (session_id, room_id, participant_token, participant_alias, participant_color)
  values
    (p_session_id, p_room_id, p_participant_token, p_participant_alias, p_participant_color)
  on conflict (session_id, participant_token) do nothing;

  select to_jsonb(c) into v_conversation
  from public.conversations c
  where c.session_id = p_session_id
    and c.participant_token = p_participant_token;

  return jsonb_build_object('conversation', v_conversation);
end;
$$;

-- ─── 8. RPC: send_conversation_message ────────────────────────────
-- Insert message + update conversation metadata atomically
create or replace function public.rpc_send_conv_message(
  p_conversation_id uuid,
  p_content         text,
  p_sender_type     text,
  p_sender_alias    text
)
returns jsonb language plpgsql security definer as $$
declare
  v_message jsonb;
begin
  -- Validate conversation exists and session is open
  if not exists (
    select 1 from public.conversations c
    join public.sessions s on s.id = c.session_id
    where c.id = p_conversation_id
      and s.closed_at is null
      and s.closes_at > now()
  ) then
    return jsonb_build_object('error', 'Conversation not available');
  end if;

  -- Insert message
  insert into public.conversation_messages
    (conversation_id, content, sender_type, sender_alias)
  values
    (p_conversation_id, p_content, p_sender_type, p_sender_alias)
  returning to_jsonb(conversation_messages.*) into v_message;

  -- Update conversation metadata
  update public.conversations set
    last_message_at      = now(),
    last_message_preview = left(p_content, 60),
    unread_count = case
      when p_sender_type = 'participant' then unread_count + 1
      else 0
    end
  where id = p_conversation_id;

  return jsonb_build_object('message', v_message);
end;
$$;

-- ─── 9. RPC: resolve_conversation ─────────────────────────────────
create or replace function public.rpc_resolve_conversation(
  p_conversation_id uuid,
  p_owner_id        uuid
)
returns jsonb language plpgsql security definer as $$
begin
  -- Verify ownership via room
  if not exists (
    select 1 from public.conversations c
    join public.rooms r on r.id = c.room_id
    where c.id = p_conversation_id and r.owner_id = p_owner_id
  ) then
    return jsonb_build_object('error', 'Forbidden');
  end if;

  update public.conversations set
    status = 'resolved',
    resolved_at = now(),
    unread_count = 0
  where id = p_conversation_id;

  return jsonb_build_object('success', true);
end;
$$;

-- ─── 10. RPC: close_session (updated) — also purge conversations ──
create or replace function public.rpc_close_session(p_session_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_msg_count   int;
  v_part_count  int;
  v_retention   text;
begin
  select count(*) into v_msg_count  from public.messages     where session_id = p_session_id;
  select count(*) into v_part_count from public.participants where session_id = p_session_id;

  -- Get retention policy
  select r.retention_policy into v_retention
  from public.sessions s
  join public.rooms r on r.id = s.room_id
  where s.id = p_session_id;

  update public.sessions set
    closed_at         = now(),
    message_count     = v_msg_count,
    participant_count = v_part_count,
    peak_participants = greatest(peak_participants, v_part_count)
  where id = p_session_id and closed_at is null;

  -- Always purge group ephemeral data
  delete from public.reactions         where session_id = p_session_id;
  delete from public.typing_indicators where session_id = p_session_id;
  delete from public.messages          where session_id = p_session_id;
  delete from public.participants      where session_id = p_session_id;

  -- Purge private conversations only if ephemeral
  if v_retention = 'ephemeral' then
    delete from public.conversation_messages
    where conversation_id in (
      select id from public.conversations where session_id = p_session_id
    );
    delete from public.conversations where session_id = p_session_id;
  end if;

  return jsonb_build_object(
    'success',           true,
    'message_count',     v_msg_count,
    'participant_count', v_part_count,
    'retention',         v_retention
  );
end;
$$;

-- Grant RPC access
grant execute on function public.rpc_start_conversation    to authenticated, anon;
grant execute on function public.rpc_send_conv_message     to authenticated, anon;
grant execute on function public.rpc_resolve_conversation  to authenticated;
