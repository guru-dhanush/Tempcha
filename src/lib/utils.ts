import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PlanTier } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Time utils ────────────────────────────────────────────────────────────────

export function formatTimeLeft(closesAt: string): string | null {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ─── Alias generation ──────────────────────────────────────────────────────────

const ADJECTIVES = ['Teal','Amber','Silver','Coral','Jade','Crimson','Azure','Golden','Violet','Sage','Rose','Onyx','Cobalt','Ivory','Scarlet','Indigo','Russet','Emerald'];
const ANIMALS    = ['Falcon','Wolf','Fox','Hawk','Lynx','Bear','Eagle','Tiger','Owl','Crane','Raven','Stag','Panda','Viper','Bison','Heron','Mink','Kite'];
const COLORS     = ['#7C3AED','#2563EB','#0891B2','#059669','#D97706','#9333EA','#0284C7','#16A34A','#B45309','#DC2626','#0D9488','#7C3AED'];

export function generateAlias(): { alias: string; color: string } {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { alias: `${adj} ${animal}`, color };
}

// ─── Profanity filter ──────────────────────────────────────────────────────────

const BAD_WORDS = ['spam', 'scam'];

export function filterProfanity(text: string): string {
  return BAD_WORDS.reduce(
    (t, w) => t.replace(new RegExp(`\\b${w}\\b`, 'gi'), '*'.repeat(w.length)),
    text
  );
}

// ─── Slugify ───────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return (
    name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 40) +
    '-' +
    Math.random().toString(36).substring(2, 6)
  );
}

// ─── Plan resolution ───────────────────────────────────────────────────────────

export function resolvePlanTier(priceId: string | null | undefined): PlanTier {
  if (!priceId) return 'free';
  if (priceId.includes('hsxycme') || priceId.includes('hsxyeb')) return 'starter';
  if (priceId.includes('hsxyff') || priceId.includes('hsxyfys')) return 'pro';
  return 'starter'; // fallback for any active sub
}

// ─── Sound ────────────────────────────────────────────────────────────────────

export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio API not available — silent fail
  }
}

// ─── Local storage helpers ────────────────────────────────────────────────────

import type { SavedSession } from './types';

export function saveAliasToStorage(roomId: string, data: SavedSession): void {
  try { localStorage.setItem(`fr_alias_${roomId}`, JSON.stringify(data)); } catch { /* ignore */ }
}

export function loadAliasFromStorage(roomId: string): SavedSession | null {
  try {
    const raw = localStorage.getItem(`fr_alias_${roomId}`);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch { return null; }
}

export function clearAliasFromStorage(roomId: string): void {
  try { localStorage.removeItem(`fr_alias_${roomId}`); } catch { /* ignore */ }
}
