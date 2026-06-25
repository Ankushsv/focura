"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Shows the morning briefing modal once per calendar day,
 * only after the user's configured wake up hour.
 */
export function useMorningBriefing() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function checkBriefing() {
      // Only runs client-side
      const today = new Date().toDateString();
      const stored = localStorage.getItem("focura_last_briefing");
      if (stored === today) {
        return;
      }

      const currentHour = new Date().getHours();
      let wakeHour = 6; // Default fallback

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("wake_hour")
            .eq("id", user.id)
            .single();

          if (profile && typeof profile.wake_hour === "number") {
            wakeHour = profile.wake_hour;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch wake hour for morning briefing, using default:", err);
      }

      if (currentHour >= wakeHour) {
        setShow(true);
      }
    }

    checkBriefing();
  }, []);

  const dismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem("focura_last_briefing", today);
    setShow(false);
  };

  return { show, dismiss };
}
