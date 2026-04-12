import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { alias } = await req.json() as { alias: string };
    if (!alias?.trim()) {
      return NextResponse.json({ error: 'Alias required' }, { status: 400 });
    }

    // Single atomic call: verify ownership + remove participant
    const { data, error } = await supabase.rpc('rpc_kick_participant', {
      p_session_id: sessionId,
      p_alias:      alias,
      p_owner_id:   user.id,
    });

    if (error) throw error;
    if ((data as { error?: string }).error) {
      return NextResponse.json(data, { status: 403 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('[POST /api/sessions/kick]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
