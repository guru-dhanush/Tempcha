'use client';

import { useState } from 'react';
import { Plus, QrCode, Users, Clock, Zap, MoreVertical, ExternalLink, Trash2, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateRoomModal } from '@/components/rooms/create-room-modal';
import { RoomQRModal } from '@/components/rooms/room-qr-modal';

interface Session {
  id: string;
  opened_at: string;
  closes_at: string;
  closed_at: string | null;
  participant_count: number;
}

interface Room {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  session_duration_minutes: number;
  welcome_message: string | null;
  brand_color: string;
  max_participants: number;
  created_at: string;
  sessions: Session[];
}

interface Props {
  rooms: Room[];
  userId: string;
}

function getActiveSession(sessions: Session[]) {
  return sessions?.find(s => !s.closed_at) ?? null;
}

function timeLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return 'Closing...';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function RoomsPageClient({ rooms: initialRooms, userId }: Props) {
  const [rooms, setRooms] = useState(initialRooms);
  const [showCreate, setShowCreate] = useState(false);
  const [qrRoom, setQrRoom] = useState<Room | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRoomCreated = (room: Room) => {
    setRooms(prev => [{ ...room, sessions: [] }, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
    if (res.ok) setRooms(prev => prev.filter(r => r.id !== roomId));
    setOpenMenuId(null);
  };

  const handleToggleSession = async (room: Room) => {
    const activeSession = getActiveSession(room.sessions);
    if (activeSession) {
      await fetch(`/api/sessions/${activeSession.id}/close`, { method: 'POST' });
    } else {
      await fetch(`/api/rooms/${room.id}/open-session`, { method: 'POST' });
    }
    window.location.reload();
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground text-sm mt-1">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} · Each QR is permanent
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-2 text-white border-0 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}
        >
          <Plus className="w-4 h-4" />
          New Room
        </Button>
      </div>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 65% / 0.15), hsl(220 100% 60% / 0.1))', border: '1px solid hsl(258 50% 60% / 0.2)' }}>
            <QrCode className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No rooms yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first room to get a permanent QR code. Print it once, use it forever.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2 text-white border-0"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}>
            <Plus className="w-4 h-4" /> Create your first room
          </Button>
        </div>
      )}

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const activeSession = getActiveSession(room.sessions);
          const isLive = !!activeSession;

          return (
            <div key={room.id} className="rounded-2xl p-5 flex flex-col gap-4 relative group transition-all duration-200"
              style={{
                background: 'hsl(224 25% 8%)',
                border: isLive
                  ? '1px solid hsl(258 50% 60% / 0.4)'
                  : '1px solid hsl(224 20% 13%)',
                boxShadow: isLive ? '0 0 30px hsl(258 100% 65% / 0.08)' : 'none',
              }}>

              {/* Live badge */}
              {isLive && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(142 70% 40% / 0.15)', border: '1px solid hsl(142 70% 40% / 0.3)', color: 'hsl(142 70% 60%)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </div>
              )}

              {/* Room icon + name */}
              <div className="flex items-start gap-3 pr-16">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${room.brand_color}22`, border: `1px solid ${room.brand_color}44` }}>
                  <QrCode className="w-5 h-5" style={{ color: room.brand_color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">flashroom.io/r/{room.slug}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-3 py-2" style={{ background: 'hsl(224 25% 10%)' }}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Users className="w-3 h-3" /> Participants
                  </div>
                  <div className="text-sm font-semibold">
                    {isLive ? activeSession.participant_count : 0}
                    <span className="text-muted-foreground font-normal">/{room.max_participants}</span>
                  </div>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: 'hsl(224 25% 10%)' }}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" /> Session
                  </div>
                  <div className="text-sm font-semibold">
                    {isLive ? timeLeft(activeSession.closes_at) : `${room.session_duration_minutes}m max`}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs font-semibold text-white border-0"
                  style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}
                  onClick={() => setQrRoom(room)}
                >
                  <QrCode className="w-3.5 h-3.5" /> View QR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs border-white/10 hover:bg-white/5"
                  onClick={() => handleToggleSession(room)}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isLive ? 'Close Session' : 'Open Session'}
                </Button>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 hover:bg-white/5"
                    onClick={() => setOpenMenuId(openMenuId === room.id ? null : room.id)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  {openMenuId === room.id && (
                    <div className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden min-w-36"
                      style={{ background: 'hsl(224 25% 10%)', border: '1px solid hsl(224 20% 16%)' }}>
                      <a
                        href={`/r/${room.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open room
                      </a>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete room
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={handleRoomCreated} />
      )}
      {qrRoom && (
        <RoomQRModal room={qrRoom} onClose={() => setQrRoom(null)} />
      )}
    </div>
  );
}
