export type Priority = "critical" | "high" | "medium";
export type Energy = "low" | "medium" | "high";

export type Subtask = {
  id: string;
  text: string;
  xp: number;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  tag?: string;
  xp: number;
  done: boolean;
  isBoss: boolean;
  energy: Energy;
  difficultyBefore?: number;
  difficultyAfter?: number;
  memoryNote?: string;
  subtasks: Subtask[];
  createdAt: number;
  completedAt?: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium"];

export const PRIORITY_STYLES: Record<Priority, { border: string; label: string; text: string }> = {
  critical: { border: "border-l-priority-critical", label: "Critical", text: "text-priority-critical" },
  high: { border: "border-l-priority-high", label: "High", text: "text-priority-high" },
  medium: { border: "border-l-priority-medium", label: "Medium", text: "text-priority-medium" },
};

export const ENERGY_LABELS: Record<Energy, string> = {
  low: "\ud83d\udd0b Low",
  medium: "\u26a1 Medium",
  high: "\ud83d\udd25 High",
};

const ENERGY_RANK: Record<Energy, number> = { low: 0, medium: 1, high: 2 };

/** 0 = perfect energy match, 2 = worst mismatch. */
export function energyDistance(a: Energy, b: Energy): number {
  return Math.abs(ENERGY_RANK[a] - ENERGY_RANK[b]);
}

export function seedTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "Plan my first Mastery Path",
      priority: "critical",
      tag: "focura",
      xp: 50,
      done: false,
      isBoss: false,
      energy: "medium",
      subtasks: [],
      createdAt: now,
    },
    {
      id: uid(),
      title: "Clear inbox to zero",
      priority: "high",
      tag: "admin",
      xp: 30,
      done: false,
      isBoss: false,
      energy: "low",
      subtasks: [],
      createdAt: now,
    },
    {
      id: uid(),
      title: "Deep work: project draft",
      priority: "medium",
      tag: "work",
      xp: 40,
      done: false,
      isBoss: false,
      energy: "high",
      subtasks: [],
      createdAt: now,
    },
  ];
}
