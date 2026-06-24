"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  type TimelineBlock,
  PRIORITY_BORDER_COLOR,
  PRIORITY_TAG_COLOR,
  formatDuration,
  formatCountdown,
  snapToQuarter,
} from "@/lib/timeline/types";
import { MIN_PX } from "./TimelineGrid";
import { useTimer } from "@/components/providers/TimerProvider";
import { useTasks } from "@/hooks/useTasks";

interface FocusBlockProps {
  block: TimelineBlock;
  heightPx: number;
  onUpdate: (updates: Partial<TimelineBlock>) => Promise<void>;
  onDelete: () => Promise<void>;
  onStart: () => void;
  onComplete: (actualMinutes: number) => Promise<{ overflow: string[]; overrun: number }>;
  onResizeEnd: (newDurationMinutes: number) => Promise<void>;
}

const priorityLabel: Record<string, string> = {
  critical: "⚠️ Critical",
  high:     "🔥 High",
  medium:   "⚡ Medium",
  low:      "💤 Low",
};

const formatBlockTimeRange = (startTimeStr: string, durationMinutes: number) => {
  if (!startTimeStr) return "";
  const [h, m] = startTimeStr.split(":").map(Number);
  const startMins = h * 60 + m;
  const endMins = startMins + durationMinutes;

  const formatClock = (mins: number) => {
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    const ampm = hh >= 12 ? "pm" : "am";
    const displayH = hh % 12 === 0 ? 12 : hh % 12;
    const displayM = String(mm).padStart(2, "0");
    return `${displayH}:${displayM}${ampm}`;
  };

  return `${formatClock(startMins)} - ${formatClock(endMins)}`;
};

