import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 40) + '-' + Math.random().toString(36).substring(2, 6);
}

const PLAN_LIMITS: Record<string, { qrLimit: number; maxParticipants: number; maxDuration: number }> = {
  free:     { qrLimit: 1,   maxParticipants: 20,  maxDuration: 120  },
  starter:  { qrLimit: 5,   maxParticipants: 100, maxDuration: 720  },
  pro:      { qrLimit: 999, maxParticipants: 500, maxDuration: 9999 },
  advanced: { qrLimit: 999, maxParticipants: 500, maxDuration: 9999 },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, welcomeMessage, duration, color, autoOpenHour, autoCloseHour } = body;
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { data: sub } = await supabase.from('subscriptions').select('price_id, subscription_status').eq('customer_id', user.email ?? '').eq('subscription_status', 'active').maybeSingle();
  let planTier = 'free';
  if (sub?.subscription_status === 'active') planTier = 'starter';
  const limits = PLAN_LIMITS[planTier];

  const { count } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
  if ((count ?? 0) >= limits.qrLimit) {
    return NextResponse.json({ error: `Your plan allows ${limits.qrLimit} QR room${limits.qrLimit === 1 ? '' : 's'}. Upgrade to add more.` }, { status: 403 });
  }

  const { data: room, error } = await supabase.from('rooms').insert({
    owner_id: user.id,
    name: name.trim(),
    slug: slugify(name),
    description: description || null,
    welcome_message: welcomeMessage || null,
    session_duration_minutes: Math.min(duration || 120, limits.maxDuration),
    brand_color: color || '#7C3AED',
    max_participants: limits.maxParticipants,
    auto_open_hour: autoOpenHour ?? null,
    auto_close_hour: autoCloseHour ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ room });
}
