import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendMessageSchema } from '@/lib/validations';

type Params = { params: Promise<{ conversationId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const body = await req.json() as {
      content: string;
      senderType: 'participant' | 'staff';
      senderAlias: string;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('rpc_send_conv_message', {
      p_conversation_id: conversationId,
      p_content:         body.content.trim().substring(0, 500),
      p_sender_type:     body.senderType,
      p_sender_alias:    body.senderAlias,
    });

    if (error) throw error;
    const result = data as { message?: unknown; error?: string };
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[POST /api/conversations/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ messages: data });
  } catch (err) {
    console.error('[GET /api/conversations/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
