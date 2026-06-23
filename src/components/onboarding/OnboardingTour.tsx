"use client";

import { useState, useEffect } from "react";
import { fireConfetti } from "@/lib/confetti";

interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  copy: string;
  preview: React.ReactNode;
  cta?: { label: string; href: string };
}

// ── Mini animated CSS previews ──────────────────────────────────────────────

function DashboardPreview() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % 100), 50);
    return () => clearInterval(t);
  }, []);
  const xp = 2340 + tick * 4;
  const pct = Math.min((tick % 50) * 2, 100);

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-[#0d0d14] p-4 overflow-hidden select-none">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Good morning</div>
          <div className="text-sm font-bold text-white">Hey, Ankush 👋</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1">
          <span className="text-[10px] text-amber-300 font-bold">⚡ {xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Streak", val: "12🔥", col: "text-orange-400" },
          { label: "Tasks", val: "8/12", col: "text-cyan-400" },
          { label: "Focus", val: "3h 20m", col: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-white/4 p-2 text-center">
            <div className={`text-sm font-bold ${s.col}`}>{s.val}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px]">
          <span className="text-slate-500">Daily Focus Goal</span>
          <span className="text-amber-400 font-bold">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TaskPreview() {
  const [activeTask, setActiveTask] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveTask((n) => (n + 1) % 3), 2000);
    return () => clearInterval(t);
  }, []);

  const tasks = [
    { title: "Finish project proposal", priority: "🔴", xp: 50, energy: "⚡ High", done: true },
    { title: "Review pull requests", priority: "🟠", xp: 35, energy: "🧠 Medium", done: false },
    { title: "Write unit tests", priority: "🟡", xp: 25, energy: "☕ Low", done: false },
  ];

  return (
    <div className="w-full space-y-2 select-none">
      {tasks.map((t, i) => (
        <div
          key={t.title}
          className={`rounded-xl border p-3 transition-all duration-500 ${
            i === activeTask
              ? "border-purple-500/40 bg-purple-500/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
              : t.done
              ? "border-white/5 bg-white/2 opacity-50"
              : "border-white/8 bg-white/4"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">{t.priority}</span>
              <span className={`text-xs font-medium ${t.done ? "line-through text-slate-600" : "text-white"}`}>
                {t.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500">{t.energy}</span>
              <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                +{t.xp} XP
              </span>
            </div>
          </div>
        </div>
      ))}
      <div className="text-center text-[9px] text-slate-600 mt-1">AI breaks down any task automatically ✨</div>
    </div>
  );
}

function TimerPreview() {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setRunning(false); return 100; }
        return p + 0.8;
      });
    }, 40);
    return () => clearInterval(t);
  }, [running]);

  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress / 100);
  const mins = Math.floor(((100 - progress) / 100) * 25);
  const secs = Math.floor((((100 - progress) / 100) * 25 * 60) % 60);

  const color = progress < 40 ? "#8b5cf6" : progress < 70 ? "#f59e0b" : progress < 90 ? "#ef4444" : "#10b981";

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="relative h-36 w-36">
        {/* Glow */}
        <div
          className="absolute inset-4 rounded-full blur-xl transition-all duration-500"
          style={{ background: color, opacity: 0.25 }}
        />
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white font-mono">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-bold mt-0.5" style={{ color }}>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Phase label */}
      <div className="flex gap-2">
        {["🌱 Warm Up", "🔥 Flow", "⚡ Deep Work", "✅ Done"].map((phase, i) => {
          const phaseProgress = i * 33;
          const active = progress >= phaseProgress && progress < phaseProgress + 33;
          return (
            <div
              key={phase}
              className={`rounded-full px-2 py-0.5 text-[8px] font-bold transition-all duration-300 ${
                active ? "bg-white/15 text-white scale-110" : "bg-white/4 text-slate-600"
              }`}
            >
              {phase}
            </div>
          );
        })}
      </div>

      {!running && (
        <button
          onClick={() => { setProgress(0); setRunning(true); }}
          className="rounded-full bg-purple-500/20 border border-purple-500/40 px-4 py-1.5 text-[10px] font-bold text-purple-300 hover:bg-purple-500/30 transition"
        >
          ↺ Replay demo
        </button>
      )}
    </div>
  );
}

function PathsPreview() {
  const [unlocked, setUnlocked] = useState(0);

  const nodes = [
    { label: "HTML Basics", done: true },
    { label: "CSS Mastery", done: false, available: true },
    { label: "React Fundamentals", done: false, available: false },
    { label: "Next.js Pro", done: false, available: false },
  ];

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Frontend Path</div>
          <div className="text-[9px] text-slate-500">Web Development · {unlocked + 1}/4 unlocked</div>
        </div>
        <div className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[9px] text-amber-300 font-bold">
          🏆 +240 XP
        </div>
      </div>

      <div className="relative space-y-0">
        {nodes.map((node, i) => {
          const isUnlocked = i <= unlocked;
          const isAvailable = i === unlocked + 1;
          return (
            <div key={node.label} className="relative flex items-center gap-3 py-1">
              {/* Connector line */}
              {i < nodes.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[28px] h-6 w-0.5 rounded-full ${
                    isUnlocked ? "bg-purple-500" : "bg-white/10"
                  }`}
                />
              )}

              {/* Node circle */}
              <button
                onClick={() => { if (isAvailable) setUnlocked(i); }}
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                  isUnlocked
                    ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                    : isAvailable
                    ? "cursor-pointer border-purple-400 bg-transparent text-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.3)] hover:bg-purple-500/20 animate-pulse"
                    : "border-white/15 bg-transparent text-slate-700 cursor-not-allowed"
                }`}
              >
                {isUnlocked ? "✓" : isAvailable ? "▶" : "🔒"}
              </button>

              <div className={`text-xs transition-all ${isUnlocked ? "text-white font-medium" : isAvailable ? "text-purple-300" : "text-slate-700"}`}>
                {node.label}
                {isAvailable && <span className="ml-1 text-[9px] text-purple-400">← click to unlock</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PetPreview() {
  const [hatch, setHatch] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHatch((n) => (n + 1) % 4), 1200);
    return () => clearInterval(t);
  }, []);

  const stages = [
    { emoji: "🥚", label: "Mysterious Egg", xpNeeded: "0 XP", glow: "rgba(148,163,184,0.3)" },
    { emoji: "🐣", label: "Cracking...", xpNeeded: "500 XP", glow: "rgba(251,191,36,0.3)" },
    { emoji: "🦊", label: "Baby Fox", xpNeeded: "1,500 XP", glow: "rgba(249,115,22,0.3)" },
    { emoji: "🔥🦊", label: "Flame Fox", xpNeeded: "5,000 XP", glow: "rgba(239,68,68,0.3)" },
  ];

  const current = stages[hatch];

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Pet display */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-700"
          style={{ background: current.glow }}
        />
        <div
          className="relative h-24 w-24 rounded-full border-2 border-white/15 bg-[#13131c] flex items-center justify-center text-5xl transition-all duration-700 shadow-2xl"
          style={{ boxShadow: `0 0 30px ${current.glow}` }}
        >
          <span className="transition-all duration-500">{current.emoji}</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm font-bold text-white">{current.label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Unlocked at {current.xpNeeded}</div>
      </div>

      {/* Evolution stages */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1">
            <div
              className={`h-7 w-7 rounded-full border flex items-center justify-center text-base transition-all duration-300 ${
                i === hatch
                  ? "border-amber-400/60 bg-amber-400/15 scale-110"
                  : i < hatch
                  ? "border-purple-500/40 bg-purple-500/10"
                  : "border-white/10 bg-white/4 opacity-40"
              }`}
            >
              {s.emoji}
            </div>
            {i < stages.length - 1 && (
              <div className={`h-px w-3 ${i < hatch ? "bg-purple-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-[9px] text-slate-600">Evolves automatically as you earn XP</div>
    </div>
  );
}

