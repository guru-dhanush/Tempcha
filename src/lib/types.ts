// ─── Database Types ────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  session_duration_minutes: number;
  auto_open_hour: number | null;
  auto_close_hour: number | null;
  welcome_message: string | null;
  brand_color: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  room_id: string;
  opened_at: string;
  closes_at: string;
  closed_at: string | null;
  participant_count: number;
  message_count: number;
  peak_participants: number;
}

export interface Message {
  id: string;
  session_id: string;
  alias: string;
  alias_color: string;
  content: string;
  is_staff: boolean;
  pinned: boolean;
  created_at: string;
  reactions?: Record<string, Reaction>;
}

export interface Participant {
  id: string;
  session_id: string;
  alias: string;
  alias_color: string;
  token: string;
  is_staff: boolean;
  joined_at: string;
  last_seen_at: string;
}

export interface Reaction {
  emoji: string;
  aliases: string[];
}

export interface ReportedMessage {
  id: string;
  message_id: string;
  session_id: string;
  reported_by_alias: string;
  message_content: string;
  message_alias: string;
  created_at: string;
}

export interface TypingIndicator {
  session_id: string;
  alias: string;
  updated_at: string;
}

// ─── API Types ─────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  status: number;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export type ApiResponse<T> = ApiSuccess<T> | { data: null; error: string };

// ─── Plan Types ────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'starter' | 'pro' | 'advanced';

export interface PlanLimits {
  qrLimit: number;
  maxParticipants: number;
  maxDurationMinutes: number;
  canCustomBrand: boolean;
  canExport: boolean;
  canSchedule: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:     { qrLimit: 1,   maxParticipants: 20,  maxDurationMinutes: 120,  canCustomBrand: false, canExport: false, canSchedule: false },
  starter:  { qrLimit: 5,   maxParticipants: 100, maxDurationMinutes: 720,  canCustomBrand: true,  canExport: false, canSchedule: true  },
  pro:      { qrLimit: 999, maxParticipants: 500, maxDurationMinutes: 9999, canCustomBrand: true,  canExport: true,  canSchedule: true  },
  advanced: { qrLimit: 999, maxParticipants: 500, maxDurationMinutes: 9999, canCustomBrand: true,  canExport: true,  canSchedule: true  },
};

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface RoomWithSessions extends Room {
  sessions: Session[];
}

export interface AliasData {
  alias: string;
  color: string;
}

export interface SavedSession {
  alias: AliasData;
  token: string;
}
