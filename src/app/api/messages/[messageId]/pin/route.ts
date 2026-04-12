import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: msg } = await supabase.from('messages').select('session_id').eq('id', messageId).single();
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('messages').update({ pinned: false }).eq('session_id', msg.session_id);
  await supabase.from('messages').update({ pinned: true }).eq('id', messageId);
  return NextResponse.json({ success: true });
}
