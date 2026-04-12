'use client';

import { useState } from 'react';
import { X, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#DC2626'];

interface Props {
  onClose: () => void;
  onCreated: (room: any) => void;
}

export function CreateRoomModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [duration, setDuration] = useState(120);
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, welcomeMessage, duration, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      onCreated(data.room);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(224 30% 5% / 0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'hsl(224 25% 8%)', border: '1px solid hsl(224 20% 14%)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(258 100% 65% / 0.2), hsl(220 100% 60% / 0.1))', border: '1px solid hsl(258 50% 60% / 0.2)' }}>
              <QrCode className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold">Create New Room</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Room name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Table 4, Main Stage, Room 201"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this room for?"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Welcome message</label>
            <input
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value)}
              placeholder="Shown to participants when they join"
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Session duration: <span className="text-foreground">{duration >= 60 ? `${Math.floor(duration/60)}h ${duration%60 > 0 ? `${duration%60}m` : ''}` : `${duration}m`}</span>
            </label>
            <input
              type="range" min={15} max={720} step={15}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15m</span><span>12h</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Brand color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10 hover:bg-white/5">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 text-white border-0 hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
