export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/layout/dashboard-page-header';
import { RoomsPageClient } from '@/components/rooms/rooms-page-client';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, sessions(id, opened_at, closes_at, closed_at, participant_count)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      <DashboardPageHeader pageTitle="My Rooms" />
      <RoomsPageClient rooms={rooms ?? []} userId={user.id} />
    </main>
  );
}
