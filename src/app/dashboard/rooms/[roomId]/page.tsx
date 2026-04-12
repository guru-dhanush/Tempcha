export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/layout/dashboard-page-header';
import { AdminRoomView } from '@/components/rooms/admin-room-view';

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).eq('owner_id', user.id).single();
  if (!room) notFound();

  const { data: session } = await supabase.from('sessions').select('*').eq('room_id', roomId).is('closed_at', null).order('opened_at', { ascending: false }).limit(1).maybeSingle();

  const { data: messages } = session
    ? await supabase.from('messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true }).limit(200)
    : { data: [] };

  const { data: reports } = await supabase.from('reported_messages').select('*').eq('session_id', session?.id ?? '').order('created_at', { ascending: false });

  const { data: allSessions } = await supabase.from('sessions').select('id, opened_at, closed_at, participant_count, message_count').eq('room_id', roomId).order('opened_at', { ascending: false }).limit(20);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      <DashboardPageHeader pageTitle={room.name} />
      <AdminRoomView room={room} session={session ?? null} initialMessages={messages ?? []} reports={reports ?? []} allSessions={allSessions ?? []} />
    </main>
  );
}
