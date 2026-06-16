"use client";

import { useState, useEffect } from "react";
import { useContracts } from "@/hooks/useContracts";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import Card from "@/components/ui/Card";
import {
  FREQ_LABELS,
  hasCheckedInToday,
  last14Days,
  type ContractFrequency,
} from "@/lib/contracts/types";
import { IconShield, IconFlame, IconBook, IconSkull, IconSword } from "@tabler/icons-react";

const FREQUENCIES: ContractFrequency[] = ["daily", "weekdays", "weekly"];

export default function ContractsPage() {
  const { contracts, loaded, addContract, checkIn, burnShield, deleteContract } =
    useContracts();
  const { awardXp } = useXp();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<ContractFrequency>("daily");
  const [shields, setShields] = useState(3);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [name, setName] = useState("knight");

  useEffect(() => {
    const saved = localStorage.getItem("focura.username");
    if (saved) setName(saved);
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
    bus.emit("pet:react", { message: "Your oath has been sealed in iron. 📜" });
  }

  function handleCheckIn(contractId: string) {
    setCheckingIn(contractId);
    setTimeout(() => {
      const xp = checkIn(contractId);
      if (xp > 0) {
        awardXp(xp, "contracts");
        fireConfetti();
        bus.emit("pet:react", { message: "The Oath Shield holds. Consistency strengthened! 🛡️" });
      }
      setCheckingIn(null);
    }, 350);
  }

  function handleBurnShield(contractId: string) {
    burnShield(contractId);
    bus.emit("pet:react", { message: "The Oath Shield dims — but it can be relit. 💔" });
  }

  const days14 = last14Days();

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0c0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f0a868]/30 border-t-[#f0a868]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0c0a] px-4 py-6 sm:px-8 space-y-8">
      {/* ── Consistency Hero ── */}
      <div className="relative mx-auto mb-10 max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-[#1a1714] px-8 py-10 shadow-2xl">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-realm-gold/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-realm-purple/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-realm-border bg-[#141210] text-4xl shadow-lg">
                  <IconShield className="h-10 w-10 text-realm-gold animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
                  THE KNIGHT&apos;S OATH
                </div>
                <h1 className="font-cinzel text-xl sm:text-3xl font-bold text-[#f5efe8]">
                  The Knight&apos;s Oath
                </h1>
                <p className="font-lora italic text-xs sm:text-sm text-realm-muted max-w-md">
                  &ldquo;An oath is not broken by a single hard day. It is kept by the decision to return.&rdquo;
                </p>
              </div>
            </div>

            {/* Stats + New button */}
            <div className="flex flex-col items-end gap-4">
              {contracts.length > 0 && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-white">{contracts.length}</div>
                    <div className="text-[10px] font-quick font-bold text-realm-muted uppercase tracking-wider">Oaths</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-realm-gold">
                      {Math.max(...contracts.map((c) => c.streak), 0)}
                    </div>
                    <div className="text-[10px] font-quick font-bold text-realm-muted uppercase tracking-wider">Best Streak</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowForm((v) => !v)}
                className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
              >
                {showForm ? "✕ Cancel" : "+ Swear a New Oath"}
              </button>
            </div>
          </div>
        </div>

        {/* ── New Contract Form ── */}
        {showForm && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-realm-border bg-realm-surface shadow-xl border-l-4 border-l-realm-gold">
            <div className="border-b border-realm-border bg-[#141210] px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-quick font-bold text-[#f5efe8] uppercase tracking-wider">
                <IconShield className="h-4 w-4 text-realm-gold" /> Swear Your Oath
              </h2>
            </div>
            <form onSubmit={handleAddContract} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    What do you commit to?
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning blade practice (Exercise)"
                    required
                    className="w-full rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2.5 text-sm font-quick text-realm-text placeholder-realm-muted/50 outline-none focus:border-realm-gold transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    How much, how often? (Details)
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 20 minutes before breakfast"
                    className="w-full rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2.5 text-sm font-quick text-realm-text placeholder-realm-muted/50 outline-none focus:border-realm-gold transition"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    Oath Frequency
                  </label>
                  <div className="flex gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`rounded-xl border px-4 py-2 text-xs font-quick font-bold transition duration-200 ${
                          frequency === f
                            ? "border-realm-gold bg-realm-gold-dim text-realm-gold shadow"
                            : "border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-text"
                        }`}
                      >
                        {FREQ_LABELS[f]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    Oath Shields ({shields})
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      value={shields}
                      onChange={(e) => setShields(Number(e.target.value))}
                      className="h-1.5 w-28 accent-realm-gold"
                    />
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          className={`text-xl transition-all duration-300 ${
                            s <= shields
                              ? "drop-shadow-[0_0_8px_rgba(240,168,104,0.6)]"
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
                  className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
                >
                  Seal My Oath ⚔️
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-realm-surface2 border border-realm-border text-realm-muted px-6 py-2.5 text-xs font-quick font-bold hover:text-realm-text hover:bg-realm-surface transition"
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
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-realm-gold/30 border-dashed bg-realm-surface px-8 py-20 text-center shadow">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-realm-gold/30 bg-[#141210]">
              <IconShield className="h-8 w-8 text-realm-gold" />
            </div>
            <div className="space-y-1">
              <h2 className="font-cinzel text-lg font-bold text-realm-text">No Custom Oaths sworn Yet</h2>
              <p className="font-lora italic text-xs text-realm-muted max-w-sm mx-auto">
                Consistency is the mark of a true knight. Swear an oath to yourself and strengthen your shield.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
            >
              Swear Your Oath
            </button>
          </div>
        </div>
      )}

      {/* ── Contracts List (Oath Scrolls) ── */}
      {contracts.length > 0 && (
        <div className="relative mx-auto max-w-5xl space-y-6">
          {contracts.map((contract) => {
            const checkedInToday = hasCheckedInToday(contract);
            const shieldsRemaining = contract.shieldsMax - contract.shieldsUsed;
            const checkInSet = new Set(
              contract.checkIns.filter((c) => c.done).map((c) => c.date)
            );

            // Rebrand statuses: "Oath holds" or "The fog crept in"
            const statusLabel = checkedInToday ? "Oath holds" : "The fog crept in";
            const statusColor = checkedInToday ? "border-realm-gold text-realm-gold bg-realm-gold-dim" : "border-realm-border text-realm-muted bg-[#141210]";

            return (
              <div
                key={contract.id}
                className="group overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-6 shadow transition hover:shadow-lg"
              >
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-quick font-bold text-[#f5efe8]">{contract.title}</h2>
                        <span className="rounded-full border border-realm-border bg-[#141210] px-2.5 py-0.5 text-[10px] font-quick font-bold text-realm-muted uppercase tracking-wider">
                          {FREQ_LABELS[contract.frequency]}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full border border-realm-gold/25 bg-realm-gold-dim px-2.5 py-0.5 text-[10px] font-quick font-bold text-realm-gold uppercase tracking-wider">
                          <IconFlame className="h-3.5 w-3.5 animate-pulse" /> {contract.streak} day streak
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-quick font-bold uppercase tracking-wider ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {contract.description && (
                        <p className="mt-1 text-xs font-lora italic text-realm-muted">{contract.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteContract(contract.id)}
                      className="rounded-lg p-1.5 text-realm-muted opacity-0 hover:bg-realm-surface2 hover:text-realm-crimson group-hover:opacity-100 transition"
                      title="Abandon oath"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-realm-border/50 pt-5">
                    {/* The Oath Shield */}
                    <div className="rounded-xl border border-realm-border bg-realm-surface2 p-3 flex flex-col justify-center">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted mb-2">
                        The Oath Shield
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: contract.shieldsMax }).map((_, i) => {
                          const isIntact = i < shieldsRemaining;
                          return (
                            <span
                              key={i}
                              className={`text-2xl transition-all duration-500 ${
                                isIntact
                                  ? "drop-shadow-[0_0_10px_rgba(240,168,104,0.65)] shield-glow"
                                  : "opacity-20 grayscale"
                              }`}
                            >
                              🛡️
                            </span>
                          );
                        })}
                        <span className="text-[10px] font-quick font-bold text-realm-muted ml-2">
                          {shieldsRemaining > 0 ? "Your oath holds." : "Shield broken!"}
                        </span>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="rounded-xl border border-realm-border bg-realm-surface2 p-3">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted mb-1">
                        Best Streak
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-mono font-bold text-realm-gold">{contract.bestStreak}</span>
                        <span className="text-[10px] font-quick font-bold text-realm-muted uppercase tracking-wider">days honored</span>
                      </div>
                    </div>

                    {/* XP per Checkin */}
                    <div className="rounded-xl border border-realm-border bg-realm-surface2 p-3">
                      <div className="text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted mb-1">
                        Days honored
                      </div>
                      <div className="text-xl font-mono font-bold text-realm-gold mt-1">
                        +{contract.xpPerCheckin}
                        <span className="text-xs text-realm-muted ml-1.5 font-quick">LP per check-in</span>
                      </div>
                    </div>
                  </div>

                  {/* 14-day heatmap */}
                  <div className="border-t border-realm-border/50 pt-5 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                      <span>Your oath&apos;s record (Last 14 days)</span>
                      <span className="text-realm-gold">
                        {days14.filter((d) => checkInSet.has(d)).length} / 14 days
                      </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {days14.map((day) => {
                        const done = checkInSet.has(day);
                        const isToday = day === new Date().toISOString().slice(0, 10);
                        return (
                          <div
                            key={day}
                            title={day}
                            className={`h-6 w-6 flex-shrink-0 rounded-md transition-all duration-300 ${
                              done
                                ? "shadow-[0_0_8px_rgba(240,168,104,0.35)]"
                                : isToday
                                ? "border border-realm-gold bg-realm-gold-dim"
                                : "border border-realm-border bg-realm-surface2"
                            }`}
                            style={
                              done
                                ? {
                                    background: "#f0a868",
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-realm-border/50 pt-5">
                    <button
                      onClick={() => handleCheckIn(contract.id)}
                      disabled={checkedInToday || checkingIn === contract.id}
                      className={`relative flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-quick font-bold transition duration-200 active:scale-95 disabled:cursor-not-allowed ${
                        checkedInToday
                          ? "border border-realm-teal/30 bg-realm-teal/10 text-realm-teal"
                          : "bg-realm-gold text-[#0e0c0a] hover:shadow-[0_0_15px_rgba(240,168,104,0.3)]"
                      }`}
                    >
                      {checkingIn === contract.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0e0c0a] border-t-transparent" />
                      ) : checkedInToday ? (
                        <><span>✓</span> Oath Honored Today</>
                      ) : (
                        <><span>🛡️</span> Honor Your Oath</>
                      )}
                    </button>

                    <button
                      onClick={() => handleBurnShield(contract.id)}
                      disabled={shieldsRemaining === 0}
                      className="rounded-full bg-realm-surface2 border border-realm-border text-realm-muted px-4 py-2 text-xs font-quick font-bold hover:text-realm-crimson hover:bg-realm-surface transition disabled:opacity-20"
                    >
                      Miss a day (Test Shield crack)
                    </button>
                  </div>
                  
                  {/* The Sage speaks (Roadmap insight block) */}
                  <div className="border-t border-realm-border/50 pt-5">
                    <div className="bg-[#191512] border-l-3 border-[#a78bfa] rounded-r-xl p-4 flex gap-3.5">
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#a78bfa]/10 text-[#a78bfa]">
                        <IconBook className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#a78bfa]">
                          The Sage&apos;s counsel:
                        </p>
                        <p className="font-lora italic text-xs leading-relaxed text-[#f5e6d3]">
                          &ldquo;You came back every single time. That is what defines a knight. One fall does not end a knight&apos;s story.&rdquo;
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
          0%, 100% { filter: drop-shadow(0 0 4px rgba(240,168,104,0.5)); }
          50% { filter: drop-shadow(0 0 10px rgba(240,168,104,0.85)); }
        }
        .shield-glow {
          animation: shieldGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
