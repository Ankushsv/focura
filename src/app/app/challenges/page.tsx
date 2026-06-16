"use client";

import { useEffect, useState } from "react";
import { useChallenges } from "@/hooks/useChallenges";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { 
  IconSword, 
  IconTrophy, 
  IconHourglass, 
  IconShield, 
  IconClock, 
  IconSun, 
  IconLock,
  IconFlame,
  IconChevronRight 
} from "@tabler/icons-react";
import { CATEGORY_COLORS, type ChallengeCategory } from "@/lib/challenges/types";

function useCountdown() {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    function calc() {
      const now = new Date();
      const sunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      sunday.setDate(now.getDate() + daysUntilSunday);
      sunday.setHours(0, 0, 0, 0);
      setMs(sunday.getTime() - now.getTime());
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600) % 24;
  const d = Math.floor(totalSec / 86400);

  return { d, h, m, s };
}

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  focus: "Focus",
  tasks: "Missions",
  consistency: "Oath",
  social: "Alliance",
};

const CATEGORY_BG: Record<ChallengeCategory, string> = {
  focus: "rgba(94, 234, 212, 0.1)", // teal-glow
  tasks: "rgba(240, 168, 104, 0.1)", // gold-glow
  consistency: "rgba(167, 139, 250, 0.1)", // purple-glow
  social: "rgba(248, 113, 113, 0.1)", // crimson-glow
};

function getTrialIcon(iconStr: string, size = 24) {
  switch (iconStr) {
    case "⚔️":
      return <IconSword size={size} className="text-realm-gold animate-pulse" />;
    case "⏳":
      return <IconHourglass size={size} className="text-realm-teal" />;
    case "🛡️":
      return <IconShield size={size} className="text-realm-purple" />;
    case "⌛":
      return <IconClock size={size} className="text-realm-teal" />;
    case "🐉":
      return <IconFlame size={size} className="text-realm-crimson animate-pulse" />;
    case "🌅":
      return <IconSun size={size} className="text-realm-gold" />;
    default:
      return <IconSword size={size} className="text-realm-gold" />;
  }
}

