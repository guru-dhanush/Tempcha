export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { ChatRoomClient } from '@/components/chat/chat-room-client';
import type { Room, Session, Message } from '@/lib/types';

interface RpcResult {
  room: Room | null;
  session: Session | null;
  messages: Message[];
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Single RPC call replaces 3 separate queries
  const { data, error } = await supabase.rpc('rpc_get_room_by_slug', {
    p_slug: slug,
  });

  if (error) {
    console.error('[RoomPage]', error);
    notFound();
  }

  const result = data as RpcResult | null;
  if (!result?.room) notFound();

  return (
    <ChatRoomClient
      room={result.room}
      session={result.session ?? null}
      initialMessages={result.messages ?? []}
    />
  );
}
