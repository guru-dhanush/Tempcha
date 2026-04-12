import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Single atomic call: unpin all + pin target
    const { error } = await supabase.rpc('rpc_pin_message', {
      p_message_id: messageId,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/messages/pin]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
