export type FocusSession = {
  id: string;
  taskId: string | null;
  taskTitle: string;
  plannedMinutes: number;
  actualMinutes: number;
  endedAt: number;
};

const KEY = "focura.sessions.v1";

/** Session history for Focus Memory (issue #11). Maps onto focus_sessions in Supabase. */
export function getSessions(): FocusSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FocusSession[];
  } catch {
    return [];
  }
}

export function logSession(session: Omit<FocusSession, "id">) {
  try {
    const all = getSessions();
    all.unshift({ id: Math.random().toString(36).slice(2, 10), ...session });
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 500)));
  } catch {
    /* storage unavailable */
  }
}
