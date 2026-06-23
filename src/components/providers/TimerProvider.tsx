"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { PHASES, phaseFor, type Phase } from "@/lib/timer/phases";
import { sound } from "@/lib/timer/sound";
import { audioEngine, BUILT_IN_PRESETS } from "@/lib/music/audioEngine";
import { logSession } from "@/lib/sessions";
import { useTasks } from "@/hooks/useTasks";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";

// ─── Types ────────────────────────────────────────────────────────────────────
export type TimerStage = "setup" | "entrance" | "session" | "complete";
export type CycleMode =
  | "single"
  | "pomo-25-5"
  | "pomo-60-10"
  | "pomo-180-30";

export interface TimerContextValue {
  stage: TimerStage;
  taskId: string | null;
  minutes: number;
  elapsed: number;
  running: boolean;
  minimized: boolean;
  muted: boolean;
  cycleMode: CycleMode;
  selectedSoundscapeId: string;
  isBreakMode: boolean;
  breakElapsed: number;
  breakDuration: number;
  breakCycleCount: number;
  guard: boolean;
  petMsg: string;
  showStopConfirm: boolean;
  wasRunningBeforeConfirm: boolean;
  actualMinutesFocused: number;
  taskCompletedChoice: boolean | null;
  rating: number | null;
  claimed: boolean;
  duration: number;
  remaining: number;
  progress: number;
  phase: Phase;

  setTaskId: (id: string | null) => void;
  setMinutes: (m: number) => void;
  setCycleMode: (mode: CycleMode) => void;
  setSelectedSoundscapeId: (id: string) => void;
  setMinimized: (v: boolean) => void;
  setMuted: (v: boolean) => void;
  setGuard: (v: boolean) => void;
  setRunning: (v: boolean) => void;
  setStage: (s: TimerStage) => void;
  setShowStopConfirm: (v: boolean) => void;
  setWasRunningBeforeConfirm: (v: boolean) => void;
  setTaskCompletedChoice: (v: boolean | null) => void;
  setRating: (v: number | null) => void;
  setClaimed: (v: boolean) => void;
  begin: () => void;
  reset: () => void;
  skipBreak: () => void;
  toggleMute: () => void;
  transitionToComplete: (finalElapsed: number) => void;
  startSelectedSoundscape: () => void;
  broadcastProgress: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TimerProvider({ children }: { children: ReactNode }) {
  const { tasks, updateTimeCalibration } = useTasks();
  const { awardXp } = useXp();
  const { activePet, incrementFocusMinutes, addXpForActivePet } = usePet();

  const [stage, setStage] = useState<TimerStage>("setup");
  const [taskId, setTaskId] = useState<string | null>(null);

  const activeTasks = tasks ? tasks.filter((t) => !t.done) : [];
  const task = tasks ? (tasks.find((t) => t.id === taskId) ?? activeTasks[0]) : undefined;
  const taskTitle = task?.title ?? "Free focus";
  const [minutes, setMinutes] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cycleMode, setCycleMode] = useState<CycleMode>("single");
  const [selectedSoundscapeId, setSelectedSoundscapeId] = useState("hums");

  const [isBreakMode, setIsBreakMode] = useState(false);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [breakDuration, setBreakDuration] = useState(300);
  const [breakCycleCount, setBreakCycleCount] = useState(0);

