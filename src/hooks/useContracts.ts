"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Contract,
  type ContractFrequency,
  hasCheckedInToday,
  todayStr,
  uid,
} from "@/lib/contracts/types";

/**
 * Consistency contracts (oaths) state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load contracts and check-ins from Supabase
  useEffect(() => {
    let active = true;

    async function loadContracts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbContracts, error: contractsError } = await supabase
          .from("contracts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (contractsError) throw contractsError;

        const { data: dbCheckins } = await supabase
          .from("contract_checkins")
          .select("*")
          .eq("user_id", user.id);

        if (active && dbContracts) {
          const mappedContracts: Contract[] = dbContracts.map((c: any) => {
            const checkins = (dbCheckins || [])
              .filter((ci: any) => ci.contract_id === c.id)
              .map((ci: any) => ({
                date: ci.date,
                done: ci.done || false,
              }));

            return {
              id: c.id,
              title: c.title,
              description: c.description || "",
              frequency: c.frequency as ContractFrequency,
              shieldsMax: c.shields_max || 3,
              shieldsUsed: c.shields_used || 0,
              xpPerCheckin: c.xp_per_checkin || 15,
              streak: c.streak || 0,
              bestStreak: c.best_streak || 0,
              checkIns: checkins,
              createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
            };
          });
          setContracts(mappedContracts);
        }
      } catch (err) {
        console.warn("Failed to load contracts from Supabase:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadContracts();

    return () => {
      active = false;
    };
  }, []);

  const saveContractToDb = useCallback(async (contract: Contract) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("contracts").upsert({
        id: contract.id,
        user_id: user.id,
        title: contract.title,
        description: contract.description || null,
        frequency: contract.frequency,
        shields_max: contract.shieldsMax,
        shields_used: contract.shieldsUsed,
        xp_per_checkin: contract.xpPerCheckin || 15,
        streak: contract.streak,
        best_streak: contract.bestStreak,
        created_at: contract.createdAt ? new Date(contract.createdAt).toISOString() : new Date().toISOString(),
      });

      if (contract.checkIns && contract.checkIns.length > 0) {
        const checkinPayloads = contract.checkIns.map((ci) => ({
          contract_id: contract.id,
          user_id: user.id,
          date: ci.date,
          done: ci.done || false,
        }));
        await supabase.from("contract_checkins").upsert(checkinPayloads);
      }
    } catch (err) {
      console.warn("Failed to save contract to Supabase:", err);
    }
  }, []);

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
      void saveContractToDb(contract);
      return contract;
    },
    [saveContractToDb]
  );

  /** Returns XP earned (0 if already checked in today) */
  const checkIn = useCallback(
    (contractId: string): number => {
      let xpEarned = 0;
      let targetContract: Contract | null = null;
      setContracts((prev) =>
        prev.map((c) => {
          if (c.id !== contractId) return c;
          if (hasCheckedInToday(c)) return c;
          const today = todayStr();
          const newStreak = c.streak + 1;
          xpEarned = c.xpPerCheckin;
          targetContract = {
            ...c,
            checkIns: [...c.checkIns, { date: today, done: true }],
            streak: newStreak,
            bestStreak: Math.max(c.bestStreak, newStreak),
          };
          return targetContract;
        })
      );
      if (targetContract) {
        void saveContractToDb(targetContract);
      }
      return xpEarned;
    },
    [saveContractToDb]
  );

  /** Called when a day is missed — burns a shield */
  const burnShield = useCallback(
    (contractId: string) => {
      let targetContract: Contract | null = null;
      setContracts((prev) =>
        prev.map((c) => {
          if (c.id !== contractId) return c;
          const shieldsUsed = Math.min(c.shieldsUsed + 1, c.shieldsMax);
          targetContract = { ...c, shieldsUsed, streak: 0 };
          return targetContract;
        })
      );
      if (targetContract) {
        void saveContractToDb(targetContract);
      }
    },
    [saveContractToDb]
  );

  const deleteContract = useCallback((contractId: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    void (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("contracts").delete().eq("id", contractId).eq("user_id", user.id);
      } catch (err) {
        console.warn("Failed to delete contract from Supabase:", err);
      }
    })();
  }, []);

  return { contracts, loaded, addContract, checkIn, burnShield, deleteContract };
}
