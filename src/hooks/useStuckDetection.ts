import { useEffect, useState } from "react";

/**
 * Detects whether the user is "stuck" and should be shown The Ritual.
 *
 * Triggers when ALL of these are true:
 *  1. User's account is ≥ 7 days old
 *  2. Current time is before 10 PM
 *  3. User has opened the app 3+ times today
 *  4. User has started 0 focus sessions today
 *  5. User has done < 2 rituals today
 */
export function useStuckDetection(): { shouldTrigger: boolean; loading: boolean } {
  const [shouldTrigger, setShouldTrigger] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setLoading(false);
          return;
        }

        // 1. Check account age — skip if < 7 days
        const accountCreated = new Date(user.created_at);
        const daysSinceCreation =
          (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          setLoading(false);
          return;
        }

        // 2. Not after 10 PM
        if (new Date().getHours() >= 22) {
          setLoading(false);
          return;
        }

        // 3-5. Fetch today's events
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data: todayEvents } = await supabase
          .from("user_app_events")
          .select("event_type")
          .eq("user_id", user.id)
          .gte("created_at", startOfToday.toISOString())
          .order("created_at", { ascending: true });

        if (cancelled) return;

        const events = todayEvents ?? [];

        const appOpens = events.filter(
          (e) => e.event_type === "app_opened"
        ).length;

        const sessionsStarted = events.filter(
          (e) => e.event_type === "session_started"
        ).length;

        const ritualsToday = events.filter(
          (e) => e.event_type === "ritual_started"
        ).length;

        const trigger =
          appOpens >= 3 && sessionsStarted === 0 && ritualsToday < 2;

        if (!cancelled) setShouldTrigger(trigger);
      } catch {
        // Silent — detection failure must never break the app.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { shouldTrigger, loading };
}
