import { bus, RewardTier, RewardRollResult } from "./events";
export type { RewardTier, RewardRollResult };

export const rollReward = (baseXp: number): RewardRollResult => {
  const roll = Math.random();
  
  // 60% chance: base reward
  if (roll < 0.60) {
    return {
      tier: 'base',
      multiplier: 1,
      message: `+${baseXp} XP`,
      effect: 'normal'
    };
  }
  
  // 25% chance: bonus (1.5x)
  if (roll < 0.85) {
    return {
      tier: 'bonus', 
      multiplier: 1.5,
      message: `+${Math.round(baseXp * 1.5)} XP · Bonus!`,
      effect: 'enhanced'
    };
  }
  
  // 12% chance: rare (2x)
  if (roll < 0.97) {
    return {
      tier: 'rare',
      multiplier: 2,
      message: `+${baseXp * 2} XP · Rare drop!`,
      effect: 'spectacular'
    };
  }
  
  // 3% chance: legendary (3x)
  return {
    tier: 'legendary',
    multiplier: 3,
    message: `+${baseXp * 3} XP · LEGENDARY!`,
    effect: 'spectacular'
  };
};

export function handleRewardRoll(
  baseXp: number,
  source: string,
  awardXpFn: (amount: number, source: string) => void
): RewardRollResult {
  const result = rollReward(baseXp);
  const totalXp = Math.round(baseXp * result.multiplier);
  
  // Award the multiplier XP
  awardXpFn(totalXp, source);
  
  // Log user event with reward_tier metadata
  void (async () => {
    try {
      const { logUserEvent } = await import("./userEvents");
      await logUserEvent("reward_roll", {
        source_module: source,
        reward_tier: result.tier,
        multiplier: result.multiplier,
        base_xp: baseXp,
        total_xp: totalXp,
        message: result.message
      });
    } catch {}
  })();
  
  // Emit event for visual overlay
  bus.emit("reward:triggered", {
    ...result,
    baseXp
  });

  return result;
}
