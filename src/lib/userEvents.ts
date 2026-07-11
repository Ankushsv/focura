import { createClient } from "@/lib/supabase/client";

/**
 * Log a user event to the `user_app_events` table.
 * Fire-and-forget — errors are silently swallowed so callers
 * never need to handle failures.
 */
export async function logUserEvent(
  eventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_app_events").insert({
      user_id: user.id,
      event_type: eventType,
      metadata,
    });
  } catch (err) {
    // Intentionally silent — event logging must never break the app.
    console.warn("Failed to log user event:", err);
  }
}
