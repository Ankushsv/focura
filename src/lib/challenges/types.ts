export type ChallengeCategory = "focus" | "tasks" | "consistency" | "social";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  icon: string;
  target: number; // e.g. 5 tasks, 3 sessions
  progress: number;
  xpReward: number;
  claimed: boolean;
  expiresAt: number; // epoch ms — weekly reset
}

export const CATEGORY_COLORS: Record<ChallengeCategory, string> = {
  focus: "#22d3ee",
  tasks: "#8b5cf6",
  consistency: "#fbbf24",
  social: "#4ade80",
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function nextMonday(): number {
  const d = new Date();
  const day = d.getDay();
  const diff = ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function seedChallenges(): Challenge[] {
  const exp = nextMonday();
  return [
    {
      id: uid(),
      title: "Quest Slayer",
      description: "Complete 5 tasks this week",
      category: "tasks",
      icon: "⚔️",
      target: 5,
      progress: 0,
      xpReward: 75,
      claimed: false,
      expiresAt: exp,
    },
    {
      id: uid(),
      title: "Deep Worker",
      description: "Log 3 focus sessions",
      category: "focus",
      icon: "⏳",
      target: 3,
      progress: 0,
      xpReward: 60,
      claimed: false,
      expiresAt: exp,
    },
    {
      id: uid(),
      title: "Iron Will",
      description: "Check in to a contract 7 days straight",
      category: "consistency",
      icon: "🛡️",
      target: 7,
      progress: 0,
      xpReward: 100,
      claimed: false,
      expiresAt: exp,
    },
    {
      id: uid(),
      title: "Hour Glass",
      description: "Accumulate 2 hours of focused work",
      category: "focus",
      icon: "⌛",
      target: 120, // minutes
      progress: 0,
      xpReward: 80,
      claimed: false,
      expiresAt: exp,
    },
    {
      id: uid(),
      title: "Boss Hunter",
      description: "Defeat a boss battle task",
      category: "tasks",
      icon: "🐉",
      target: 1,
      progress: 0,
      xpReward: 50,
      claimed: false,
      expiresAt: exp,
    },
    {
      id: uid(),
      title: "Morning Ritual",
      description: "Start a focus session before noon, 3 times",
      category: "consistency",
      icon: "🌅",
      target: 3,
      progress: 0,
      xpReward: 65,
      claimed: false,
      expiresAt: exp,
    },
  ];
}
