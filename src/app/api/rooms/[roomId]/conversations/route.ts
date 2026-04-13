import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify ownership
    const { data: room } = await supabase
      .from('rooms')
      .select('owner_id')
      .eq('id', roomId)
      .eq('owner_id', user.id)
      .single();
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Get active session's conversations
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('room_id', roomId)
      .is('closed_at', null)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) return NextResponse.json({ conversations: [] });

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', session.id)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ conversations: conversations ?? [], sessionId: session.id });
  } catch (err) {
    console.error('[GET /api/rooms/conversations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
