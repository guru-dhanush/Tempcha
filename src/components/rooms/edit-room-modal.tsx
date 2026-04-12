'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Room } from '@/lib/types';

const COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626','#9333EA','#0D9488'];
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

interface Props {
  room: Room;
  onClose: () => void;
  onUpdated: (room: Room) => void;
}

export function EditRoomModal({ room, onClose, onUpdated }: Props) {
  const [name, setName]           = useState(room.name);
  const [description, setDesc]    = useState(room.description ?? '');
  const [welcome, setWelcome]     = useState(room.welcome_message ?? '');
  const [duration, setDuration]   = useState(room.session_duration_minutes);
  const [color, setColor]         = useState(room.brand_color);
  const [autoOpen, setAutoOpen]   = useState<number | ''>(room.auto_open_hour ?? '');
  const [autoClose, setAutoClose] = useState<number | ''>(room.auto_close_hour ?? '');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          welcomeMessage: welcome,
          duration,
          color,
          autoOpenHour: autoOpen === '' ? null : autoOpen,
          autoCloseHour: autoClose === '' ? null : autoClose,
        }),
      });
      const data = await res.json() as { room?: Room; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      toast.success('Room updated');
      onUpdated(data.room!);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold">Edit Room</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Room name *</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={60} required
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
            <input value={description} onChange={e => setDesc(e.target.value)} maxLength={200} placeholder="What is this room for?"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Welcome message</label>
            <input value={welcome} onChange={e => setWelcome(e.target.value)} maxLength={300} placeholder="Shown to participants on join"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Session duration: <span className="text-foreground font-semibold">{duration >= 60 ? `${Math.floor(duration/60)}h${duration%60>0?` ${duration%60}m`:''}` : `${duration}m`}</span>
            </label>
            <input type="range" min={15} max={720} step={15} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>15m</span><span>12h</span></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Brand color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-110 border-2"
                  style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Auto-open</label>
              <select value={autoOpen} onChange={e => setAutoOpen(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary">
                <option value="">Manual</option>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Auto-close</label>
              <select value={autoClose} onChange={e => setAutoClose(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary">
                <option value="">Use duration</option>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
