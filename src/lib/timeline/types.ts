// ── Timeline Types ─────────────────────────────────────────────────────────

export type BlockType = "focus" | "life";
export type BlockStatus = "planned" | "active" | "completed" | "overran" | "skipped";
export type TimelineLayer = "plan" | "actual" | "both";

export interface PauseSegment {
  startOffsetSeconds: number;
  durationSeconds: number;
}

export interface TimelineBlock {
  id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  block_type: BlockType;
  task_id?: string | null;
  life_category?: string | null;
  life_label?: string | null;
  life_emoji?: string | null;
  start_time: string; // "HH:MM:SS"
  planned_duration_minutes: number;
  actual_duration_minutes?: number | null;
  status: BlockStatus;
  position_order: number;
  layer: "plan" | "actual";
  pauses?: PauseSegment[] | null;
  created_at: string;
  updated_at: string;
}

export interface DayTemplate {
  id: string;
  user_id: string;
  name: string;
  blocks: DayTemplateBlock[];
  created_at: string;
}

export interface DayTemplateBlock {
  block_type: BlockType;
  life_category?: string;
  life_label?: string;
  life_emoji?: string;
  start_time: string;
  planned_duration_minutes: number;
}

export interface TimelineUserPrefs {
  wake_hour: number;
  sleep_hour: number;
  timeline_setup_done: boolean;
}

// ── Life Categories ────────────────────────────────────────────────────────

export interface LifeCategory {
  id: string;
  emoji: string;
  label: string;
  defaultDurationMinutes: number;
  color: string;
}

export const LIFE_CATEGORIES: LifeCategory[] = [
  { id: "morning-routine", emoji: "🌅", label: "Morning Routine", defaultDurationMinutes: 30, color: "rgba(240,168,104,0.12)" },
  { id: "breakfast",       emoji: "🍳", label: "Breakfast",       defaultDurationMinutes: 20, color: "rgba(240,168,104,0.12)" },
  { id: "shower",          emoji: "🚿", label: "Shower / Getting Ready", defaultDurationMinutes: 20, color: "rgba(240,168,104,0.12)" },
  { id: "commute",         emoji: "🚗", label: "Commute",          defaultDurationMinutes: 30, color: "rgba(240,168,104,0.12)" },
  { id: "lunch",           emoji: "🍱", label: "Lunch",            defaultDurationMinutes: 45, color: "rgba(240,168,104,0.12)" },
  { id: "gym",             emoji: "🏋️", label: "Gym / Exercise",   defaultDurationMinutes: 60, color: "rgba(240,168,104,0.12)" },
  { id: "walk",            emoji: "🚶", label: "Walk",             defaultDurationMinutes: 20, color: "rgba(240,168,104,0.12)" },
  { id: "dinner",          emoji: "🍽️", label: "Dinner",           defaultDurationMinutes: 45, color: "rgba(240,168,104,0.12)" },
  { id: "break",           emoji: "📱", label: "Break / Rest",     defaultDurationMinutes: 15, color: "rgba(240,168,104,0.12)" },
  { id: "sleep",           emoji: "😴", label: "Sleep / Nap",      defaultDurationMinutes: 480, color: "rgba(240,168,104,0.12)" },
];

// ── Priority Color Helpers ─────────────────────────────────────────────────

export const PRIORITY_BORDER_COLOR: Record<string, string> = {
  critical: "#e11d48", // Crimson Rose
  high:     "#ea580c", // Rust/Orange
  medium:   "#d97706", // Bronze/Amber
  low:      "#78716c", // Muted Stone
};

export const PRIORITY_TAG_COLOR: Record<string, string> = {
  critical: "rgba(225,29,72,0.15)",
  high:     "rgba(234,88,12,0.15)",
  medium:   "rgba(217,119,6,0.15)",
  low:      "rgba(120,113,108,0.12)",
};

// ── Time Helpers ───────────────────────────────────────────────────────────

/** "HH:MM:SS" → total minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** total minutes since midnight → "HH:MM:SS" */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** Snap minutes to nearest 15-minute interval */
export function snapToQuarter(mins: number): number {
  return Math.round(mins / 15) * 15;
}

/** Format time label "6:00 AM" */
export function formatHourLabel(hour: number): string {
  const ampm = hour < 12 ? "AM" : "PM";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:00 ${ampm}`;
}

/** Format duration pill "1h 30m" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Format countdown "18:32" */
export function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(Math.max(0, secondsLeft) / 60);
  const s = Math.max(0, secondsLeft) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" from a Date */
export function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}
