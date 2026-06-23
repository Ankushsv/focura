export type ContractFrequency = "daily" | "weekdays" | "weekly";

export interface CheckIn {
  date: string; // YYYY-MM-DD
  done: boolean;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  frequency: ContractFrequency;
  shieldsMax: number;
  shieldsUsed: number;
  xpPerCheckin: number;
  streak: number;
  bestStreak: number;
  checkIns: CheckIn[];
  createdAt: number;
}

export const FREQ_LABELS: Record<ContractFrequency, string> = {
  daily: "Every day",
  weekdays: "Mon – Fri",
  weekly: "Once a week",
};

export function uid(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function hasCheckedInToday(contract: Contract): boolean {
  const today = todayStr();
  return contract.checkIns.some((c) => c.date === today && c.done);
}

export function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function seedContracts(): Contract[] {
  return [
    {
      id: uid(),
      title: "Morning pages",
      description: "Write 3 pages of freeform text every morning",
      frequency: "daily",
      shieldsMax: 3,
      shieldsUsed: 0,
      xpPerCheckin: 15,
      streak: 2,
      bestStreak: 5,
      checkIns: [],
      createdAt: Date.now() - 86400000 * 3,
    },
  ];
}
