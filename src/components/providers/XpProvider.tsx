"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { bus } from "@/lib/events";
import { levelFromXp } from "@/lib/xp/levels";

type Orb = { id: number; amount: number };

type XpContextValue = {
  totalXp: number;
  level: number;
  awardXp: (amount: number, source: string) => void;
};

const XpContext = createContext<XpContextValue | null>(null);

let orbId = 0;

/**
 * Global XP engine — the single source of truth for awarding XP.
 * Emits `xp:awarded` and `level:up` on the event bus and renders floating
 * XP orbs. Persists events to Supabase when a session exists.
 */
export function XpProvider({ children }: { children: React.ReactNode }) {
  const [totalXp, setTotalXp] = useState(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const level = levelFromXp(totalXp);

  // Load XP from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("focura.xp.v1");
    if (saved) {
      setTotalXp(parseInt(saved, 10) || 0);
    }
  }, []);

  const awardXp = useCallback((amount: number, source: string) => {
    setTotalXp((prev) => {
      const total = prev + amount;
      localStorage.setItem("focura.xp.v1", total.toString());
      const newLevel = levelFromXp(total);
      bus.emit("xp:awarded", { amount, source, total, level: newLevel });
      if (newLevel > levelFromXp(prev)) bus.emit("level:up", { level: newLevel });
      return total;
    });
    setOrbs((o) => [...o, { id: ++orbId, amount }]);
    void persist(amount, source);
  }, []);

  return (
    <XpContext.Provider value={{ totalXp, level, awardXp }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 right-10 z-50">
        {orbs.map((orb) => (
          <span
            key={orb.id}
            className="xp-orb absolute right-0 whitespace-nowrap rounded-full bg-xp px-3 py-1 text-sm font-bold text-black shadow-lg shadow-xp/40"
            onAnimationEnd={() => setOrbs((o) => o.filter((x) => x.id !== orb.id))}
          >
            +{orb.amount} XP
          </span>
        ))}
      </div>
    </XpContext.Provider>
  );
}

async function persist(amount: number, source: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("xp_events")
      .insert({ user_id: data.user.id, source_module: source, amount });
  } catch {
    // Offline-friendly: XP still works locally without persistence.
  }
}

export function useXp() {
  const ctx = useContext(XpContext);
  if (!ctx) throw new Error("useXp must be used within XpProvider");
  return ctx;
}
