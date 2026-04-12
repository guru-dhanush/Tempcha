export const dynamic = 'force-dynamic';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/layout/dashboard-page-header';
import { FlashRoomOverview } from '@/components/dashboard/landing/flashroom-overview';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch stats
  const [{ data: rooms }, { data: subscription }] = await Promise.all([
    supabase
      .from('rooms')
      .select('*, sessions(id, closed_at, participant_count, opened_at)')
      .eq('owner_id', user.id),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', user.email ?? '')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const allRooms = rooms ?? [];
  const totalSessions = allRooms.flatMap((r: any) => r.sessions ?? []).length;
  const activeSessions = allRooms.flatMap((r: any) => r.sessions ?? []).filter((s: any) => !s.closed_at).length;
  const totalParticipants = allRooms
    .flatMap((r: any) => r.sessions ?? [])
    .reduce((sum: number, s: any) => sum + (s.participant_count ?? 0), 0);

  const planName = subscription?.subscription_status === 'active'
    ? 'Business'
    : 'Free';

  const qrLimit = planName === 'Business' ? 5 : 1;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <DashboardPageHeader pageTitle="Overview" />
      <FlashRoomOverview
        rooms={allRooms}
        stats={{ totalRooms: allRooms.length, totalSessions, activeSessions, totalParticipants }}
        plan={{ name: planName, qrLimit, qrUsed: allRooms.length }}
        userEmail={user.email ?? ''}
      />
    </main>
  );
}
