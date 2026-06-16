"use client";

import { useCallback, useEffect, useState } from "react";
import { type Reward, DEFAULT_REWARDS } from "@/lib/rewards/types";

const STORE_KEY = "focura.rewards.v1";

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        setRewards(JSON.parse(raw) as Reward[]);
      } else {
        setRewards(DEFAULT_REWARDS);
      }
    } catch {
      setRewards(DEFAULT_REWARDS);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(rewards));
  }, [rewards, loaded]);

  /** Purchase a reward. Returns true if successful (enough XP). */
  const purchaseReward = useCallback(
    (rewardId: string, currentXp: number): boolean => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward || reward.unlocked || currentXp < reward.cost) return false;
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, unlocked: true } : r))
      );
      return true;
    },
    [rewards]
  );

  const equipReward = useCallback((rewardId: string) => {
    setRewards((prev) => {
      const target = prev.find((r) => r.id === rewardId);
      if (!target || !target.unlocked) return prev;
      const nextRewards = prev.map((r) => {
        if (r.category !== target.category) return r;
        return { ...r, equipped: r.id === rewardId ? !r.equipped : false };
      });

      // Save to localStorage immediately so that it is readable by the layout
      localStorage.setItem(STORE_KEY, JSON.stringify(nextRewards));

      // Dispatch a custom event to notify layout
      window.dispatchEvent(new CustomEvent("focura:rewards-updated"));

      return nextRewards;
    });
  }, []);

  const unlockedRewards = rewards.filter((r) => r.unlocked);
  const shopRewards = rewards.filter((r) => !r.unlocked);

  return { rewards, unlockedRewards, shopRewards, loaded, purchaseReward, equipReward };
}
