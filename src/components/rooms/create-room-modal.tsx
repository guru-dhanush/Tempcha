'use client';
import { useState } from 'react';
import { X, QrCode, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626'];
const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM` }));

interface Props { onClose: () => void; onCreated: (room: any) => void; }

export function CreateRoomModal({ onClose, onCreated }: Props) {
  const [name, setName]                 = useState('');
  const [description, setDescription]   = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [duration, setDuration]         = useState(120);
  const [color, setColor]               = useState(COLORS[0]);
  const [autoOpenHour, setAutoOpenHour] = useState<number | null>(null);
  const [autoCloseHour, setAutoCloseHour] = useState<number | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, welcomeMessage, duration, color, autoOpenHour, autoCloseHour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      onCreated(data.room);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><QrCode className="w-4 h-4" /></div>
            <h2 className="text-lg font-semibold">Create New Room</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Room name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Table 4, Main Stage, Lobby" required
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this room for?"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Welcome message</label>
            <input value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} placeholder="Shown to participants when they join"
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Session duration: <span className="text-primary">{duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ''}` : `${duration}m`}</span></label>
            <input type="range" min={15} max={720} step={15} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>15m</span><span>12h</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Brand color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110 border-2"
                  style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }} />
              ))}
            </div>
          </div>

          {/* Scheduling toggle */}
          <div className="border-t border-border pt-4">
            <button type="button" onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSchedule ? 'rotate-90' : ''}`} />
              Auto-schedule sessions (optional)
            </button>

            {showSchedule && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Auto-open at</label>
                  <select value={autoOpenHour ?? ''} onChange={e => setAutoOpenHour(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary">
                    <option value="">Manual only</option>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Auto-close at</label>
                  <select value={autoCloseHour ?? ''} onChange={e => setAutoCloseHour(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary">
                    <option value="">Use duration</option>
                    {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">Session will automatically open and close at these times daily.</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
