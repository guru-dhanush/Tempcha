export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/layout/dashboard-page-header';
import { RoomsPageClient } from '@/components/rooms/rooms-page-client';
import type { RoomWithSessions } from '@/lib/types';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Run onboarding silently (creates demo room if first login)
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/onboarding`, {
    method: 'POST',
    headers: { cookie: '' }, // server-side — handled via createClient
  }).catch(() => null); // non-blocking

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, sessions(id, opened_at, closes_at, closed_at, participant_count, message_count)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      <DashboardPageHeader pageTitle="My Rooms" />
      <RoomsPageClient rooms={(rooms ?? []) as RoomWithSessions[]} userId={user.id} />
    </main>
  );
}