function RewardsPreview() {
  const [purchased, setPurchased] = useState<string[]>([]);
  const xp = 3280;

  const rewards = [
    { id: "r1", name: "Custom Theme", icon: "🎨", cost: 500, desc: "Emerald workspace" },
    { id: "r2", name: "Companion Skin", icon: "✨", cost: 1000, desc: "Holographic pet" },
    { id: "r3", name: "Focus Badge", icon: "🏅", cost: 250, desc: "Profile flex" },
  ];

  return (
    <div className="w-full select-none">
      {/* XP balance */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2">
        <span className="text-xl">🪙</span>
        <div>
          <div className="text-sm font-bold text-amber-300">{xp.toLocaleString()} XP</div>
          <div className="text-[9px] text-slate-500">Available to spend</div>
        </div>
      </div>

      <div className="space-y-2">
        {rewards.map((r) => {
          const owned = purchased.includes(r.id);
          const canAfford = xp >= r.cost;
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-xl border p-2.5 transition-all duration-300 ${
                owned
                  ? "border-purple-500/40 bg-purple-500/10"
                  : "border-white/8 bg-white/4"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <div className="text-xs font-medium text-white">{r.name}</div>
                  <div className="text-[9px] text-slate-500">{r.desc}</div>
                </div>
              </div>
              <button
                onClick={() => !owned && setPurchased((p) => [...p, r.id])}
                disabled={owned || !canAfford}
                className={`rounded-lg px-2.5 py-1 text-[9px] font-bold transition ${
                  owned
                    ? "bg-purple-500/20 text-purple-300 cursor-default"
                    : canAfford
                    ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 cursor-pointer"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                }`}
              >
                {owned ? "✓ Owned" : `🪙 ${r.cost}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tour Steps ───────────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    badge: "01 / 06",
    title: "Your Focus Operating System",
    subtitle: "Built for ADHD minds. Everything in one place.",
    copy: "Focura isn't just a to-do app. It's a full workspace that tracks your focus time, streaks, XP, and progress — and makes every working hour feel like a win. Your dashboard shows exactly where you stand.",
    preview: <DashboardPreview />,
  },
  {
    id: "tasks",
    badge: "02 / 06",
    title: "Quests, Not To-Dos",
    subtitle: "Your brain craves progress signals. We built for that.",
    copy: "Every task earns XP. Set priority, energy level, and difficulty. Use AI to break down complex tasks into steps. Activate Rescue Mode when overwhelmed. Your work isn't a list — it's a quest log.",
    preview: <TaskPreview />,
    cta: { label: "Go to Tasks →", href: "/app/tasks" },
  },
  {
    id: "timer",
    badge: "03 / 06",
    title: "The Focus Timer",
    subtitle: "Track every focused minute. Watch your progress in real time.",
    copy: "Start a session. Pick your ambient soundscape — binaural beats, brown noise, or silence. Watch the ring fill. Phase by phase, your brain enters deeper focus states. Every minute earns XP.",
    preview: <TimerPreview />,
    cta: { label: "Start Focus Session →", href: "/app/timer" },
  },
  {
    id: "paths",
    badge: "04 / 06",
    title: "Mastery Paths",
    subtitle: "Turn long-term goals into a skill tree you can see.",
    copy: "Define any learning or achievement goal as a Path. Break it into nodes — each representing a milestone. Unlock nodes as you complete them. Watch your skill tree grow, node by node.",
    preview: <PathsPreview />,
  },
  {
    id: "pet",
    badge: "05 / 06",
    title: "Your Focus Companion",
    subtitle: "Your effort, made visible. It evolves with you.",
    copy: "A creature hatches as you earn XP. Stay consistent, and it grows. Different species, different evolutions. Your pet is a living reflection of how much focus you've put in — a motivation you can actually see.",
    preview: <PetPreview />,
  },
  {
    id: "rewards",
    badge: "06 / 06",
    title: "XP → Real Rewards",
    subtitle: "Every focused minute is currency.",
    copy: "Earn XP from tasks, sessions, paths, and challenges. Spend it in the Reward Shop on themes, companion skins, and custom milestones. Focura makes consistency worth something tangible.",
    preview: <RewardsPreview />,
    cta: { label: "Visit Reward Shop →", href: "/app/rewards" },
  },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  function advance() {
    if (isLast) {
      fireConfetti();
      localStorage.setItem("focura.onboarded", "1");
      onComplete();
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setExiting(false);
    }, 200);
  }

  function goBack() {
    if (step === 0) return;
    setExiting(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setExiting(false);
    }, 200);
  }

  function skip() {
    localStorage.setItem("focura.onboarded", "1");
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0a0a0f]/85 backdrop-blur-md">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-cyan-500/8 blur-[80px]" />

      <div className="relative w-full max-w-2xl mx-4">
        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? "w-6 h-2 bg-amber-400"
                  : i < step
                  ? "w-2 h-2 bg-purple-500"
                  : "w-2 h-2 bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Main card */}
        <div
          className={`rounded-3xl border border-white/10 bg-gradient-to-b from-[#13131c] to-[#0d0d14] shadow-2xl overflow-hidden transition-all duration-200 ${
            exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Preview */}
            <div className="relative p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/8 bg-[#0d0d14] min-h-[240px]">
              {/* Ambient orb */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-purple-600/15 blur-3xl" />
                <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
              </div>
              <div className="relative z-10 w-full">
                {current.preview}
              </div>
            </div>

            {/* Right: Content */}
            <div className="p-8 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-400/15 border border-amber-400/25 px-3 py-1 text-[10px] font-mono font-bold text-amber-300 tracking-wider">
                    {current.badge}
                  </span>
                  {step > 0 && step < TOUR_STEPS.length - 1 && (
                    <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-[9px] font-mono text-purple-400">
                      NEW
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2 className="font-space text-xl md:text-2xl font-bold text-white leading-tight">
                    {current.title}
                  </h2>
                  <p className="text-sm text-amber-300/80 font-medium mt-1 italic">
                    {current.subtitle}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-white/10 via-white/6 to-transparent" />

                {/* Copy */}
                <p className="text-sm text-slate-400 leading-relaxed font-quick">
                  {current.copy}
                </p>

                {/* Optional quick CTA */}
                {current.cta && (
                  <a
                    href={current.cta.href}
                    onClick={(e) => {
                      e.preventDefault();
                      skip();
                      window.location.href = current.cta!.href;
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
                  >
                    {current.cta.label}
                  </a>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={skip}
                  className="text-[10px] text-slate-600 hover:text-slate-400 transition font-quick underline underline-offset-2"
                >
                  Skip tour
                </button>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition"
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={advance}
                    className={`rounded-xl px-6 py-2 text-xs font-bold transition-all duration-200 ${
                      isLast
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0a0f] shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                        : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    }`}
                  >
                    {isLast ? "🚀 Enter Dashboard" : "Next →"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom progress bar */}
          <div className="h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step label */}
        <p className="text-center mt-4 text-[10px] text-slate-600 font-mono">
          {step + 1} of {TOUR_STEPS.length} — {current.id}
        </p>
      </div>
    </div>
  );
}
