import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.rpc('rpc_resolve_conversation', {
      p_conversation_id: conversationId,
      p_owner_id:        user.id,
    });

    if (error) throw error;
    const result = data as { success?: boolean; error?: string };
    if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/conversations/resolve]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
