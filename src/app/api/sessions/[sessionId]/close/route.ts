import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Single atomic DB call: snapshot analytics + purge ephemeral data
    const { data, error } = await supabase.rpc('rpc_close_session', {
      p_session_id: sessionId,
    });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[POST /api/sessions/close]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
