export type ContractFrequency = "daily" | "weekdays" | "weekly";
export type ContractStatus = "active" | "broken" | "completed";

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
  status: ContractStatus;
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

export type SlotStatus = "checked" | "missed" | "pending" | "locked";

export interface ContractSlot {
  index: number;
  label: string; // e.g. "Day 1", "Wk 1"
  date?: string; // YYYY-MM-DD (for daily/weekdays)
  weekStart?: string; // YYYY-MM-DD (for weekly)
  weekEnd?: string; // YYYY-MM-DD (for weekly)
  status: SlotStatus;
}

/**
 * Calculates the 21 progress nodes (slots) for a contract based on its frequency.
 */
export function getContractSlots(contract: Contract, today: string): ContractSlot[] {
  const slots: ContractSlot[] = [];
  const startDay = new Date(contract.createdAt);
  
  if (contract.frequency === "daily") {
    for (let i = 0; i < 21; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const done = contract.checkIns.some((ci) => ci.date === dateStr && ci.done);
      let status: SlotStatus = "locked";
      if (done) {
        status = "checked";
      } else {
        if (dateStr < today) {
          status = "missed";
        } else if (dateStr === today) {
          status = "pending";
        } else {
          status = "locked";
        }
      }
      slots.push({
        index: i,
        label: `Day ${i + 1}`,
        date: dateStr,
        status,
      });
    }
  } else if (contract.frequency === "weekdays") {
    const current = new Date(startDay);
    let count = 0;
    while (count < 21) {
      const dayOfWeek = current.getDay();
      const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
      if (isWeekday) {
        const dateStr = current.toISOString().slice(0, 10);
        const done = contract.checkIns.some((ci) => ci.date === dateStr && ci.done);
        let status: SlotStatus = "locked";
        if (done) {
          status = "checked";
        } else {
          if (dateStr < today) {
            status = "missed";
          } else if (dateStr === today) {
            status = "pending";
          } else {
            status = "locked";
          }
        }
        slots.push({
          index: count,
          label: `Day ${count + 1}`,
          date: dateStr,
          status,
        });
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (contract.frequency === "weekly") {
    for (let i = 0; i < 21; i++) {
      const start = new Date(startDay);
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      const weekStartStr = start.toISOString().slice(0, 10);
      const weekEndStr = end.toISOString().slice(0, 10);
      
      const done = contract.checkIns.some((ci) => ci.date >= weekStartStr && ci.date <= weekEndStr && ci.done);
      let status: SlotStatus = "locked";
      if (done) {
        status = "checked";
      } else {
        if (weekEndStr < today) {
          status = "missed";
        } else if (today >= weekStartStr && today <= weekEndStr) {
          status = "pending";
        } else {
          status = "locked";
        }
      }
      slots.push({
        index: i,
        label: `Wk ${i + 1}`,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        status,
      });
    }
  }
  
  return slots;
}

/**
 * Computes status, shields used, and current streak dynamically from check-ins.
 */
export function getContractProgress(contract: Contract, today: string) {
  const slots = getContractSlots(contract, today);
  
  const checkedCount = slots.filter((s) => s.status === "checked").length;
  const missedCount = slots.filter((s) => s.status === "missed").length;
  
  const shieldsUsed = Math.min(missedCount, contract.shieldsMax);
  
  // Calculate current active streak going backwards from today / recent slots
  let streak = 0;
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    
    // Check if slot is in the future
    const isFuture = slot.date
      ? slot.date > today
      : slot.weekStart
      ? slot.weekStart > today
      : false;
    if (isFuture) continue;
    
    if (slot.status === "checked") {
      streak++;
    } else if (slot.status === "pending") {
      // Pending doesn't break the streak yet, keep looking back
      continue;
    } else {
      // Missed breaks the streak
      break;
    }
  }
  
  let status: ContractStatus = "active";
  if (checkedCount === 21) {
    status = "completed";
  } else if (missedCount > contract.shieldsMax) {
    status = "broken";
  }
  
  return {
    shieldsUsed,
    streak,
    bestStreak: Math.max(contract.bestStreak, streak),
    status,
    slots,
  };
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
      status: "active",
    },
  ];
}
