"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { logUserEvent } from "@/lib/userEvents";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RitualStep {
  id: number;
  action: string;
  detail: string | null;
}

interface RitualData {
  opening_line: string;
  steps: RitualStep[];
  step_count: number;
}

type RitualPhase =
  | "ask"         // "What are you avoiding?" prompt
  | "loading"     // Generating ritual via API
  | "steps"       // Walking through micro-steps
  | "youre-in"    // All steps completed
  | "expired"     // Timer hit 0:00
  | "dismissed"   // User chose to leave
  | "farewell";   // "Not yet" farewell message

interface RitualOverlayProps {
  onClose: () => void;
  initialTask?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RITUAL_DURATION = 120; // seconds

function getConfirmationText(action: string): string {
  const lower = action.toLowerCase();
  if (lower.startsWith("open")) return "✓ Done — it's open";
  if (lower.startsWith("read")) return "✓ Done — I read it";
  if (lower.startsWith("write") || lower.startsWith("type")) return "✓ Done — it's written";
  if (lower.startsWith("find") || lower.startsWith("locate")) return "✓ Done — I found it";
  return "✓ Done — moving on";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Word-by-word animation ───────────────────────────────────────────────────
function StaggeredWords({
  text,
  className,
  delayMs = 80,
}: {
  text: string;
  className?: string;
  delayMs?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (i * delayMs) / 1000, duration: 0.3 }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RitualOverlay({ onClose, initialTask }: RitualOverlayProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<RitualPhase>(initialTask ? "loading" : "ask");
  const [taskInput, setTaskInput] = useState(initialTask ?? "");
  const [ritual, setRitual] = useState<RitualData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RITUAL_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [stepExiting, setStepExiting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskName = useRef(initialTask ?? "");

  // ── Auto-fetch if initialTask was provided ──
  useEffect(() => {
    if (initialTask) {
      taskName.current = initialTask;
      fetchRitual(initialTask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer countdown ──
  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          setPhase("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // ── Fetch ritual from API ──
  const fetchRitual = useCallback(async (task: string) => {
    setPhase("loading");
    try {
      const res = await fetch("/api/ritual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avoidingTask: task }),
      });
      const data = await res.json();
      if (data.ritual) {
        setRitual(data.ritual);
        setCurrentStep(0);
        setTimeLeft(RITUAL_DURATION);
        setTimerRunning(true);
        setPhase("steps");
        logUserEvent("ritual_started", {
          task_name: task,
          step_count: data.ritual.step_count,
        });
      } else {
        // API error — close gracefully
        onClose();
      }
    } catch {
      onClose();
    }
  }, [onClose]);

  // ── Handlers ──
  function handleAskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskInput.trim()) return;
    taskName.current = taskInput.trim();
    fetchRitual(taskName.current);
  }

  function handleStepComplete() {
    if (!ritual || stepExiting) return;
    setStepExiting(true);

    setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep >= ritual.steps.length) {
        // All steps done!
        setTimerRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("youre-in");
      } else {
        setCurrentStep(nextStep);
      }
      setStepExiting(false);
    }, 300);
  }

  function handleEscape() {
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("dismissed");
    logUserEvent("ritual_dismissed", {
      task_name: taskName.current,
      steps_done: currentStep,
      reason: "escape",
    });
    setTimeout(onClose, 2500);
  }

  function handleYesFiveMinutes() {
    logUserEvent("ritual_completed", {
      task_name: taskName.current,
      steps_done: ritual?.steps.length ?? 0,
      time_remaining_seconds: timeLeft,
      proceeded_to_timer: true,
    });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ritual_task", taskName.current);
    }
    router.push(
      `/app/timer?task=${encodeURIComponent(taskName.current)}&duration=5&from=ritual`
    );
  }

  function handleNotYet() {
    logUserEvent("ritual_completed", {
      task_name: taskName.current,
      steps_done: ritual?.steps.length ?? 0,
      time_remaining_seconds: timeLeft,
      proceeded_to_timer: false,
    });
    setPhase("farewell");
    setTimeout(onClose, 2500);
  }

  function handleRetry() {
    logUserEvent("ritual_retry", { task_name: taskName.current });
    setTimeLeft(RITUAL_DURATION);
    setTimerRunning(true);
    setPhase("steps");
  }

  function handleBreak() {
    logUserEvent("ritual_dismissed", {
      task_name: taskName.current,
      steps_done: currentStep,
      reason: "timer_expired",
    });
    setPhase("dismissed");
    setTimeout(onClose, 2500);
  }

  // ── Timer bar ──
  const timerPercent = (timeLeft / RITUAL_DURATION) * 100;
  const barColor = timeLeft <= 30 ? "#f59e0b" : "#f0a868";
  const showTimerBar = phase === "steps" || phase === "expired";

  // ── Render ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-warm-bg"
    >
      {/* Timer bar */}
      {showTimerBar && (
        <>
          <div className="fixed top-0 left-0 right-0 h-[3px] z-[101]" style={{ background: "rgba(245,239,232,0.08)" }}>
            <motion.div
              className="h-full"
              style={{
                width: `${timerPercent}%`,
                background: barColor,
                transition: "width 1s linear, background 0.5s ease",
              }}
              animate={phase === "expired" ? { scaleY: [1, 1.5, 1] } : {}}
              transition={phase === "expired" ? { duration: 0.6 } : {}}
            />
          </div>
          <div className="fixed top-[6px] right-4 z-[101]">
            <span className="font-mono text-[11px]" style={{ color: "rgba(245,239,232,0.18)" }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </>
      )}

      {/* Content area */}
      <div className="max-w-[480px] w-full px-6 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {/* ── ASK PHASE ── */}
          {phase === "ask" && (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 w-full"
            >
              {/* Familiar */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>

              <p
                className="font-lora italic leading-relaxed"
                style={{
                  fontSize: "clamp(16px, 2.5vw, 22px)",
                  color: "rgba(245,239,232,0.75)",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                "What's the one thing you keep not starting?"
              </p>

              <form onSubmit={handleAskSubmit} className="space-y-4 w-full max-w-[360px] mx-auto">
                <input
                  type="text"
                  autoFocus
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="just name it..."
                  className="w-full rounded-2xl border border-warm-border bg-warm-surface px-5 py-4 text-lg text-warm-text placeholder-warm-textMuted/40 font-quick outline-none focus:border-warm-amber/50 transition"
                />
                <button
                  type="submit"
                  disabled={!taskInput.trim()}
                  className="w-full rounded-2xl bg-warm-amber/15 border border-warm-amber/35 text-warm-amber py-3.5 font-quick font-bold text-sm hover:bg-warm-amber/25 transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  Let's do this →
                </button>
              </form>

              <button
                onClick={onClose}
                className="text-[11px] font-quick cursor-pointer"
                style={{ color: "rgba(245,239,232,0.18)" }}
              >
                not now
              </button>
            </motion.div>
          )}

          {/* ── LOADING PHASE ── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>
              <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-warm-amber/30 border-t-warm-amber" />
              <p className="font-quick text-sm" style={{ color: "rgba(245,239,232,0.35)" }}>
                Preparing your ritual...
              </p>
            </motion.div>
          )}

          {/* ── STEPS PHASE ── */}
          {phase === "steps" && ritual && (
            <motion.div
              key="steps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 w-full"
            >
              {/* Familiar */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>

              {/* Opening line (shown during step 0) */}
              {currentStep === 0 && (
                <div
                  className="font-lora italic leading-relaxed"
                  style={{
                    fontSize: "clamp(16px, 2.5vw, 22px)",
                    color: "rgba(245,239,232,0.75)",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  <StaggeredWords text={ritual.opening_line} />
                </div>
              )}

              {/* Current step */}
              <AnimatePresence mode="wait">
                {!stepExiting && (
                  <motion.div
                    key={`step-${currentStep}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Step counter */}
                    <p className="font-quick text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#f0a868" }}>
                      Step {currentStep + 1} of {ritual.steps.length}
                    </p>

                    {/* Action */}
                    <h3
                      className="font-quick font-semibold text-center"
                      style={{
                        fontSize: "clamp(20px, 3vw, 28px)",
                        color: "#f5efe8",
                      }}
                    >
                      {ritual.steps[currentStep].action}
                    </h3>

                    {/* Detail */}
                    {ritual.steps[currentStep].detail && (
                      <p className="font-space text-[13px] mt-1.5" style={{ color: "var(--color-warm-text-muted)" }}>
                        {ritual.steps[currentStep].detail}
                      </p>
                    )}

                    {/* Done button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStepComplete}
                      className="w-full max-w-[320px] mx-auto h-[52px] rounded-2xl font-quick font-bold text-sm flex items-center justify-center"
                      style={{
                        background: "rgba(240,168,104,0.12)",
                        border: "1px solid rgba(240,168,104,0.35)",
                        color: "#f0a868",
                      }}
                    >
                      {getConfirmationText(ritual.steps[currentStep].action)}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Escape hatch */}
              <button
                onClick={handleEscape}
                className="text-[11px] font-quick cursor-pointer mt-4"
                style={{ color: "rgba(245,239,232,0.18)" }}
              >
                I need a minute
              </button>
            </motion.div>
          )}

          {/* ── YOU'RE IN PHASE ── */}
          {phase === "youre-in" && (
            <motion.div
              key="youre-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 w-full"
            >
              {/* Familiar — proud glow */}
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
                style={{ filter: "drop-shadow(0 0 12px rgba(240,168,104,0.4))" }}
              >
                🐥
              </motion.div>

              {/* You're in */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="font-cinzel"
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "#f0a868",
                  letterSpacing: "-0.5px",
                }}
              >
                <StaggeredWords text="You're in." />
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="font-lora italic"
                style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(245,239,232,0.65)" }}
              >
                The hardest part is already over.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                className="font-lora italic"
                style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(245,239,232,0.5)" }}
              >
                Your brain is warmer now<br />than it was 2 minutes ago.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2 }}
                className="font-quick font-medium"
                style={{ fontSize: "15px", color: "rgba(245,239,232,0.7)" }}
              >
                Want to keep going for 5 minutes?<br />Just 5. I'll be right here.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.8, type: "spring", stiffness: 200, damping: 28 }}
                className="flex flex-col items-center gap-3 pt-2"
              >
                <button
                  onClick={handleYesFiveMinutes}
                  className="rounded-full font-quick font-bold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #a78bfa, #5eead4)",
                    color: "#0e0c0a",
                    padding: "13px 28px",
                    boxShadow: "0 0 24px rgba(167,139,250,0.3)",
                  }}
                >
                  ▶ Yes — 5 minutes
                </button>
                <button
                  onClick={handleNotYet}
                  className="font-quick text-[13px] cursor-pointer bg-transparent border-none"
                  style={{ color: "rgba(245,239,232,0.35)" }}
                >
                  Not yet
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── EXPIRED PHASE ── */}
          {phase === "expired" && (
            <motion.div
              key="expired"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-lora italic"
                style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(245,239,232,0.65)" }}
              >
                Time's up.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="font-lora italic"
                style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(245,239,232,0.5)" }}
              >
                But you tried. That's not nothing.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="font-quick font-medium"
                style={{ fontSize: "15px", color: "rgba(245,239,232,0.7)" }}
              >
                Want another 120 seconds?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, type: "spring", stiffness: 200, damping: 28 }}
                className="flex flex-col items-center gap-3 pt-2"
              >
                <button
                  onClick={handleRetry}
                  className="rounded-full font-quick font-bold text-sm px-7 py-3 border"
                  style={{
                    borderColor: "rgba(240,168,104,0.35)",
                    background: "rgba(240,168,104,0.12)",
                    color: "#f0a868",
                  }}
                >
                  ↺ Another 120 seconds
                </button>
                <button
                  onClick={handleBreak}
                  className="font-quick text-[13px] cursor-pointer bg-transparent border-none"
                  style={{ color: "rgba(245,239,232,0.35)" }}
                >
                  I need a break
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── DISMISSED PHASE ── */}
          {phase === "dismissed" && (
            <motion.div
              key="dismissed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>
              <p
                className="font-lora italic leading-relaxed"
                style={{
                  fontSize: "clamp(14px, 2vw, 18px)",
                  color: "rgba(245,239,232,0.55)",
                  maxWidth: "360px",
                  margin: "0 auto",
                }}
              >
                Of course. Come back when you're ready.<br />I'll be here.
              </p>
            </motion.div>
          )}

          {/* ── FAREWELL PHASE ("Not yet") ── */}
          {phase === "farewell" && (
            <motion.div
              key="farewell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-[64px] leading-none select-none"
              >
                🐥
              </motion.div>
              <p
                className="font-lora italic leading-relaxed"
                style={{
                  fontSize: "clamp(14px, 2vw, 18px)",
                  color: "rgba(245,239,232,0.55)",
                  maxWidth: "360px",
                  margin: "0 auto",
                }}
              >
                That's okay. You showed up.<br />That matters.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
