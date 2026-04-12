-- ─── FlashRoom Core Tables ────────────────────────────────────────

-- Rooms: each admin creates rooms (persistent QR)
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,          -- used in QR URL e.g. /r/sunset-table-4
  description text,
  is_active boolean default true,
  -- Session scheduling
  session_duration_minutes int default 120,
  auto_open_hour int,                 -- 0-23, null = manual
  auto_close_hour int,
  -- Branding
  welcome_message text,
  brand_color text default '#7C3AED',
  -- Plan limits enforced at API level
  max_participants int default 20,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions: ephemeral chat windows per room
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  opened_at timestamptz default now(),
  closes_at timestamptz not null,
  closed_at timestamptz,              -- null = still active
  participant_count int default 0,
  created_at timestamptz default now()
);

-- Messages: ephemeral, deleted when session closes
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  alias text not null,                -- e.g. "Teal Falcon"
  alias_color text default '#7C3AED',
  content text not null,
  is_staff boolean default false,
  created_at timestamptz default now()
);

-- Participants: anonymous session tokens
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  alias text not null,
  alias_color text not null,
  token text not null unique,         -- browser token for identity
  is_staff boolean default false,
  joined_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- ─── RLS Policies ─────────────────────────────────────────────────

alter table public.rooms enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.participants enable row level security;

-- Rooms: owners can do everything
create policy "Owners manage their rooms" on public.rooms
  for all using (auth.uid() = owner_id);

-- Rooms: public can read active rooms by slug (for join flow)
create policy "Public read active rooms" on public.rooms
  for select using (is_active = true);

-- Sessions: room owners can manage
create policy "Owners manage sessions" on public.sessions
  for all using (
    exists (select 1 from public.rooms where id = room_id and owner_id = auth.uid())
  );

-- Sessions: public can read active sessions
create policy "Public read active sessions" on public.sessions
  for select using (closed_at is null);

-- Messages: anyone can read messages in active sessions
create policy "Public read messages" on public.messages
  for select using (
    exists (select 1 from public.sessions where id = session_id and closed_at is null)
  );

-- Messages: anyone can insert into active sessions
create policy "Public insert messages" on public.messages
  for insert with check (
    exists (select 1 from public.sessions where id = session_id and closed_at is null)
  );

-- Participants: public can read and insert
create policy "Public read participants" on public.participants
  for select using (true);

create policy "Public insert participants" on public.participants
  for insert with check (true);

create policy "Public update own participant" on public.participants
  for update using (true);

-- ─── Realtime ─────────────────────────────────────────────────────
-- Enable realtime on messages and participants
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.participants;

-- ─── Helper function: close session & purge messages ──────────────
create or replace function close_session(p_session_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from public.messages where session_id = p_session_id;
  delete from public.participants where session_id = p_session_id;
  update public.sessions set closed_at = now() where id = p_session_id;
end;
$$;

-- ─── New Feature Tables ───────────────────────────────────────────

-- Typing indicators (ephemeral, cleared with session)
create table public.typing_indicators (
  session_id uuid not null references public.sessions(id) on delete cascade,
  alias text not null,
  updated_at timestamptz default now(),
  primary key (session_id, alias)
);
alter table public.typing_indicators enable row level security;
create policy "Public manage typing" on public.typing_indicators for all using (true) with check (true);
alter publication supabase_realtime add table public.typing_indicators;

-- Emoji reactions on messages
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  emoji text not null,
  alias text not null,
  created_at timestamptz default now(),
  unique(message_id, alias, emoji)
);
alter table public.reactions enable row level security;
create policy "Public read reactions" on public.reactions for select using (true);
create policy "Public insert reactions" on public.reactions for insert with check (true);
create policy "Public delete reactions" on public.reactions for delete using (true);
alter publication supabase_realtime add table public.reactions;

-- Reported messages
create table public.reported_messages (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  session_id uuid not null,
  reported_by_alias text not null,
  message_content text not null,
  message_alias text not null,
  created_at timestamptz default now()
);
alter table public.reported_messages enable row level security;
create policy "Public insert reports" on public.reported_messages for insert with check (true);
create policy "Owners read reports" on public.reported_messages for select using (true);

-- Room analytics snapshots (updated when sessions close)
alter table public.sessions
  add column if not exists message_count int default 0,
  add column if not exists peak_participants int default 0;
