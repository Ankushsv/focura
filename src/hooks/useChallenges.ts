"use client";

import { useCallback, useEffect, useState } from "react";
import { type Challenge, seedChallenges } from "@/lib/challenges/types";

const STORE_KEY = "focura.challenges.v1";
const EXPIRY_KEY = "focura.challenges.expiry.v1";

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
      const now = Date.now();
      if (now > expiry) {
        // Weekly reset
        const fresh = seedChallenges();
        setChallenges(fresh);
        localStorage.setItem(EXPIRY_KEY, String(fresh[0]?.expiresAt ?? 0));
      } else {
        const raw = localStorage.getItem(STORE_KEY);
        setChallenges(raw ? (JSON.parse(raw) as Challenge[]) : seedChallenges());
      }
    } catch {
      setChallenges(seedChallenges());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(challenges));
  }, [challenges, loaded]);

  /** Increment progress for a challenge category. Returns XP earned if newly completed. */
  const incrementProgress = useCallback(
    (challengeId: string, amount = 1): number => {
      let xpEarned = 0;
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== challengeId || c.claimed) return c;
          const newProgress = Math.min(c.progress + amount, c.target);
          return { ...c, progress: newProgress };
        })
      );
      return xpEarned;
    },
    []
  );

  /** Claim reward for a completed challenge. Returns XP amount. */
  const claimChallenge = useCallback((challengeId: string): number => {
    let xp = 0;
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== challengeId || c.claimed || c.progress < c.target) return c;
        xp = c.xpReward;
        return { ...c, claimed: true };
      })
    );
    return xp;
  }, []);

  return { challenges, loaded, incrementProgress, claimChallenge };
}
