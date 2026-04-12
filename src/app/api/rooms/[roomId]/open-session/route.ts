import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { Session } from '@/lib/types';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Select only what we need — not select('*')
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('session_duration_minutes, owner_id')
      .eq('id', roomId)
      .eq('owner_id', user.id)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Close any existing open sessions atomically
    const openSessions = await supabase
      .from('sessions')
      .select('id')
      .eq('room_id', roomId)
      .is('closed_at', null);

    if (openSessions.data?.length) {
      await Promise.all(
        openSessions.data.map((s) =>
          supabase.rpc('rpc_close_session', { p_session_id: s.id })
        )
      );
    }

    const closesAt = new Date(
      Date.now() + room.session_duration_minutes * 60_000
    ).toISOString();

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({ room_id: roomId, closes_at: closesAt })
      .select('id, room_id, opened_at, closes_at, closed_at, participant_count, message_count, peak_participants')
      .single();

    if (error) throw error;
    return NextResponse.json({ session: session as Session }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rooms/open-session]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
