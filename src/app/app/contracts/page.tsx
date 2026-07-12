"use client";

import { useState, useEffect } from "react";
import { useContracts } from "@/hooks/useContracts";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import Card from "@/components/ui/Card";
import { handleRewardRoll } from "@/lib/variableReward";
import {
  FREQ_LABELS,
  hasCheckedInToday,
  getContractProgress,
  todayStr,
  type ContractFrequency,
} from "@/lib/contracts/types";
import { IconShield, IconFlame, IconBook, IconSkull, IconSword, IconTrash, IconCheck } from "@tabler/icons-react";

const FREQUENCIES: ContractFrequency[] = ["daily", "weekdays", "weekly"];

export default function ContractsPage() {
  const { contracts, loaded, error, addContract, checkIn, restartContract, deleteContract } =
    useContracts();
  const { awardXp } = useXp();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<ContractFrequency>("daily");
  const [shields, setShields] = useState(3);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [name, setName] = useState("User");

  useEffect(() => {
    async function loadProfileName() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, name")
            .eq("id", user.id)
            .single();
          if (profile) {
            setName(profile.username || profile.name || user.email?.split("@")[0] || "User");
          }
        }
      } catch {}
    }
    loadProfileName();
  }, []);

  function handleAddContract(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addContract({
      title: title.trim(),
      description: description.trim(),
      frequency,
      shields,
    });
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setShields(3);
    setShowForm(false);
    bus.emit("pet:react", { message: "Your contract has been saved. 📜" });
  }

  function handleCheckIn(contractId: string) {
    setCheckingIn(contractId);
    setTimeout(() => {
      const { xpEarned, isCompleted } = checkIn(contractId);
      if (xpEarned > 0) {
        handleRewardRoll(xpEarned, "contracts", awardXp);
        if (isCompleted) {
          bus.emit("pet:react", { message: "OATH FULFILLED! You finished the 21-day challenge! 🏆" });
        } else {
          bus.emit("pet:react", { message: "Consistency strengthened! 🛡️" });
        }
      }
      setCheckingIn(null);
    }, 350);
  }

  function handleRestart(contractId: string) {
    if (confirm("Are you sure you want to restart this habit contract back to Day 1? Your current progress will be reset.")) {
      void restartContract(contractId);
      bus.emit("pet:react", { message: "Contract restarted. A fresh start begins today! 🌅" });
    }
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-warm-amber/30 border-t-warm-amber" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg px-4 py-6 sm:px-8 space-y-8">
      {error && (
        <div className="mx-auto max-w-[1400px] rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 shadow-md">
          <p className="font-bold flex items-center gap-2">
            <span>⚠️</span> Database Sync Error: {error}
          </p>
          <p className="text-xs text-red-300/80 mt-1">
            Please make sure that the database tables and constraints are correctly configured in Supabase.
          </p>
        </div>
      )}
      {/* ── Consistency Hero ── */}
      <div className="relative mx-auto mb-10 max-w-[1400px]">
        <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-warm-surface px-8 py-10 shadow-2xl">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-warm-amber/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-warm-purple/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warm-border bg-warm-surface2 text-4xl shadow-lg">
                  <IconShield className="h-10 w-10 text-warm-amber animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-amber">
                  CONSISTENCY CONTRACTS
                </div>
                <h1 className="font-space text-xl sm:text-3xl font-bold text-warm-text">
                  Consistency Contracts
                </h1>
                <p className="font-quick italic text-xs sm:text-sm text-warm-textMuted max-w-md">
                  &ldquo;Consistency isn&apos;t broken by a single hard day. It is kept by the decision to return.&rdquo;
                </p>
              </div>
            </div>

            {/* Stats + New button */}
            <div className="flex flex-col items-end gap-4">
              {contracts.length > 0 && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-white">{contracts.length}</div>
                    <div className="text-[10px] font-quick font-bold text-warm-textMuted uppercase tracking-wider">Contracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-warm-amber">
                      {Math.max(...contracts.map((c) => c.streak), 0)}
                    </div>
                    <div className="text-[10px] font-quick font-bold text-warm-textMuted uppercase tracking-wider">Best Streak</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowForm((v) => !v)}
                className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
              >
                {showForm ? "✕ Cancel" : "+ Create a Contract"}
              </button>
            </div>
          </div>
        </div>

        {/* ── New Contract Form ── */}
        {showForm && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-warm-border bg-warm-surface shadow-xl border-l-4 border-l-warm-amber">
            <div className="border-b border-warm-border bg-warm-surface2 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-quick font-bold text-warm-text uppercase tracking-wider">
                <IconShield className="h-4 w-4 text-warm-amber" /> Create Your Consistency Contract
              </h2>
            </div>
            <form onSubmit={handleAddContract} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    What do you commit to?
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily workout (Exercise)"
                    required
                    className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text placeholder-warm-textMuted/50 outline-none focus:border-warm-amber transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    How much, how often? (Details)
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 20 minutes before breakfast"
                    className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text placeholder-warm-textMuted/50 outline-none focus:border-warm-amber transition"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    Contract Frequency
                  </label>
                  <div className="flex gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`rounded-xl border px-4 py-2 text-xs font-quick font-bold transition duration-200 ${
                          frequency === f
                            ? "border-warm-amber bg-warm-amber/15 text-warm-amber shadow"
                            : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:text-warm-text"
                        }`}
                      >
                        {FREQ_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    Safety Shields ({shields})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      value={shields}
                      onChange={(e) => setShields(Number(e.target.value))}
                      className="h-1.5 w-28 accent-warm-amber"
                    />
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`text-xl transition-all duration-300 ${
                            s <= shields
                              ? "drop-shadow-[0_0_8px_rgba(240,168,104,0.4)]"
                              : "opacity-20 grayscale"
                          }`}
                        >
                          🛡️
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
                >
                  Save Contract
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-warm-surface2 border border-warm-border text-warm-textMuted px-6 py-2.5 text-xs font-quick font-bold hover:text-warm-text hover:bg-warm-surface transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {contracts.length === 0 && !showForm && (
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-warm-amber/30 border-dashed bg-warm-surface px-8 py-20 text-center shadow">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-amber/30 bg-warm-surface2">
              <IconShield className="h-8 w-8 text-warm-amber" />
            </div>
            <div className="space-y-1">
              <h2 className="font-space text-lg font-bold text-warm-text">No Custom Contracts Yet</h2>
              <p className="font-quick italic text-xs text-warm-textMuted max-w-sm mx-auto">
                Consistency is the key to lasting change. Create a contract with yourself to track your daily progress.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
            >
              Create consistency contract
            </button>
          </div>
        </div>
      )}

      {/* ── Contracts List ── */}
      {contracts.length > 0 && (
        <div className="relative mx-auto max-w-[1400px] space-y-6">
          {contracts.map((contract) => {
            const today = todayStr();
            const progress = getContractProgress(contract, today);
            const { shieldsUsed, streak, bestStreak, status, slots } = progress;
            const checkedInToday = hasCheckedInToday(contract);
            const shieldsRemaining = contract.shieldsMax - shieldsUsed;

            // Rebrand statuses based on status
            let statusLabel = "Active";
            let statusColor = "border-warm-amber text-warm-amber bg-warm-amber/15";
            if (status === "completed") {
              statusLabel = "Completed";
              statusColor = "border-warm-teal text-warm-teal bg-warm-teal/15";
            } else if (status === "broken") {
              statusLabel = "Broken";
              statusColor = "border-[#f87171]/40 text-[#f87171] bg-[#f87171]/10";
            } else if (checkedInToday) {
              statusLabel = "Checked in today";
              statusColor = "border-warm-teal text-warm-teal bg-warm-teal/15";
            } else {
              statusLabel = "Pending check-in";
              statusColor = "border-warm-border text-warm-textMuted bg-warm-surface2";
            }

            return (
              <div
                key={contract.id}
                className="group overflow-hidden rounded-2xl border border-warm-border bg-warm-surface p-6 shadow transition hover:shadow-lg"
              >
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-quick font-bold text-warm-text">{contract.title}</h2>
                        <span className="rounded-full border border-warm-border bg-warm-surface2 px-2.5 py-0.5 text-[10px] font-quick font-bold text-warm-textMuted uppercase tracking-wider">
                          {FREQ_LABELS[contract.frequency]}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full border border-warm-amber/25 bg-warm-amber/15 px-2.5 py-0.5 text-[10px] font-quick font-bold text-warm-amber uppercase tracking-wider">
                          <IconFlame className="h-3.5 w-3.5 animate-pulse" /> {streak} day streak
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-quick font-bold uppercase tracking-wider ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {contract.description && (
                        <p className="mt-1 text-xs font-quick italic text-warm-textMuted">{contract.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to abandon and permanently delete this consistency contract?")) {
                          deleteContract(contract.id);
                          bus.emit("pet:react", { message: "Contract deleted. ✕" });
                        }
                      }}
                      className="rounded-lg p-1.5 text-warm-textMuted opacity-0 hover:bg-warm-surface2 hover:text-priority-critical group-hover:opacity-100 transition"
                      title="Abandon contract"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-warm-border/50 pt-5">
                    {/* The Safety Shield */}
                    <div className="rounded-xl border border-warm-border bg-warm-surface2 p-3 flex flex-col justify-center">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted mb-2">
                        Safety Shields ({shieldsRemaining} / {contract.shieldsMax} left)
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: contract.shieldsMax }).map((_, i) => {
                          const isIntact = i < shieldsRemaining;
                          return (
                            <span
                              key={i}
                              className={`text-2xl transition-all duration-500 ${
                                isIntact
                                  ? "drop-shadow-[0_0_10px_rgba(240,168,104,0.4)] shield-glow"
                                  : "opacity-20 grayscale"
                              }`}
                            >
                              🛡️
                            </span>
                          );
                        })}
                        <span className="text-[10px] font-quick font-bold text-warm-textMuted ml-2">
                          {status === "broken" ? "Contract Broken!" : shieldsRemaining > 0 ? "Shields active." : "Warning: No shields left!"}
                        </span>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="rounded-xl border border-warm-border bg-warm-surface2 p-3">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted mb-1">
                        Best Streak
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-mono font-bold text-warm-amber">{bestStreak}</span>
                        <span className="text-[10px] font-quick font-bold text-warm-textMuted uppercase tracking-wider">days active</span>
                      </div>
                    </div>

                    {/* XP Reward info */}
                    <div className="rounded-xl border border-warm-border bg-warm-surface2 p-3">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted mb-1">
                        Completion Reward
                      </div>
                      <div className="text-xl font-mono font-bold text-warm-amber mt-1">
                        +200
                        <span className="text-xs text-warm-textMuted ml-1.5 font-quick font-bold">XP completion bonus</span>
                      </div>
                    </div>
                  </div>

                  {/* 21-Day Habit Journey Roadmap */}
                  <div className="border-t border-warm-border/50 pt-5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                      <span>21-Day Habit Journey Roadmap</span>
                      <span className="text-warm-amber font-mono font-bold">
                        {slots.filter((s) => s.status === "checked").length} / 21 slots completed
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto sm:mx-0 py-2">
                      {slots.map((slot) => {
                        let nodeStyle = "border-warm-border bg-warm-surface2 text-warm-textMuted/40";
                        let nodeIcon = null;
                        
                        if (slot.status === "checked") {
                          nodeStyle = "bg-warm-amber border-warm-amber text-warm-bg font-bold shadow-[0_0_8px_rgba(240,168,104,0.3)]";
                          nodeIcon = <IconCheck className="h-3.5 w-3.5 stroke-[3]" />;
                        } else if (slot.status === "missed") {
                          nodeStyle = "border-l-2 border-r-2 border-dashed border-[#f87171]/50 bg-red-950/10 text-[#f87171]/70";
                          nodeIcon = <span className="text-[10px]" title="Shield Used">🛡️</span>;
                        } else if (slot.status === "pending") {
                          nodeStyle = "border-2 border-warm-amber bg-warm-amber/10 text-warm-amber animate-pulse font-bold";
                        } else {
                          // Locked
                          nodeStyle = "border border-warm-border bg-warm-surface2/30 text-warm-textHint/40";
                        }

                        const label = slot.label.split(" ")[1] || slot.label;

                        return (
                          <div
                            key={slot.index}
                            title={`${slot.label}: ${slot.status.toUpperCase()}${slot.date ? ` (${slot.date})` : ""}`}
                            className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all duration-300 ${nodeStyle}`}
                          >
                            <span className="text-[9px] font-mono leading-none">{label}</span>
                            {nodeIcon && (
                              <div className="absolute -bottom-1 -right-1 bg-warm-surface rounded-full p-[1px] border border-warm-border flex items-center justify-center">
                                {nodeIcon}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-warm-border/50 pt-5">
                    {status === "completed" && (
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 rounded-full border border-warm-teal/30 bg-warm-teal/10 px-5 py-2 text-xs font-quick font-bold text-warm-teal">
                          <span>🏆</span> Oath Completed Successfully!
                        </div>
                        <button
                          onClick={() => handleRestart(contract.id)}
                          className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
                        >
                          Start New 21-Day Cycle
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to archive and remove this completed contract?")) {
                              deleteContract(contract.id);
                              bus.emit("pet:react", { message: "Contract archived in your hall of records. 📜" });
                            }
                          }}
                          className="rounded-full bg-warm-surface2 border border-warm-border text-warm-textMuted px-5 py-2 text-xs font-quick font-bold hover:text-warm-text hover:bg-warm-surface transition"
                        >
                          Archive Contract
                        </button>
                      </div>
                    )}

                    {status === "broken" && (
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/15 px-5 py-2 text-xs font-quick font-bold text-red-400">
                          <span>⚠️</span> Contract Broken (Shields Depleted)
                        </div>
                        <button
                          onClick={() => handleRestart(contract.id)}
                          className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
                        >
                          Restart Habit Journey (Day 1)
                        </button>
                      </div>
                    )}

                    {status === "active" && (
                      <button
                        onClick={() => handleCheckIn(contract.id)}
                        disabled={checkedInToday || checkingIn === contract.id}
                        className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-quick font-bold transition duration-200 active:scale-95 disabled:cursor-not-allowed ${
                          checkedInToday
                            ? "border border-warm-teal/30 bg-warm-teal/10 text-warm-teal"
                            : "bg-warm-amber text-warm-bg hover:shadow-[0_0_15px_rgba(240,168,104,0.15)]"
                        }`}
                      >
                        {checkingIn === contract.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-warm-bg border-t-transparent" />
                        ) : checkedInToday ? (
                          <><span>✓</span> Checked In Today</>
                        ) : (
                          <><span>🛡️</span> Check In</>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* AI Coach reflects (Roadmap insight block) */}
                  <div className="border-t border-warm-border/50 pt-5">
                    <div className="bg-warm-surface2 border-l-4 border-warm-purple rounded-r-xl p-4 flex gap-3.5">
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-warm-purple/10 text-warm-purple">
                        <IconBook className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-purple">
                          AI Coach counsel:
                        </p>
                        <p className="font-quick italic text-xs leading-relaxed text-warm-cream font-medium font-quick">
                          {status === "completed" ? (
                            <>“Magnificent! You completed all 21 habit slots. This habit is now forged into your character. Archive it or restart a new cycle!”</>
                          ) : status === "broken" ? (
                            <>“The path of consistency has cracked. The shields are broken, but your journey does not end here. Restart your contract and rise again today.”</>
                          ) : shieldsRemaining < contract.shieldsMax ? (
                            <>“Shields have been depleted to protect your streak. The contract holds, but the margin of error is gone. Let's make today count.”</>
                          ) : (
                            <>“Your shields are fully intact. Consistency is not about perfection, but persistence. Keep taking it day by day.”</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes shieldGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(240,168,104,0.3)); }
          50% { filter: drop-shadow(0 0 10px rgba(240,168,104,0.6)); }
        }
        .shield-glow {
          animation: shieldGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