  const [guard, setGuard] = useState(false);
  const [petMsg, setPetMsg] = useState(PHASES[0].petMsg);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [wasRunningBeforeConfirm, setWasRunningBeforeConfirm] = useState(false);
  const [actualMinutesFocused, setActualMinutesFocused] = useState(0);
  const [taskCompletedChoice, setTaskCompletedChoice] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);

  const prevPhaseRef = useRef(0);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  const duration = minutes * 60;
  const remaining = duration - elapsed;
  const progress = stage === "complete" ? 100 : Math.min((elapsed / Math.max(duration, 1)) * 100, 100);
  const phase = phaseFor(progress);

  const broadcastProgress = useCallback(() => {
    if (!broadcastRef.current) return;
    const pct = isBreakMode ? (breakElapsed / breakDuration) * 100 : progress;
    try {
      broadcastRef.current.postMessage({
        type: "timer-update",
        progress: Math.round(pct),
        running,
        isBreakMode,
        remaining: isBreakMode ? breakDuration - breakElapsed : remaining,
        color: isBreakMode ? "#10b981" : phase.glow,
      });
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, running, isBreakMode, breakElapsed, breakDuration, remaining, phase.glow]);

  // ── BroadcastChannel for pop-out sync ────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      broadcastRef.current = new BroadcastChannel("focura-timer");
      broadcastRef.current.onmessage = (e) => {
        if (e.data?.type === "timer-ping") {
          broadcastProgress();
        }
      };
    } catch { /* not supported */ }
    return () => { broadcastRef.current?.close(); };
  }, [broadcastProgress]);

  useEffect(() => {
    if (running) broadcastProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, breakElapsed, broadcastProgress]);

  // ── Work tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "session" || !running || isBreakMode) return;
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(i);
  }, [stage, running, isBreakMode]);

  // ── Break tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "session" || !running || !isBreakMode) return;
    const i = setInterval(() => {
      setBreakElapsed((prev) => {
        const next = prev + 1;
        if (next >= breakDuration) handleBreakEnd();
        return next;
      });
    }, 1000);
    return () => clearInterval(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, running, isBreakMode, breakDuration]);

  // ── Completion & guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "session" || isBreakMode) return;
    if (elapsed > 0 && elapsed % 60 === 0 && elapsed < duration) awardXp(2, "timer");
    if (elapsed > 0 && elapsed % 1200 === 0 && elapsed < duration) setGuard(true);
    if (elapsed >= duration && duration > 0) handleFocusEnd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, stage, isBreakMode]);

  // ── Phase transitions ─────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "session" || isBreakMode) return;
    const idx = PHASES.indexOf(phase);
    if (idx !== prevPhaseRef.current) {
      prevPhaseRef.current = idx;
      setPetMsg(phase.petMsg);
      if (!muted) {
        sound.chime();
        if (selectedSoundscapeId === "hums") sound.setAmbient(phase.ambientFreq);
      }
    }
  }, [phase, stage, muted, isBreakMode, selectedSoundscapeId]);

  // ── Audio ─────────────────────────────────────────────────────────────────
  function startSelectedSoundscape() {
    sound.stopAmbient();
    audioEngine.stop();
    if (muted) return;
    if (selectedSoundscapeId === "hums") {
      sound.startAmbient(PHASES[0].ambientFreq);
    } else if (selectedSoundscapeId !== "muted") {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === selectedSoundscapeId);
      if (preset) audioEngine.playMix(preset.volumes, preset.id);
    }
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next) {
        sound.stopAmbient();
        audioEngine.stop();
      } else {
        if (isBreakMode) {
          const bp = BUILT_IN_PRESETS.find((p) => p.id === "adhd-calm");
          if (bp) audioEngine.playMix(bp.volumes, "break-calm");
        } else {
          if (selectedSoundscapeId === "hums") {
            sound.startAmbient(phase.ambientFreq);
          } else if (selectedSoundscapeId !== "muted") {
            const preset = BUILT_IN_PRESETS.find((p) => p.id === selectedSoundscapeId);
            if (preset) audioEngine.playMix(preset.volumes, preset.id);
          }
        }
      }
      return next;
    });
  }

  // ── Timer control ─────────────────────────────────────────────────────────
  function begin() {
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

  function handleFocusEnd() {
    setRunning(false);
    sound.stopAmbient();
    audioEngine.stop();
    if (!muted) sound.fanfare();
    const minsFocused = Math.max(0, Math.floor(elapsed / 60));
    setActualMinutesFocused(minsFocused);
    incrementFocusMinutes(minsFocused);
    logSession({
      taskId,
      taskTitle,
      plannedMinutes: minutes,
      actualMinutes: minsFocused,
      endedAt: Date.now(),
    });
    // Feature: Time Cost System — update calibration history
    if (taskId && minsFocused > 0) {
      updateTimeCalibration(taskId, minsFocused);
    }
    fireConfetti();
    bus.emit("timer:session-complete", { minutes: minsFocused });
    bus.emit("pet:react", { message: "Focus session completed! Great job!" });

    if (cycleMode !== "single") {
      let sb = 300;
      if (cycleMode === "pomo-60-10") sb = 600;
      if (cycleMode === "pomo-180-30") sb = 1800;
      setBreakDuration(sb);
      setBreakElapsed(0);
      setIsBreakMode(true);
      setRunning(true);
      setPetMsg("Rest time! Step away from your computer. 🧘");
      if (!muted) {
        const bp = BUILT_IN_PRESETS.find((p) => p.id === "adhd-calm");
        if (bp) audioEngine.playMix(bp.volumes, "break-calm");
      }
    } else {
      bus.emit("timer:stop", {});
      setStage("complete");
    }
  }

  function transitionToComplete(finalElapsed: number) {
    setRunning(false);
    sound.stopAmbient();
    audioEngine.stop();
    if (!muted) sound.fanfare();
    const minsFocused = Math.max(0, Math.floor(finalElapsed / 60));
    setActualMinutesFocused(minsFocused);
    incrementFocusMinutes(minsFocused);
    logSession({
      taskId,
      taskTitle,
      plannedMinutes: minutes,
      actualMinutes: minsFocused,
      endedAt: Date.now(),
    });
    // Feature: Time Cost System — update calibration history
    if (taskId && minsFocused > 0) {
      updateTimeCalibration(taskId, minsFocused);
    }
    fireConfetti();
    bus.emit("timer:session-complete", { minutes: minsFocused });
    bus.emit("pet:react", { message: "Focus session completed! Great job!" });
    bus.emit("timer:stop", {});
    setStage("complete");
  }

  function handleBreakEnd() {
    setRunning(false);
    audioEngine.stop();
    if (!muted) sound.chime();
    setBreakCycleCount((c) => c + 1);
    setIsBreakMode(false);
    setElapsed(0);
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
    setGuard(false);
    sound.stopAmbient();
    audioEngine.stop();
    setTaskCompletedChoice(null);
    setStage("setup");
    bus.emit("timer:stop", {});
  }

  const value: TimerContextValue = {
    stage, taskId, minutes, elapsed, running, minimized, muted, cycleMode,
    selectedSoundscapeId, isBreakMode, breakElapsed, breakDuration, breakCycleCount,
    guard, petMsg, showStopConfirm, wasRunningBeforeConfirm, actualMinutesFocused,
    taskCompletedChoice, rating, claimed, duration, remaining, progress, phase,
    setTaskId, setMinutes, setCycleMode, setSelectedSoundscapeId, setMinimized,
    setMuted, setGuard, setRunning, setStage, setShowStopConfirm,
    setWasRunningBeforeConfirm, setTaskCompletedChoice,
    setRating: (v) => setRating(v),
    setClaimed,
    begin, reset, skipBreak, toggleMute, transitionToComplete,
    startSelectedSoundscape, broadcastProgress,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}
