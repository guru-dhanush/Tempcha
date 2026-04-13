'use client';

import { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { RoomFormFields, type RoomFormValues } from '@/components/rooms/room-form-fields';
import type { Room } from '@/lib/types';

interface Props {
  room: Room;
  onClose: () => void;
  onUpdated: (room: Room) => void;
}

export function EditRoomModal({ room, onClose, onUpdated }: Props) {
  const [values, setValues] = useState<RoomFormValues>({
    name: room.name,
    description: room.description ?? '',
    welcomeMessage: room.welcome_message ?? '',
    duration: room.session_duration_minutes,
    color: room.brand_color,
    autoOpenHour: room.auto_open_hour ?? null,
    autoCloseHour: room.auto_close_hour ?? null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (patch: Partial<RoomFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base">Edit room</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Changes apply to future sessions only.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2">
            <RoomFormFields values={values} onChange={handleChange} />
          </div>

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
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
