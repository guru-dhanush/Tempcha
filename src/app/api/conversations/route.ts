import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { sessionId, roomId, participantToken, participantAlias, participantColor } =
      await req.json() as {
        sessionId: string;
        roomId: string;
        participantToken: string;
        participantAlias: string;
        participantColor: string;
      };

    if (!sessionId || !roomId || !participantToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('rpc_start_conversation', {
      p_session_id:        sessionId,
      p_room_id:           roomId,
      p_participant_token: participantToken,
      p_participant_alias: participantAlias,
      p_participant_color: participantColor,
    });

    if (error) throw error;
    const result = data as { conversation?: unknown; error?: string };
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[POST /api/conversations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
