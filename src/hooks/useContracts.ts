"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Contract,
  type ContractFrequency,
  type ContractStatus,
  hasCheckedInToday,
  todayStr,
  uid,
  getContractProgress,
} from "@/lib/contracts/types";

/**
 * Consistency contracts (oaths) state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveContractToDb = useCallback(async (contract: Contract) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
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
        status: contract.status,
        created_at: contract.createdAt ? new Date(contract.createdAt).toISOString() : new Date().toISOString(),
      };

      let { error: contractsErr } = await supabase.from("contracts").upsert(payload);
      if (contractsErr) {
        console.error("contracts upsert error:", contractsErr);
        setError(`Contracts save error: ${contractsErr.message}`);
        const errMsg = contractsErr.message.toLowerCase();
        if (errMsg.includes("status")) {
          // Fallback if status column is not present in remote database yet
          const cleanPayload = { ...payload } as any;
          delete cleanPayload.status;
          const { error: fallbackErr } = await supabase.from("contracts").upsert(cleanPayload);
          if (fallbackErr) {
            console.error("contracts fallback upsert error:", fallbackErr);
            setError(`Fallback save error: ${fallbackErr.message}`);
            throw fallbackErr;
          }
        } else {
          throw contractsErr;
        }
      } else {
        console.log("contracts upsert succeeded:", payload);
      }

      if (contract.checkIns && contract.checkIns.length > 0) {
        const checkinPayloads = contract.checkIns.map((ci) => ({
          contract_id: contract.id,
          user_id: user.id,
          date: ci.date,
          done: ci.done || false,
        }));
        const { error: checkinErr } = await supabase
          .from("contract_checkins")
          .upsert(checkinPayloads, { onConflict: "contract_id,date" });
        if (checkinErr) {
          console.error("contract_checkins upsert error:", checkinErr);
          setError(`Check-ins save error: ${checkinErr.message}`);
          throw checkinErr;
        } else {
          console.log("contract_checkins upsert succeeded with", checkinPayloads);
        }
      }
    } catch (err: any) {
      console.error("Failed to save contract to Supabase:", err);
      setError(err?.message || "Failed to save contract to database");
    }
  }, []);

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

        if (contractsError) {
          console.error("Error fetching contracts:", contractsError);
          setError(`Fetch contracts error: ${contractsError.message}`);
          throw contractsError;
        }

        const { data: dbCheckins, error: checkinsError } = await supabase
          .from("contract_checkins")
          .select("*")
          .eq("user_id", user.id);

        if (checkinsError) {
          console.error("Error fetching check-ins:", checkinsError);
          setError(`Fetch check-ins error: ${checkinsError.message}`);
          throw checkinsError;
        } else {
          console.log("Successfully fetched check-ins from database:", dbCheckins);
        }

        setError(null);

        if (active && dbContracts) {
          const today = todayStr();
          const mappedContracts: Contract[] = dbContracts.map((c: any) => {
            const checkins = (dbCheckins || [])
              .filter((ci: any) => ci.contract_id === c.id)
              .map((ci: any) => ({
                date: ci.date,
                done: ci.done || false,
              }));

            const tempContract: Contract = {
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
              status: (c.status || "active") as ContractStatus,
            };

            // Automatically check and resolve missed days / streaks
            const progress = getContractProgress(tempContract, today);

            // If calculated state differs from DB, queue background update
            if (
              progress.shieldsUsed !== tempContract.shieldsUsed ||
              progress.streak !== tempContract.streak ||
              progress.status !== tempContract.status ||
              progress.bestStreak !== tempContract.bestStreak
            ) {
              const updatedContract = {
                ...tempContract,
                shieldsUsed: progress.shieldsUsed,
                streak: progress.streak,
                bestStreak: progress.bestStreak,
                status: progress.status,
              };
              void saveContractToDb(updatedContract);
              return updatedContract;
            }

            return {
              ...tempContract,
              shieldsUsed: progress.shieldsUsed,
              streak: progress.streak,
              bestStreak: progress.bestStreak,
              status: progress.status,
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
  }, [saveContractToDb]);

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
        status: "active",
      };
      setContracts((prev) => [contract, ...prev]);
      void saveContractToDb(contract);
      return contract;
    },
    [saveContractToDb]
  );

  /** Returns XP earned and whether the contract was newly completed */
  const checkIn = useCallback(
    (contractId: string): { xpEarned: number; isCompleted: boolean } => {
      let xpEarned = 0;
      let isCompleted = false;

      const currentContract = contracts.find((c) => c.id === contractId);
      if (!currentContract || hasCheckedInToday(currentContract)) {
        return { xpEarned, isCompleted };
      }

      const today = todayStr();
      const updatedCheckins = [...currentContract.checkIns, { date: today, done: true }];
      
      const tempContract: Contract = {
        ...currentContract,
        checkIns: updatedCheckins,
      };

      const progress = getContractProgress(tempContract, today);

      xpEarned = currentContract.xpPerCheckin;

      // Award 200 XP completion bonus on the 21st check-in
      if (progress.status === "completed" && currentContract.status !== "completed") {
        xpEarned = 200;
        isCompleted = true;
      }

      const targetContract: Contract = {
        ...currentContract,
        checkIns: updatedCheckins,
        streak: progress.streak,
        bestStreak: progress.bestStreak,
        shieldsUsed: progress.shieldsUsed,
        status: progress.status,
      };

      // Update state
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? targetContract : c))
      );

      // Save to database
      void saveContractToDb(targetContract);

      return { xpEarned, isCompleted };
    },
    [contracts, saveContractToDb]
  );

  const restartContract = useCallback(
    async (contractId: string) => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Delete check-ins for this contract
        const { error: deleteErr } = await supabase
          .from("contract_checkins")
          .delete()
          .eq("contract_id", contractId)
          .eq("user_id", user.id);

        if (deleteErr) {
          console.error("Failed to delete check-ins on restart:", deleteErr);
          setError(`Restart error: ${deleteErr.message}`);
          return;
        }

        const currentContract = contracts.find((c) => c.id === contractId);
        if (!currentContract) return;

        const newCreatedAt = Date.now();
        const restarted: Contract = {
          ...currentContract,
          checkIns: [],
          streak: 0,
          shieldsUsed: 0,
          status: "active",
          createdAt: newCreatedAt,
        };

        // Update state
        setContracts((prev) =>
          prev.map((c) => (c.id === contractId ? restarted : c))
        );

        // Save contract metadata update to database
        void saveContractToDb(restarted);
      } catch (err: any) {
        console.error("Failed to restart contract:", err);
        setError(err?.message || "Failed to restart contract");
      }
    },
    [contracts, saveContractToDb]
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

  return { contracts, loaded, error, addContract, checkIn, restartContract, deleteContract };
}
