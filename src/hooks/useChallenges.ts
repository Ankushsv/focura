"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Challenge, seedChallenges } from "@/lib/challenges/types";

/**
 * Weekly Challenges state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load and reset challenges from Supabase
  useEffect(() => {
    let active = true;

    async function loadChallenges() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbChallenges, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        const now = Date.now();
        const firstExp = dbChallenges && dbChallenges[0] ? new Date(dbChallenges[0].expires_at).getTime() : 0;

        // Reset if empty or expired
        if (!dbChallenges || dbChallenges.length === 0 || now > firstExp) {
          if (dbChallenges && dbChallenges.length > 0) {
            // Delete expired challenges
            await supabase.from("challenges").delete().eq("user_id", user.id);
          }

          const fresh = seedChallenges();
          const dbPayloads = fresh.map((c) => ({
            id: c.id,
            user_id: user.id,
            title: c.title,
            description: c.description || null,
            category: c.category,
            icon: c.icon || null,
            target: c.target,
            progress: c.progress,
            xp_reward: c.xpReward,
            claimed: c.claimed,
            expires_at: new Date(c.expiresAt).toISOString(),
            created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
          }));

          await supabase.from("challenges").insert(dbPayloads);
          
          if (active) setChallenges(fresh);
        } else {
          if (active) {
            const mapped = dbChallenges.map((c: any) => ({
              id: c.id,
              title: c.title,
              description: c.description || "",
              category: c.category,
              icon: c.icon || "⚔️",
              target: c.target,
              progress: c.progress,
              xpReward: c.xp_reward,
              claimed: c.claimed || false,
              expiresAt: new Date(c.expires_at).getTime(),
              createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
            }));
            setChallenges(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to load challenges from Supabase:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadChallenges();

    return () => {
      active = false;
    };
  }, []);

  const saveChallengeToDb = useCallback(async (challenge: Challenge) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("challenges").upsert({
        id: challenge.id,
        user_id: user.id,
        title: challenge.title,
        description: challenge.description || null,
        category: challenge.category,
        icon: challenge.icon || null,
        target: challenge.target,
        progress: challenge.progress,
        xp_reward: challenge.xpReward,
        claimed: challenge.claimed,
        expires_at: new Date(challenge.expiresAt).toISOString(),
        created_at: challenge.createdAt ? new Date(challenge.createdAt).toISOString() : new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed to save challenge to Supabase:", err);
    }
  }, []);

  /** Increment progress for a challenge category. */
  const incrementProgress = useCallback(
    (challengeId: string, amount = 1): number => {
      let xpEarned = 0;
      let targetChallenge: Challenge | null = null;
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== challengeId || c.claimed) return c;
          const newProgress = Math.min(c.progress + amount, c.target);
          targetChallenge = { ...c, progress: newProgress };
          return targetChallenge;
        })
      );
      if (targetChallenge) {
        void saveChallengeToDb(targetChallenge);
      }
      return xpEarned;
    },
    [saveChallengeToDb]
  );

  /** Claim reward for a completed challenge. Returns XP amount. */
  const claimChallenge = useCallback(
    (challengeId: string): number => {
      let xp = 0;
      let targetChallenge: Challenge | null = null;
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== challengeId || c.claimed || c.progress < c.target) return c;
          xp = c.xpReward;
          targetChallenge = { ...c, claimed: true };
          return targetChallenge;
        })
      );
      if (targetChallenge) {
        void saveChallengeToDb(targetChallenge);
      }
      return xp;
    },
    [saveChallengeToDb]
  );

  return { challenges, loaded, incrementProgress, claimChallenge };
}
