import { createClient } from "@/lib/supabase/client";

export type FocusSession = {
  id: string;
  taskId: string | null;
  taskTitle: string;
  plannedMinutes: number;
  actualMinutes: number;
  endedAt: number;
};

export async function logSession(session: Omit<FocusSession, "id">) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("sessions").insert({
      user_id: user.id,
      task_id: session.taskId || null,
      task_title: session.taskTitle,
      planned_minutes: session.plannedMinutes,
      actual_minutes: session.actualMinutes,
      ended_at: new Date(session.endedAt).toISOString()
    });
  } catch (err) {
    console.warn("Failed to log focus session to Supabase:", err);
  }
}

