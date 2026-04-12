import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ChatRoomClient } from '@/components/chat/chat-room-client';

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Find room
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!room) notFound();

  // Find active session
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('room_id', room.id)
    .is('closed_at', null)
    .gte('closes_at', new Date().toISOString())
    .order('opened_at', { ascending: false })
    .limit(1)
    .single();

  // Load existing messages if session active
  let messages: any[] = [];
  if (session) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(100);
    messages = data ?? [];
  }

  return (
    <ChatRoomClient
      room={room}
      session={session ?? null}
      initialMessages={messages}
    />
  );
}
