"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Contract,
  type ContractFrequency,
  hasCheckedInToday,
  seedContracts,
  todayStr,
  uid,
} from "@/lib/contracts/types";

const STORE_KEY = "focura.contracts.v1";

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      setContracts(raw ? (JSON.parse(raw) as Contract[]) : seedContracts());
    } catch {
      setContracts(seedContracts());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(contracts));
  }, [contracts, loaded]);

  const addContract = useCallback(
    (input: {
      title: string;
      description: string;
      frequency: ContractFrequency;
      shields: number;
    }) => {
      const contract: Contract = {
        id: uid(),
        title: input.title,
        description: input.description,
        frequency: input.frequency,
        shieldsMax: input.shields,
        shieldsUsed: 0,
        xpPerCheckin: 15,
        streak: 0,
        bestStreak: 0,
        checkIns: [],
        createdAt: Date.now(),
      };
      setContracts((prev) => [contract, ...prev]);
      return contract;
    },
    []
  );

  /** Returns XP earned (0 if already checked in today) */
  const checkIn = useCallback((contractId: string): number => {
    let xpEarned = 0;
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        if (hasCheckedInToday(c)) return c;
        const today = todayStr();
        const newStreak = c.streak + 1;
        xpEarned = c.xpPerCheckin;
        return {
          ...c,
          checkIns: [...c.checkIns, { date: today, done: true }],
          streak: newStreak,
          bestStreak: Math.max(c.bestStreak, newStreak),
        };
      })
    );
    return xpEarned;
  }, []);

  /** Called when a day is missed — burns a shield */
  const burnShield = useCallback((contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const shieldsUsed = Math.min(c.shieldsUsed + 1, c.shieldsMax);
        return { ...c, shieldsUsed, streak: 0 };
      })
    );
  }, []);

  const deleteContract = useCallback((contractId: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
  }, []);

  return { contracts, loaded, addContract, checkIn, burnShield, deleteContract };
}
