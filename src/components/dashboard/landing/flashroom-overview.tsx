'use client';

import Link from 'next/link';
import { QrCode, Users, Zap, TrendingUp, Plus, ArrowRight, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats {
  totalRooms: number;
  totalSessions: number;
  activeSessions: number;
  totalParticipants: number;
}

interface Plan {
  name: string;
  qrLimit: number;
  qrUsed: number;
}

interface Props {
  rooms: any[];
  stats: Stats;
  plan: Plan;
  userEmail: string;
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground mb-0.5">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </div>
  );
}

function ActiveRoomCard({ room }: { room: any }) {
  const activeSession = room.sessions?.find((s: any) => !s.closed_at);
  const diff = activeSession ? new Date(activeSession.closes_at).getTime() - Date.now() : 0;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const timeLeft = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(258 50% 60% / 0.2)' }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <div>
          <div className="text-sm font-medium">{room.name}</div>
          <div className="text-xs text-muted-foreground">
            {activeSession?.participant_count ?? 0} participants · {timeLeft} left
          </div>
        </div>
      </div>
      <a
        href={`/r/${room.slug}`}
        target="_blank"
        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white hover:opacity-80 transition-opacity"
        style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}
      >
        View
      </a>
    </div>
  );
}

export function FlashRoomOverview({ rooms, stats, plan, userEmail }: Props) {
  const activeRooms = rooms.filter((r: any) => r.sessions?.some((s: any) => !s.closed_at));
  const planProgress = Math.round((plan.qrUsed / plan.qrLimit) * 100);
  const atLimit = plan.qrUsed >= plan.qrLimit;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<QrCode className="w-5 h-5" />}
          label="QR Rooms"
          value={stats.totalRooms}
          sub={`${plan.qrLimit - plan.qrUsed} remaining on ${plan.name}`}
          color="hsl(258 100% 65%)"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Active sessions"
          value={stats.activeSessions}
          sub={stats.activeSessions > 0 ? 'Live right now' : 'No sessions open'}
          color="hsl(142 70% 50%)"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total participants"
          value={stats.totalParticipants}
          sub="All-time across all sessions"
          color="hsl(220 100% 65%)"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total sessions"
          value={stats.totalSessions}
          sub="Sessions run so far"
          color="hsl(185 100% 55%)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active rooms + quick actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active rooms */}
          <div className="rounded-2xl p-5" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Live right now</h3>
              <Link href="/dashboard/rooms" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                All rooms <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {activeRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'hsl(224 25% 11%)' }}>
                  <Zap className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm">No sessions open right now</p>
                <Link href="/dashboard/rooms" className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-block">
                  Open a session →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRooms.map((room: any) => <ActiveRoomCard key={room.id} room={room} />)}
              </div>
            )}
          </div>

          {/* Recent rooms */}
          <div className="rounded-2xl p-5" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Your rooms</h3>
              <Link href="/dashboard/rooms">
                <Button size="sm" className="gap-1.5 text-xs text-white border-0 h-7 px-3"
                  style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}>
                  <Plus className="w-3 h-3" /> New room
                </Button>
              </Link>
            </div>
            {rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm mb-3">No rooms yet. Create your first permanent QR code.</p>
                <Link href="/dashboard/rooms">
                  <Button size="sm" className="gap-1.5 text-xs text-white border-0"
                    style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}>
                    <Plus className="w-3 h-3" /> Create a room
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.slice(0, 5).map((room: any) => {
                  const isLive = room.sessions?.some((s: any) => !s.closed_at);
                  const sessionCount = room.sessions?.length ?? 0;
                  return (
                    <div key={room.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/3 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: isLive ? '#4ade80' : 'hsl(224 20% 25%)' }} />
                        <div>
                          <div className="text-sm font-medium">{room.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {sessionCount} session{sessionCount !== 1 ? 's' : ''} · /r/{room.slug}
                          </div>
                        </div>
                      </div>
                      <Link href="/dashboard/rooms" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Plan + quick start */}
        <div className="space-y-4">
          {/* Plan card */}
          <div className="rounded-2xl p-5" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Your plan</h3>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: plan.name === 'Free' ? 'hsl(224 25% 12%)' : 'hsl(258 100% 65% / 0.15)',
                  color: plan.name === 'Free' ? 'hsl(215 15% 60%)' : 'hsl(258 100% 75%)',
                  border: plan.name === 'Free' ? '1px solid hsl(224 20% 18%)' : '1px solid hsl(258 50% 60% / 0.3)',
                }}>
                {plan.name !== 'Free' && <Crown className="w-3 h-3" />}
                {plan.name}
              </div>
            </div>

            {/* QR usage bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>QR codes used</span>
                <span className={atLimit ? 'text-red-400' : ''}>{plan.qrUsed} / {plan.qrLimit}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(224 25% 12%)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(planProgress, 100)}%`,
                    background: atLimit
                      ? 'linear-gradient(90deg, hsl(0 80% 55%), hsl(0 80% 65%))'
                      : 'linear-gradient(90deg, hsl(258 100% 65%), hsl(220 100% 60%))',
                  }}
                />
              </div>
              {atLimit && (
                <p className="text-xs text-red-400 mt-1.5">Limit reached — upgrade to add more rooms</p>
              )}
            </div>

            {plan.name === 'Free' && (
              <div className="rounded-xl p-3 mb-3" style={{ background: 'hsl(258 100% 65% / 0.08)', border: '1px solid hsl(258 50% 60% / 0.2)' }}>
                <p className="text-xs text-muted-foreground mb-2">
                  Upgrade to <span className="text-purple-400 font-semibold">Business</span> for 5 QR codes, 100 participants, analytics & custom branding.
                </p>
                <Link href="/checkout/pri_01hsxycme6m95sejkz7sbz5e9g">
                  <Button size="sm" className="w-full text-xs text-white border-0 h-8"
                    style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}>
                    Upgrade to Business — $29/mo
                  </Button>
                </Link>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Up to {plan.name === 'Free' ? '2h' : '12h'} sessions
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Up to {plan.name === 'Free' ? '20' : '100'} participants
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                {plan.qrLimit} permanent QR code{plan.qrLimit !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Quick start guide */}
          <div className="rounded-2xl p-5" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 13%)' }}>
            <h3 className="font-semibold mb-4">Quick start</h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Create a room in My Rooms', done: rooms.length > 0, href: '/dashboard/rooms' },
                { step: '2', text: 'Download your QR code', done: false, href: '/dashboard/rooms' },
                { step: '3', text: 'Open a session to go live', done: stats.activeSessions > 0, href: '/dashboard/rooms' },
                { step: '4', text: 'Share QR with participants', done: stats.totalParticipants > 0, href: '/dashboard/rooms' },
              ].map((item) => (
                <Link key={item.step} href={item.href} className="flex items-center gap-3 group">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={item.done
                      ? { background: 'hsl(142 70% 40% / 0.2)', border: '1px solid hsl(142 70% 40% / 0.4)', color: 'hsl(142 70% 60%)' }
                      : { background: 'hsl(224 25% 12%)', border: '1px solid hsl(224 20% 18%)', color: 'hsl(215 15% 55%)' }
                    }>
                    {item.done ? '✓' : item.step}
                  </div>
                  <span className={`text-sm transition-colors group-hover:text-foreground ${item.done ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'}`}>
                    {item.text}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
