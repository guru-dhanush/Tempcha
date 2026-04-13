'use client';

import { useState } from 'react';
import { QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { RoomFormFields, type RoomFormValues, ROOM_COLORS } from '@/components/rooms/room-form-fields';

const DEFAULT_VALUES: RoomFormValues = {
  name: '',
  description: '',
  welcomeMessage: '',
  duration: 120,
  color: ROOM_COLORS[0],
  autoOpenHour: null,
  autoCloseHour: null,
};

interface Props {
  onClose: () => void;
  onCreated: (room: any) => void;
}

export function CreateRoomModal({ onClose, onCreated }: Props) {
  const [values, setValues] = useState<RoomFormValues>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (patch: Partial<RoomFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description,
          welcomeMessage: values.welcomeMessage,
          duration: values.duration,
          color: values.color,
          autoOpenHour: values.autoOpenHour,
          autoCloseHour: values.autoCloseHour,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base">Create new room</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                A permanent QR code that starts a fresh chat every session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2">
            <RoomFormFields values={values} onChange={handleChange} />
          </div>

          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={loading || !values.name.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
