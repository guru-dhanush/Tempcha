import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: room, error: roomErr } = await supabase
      .from('rooms').select('*').eq('id', roomId).eq('owner_id', user.id).single();
    if (roomErr || !room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Close any existing open sessions first
    await supabase.from('sessions').update({ closed_at: new Date().toISOString() })
      .eq('room_id', roomId).is('closed_at', null);

    const closesAt = new Date(Date.now() + room.session_duration_minutes * 60_000).toISOString();
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ room_id: roomId, closes_at: closesAt })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rooms/open-session]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
