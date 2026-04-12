# FlashRoom 🚀

> QR-powered ephemeral group chat for businesses.  
> **Scan. Chat. Disappear.**

---

## What it does

One permanent QR code generates a fresh, anonymous chat room every session.  
When the session ends, all messages are deleted. Nothing is retained.

**No app. No signup. No data.** Just instant, real-time conversation.

---

## Tech Stack

- **Next.js 15** — App Router, Server Components
- **Supabase** — Auth + Postgres DB + Realtime WebSockets
- **Paddle** — Global billing, subscriptions, tax handling
- **Tailwind CSS + shadcn/ui** — Dark glassmorphic UI

---

## Quick Setup

### 1. Clone & install
```bash
git clone <your-repo>
cd flashroom
pnpm install
```

### 2. Set environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase + Paddle keys
```

### 3. Set up Supabase

Create a new project at [supabase.com](https://supabase.com), then run the migrations:

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Paste into Supabase SQL editor
# Copy contents of: supabase/migrations/20240101000002_flashroom.sql
```

### 4. Enable Supabase Realtime

In your Supabase dashboard:
- Go to **Database → Replication**
- Enable replication for: `messages`, `participants`

### 5. Set up Paddle

1. Create account at [paddle.com](https://paddle.com)
2. Create 3 products: **Starter ($29/mo)**, **Business ($99/mo)**, **Enterprise**
3. Copy price IDs into `src/constants/pricing-tier.ts`
4. Set up webhook pointing to: `https://yourdomain.com/api/webhook`
5. Add your API keys to `.env.local`

### 6. Run locally
```bash
pnpm dev
# → http://localhost:3000
```

---

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Admin overview |
| `/dashboard/rooms` | Manage QR rooms |
| `/r/[slug]` | Public chat room (shareable) |
| `/api/rooms` | Create room |
| `/api/rooms/[id]/open-session` | Start a session |
| `/api/sessions/[id]/close` | End session + wipe messages |
| `/api/webhook` | Paddle webhook handler |

---

## Plans & Limits

| Plan | QR Codes | Participants | Duration |
|------|----------|--------------|---------|
| Free | 1 | 20 | 2h |
| Business ($29/mo) | 5 | 100 | 12h |
| Enterprise ($99/mo) | Unlimited | 500 | Unlimited |

---

## How sessions work

1. Admin hits **Open Session** in dashboard
2. Supabase creates a `sessions` row with `closes_at` timestamp  
3. Participants scan QR → land on `/r/[slug]` → get alias → join
4. Messages flow via **Supabase Realtime** (WebSocket)
5. On session close: messages + participants deleted via DB cascade
6. QR still works — next scan opens a new blank session

---

## Deploying

### Vercel (recommended)
```bash
vercel deploy
# Set env vars in Vercel dashboard
```

### Self-hosted
```bash
pnpm build
pnpm start
```
