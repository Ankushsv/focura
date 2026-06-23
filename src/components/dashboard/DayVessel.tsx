"use client";

import { useState, useEffect, useRef } from "react";

interface DayVesselProps {
  wakeHour?: number;  // default 8
  sleepHour?: number; // default 23
}

type VesselColor = {
  fill: [string, string];    // gradient [light, dark]
  glow: string;
  arc: string;
  label: string;
};

const VESSEL_COLORS: VesselColor[] = [
  // 0–40% teal
  { fill: ["#5eead4", "#0d9488"], glow: "rgba(94,234,212,0.35)", arc: "#5eead4", label: "Morning" },
  // 40–70% amber
  { fill: ["#fbbf24", "#d97706"], glow: "rgba(251,191,36,0.35)", arc: "#fbbf24", label: "Afternoon" },
  // 70–90% coral
  { fill: ["#fb923c", "#ea580c"], glow: "rgba(251,146,60,0.35)", arc: "#fb923c", label: "Evening" },
  // 90–100% crimson
  { fill: ["#f87171", "#dc2626"], glow: "rgba(248,113,113,0.35)", arc: "#f87171", label: "Night" },
];

function getColorState(progress: number): VesselColor {
  if (progress < 40) return VESSEL_COLORS[0];
  if (progress < 70) return VESSEL_COLORS[1];
  if (progress < 90) return VESSEL_COLORS[2];
  return VESSEL_COLORS[3];
}

function computeVesselState(wakeHour: number, sleepHour: number) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const totalDayMinutes = (sleepHour - wakeHour) * 60;
  const elapsedMinutes = Math.max(0, (currentHour - wakeHour) * 60);
  const progress = Math.min(100, Math.max(0, (elapsedMinutes / totalDayMinutes) * 100));
  const remainingHours = Math.max(0, sleepHour - currentHour);
  const focusHours = remainingHours * 0.6;
  return { progress, remainingHours, focusHours };
}

export default function DayVessel({ wakeHour = 8, sleepHour = 23 }: DayVesselProps) {
  const [state, setState] = useState(() => computeVesselState(wakeHour, sleepHour));
  const [showPopover, setShowPopover] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setState(computeVesselState(wakeHour, sleepHour));
    intervalRef.current = setInterval(() => {
      setState(computeVesselState(wakeHour, sleepHour));
    }, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [wakeHour, sleepHour]);

  const { progress, remainingHours, focusHours } = state;
  const color = getColorState(progress);

  // SVG arc path for 140px vessel (r = 62, circumference ≈ 389.6)
  const size = 140;
  const r = 62;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress / 100);

  // Hour blocks for popover (remaining hours from now to sleepHour)
  const now = new Date();
  const currentHour = now.getHours();
  const hourBlocks = Array.from({ length: Math.max(0, sleepHour - currentHour) }, (_, i) => {
    const hour = currentHour + i;
    const label = hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;
    // Energy color by time-of-day
    const blockColor =
      hour < 10 ? "#5eead4"  // morning teal
      : hour < 14 ? "#fbbf24" // midday amber
      : hour < 18 ? "#fb923c" // afternoon coral
      : "#a78bfa";            // evening purple
    return { hour, label, blockColor };
  });

  return (
    <div className="relative flex flex-col items-center">
      {/* Vessel */}
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onClick={() => setShowPopover((v) => !v)}
        title="Day progress vessel"
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-40"
          style={{ background: color.glow }}
        />

        <svg width={size} height={size} className="relative -rotate-90">
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color.arc}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-[60000ms] ease-linear"
          />
        </svg>

        {/* Liquid fill inside circle */}
        <div
          className="absolute rounded-full overflow-hidden border border-white/10"
          style={{ inset: "12px" }}
        >
          <div className="absolute inset-0 bg-[#0e0c0a]" />
          {/* Liquid level */}
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-[60000ms] ease-linear"
            style={{
              height: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(to top, ${color.fill[1]}, ${color.fill[0]})`,
              opacity: 0.22,
            }}
          />
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
            <span className="font-mono text-xl font-black leading-none" style={{ color: color.arc }}>
              {remainingHours.toFixed(1)}h
            </span>
            <span className="text-[8px] font-quick font-bold text-[rgba(245,239,232,0.4)] uppercase tracking-wider mt-0.5">
              remains
            </span>
          </div>
        </div>
      </div>

      {/* Label below */}
      <div className="mt-2 text-center">
        <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-[rgba(245,239,232,0.35)]">
          Day Vessel
        </p>
        <p className="text-[11px] font-mono font-semibold mt-0.5" style={{ color: color.arc }}>
          ~{focusHours.toFixed(1)}h focused hrs left
        </p>
      </div>

      {/* Hover popover */}
      {showPopover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20 w-56 rounded-xl border border-[rgba(255,245,235,0.08)] bg-[#1a1714] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-[rgba(245,239,232,0.4)] mb-2">
            Remaining hours today
          </p>
          {hourBlocks.length === 0 ? (
            <p className="text-xs font-quick text-[rgba(245,239,232,0.35)]">Time to rest 🌙</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {hourBlocks.map(({ hour, label, blockColor }) => (
                <div
                  key={hour}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[9px] font-mono font-bold border border-white/5"
                  style={{ backgroundColor: `${blockColor}20`, color: blockColor }}
                  title={label}
                >
                  {hour % 12 === 0 ? 12 : hour % 12}
                  <span className="text-[7px] ml-0.5">{hour < 12 ? "a" : "p"}</span>
                </div>
              ))}
            </div>
          )}
          {/* Triangle pointer */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-[rgba(255,245,235,0.08)] bg-[#1a1714]" />
        </div>
      )}
    </div>
  );
}
