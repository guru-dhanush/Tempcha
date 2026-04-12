import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { slugify } from '@/lib/utils';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { count } = await supabase
      .from('rooms').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
    if ((count ?? 0) > 0) return NextResponse.json({ alreadySetup: true });

    const { data: room, error } = await supabase.from('rooms').insert({
      owner_id: user.id,
      name: 'My First Room',
      slug: slugify('my first room'),
      description: 'A demo room to try FlashRoom',
      welcome_message: 'Welcome! This is your first FlashRoom. Open a session and share the QR to start chatting.',
      session_duration_minutes: 120,
      brand_color: '#7C3AED',
      max_participants: 20,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ room, created: true });
  } catch (err) {
    console.error('[POST /api/onboarding]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
