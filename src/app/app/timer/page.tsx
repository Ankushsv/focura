"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Vessel from "@/components/timer/Vessel";
import { useTasks } from "@/hooks/useTasks";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import PixelPet from "@/components/pet/PixelPet";
import CatRenderer from "@/components/pet/CatRenderer";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { PHASES } from "@/lib/timer/phases";
import { sound } from "@/lib/timer/sound";
import type { Task } from "@/lib/tasks/types";
import { useTimer } from "@/components/providers/TimerProvider";

// Import audio engine and assets
import {
  audioEngine,
  BUILT_IN_PRESETS,
  type CustomMix,
} from "@/lib/music/audioEngine";

// Import premium Tabler Icons
import {
  IconTarget,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconRotate,
  IconVolume,
  IconVolumeOff,
  IconMinimize,
  IconConfetti,
  IconSparkles,
  IconCheck,
  IconX,
  IconStar,
  IconHourglassLow,
  IconFlame,
  IconExternalLink
} from "@tabler/icons-react";

const LENGTHS = [15, 25, 45, 60];

const FAMOUS_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle Onassis" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" }
];

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s) % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function TimerPage() {
  return (
    <Suspense fallback={null}>
      <TimerInner />
    </Suspense>
  );
}

function TimerInner() {
  const { tasks, loaded, completeTask, rateDifficultyAfter } = useTasks();
  const { awardXp } = useXp();
  const { activePet, addXpForActivePet } = usePet();
  const params = useSearchParams();

  const {
    stage, taskId, minutes, elapsed, running, minimized, muted, cycleMode,
    selectedSoundscapeId, isBreakMode, breakElapsed, breakDuration, breakCycleCount,
    guard, petMsg, showStopConfirm, wasRunningBeforeConfirm, actualMinutesFocused,
    taskCompletedChoice, rating, claimed, duration, remaining, progress, phase,
    setTaskId, setMinutes, setCycleMode, setSelectedSoundscapeId, setMinimized,
    setMuted, setGuard, setRunning, setStage, setShowStopConfirm,
    setWasRunningBeforeConfirm, setTaskCompletedChoice, setRating, setClaimed,
    begin, reset, skipBreak, toggleMute, transitionToComplete, startSelectedSoundscape
  } = useTimer() as any;

  // Local UI-only state
  const [customMinutes, setCustomMinutes] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customSoundscapes, setCustomSoundscapes] = useState<CustomMix[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const activeTasks = tasks.filter((t) => !t.done);
  const task: Task | undefined = tasks.find((t) => t.id === taskId) ?? activeTasks[0];

  const entranceQuote = FAMOUS_QUOTES[quoteIdx % FAMOUS_QUOTES.length];
  const sessionQuote = FAMOUS_QUOTES[Math.floor(elapsed / 600) % FAMOUS_QUOTES.length];
  const completeQuote = FAMOUS_QUOTES[(quoteIdx + 3) % FAMOUS_QUOTES.length];

  // Break Quotes list for calming thoughts
  const BREAK_QUOTES = [
    { text: "Stand up, stretch your arms, and look away from the screen.", author: "ADHD Coach" },
    { text: "Hydration break! Go grab a cool glass of water.", author: "Focura Tip" },
    { text: "Breathe in deeply, hold for 4 seconds, exhale slowly. Repeat.", author: "Mindfulness Guide" },
    { text: "Give your eyes a rest. Focus on something 20 feet away for 20 seconds.", author: "Focus Science" },
  ];
  const breakQuote = BREAK_QUOTES[breakElapsed % BREAK_QUOTES.length];

  // Load URL task, saved soundscapes, and preferences
  useEffect(() => {
    const fromUrl = params.get("task");
    if (fromUrl) setTaskId(fromUrl);

    // Load custom soundscapes
    async function fetchSounds() {
      const list = await audioEngine.loadCustomMixes();
      setCustomSoundscapes(list);
    }
    fetchSounds();

    // Choice Memory & Settings default integration
    async function loadTimerSettings() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("focus_duration")
            .eq("id", supabaseUser.id)
            .single();

          if (profile?.focus_duration) {
            setMinutes(profile.focus_duration);
            if (!LENGTHS.includes(profile.focus_duration)) {
              setIsCustomMode(true);
              setCustomMinutes(String(profile.focus_duration));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load profile timer settings:", err);
      }
    }
    loadTimerSettings();
  }, [params, setTaskId, setMinutes]);

  // Handle custom minutes mode input sync
  useEffect(() => {
    if (isCustomMode && customMinutes) {
      const parsed = parseInt(customMinutes);
      if (parsed > 0) setMinutes(parsed);
    }
  }, [isCustomMode, customMinutes, setMinutes]);

  // Rotate quotes on setup screen
  useEffect(() => {
    if (stage !== "setup") return;
    const i = setInterval(() => setQuoteIdx((q) => (q + 1) % FAMOUS_QUOTES.length), 6000);
    return () => clearInterval(i);
  }, [stage]);

  function rate(n: number) {
    setRating(n);
    if (task?.id) rateDifficultyAfter(task.id, n);
  }

  function claim() {
    const focusXp = actualMinutesFocused >= 2 ? (10 + actualMinutesFocused) : 0;
    let totalAwarded = focusXp;

    if (task && taskCompletedChoice === true) {
      totalAwarded += task.xp;
      completeTask(task.id);
      bus.emit("task:completed", { task });
      bus.emit("pet:react", {
        message: task.isBoss ? "Milestone task completed! Outstanding effort!" : "Task complete! That felt good.",
      });
    }

    if (totalAwarded > 0) {
      awardXp(totalAwarded, "timer");
      addXpForActivePet(totalAwarded);
    }
    
    setClaimed(true);
  }

  function insightText(): string {
    if (rating === null)
      return "Rate how it actually felt — every rating sharpens your personal difficulty model.";
    if (task?.difficultyBefore !== undefined) {
      const diff = task.difficultyBefore - rating;
      if (diff > 0)
        return `You predicted ${task.difficultyBefore}/10 but it felt like ${rating}/10 — your brain overestimated by ${diff}. Remember that next time a task looks scary.`;
      if (diff < 0)
        return `Tougher than expected (${task.difficultyBefore}/10 → ${rating}/10). That's data, not failure — try a breakdown next time.`;
      return "Perfectly calibrated prediction. Your difficulty model is getting sharp.";
    }
    return `Felt like a ${rating}/10. Rate tasks before starting to build your difficulty model.`;
  }

  if (!loaded) return null;

  const focusXp = actualMinutesFocused >= 2 ? (10 + actualMinutesFocused) : 0;

  const renderStage = () => {
    if (stage === "setup") {
      return (
        <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-8 space-y-8 animate-fade-in">
          {/* Top Hero quote banner */}
          <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-gradient-to-br from-warm-purple/10 via-warm-surface to-warm-amber/5 px-8 py-10 shadow-2xl">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-warm-amber/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-warm-purple/5 blur-3xl" />
            
            <div className="relative flex flex-col justify-center items-center text-center max-w-3xl mx-auto min-h-[120px]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-warm-amber/20 bg-warm-amber/10 px-3.5 py-1 text-[10px] font-quick font-bold text-warm-amber uppercase tracking-wider mb-4">
                <IconHourglassLow className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} /> Focus Session Setup
              </div>
              <p key={quoteIdx} className="font-space italic text-xl sm:text-2xl text-warm-text/90 leading-relaxed max-w-2xl mx-auto">
                &ldquo;{entranceQuote.text}&rdquo;
              </p>
              <p className="mt-3 text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted">— {entranceQuote.author}</p>
            </div>
          </div>

          {/* Setup layout: 2-column grid stretched */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
            {/* LEFT COLUMN: Tasks Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-warm-border/50 pb-2">
                <h2 className="text-sm font-quick font-bold uppercase tracking-widest text-warm-text flex items-center gap-2">
                  <IconTarget className="h-4 w-4 text-warm-amber" /> Choose Your Target Quest
                </h2>
                <span className="text-xs text-warm-textMuted font-mono">
                  {activeTasks.length} active quests
                </span>
              </div>
              
              {activeTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-border bg-warm-surface/20 p-12 text-center">
                  <span className="text-4xl mb-3">⭐</span>
                  <p className="text-sm font-quick font-bold text-warm-text">No active quests found</p>
                  <p className="text-xs text-warm-textMuted mt-1 max-w-xs leading-relaxed">
                    You can still start a free focus block to log your minutes and earn standard focus XP.
                  </p>
                  <Link
                    href="/app/tasks"
                    className="mt-4 rounded-full bg-warm-surface2 border border-warm-border text-warm-text hover:bg-warm-surface px-5 py-2 text-xs font-quick font-bold transition flex items-center gap-1.5"
                  >
                    Create a Quest <IconExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {activeTasks.map((t) => {
                    const isSelected = task?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTaskId(t.id)}
                        className={`w-full rounded-2xl p-5 text-left transition-all duration-300 border ${
                          isSelected
                            ? "border-warm-amber bg-warm-amber/10 shadow-lg shadow-warm-amber/5 translate-x-1"
                            : "border-warm-border bg-warm-surface hover:border-warm-border/80 hover:bg-warm-surface2/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className={`font-space text-sm font-bold block ${isSelected ? "text-warm-text" : "text-warm-textMuted group-hover:text-warm-text"}`}>
                              {t.title}
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider font-quick border ${
                                t.priority === "critical"
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : t.priority === "high"
                                  ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              }`}>
                                {t.priority}
                              </span>
                              <span className="rounded bg-warm-surface2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider font-quick text-warm-textMuted border border-warm-border">
                                {t.energy} energy
                              </span>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 font-mono text-xs font-bold border transition ${
                            isSelected
                              ? "bg-warm-amber/25 text-warm-amber border-warm-amber/30"
                              : "bg-warm-surface2 text-warm-textMuted border-warm-border"
                          }`}>
                            +{t.xp} XP
                          </span>
                        </div>
                        {t.memoryNote && (
                          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-warm-purple/5 border border-warm-purple/10 px-3 py-1.5 text-xs text-warm-cream font-quick italic">
                            <span>📝</span>
                            <span className="truncate">{t.memoryNote}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Settings Dashboard */}
            <div className="rounded-3xl border border-warm-border bg-warm-surface p-6 sm:p-8 space-y-6 shadow-2xl">
              <h2 className="text-sm font-quick font-bold uppercase tracking-widest text-warm-text flex items-center gap-2 border-b border-warm-border/50 pb-2">
                <IconClock className="h-4 w-4 text-warm-amber" /> Session Configuration
              </h2>

              {/* Time Setup */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    Duration Focus
                  </p>
                  <button
                    onClick={() => {
                      setIsCustomMode(!isCustomMode);
                      if (!isCustomMode) setMinutes(25);
                    }}
                    className="text-[11px] font-quick font-bold text-warm-amber hover:underline flex items-center gap-1"
                  >
                    {isCustomMode ? "⚡ Presets" : "✏️ Custom Duration"}
                  </button>
                </div>

                {isCustomMode ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      required
                      placeholder="Minutes (e.g. 50)"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="flex-1 rounded-xl border border-warm-border bg-warm-surface2 px-4 py-3 text-sm font-bold text-warm-text placeholder-warm-textMuted/45 outline-none focus:border-warm-amber transition"
                    />
                    <div className="flex items-center px-4 bg-warm-surface2 rounded-xl border border-warm-border text-xs text-warm-textMuted font-mono">
                      {minutes} min
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {LENGTHS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinutes(m)}
                        className={`rounded-xl border py-3 text-sm font-bold transition-all duration-300 ${
                          minutes === m
                            ? "border-warm-amber bg-warm-amber/15 text-warm-amber shadow-[0_0_15px_rgba(240,168,104,0.1)] scale-[1.03]"
                            : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:border-warm-border/80 hover:text-warm-text"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cycle Modes Grid */}
              <div className="space-y-3">
                <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                  Flow Cycle Style
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "single", label: "Single Focus", desc: "Straight countdown block" },
                    { id: "pomo-25-5", label: "Pomodoro (25m/5m)", desc: "Standard productivity loop" },
                    { id: "pomo-60-10", label: "Extended (1h/10m)", desc: "Long focus, deeper breaks" },
                    { id: "pomo-180-30", label: "Deep Focus (3h/30m)", desc: "Extreme work block" },
                  ].map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => {
                        setCycleMode(cycle.id as any);
                        if (cycle.id === "pomo-25-5") setMinutes(25);
                        else if (cycle.id === "pomo-60-10") setMinutes(60);
                        else if (cycle.id === "pomo-180-30") setMinutes(180);
                      }}
                      className={`rounded-xl border p-3.5 text-left transition-all duration-300 ${
                        cycleMode === cycle.id
                          ? "border-warm-amber bg-warm-amber/10 shadow-sm"
                          : "border-warm-border bg-warm-surface2 hover:border-warm-border/85"
                      }`}
                    >
                      <p className={`text-xs font-bold ${cycleMode === cycle.id ? "text-warm-amber" : "text-warm-text"}`}>
                        {cycle.label}
                      </p>
                      <p className="text-[9px] text-warm-textMuted mt-0.5 leading-snug">{cycle.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Soundscapes */}
              <div className="space-y-3">
                <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                  Focus Ambience Soundscape
                </p>
                <select
                  value={selectedSoundscapeId}
                  onChange={(e) => setSelectedSoundscapeId(e.target.value)}
                  className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-3 text-sm font-semibold outline-none focus:border-warm-amber text-warm-text cursor-pointer transition"
                >
                  <option value="hums">🔊 Phase Hums (Default Ambient)</option>
                  <option value="muted">🔇 Muted / Silent</option>
                  <optgroup label="Curated Preset Environments">
                    {BUILT_IN_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon} {p.name} ({p.genre})
                      </option>
                    ))}
                  </optgroup>
                  {customSoundscapes.length > 0 && (
                    <optgroup label="My Custom Focus Mixes">
                      {customSoundscapes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name} (Custom Preset)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Start Session */}
              <div className="pt-2">
                <button
                  onClick={begin}
                  className="w-full rounded-2xl bg-gradient-to-r from-warm-amber to-warm-amber/80 py-4 text-base font-space font-bold text-warm-bg shadow-[0_0_20px_rgba(240,168,104,0.2)] hover:shadow-[0_0_30px_rgba(240,168,104,0.4)] hover:scale-[1.01] active:scale-[0.99] transition duration-300 flex items-center justify-center gap-2"
                >
                  <IconFlame className="h-5 w-5 animate-pulse" /> Activate Focus Field
                </button>
                <p className="mt-3.5 text-center text-xs text-warm-textMuted font-quick font-medium">
                  {activePet.name} is ready. (+{10 + minutes} XP)
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stage === "entrance") {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07070c] px-6 text-center select-none">
          {/* Animated Void Background Orbs */}
          <div className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-warm-amber/5 blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="pointer-events-none absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-warm-purple/5 blur-[120px] animate-pulse" style={{ animationDuration: "10s" }} />

          <div className="relative z-10 space-y-12 max-w-2xl">
            {/* Spinning preparation indicator */}
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-white/2">
              <div className="absolute inset-0 rounded-full border-2 border-t-warm-amber border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "1.5s" }} />
              <IconHourglassLow className="h-8 w-8 text-warm-amber animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="font-space text-3xl font-bold tracking-widest text-[#f5efe8] uppercase">
                Focus Block Initialized.
              </h2>
              <p className="text-xs font-quick font-bold text-warm-amber uppercase tracking-widest">
                Target: {task?.title ?? "Free focus Block"}
              </p>
            </div>

            <p className="fade-in max-w-xl font-quick italic text-lg sm:text-xl text-warm-text/80 leading-relaxed mx-auto border-t border-b border-white/10 py-6">
              &ldquo;{entranceQuote.text}&rdquo;{" "}
              <span className="block not-italic text-xs text-warm-textMuted font-quick uppercase tracking-widest mt-3">— {entranceQuote.author}</span>
            </p>

            <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted animate-pulse">
              Stepping out of the noise. Hold steady...
            </p>
          </div>
        </div>
      );
    }

    if (stage === "complete") {
      return (
        <div className="relative mx-auto max-w-2xl pt-6 px-4 animate-fade-in select-none">
          <div className="pointer-events-none fixed left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-amber/5 blur-[150px]" />

          <div className="relative text-center space-y-6">
            {/* Celebrating pet */}
            <div className="float-slow mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-warm-surface border border-warm-border p-4 shadow-xl">
              {activePet.id === "cat" ? (
                <CatRenderer animation="dance" className="select-none" />
              ) : (
                <PixelPet speciesId={activePet.id} animation="dance" scale={5.5} />
              )}
            </div>

            <div className="space-y-1">
              <h1 className="font-space text-4xl font-black text-warm-amber tracking-tight flex items-center justify-center gap-2">
                <IconSparkles className="h-8 w-8 text-warm-amber animate-pulse" /> Focus Block Completed!
              </h1>
              <p className="font-quick text-sm text-warm-textMuted font-bold">
                Your focus session has been securely logged to the consistency wall.
              </p>
            </div>

            {/* Dynamic XP Ring Showcase */}
            <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-gradient-to-br from-warm-amber/10 via-warm-surface to-warm-purple/5 p-8 text-center shadow-2xl">
              {actualMinutesFocused >= 2 ? (
                <div className="space-y-4">
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-warm-amber/35 bg-warm-bg shadow-[0_0_20px_rgba(240,168,104,0.15)]">
                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-warm-amber/20 animate-spin" style={{ animationDuration: "12s" }} />
                    <p className="text-4xl font-mono font-bold text-warm-amber">
                      +{focusXp + (task && taskCompletedChoice === true ? task.xp : 0)}
                    </p>
                  </div>
                  <p className="text-xs font-quick font-bold uppercase tracking-widest text-warm-textMuted">Total XP Earned</p>
                  <div className="flex justify-center gap-8 text-xs text-warm-textMuted font-quick border-t border-warm-border/50 pt-4">
                    <div>
                      <span className="font-bold text-warm-text">+{focusXp} XP</span> focus reward
                    </div>
                    {task && taskCompletedChoice === true && (
                      <div>
                        <span className="font-bold text-warm-amber">+{task.xp} XP</span> task completed
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-4xl font-mono font-bold text-warm-textMuted">+0 XP</p>
                  <p className="text-xs text-warm-textMuted font-quick font-bold">
                    This focus block was too brief (under 2 minutes) to record any XP gains. Keep going next time!
                  </p>
                </div>
              )}
            </div>

            {/* Task completion check card */}
            {task && actualMinutesFocused >= 2 && !claimed && (
              <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 text-left space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-warm-border/50 pb-2">
                  <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted">
                    Quest Status Check
                  </p>
                  <span className="rounded bg-warm-amber/15 px-2 py-0.5 text-[9px] font-bold text-warm-amber uppercase tracking-wider">
                    +{task.xp} XP Quest
                  </span>
                </div>
                <p className="text-sm font-space font-bold text-warm-text leading-relaxed">
                  Did you achieve your goal for: <span className="text-warm-amber">&ldquo;{task.title}&rdquo;</span>?
                </p>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setTaskCompletedChoice(true)}
                    className={`rounded-xl border py-3 text-xs font-quick font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      taskCompletedChoice === true
                        ? "border-warm-teal bg-warm-teal/10 text-warm-teal shadow-md"
                        : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:border-warm-amber/35 hover:text-warm-text"
                    }`}
                  >
                    <IconCheck className="h-4 w-4" /> Yes, completed!
                  </button>

                  <button
                    onClick={() => setTaskCompletedChoice(false)}
                    className={`rounded-xl border py-3 text-xs font-quick font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      taskCompletedChoice === false
                        ? "border-red-500/20 bg-red-500/10 text-red-400 shadow-md"
                        : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:border-warm-amber/35 hover:text-warm-text"
                    }`}
                  >
                    <IconX className="h-4 w-4" /> No, not yet
                  </button>
                </div>
              </div>
            )}

            {/* Claim/Go Action Button */}
            {!claimed ? (
              <button
                disabled={task !== undefined && actualMinutesFocused >= 2 && taskCompletedChoice === null}
                onClick={claim}
                className="w-full rounded-2xl bg-warm-amber py-4 text-sm font-space font-bold text-warm-bg shadow-[0_0_20px_rgba(240,168,104,0.15)] hover:shadow-[0_0_30px_rgba(240,168,104,0.35)] transition duration-300 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                <IconConfetti className="h-4 w-4" /> {task !== undefined && actualMinutesFocused >= 2 && taskCompletedChoice === null
                  ? "Select Quest Outcome Above..."
                  : "Claim Focus Rewards & XP"}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-warm-teal/10 border border-warm-teal/20 py-4 shadow-sm">
                <IconCheck className="h-5 w-5 text-warm-teal animate-bounce" />
                <span className="text-warm-teal font-space font-bold text-sm uppercase tracking-wider">Rewards Claimed Successfully!</span>
              </div>
            )}

            {/* Difficulty rating slider card */}
            <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 text-left space-y-4 shadow-xl">
              <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted border-b border-warm-border/50 pb-2">
                Evaluate Cognitive Intensity / Focus Resistance
              </p>
              <p className="text-xs text-warm-textMuted font-quick font-bold">
                How much mental effort or resistance did you experience during this focus block? (1 = Easiest, 10 = Hardest)
              </p>
              <div className="grid grid-cols-10 gap-1.5 pt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => rate(n)}
                    className={`h-10 rounded-lg border text-xs font-mono font-bold transition-all duration-300 ${
                      rating === n
                        ? "border-warm-amber bg-warm-amber/15 text-warm-amber scale-110 shadow-lg shadow-warm-amber/25"
                        : "border-warm-border text-warm-textMuted hover:border-warm-amber hover:text-warm-text"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-warm-surface2 border border-warm-border p-4 flex gap-3 mt-4">
                <span className="text-warm-amber text-lg">💡</span>
                <p className="text-xs font-quick font-medium italic text-warm-textMuted leading-relaxed">
                  {insightText()}
                </p>
              </div>
            </div>

            {/* Completion Quote */}
            <p className="font-quick italic text-xs text-warm-textMuted max-w-md mx-auto leading-relaxed">
              &ldquo;{completeQuote.text}&rdquo; — {completeQuote.author}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setStage("setup")}
                className="rounded-full bg-warm-amber text-warm-bg px-6 py-3 text-xs font-space font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
              >
                Re-Engage Focus
              </button>
              <Link
                href="/app/tasks"
                className="inline-flex items-center rounded-full border border-warm-border bg-warm-surface2 px-6 py-3 text-xs font-space font-bold text-warm-text hover:bg-warm-surface hover:text-[#f5efe8] transition duration-200"
              >
                Return to Quest Board
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (minimized) {
      const activeLabel = isBreakMode ? fmt(breakDuration - breakElapsed) : fmt(remaining);
      const progressPercent = isBreakMode ? (breakElapsed / breakDuration) * 100 : progress;
      const progressColor = isBreakMode ? "#10b981" : phase.glow;
      return (
        <div className="relative">
          <div className="pt-24 text-center text-sm text-zinc-500 font-medium">
            Session running in the corner. Stay with it — {activeLabel} left.
          </div>
          <button
            onClick={() => setMinimized(false)}
            className="glass fixed bottom-24 right-5 z-40 flex items-center gap-3 p-3 text-left hover:border-white/20 bg-[#13131c]/80 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-200"
            aria-label="Expand focus session"
          >
            <Vessel
              progress={progressPercent}
              colors={isBreakMode ? ["#059669", "#10b981"] : phase.liquid}
              glow={progressColor}
              size={48}
              mini
            />
            <div>
              <p className="text-xs font-semibold" style={{ color: progressColor }}>
                {isBreakMode ? "Break Phase" : `${Math.round(progress)}% · ${phase.name}`}
              </p>
              <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%`, background: progressColor }}
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-400">🐥 {activeLabel} left · tap to expand</p>
            </div>
          </button>
        </div>
      );
    }

    /* Active Session Stage */
    const soundLabelString = muted
      ? "Muted 🔇"
      : selectedSoundscapeId === "hums"
      ? `♫ Phase Hum (${fmt(elapsed)})`
      : selectedSoundscapeId === "muted"
      ? "Silence 🔇"
      : `♫ ${
          BUILT_IN_PRESETS.find((p) => p.id === selectedSoundscapeId)?.name ||
          customSoundscapes.find((c) => c.id === selectedSoundscapeId)?.name ||
          "Soundscape"
        }`;

    return (
      <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-8 space-y-8 animate-fade-in relative z-10">
        {/* Dynamic ambient color glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[130px] transition-all duration-[2000ms]"
          style={{ background: isBreakMode ? "#10b981" : phase.glow }}
        />

        {/* Phase progress bar at top */}
        <div className="fixed left-0 right-0 top-0 z-40 h-2 bg-warm-border/10">
          <div
            className="h-full transition-all duration-[1000ms] ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            style={{
              width: `${isBreakMode ? (breakElapsed / breakDuration) * 100 : progress}%`,
              background: isBreakMode
                ? "linear-gradient(to right, #05966980, #10b981)"
                : `linear-gradient(to right, ${phase.glow}80, ${phase.glow})`,
            }}
          />
        </div>

        {/* Stretched Focus Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-12 items-center min-h-[70vh]">
          
          {/* LEFT COLUMN: Cockpit metrics & Ambient control */}
          <div className="space-y-6 order-2 lg:order-1 relative z-20">
            {/* Active Quest Panel */}
            <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-warm-amber/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted">
                  Focus Lock Target
                </p>
                <h3 className="text-lg font-space font-bold text-warm-text leading-snug">
                  {isBreakMode ? "Rest Cycle Active 🧘" : `${task?.title ?? "Free Focus Session"}`}
                </h3>
                {task && !isBreakMode && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="rounded-lg bg-warm-amber/15 border border-warm-amber/20 px-3 py-0.5 text-[10px] font-quick font-bold text-warm-amber uppercase tracking-wider flex items-center gap-1">
                      <IconFlame className="h-3.5 w-3.5 animate-pulse" /> {task.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="rounded-lg bg-warm-purple/10 border border-warm-purple/20 px-3 py-0.5 text-[10px] font-quick font-bold text-warm-purple uppercase tracking-wider">
                      {task.energy.toUpperCase()} ENERGY
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Immersive Quote Box */}
            <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 min-h-[140px] flex flex-col justify-center relative overflow-hidden shadow-xl">
              <div className="absolute top-1 left-3 text-8xl font-serif text-white/5 pointer-events-none select-none">“</div>
              <p className="font-quick italic text-lg text-warm-text/90 leading-relaxed text-center relative z-10">
                &ldquo;{isBreakMode ? breakQuote.text : sessionQuote.text}&rdquo;
              </p>
              <p className="mt-3 text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted text-right relative z-10">
                — {isBreakMode ? breakQuote.author : sessionQuote.author}
              </p>
            </div>

            {/* Focus Pet Companion and Speech Area */}
            <div className="rounded-2xl border border-warm-border bg-warm-surface p-5 flex items-center gap-5 shadow-xl">
              <div
                className={`flex h-16 w-16 items-end justify-center shrink-0 rounded-xl border border-warm-border bg-warm-surface2 p-1.5 shadow-sm ${
                  isBreakMode || running ? "pet-bounce-loop" : "idle"
                }`}
                role="img"
                aria-label="Companion avatar"
              >
                {activePet.id === "cat" ? (
                  <CatRenderer
                    animation={isBreakMode ? "idle" : running ? "walk" : "idle"}
                    className="select-none"
                  />
                ) : (
                  <PixelPet
                    speciesId={activePet.id}
                    animation={isBreakMode ? "idle" : running ? "walk" : "idle"}
                    scale={4.2}
                  />
                )}
              </div>
              <div className="text-xs text-zinc-300 font-quick font-medium leading-relaxed">
                {isBreakMode ? (
                  <span className="text-warm-teal font-bold animate-pulse">Take a breather, you earned this rest cycle! I am chilling right here.</span>
                ) : (
                  <span>{petMsg}</span>
                )}
              </div>
            </div>

            {/* Sound Level & Waveform Display */}
            <div className="rounded-2xl border border-warm-border bg-warm-surface px-6 py-4 flex items-center justify-between shadow-xl">
              <span className="text-[10px] font-space font-bold uppercase tracking-widest text-warm-textMuted">
                {isBreakMode && !muted ? "♫ Break Calming Waves" : soundLabelString}
              </span>
              
              {/* Waveform Visualization */}
              {running && !muted && selectedSoundscapeId !== "muted" && (
                <div className="flex items-end gap-1 h-5 select-none opacity-80">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full animate-bounce"
                      style={{
                        animationDuration: `${0.6 + i * 0.15}s`,
                        height: `${25 + Math.sin(i) * 60}%`,
                        backgroundColor: isBreakMode ? "#10b981" : phase.glow
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: The Immersive Centered Vessel & Clock */}
          <div className="flex flex-col items-center justify-center order-1 lg:order-2 py-6 relative z-10">
            {/* Ambient shadow backing the Vessel */}
            <div 
              className="absolute h-96 w-96 rounded-full blur-[140px] opacity-10 pointer-events-none animate-pulse"
              style={{ background: isBreakMode ? "#10b981" : phase.glow, animationDuration: "5s" }}
            />
            
            <div className="vessel-pop relative">
              <Vessel
                progress={isBreakMode ? (breakElapsed / breakDuration) * 100 : progress}
                colors={isBreakMode ? ["#059669", "#10b981"] : phase.liquid}
                glow={isBreakMode ? "#10b981" : phase.glow}
                size={340}
                timeLabel={isBreakMode ? fmt(breakDuration - breakElapsed) : fmt(remaining)}
              />
            </div>

            <p className="mt-4 text-xs font-space font-bold uppercase tracking-widest" style={{ color: isBreakMode ? "#10b981" : phase.glow }}>
              {isBreakMode ? `Break Cycle (${breakCycleCount + 1})` : phase.name}
            </p>

            {/* Active phase indicators */}
            {!isBreakMode && (
              <div className="mt-4 flex gap-2.5">
                {PHASES.map((p) => (
                  <span
                    key={p.name}
                    className="h-2.5 w-2.5 rounded-full transition-all duration-[600ms] border border-white/5"
                    style={{
                      background: p.name === phase.name ? p.glow : "rgba(255,255,255,0.08)",
                      transform: p.name === phase.name ? "scale(1.25)" : "scale(1)",
                      boxShadow: p.name === phase.name ? `0 0 10px ${p.glow}` : "none",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Global Floating Control Capsule bottom center */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-warm-surface/85 backdrop-blur-xl border border-warm-border px-8 py-3.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5),_0_0_20px_rgba(240,168,104,0.05)] flex items-center gap-6">
          {/* Reset Button */}
          <button
            onClick={() => {
              if (elapsed > 0 && elapsed < duration) {
                setWasRunningBeforeConfirm(running);
                setRunning(false);
                sound.stopAmbient();
                audioEngine.stop();
                setShowStopConfirm(true);
              } else {
                reset();
              }
            }}
            aria-label="Reset session"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-warm-surface text-warm-textMuted hover:text-warm-text hover:bg-warm-surface2 transition duration-200"
            title="Reset timer"
          >
            <IconRotate className="h-4 w-4" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={() => {
              const next = !running;
              setRunning(next);
              if (isBreakMode) {
                if (next && !muted) {
                  const breakPreset = BUILT_IN_PRESETS.find((p) => p.id === "adhd-calm");
                  if (breakPreset) audioEngine.playMix(breakPreset.volumes, "break-calm");
                } else {
                  audioEngine.stop();
                }
              } else {
                if (next) {
                  bus.emit("timer:resume", {});
                  startSelectedSoundscape();
                } else {
                  bus.emit("timer:pause", {});
                  sound.stopAmbient();
                  audioEngine.stop();
                }
              }
            }}
            aria-label={running ? "Pause" : "Play"}
            className="flex h-14 w-14 items-center justify-center rounded-full text-warm-bg shadow-xl transition-all duration-300 active:scale-95 hover:scale-105"
            style={{
              background: isBreakMode ? "#10b981" : phase.glow,
              boxShadow: `0 0 20px ${isBreakMode ? "#10b981" : phase.glow}45`,
            }}
          >
            {running ? <IconPlayerPause className="h-5 w-5 text-warm-bg fill-current" /> : <IconPlayerPlay className="h-5 w-5 text-warm-bg fill-current ml-0.5" />}
          </button>

          {/* Stop / Skip Button */}
          <button
            onClick={() => {
              if (isBreakMode) {
                skipBreak();
              } else if (elapsed > 0 && elapsed < duration) {
                setWasRunningBeforeConfirm(running);
                setRunning(false);
                sound.stopAmbient();
                audioEngine.stop();
                setShowStopConfirm(true);
              } else {
                transitionToComplete(elapsed);
              }
            }}
            aria-label={isBreakMode ? "Skip break" : "End session"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-warm-surface text-warm-textMuted hover:text-red-400 hover:bg-warm-surface2 transition duration-200"
            title={isBreakMode ? "Skip break" : "Stop session"}
          >
            <IconPlayerStop className="h-4 w-4" />
          </button>

          {/* Vertical divider */}
          <div className="w-[1px] h-6 bg-warm-border/50" />

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            aria-label="Toggle sound"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-warm-surface text-warm-textMuted hover:text-warm-text hover:bg-warm-surface2 transition duration-200"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolume className="h-4 w-4" />}
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setMinimized(true)}
            aria-label="Minimize session"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-warm-border bg-warm-surface text-warm-textMuted hover:text-warm-text hover:bg-warm-surface2 transition duration-200"
            title="Minimize to corner"
          >
            <IconMinimize className="h-4 w-4" />
          </button>
        </div>

        {/* Hyperfocus guard overlay panel */}
        {guard && (
          <div className="slide-down fixed left-1/2 top-8 z-50 w-[360px] -translate-x-1/2 overflow-hidden rounded-2xl border border-warm-amber/35 bg-warm-surface p-6 shadow-2xl backdrop-blur-md animate-fade-in">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div className="space-y-1">
                <p className="text-xs font-space font-bold text-warm-amber uppercase tracking-wider">Break Guard Active</p>
                <p className="text-xs leading-relaxed text-warm-textMuted font-quick font-medium">
                  ADHD minds frequently bypass breaks. Go stretch, drink some water. I am keeping watch here.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setGuard(false)}
                className="flex-1 rounded-xl bg-warm-amber px-3 py-2.5 text-xs font-space font-bold text-warm-bg hover:opacity-90 transition"
              >
                Skip & Work
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setGuard(false);
                  sound.stopAmbient();
                  audioEngine.stop();
                }}
                className="flex-1 rounded-xl border border-warm-border bg-warm-surface2 px-3 py-2.5 text-xs font-space font-bold text-warm-text hover:bg-warm-surface transition"
              >
                Accept Break
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-warm-bg text-warm-text overflow-x-hidden font-quick">
      {/* Space grid theme styling */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -left-20 top-10 h-[500px] w-[500px] rounded-full bg-warm-amber/2 blur-[130px] animate-pulse" style={{ animationDuration: "9s" }} />
        <div className="absolute -right-20 top-1/3 h-[500px] w-[500px] rounded-full bg-warm-purple/2 blur-[130px] animate-pulse" style={{ animationDuration: "13s" }} />
      </div>

      {/* Primary content node */}
      <div className="relative z-10 pb-20">
        {renderStage()}
      </div>

      {/* Stop verification modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-2xl animate-scale-in space-y-4">
            <h3 className="text-lg font-space font-bold text-warm-text flex items-center gap-2 border-b border-warm-border/50 pb-2">
              ⚠️ Stop Focus Session?
            </h3>
            <p className="text-xs font-quick text-warm-textMuted leading-relaxed">
              Are you sure you want to end this focus block early?
              {elapsed >= 120 ? (
                <span className="block mt-2 font-bold text-warm-amber">
                  You will earn XP for the {Math.floor(elapsed / 60)} minutes completed.
                </span>
              ) : (
                <span className="block mt-2 font-bold text-red-400">
                  Blocks under 2 minutes do not save focus data or award any XP.
                </span>
              )}
            </p>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowStopConfirm(false);
                  reset();
                }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-space font-bold text-red-400 hover:bg-red-500/20 transition duration-150"
              >
                Discard Session
              </button>

              {elapsed >= 120 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowStopConfirm(false);
                    transitionToComplete(elapsed);
                  }}
                  className="rounded-xl bg-warm-amber px-4 py-2.5 text-xs font-space font-bold text-warm-bg hover:opacity-90 transition duration-150"
                >
                  End & Claim XP
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowStopConfirm(false);
                  if (wasRunningBeforeConfirm) {
                    setRunning(true);
                    startSelectedSoundscape();
                  }
                }}
                className="rounded-xl bg-warm-surface2 border border-warm-border px-4 py-2.5 text-xs font-space font-bold text-warm-text hover:bg-warm-surface transition duration-150"
              >
                Resume Focus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
