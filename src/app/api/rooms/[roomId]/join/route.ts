import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const { alias, aliasColor, token, sessionId } = await req.json() as {
      alias: string; aliasColor: string; token: string; sessionId: string;
    };

    if (!alias || !token || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get room + session
    const { data: room } = await supabase.from('rooms').select('max_participants').eq('id', roomId).single();
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Check participant count
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if ((count ?? 0) >= room.max_participants) {
      return NextResponse.json({ error: 'Room is full' }, { status: 429 });
    }

    // Upsert participant
    const { error } = await supabase.from('participants').upsert(
      { session_id: sessionId, alias, alias_color: aliasColor, token },
      { onConflict: 'token' }
    );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/rooms/join]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
