import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: _roomId } = await params;
    const supabase = await createClient();

    const { alias, aliasColor, token, sessionId } = await req.json() as {
      alias: string;
      aliasColor: string;
      token: string;
      sessionId: string;
    };

    if (!alias?.trim() || !token || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Single atomic call: check capacity + upsert participant
    const { data, error } = await supabase.rpc('rpc_join_room', {
      p_session_id:  sessionId,
      p_alias:       alias.trim(),
      p_alias_color: aliasColor,
      p_token:       token,
    });

    if (error) throw error;

    const result = data as { error?: string; success?: boolean };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/rooms/join]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
