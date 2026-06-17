"use client";

import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
 * Fetches and saves directly to Supabase profiles. Removes local storage.
 */
export function XpProvider({ children }: { children: React.ReactNode }) {
  const [totalXp, setTotalXp] = useState(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const level = levelFromXp(totalXp);

  // Load XP from Supabase on mount
  useEffect(() => {
    async function loadXp() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp")
          .eq("id", user.id)
          .single();

        if (profile?.total_xp) {
          setTotalXp(profile.total_xp);
        }
      } catch (err) {
        console.warn("Failed to load XP from Supabase profiles:", err);
      }
    }
    loadXp();
  }, []);

  const awardXp = useCallback((amount: number, source: string) => {
    setTotalXp((prev) => {
      const total = prev + amount;
      const newLevel = levelFromXp(total);
      
      // Update database asynchronously
      void (async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Update profiles total_xp and level
          await supabase
            .from("profiles")
            .update({ total_xp: total, level: newLevel })
            .eq("id", user.id);

          // Log XP Event
          await supabase
            .from("xp_events")
            .insert({ user_id: user.id, source_module: source, amount });
        } catch (err) {
          console.warn("Failed to save XP event to Supabase:", err);
        }
      })();

      bus.emit("xp:awarded", { amount, source, total, level: newLevel });
      if (newLevel > levelFromXp(prev)) bus.emit("level:up", { level: newLevel });
      return total;
    });
    setOrbs((o) => [...o, { id: ++orbId, amount }]);
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

export function useXp() {
  const ctx = useContext(XpContext);
  if (!ctx) throw new Error("useXp must be used within XpProvider");
  return ctx;
}
