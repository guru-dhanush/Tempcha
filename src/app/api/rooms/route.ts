import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createRoomSchema } from '@/lib/validations';
import { slugify, resolvePlanTier } from '@/lib/utils';
import { PLAN_LIMITS } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, description, welcomeMessage, duration, color, autoOpenHour, autoCloseHour, roomType, retentionPolicy } = parsed.data;

    // Resolve plan
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('price_id, subscription_status')
      .eq('customer_id', user.email ?? '')
      .eq('subscription_status', 'active')
      .maybeSingle();

    const tier = sub?.subscription_status === 'active' ? resolvePlanTier(sub.price_id) : 'free';
    const limits = PLAN_LIMITS[tier];

    // Enforce QR limit
    const { count, error: countErr } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    if (countErr) throw countErr;
    if ((count ?? 0) >= limits.qrLimit) {
      return NextResponse.json(
        { error: `Your ${tier} plan allows ${limits.qrLimit} QR room${limits.qrLimit === 1 ? '' : 's'}. Upgrade to add more.` },
        { status: 403 }
      );
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        owner_id: user.id,
        name,
        slug: slugify(name),
        description: description ?? null,
        welcome_message: welcomeMessage ?? null,
        session_duration_minutes: Math.min(duration, limits.maxDurationMinutes),
        brand_color: color,
        max_participants: limits.maxParticipants,
        auto_open_hour: autoOpenHour ?? null,
        auto_close_hour: autoCloseHour ?? null,
        room_type: roomType ?? 'group',
        retention_policy: retentionPolicy ?? 'ephemeral',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rooms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
