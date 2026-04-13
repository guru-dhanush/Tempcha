'use client';

import { useState } from 'react';
import { ChevronDown, Users, User, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { RoomType, RetentionPolicy } from '@/lib/types';

export const ROOM_COLORS = [
  '#7C3AED', '#2563EB', '#0891B2', '#059669',
  '#D97706', '#DC2626', '#9333EA', '#0D9488',
];

export const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

export interface RoomFormValues {
  name:          string;
  description:   string;
  welcomeMessage:string;
  duration:      number;
  color:         string;
  autoOpenHour:  number | null;
  autoCloseHour: number | null;
  roomType:      RoomType;
  retentionPolicy: RetentionPolicy;
}

interface Props {
  values:   RoomFormValues;
  onChange: (patch: Partial<RoomFormValues>) => void;
}

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Mode option card ──────────────────────────────────────────────
interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function ModeCard({ icon, title, description, selected, onClick }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150 w-full',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-background hover:border-border/80 hover:bg-muted/30',
      )}
    >
      {/* Radio dot */}
      <div className={cn(
        'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
        selected ? 'border-primary' : 'border-muted-foreground/40',
      )}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      {/* Icon */}
      <div className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
        selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}>
        {icon}
      </div>
      {/* Text */}
      <div className="min-w-0">
        <p className={cn(
          'text-sm font-semibold leading-tight',
          selected ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
      </div>
    </button>
  );
}

// ─── Retention pill ────────────────────────────────────────────────
interface RetentionPillProps {
  label: string;
  sublabel: string;
  selected: boolean;
  onClick: () => void;
}

function RetentionPill({ label, sublabel, selected, onClick }: RetentionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2.5 px-3 rounded-lg border text-center transition-all duration-150',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-background hover:bg-muted/30',
      )}
    >
      <p className={cn('text-xs font-semibold', selected ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────
export function RoomFormFields({ values, onChange }: Props) {
  const [showSchedule, setShowSchedule] = useState(
    values.autoOpenHour !== null || values.autoCloseHour !== null,
  );

  return (
    <div className="space-y-6">

      {/* ── Room name ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="room-name" className="text-sm font-medium">
          Room name <span className="text-muted-foreground font-normal">(required)</span>
        </Label>
        <Input
          id="room-name"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Table 4, Main Stage, Lobby"
          maxLength={60}
          required
        />
      </div>

      {/* ── Description ───────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="room-description" className="text-sm font-medium text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="room-description"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What is this room for?"
          maxLength={200}
          rows={2}
        />
      </div>

      {/* ── Welcome message ───────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="room-welcome" className="text-sm font-medium text-muted-foreground">
          Welcome message
        </Label>
        <Input
          id="room-welcome"
          value={values.welcomeMessage}
          onChange={(e) => onChange({ welcomeMessage: e.target.value })}
          placeholder="Shown to participants when they join"
          maxLength={300}
        />
      </div>

      {/* ── Chat mode ─────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <Label className="text-sm font-medium">Chat mode</Label>
        <div className="flex flex-col gap-2">
          <ModeCard
            icon={<User className="w-3.5 h-3.5" strokeWidth={1.5} />}
            title="Solo — private only"
            description="Each participant gets a private 1:1 thread with you. Nobody sees anyone else's messages."
            selected={values.roomType === 'private'}
            onClick={() => onChange({ roomType: 'private' })}
          />
          <ModeCard
            icon={<Users className="w-3.5 h-3.5" strokeWidth={1.5} />}
            title="Group — everyone sees"
            description="All participants are in one shared room. Great for Q&A, classrooms, and table chat."
            selected={values.roomType === 'group'}
            onClick={() => onChange({ roomType: 'group' })}
          />
          <ModeCard
            icon={<LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />}
            title="Hybrid — participant chooses"
            description="When someone joins, they pick: join the group chat or send you a private message."
            selected={values.roomType === 'hybrid'}
            onClick={() => onChange({ roomType: 'hybrid' })}
          />
        </div>
      </div>

      {/* ── Retention ─────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Message retention</Label>
          <span className="text-xs text-muted-foreground">
            {values.retentionPolicy === 'ephemeral' && 'Deleted on session close'}
            {values.retentionPolicy === '24h'       && 'Deleted after 24 hours'}
            {values.retentionPolicy === '7d'        && 'Deleted after 7 days'}
            {values.retentionPolicy === 'permanent' && 'Never deleted'}
          </span>
        </div>
        <div className="flex gap-2">
          <RetentionPill
            label="Temporary"
            sublabel="On close"
            selected={values.retentionPolicy === 'ephemeral'}
            onClick={() => onChange({ retentionPolicy: 'ephemeral' })}
          />
          <RetentionPill
            label="24 hours"
            sublabel="Then deleted"
            selected={values.retentionPolicy === '24h'}
            onClick={() => onChange({ retentionPolicy: '24h' })}
          />
          <RetentionPill
            label="7 days"
            sublabel="Then deleted"
            selected={values.retentionPolicy === '7d'}
            onClick={() => onChange({ retentionPolicy: '7d' })}
          />
          <RetentionPill
            label="Keep"
            sublabel="Permanent"
            selected={values.retentionPolicy === 'permanent'}
            onClick={() => onChange({ retentionPolicy: 'permanent' })}
          />
        </div>
      </div>

      {/* ── Session duration ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">Session duration</Label>
          <span className="text-sm font-semibold tabular-nums">{durationLabel(values.duration)}</span>
        </div>
        <input
          type="range" min={15} max={720} step={15}
          value={values.duration}
          onChange={(e) => onChange({ duration: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15m</span><span>12h</span>
        </div>
      </div>

      {/* ── Brand color ───────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <Label className="text-sm font-medium text-muted-foreground">Brand color</Label>
        <div className="flex gap-2 flex-wrap">
          {ROOM_COLORS.map((c) => (
            <button
              key={c} type="button"
              onClick={() => onChange({ color: c })}
              aria-label={c}
              className={cn(
                'w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 ring-offset-background ring-offset-2',
                values.color === c && 'ring-2 ring-white',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* ── Auto-schedule ─────────────────────────────────────────── */}
      <div className="border-t border-border pt-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowSchedule((v) => !v)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', showSchedule && 'rotate-180')} />
          Auto-schedule sessions
          <span className="ml-auto text-xs text-muted-foreground/60">optional</span>
        </button>

        {showSchedule && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Auto-open at</Label>
              <select
                value={values.autoOpenHour ?? ''}
                onChange={(e) => onChange({ autoOpenHour: e.target.value !== '' ? Number(e.target.value) : null })}
                className="w-full h-9 rounded-md px-3 text-sm bg-background border border-input text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-colors"
              >
                <option value="">Manual only</option>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Auto-close at</Label>
              <select
                value={values.autoCloseHour ?? ''}
                onChange={(e) => onChange({ autoCloseHour: e.target.value !== '' ? Number(e.target.value) : null })}
                className="w-full h-9 rounded-md px-3 text-sm bg-background border border-input text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-colors"
              >
                <option value="">Use duration</option>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <p className="col-span-2 text-xs text-muted-foreground leading-relaxed">
              Session opens and closes automatically at these times every day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
