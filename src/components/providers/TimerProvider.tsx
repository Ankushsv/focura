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

  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  sessionStartTime: number | null;
  pauses: { startOffsetSeconds: number; durationSeconds: number }[];
  currentPauseStartTime: number | null;
  isLoaded: boolean;

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

  // ─── Active Timeline Block & Pause Tracking States ─────────────────────────
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pauses, setPauses] = useState<{ startOffsetSeconds: number; durationSeconds: number }[]>([]);
  const [currentPauseStartTime, setCurrentPauseStartTime] = useState<number | null>(null);

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load and save timer & active block state to/from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedStage = localStorage.getItem("focura.timer.stage");
    const cachedTaskId = localStorage.getItem("focura.timer.taskId");
    const cachedMinutes = localStorage.getItem("focura.timer.minutes");
    const cachedElapsed = localStorage.getItem("focura.timer.elapsed");
    const cachedRunning = localStorage.getItem("focura.timer.running");

    const cachedBlockId = localStorage.getItem("focura.timer.activeBlockId");
    const cachedStartTime = localStorage.getItem("focura.timer.sessionStartTime");
    const cachedPauses = localStorage.getItem("focura.timer.pauses");
    const cachedPauseStartTime = localStorage.getItem("focura.timer.currentPauseStartTime");

    const cachedIsBreakMode = localStorage.getItem("focura.timer.isBreakMode");
    const cachedBreakElapsed = localStorage.getItem("focura.timer.breakElapsed");
    const cachedBreakDuration = localStorage.getItem("focura.timer.breakDuration");
    const cachedBreakCycleCount = localStorage.getItem("focura.timer.breakCycleCount");

    if (cachedStage) setStage(cachedStage as any);
    if (cachedTaskId) setTaskId(cachedTaskId);
    if (cachedMinutes) setMinutes(Number(cachedMinutes));
    if (cachedElapsed) setElapsed(Number(cachedElapsed));
    if (cachedRunning === "true") setRunning(true);

    if (cachedBlockId) setActiveBlockId(cachedBlockId);
    if (cachedStartTime) setSessionStartTime(Number(cachedStartTime));
    if (cachedPauses) {
      try {
        setPauses(JSON.parse(cachedPauses));
      } catch (e) {
        console.warn("Error parsing pauses cache:", e);
      }
    }
    if (cachedPauseStartTime) setCurrentPauseStartTime(Number(cachedPauseStartTime));

    if (cachedIsBreakMode === "true") setIsBreakMode(true);
    if (cachedBreakElapsed) setBreakElapsed(Number(cachedBreakElapsed));
    if (cachedBreakDuration) setBreakDuration(Number(cachedBreakDuration));
    if (cachedBreakCycleCount) setBreakCycleCount(Number(cachedBreakCycleCount));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.stage", stage);
  }, [stage, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    if (taskId) localStorage.setItem("focura.timer.taskId", taskId);
    else localStorage.removeItem("focura.timer.taskId");
  }, [taskId, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.minutes", String(minutes));
  }, [minutes, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.elapsed", String(elapsed));
  }, [elapsed, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.running", String(running));
  }, [running, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    if (activeBlockId) localStorage.setItem("focura.timer.activeBlockId", activeBlockId);
    else localStorage.removeItem("focura.timer.activeBlockId");
  }, [activeBlockId, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    if (sessionStartTime) localStorage.setItem("focura.timer.sessionStartTime", String(sessionStartTime));
    else localStorage.removeItem("focura.timer.sessionStartTime");
  }, [sessionStartTime, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.pauses", JSON.stringify(pauses));
  }, [pauses, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    if (currentPauseStartTime) localStorage.setItem("focura.timer.currentPauseStartTime", String(currentPauseStartTime));
    else localStorage.removeItem("focura.timer.currentPauseStartTime");
  }, [currentPauseStartTime, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.isBreakMode", String(isBreakMode));
  }, [isBreakMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.breakElapsed", String(breakElapsed));
  }, [breakElapsed, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.breakDuration", String(breakDuration));
  }, [breakDuration, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    localStorage.setItem("focura.timer.breakCycleCount", String(breakCycleCount));
  }, [breakCycleCount, isLoaded]);

  // Monitor pause and resume events to record pause durations
  useEffect(() => {
    if (stage !== "session" || isBreakMode) return;
    if (!running) {
      setCurrentPauseStartTime(prev => prev || Date.now());
      bus.emit("timer:pause", {});
    } else {
      setCurrentPauseStartTime(prev => {
        if (prev && sessionStartTime) {
          const now = Date.now();
          const durationMs = now - prev;
          const startOffsetSeconds = Math.round((prev - sessionStartTime) / 1000);
          const durationSeconds = Math.round(durationMs / 1000);
          if (durationSeconds > 0) {
            setPauses(p => [...p, { startOffsetSeconds, durationSeconds }]);
          }
        }
        return null;
      });
      bus.emit("timer:resume", {});
    }
  }, [running, stage, isBreakMode, sessionStartTime]);

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
  const syncCompleteBlock = useCallback(async () => {
    if (!activeBlockId || !sessionStartTime) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { timeToMinutes, minutesToTime } = await import("@/lib/timeline/types");
      const supabase = createClient();

      const finalPauses = [...pauses];
      if (currentPauseStartTime) {
        const durationMs = Date.now() - currentPauseStartTime;
        const startOffsetSeconds = Math.round((currentPauseStartTime - sessionStartTime) / 1000);
        finalPauses.push({
          startOffsetSeconds,
          durationSeconds: Math.round(durationMs / 1000),
        });
      }

      const totalWallClockMins = Math.max(1, Math.ceil((Date.now() - sessionStartTime) / 60000));

      const { data: blockData } = await supabase
        .from("timeline_blocks")
        .select("planned_duration_minutes, date, start_time, user_id")
        .eq("id", activeBlockId)
        .single();

      if (blockData) {
        const plannedDuration = blockData.planned_duration_minutes;
        const overrun = totalWallClockMins - plannedDuration;
        const status = totalWallClockMins < plannedDuration
          ? "completed"
          : overrun > 5
          ? "overran"
          : "completed";

        const updatePayload: any = {
          status,
          actual_duration_minutes: totalWallClockMins,
          planned_duration_minutes: status === "overran" ? totalWallClockMins : plannedDuration,
        };

        try {
          updatePayload.pauses = finalPauses;
          await supabase.from("timeline_blocks").update(updatePayload).eq("id", activeBlockId);
        } catch {
          delete updatePayload.pauses;
          await supabase.from("timeline_blocks").update(updatePayload).eq("id", activeBlockId);
        }

        if (status === "overran" && overrun > 0) {
          const { data: siblingBlocks } = await supabase
            .from("timeline_blocks")
            .select("*")
            .eq("user_id", blockData.user_id)
            .eq("date", blockData.date)
            .neq("id", activeBlockId);

          if (siblingBlocks) {
            const pushable = siblingBlocks
              .filter(b => timeToMinutes(b.start_time) >= (timeToMinutes(blockData.start_time) + plannedDuration))
              .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

            for (const sibling of pushable) {
              const currentStartMins = timeToMinutes(sibling.start_time);
              const newStartMins = currentStartMins + overrun;
              await supabase
                .from("timeline_blocks")
                .update({ start_time: minutesToTime(newStartMins) })
                .eq("id", sibling.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to sync active timeline block completion:", err);
    } finally {
      setActiveBlockId(null);
      setSessionStartTime(null);
      setPauses([]);
      setCurrentPauseStartTime(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("focura.timer.activeBlockId");
        localStorage.removeItem("focura.timer.sessionStartTime");
        localStorage.removeItem("focura.timer.pauses");
        localStorage.removeItem("focura.timer.currentPauseStartTime");
      }
    }
  }, [activeBlockId, sessionStartTime, pauses, currentPauseStartTime]);

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
      const startTime = Date.now();
      setSessionStartTime(startTime);
      setPauses([]);
      setCurrentPauseStartTime(null);

      // Auto-create active timeline block if starting directly from focus timer page
      if (!activeBlockId) {
        void (async () => {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();
            const localDateStr = now.toLocaleDateString("sv-SE");
            const localTimeStr = now.toTimeString().split(" ")[0];

            const { data, error } = await supabase
              .from("timeline_blocks")
              .insert({
                user_id: user.id,
                date: localDateStr,
                block_type: "focus",
                task_id: taskId || null,
                start_time: localTimeStr,
                planned_duration_minutes: minutes,
                status: "active",
                layer: "plan",
              })
              .select()
              .single();

            if (!error && data) {
              setActiveBlockId(data.id);
              if (typeof window !== "undefined") {
                localStorage.setItem("focura.timer.activeBlockId", data.id);
                localStorage.setItem("focura.timer.sessionStartTime", String(startTime));
              }
            }
          } catch (e) {
            console.warn("Failed to auto-create timeline block for active timer:", e);
          }
        })();
      } else {
        // If activeBlockId exists, update the existing planned block to active
        void (async () => {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const now = new Date();
            const localTimeStr = now.toTimeString().split(" ")[0];

            await supabase
              .from("timeline_blocks")
              .update({
                status: "active",
                start_time: localTimeStr,
                planned_duration_minutes: minutes,
              })
              .eq("id", activeBlockId);

            if (typeof window !== "undefined") {
              localStorage.setItem("focura.timer.sessionStartTime", String(startTime));
            }
          } catch (e) {
            console.warn("Failed to set active block state in DB on begin:", e);
          }
        })();
      }

      bus.emit("timer:start", {});
      startSelectedSoundscape();
    }, 2800);
  }

  function handleFocusEnd() {
    void syncCompleteBlock();
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
    void syncCompleteBlock();
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

    if (activeBlockId) {
      void (async () => {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase.from("timeline_blocks").update({ status: "planned" }).eq("id", activeBlockId);
        } catch (err) {
          console.warn("Failed to revert active block on reset:", err);
        } finally {
          setActiveBlockId(null);
          setSessionStartTime(null);
          setPauses([]);
          setCurrentPauseStartTime(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("focura.timer.activeBlockId");
            localStorage.removeItem("focura.timer.sessionStartTime");
            localStorage.removeItem("focura.timer.pauses");
            localStorage.removeItem("focura.timer.currentPauseStartTime");
          }
        }
      })();
    }
  }

  const value: TimerContextValue = {
    stage, taskId, minutes, elapsed, running, minimized, muted, cycleMode,
    selectedSoundscapeId, isBreakMode, breakElapsed, breakDuration, breakCycleCount,
    guard, petMsg, showStopConfirm, wasRunningBeforeConfirm, actualMinutesFocused,
    taskCompletedChoice, rating, claimed, duration, remaining, progress, phase,
    activeBlockId, setActiveBlockId, sessionStartTime, pauses, currentPauseStartTime,
    isLoaded,
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
