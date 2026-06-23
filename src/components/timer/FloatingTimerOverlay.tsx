"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "@/components/providers/TimerProvider";
import { phaseFor } from "@/lib/timer/phases";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s) % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function FloatingTimerOverlay() {
  const router = useRouter();
  const { minimized, running, stage, progress, remaining, isBreakMode,
    breakElapsed, breakDuration, setMinimized, broadcastProgress } = useTimer();

  const progressPercent = isBreakMode
    ? (breakElapsed / breakDuration) * 100
    : progress;
  const phase = phaseFor(progressPercent);
  const color = isBreakMode ? "#10b981" : phase.glow;
  const timeLeft = isBreakMode ? breakDuration - breakElapsed : remaining;

  // Draggable position state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const pillRef = useRef<HTMLButtonElement>(null);

  // Init position: bottom-right
  useEffect(() => {
    setPos({ x: window.innerWidth - 104, y: window.innerHeight - 120 });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 96, dragStart.current.ox + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 96, dragStart.current.oy + dy)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: pos.x, oy: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.mx;
      const dy = t.clientY - dragStart.current.my;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 96, dragStart.current.ox + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 96, dragStart.current.oy + dy)),
      });
    };
    const onEnd = () => setDragging(false);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging]);

  function openPopOut() {
    broadcastProgress();
    window.open(
      "/timer-popup",
      "focura-timer-popup",
      "width=180,height=180,resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,status=no"
    );
  }

  // Only render when minimized and session is running
  if (!minimized || !running || stage !== "session") return null;

  // SVG ring
  const size = 88;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - Math.min(progressPercent, 100) / 100);

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{ left: pos.x, top: pos.y, cursor: dragging ? "grabbing" : "grab" }}
    >
      <div className="relative group">
        {/* Main draggable pill */}
        <button
          ref={pillRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onClick={(e) => {
            // Only navigate on click (not drag)
            if (!dragging) {
              setMinimized(false);
              router.push("/app/timer");
            }
          }}
          aria-label="Expand focus timer"
          style={{
            background: `${color}18`,
            borderColor: `${color}50`,
            boxShadow: `0 0 24px ${color}30, 0 4px 20px rgba(0,0,0,0.5)`,
          }}
          className="relative flex flex-col items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-200 hover:scale-105"
          title="Click to expand · Drag to move"
        >
          {/* SVG Progress Ring */}
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            style={{ position: "absolute", inset: 0 }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={dash}
              className="transition-all duration-1000"
            />
          </svg>

          {/* Content inside ring */}
          <div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span
              className="text-2xl font-black font-mono leading-none tabular-nums"
              style={{ color }}
            >
              {Math.round(progressPercent)}%
            </span>
            <span className="text-[9px] font-bold text-white/50 mt-0.5 font-mono tracking-tight">
              {fmt(timeLeft)}
            </span>
            <span className="text-[8px] text-white/30 mt-0.5">
              {isBreakMode ? "break" : "focus"}
            </span>
          </div>
        </button>

        {/* Pop-out button (shows on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openPopOut();
          }}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full border border-white/20 bg-[#1a1a2e]/90 backdrop-blur-md text-white/60 hover:text-white hover:border-white/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold"
          title="Pop out timer window (for LeetCode, etc.)"
          aria-label="Open pop-out timer window"
        >
          ↗
        </button>
      </div>
    </div>
  );
}
