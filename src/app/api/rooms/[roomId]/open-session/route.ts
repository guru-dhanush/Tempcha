import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('owner_id', user.id)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const closesAt = new Date(Date.now() + room.session_duration_minutes * 60 * 1000).toISOString();

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({ room_id: roomId, closes_at: closesAt })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session });
}
