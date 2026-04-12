import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Capture analytics before deleting
    const [{ count: msgCount }, { count: pCount }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    ]);

    // Update session with analytics then close
    await supabase.from('sessions').update({
      closed_at: new Date().toISOString(),
      message_count: msgCount ?? 0,
      participant_count: pCount ?? 0,
    }).eq('id', sessionId);

    // Purge ephemeral data
    await Promise.all([
      supabase.from('messages').delete().eq('session_id', sessionId),
      supabase.from('participants').delete().eq('session_id', sessionId),
      supabase.from('typing_indicators').delete().eq('session_id', sessionId),
      supabase.from('reactions').delete().eq('session_id', sessionId),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/sessions/close]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
