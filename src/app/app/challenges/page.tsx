"use client";

import { useEffect, useState } from "react";
import { useChallenges } from "@/hooks/useChallenges";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { 
  IconCircleCheck, 
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
  tasks: "Tasks",
  consistency: "Streaks",
  social: "Social",
};

const CATEGORY_BG: Record<ChallengeCategory, string> = {
  focus: "rgba(94, 234, 212, 0.1)", // teal-glow
  tasks: "rgba(240, 168, 104, 0.1)", // gold-glow
  consistency: "rgba(167, 139, 250, 0.1)", // purple-glow
  social: "rgba(248, 113, 113, 0.1)", // crimson-glow
};

function getChallengeIcon(iconStr: string, size = 24) {
  switch (iconStr) {
    case "⚔️":
      return <IconCircleCheck size={size} className="text-warm-amber" />;
    case "⏳":
      return <IconHourglass size={size} className="text-warm-teal" />;
    case "🛡️":
      return <IconShield size={size} className="text-warm-purple" />;
    case "⌛":
      return <IconClock size={size} className="text-warm-teal" />;
    case "🐉":
      return <IconFlame size={size} className="text-rose-400 animate-pulse" />;
    case "🌅":
      return <IconSun size={size} className="text-warm-amber" />;
    default:
      return <IconCircleCheck size={size} className="text-warm-amber" />;
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
          message: "Challenge complete! Keep up the great work! ✨",
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
      <div className="flex min-h-screen items-center justify-center bg-warm-bg">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-warm-amber/30 border-t-warm-amber" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">🏆</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg text-warm-text px-4 py-10 sm:px-8 font-quick">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-warm-amber/5 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-rose-500/5 blur-[120px]" />
      </div>

      {/* ── Challenges Hero ── */}
      <div className="relative mx-auto mb-10 max-w-[1400px]">
        <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-gradient-to-br from-orange-950/20 via-warm-surface to-red-950/20 px-8 py-10 shadow-2xl">
          {/* Decorative radial gradients */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-warm-amber/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: title */}
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warm-amber/30 bg-gradient-to-br from-warm-amber/20 to-warm-surface text-4xl shadow-lg shadow-warm-amber/10">
                  <IconTrophy size={40} className="text-warm-amber" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-warm-amber/20 to-transparent blur-md" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-warm-amber/80 font-space">
                  <span className="h-px w-4 bg-warm-amber/50" />
                  Weekly Goals
                  <span className="h-px w-4 bg-warm-amber/50" />
                </div>
                <h1 className="font-space font-bold text-4xl tracking-tight text-warm-cream sm:text-5xl">
                  Weekly Challenges
                </h1>
                <p className="mt-2 text-sm text-warm-textMuted font-quick italic">
                  Complete these weekly challenges to earn bonus XP before they reset.
                </p>
                {/* Countdown */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-warm-textMuted uppercase tracking-widest font-space">Resets in</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {[
                      { val: d, label: "d" },
                      { val: h, label: "h" },
                      { val: m, label: "m" },
                      { val: s, label: "s" },
                    ].map(({ val, label }) => (
                      <div key={label} className="flex items-baseline gap-0.5">
                        <span className="rounded-lg border border-warm-border bg-warm-surface2 px-2.5 py-1 text-base font-bold text-warm-amber tabular-nums">
                          {String(val).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-warm-textMuted font-space">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: progress ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-warm-border bg-warm-surface2">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.03)"
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
                  <div className="text-lg font-bold text-warm-cream font-space">
                    {completedChallenges}
                  </div>
                  <div className="text-[10px] text-warm-textMuted uppercase tracking-widest font-space">
                    / {totalChallenges}
                  </div>
                </div>
              </div>
              <div className="text-xs text-warm-textMuted uppercase tracking-widest font-space">Challenges Completed</div>
            </div>
          </div>

          {/* Progress bar across bottom */}
          <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-warm-border">
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
      <div className="relative mx-auto max-w-[1400px]">
        {challenges.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center rounded-2xl border border-warm-border bg-warm-surface p-8">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-warm-amber/5 blur-xl" />
              <IconTrophy size={64} className="text-warm-textMuted animate-bounce" />
            </div>
            <div>
              <h2 className="font-space font-bold text-2xl text-warm-cream">No challenges active this week</h2>
              <p className="mt-2 text-warm-textMuted font-quick italic">No challenges currently available. Check back soon!</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {challenges.map((challenge) => {
              // Map categories to modern styling
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
                      ? "border-warm-amber shadow-[0_0_25px_rgba(240,168,104,0.15)]"
                      : isClaimed
                      ? "border-warm-border/40 bg-warm-surface2/50 opacity-60"
                      : "border-warm-border bg-warm-surface hover:border-warm-amber/30 hover:scale-[1.01]"
                  }`}
                  style={
                    isComplete
                      ? { animation: "challengePulse 3s ease-in-out infinite" }
                      : undefined
                  }
                >
                  {/* Left accent border */}
                  <div
                    className="absolute left-0 top-0 h-full w-1"
                    style={{ backgroundColor: isClaimed ? "rgba(255,255,255,0.1)" : detail.color }}
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
                          {getChallengeIcon(challenge.icon, 24)}
                        </div>
                        <div>
                          <div className="font-bold text-warm-cream font-space tracking-wide leading-tight">
                            {challenge.title}
                          </div>
                          <div className="mt-1 text-xs text-warm-textMuted font-quick italic leading-relaxed">
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
                      <span className="text-xs text-warm-textMuted">
                        Progress: <span className="text-warm-cream tabular-nums">{challenge.progress}</span> / <span className="text-warm-cream tabular-nums">{challenge.target}</span>{" "}
                        {challenge.category === "focus" && challenge.target > 10 ? "min" : challenge.category === "tasks" ? "tasks" : ""}
                      </span>
                      <span className="rounded-full border border-warm-amber/30 bg-warm-amber/10 px-2.5 py-0.5 text-xs font-bold text-warm-amber">
                        +{challenge.xpReward} XP
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-warm-surface2 border border-warm-border">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isClaimed 
                            ? "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))" 
                            : `linear-gradient(90deg, ${detail.color}, #f0a868)`,
                          boxShadow: pct > 0 && !isClaimed ? `0 0 8px ${detail.color}40` : "none",
                        }}
                      />
                    </div>

                    {/* Status text */}
                    <div className="mb-4 text-xs font-space">
                      {isClaimed ? (
                        <span className="text-warm-textMuted/70 flex items-center gap-1">✓ Reward claimed</span>
                      ) : isComplete ? (
                        <span className="text-warm-amber font-bold animate-pulse flex items-center gap-1">✨ Challenge Completed! Claim your reward</span>
                      ) : (
                        <span className="text-warm-textMuted font-quick italic">{challenge.target - challenge.progress} remaining to complete</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {isClaimed ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2 text-xs font-bold text-warm-textMuted">
                          Claimed
                        </div>
                      ) : isComplete ? (
                        <button
                          onClick={() => handleClaim(challenge.id)}
                          disabled={claiming === challenge.id}
                          className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-warm-amber to-orange-400 px-5 py-2.5 text-xs font-bold text-warm-bg shadow-md transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none"
                        >
                          {claiming === challenge.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-warm-bg border-t-transparent" />
                          ) : (
                            <>
                              <IconTrophy size={16} />
                              Claim XP
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-warm-border bg-warm-surface2/30 flex items-center justify-center">
                          <IconLock size={14} className="text-warm-textMuted/50" />
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
                          className={`rounded-lg border border-warm-border px-3 py-1.5 text-[10px] text-warm-textMuted font-space transition-all hover:border-warm-amber/40 hover:text-warm-cream disabled:pointer-events-none disabled:opacity-20 ${
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
        @keyframes challengePulse {
          0%, 100% { box-shadow: 0 0 20px rgba(240,168,104,0.05), 0 0 40px rgba(240,168,104,0.02); }
          50% { box-shadow: 0 0 30px rgba(240,168,104,0.2), 0 0 60px rgba(167,139,250,0.1); }
        }
      `}</style>
    </div>
  );
}
