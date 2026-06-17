"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Reward, DEFAULT_REWARDS } from "@/lib/rewards/types";

/**
 * Reward Shop state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load rewards from Supabase
  useEffect(() => {
    let active = true;

    async function loadRewards() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbRewards, error } = await supabase
          .from("user_rewards")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (active) {
          const unlockedMap = new Map(dbRewards?.map(r => [r.reward_id, r]));
          
          // Map default catalog onto database unlocked rewards
          const mappedRewards = DEFAULT_REWARDS.map((r) => {
            const dbReward = unlockedMap.get(r.id);
            if (dbReward) {
              return {
                ...r,
                unlocked: true,
                equipped: dbReward.equipped || false,
              };
            }
            return {
              ...r,
              unlocked: false,
              equipped: false,
            };
          });

          setRewards(mappedRewards);
        }
      } catch (err) {
        console.warn("Failed to load rewards from Supabase:", err);
        if (active) setRewards(DEFAULT_REWARDS);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadRewards();

    return () => {
      active = false;
    };
  }, []);

  const saveRewardToDb = useCallback(async (rewardId: string, unlocked: boolean, equipped: boolean) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (unlocked) {
        await supabase.from("user_rewards").upsert({
          user_id: user.id,
          reward_id: rewardId,
          equipped: equipped,
          unlocked_at: new Date().toISOString(),
        });
      } else {
        await supabase.from("user_rewards").delete().eq("user_id", user.id).eq("reward_id", rewardId);
      }
    } catch (err) {
      console.warn("Failed to save reward state to Supabase:", err);
    }
  }, []);

  /** Purchase a reward. Returns true if successful (enough XP). */
  const purchaseReward = useCallback(
    (rewardId: string, currentXp: number): boolean => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward || reward.unlocked || currentXp < reward.cost) return false;
      
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, unlocked: true } : r))
      );
      void saveRewardToDb(rewardId, true, false);
      return true;
    },
    [rewards, saveRewardToDb]
  );

  const equipReward = useCallback(
    (rewardId: string) => {
      setRewards((prev) => {
        const target = prev.find((r) => r.id === rewardId);
        if (!target || !target.unlocked) return prev;
        
        const nextRewards = prev.map((r) => {
          if (r.category !== target.category) return r;
          const isEquipped = r.id === rewardId ? !r.equipped : false;
          
          // Sync changes to Supabase in the background
          if (r.id === rewardId || r.equipped) {
            void saveRewardToDb(r.id, true, isEquipped);
          }
          
          return { ...r, equipped: isEquipped };
        });

        // Dispatch a custom event to notify layout
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("focura:rewards-updated"));
        }, 100);

        return nextRewards;
      });
    },
    [saveRewardToDb]
  );

  const unlockedRewards = rewards.filter((r) => r.unlocked);
  const shopRewards = rewards.filter((r) => !r.unlocked);

  return { rewards, unlockedRewards, shopRewards, loaded, purchaseReward, equipReward };
}
