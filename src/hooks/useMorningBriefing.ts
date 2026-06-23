"use client";

import { useState, useEffect } from "react";

/**
 * Shows the morning briefing modal once per calendar day.
 * Stored in localStorage — no Supabase call needed.
 */
export function useMorningBriefing() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only runs client-side
    const today = new Date().toDateString();
    const stored = localStorage.getItem("focura_last_briefing");
    if (stored !== today) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem("focura_last_briefing", today);
    setShow(false);
  };

  return { show, dismiss };
}
