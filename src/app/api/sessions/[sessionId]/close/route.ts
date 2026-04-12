import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Delete messages and participants, then close session
  await supabase.from('messages').delete().eq('session_id', sessionId);
  await supabase.from('participants').delete().eq('session_id', sessionId);
  const { error } = await supabase
    .from('sessions')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
