import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { alias } = await req.json() as { alias: string };
    if (!alias) return NextResponse.json({ error: 'Alias required' }, { status: 400 });

    // Verify session belongs to this admin
    const { data: session } = await supabase.from('sessions').select('room_id').eq('id', sessionId).single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { data: room } = await supabase.from('rooms').select('owner_id').eq('id', session.room_id).single();
    if (!room || room.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Remove participant and their messages
    await supabase.from('participants').delete().eq('session_id', sessionId).eq('alias', alias);
    // Note: we keep messages for moderation record but mark them
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/sessions/kick]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
