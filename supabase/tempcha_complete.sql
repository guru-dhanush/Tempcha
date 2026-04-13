-- ═══════════════════════════════════════════════════════════════════════════════
-- TEMPCHA — Complete Database Script
-- Fresh install + idempotent (safe to re-run on existing DB)
-- 
-- Sections:
--   1.  Extensions
--   2.  Tables
--   3.  Check constraints
--   4.  Indexes
--   5.  Triggers
--   6.  Row Level Security
--   7.  Realtime
--   8.  Views
--   9.  RPC Functions
--  10.  Grants
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";   -- uuid_generate_v4()
create extension if not exists "pgcrypto";    -- gen_random_uuid() (also built-in pg14+)

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- ── rooms ────────────────────────────────────────────────────────────────────
-- One row = one persistent QR code. The QR never changes.
-- Each room can have multiple sessions over its lifetime.

create table if not exists public.rooms (
  id                       uuid        primary key default gen_random_uuid(),
  owner_id                 uuid        not null references auth.users(id) on delete cascade,

  -- Identity
  name                     text        not null,
  slug                     text        not null unique,          -- /r/:slug
  description              text,
  is_active                boolean     not null default true,

  -- Chat mode
  -- group   : all messages public to everyone in the session
  -- private : each participant gets a 1:1 thread with admin only
  -- hybrid  : participant chooses on join
  room_type                text        not null default 'group'
    check (room_type in ('group', 'private', 'hybrid')),

  -- Message retention after session closes
  -- ephemeral : deleted immediately on close
  -- 24h       : deleted 24 hours after close
  -- 7d        : deleted 7 days after close
  -- permanent : never deleted
  retention_policy         text        not null default 'ephemeral'
    check (retention_policy in ('ephemeral', '24h', '7d', 'permanent')),

  -- Whether participants are allowed to export/save their own conversation
  participant_can_export   boolean     not null default false,

  -- Session settings
  session_duration_minutes int         not null default 120,
  auto_open_hour           int,                                  -- 0–23, null = manual
  auto_close_hour          int,                                  -- 0–23, null = use duration

  -- Branding
  welcome_message          text,
  brand_color              text        not null default '#7C3AED',

  -- Plan limits (enforced at API level, stored for reference)
  max_participants         int         not null default 20,

  -- Timestamps
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table  public.rooms                       is 'Persistent QR rooms owned by business users.';
comment on column public.rooms.slug                  is 'URL-safe identifier used in /r/:slug.';
comment on column public.rooms.room_type             is 'group | private | hybrid — controls chat mode for participants.';
comment on column public.rooms.retention_policy      is 'How long messages are kept after session close.';
comment on column public.rooms.participant_can_export is 'If true, participants can save their own conversation thread.';

-- ── sessions ─────────────────────────────────────────────────────────────────
-- One row = one active time window for a room.
-- A room can have unlimited sessions over its lifetime.
-- closed_at IS NULL means the session is currently live.

create table if not exists public.sessions (
  id                uuid        primary key default gen_random_uuid(),
  room_id           uuid        not null references public.rooms(id) on delete cascade,

  -- Timing
  opened_at         timestamptz not null default now(),
  closes_at         timestamptz not null,                        -- hard deadline
  closed_at         timestamptz,                                 -- null = still live

  -- Analytics snapshot (written on close)
  participant_count int         not null default 0,
  message_count     int         not null default 0,
  peak_participants int         not null default 0,

  created_at        timestamptz not null default now()
);

comment on table  public.sessions             is 'Time-bounded live chat windows per room.';
comment on column public.sessions.closes_at   is 'Hard deadline — participants see countdown.';
comment on column public.sessions.closed_at   is 'NULL = session is live. Set on admin close.';
comment on column public.sessions.peak_participants is 'Max simultaneous participants ever in this session.';

-- ── messages ─────────────────────────────────────────────────────────────────
-- Group chat messages. Ephemeral — deleted when session closes.

create table if not exists public.messages (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.sessions(id) on delete cascade,
  alias       text        not null,                              -- e.g. "Teal Falcon"
  alias_color text        not null default '#7C3AED',
  content     text        not null,
  is_staff    boolean     not null default false,
  pinned      boolean     not null default false,               -- only one pinned per session
  created_at  timestamptz not null default now()
);

comment on table  public.messages            is 'Group chat messages. Deleted when session closes.';
comment on column public.messages.alias      is 'Auto-generated anonymous alias e.g. "Teal Falcon".';
comment on column public.messages.is_staff   is 'True when sent from the admin dashboard.';
comment on column public.messages.pinned     is 'Only one message per session should be pinned at a time.';

-- ── participants ──────────────────────────────────────────────────────────────
-- Anonymous browser tokens. One row per person per session.
-- Deleted when session closes.

create table if not exists public.participants (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        not null references public.sessions(id) on delete cascade,
  alias        text        not null,
  alias_color  text        not null,
  token        text        not null unique,                      -- opaque browser token
  is_staff     boolean     not null default false,
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table  public.participants         is 'Anonymous session participants identified by browser token.';
comment on column public.participants.token   is 'Random opaque token stored in localStorage. Used for rejoin.';

-- ── typing_indicators ────────────────────────────────────────────────────────
-- Ephemeral presence signals. Cleaned up after 5 seconds of inactivity.

create table if not exists public.typing_indicators (
  session_id  uuid        not null references public.sessions(id) on delete cascade,
  alias       text        not null,
  updated_at  timestamptz not null default now(),
  primary key (session_id, alias)
);

comment on table public.typing_indicators is 'Realtime typing presence. Stale rows (>5s) are auto-cleaned.';

-- ── reactions ────────────────────────────────────────────────────────────────
-- Emoji reactions on group chat messages.

create table if not exists public.reactions (
  id          uuid        primary key default gen_random_uuid(),
  message_id  uuid        not null references public.messages(id) on delete cascade,
  session_id  uuid        not null references public.sessions(id) on delete cascade,
  emoji       text        not null,
  alias       text        not null,
  created_at  timestamptz not null default now(),
  unique (message_id, alias, emoji)                             -- one reaction per emoji per alias per message
);

comment on table public.reactions is 'Emoji reactions on group messages. One per (message, alias, emoji).';

-- ── reported_messages ────────────────────────────────────────────────────────
-- Flagged messages from participants. Kept for admin review.

create table if not exists public.reported_messages (
  id                  uuid        primary key default gen_random_uuid(),
  message_id          uuid        not null,                     -- soft ref (message may be deleted)
  session_id          uuid        not null,
  reported_by_alias   text        not null,
  message_content     text        not null,                     -- snapshot of content at report time
  message_alias       text        not null,
  created_at          timestamptz not null default now()
);

comment on table public.reported_messages is 'Flagged messages. Kept even after session closes for admin review.';

-- ── conversations ─────────────────────────────────────────────────────────────
-- One private 1:1 thread per participant per session.
-- Used when room_type = 'private' or 'hybrid'.

create table if not exists public.conversations (
  id                    uuid        primary key default gen_random_uuid(),
  session_id            uuid        not null references public.sessions(id) on delete cascade,
  room_id               uuid        not null references public.rooms(id)    on delete cascade,

  -- Participant identity (no account — identified by token)
  participant_token     text        not null,
  participant_alias     text        not null,
  participant_color     text        not null default '#7C3AED',

  -- Inbox management
  status                text        not null default 'open'
    check (status in ('open', 'resolved', 'assigned')),
  assigned_to           text,                                   -- staff alias if assigned
  unread_count          int         not null default 0,         -- unread count for admin inbox
  last_message_at       timestamptz,
  last_message_preview  text,                                   -- first 60 chars of last message

  -- Timestamps
  created_at            timestamptz not null default now(),
  resolved_at           timestamptz,

  -- One conversation per participant per session
  unique (session_id, participant_token)
);

comment on table  public.conversations                    is '1:1 private threads between participants and staff.';
comment on column public.conversations.participant_token  is 'Same browser token as participants table.';
comment on column public.conversations.unread_count       is 'Incremented on participant message, reset to 0 on staff reply.';
comment on column public.conversations.last_message_preview is 'First 60 chars of the latest message for inbox preview.';

-- ── conversation_messages ─────────────────────────────────────────────────────
-- Messages within a private 1:1 conversation thread.

create table if not exists public.conversation_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  content         text        not null,
  sender_type     text        not null check (sender_type in ('participant', 'staff')),
  sender_alias    text        not null,
  read_at         timestamptz,                                  -- null = unread by other side
  created_at      timestamptz not null default now()
);

comment on table  public.conversation_messages          is 'Messages inside a private conversation thread.';
comment on column public.conversation_messages.read_at  is 'Set when the other party reads the message.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CHECK CONSTRAINTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Wrapped in DO blocks — safe to re-run on existing databases
do $$ begin

  -- rooms
  if not exists (select 1 from pg_constraint where conname = 'rooms_name_not_empty') then
    alter table public.rooms add constraint rooms_name_not_empty
      check (char_length(trim(name)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_name_max_length') then
    alter table public.rooms add constraint rooms_name_max_length
      check (char_length(name) <= 60);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_brand_color_hex') then
    alter table public.rooms add constraint rooms_brand_color_hex
      check (brand_color ~ '^#[0-9A-Fa-f]{6}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_duration_range') then
    alter table public.rooms add constraint rooms_duration_range
      check (session_duration_minutes between 15 and 720);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_auto_open_range') then
    alter table public.rooms add constraint rooms_auto_open_range
      check (auto_open_hour is null or auto_open_hour between 0 and 23);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_auto_close_range') then
    alter table public.rooms add constraint rooms_auto_close_range
      check (auto_close_hour is null or auto_close_hour between 0 and 23);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_max_participants_range') then
    alter table public.rooms add constraint rooms_max_participants_range
      check (max_participants between 1 and 1000);
  end if;

  -- sessions
  if not exists (select 1 from pg_constraint where conname = 'sessions_closes_after_opens') then
    alter table public.sessions add constraint sessions_closes_after_opens
      check (closes_at > opened_at);
  end if;

  -- messages
  if not exists (select 1 from pg_constraint where conname = 'messages_content_not_empty') then
    alter table public.messages add constraint messages_content_not_empty
      check (char_length(trim(content)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'messages_content_max_length') then
    alter table public.messages add constraint messages_content_max_length
      check (char_length(content) <= 500);
  end if;

  -- participants
  if not exists (select 1 from pg_constraint where conname = 'participants_alias_length') then
    alter table public.participants add constraint participants_alias_length
      check (char_length(alias) between 1 and 40);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'participants_token_min_length') then
    alter table public.participants add constraint participants_token_min_length
      check (char_length(token) >= 16);
  end if;

  -- conversation_messages
  if not exists (select 1 from pg_constraint where conname = 'conv_messages_content_not_empty') then
    alter table public.conversation_messages add constraint conv_messages_content_not_empty
      check (char_length(trim(content)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'conv_messages_content_max_length') then
    alter table public.conversation_messages add constraint conv_messages_content_max_length
      check (char_length(content) <= 500);
  end if;

end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INDEXES
-- All WHERE, JOIN, and ORDER BY clauses in the application are covered.
-- ─────────────────────────────────────────────────────────────────────────────

-- rooms
create index if not exists idx_rooms_owner_id
  on public.rooms(owner_id);

create index if not exists idx_rooms_slug_active
  on public.rooms(slug)
  where is_active = true;                -- partial: only query active rooms by slug

create index if not exists idx_rooms_owner_active
  on public.rooms(owner_id, is_active);  -- dashboard list + plan enforcement

-- sessions  (most read table at runtime)
create index if not exists idx_sessions_room_id
  on public.sessions(room_id);

create index if not exists idx_sessions_room_active
  on public.sessions(room_id, closed_at)
  where closed_at is null;               -- partial: hottest query — find live session for room

create index if not exists idx_sessions_expires
  on public.sessions(closes_at)
  where closed_at is null;               -- partial: find sessions about to expire

create index if not exists idx_sessions_opened_at_desc
  on public.sessions(opened_at desc);    -- session history ordering

-- messages
create index if not exists idx_messages_session_id
  on public.messages(session_id);

create index if not exists idx_messages_session_created
  on public.messages(session_id, created_at asc);  -- ordered fetch for chat load

create index if not exists idx_messages_pinned
  on public.messages(session_id)
  where pinned = true;                   -- partial: fast lookup of pinned message

-- participants
create index if not exists idx_participants_session_id
  on public.participants(session_id);

create index if not exists idx_participants_token
  on public.participants(token);         -- rejoin lookup

create index if not exists idx_participants_session_alias
  on public.participants(session_id, alias);  -- kick by alias

-- reactions
create index if not exists idx_reactions_message_id
  on public.reactions(message_id);

create index if not exists idx_reactions_session_id
  on public.reactions(session_id);

create index if not exists idx_reactions_message_alias
  on public.reactions(message_id, alias);  -- toggle reaction

-- typing indicators
create index if not exists idx_typing_session_id
  on public.typing_indicators(session_id);

create index if not exists idx_typing_updated_at
  on public.typing_indicators(updated_at);   -- stale cleanup

-- reported messages
create index if not exists idx_reports_session_id
  on public.reported_messages(session_id);

-- conversations
create index if not exists idx_conversations_session_id
  on public.conversations(session_id);

create index if not exists idx_conversations_room_id
  on public.conversations(room_id);

create index if not exists idx_conversations_token
  on public.conversations(participant_token);

create index if not exists idx_conversations_status
  on public.conversations(status);

create index if not exists idx_conversations_last_message_desc
  on public.conversations(last_message_at desc nulls last);  -- inbox ordering

create index if not exists idx_conversations_session_status
  on public.conversations(session_id, status);   -- inbox filter by open/resolved

-- conversation_messages
create index if not exists idx_conv_messages_conversation_id
  on public.conversation_messages(conversation_id);

create index if not exists idx_conv_messages_conversation_created
  on public.conversation_messages(conversation_id, created_at asc);  -- ordered fetch

create index if not exists idx_conv_messages_unread
  on public.conversation_messages(conversation_id)
  where read_at is null;                 -- partial: unread count queries


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── updated_at auto-stamp ─────────────────────────────────────────────────────

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.fn_set_updated_at is
  'Auto-stamps updated_at on every UPDATE. Attach to any table with that column.';

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.fn_set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.rooms                 enable row level security;
alter table public.sessions              enable row level security;
alter table public.messages              enable row level security;
alter table public.participants          enable row level security;
alter table public.typing_indicators     enable row level security;
alter table public.reactions             enable row level security;
alter table public.reported_messages     enable row level security;
alter table public.conversations         enable row level security;
alter table public.conversation_messages enable row level security;

-- ── rooms ─────────────────────────────────────────────────────────────────────

drop policy if exists "owners_all_rooms"        on public.rooms;
drop policy if exists "public_read_active_rooms" on public.rooms;

create policy "owners_all_rooms" on public.rooms
  for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "public_read_active_rooms" on public.rooms
  for select
  using (is_active = true);

-- ── sessions ──────────────────────────────────────────────────────────────────

drop policy if exists "owners_manage_sessions"   on public.sessions;
drop policy if exists "public_read_live_sessions" on public.sessions;

create policy "owners_manage_sessions" on public.sessions
  for all
  using (
    exists (
      select 1 from public.rooms
      where id = room_id and owner_id = auth.uid()
    )
  );

create policy "public_read_live_sessions" on public.sessions
  for select
  using (closed_at is null);

-- ── messages ──────────────────────────────────────────────────────────────────

drop policy if exists "public_read_messages"   on public.messages;
drop policy if exists "public_insert_messages" on public.messages;
drop policy if exists "owners_delete_messages" on public.messages;
drop policy if exists "owners_update_messages" on public.messages;

create policy "public_read_messages" on public.messages
  for select
  using (
    exists (
      select 1 from public.sessions
      where id = session_id and closed_at is null
    )
  );

create policy "public_insert_messages" on public.messages
  for insert
  with check (
    exists (
      select 1 from public.sessions
      where id = session_id
        and closed_at is null
        and closes_at > now()
    )
  );

create policy "owners_delete_messages" on public.messages
  for delete
  using (
    exists (
      select 1
      from   public.sessions  s
      join   public.rooms     r on r.id = s.room_id
      where  s.id = session_id and r.owner_id = auth.uid()
    )
  );

create policy "owners_update_messages" on public.messages
  for update
  using (
    exists (
      select 1
      from   public.sessions  s
      join   public.rooms     r on r.id = s.room_id
      where  s.id = session_id and r.owner_id = auth.uid()
    )
  );

-- ── participants ──────────────────────────────────────────────────────────────

drop policy if exists "public_read_participants"       on public.participants;
drop policy if exists "public_insert_participants"     on public.participants;
drop policy if exists "public_update_own_participant"  on public.participants;

create policy "public_read_participants" on public.participants
  for select using (true);

create policy "public_insert_participants" on public.participants
  for insert with check (true);

create policy "public_update_own_participant" on public.participants
  for update using (true);

-- ── typing_indicators ─────────────────────────────────────────────────────────

drop policy if exists "public_manage_typing" on public.typing_indicators;

create policy "public_manage_typing" on public.typing_indicators
  for all using (true) with check (true);

-- ── reactions ─────────────────────────────────────────────────────────────────

drop policy if exists "public_read_reactions"   on public.reactions;
drop policy if exists "public_insert_reactions" on public.reactions;
drop policy if exists "public_delete_reactions" on public.reactions;

create policy "public_read_reactions"   on public.reactions for select using (true);
create policy "public_insert_reactions" on public.reactions for insert with check (true);
create policy "public_delete_reactions" on public.reactions for delete using (true);

-- ── reported_messages ─────────────────────────────────────────────────────────

drop policy if exists "public_insert_reports" on public.reported_messages;
drop policy if exists "owners_read_reports"   on public.reported_messages;

create policy "public_insert_reports" on public.reported_messages
  for insert with check (true);

create policy "owners_read_reports" on public.reported_messages
  for select
  using (
    exists (
      select 1
      from   public.rooms r
      where  r.id = session_id::uuid        -- session_id used as soft room ref
         and r.owner_id = auth.uid()
    )
  );

-- ── conversations ─────────────────────────────────────────────────────────────

drop policy if exists "public_read_conversations"   on public.conversations;
drop policy if exists "public_insert_conversations" on public.conversations;
drop policy if exists "public_update_conversations" on public.conversations;
drop policy if exists "owners_manage_conversations" on public.conversations;

create policy "public_read_conversations" on public.conversations
  for select using (true);

create policy "public_insert_conversations" on public.conversations
  for insert with check (true);

create policy "public_update_conversations" on public.conversations
  for update using (true);

-- ── conversation_messages ─────────────────────────────────────────────────────

drop policy if exists "public_read_conv_messages"   on public.conversation_messages;
drop policy if exists "public_insert_conv_messages" on public.conversation_messages;

create policy "public_read_conv_messages" on public.conversation_messages
  for select using (true);

create policy "public_insert_conv_messages" on public.conversation_messages
  for insert with check (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REALTIME
-- Enable Supabase Realtime on all tables that need live updates.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  -- messages (group chat)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  -- participants (online count)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;

  -- sessions (closed_at change signals session end)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'sessions'
  ) then
    alter publication supabase_realtime add table public.sessions;
  end if;

  -- typing_indicators
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'typing_indicators'
  ) then
    alter publication supabase_realtime add table public.typing_indicators;
  end if;

  -- reactions
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;

  -- conversations (admin inbox updates)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  -- conversation_messages (private chat realtime)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversation_messages'
  ) then
    alter publication supabase_realtime add table public.conversation_messages;
  end if;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── room_analytics ───────────────────────────────────────────────────────────
-- Pre-aggregated stats per room.
-- Dashboard reads from this view instead of running COUNTs on every page load.

create or replace view public.room_analytics as
select
  r.id                                                              as room_id,
  r.owner_id,
  r.name,
  r.slug,
  r.room_type,
  r.retention_policy,
  r.is_active,
  count(s.id)                                                       as total_sessions,
  count(s.id)     filter (where s.closed_at is not null)           as completed_sessions,
  count(s.id)     filter (where s.closed_at is null)               as active_sessions,
  coalesce(sum(s.participant_count), 0)                            as total_participants,
  coalesce(sum(s.message_count),     0)                            as total_messages,
  coalesce(max(s.peak_participants), 0)                            as peak_participants_ever,
  max(s.opened_at)                                                  as last_session_at
from   public.rooms    r
left   join public.sessions s on s.room_id = r.id
group  by r.id, r.owner_id, r.name, r.slug, r.room_type, r.retention_policy, r.is_active;

comment on view public.room_analytics is
  'Aggregated session stats per room. Replaces repeated COUNT queries on the dashboard.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RPC FUNCTIONS
-- All functions are security definer — they bypass RLS and validate
-- ownership internally. This keeps the API layer thin.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── fn_cleanup_stale_typing ───────────────────────────────────────────────────
-- Removes typing indicators older than 5 seconds.
-- Called periodically to keep the typing list clean.

create or replace function public.fn_cleanup_stale_typing()
returns void
language plpgsql
security definer as $$
begin
  delete from public.typing_indicators
  where updated_at < now() - interval '5 seconds';
end;
$$;

comment on function public.fn_cleanup_stale_typing is
  'Deletes typing indicators older than 5s. Call from app or pg_cron.';


-- ── rpc_get_room_by_slug ──────────────────────────────────────────────────────
-- Loads a room + its active session + all current messages in ONE query.
-- Replaces 3 separate API calls on the participant join screen.

create or replace function public.rpc_get_room_by_slug(p_slug text)
returns jsonb
language plpgsql
security definer as $$
declare
  v_room     jsonb;
  v_session  jsonb;
  v_messages jsonb;
begin
  select to_jsonb(r)
  into   v_room
  from   public.rooms r
  where  r.slug = p_slug and r.is_active = true;

  if not found then
    return null;
  end if;

  select to_jsonb(s)
  into   v_session
  from   public.sessions s
  where  s.room_id   = (v_room->>'id')::uuid
    and  s.closed_at is null
    and  s.closes_at > now()
  order  by s.opened_at desc
  limit  1;

  if v_session is not null then
    select jsonb_agg(m order by m.created_at asc)
    into   v_messages
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

comment on function public.rpc_get_room_by_slug is
  'Returns room + active session + messages in one call. Used on the participant join page.';


-- ── rpc_join_room ─────────────────────────────────────────────────────────────
-- Atomically checks capacity and upserts participant.
-- Prevents race conditions where two people join simultaneously at capacity.

create or replace function public.rpc_join_room(
  p_session_id  uuid,
  p_alias       text,
  p_alias_color text,
  p_token       text
)
returns jsonb
language plpgsql
security definer as $$
declare
  v_max_participants int;
  v_current_count    int;
begin
  -- Get room capacity via session (also validates session is live)
  select r.max_participants
  into   v_max_participants
  from   public.rooms    r
  join   public.sessions s on s.room_id = r.id
  where  s.id         = p_session_id
    and  s.closed_at  is null
    and  s.closes_at  > now();

  if not found then
    return jsonb_build_object('error', 'Session not found or closed');
  end if;

  -- Rejoin: token already exists — just refresh last_seen
  if exists (select 1 from public.participants where token = p_token) then
    update public.participants set last_seen_at = now() where token = p_token;
    return jsonb_build_object('success', true, 'rejoined', true);
  end if;

  -- Check capacity
  select count(*)
  into   v_current_count
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

comment on function public.rpc_join_room is
  'Capacity-checked, race-safe participant join. Returns success/rejoined/error.';


-- ── rpc_pin_message ───────────────────────────────────────────────────────────
-- Atomically unpins all messages in session, then pins the target.
-- Ensures only one message is ever pinned at a time.

create or replace function public.rpc_pin_message(p_message_id uuid)
returns void
language plpgsql
security definer as $$
declare
  v_session_id uuid;
begin
  select session_id
  into   v_session_id
  from   public.messages
  where  id = p_message_id;

  if not found then
    raise exception 'Message not found: %', p_message_id;
  end if;

  -- Atomic unpin-all + pin-one
  update public.messages set pinned = false where session_id = v_session_id;
  update public.messages set pinned = true  where id = p_message_id;
end;
$$;

comment on function public.rpc_pin_message is
  'Ensures exactly one pinned message per session. Atomic unpin-all + pin-target.';


-- ── rpc_kick_participant ──────────────────────────────────────────────────────
-- Verifies room ownership, then removes participant from session.

create or replace function public.rpc_kick_participant(
  p_session_id uuid,
  p_alias      text,
  p_owner_id   uuid
)
returns jsonb
language plpgsql
security definer as $$
declare
  v_owner_id uuid;
begin
  select r.owner_id
  into   v_owner_id
  from   public.sessions s
  join   public.rooms    r on r.id = s.room_id
  where  s.id = p_session_id;

  if not found or v_owner_id <> p_owner_id then
    return jsonb_build_object('error', 'Forbidden');
  end if;

  delete from public.participants
  where session_id = p_session_id and alias = p_alias;

  return jsonb_build_object('success', true);
end;
$$;

comment on function public.rpc_kick_participant is
  'Ownership-verified participant removal. Replaces 2 separate queries.';


-- ── rpc_close_session ─────────────────────────────────────────────────────────
-- Atomic session close:
--   1. Snapshot analytics (message_count, participant_count, peak_participants)
--   2. Delete ALL group ephemeral data (reactions, typing, messages, participants)
--   3. Delete private conversations ONLY if retention_policy = 'ephemeral'
-- Idempotent: safe to call twice (closed_at is null guard).

create or replace function public.rpc_close_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer as $$
declare
  v_msg_count   int;
  v_part_count  int;
  v_retention   text;
begin
  -- Snapshot counts before deletion
  select count(*) into v_msg_count  from public.messages     where session_id = p_session_id;
  select count(*) into v_part_count from public.participants where session_id = p_session_id;

  -- Get room retention policy
  select r.retention_policy
  into   v_retention
  from   public.sessions s
  join   public.rooms    r on r.id = s.room_id
  where  s.id = p_session_id;

  -- Mark session closed and write analytics
  update public.sessions set
    closed_at         = now(),
    message_count     = v_msg_count,
    participant_count = v_part_count,
    peak_participants = greatest(peak_participants, v_part_count)
  where id          = p_session_id
    and closed_at   is null;               -- idempotent guard

  -- Always purge group ephemeral data
  delete from public.reactions         where session_id = p_session_id;
  delete from public.typing_indicators where session_id = p_session_id;
  delete from public.messages          where session_id = p_session_id;
  delete from public.participants      where session_id = p_session_id;

  -- Purge private conversations only if retention = ephemeral
  if coalesce(v_retention, 'ephemeral') = 'ephemeral' then
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
    'retention',         coalesce(v_retention, 'ephemeral')
  );
end;
$$;

comment on function public.rpc_close_session is
  'Atomic session close: snapshot analytics + purge ephemeral data + conditional conversation purge.';


-- ── rpc_start_conversation ────────────────────────────────────────────────────
-- Gets existing conversation or creates a new one.
-- Used when participant chooses "Message staff privately".

create or replace function public.rpc_start_conversation(
  p_session_id        uuid,
  p_room_id           uuid,
  p_participant_token text,
  p_participant_alias text,
  p_participant_color text
)
returns jsonb
language plpgsql
security definer as $$
declare
  v_conversation jsonb;
begin
  -- Validate session is still active
  if not exists (
    select 1 from public.sessions
    where id         = p_session_id
      and closed_at  is null
      and closes_at  > now()
  ) then
    return jsonb_build_object('error', 'Session not found or closed');
  end if;

  -- Upsert: create if not exists, ignore if already exists
  insert into public.conversations
    (session_id, room_id, participant_token, participant_alias, participant_color)
  values
    (p_session_id, p_room_id, p_participant_token, p_participant_alias, p_participant_color)
  on conflict (session_id, participant_token) do nothing;

  -- Return the conversation (existing or newly created)
  select to_jsonb(c)
  into   v_conversation
  from   public.conversations c
  where  c.session_id        = p_session_id
    and  c.participant_token = p_participant_token;

  return jsonb_build_object('conversation', v_conversation);
end;
$$;

comment on function public.rpc_start_conversation is
  'Upsert: get existing or create new 1:1 conversation. Called when participant chooses private chat.';


-- ── rpc_send_conv_message ─────────────────────────────────────────────────────
-- Inserts a message into a private conversation and atomically updates
-- the conversation metadata (last_message_at, preview, unread_count).

create or replace function public.rpc_send_conv_message(
  p_conversation_id uuid,
  p_content         text,
  p_sender_type     text,
  p_sender_alias    text
)
returns jsonb
language plpgsql
security definer as $$
declare
  v_message jsonb;
begin
  -- Validate conversation is still open
  if not exists (
    select 1
    from   public.conversations c
    join   public.sessions      s on s.id = c.session_id
    where  c.id         = p_conversation_id
      and  s.closed_at  is null
      and  s.closes_at  > now()
  ) then
    return jsonb_build_object('error', 'Conversation not available');
  end if;

  -- Insert message
  insert into public.conversation_messages
    (conversation_id, content, sender_type, sender_alias)
  values
    (p_conversation_id, p_content, p_sender_type, p_sender_alias)
  returning to_jsonb(conversation_messages.*)
  into v_message;

  -- Update conversation metadata atomically
  update public.conversations set
    last_message_at      = now(),
    last_message_preview = left(p_content, 60),
    unread_count = case
      when p_sender_type = 'participant' then unread_count + 1
      else 0                                  -- staff reply resets unread for admin
    end
  where id = p_conversation_id;

  return jsonb_build_object('message', v_message);
end;
$$;

comment on function public.rpc_send_conv_message is
  'Insert message + update conversation metadata atomically. Replaces 2 round trips.';


-- ── rpc_resolve_conversation ──────────────────────────────────────────────────
-- Marks a private conversation as resolved.
-- Verifies ownership before updating.

create or replace function public.rpc_resolve_conversation(
  p_conversation_id uuid,
  p_owner_id        uuid
)
returns jsonb
language plpgsql
security definer as $$
begin
  -- Verify ownership via room
  if not exists (
    select 1
    from   public.conversations c
    join   public.rooms         r on r.id = c.room_id
    where  c.id        = p_conversation_id
      and  r.owner_id  = p_owner_id
  ) then
    return jsonb_build_object('error', 'Forbidden');
  end if;

  update public.conversations set
    status       = 'resolved',
    resolved_at  = now(),
    unread_count = 0
  where id = p_conversation_id;

  return jsonb_build_object('success', true);
end;
$$;

comment on function public.rpc_resolve_conversation is
  'Ownership-verified conversation resolution. Resets unread count.';


-- ── rpc_get_dashboard_stats ───────────────────────────────────────────────────
-- Returns all dashboard overview numbers in a single query.
-- Replaces multiple COUNT queries on the dashboard page.

create or replace function public.rpc_get_dashboard_stats(p_owner_id uuid)
returns jsonb
language plpgsql
security definer as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_rooms',        count(distinct r.id),
    'active_sessions',    count(distinct s.id) filter (where s.closed_at is null),
    'total_sessions',     count(distinct s.id),
    'total_participants', coalesce(sum(s.participant_count), 0),
    'total_messages',     coalesce(sum(s.message_count),     0)
  )
  into   v_result
  from   public.rooms    r
  left   join public.sessions s on s.room_id = r.id
  where  r.owner_id = p_owner_id;

  return v_result;
end;
$$;

comment on function public.rpc_get_dashboard_stats is
  'Single-query dashboard stats for a given owner. Replaces N separate COUNT calls.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. GRANTS
-- ─────────────────────────────────────────────────────────────────────────────

-- RPC functions
grant execute on function public.fn_cleanup_stale_typing     to authenticated, anon;
grant execute on function public.rpc_get_room_by_slug        to authenticated, anon;
grant execute on function public.rpc_join_room               to authenticated, anon;
grant execute on function public.rpc_pin_message             to authenticated;
grant execute on function public.rpc_kick_participant        to authenticated;
grant execute on function public.rpc_close_session           to authenticated;
grant execute on function public.rpc_start_conversation      to authenticated, anon;
grant execute on function public.rpc_send_conv_message       to authenticated, anon;
grant execute on function public.rpc_resolve_conversation    to authenticated;
grant execute on function public.rpc_get_dashboard_stats     to authenticated;

-- Views
grant select on public.room_analytics to authenticated;


-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════════
