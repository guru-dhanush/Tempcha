# Tempcha — Product Documentation

> **QR-native temporary chat for businesses.**  
> Scan a QR code. Chat anonymously. Everything deletes itself when the session ends.

---

## Table of Contents

1. [What is Tempcha?](#1-what-is-tempcha)
2. [Core Concepts](#2-core-concepts)
3. [How It Works](#3-how-it-works)
4. [Use Cases](#4-use-cases)
5. [Chat Modes](#5-chat-modes)
6. [Message Retention](#6-message-retention)
7. [Architecture](#7-architecture)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [RPC Functions](#10-rpc-functions)
11. [Realtime Events](#11-realtime-events)
12. [Security & Privacy](#12-security--privacy)
13. [Pricing & Plan Limits](#13-pricing--plan-limits)
14. [Roadmap](#14-roadmap)

---

## 1. What is Tempcha?

Tempcha is a **QR-code-native temporary chat platform** built for businesses.

A business creates a room, gets a permanent QR code, and prints or displays it anywhere. When someone scans the code, they instantly join a live chat session — no app to download, no account to create, no phone number needed. When the session ends, every message is permanently deleted.

### The core difference from every other chat tool

| Tool | What QR does |
|---|---|
| WhatsApp | Links a device — still needs phone number |
| Telegram | Joins a group — still needs an account |
| Discord | Joins a server — still needs an account |
| WeChat | Joins a group — QR expires after 7 days |
| **Tempcha** | Opens a complete anonymous chat session — **no account, no number, QR never expires** |

---

## 2. Core Concepts

### Room
A **Room** is a permanent configuration with a permanent QR code. The QR code never changes. Rooms are created and owned by a business admin.

Each room has:
- A name and slug (`/r/your-room-name`)
- A chat mode (group, private, or hybrid)
- A retention policy (how long messages are kept)
- A brand colour
- A max participant limit
- Optional session scheduling (auto-open / auto-close)

### Session
A **Session** is one active time window inside a Room. When the admin opens a session, participants can scan the QR and join. When the session closes, ephemeral data is deleted.

The same QR code can run unlimited sessions over its lifetime. Every session starts fresh.

```
Room (permanent, has QR)
  └── Session 1  →  messages, participants  →  deleted on close
  └── Session 2  →  messages, participants  →  deleted on close
  └── Session N  →  ...
```

### Participant
A **Participant** is anyone who scans the QR and joins a session. They are identified by:
- An auto-generated anonymous alias (e.g. "Teal Falcon")
- A random browser token stored in localStorage
- No account, no email, no phone number

### Conversation
A **Conversation** is a private 1:1 thread between one participant and the admin. Used in Private and Hybrid rooms. Separate from the group chat.

---

## 3. How It Works

### Admin flow

```
1. Sign up → create a Room
2. Set chat mode + retention policy
3. Download the QR code → print or display it
4. Open a session when ready ("Go live")
5. Watch the admin dashboard — group chat + private inbox
6. Reply as Staff to individuals or the whole group
7. Close the session → messages deleted (based on retention)
8. QR is ready for the next session
```

### Participant flow

```
1. See the QR code displayed at a venue / event / screen
2. Open phone camera → scan
3. Browser opens /r/[slug] — no app, no install
4. Choose: Group Chat or Message Staff (if Hybrid room)
5. Type an alias or use the auto-generated one
6. Chat in real time
7. Session closes → screen shows "Session ended"
8. All messages gone — no trace
```

---

## 4. Use Cases

Tempcha is built for **businesses that communicate with anonymous visitors in physical spaces**. Not restaurants specifically — the wider opportunity is:

### Events & Conferences
A conference puts a QR on the main screen. Attendees scan and ask questions anonymously during the talk. No raised hands. No fear of judgment. Speakers answer from the admin dashboard. Session closes when the talk ends.

**Why Tempcha beats alternatives:** Slido requires an account. Mentimeter requires an account. Both are expensive. Tempcha costs $29/month and works for any event with any size audience.

### Hotels & Hospitality
A hotel places a QR in every room. Guests contact reception privately — no need to walk to the desk or call. Admin sees all threads in the unified inbox. When a guest checks out, the thread is gone.

**Why Tempcha beats alternatives:** WhatsApp Business requires sharing the hotel's phone number and keeps all messages permanently. Tempcha keeps nothing after checkout.

### Clinics & Healthcare Waiting Rooms
A clinic puts a QR in the waiting room. Patients ask questions without coming to the reception desk. No personal data collected. No records of who asked what.

**Why Tempcha beats alternatives:** Messaging tools for healthcare require HIPAA compliance, accounts, identity verification. Tempcha stores nothing — the compliance story is simple.

### Classrooms & Training
A teacher or trainer puts a QR on the projector. Students ask questions they'd never ask in front of the class. Anonymous feedback, live polls via group chat, private questions to the instructor.

**Why Tempcha beats alternatives:** Kahoot and Mentimeter are tools for polls, not real conversation. Tempcha is a full chat with private threads.

### Co-working Spaces & Offices
A meeting room has a QR on the wall. Anyone who walks in can spin up a chat for that meeting. When the meeting ends, the room closes. No leftover Slack channels.

### Pop-up Retail & Exhibitions
A brand at a trade show or pop-up puts a QR on the booth. Visitors scan and ask product questions privately. The team answers from one inbox. No WhatsApp groups with strangers.

---

## 5. Chat Modes

Set per room when creating. Controls what participants see when they join.

### Group (everyone sees)
All participants are in one shared chat room. Every message is visible to everyone in the session. The admin can reply as "Staff" and all participants see it.

**Best for:** Events, classrooms, town halls, team meetings, public Q&A.

### Private (1:1 only)
Each participant gets their own private thread with the admin. Nobody sees anyone else's messages. The admin sees all threads in the unified inbox and can reply to each individually.

**Best for:** Customer support, patient queries, private feedback, one-on-one service requests.

### Hybrid (participant chooses)
When a participant joins, they choose: join the group chat OR send a private message to staff. Both run simultaneously. Admin sees both the live group feed and the private inbox.

**Best for:** Events where most questions are public but some are sensitive. Venues that want both table-wide chat and individual service requests.

---

## 6. Message Retention

Set per room. Controls what happens to messages when a session closes.

| Policy | What happens | When to use |
|---|---|---|
| **Ephemeral** | Deleted immediately on session close | Default. Maximum privacy. No data liability. |
| **24 hours** | Deleted 24 hours after session closes | Admin needs time to review after an event |
| **7 days** | Deleted 7 days after session closes | Weekly recurring sessions — review before next one |
| **Permanent** | Never deleted | Long-term customer relationship, support history needed |

### Participant export
If enabled per room, participants can save a copy of their own conversation thread before the session ends. They own their copy. The admin controls whether this is allowed.

---

## 7. Architecture

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket, Postgres Changes) |
| Auth | Supabase Auth (email + Google OAuth) |
| Billing | Paddle (Merchant of Record — handles global VAT) |
| QR | react-qrcode-logo |

### Request flow — participant joins

```
Participant scans QR
  → Browser opens /r/[slug]
  → Next.js page calls rpc_get_room_by_slug(slug)
      → Returns room + active session + messages in ONE query
  → Client renders join screen
  → Participant clicks "Join"
  → POST /api/rooms/[id]/join
      → Calls rpc_join_room() — checks capacity, upserts participant
  → Client subscribes to Supabase Realtime channels:
      → messages (group chat)
      → participants (online count)
      → sessions (watch for session close)
      → typing_indicators
      → reactions
  → Participant is live
```

### Request flow — admin opens a session

```
Admin clicks "Go live"
  → POST /api/rooms/[id]/open-session
      → Closes any existing open sessions via rpc_close_session()
      → Creates new session with closes_at = now() + duration
  → Client subscribes to all Realtime channels for new session
  → Admin sees live dashboard
```

### Request flow — session closes

```
Admin clicks "End session"
  → POST /api/sessions/[id]/close
      → Calls rpc_close_session()
          → Snapshots analytics (message_count, participant_count, peak)
          → Deletes: reactions, typing_indicators, messages, participants
          → If retention = ephemeral: deletes conversations + conv_messages
          → Marks session closed_at = now()
  → Realtime pushes session UPDATE to all clients
  → All participants see "Session ended" screen
```

---

## 8. Database Schema

### Tables overview

```
auth.users (Supabase managed)
  └── rooms          (one per QR code, owned by a user)
       └── sessions  (one per live window, N per room)
            ├── messages          (group chat, ephemeral)
            ├── participants      (anonymous tokens, ephemeral)
            ├── typing_indicators (presence, auto-cleaned)
            ├── reactions         (emoji on messages)
            └── conversations     (private 1:1 threads)
                 └── conversation_messages

reported_messages (soft ref to messages, kept for moderation)
```

### rooms

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `owner_id` | uuid FK → auth.users | The business admin |
| `name` | text | Display name |
| `slug` | text UNIQUE | URL slug — `/r/:slug` |
| `room_type` | text | `group` / `private` / `hybrid` |
| `retention_policy` | text | `ephemeral` / `24h` / `7d` / `permanent` |
| `participant_can_export` | boolean | Allow participants to save their thread |
| `session_duration_minutes` | int | Default session length |
| `auto_open_hour` | int? | 0–23, null = manual |
| `auto_close_hour` | int? | 0–23, null = use duration |
| `welcome_message` | text? | Shown to participants on join |
| `brand_color` | text | Hex colour for QR and accent |
| `max_participants` | int | Enforced at join via RPC |
| `is_active` | boolean | Soft delete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-stamped by trigger |

### sessions

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `room_id` | uuid FK → rooms | |
| `opened_at` | timestamptz | When admin went live |
| `closes_at` | timestamptz | Hard deadline — shown to participants |
| `closed_at` | timestamptz? | NULL = session is live |
| `participant_count` | int | Snapshot on close |
| `message_count` | int | Snapshot on close |
| `peak_participants` | int | Max simultaneous participants |

### messages

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `alias` | text | e.g. "Teal Falcon" |
| `alias_color` | text | Hex colour for avatar |
| `content` | text | Max 500 chars |
| `is_staff` | boolean | True = sent from admin dashboard |
| `pinned` | boolean | Only one per session |
| `created_at` | timestamptz | |

### participants

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `alias` | text | Max 40 chars |
| `alias_color` | text | |
| `token` | text UNIQUE | Opaque browser token — used for rejoin |
| `is_staff` | boolean | |
| `joined_at` | timestamptz | |
| `last_seen_at` | timestamptz | Updated on activity |

### conversations

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `room_id` | uuid FK → rooms | |
| `participant_token` | text | Same token as participants table |
| `participant_alias` | text | |
| `participant_color` | text | |
| `status` | text | `open` / `resolved` / `assigned` |
| `assigned_to` | text? | Staff alias if assigned |
| `unread_count` | int | Incremented on participant message, reset on staff reply |
| `last_message_at` | timestamptz? | For inbox ordering |
| `last_message_preview` | text? | First 60 chars of last message |
| `created_at` | timestamptz | |
| `resolved_at` | timestamptz? | |

### conversation_messages

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | |
| `conversation_id` | uuid FK → conversations | |
| `content` | text | Max 500 chars |
| `sender_type` | text | `participant` / `staff` |
| `sender_alias` | text | |
| `read_at` | timestamptz? | Null = unread by other side |
| `created_at` | timestamptz | |

---

## 9. API Reference

All routes are under `/api`. Auth handled via Supabase session cookie.

### Rooms

#### `POST /api/rooms`
Create a new room.

**Body:**
```json
{
  "name": "Main Stage Q&A",
  "description": "Live questions for the keynote",
  "welcomeMessage": "Ask anything — you're anonymous",
  "duration": 120,
  "color": "#7C3AED",
  "roomType": "hybrid",
  "retentionPolicy": "24h",
  "autoOpenHour": null,
  "autoCloseHour": null
}
```

**Response `201`:**
```json
{ "room": { "id": "...", "slug": "main-stage-qa-ab3f", ... } }
```

**Errors:**
- `401` — not authenticated
- `403` — plan QR limit reached
- `400` — validation failed

---

#### `PATCH /api/rooms/[roomId]`
Update room settings.

**Body:** Any subset of create fields.

**Response `200`:**
```json
{ "room": { ...updated room } }
```

---

#### `DELETE /api/rooms/[roomId]`
Permanently delete a room and all its sessions.

**Response `200`:**
```json
{ "success": true }
```

---

#### `POST /api/rooms/[roomId]/open-session`
Open a new live session for this room. Closes any existing open session first.

**Response `201`:**
```json
{
  "session": {
    "id": "...",
    "room_id": "...",
    "opened_at": "2025-01-01T10:00:00Z",
    "closes_at": "2025-01-01T12:00:00Z",
    "closed_at": null
  }
}
```

---

#### `POST /api/rooms/[roomId]/join`
Join a session as a participant. Enforces capacity limits server-side.

**Body:**
```json
{
  "alias": "Teal Falcon",
  "aliasColor": "#7C3AED",
  "token": "abc123xyz789...",
  "sessionId": "..."
}
```

**Response `200`:**
```json
{ "success": true, "rejoined": false }
```

**Errors:**
- `429` — room is full

---

#### `GET /api/rooms/[roomId]/conversations`
Get all active conversations for the admin inbox.

**Response `200`:**
```json
{
  "conversations": [...],
  "sessionId": "..."
}
```

---

### Sessions

#### `POST /api/sessions/[sessionId]/close`
Close a session. Snapshots analytics, purges ephemeral data.

**Response `200`:**
```json
{
  "success": true,
  "message_count": 42,
  "participant_count": 18,
  "retention": "ephemeral"
}
```

---

#### `POST /api/sessions/[sessionId]/kick`
Remove a participant from the active session.

**Body:**
```json
{ "alias": "Silver Fox" }
```

**Response `200`:**
```json
{ "success": true }
```

**Errors:**
- `403` — not the room owner

---

### Messages

#### `POST /api/messages/[messageId]/pin`
Pin a message. Unpins all others in the session first.

**Response `200`:**
```json
{ "success": true }
```

---

### Conversations (Private 1:1)

#### `POST /api/conversations`
Start or get an existing private conversation for a participant.

**Body:**
```json
{
  "sessionId": "...",
  "roomId": "...",
  "participantToken": "...",
  "participantAlias": "Teal Falcon",
  "participantColor": "#7C3AED"
}
```

**Response `201`:**
```json
{ "conversation": { "id": "...", "status": "open", ... } }
```

---

#### `POST /api/conversations/[conversationId]/messages`
Send a message in a private conversation.

**Body:**
```json
{
  "content": "Can I get help with my booking?",
  "senderType": "participant",
  "senderAlias": "Teal Falcon"
}
```

**Response `201`:**
```json
{ "message": { "id": "...", "content": "...", "sender_type": "participant", ... } }
```

---

#### `GET /api/conversations/[conversationId]/messages`
Get all messages in a conversation.

**Response `200`:**
```json
{ "messages": [...] }
```

---

#### `POST /api/conversations/[conversationId]/resolve`
Mark a conversation as resolved.

**Response `200`:**
```json
{ "success": true }
```

---

### Onboarding

#### `POST /api/onboarding`
Run on first dashboard visit. Creates a demo room if the user has none.

**Response `201`:**
```json
{ "room": {...}, "created": true }
```

Or if already set up:
```json
{ "alreadySetup": true }
```

---

## 10. RPC Functions

All database-intensive operations run as Supabase RPC functions (PostgreSQL, `security definer`). This replaces multiple API round trips with a single DB call.

### `rpc_get_room_by_slug(slug)`
Returns room + active session + messages in one query.
Replaces 3 separate queries on the participant join page.

### `rpc_join_room(session_id, alias, alias_color, token)`
Atomic capacity check + participant upsert. Race-safe — prevents two people joining simultaneously when one slot remains.

**Returns:** `{ success, rejoined }` or `{ error: "Room is full" }`

### `rpc_pin_message(message_id)`
Atomically unpins all messages in the session, then pins the target. Ensures exactly one pinned message at a time.

### `rpc_kick_participant(session_id, alias, owner_id)`
Verifies ownership then removes participant. Replaces 2 queries.

### `rpc_close_session(session_id)`
Atomic session close:
1. Snapshot analytics
2. Delete reactions, typing indicators, messages, participants
3. If `retention_policy = ephemeral`: delete conversations + conversation_messages
4. Mark `closed_at = now()`

Idempotent — safe to call twice.

### `rpc_start_conversation(session_id, room_id, token, alias, color)`
Upsert — creates conversation if not exists, returns existing if already started.

### `rpc_send_conv_message(conversation_id, content, sender_type, alias)`
Insert message + atomically update `last_message_at`, `last_message_preview`, and `unread_count`.

### `rpc_resolve_conversation(conversation_id, owner_id)`
Ownership-verified resolve. Resets `unread_count` to 0.

### `rpc_get_dashboard_stats(owner_id)`
Returns total_rooms, active_sessions, total_sessions, total_participants, total_messages in one query.

---

## 11. Realtime Events

Tempcha uses Supabase Realtime (Postgres Changes over WebSocket). Clients subscribe to table-level events filtered by session.

### Tables with Realtime enabled

| Table | Events | Used for |
|---|---|---|
| `messages` | INSERT, UPDATE, DELETE | Group chat live feed |
| `participants` | INSERT, DELETE | Online count |
| `sessions` | UPDATE | Detect session close |
| `typing_indicators` | INSERT, UPDATE, DELETE | Typing presence |
| `reactions` | INSERT, DELETE | Emoji reactions |
| `conversations` | INSERT, UPDATE | Admin inbox unread count |
| `conversation_messages` | INSERT | Private chat live feed |

### Client subscription pattern

```typescript
const channel = supabase
  .channel(`room-${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `session_id=eq.${sessionId}`,
  }, (payload) => {
    // new message arrived
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'sessions',
    filter: `id=eq.${sessionId}`,
  }, (payload) => {
    if (payload.new.closed_at) {
      // session ended — show "session closed" screen
    }
  })
  .subscribe();
```

---

## 12. Security & Privacy

### What Tempcha stores
- Admin account (email + hashed password via Supabase Auth)
- Room configuration (name, slug, settings)
- Session metadata (opened_at, closes_at, analytics counts)
- Reported messages (kept for moderation, even after session close)

### What Tempcha does NOT store (after session close)
- Group chat messages
- Participant identities or tokens
- Typing indicators
- Emoji reactions
- Private conversation messages (if retention = ephemeral)

### Participant identity
Participants are identified only by a random browser token stored in `localStorage`. No email, no phone number, no account. The token is session-scoped — it has no meaning after the session ends.

### Row Level Security
All tables have RLS enabled. Key policies:

- **Rooms**: only the owner can read/write their own rooms
- **Sessions**: public can read active sessions (closed_at IS NULL)
- **Messages**: public can read/insert into active sessions only
- **Conversations**: filtered by token in application layer

### Physical QR gate
Unlike open anonymous chat, participants must physically be at the venue to scan the QR code. This prevents:
- Random internet abuse
- Bot traffic at scale
- Mass harassment campaigns

### Abuse controls
Admins can:
- Delete individual messages from the dashboard
- Kick participants by alias
- Close the session immediately
- View flagged/reported messages

---

## 13. Pricing & Plan Limits

Billing via Paddle (Merchant of Record — handles VAT globally).

| Plan | Price | QR Rooms | Participants | Session Length | Analytics | Scheduling |
|---|---|---|---|---|---|---|
| **Free** | $0 | 1 | 20 | 2 hours | No | No |
| **Business** | $29/mo | 5 | 100 | 12 hours | Yes | Yes |
| **Enterprise** | $99/mo | Unlimited | 500 | Unlimited | Yes + Export | Yes |

### Plan limits enforced at
- **API level**: `POST /api/rooms` checks room count vs plan limit
- **DB level**: `rpc_join_room` checks `max_participants` vs current count
- **DB level**: `session_duration_minutes` capped at plan max on insert

---

## 14. Roadmap

### In progress
- Private 1:1 chat participant UI (`/r/[slug]?mode=private`)
- Admin unified inbox page (`/dashboard/rooms/[id]/inbox`)
- Realtime subscriptions for private conversation inbox

### Planned
- Mobile-optimised admin dashboard (PWA)
- Conversation export (PDF / CSV) for non-ephemeral rooms
- Thread assignment to staff members
- Push notifications for admin (new private message alert)
- Retention scheduler (auto-delete jobs for 24h / 7d policies)
- Analytics export
- Webhook support (notify external system on session events)
- White-label / custom domain per room
- API keys for developers embedding Tempcha

### Not planned
- Native mobile app (browser-first is the product)
- Video or voice chat
- File uploads
- Random stranger matching (Tempcha is business-controlled only)

---

*Last updated: April 2026*  
*Stack: Next.js 15 · Supabase · Paddle · TypeScript*  
*Repo: https://github.com/guru-dhanush/Tempcha*
