'use client';

import { useState, useTransition, useCallback } from 'react';
import { Plus, QrCode, Users, Clock, Zap, MoreVertical, ExternalLink, Trash2, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateRoomModal } from '@/components/rooms/create-room-modal';
import { EditRoomModal } from '@/components/rooms/edit-room-modal';
import { RoomQRModal } from '@/components/rooms/room-qr-modal';
import { RoomsSkeleton } from '@/components/rooms/rooms-skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Room, RoomWithSessions, Session } from '@/lib/types';
import { formatDuration, formatTimeLeft } from '@/lib/utils';

interface Props {
  rooms: RoomWithSessions[];
  userId: string;
}

function getActiveSession(sessions: Session[]): Session | null {
  return sessions?.find((s) => !s.closed_at) ?? null;
}

function SessionTimer({ closesAt }: { closesAt: string }) {
  const [, forceRender] = useState(0);
  // Simple display — parent uses useCountdown for expiry
  return <>{formatTimeLeft(closesAt) ?? 'Closing...'}</>;
}

export function RoomsPageClient({ rooms: initial, userId }: Props) {
  const [rooms, setRooms]         = useState<RoomWithSessions[]>(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [editRoom, setEditRoom]   = useState<Room | null>(null);
  const [qrRoom, setQrRoom]       = useState<RoomWithSessions | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRoomCreated = useCallback((room: Room) => {
    setRooms((prev) => [{ ...room, sessions: [] }, ...prev]);
    setShowCreate(false);
    toast.success(`"${room.name}" created! Download the QR to get started.`);
  }, []);

  const handleRoomUpdated = useCallback((updated: Room) => {
    setRooms((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
    setEditRoom(null);
  }, []);

  const handleDelete = useCallback(async (room: RoomWithSessions) => {
    setOpenMenuId(null);
    const confirmed = window.confirm(`Delete "${room.name}"? This is permanent.`);
    if (!confirmed) return;

    const prev = rooms;
    setRooms((r) => r.filter((x) => x.id !== room.id)); // optimistic

    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`"${room.name}" deleted`);
    } catch {
      setRooms(prev); // rollback
      toast.error('Could not delete room. Try again.');
    }
  }, [rooms]);

  const handleToggleSession = useCallback(async (room: RoomWithSessions) => {
    const active = getActiveSession(room.sessions);

    if (active) {
      const confirmed = window.confirm('Close session? All messages will be permanently deleted.');
      if (!confirmed) return;
    }

    startTransition(async () => {
      try {
        const url = active
          ? `/api/sessions/${active.id}/close`
          : `/api/rooms/${room.id}/open-session`;

        const res = await fetch(url, { method: 'POST' });
        if (!res.ok) {
          const d = await res.json() as { error?: string };
          throw new Error(d.error ?? 'Action failed');
        }

        if (active) {
          toast.success('Session closed — messages deleted');
          setRooms((prev) => prev.map((r) => r.id === room.id
            ? { ...r, sessions: r.sessions.map((s) => s.id === active.id ? { ...s, closed_at: new Date().toISOString() } : s) }
            : r
          ));
        } else {
          const { session } = await res.json() as { session: Session };
          toast.success('Session is live! Share the QR code.');
          setRooms((prev) => prev.map((r) => r.id === room.id
            ? { ...r, sessions: [session, ...r.sessions] }
            : r
          ));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''} · QR codes never change
        </p>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> New Room
        </Button>
      </div>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Create your first room</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
            A permanent QR code that opens a fresh chat every session. Print it once, use it forever.
          </p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create a room
          </Button>
        </div>
      )}

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const active  = getActiveSession(room.sessions);
          const isLive  = !!active;
          const sessionsCount = room.sessions.length;

          return (
            <article
              key={room.id}
              className={`rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${isLive ? 'border-primary/40 shadow-sm' : 'border-border'}`}
            >
              {/* Brand bar */}
              <div className="h-1.5 w-full" style={{ background: room.brand_color }} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: room.brand_color }}
                      aria-label={room.name}
                    >
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">{room.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">/r/{room.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isLive && (
                      <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        LIVE
                      </span>
                    )}

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === room.id ? null : room.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Room options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === room.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-44 bg-card border border-border shadow-xl">
                            <button
                              onClick={() => { setEditRoom(room); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit room
                            </button>
                            <a
                              href={`/r/${room.slug}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View as participant
                            </a>
                            <div className="border-t border-border" />
                            <button
                              onClick={() => handleDelete(room)}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete room
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Users className="w-3 h-3" /> Online
                    </div>
                    <div className="text-sm font-bold">
                      {isLive ? active.participant_count : 0}
                      <span className="text-muted-foreground font-normal text-xs">/{room.max_participants}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" /> {isLive ? 'Time left' : 'Duration'}
                    </div>
                    <div className="text-sm font-bold truncate">
                      {isLive
                        ? <SessionTimer closesAt={active.closes_at} />
                        : formatDuration(room.session_duration_minutes)
                      }
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setQrRoom(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR Code
                  </button>
                  <button
                    onClick={() => handleToggleSession(room)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: isLive ? '#DC2626' : room.brand_color }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isPending ? '...' : isLive ? 'End session' : 'Go live'}
                  </button>
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    title="Manage room"
                    aria-label="Manage room"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Session count */}
                {sessionsCount > 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center mt-3">
                    {sessionsCount} session{sessionsCount !== 1 ? 's' : ''} run
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleRoomCreated} />
      )}
      {editRoom && (
        <EditRoomModal room={editRoom} onClose={() => setEditRoom(null)} onUpdated={handleRoomUpdated} />
      )}
      {qrRoom && (
        <RoomQRModal room={qrRoom} onClose={() => setQrRoom(null)} />
      )}
    </div>
  );
}