export default function ChallengesPage() {
  const { challenges, loaded, incrementProgress, claimChallenge } =
    useChallenges();
  const { awardXp } = useXp();
  const { d, h, m, s } = useCountdown();

  const [claiming, setClaiming] = useState<string | null>(null);
  const [incrementing, setIncrementing] = useState<string | null>(null);

  function handleClaim(challengeId: string) {
    setClaiming(challengeId);
    setTimeout(() => {
      const xp = claimChallenge(challengeId);
      if (xp > 0) {
        awardXp(xp, "challenges");
        fireConfetti();
        bus.emit("pet:react", {
          message: "Trial complete! The realm sings of your victory! ⚔️",
        });
      }
      setClaiming(null);
    }, 400);
  }

  function handleIncrement(challengeId: string) {
    setIncrementing(challengeId);
    incrementProgress(challengeId, 1);
    setTimeout(() => setIncrementing(null), 300);
  }

  const totalChallenges = challenges.length;
  const completedChallenges = challenges.filter((c) => c.claimed).length;

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-realm-bg">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-realm-gold/30 border-t-realm-gold" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">⚔️</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-realm-bg text-realm-text px-4 py-10 sm:px-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-realm-gold/5 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-realm-crimson/5 blur-[120px]" />
      </div>

      {/* ── Arena Hero ── */}
      <div className="relative mx-auto mb-10 max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-gradient-to-br from-orange-950/20 via-realm-surface to-red-950/20 px-8 py-10 shadow-2xl">
          {/* Decorative radial gradients */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-realm-gold/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-realm-crimson/5 blur-3xl" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: title */}
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-realm-gold/30 bg-gradient-to-br from-realm-gold/20 to-realm-surface text-4xl shadow-lg shadow-realm-gold/10">
                  <IconSword size={40} className="text-realm-gold" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-realm-gold/20 to-transparent blur-md" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-realm-gold/80 font-space">
                  <span className="h-px w-4 bg-realm-gold/50" />
                  Weekly Arena
                  <span className="h-px w-4 bg-realm-gold/50" />
                </div>
                <h1 className="font-cinzel text-4xl tracking-tight text-realm-cream sm:text-5xl">
                  The Weekly Trials
                </h1>
                <p className="mt-2 text-sm text-realm-muted font-lora italic">
                  Surmount these weekly trials to amass Legend Points before the arena resets.
                </p>
                {/* Countdown */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-realm-muted uppercase tracking-widest font-space">Resets in</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {[
                      { val: d, label: "d" },
                      { val: h, label: "h" },
                      { val: m, label: "m" },
                      { val: s, label: "s" },
                    ].map(({ val, label }) => (
                      <div key={label} className="flex items-baseline gap-0.5">
                        <span className="rounded-lg border border-realm-border bg-realm-surface2 px-2.5 py-1 text-base font-bold text-realm-gold tabular-nums">
                          {String(val).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-realm-muted font-space">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: progress ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-realm-border bg-realm-surface2">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(245,239,232,0.05)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#f0a868"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (totalChallenges > 0 ? completedChallenges / totalChallenges : 0))}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{ filter: "drop-shadow(0 0 4px rgba(240, 168, 104, 0.4))" }}
                  />
                </svg>
                <div className="z-10 text-center">
                  <div className="text-lg font-bold text-realm-cream font-space">
                    {completedChallenges}
                  </div>
                  <div className="text-[10px] text-realm-muted uppercase tracking-widest font-space">
                    / {totalChallenges}
                  </div>
                </div>
              </div>
              <div className="text-xs text-realm-muted uppercase tracking-widest font-space">Trials Overcome</div>
            </div>
          </div>

          {/* Progress bar across bottom */}
          <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-realm-border">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0}%`,
                background: "linear-gradient(90deg, #f0a868, #a78bfa)",
                boxShadow: "0 0 12px rgba(240,168,104,0.3)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Challenge Grid ── */}
      <div className="relative mx-auto max-w-5xl">
        {challenges.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center rounded-2xl border border-realm-border bg-realm-surface p-8">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-realm-gold/5 blur-xl" />
              <IconSword size={64} className="text-realm-muted animate-bounce" />
            </div>
            <div>
              <h2 className="font-cinzel text-2xl text-realm-cream">No trials active this week</h2>
              <p className="mt-2 text-realm-muted font-lora italic">The realm remains peaceful. Enjoy the calm before next Sunday's storm.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {challenges.map((challenge) => {
              // Map categories to realm styling
              const categoryDetails: Record<ChallengeCategory, { color: string; bg: string; border: string }> = {
                focus: { color: "#5eead4", bg: CATEGORY_BG.focus, border: "rgba(94,234,212,0.2)" },
                tasks: { color: "#f0a868", bg: CATEGORY_BG.tasks, border: "rgba(240,168,104,0.2)" },
                consistency: { color: "#a78bfa", bg: CATEGORY_BG.consistency, border: "rgba(167,139,250,0.2)" },
                social: { color: "#f87171", bg: CATEGORY_BG.social, border: "rgba(248,113,113,0.2)" },
              };
              
              const detail = categoryDetails[challenge.category];
              const pct = Math.min(
                challenge.target > 0
                  ? (challenge.progress / challenge.target) * 100
                  : 0,
                100
              );
              const isComplete =
                challenge.progress >= challenge.target && !challenge.claimed;
              const isClaimed = challenge.claimed;

              return (
                <div
                  key={challenge.id}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isComplete
                      ? "border-realm-gold shadow-[0_0_25px_rgba(240,168,104,0.15)]"
                      : isClaimed
                      ? "border-realm-border/40 bg-realm-surface2/50 opacity-60"
                      : "border-realm-border bg-realm-surface hover:border-realm-gold/30 hover:scale-[1.01]"
                  }`}
                  style={
                    isComplete
                      ? { animation: "arenaPulse 3s ease-in-out infinite" }
                      : undefined
                  }
                >
                  {/* Left accent border */}
                  <div
                    className="absolute left-0 top-0 h-full w-1"
                    style={{ backgroundColor: isClaimed ? "rgba(245,239,232,0.1)" : detail.color }}
                  />

                  {/* Subtle bg tint */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${detail.bg} 0%, transparent 60%)`,
                    }}
                  />

                  <div className="relative p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                          style={{ backgroundColor: detail.bg, border: `1px solid ${detail.color}40` }}
                        >
                          {getTrialIcon(challenge.icon, 24)}
                        </div>
                        <div>
                          <div className="font-bold text-realm-cream font-space tracking-wide leading-tight">
                            {challenge.title}
                          </div>
                          <div className="mt-1 text-xs text-realm-muted font-lora italic leading-relaxed">
                            {challenge.description}
                          </div>
                        </div>
                      </div>

                      {/* Category badge */}
                      <span
                        className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-space"
                        style={{ backgroundColor: detail.bg, color: detail.color, border: `1px solid ${detail.color}30` }}
                      >
                        {CATEGORY_LABELS[challenge.category]}
                      </span>
                    </div>

                    {/* XP reward info */}
                    <div className="mb-3 flex items-center justify-between font-space">
                      <span className="text-xs text-realm-muted">
                        Progress: <span className="text-realm-cream tabular-nums">{challenge.progress}</span> / <span className="text-realm-cream tabular-nums">{challenge.target}</span>{" "}
                        {challenge.category === "focus" && challenge.target > 10 ? "min" : challenge.category === "tasks" ? "missions" : ""}
                      </span>
                      <span className="rounded-full border border-realm-gold/30 bg-realm-gold-dim px-2.5 py-0.5 text-xs font-bold text-realm-gold">
                        +{challenge.xpReward} LP
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-realm-surface2 border border-realm-border">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isClaimed 
                            ? "linear-gradient(90deg, rgba(245,239,232,0.1), rgba(245,239,232,0.2))" 
                            : `linear-gradient(90deg, ${detail.color}, #f0a868)`,
                          boxShadow: pct > 0 && !isClaimed ? `0 0 8px ${detail.color}40` : "none",
                        }}
                      />
                    </div>

                    {/* Status text */}
                    <div className="mb-4 text-xs font-space">
                      {isClaimed ? (
                        <span className="text-realm-muted/70 flex items-center gap-1">✓ Triumph claimed</span>
                      ) : isComplete ? (
                        <span className="text-realm-gold font-bold animate-pulse flex items-center gap-1">✨ Victorious! Claim your reward</span>
                      ) : (
                        <span className="text-realm-muted font-lora italic">{challenge.target - challenge.progress} remaining to fulfill</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {isClaimed ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2 text-xs font-bold text-realm-muted">
                          Claimed
                        </div>
                      ) : isComplete ? (
                        <button
                          onClick={() => handleClaim(challenge.id)}
                          disabled={claiming === challenge.id}
                          className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-realm-gold to-orange-400 px-5 py-2.5 text-xs font-bold text-realm-bg shadow-md transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none"
                        >
                          {claiming === challenge.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-realm-bg border-t-transparent" />
                          ) : (
                            <>
                              <IconTrophy size={16} />
                              Claim LP
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-realm-border bg-realm-surface2/30 flex items-center justify-center">
                          <IconLock size={14} className="text-realm-muted/50" />
                        </div>
                      )}

                      {/* Simulate for testing */}
                      {!isClaimed && (
                        <button
                          onClick={() => handleIncrement(challenge.id)}
                          disabled={
                            incrementing === challenge.id ||
                            challenge.progress >= challenge.target
                          }
                          className={`rounded-lg border border-realm-border px-3 py-1.5 text-[10px] text-realm-muted font-space transition-all hover:border-realm-gold/40 hover:text-realm-cream disabled:pointer-events-none disabled:opacity-20 ${
                            incrementing === challenge.id ? "scale-95 opacity-50" : ""
                          }`}
                        >
                          + Simulate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes arenaPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(240,168,104,0.05), 0 0 40px rgba(240,168,104,0.02); }
          50% { box-shadow: 0 0 30px rgba(240,168,104,0.2), 0 0 60px rgba(167,139,250,0.1); }
        }
      `}</style>
    </div>
  );
}
