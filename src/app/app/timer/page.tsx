"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Vessel from "@/components/timer/Vessel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useTasks } from "@/hooks/useTasks";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import PixelPet from "@/components/pet/PixelPet";
import CatRenderer from "@/components/pet/CatRenderer";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { logSession } from "@/lib/sessions";
import { PHASES, phaseFor } from "@/lib/timer/phases";
import { sound } from "@/lib/timer/sound";
import type { Task } from "@/lib/tasks/types";

// Import new audio engine
import {
  audioEngine,
  BUILT_IN_PRESETS,
  type CustomMix,
} from "@/lib/music/audioEngine";

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
  const { activePet, incrementFocusMinutes, addXpForActivePet } = usePet();
  const params = useSearchParams();

  // Setup options
  const [stage, setStage] = useState<"setup" | "entrance" | "session" | "complete">("setup");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Soundscape Selection
  const [selectedSoundscapeId, setSelectedSoundscapeId] = useState<string>("hums");
  const [customSoundscapes, setCustomSoundscapes] = useState<CustomMix[]>([]);

  // Pomodoro Cycles Mode
  const [cycleMode, setCycleMode] = useState<"single" | "pomo-25-5" | "pomo-60-10" | "pomo-180-30">("single");

  // Run Session States
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [guard, setGuard] = useState(false);
  const [muted, setMuted] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [petMsg, setPetMsg] = useState(PHASES[0].petMsg);
  const [rating, setRating] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);
  const prevPhaseRef = useRef(0);

  // Pomodoro Break States
  const [isBreakMode, setIsBreakMode] = useState(false);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [breakDuration, setBreakDuration] = useState(300); // in seconds
  const [breakCycleCount, setBreakCycleCount] = useState(0);

  // Stop confirmation states
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [wasRunningBeforeConfirm, setWasRunningBeforeConfirm] = useState(false);

  // Quest verification states
  const [taskCompletedChoice, setTaskCompletedChoice] = useState<boolean | null>(null);
  const [actualMinutesFocused, setActualMinutesFocused] = useState(0);

  const duration = minutes * 60;
  const remaining = duration - elapsed;
  const progress = stage === "complete" ? 100 : Math.min((elapsed / duration) * 100, 100);
  const phase = phaseFor(progress);
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
    const lastDur = localStorage.getItem("focura.timer.last_duration");
    const settingsDur = localStorage.getItem("focura.timer.focus_duration");
    const initialDur = lastDur ? parseInt(lastDur, 10) : (settingsDur ? parseInt(settingsDur, 10) : 25);
    if (initialDur && !isNaN(initialDur)) {
      setMinutes(initialDur);
      if (!LENGTHS.includes(initialDur)) {
        setIsCustomMode(true);
        setCustomMinutes(String(initialDur));
      }
    }

    const lastSound = localStorage.getItem("focura.timer.last_soundscape");
    if (lastSound) {
      setSelectedSoundscapeId(lastSound);
    }

    const lastCycle = localStorage.getItem("focura.timer.last_cycle_mode");
    if (lastCycle) {
      setCycleMode(lastCycle as any);
    }
  }, [params]);

  // Handle custom minutes mode input sync
  useEffect(() => {
    if (isCustomMode && customMinutes) {
      const parsed = parseInt(customMinutes);
      if (parsed > 0) setMinutes(parsed);
    }
  }, [isCustomMode, customMinutes]);

  // Rotate quotes on setup screen
  useEffect(() => {
    if (stage !== "setup") return;
    const i = setInterval(() => setQuoteIdx((q) => (q + 1) % FAMOUS_QUOTES.length), 6000);
    return () => clearInterval(i);
  }, [stage]);

  // Main Work Countdown Tick
  useEffect(() => {
    if (stage !== "session" || !running || isBreakMode) return;
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(i);
  }, [stage, running, isBreakMode]);

  // Main Break Countdown Tick
  useEffect(() => {
    if (stage !== "session" || !running || !isBreakMode) return;
    const i = setInterval(() => {
      setBreakElapsed((prev) => {
        const next = prev + 1;
        if (next >= breakDuration) {
          handleBreakEnd();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [stage, running, isBreakMode, breakDuration]);

  // Focus progress XP rewards, Hyperfocus guard, Completion triggers
  useEffect(() => {
    if (stage !== "session" || isBreakMode) return;
    if (elapsed > 0 && elapsed % 60 === 0 && elapsed < duration) awardXp(2, "timer");
    if (elapsed > 0 && elapsed % 1200 === 0 && elapsed < duration) setGuard(true);
    if (elapsed >= duration) {
      handleFocusEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, stage, isBreakMode]);

  // Phase transitions: chime, soundscape shift, pet reaction
  useEffect(() => {
    if (stage !== "session" || isBreakMode) return;
    const idx = PHASES.indexOf(phase);
    if (idx !== prevPhaseRef.current) {
      prevPhaseRef.current = idx;
      setPetMsg(phase.petMsg);

      if (!muted) {
        sound.chime();
        // Shift sound if default Hums is chosen
        if (selectedSoundscapeId === "hums") {
          sound.setAmbient(phase.ambientFreq);
        }
      }
    }
  }, [phase, stage, muted, isBreakMode, selectedSoundscapeId]);

  // Clean up both audio engines on leave
  useEffect(() => {
    return () => {
      sound.stopAmbient();
      audioEngine.stop();
    };
  }, []);

  function startSelectedSoundscape() {
    sound.stopAmbient();
    audioEngine.stop();

    if (muted) return;

    if (selectedSoundscapeId === "hums") {
      sound.startAmbient(PHASES[0].ambientFreq);
    } else if (selectedSoundscapeId !== "muted") {
      // Find preset or custom mix
      const preset = BUILT_IN_PRESETS.find((p) => p.id === selectedSoundscapeId);
      if (preset) {
        audioEngine.playMix(preset.volumes, preset.id);
      } else {
        const custom = customSoundscapes.find((c) => c.id === selectedSoundscapeId);
        if (custom) {
          audioEngine.playMix(custom.volumes, custom.id);
        }
      }
    }
  }

  function begin() {
    // Save choices to localStorage
    localStorage.setItem("focura.timer.last_duration", String(minutes));
    localStorage.setItem("focura.timer.last_soundscape", selectedSoundscapeId);
    localStorage.setItem("focura.timer.last_cycle_mode", cycleMode);

    prevPhaseRef.current = 0;
    setElapsed(0);
    setRating(null);
    setClaimed(false);
    setMinimized(false);
    setIsBreakMode(false);
    setTaskCompletedChoice(null);
    setPetMsg(PHASES[0].petMsg);
    setStage("entrance");
    setTimeout(() => {
      setStage("session");
      setRunning(true);
      bus.emit("timer:start", {});
      startSelectedSoundscape();
    }, 2800);
  }

  function transitionToComplete(finalElapsed: number) {
    setRunning(false);
    sound.stopAmbient();
    audioEngine.stop();
    if (!muted) sound.fanfare();

    const minsFocused = Math.max(0, Math.floor(finalElapsed / 60));
    setActualMinutesFocused(minsFocused);
    incrementFocusMinutes(minsFocused);

    // Save Work Log
    logSession({
      taskId: task?.id ?? null,
      taskTitle: task?.title ?? "Free focus",
      plannedMinutes: minutes,
      actualMinutes: minsFocused,
      endedAt: Date.now(),
    });

    fireConfetti();
    bus.emit("timer:session-complete", { minutes: minsFocused });
    bus.emit("pet:react", { message: "Focus session completed! Great job!" });

    bus.emit("timer:stop", {});
    setStage("complete");
  }

  function handleFocusEnd() {
    setRunning(false);
    sound.stopAmbient();
    audioEngine.stop();

    if (!muted) sound.fanfare();

    const minsFocused = Math.max(0, Math.floor(elapsed / 60));
    setActualMinutesFocused(minsFocused);
    incrementFocusMinutes(minsFocused);

    // Save Work Log
    logSession({
      taskId: task?.id ?? null,
      taskTitle: task?.title ?? "Free focus",
      plannedMinutes: minutes,
      actualMinutes: minsFocused,
      endedAt: Date.now(),
    });

    fireConfetti();
    bus.emit("timer:session-complete", { minutes: minsFocused });
    bus.emit("pet:react", { message: "Focus session completed! Great job!" });

    // Handle Pomodoro break triggers
    if (cycleMode !== "single") {
      let secondsBreak = 300; // 5 min default
      if (cycleMode === "pomo-60-10") secondsBreak = 600; // 10 min
      if (cycleMode === "pomo-180-30") secondsBreak = 1800; // 30 min

      setBreakDuration(secondsBreak);
      setBreakElapsed(0);
      setIsBreakMode(true);
      setRunning(true); // Automatically run the break countdown
      setPetMsg("Rest time! Step away from your computer. 🧘");

      // Play soft Theta waves or calm during breaks
      if (!muted) {
        const breakPreset = BUILT_IN_PRESETS.find((p) => p.id === "adhd-calm");
        if (breakPreset) {
          audioEngine.playMix(breakPreset.volumes, "break-calm");
        }
      }
    } else {
      // Transition to traditional complete stage
      bus.emit("timer:stop", {});
      setStage("complete");
    }
  }

  function handleBreakEnd() {
    setRunning(false);
    audioEngine.stop();
    if (!muted) sound.chime();
    setBreakCycleCount((c) => c + 1);
    setIsBreakMode(false);
    setElapsed(0);

    // Ask what they want to do next
    bus.emit("pet:react", { message: "Break is over! Ready to focus again?" });
    setPetMsg("Break complete! Ready to start the next focus cycle?");
  }

  function skipBreak() {
    audioEngine.stop();
    setIsBreakMode(false);
    setElapsed(0);
    setPetMsg("Ready when you are!");
  }

  function reset() {
    setElapsed(0);
    setBreakElapsed(0);
    setIsBreakMode(false);
    prevPhaseRef.current = 0;
    setPetMsg(PHASES[0].petMsg);
    setRunning(false);
    sound.stopAmbient();
    audioEngine.stop();
    setTaskCompletedChoice(null);
    setStage("setup");
    bus.emit("timer:stop", {});
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next) {
        sound.stopAmbient();
        audioEngine.stop();
      } else {
        // Resume correct audio playing depending on mode
        if (isBreakMode) {
          const breakPreset = BUILT_IN_PRESETS.find((p) => p.id === "adhd-calm");
          if (breakPreset) {
            audioEngine.playMix(breakPreset.volumes, "break-calm");
          }
        } else {
          if (selectedSoundscapeId === "hums") {
            sound.startAmbient(phase.ambientFreq);
          } else if (selectedSoundscapeId !== "muted") {
            const preset = BUILT_IN_PRESETS.find((p) => p.id === selectedSoundscapeId);
            if (preset) {
              audioEngine.playMix(preset.volumes, preset.id);
            } else {
              const custom = customSoundscapes.find((c) => c.id === selectedSoundscapeId);
              if (custom) {
                audioEngine.playMix(custom.volumes, custom.id);
              }
            }
          }
        }
      }
      return next;
    });
  }

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
        message: task.isBoss ? "BOSS DOWN! You absolute legend!" : "Quest complete! That felt good.",
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
        <div className="mx-auto max-w-5xl w-full px-4 pt-4">
          {/* Rotating quote (famous quotes) in a big bold, eye-catching font */}
          <div className="text-center py-6 max-w-3xl mx-auto min-h-[110px] flex flex-col justify-center">
            <p className="font-quick font-bold text-xs uppercase tracking-widest text-[#f0a868] mb-2">
              Choose your mission, knight.
            </p>
            <p
              key={quoteIdx}
              className="fade-in font-lora italic text-lg sm:text-xl text-[#f5efe8]/80 leading-relaxed max-w-2xl mx-auto"
            >
              &ldquo;{entranceQuote.text}&rdquo;
            </p>
            <p className="mt-2 text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">— {entranceQuote.author}</p>
          </div>

          {/* Setup layout: 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 mt-8 items-start">
            {/* LEFT COLUMN: Quests Panel */}
            <div className="space-y-4">
              <h2 className="text-sm font-quick font-bold uppercase tracking-widest text-realm-text flex items-center gap-2">
                ⚔️ Select your mission
              </h2>
              {activeTasks.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-400 bg-[#13131c]/25 border border-white/5">
                  No open quests — this will be a free focus session.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                  {activeTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTaskId(t.id)}
                      className={`glass group w-full rounded-2xl p-5 text-left transition-all duration-200 border ${
                        task?.id === t.id
                          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                          : "border-white/5 bg-[#13131c]/15 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-sm text-zinc-100 leading-snug">{t.title}</span>
                        <span className="shrink-0 rounded-lg bg-realm-gold-dim px-2.5 py-1 text-xs font-mono font-bold text-realm-gold border border-realm-gold/10">
                          +{t.xp} LP
                        </span>
                      </div>
                      {t.memoryNote && (
                        <p className="mt-2 text-xs text-realm-gold font-lora italic flex items-center gap-1">
                          <span>📜</span> <span>{t.memoryNote}</span>
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Settings & Parameters */}
            <div className="glass border border-white/10 bg-[#13131c]/40 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-sm font-quick font-bold uppercase tracking-widest text-realm-text flex items-center gap-2">
                🛡️ Battle setup
              </h2>

              {/* Duration picker (including custom duration mode) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                    Battle duration
                  </p>
                  <button
                    onClick={() => {
                      setIsCustomMode(!isCustomMode);
                      if (!isCustomMode) {
                        setMinutes(25);
                      }
                    }}
                    className={`text-[11px] font-bold underline underline-offset-2 hover:text-accent transition ${
                      isCustomMode ? "text-accent" : "text-zinc-400"
                    }`}
                  >
                    {isCustomMode ? "⚡ Quick Presets" : "✏️ Custom Period"}
                  </button>
                </div>

                {isCustomMode ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="480"
                      required
                      placeholder="Focus minutes (e.g. 50)"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-bold outline-none transition focus:border-primary text-white"
                    />
                    <div className="flex items-center px-4 bg-white/5 rounded-xl border border-white/10 text-xs text-zinc-400 font-bold">
                      {minutes} mins
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {LENGTHS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMinutes(m)}
                        className={`rounded-xl border py-3 text-sm font-bold transition-all duration-200 ${
                          minutes === m
                            ? "border-primary/60 bg-primary/20 text-white shadow-lg shadow-primary/20 scale-[1.03]"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/8"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pomodoro Cycles Mode */}
              <div className="space-y-3">
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                  Oath Cycle Mode
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "single", label: "Single Focus" },
                    { id: "pomo-25-5", label: "Pomodoro (25m/5m)" },
                    { id: "pomo-60-10", label: "Extended (1h/10m)" },
                    { id: "pomo-180-30", label: "Deep Focus (3h/30m)" },
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
                      className={`rounded-xl border px-3 py-3.5 text-xs font-semibold text-center leading-tight transition duration-150 ${
                        cycleMode === cycle.id
                          ? "border-primary/60 bg-primary/20 text-white shadow-md"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      {cycle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soundscape presets picker */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Focus Soundscape
                </p>
                <select
                  value={selectedSoundscapeId}
                  onChange={(e) => setSelectedSoundscapeId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-primary text-zinc-200 cursor-pointer"
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

              {/* Start Button */}
              <div className="pt-2">
                <button
                  onClick={begin}
                  className="w-full rounded-2xl bg-realm-gold py-4 text-base font-quick font-bold text-[#0e0c0a] hover:shadow-[0_0_25px_rgba(240,168,104,0.4)] transition hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  ⚔️ Ride to Battle
                </button>
                <p className="mt-3.5 text-center text-xs text-realm-muted font-quick font-medium">
                  {activePet.name} is battle-ready. (+{10 + minutes} LP)
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (stage === "entrance") {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0c0a] px-6 text-center">
          <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-realm-gold/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-realm-purple/5 blur-3xl" />

          <h2 className="fade-in font-cinzel text-2xl sm:text-3xl font-bold text-realm-gold tracking-widest uppercase">
            The Battle Begins.
          </h2>
          <p className="mt-1 text-xs font-quick font-bold text-realm-muted uppercase tracking-widest">{task?.title ?? "Free focus"}</p>

          <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-realm-border">
            <div className="load-bar h-full rounded-full bg-realm-gold" />
          </div>

          <p
            className="fade-in mt-10 max-w-md font-lora italic text-sm text-realm-text/80 leading-relaxed"
            style={{ animationDelay: "0.9s" }}
          >
            &ldquo;{entranceQuote.text}&rdquo;{" "}
            <span className="block not-italic text-xs text-realm-muted font-quick uppercase tracking-widest mt-2">— {entranceQuote.author}</span>
          </p>
        </div>
      );
    }

    if (stage === "complete") {
      return (
        <div className="relative mx-auto max-w-xl pt-6 px-4">
          <div className="pointer-events-none fixed left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-realm-gold/5 blur-[120px]" />

          <div className="relative text-center">
            {/* Celebrating pet */}
            <div className="float-slow mx-auto mb-4 flex h-28 w-28 items-center justify-center" role="img" aria-label="Celebrating pet">
              {activePet.id === "cat" ? (
                <CatRenderer animation="dance" className="select-none" />
              ) : (
                <PixelPet speciesId={activePet.id} animation="dance" scale={5.5} />
              )}
            </div>

            <h1 className="font-cinzel text-3xl font-bold text-realm-gold">The Battle is Won.</h1>
            <p className="mt-2 font-lora italic text-sm text-realm-muted">
              Your legend grows.
            </p>

            {/* Dynamic XP display */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-6 text-center">
              {actualMinutesFocused >= 2 ? (
                <>
                  <p className="text-5xl font-mono font-bold text-realm-gold">+{focusXp + (task && taskCompletedChoice === true ? task.xp : 0)}</p>
                  <p className="mt-1.5 text-xs font-quick font-bold uppercase tracking-widest text-realm-muted">Legend Points earned</p>
                  <div className="mt-4 flex justify-center gap-6 text-xs text-realm-muted font-quick">
                    <div>
                      <span className="font-bold text-realm-text">+{focusXp} LP</span> battle focus
                    </div>
                    {task && taskCompletedChoice === true && (
                      <div>
                        <span className="font-bold text-realm-gold">+{task.xp} LP</span> quest victory
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-4xl font-mono font-bold text-realm-muted">+0 LP</p>
                  <p className="mt-2 text-xs text-realm-muted font-quick">The battle was too brief (under 2 minutes) to record in the Chronicle.</p>
                </>
              )}
            </div>

            {/* Quest completion check card */}
            {task && actualMinutesFocused >= 2 && !claimed && (
              <Card className="mt-5 p-5 border-realm-border bg-realm-surface text-left">
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                  Quest Verification
                </p>
                <p className="mt-1.5 text-sm font-quick font-bold text-realm-text leading-snug">
                  Did you achieve victory in the quest: <span className="text-realm-gold">&ldquo;{task.title}&rdquo;</span>?
                </p>
                
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setTaskCompletedChoice(true)}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-quick font-bold transition-all duration-150 ${
                      taskCompletedChoice === true
                        ? "border-realm-teal bg-realm-teal/10 text-realm-teal"
                        : "border-realm-border bg-realm-surface2 text-realm-muted hover:border-realm-gold/30 hover:text-realm-text"
                    }`}
                  >
                    Yes, victory! (+{task.xp} LP)
                  </button>

                  <button
                    onClick={() => setTaskCompletedChoice(false)}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-quick font-bold transition-all duration-150 ${
                      taskCompletedChoice === false
                        ? "border-realm-crimson bg-realm-crimson/10 text-realm-crimson"
                        : "border-realm-border bg-realm-surface2 text-realm-muted hover:border-realm-gold/30 hover:text-realm-text"
                    }`}
                  >
                    No, not yet
                  </button>
                </div>
              </Card>
            )}

            {/* Claim/Go Action Button */}
            {!claimed ? (
              <button
                disabled={task !== undefined && actualMinutesFocused >= 2 && taskCompletedChoice === null}
                onClick={claim}
                className="mt-5 w-full rounded-xl bg-realm-gold py-3.5 text-sm font-quick font-bold text-[#0e0c0a] hover:shadow-[0_0_20px_rgba(240,168,104,0.3)] transition disabled:opacity-40 disabled:pointer-events-none"
              >
                {task !== undefined && actualMinutesFocused >= 2 && taskCompletedChoice === null
                  ? "Awaiting Quest Outcome..."
                  : "Claim your victory ⚔️"}
              </button>
            ) : (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-realm-teal/10 border border-realm-teal/20 py-3.5">
                <span className="text-realm-teal font-quick font-bold text-sm">✓ Victory Claimed!</span>
              </div>
            )}

            {/* Quote */}
            <p className="mt-6 font-lora italic text-sm text-realm-muted">
              &ldquo;{completeQuote.text}&rdquo; — {completeQuote.author}
            </p>

            {/* Difficulty rating */}
            <Card className="mt-5 p-6 text-left border-realm-border bg-realm-surface text-realm-text">
              <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                How fierce was this battle?
              </p>
              <div className="mt-3 grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => rate(n)}
                    className={`h-9 rounded-lg border text-xs font-mono font-bold transition-all duration-150 ${
                      rating === n
                        ? "border-realm-gold bg-realm-gold-dim text-realm-gold scale-110 shadow-md shadow-realm-gold/20"
                        : "border-realm-border text-realm-muted hover:border-realm-gold hover:text-realm-text"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs font-lora italic text-realm-muted">
                The Sage reflects: {insightText()}
              </p>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setStage("setup")}
                className="rounded-xl bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
              >
                Ride to Battle Again ⚔️
              </button>
              <Link
                href="/app/tasks"
                className="inline-flex items-center rounded-xl border border-realm-border bg-realm-surface2 px-5 py-2.5 text-xs font-quick font-bold text-realm-text hover:bg-realm-surface transition duration-200"
              >
                Rest before the next battle
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
      <div className="mx-auto max-w-5xl w-full px-4 pt-4">
        {/* Dynamic ambient color glow */}
        <div
          className="pointer-events-none fixed left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[120px] transition-all duration-[2000ms]"
          style={{ background: isBreakMode ? "#10b981" : phase.glow }}
        />

        {/* Phase progress bar at top */}
        <div className="fixed left-0 right-0 top-0 z-30 h-1.5">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${isBreakMode ? (breakElapsed / breakDuration) * 100 : progress}%`,
              background: isBreakMode
                ? "linear-gradient(to right, #05966980, #10b981)"
                : `linear-gradient(to right, ${phase.glow}80, ${phase.glow})`,
            }}
          />
        </div>

        {/* 2-Column Grid Layout for Active Session */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.2fr] gap-12 mt-8 items-center">
          
          {/* LEFT COLUMN: Controls & Context */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Active Quest Panel */}
            <div className="glass p-5 rounded-2xl border border-realm-border bg-realm-surface">
              <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                Mission
              </p>
              <h3 className="mt-1 text-base font-quick font-bold text-realm-text leading-snug">
                {isBreakMode ? "Rest Cycle Active 🧘" : `Mission: ${task?.title ?? "Free Focus"}`}
              </h3>
              {task && !isBreakMode && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-realm-gold-dim px-2.5 py-0.5 text-xs font-quick font-bold text-realm-gold border border-realm-gold/10">
                    {task.priority.toUpperCase()} Priority
                  </span>
                  <span className="rounded-lg bg-realm-purple/10 px-2.5 py-0.5 text-xs font-quick font-bold text-realm-purple border border-realm-purple/20">
                    {task.energy.toUpperCase()} Energy
                  </span>
                </div>
              )}
            </div>

            {/* Famous Quote Panel with Big Bold eye-catching typography */}
            <div className="glass p-6 rounded-2xl border border-realm-border bg-realm-surface min-h-[140px] flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-1 left-3 text-7xl font-serif text-white/5 pointer-events-none select-none">“</div>
              <p className="font-lora italic text-lg lg:text-xl text-[#f5efe8]/90 leading-relaxed text-center relative z-10">
                &ldquo;{isBreakMode ? breakQuote.text : sessionQuote.text}&rdquo;
              </p>
              <p className="mt-2 text-xs font-quick font-bold uppercase tracking-widest text-realm-muted text-right relative z-10">
                — {isBreakMode ? breakQuote.author : sessionQuote.author}
              </p>
            </div>

            {/* Companion pet panel */}
            <div className="glass p-5 rounded-2xl border border-realm-border bg-realm-surface flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-end justify-center shrink-0 ${
                  isBreakMode || running ? "pet-bounce-loop" : "idle"
                }`}
                role="img"
                aria-label="Pet companion"
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
                    scale={4}
                  />
                )}
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed">
                {isBreakMode ? (
                  <span>Take a well-deserved break! Grab some water, I am resting here!</span>
                ) : (
                  <span>{petMsg}</span>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="glass p-4 rounded-2xl border border-realm-border bg-realm-surface flex items-center justify-around">
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
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-text hover:bg-realm-surface transition duration-150"
                title="Reset timer"
              >
                ↺
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  setRunning((r) => {
                    const next = !r;
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
                    return next;
                  });
                }}
                aria-label={running ? "Pause" : "Play"}
                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-[#0e0c0a] shadow-lg transition-all duration-200 active:scale-95 hover:scale-105"
                style={{
                  background: isBreakMode ? "#10b981" : phase.glow,
                  boxShadow: `0 6px 20px ${isBreakMode ? "#10b981" : phase.glow}40`,
                }}
              >
                {running ? "❚❚" : "▶"}
              </button>

              {/* End / Skip Button */}
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
                    handleFocusEnd();
                  }
                }}
                aria-label={isBreakMode ? "Skip break" : "End session"}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-crimson hover:bg-realm-surface transition duration-150"
                title={isBreakMode ? "Skip break" : "Stop session"}
              >
                {isBreakMode ? "⏭" : "■"}
              </button>

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                aria-label="Toggle sound"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-text hover:bg-realm-surface transition duration-150"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? "🔇" : "🔊"}
              </button>

              {/* Minimize Button */}
              <button
                onClick={() => setMinimized(true)}
                aria-label="Minimize session"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-text hover:bg-realm-surface transition duration-150"
                title="Retreat to corner"
              >
                ⊟
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: The Big Centered Clock */}
          <div className="flex flex-col items-center justify-center order-1 lg:order-2 py-6">
            <div className="vessel-pop">
              <Vessel
                progress={isBreakMode ? (breakElapsed / breakDuration) * 100 : progress}
                colors={isBreakMode ? ["#059669", "#10b981"] : phase.liquid}
                glow={isBreakMode ? "#10b981" : phase.glow}
              />
            </div>

            {/* Big countdown time */}
            <p
              className="mt-6 font-mono text-7xl lg:text-8xl font-black tabular-nums tracking-tight transition-colors duration-1000"
              style={{ color: isBreakMode ? "#10b981" : phase.glow }}
            >
              {isBreakMode ? fmt(breakDuration - breakElapsed) : fmt(remaining)}
            </p>

            <p className="mt-2 text-sm font-cinzel font-bold text-realm-muted uppercase tracking-widest">
              {isBreakMode ? `Break Cycle (${breakCycleCount + 1})` : phase.name}
            </p>

            {/* Phase indicators */}
            {!isBreakMode && (
              <div className="mt-4 flex gap-2">
                {PHASES.map((p) => (
                  <span
                    key={p.name}
                    className="h-2.5 w-2.5 rounded-full transition-all duration-500"
                    style={{
                      background: p.name === phase.name ? p.glow : "rgba(255,255,255,0.12)",
                      transform: p.name === phase.name ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Sound label */}
            <div
              className="mt-4 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest border"
              style={{
                background: isBreakMode ? "#10b98110" : `${phase.glow}10`,
                borderColor: isBreakMode ? "#10b98125" : `${phase.glow}25`,
                color: isBreakMode ? "#10b981" : phase.glow,
              }}
            >
              {isBreakMode && !muted ? "♫ Calming Ocean waves" : soundLabelString}
            </div>
          </div>

        </div>

        {/* Hyperfocus guard modal */}
        {guard && (
          <div className="slide-down glass fixed left-1/2 top-6 z-50 w-[340px] -translate-x-1/2 overflow-hidden rounded-2xl border border-realm-gold/30 bg-realm-surface p-5 backdrop-blur-md shadow-2xl">
            <p className="text-xs font-quick font-bold text-realm-gold uppercase tracking-widest">🛡️ Your steed needs rest.</p>
            <p className="mt-2 text-xs leading-relaxed font-quick text-realm-muted">
              Even the greatest knights pause. Drink water. Breathe. The battle will wait.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setGuard(false)}
                className="flex-1 rounded-xl bg-realm-gold px-3 py-2 text-xs font-quick font-bold text-[#0e0c0a] hover:opacity-90 transition"
              >
                Keep riding
              </button>
              <button
                onClick={() => {
                  setRunning(false);
                  setGuard(false);
                  sound.stopAmbient();
                  audioEngine.stop();
                }}
                className="flex-1 rounded-xl border border-realm-border bg-realm-surface2 px-3 py-2 text-xs font-quick font-bold text-realm-text hover:bg-realm-surface transition"
              >
                Rest 10 minutes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#0e0c0a] text-realm-text overflow-x-hidden font-quick">
      {/* Animated space background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Floating animated neon orbs */}
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-realm-gold/3 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-realm-purple/3 blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute left-1/3 bottom-10 h-[500px] w-[500px] rounded-full bg-realm-gold/2 blur-[150px] animate-pulse" style={{ animationDuration: "10s" }} />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 pb-16">
        {renderStage()}
      </div>

      {/* Stop confirmation modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md rounded-2xl border border-realm-border bg-[#1a1714] p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-quick font-bold text-realm-text flex items-center gap-2">
              ⚠️ Abandon this mission?
            </h3>
            <p className="mt-3 text-sm font-quick text-realm-muted leading-relaxed">
              Are you sure you want to stop this focus session early?
              {elapsed >= 120 ? (
                <span> You will only earn focus LP for the {Math.floor(elapsed / 60)} minutes you actually spent in battle.</span>
              ) : (
                <span> Sessions under 2 minutes do not earn any Legend Points. Discarding will not reward any LP.</span>
              )}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {/* Discard Button */}
              <button
                onClick={() => {
                  setShowStopConfirm(false);
                  reset();
                }}
                className="rounded-xl border border-realm-crimson/30 bg-realm-crimson/10 px-4 py-2.5 text-sm font-quick font-bold text-realm-crimson hover:bg-realm-crimson/20 transition duration-150"
              >
                Yes, abandon it
              </button>

              {/* End & Claim Button (only if >= 2 minutes) */}
              {elapsed >= 120 && (
                <button
                  onClick={() => {
                    setShowStopConfirm(false);
                    transitionToComplete(elapsed);
                  }}
                  className="rounded-xl bg-realm-gold px-4 py-2.5 text-sm font-quick font-bold text-[#0e0c0a] hover:opacity-90 transition duration-150"
                >
                  End & Claim LP
                </button>
              )}

              {/* Resume Button */}
              <button
                onClick={() => {
                  setShowStopConfirm(false);
                  if (wasRunningBeforeConfirm) {
                    setRunning(true);
                    startSelectedSoundscape();
                  }
                }}
                className="rounded-xl bg-realm-surface2 border border-realm-border px-4 py-2.5 text-sm font-quick font-bold text-realm-text hover:bg-realm-surface transition duration-150"
              >
                Hold the line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
