'use client';

import { useState } from 'react';
import { QrCode, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const COLORS = ['#7C3AED', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626'];
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label:
    i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

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
  const [autoOpenHour, setAutoOpenHour] = useState<number | null>(null);
  const [autoCloseHour, setAutoCloseHour] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const durationLabel =
    duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
      : `${duration}m`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          welcomeMessage,
          duration,
          color,
          autoOpenHour,
          autoCloseHour,
        }),
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </div>
            <DialogTitle className="text-base font-semibold">Create New Room</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Room name */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground leading-5">
              Room name <span className="text-foreground">*</span>
            </Label>
            <Input
              className="border-border"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table 4, Main Stage, Lobby"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground leading-5">Description</Label>
            <Input
              className="border-border"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this room for?"
            />
          </div>

          {/* Welcome message */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground leading-5">Welcome message</Label>
            <Input
              className="border-border"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Shown to participants when they join"
            />
          </div>

          {/* Session duration */}
          <div className="space-y-2">
            <Label className="text-muted-foreground leading-5">
              Session duration:{' '}
              <span className="text-foreground font-medium">{durationLabel}</span>
            </Label>
            <input
              type="range"
              min={15}
              max={720}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15m</span>
              <span>12h</span>
            </div>
          </div>

          {/* Brand color */}
          <div className="space-y-2">
            <Label className="text-muted-foreground leading-5">Brand color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-md transition-transform hover:scale-110 border-2"
                  style={{ background: c, borderColor: color === c ? 'white' : 'transparent' }}
                />
              ))}
            </div>
          </div>

          {/* Auto-schedule toggle */}
          <div className="border-t border-border pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showSchedule ? 'rotate-90' : ''}`}
              />
              Auto-schedule sessions (optional)
            </button>

            {showSchedule && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Auto-open at</Label>
                  <select
                    value={autoOpenHour ?? ''}
                    onChange={(e) =>
                      setAutoOpenHour(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-md px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Manual only</option>
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Auto-close at</Label>
                  <select
                    value={autoCloseHour ?? ''}
                    onChange={(e) =>
                      setAutoCloseHour(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full rounded-md px-3 py-2 text-sm bg-muted border border-border text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Use duration</option>
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Session will automatically open and close at these times daily.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
