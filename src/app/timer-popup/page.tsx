"use client";

import { useEffect, useState, useRef } from "react";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s) % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

interface TimerMessage {
  type: string;
  progress: number;
  running: boolean;
  isBreakMode: boolean;
  remaining: number;
  color: string;
}

export default function TimerPopupPage() {
  const [data, setData] = useState<TimerMessage | null>(null);
  const [offline, setOffline] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = new BroadcastChannel("focura-timer");
    channelRef.current = channel;

    // Ping main window for status on mount
    channel.postMessage({ type: "timer-ping" });

    // Handle updates
    channel.onmessage = (e) => {
      const msg = e.data;
      if (msg && msg.type === "timer-update") {
        setData(msg);
        setOffline(false);

        // Reset offline detector
        if (offlineTimeoutRef.current) {
          clearTimeout(offlineTimeoutRef.current);
        }
        offlineTimeoutRef.current = setTimeout(() => {
          setOffline(true);
        }, 3000); // If no broadcast received for 3 seconds, assume offline/paused/closed
      }
    };

    // Keep pinging every 2 seconds if offline to re-establish link
    const pingInterval = setInterval(() => {
      if (offline) {
        channel.postMessage({ type: "timer-ping" });
      }
    }, 2000);

    return () => {
      channel.close();
      if (offlineTimeoutRef.current) clearTimeout(offlineTimeoutRef.current);
      clearInterval(pingInterval);
    };
  }, [offline]);

  // Clean offline status when data changes or updates
  useEffect(() => {
    if (data?.running) {
      setOffline(false);
    }
  }, [data]);

  const progress = data?.progress ?? 0;
  const running = data?.running ?? false;
  const isBreakMode = data?.isBreakMode ?? false;
  const remaining = data?.remaining ?? 0;
  const color = data?.color ?? "#8b5cf6"; // Default primary violet

  // SVG Progress Ring Calculations
  const size = 130;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const strokeOffset = c * (1 - Math.min(progress, 100) / 100);

  return (
    <div
      style={{ background: "#0a0a0f" }}
      className="h-screen w-screen flex flex-col items-center justify-center text-white select-none overflow-hidden relative"
    >
      {/* Background ambient orbs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 blur-2xl transition-all duration-[2000ms]"
        style={{
          background: offline
            ? "rgba(255, 255, 255, 0.05)"
            : `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        {/* SVG Progress Ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3.5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={offline ? "rgba(255,255,255,0.2)" : color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: offline ? "none" : `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {offline ? (
            <div className="flex flex-col items-center justify-center px-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                Paused
              </span>
              <span className="text-xs text-white/30 font-medium mt-1">
                or Offline
              </span>
            </div>
          ) : (
            <>
              {/* Mode indicator */}
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color }}
              >
                {isBreakMode ? "Break" : "Focus"}
              </span>

              {/* Percentage */}
              <span
                className="text-3xl font-black font-mono leading-none tabular-nums mt-0.5"
                style={{ color }}
              >
                {progress}%
              </span>

              {/* Remaining time */}
              <span className="text-[11px] font-bold text-white/70 font-mono tracking-wider mt-1">
                {fmt(remaining)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
