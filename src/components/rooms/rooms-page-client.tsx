'use client';

import { useState } from 'react';
import { Plus, QrCode, Users, Clock, Zap, MoreVertical, ExternalLink, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateRoomModal } from '@/components/rooms/create-room-modal';
import { RoomQRModal } from '@/components/rooms/room-qr-modal';
import Link from 'next/link';

interface Session { id: string; opened_at: string; closes_at: string; closed_at: string | null; participant_count: number; }
interface Room { id: string; name: string; slug: string; description: string | null; is_active: boolean; session_duration_minutes: number; welcome_message: string | null; brand_color: string; max_participants: number; created_at: string; sessions: Session[]; }
interface Props { rooms: Room[]; userId: string; }

function getActive(sessions: Session[]) { return sessions?.find(s => !s.closed_at) ?? null; }

function timeLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return 'Closing...';
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function RoomsPageClient({ rooms: initialRooms, userId }: Props) {
  const [rooms, setRooms]         = useState(initialRooms);
  const [showCreate, setShowCreate] = useState(false);
  const [qrRoom, setQrRoom]       = useState<Room | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRoomCreated = (room: Room) => { setRooms(prev => [{ ...room, sessions: [] }, ...prev]); setShowCreate(false); };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    if (res.ok) setRooms(prev => prev.filter(r => r.id !== roomId));
    setOpenMenuId(null);
  };

  const handleToggleSession = async (room: Room) => {
    const active = getActive(room.sessions);
    if (active) {
      if (!confirm('Close session? All messages will be deleted.')) return;
      await fetch(`/api/sessions/${active.id}/close`, { method: 'POST' });
    } else {
      await fetch(`/api/rooms/${room.id}/open-session`, { method: 'POST' });
    }
    window.location.reload();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{rooms.length} room{rooms.length !== 1 ? 's' : ''} · QR codes are permanent</p>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> New Room
        </Button>
      </div>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl">
          <QrCode className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs">Create your first room to get a permanent QR code. Print it once, use it forever.</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create your first room
          </Button>
        </div>
      )}

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map(room => {
          const active = getActive(room.sessions);
          const isLive = !!active;

          return (
            <div key={room.id} className={`rounded-xl border bg-card overflow-hidden transition-all ${isLive ? 'border-primary/30 shadow-sm' : 'border-border'}`}>
              {/* Color top bar */}
              <div className="h-1" style={{ background: room.brand_color }} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: room.brand_color }}>
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{room.name}</div>
                      <div className="text-xs text-muted-foreground truncate">/r/{room.slug}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isLive && (
                      <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
                      </div>
                    )}
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === room.id ? null : room.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === room.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-36 bg-card border border-border shadow-lg">
                          <a href={`/r/${room.slug}`} target="_blank"
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> View as participant
                          </a>
                          <button onClick={() => handleDelete(room.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete room
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Users className="w-3 h-3" /> Online</div>
                    <div className="text-sm font-bold">{isLive ? active.participant_count : 0}<span className="text-muted-foreground font-normal text-xs">/{room.max_participants}</span></div>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> Time</div>
                    <div className="text-sm font-bold truncate">{isLive ? timeLeft(active.closes_at) : `${room.session_duration_minutes}m`}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setQrRoom(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors">
                    <QrCode className="w-3.5 h-3.5" /> QR Code
                  </button>
                  <button onClick={() => handleToggleSession(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: isLive ? '#DC2626' : room.brand_color }}>
                    <Zap className="w-3.5 h-3.5" /> {isLive ? 'Close' : 'Go Live'}
                  </button>
                  <Link href={`/dashboard/rooms/${room.id}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    title="Manage room">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleRoomCreated} />}
      {qrRoom && <RoomQRModal room={qrRoom} onClose={() => setQrRoom(null)} />}
    </div>
  );
}