export default function FocusBlock({
  block,
  heightPx,
  onUpdate,
  onDelete,
  onStart,
  onComplete,
  onResizeEnd,
}: FocusBlockProps) {
  const timer = useTimer();
  const { tasks } = useTasks();
  const matchedTask = tasks.find((t) => t.id === block.task_id);
  const totalFocusedMinutes = matchedTask?.actual_minutes_history?.reduce((a, b) => a + b, 0) || 0;
  const priority = (block as any).task_priority || "medium";
  const borderColor = PRIORITY_BORDER_COLOR[priority] ?? PRIORITY_BORDER_COLOR.medium;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const isActive = timer.activeBlockId === block.id && block.status === "active";

  // Consolidate pauses list (either from active timer or persisted database array)
  const pausesToRender = (() => {
    const list = [...(block.pauses || [])];
    if (isActive) {
      list.length = 0; // Use live timer as source of truth when active
      list.push(...timer.pauses);
      if (timer.currentPauseStartTime && timer.sessionStartTime) {
        const offset = Math.round((timer.currentPauseStartTime - timer.sessionStartTime) / 1000);
        const duration = Math.round((Date.now() - timer.currentPauseStartTime) / 1000);
        if (duration > 0) {
          list.push({ startOffsetSeconds: offset, durationSeconds: duration });
        }
      }
    }
    return list;
  })();

  // ── Active timer countdown ────────────────────────────────────────────
  useEffect(() => {
    if (block.status !== "active") { setElapsed(0); return; }
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, [block.status]);

  const sessionProgress = Math.min(100, (elapsed / (block.planned_duration_minutes * 60)) * 100);

  // ── Resize drag handle ────────────────────────────────────────────────
  const resizeRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartDuration = useRef<number>(block.planned_duration_minutes);

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartDuration.current = block.planned_duration_minutes;
    resizeRef.current?.setPointerCapture(e.pointerId);
  }, [block.planned_duration_minutes]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeRef.current?.hasPointerCapture(e.pointerId)) return;
    const deltaPx = e.clientY - dragStartY.current;
    const snapped = Math.max(15, snapToQuarter(dragStartDuration.current + deltaPx / MIN_PX));
    const el = resizeRef.current?.closest(".focus-block-wrapper") as HTMLElement | null;
    if (el) el.style.height = `${snapped * MIN_PX}px`;
  }, []);

  const handleResizePointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!resizeRef.current?.hasPointerCapture(e.pointerId)) return;
    resizeRef.current.releasePointerCapture(e.pointerId);
    const deltaPx = e.clientY - dragStartY.current;
    const snapped = Math.max(15, snapToQuarter(dragStartDuration.current + deltaPx / MIN_PX));
    await onResizeEnd(snapped);
  }, [onResizeEnd]);

  // ── Delete handler ────────────────────────────────────────────────────
  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }, [onDelete]);

  // ── Status & Priority styles ───────────────────────────────────────────
  const getStyles = () => {
    const priorityColors: Record<string, { border: string }> = {
      critical: { border: "#e11d48" },
      high:     { border: "#ea580c" },
      medium:   { border: "#d97706" },
      low:      { border: "#78716c" },
    };

    const pc = priorityColors[priority] ?? priorityColors.medium;

    switch (block.status) {
      case "active":
        return {
          background: "#281e18",
          border: "1px solid #ea580c",
          borderLeft: `4px solid ${pc.border}`,
          opacity: 1,
          boxShadow: "0 0 20px rgba(234,88,12,0.25)",
          animation: undefined,
        };
      case "completed":
        return {
          background: "#12100f",
          border: "1px solid rgba(240, 168, 104, 0.04)",
          borderLeft: "4px solid #443e38",
          opacity: 0.5,
          boxShadow: undefined,
          animation: undefined,
        };
      case "overran":
        return {
          background: "#20150e",
          border: "1px solid #ea580c",
          borderLeft: `4px solid ${pc.border}`,
          opacity: 1,
          boxShadow: "0 0 15px rgba(234, 88, 12, 0.2)",
          animation: undefined,
        };
      case "skipped":
        return {
          background: "#12100f",
          border: "1px solid rgba(240, 168, 104, 0.02)",
          borderLeft: "4px solid #2c2520",
          opacity: 0.35,
          boxShadow: undefined,
          animation: undefined,
        };
      case "planned":
      default:
        return {
          background: "#1c1815",
          border: "1px solid rgba(240, 168, 104, 0.08)",
          borderLeft: `4px solid ${pc.border}`,
          opacity: 1,
          boxShadow: undefined,
          animation: undefined,
        };
    }
  };

  const s = getStyles();
  const overrunMinutes = block.actual_duration_minutes
    ? block.actual_duration_minutes - block.planned_duration_minutes
    : 0;
  const timeLeft = block.planned_duration_minutes * 60 - elapsed;
  const isSmall = heightPx < 52;

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.01, zIndex: 30 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="focus-block-wrapper relative h-full rounded-xl overflow-visible cursor-pointer group select-none transition-shadow hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
      style={{
        background: s.background,
        border: s.border,
        borderLeft: s.borderLeft,
        opacity: s.opacity,
        boxShadow: s.boxShadow,
        animation: s.animation,
      }}
      onClick={() => setPopoverOpen(p => !p)}
    >
      {/* Progress bar (active state) */}
      {block.status === "active" && (
        <div
          className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 rounded-br-xl rounded-bl-xl overflow-hidden shadow-[0_0_8px_rgba(240,168,104,0.6)]"
          style={{ width: `${sessionProgress}%` }}
        />
      )}

      {/* ── Always-visible delete button ─────────────────────────────── */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Remove from timeline"
        className={`
          absolute top-1 right-1 z-30
          flex items-center justify-center
          h-5 w-5 rounded-full
          text-[10px] font-bold leading-none
          bg-black/40 text-warm-textHint
          opacity-0 group-hover:opacity-100
          hover:bg-red-500/80 hover:text-white
          transition-all duration-150 shadow-md
          ${deleting ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        ✕
      </button>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="flex flex-col h-full px-2.5 py-1.5 gap-0.5 relative z-10 overflow-hidden">
        {/* Pause overlays */}
        {pausesToRender.map((pause, index) => {
          const startMins = pause.startOffsetSeconds / 60;
          const durationMins = pause.durationSeconds / 60;
          const topPx = startMins * MIN_PX;
          const hPx = durationMins * MIN_PX;

          return (
            <div
              key={index}
              className="absolute left-0 right-0 pointer-events-none flex flex-col items-center justify-center border-t border-b border-red-500/30 overflow-hidden z-0"
              style={{
                top: `${topPx}px`,
                height: `${hPx}px`,
              }}
            >
              {/* Repeating SVG Zigzag Pattern */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <pattern
                    id={`zigzag-${block.id}-${index}`}
                    width="12"
                    height="12"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0 6 L 3 3 L 6 6 L 9 3 L 12 6 L 9 9 L 6 6 L 3 9 Z"
                      fill="rgba(239, 68, 68, 0.12)"
                      stroke="#ef4444"
                      strokeWidth="1.2"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#zigzag-${block.id}-${index})`} />
              </svg>

              {hPx > 18 && (
                <span className="relative z-10 text-[8px] font-space font-bold uppercase tracking-widest text-red-400 bg-black/85 px-1.5 py-0.5 rounded border border-red-500/30 shadow-md animate-pulse">
                  Paused {Math.round(durationMins)}m
                </span>
              )}
            </div>
          );
        })}
        {/* Time range + XP reward */}
        {!isSmall && (
          <div className="flex items-center justify-between gap-1.5 shrink-0 text-[9px] font-mono text-warm-textHint font-semibold">
            <span>{formatBlockTimeRange(block.start_time, block.planned_duration_minutes)}</span>
            <span className="text-warm-amber font-bold flex items-center gap-0.5">
              🪙 +{(block as any).task_xp ?? 30} LP
            </span>
          </div>
        )}

        {/* Task name */}
        <p
          className={`font-quick font-bold leading-tight text-warm-text flex-1 min-h-0 flex items-center gap-1.5 ${
            isSmall ? "text-[11px]" : "text-xs"
          } ${block.status === "skipped" || block.status === "completed" ? "line-through opacity-60" : ""}`}
          style={{ wordBreak: "break-word", overflow: "hidden" }}
        >
          {block.status === "completed" && (
            <span className="text-warm-amber shrink-0 text-[10px] font-bold">✓</span>
          )}
          <span>{(block as any).task_title || block.life_label || "Focus Block"}</span>
          {totalFocusedMinutes > 0 && (
            <span className="text-[9px] text-warm-amber font-mono font-bold shrink-0 ml-1">
              (⏱️{totalFocusedMinutes}m)
            </span>
          )}
        </p>

        {/* Dynamic status/countdown details */}
        {!isSmall && (
          <div className="flex items-center justify-between gap-1 shrink-0 mt-0.5">
            {block.status === "active" ? (
              <span className="text-[9px] font-space font-bold text-warm-amber animate-pulse flex items-center gap-1">
                ⚡ {timeLeft <= 0 ? "⏰ Overtime!" : `T-minus ${formatCountdown(timeLeft)}`}
              </span>
            ) : block.status === "completed" ? (
              <span className="text-[9px] font-space text-warm-amber/80 flex items-center gap-0.5 font-semibold">
                ✓ Completed
              </span>
            ) : block.status === "overran" ? (
              <span className="text-[9px] font-space text-warm-amber font-bold flex items-center gap-1">
                ⚠️ +{overrunMinutes}m overrun
              </span>
            ) : block.status === "skipped" ? (
              <span className="text-[9px] font-space text-warm-textHint">
                ⤼ Skipped
              </span>
            ) : (
              <span className="rounded-full px-1.5 py-0.2 text-[8px] font-bold font-space uppercase tracking-wider bg-white/5 text-warm-textMuted border border-white/5">
                {priorityLabel[priority] ?? "Task"}
              </span>
            )}

            {/* Time duration pill for planned blocks */}
            {block.status === "planned" && (
              <span className="text-[9px] font-mono text-warm-textMuted shrink-0">
                ⏱️ {formatDuration(block.planned_duration_minutes)}
              </span>
            )}
          </div>
        )}

        {/* Overrun badge overlay for overran */}
        {block.status === "overran" && overrunMinutes > 0 && isSmall && (
          <div className="absolute right-1 bottom-1 text-[8px] font-bold text-warm-amber font-mono bg-black/40 px-1 rounded">
            +{overrunMinutes}m
          </div>
        )}

        {/* Time-up warning in active state (pulsing) */}
        {block.status === "active" && timeLeft <= 0 && isSmall && (
          <div className="absolute right-1 bottom-1 text-[8px] font-bold text-warm-amber animate-pulse font-mono bg-black/40 px-1 rounded">
            ⏰ UP!
          </div>
        )}
      </div>

      {/* ── Start / quick-action bar (hover, planned only) ──────────── */}
      {block.status === "planned" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 h-8 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-b-xl z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="rounded-full bg-warm-amber px-2.5 py-1 text-[10px] font-bold font-quick text-black shadow-lg hover:bg-warm-amber/85 transition"
          >
            ▶ Start
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setPopoverOpen(p => !p); }}
            className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-warm-textMuted hover:text-warm-text transition"
          >
            ···
          </button>
        </div>
      )}

      {/* ── Popover (right-click / ··· menu) ─────────────────────────── */}
      {popoverOpen && (
        <div
          className="absolute left-full ml-2 top-0 z-50 w-44 rounded-xl border border-warm-border bg-warm-surface shadow-2xl p-2 space-y-1 animate-fade-in"
          style={{ minWidth: "176px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {block.status === "planned" && (
            <button
              onClick={() => { onStart(); setPopoverOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
            >
              ▶ Start Session
            </button>
          )}
          {block.status === "active" && (
            <button
              onClick={async () => {
                const actualMinutes = Math.max(1, Math.ceil(elapsed / 60));
                await onComplete(actualMinutes);
                setPopoverOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-amber hover:bg-warm-amber/10 transition"
            >
              ✓ Mark Complete
            </button>
          )}
          <button
            onClick={async () => { await onUpdate({ status: "skipped" }); setPopoverOpen(false); }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
          >
            ⤼ Skip
          </button>
          <div className="h-px bg-warm-border/30 my-1" />
          <button
            onClick={async (e) => { e.stopPropagation(); await onDelete(); setPopoverOpen(false); }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-red-400/90 hover:bg-red-500/10 transition flex items-center gap-2"
          >
            <span className="text-sm">🗑</span> Remove from Timeline
          </button>
        </div>
      )}

      {/* ── Resize handle ─────────────────────────────────────────────── */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-30"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-0.5 rounded-full bg-warm-textHint/50" />
      </div>
    </motion.div>
  );
}
