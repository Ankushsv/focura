import React from "react";

export default function Vessel({
  progress,
  colors,
  glow,
  size = 320,
  mini = false,
  timeLabel,
  theme = "default",
  running = false,
}: {
  progress: number;
  colors: [string, string];
  glow: string;
  size?: number;
  mini?: boolean;
  timeLabel?: string;
  theme?: "default" | "jungle" | "future" | "hourglass";
  running?: boolean;
}) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;

  // Mini mode renderer: keeps it simple and lightweight for the corner overlay
  if (mini) {
    const activeColors =
      theme === "jungle"
        ? (["#15803d", "#22c55e"] as [string, string])
        : theme === "future"
        ? (["#06b6d4", "#8b5cf6"] as [string, string])
        : theme === "hourglass"
        ? (["#78350f", "#d97706"] as [string, string])
        : colors;
    const activeGlow =
      theme === "jungle"
        ? "#22c55e"
        : theme === "future"
        ? "#06b6d4"
        : theme === "hourglass"
        ? "#d97706"
        : glow;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 overflow-hidden rounded-full border border-white/15 bg-white/5"
          style={{ boxShadow: `0 0 10px ${activeGlow}30` }}
        >
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear"
            style={{
              height: `${Math.min(progress, 100)}%`,
              background: `linear-gradient(180deg, ${activeColors[0]}, ${activeColors[1]})`,
            }}
          />
        </div>
      </div>
    );
  }

  // Theme-specific parameter overrides
  const isJungle = theme === "jungle";
  const isFuture = theme === "future";
  const isHourglass = theme === "hourglass";

  const themeColors: [string, string] = isJungle
    ? ["#14532d", "#22c55e"]
    : isFuture
    ? ["#0891b2", "#8b5cf6"]
    : isHourglass
    ? ["#78350f", "#f59e0b"]
    : colors;

  const themeGlow = isJungle
    ? "#22c55e"
    : isFuture
    ? "#06b6d4"
    : isHourglass
    ? "#f59e0b"
    : glow;

  // Hourglass sand levels logic (0 to 42 units inside the 120x120 viewBox)
  const topSandHeight = 42 * (1 - Math.min(progress, 100) / 100);
  const topSandY = 18 + 42 * (Math.min(progress, 100) / 100);
  const bottomSandHeight = 42 * (Math.min(progress, 100) / 100);
  const bottomSandY = 102 - bottomSandHeight;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Dynamic Keyframes injecting inline for self-contained, theme-independent styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-spore {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-15px) scale(1.3); opacity: 0.7; }
        }
        @keyframes swing-vines {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes cyber-rotate-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cyber-rotate-ccw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes sand-flow-anim {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 12; }
        }
        .spore-1 { animation: float-spore 5s ease-in-out infinite; }
        .spore-2 { animation: float-spore 7s ease-in-out infinite 1.5s; }
        .spore-3 { animation: float-spore 6s ease-in-out infinite 3s; }
        .vine-swing { animation: swing-vines 8s ease-in-out infinite; transform-origin: center; }
        .cyber-cw { animation: cyber-rotate-cw 25s linear infinite; transform-origin: center; }
        .cyber-ccw { animation: cyber-rotate-ccw 18s linear infinite; transform-origin: center; }
        .sand-flow-line { animation: sand-flow-anim 0.5s linear infinite; }
      `}} />

      {/* ── 1. MEDIEVAL VESSEL (DEFAULT) & JUNGLE THEME LIQUID ORBS ── */}
      {!isHourglass && (
        <>
          {/* Spinning Outer Orbit Rings (Swaying Vines for Jungle, Standard for Default) */}
          {isJungle ? (
            <svg width={size} height={size} className="absolute inset-0 pointer-events-none vine-swing select-none z-10">
              <defs>
                <linearGradient id="jungle-leaf-grad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 8}
                fill="none"
                stroke="#15803d"
                strokeWidth="2.5"
                strokeDasharray="40 20 10 20"
                opacity="0.65"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 14}
                fill="none"
                stroke="#166534"
                strokeWidth="1.5"
                strokeDasharray="15 35"
                opacity="0.5"
              />
              {/* Sprouting leaf nodes around the ring */}
              {[45, 135, 225, 315].map((angle, idx) => (
                <g key={idx} transform={`translate(${size / 2}, ${size / 2}) rotate(${angle}) translate(0, ${-(size / 2 - 8)})`}>
                  <path
                    d="M 0 0 C -8 -12, -12 -20, 0 -28 C 12 -20, 8 -12, 0 0"
                    fill="url(#jungle-leaf-grad)"
                    stroke="#14532d"
                    strokeWidth="1.2"
                  />
                  <path d="M 0 0 L 0 -24" stroke="#166534" strokeWidth="0.8" opacity="0.6" />
                </g>
              ))}
            </svg>
          ) : !isFuture ? (
            <>
              <div className="vessel-ring" style={{ borderColor: themeGlow }} />
              <div className="vessel-ring" style={{ borderColor: themeGlow }} />
              <div className="vessel-ring" style={{ borderColor: themeGlow }} />
            </>
          ) : null}

          {/* Core Liquid Flask container */}
          {!isFuture ? (
            <div
              className={`absolute inset-0 overflow-hidden rounded-full border bg-white/5 transition-all duration-500 ${
                isJungle ? "border-green-500/20" : "border-white/15"
              }`}
              style={{ boxShadow: `0 0 60px ${themeGlow}40, inset 0 0 30px ${themeGlow}20` }}
            >
              {/* Animated liquid fill */}
              <div
                className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear"
                style={{
                  height: `${Math.min(progress, 100)}%`,
                  background: `linear-gradient(180deg, ${themeColors[0]}, ${themeColors[1]})`,
                }}
              >
                <div className="wave" style={{ background: themeColors[0] }} />
                <div className="wave wave-2" style={{ background: themeColors[1] }} />
              </div>

              {/* Jungle-specific spore overlay particles */}
              {isJungle && (
                <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-10">
                  <div className="spore-1 absolute w-1.5 h-1.5 bg-green-300/40 rounded-full blur-[1px]" style={{ left: "25%", top: "65%" }} />
                  <div className="spore-2 absolute w-2 h-2 bg-emerald-400/30 rounded-full blur-[1.5px]" style={{ left: "75%", top: "35%" }} />
                  <div className="spore-3 absolute w-1 h-1 bg-green-200/50 rounded-full" style={{ left: "45%", top: "80%" }} />
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* ── 2. CYBER FUTURE THEME ── */}
      {isFuture && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Viewfinder Target Brackets */}
          <div className="absolute -inset-3 border border-cyan-500/10 rounded-2xl pointer-events-none">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50" />
          </div>

          {/* Concentric rotating tech circles */}
          <svg width={size} height={size} className="absolute inset-0 pointer-events-none select-none z-10">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 8}
              fill="none"
              stroke="rgba(6, 182, 212, 0.4)"
              strokeWidth="2"
              strokeDasharray="100 40 10 40"
              className="cyber-cw"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 14}
              fill="none"
              stroke="rgba(139, 92, 246, 0.3)"
              strokeWidth="1.5"
              strokeDasharray="25 15 50 10"
              className="cyber-ccw"
            />
            {/* Viewfinder Crosshair Ticks */}
            {[0, 90, 180, 270].map((angle, idx) => (
              <g key={idx} transform={`translate(${size / 2}, ${size / 2}) rotate(${angle}) translate(0, ${-(size / 2 - 6)})`}>
                <line x1="-6" y1="0" x2="6" y2="0" stroke="#06b6d4" strokeWidth="2" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#06b6d4" strokeWidth="1" />
              </g>
            ))}
          </svg>

          {/* Fusion Core Hologram cylinder */}
          <div
            className="absolute inset-0 overflow-hidden rounded-full border border-cyan-500/25 bg-slate-950/50"
            style={{ boxShadow: `0 0 50px rgba(6, 182, 212, 0.15), inset 0 0 25px rgba(6, 182, 212, 0.08)` }}
          >
            {/* Cyber Grid backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:12px_12px]" />

            {/* Glowing Energy core level */}
            <div
              className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out"
              style={{
                height: `${Math.min(progress, 100)}%`,
                background: `linear-gradient(0deg, rgba(139, 92, 246, 0.35) 0%, rgba(6, 182, 212, 0.6) 100%)`,
                borderTop: "2px solid #06b6d4",
                boxShadow: "0 0 25px rgba(6, 182, 212, 0.4)",
              }}
            >
              {/* Horizontal scanline overlays */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.1)_50%,transparent_50%)] bg-[size:100%_4px]" />
              {/* Spark particles */}
              <div className="absolute top-0 left-[15%] w-8 h-[2px] bg-cyan-300 animate-pulse" />
              <div className="absolute top-0 right-[25%] w-12 h-[2px] bg-violet-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 3. HOURGLASS CHRONO THEME ── */}
      {isHourglass && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 120 120"
            width={size}
            height={size}
            className="w-full h-full drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="wood-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#290f02" />
              </linearGradient>
              <linearGradient id="wood-pillar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#290f02" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="gold-accent" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="sand-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Dynamic clip paths for sand filling */}
              <clipPath id="top-sand-clip">
                <rect x="30" y={topSandY} width="60" height={topSandHeight} />
              </clipPath>
              <clipPath id="bottom-sand-clip">
                <rect x="30" y={bottomSandY} width="60" height={bottomSandHeight} />
              </clipPath>
            </defs>

            {/* Glass Background Bulb Shadow */}
            <path
              d="M 38 18 C 38 40, 56 50, 56 60 C 56 70, 38 80, 38 102 L 82 102 C 82 80, 64 70, 64 60 C 64 50, 82 40, 82 18 Z"
              fill="rgba(255, 255, 255, 0.02)"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />

            {/* Top Sand (Draining) */}
            <path
              d="M 38 18 C 38 40, 56 50, 56 60 L 64 60 C 64 50, 82 40, 82 18 Z"
              fill="url(#sand-gradient)"
              clipPath="url(#top-sand-clip)"
            />

            {/* Bottom Sand (Accumulating) */}
            <path
              d="M 56 60 C 56 70, 38 80, 38 102 L 82 102 C 82 80, 64 70, 64 60 Z"
              fill="url(#sand-gradient)"
              clipPath="url(#bottom-sand-clip)"
            />

            {/* Dynamic splash pile at the neck exit inside bottom sand */}
            {running && progress < 100 && progress > 2 && (
              <ellipse
                cx="60"
                cy={102 - bottomSandHeight}
                rx="6"
                ry="3"
                fill="#f59e0b"
                opacity="0.8"
                clipPath="url(#bottom-sand-clip)"
              />
            )}

            {/* Glass Body Highlight Outlines */}
            <path
              d="M 38 18 C 38 40, 56 50, 56 60 C 56 70, 38 80, 38 102 L 82 102 C 82 80, 64 70, 64 60 C 64 50, 82 40, 82 18 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.18)"
              strokeWidth="2"
            />
            {/* Highlight shine reflections */}
            <path
              d="M 40 22 Q 40 42 55 56"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1.5"
            />
            <path
              d="M 40 64 Q 40 82 43 96"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.5"
            />

            {/* Active Sand Stream */}
            {running && progress < 100 && (
              <line
                x1="60"
                y1="60"
                x2="60"
                y2={Math.min(100, 102 - bottomSandHeight)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="sand-flow-line"
              />
            )}

            {/* Left and Right Wooden Pillars */}
            <rect x="29" y="14" width="4.5" height="92" rx="1.5" fill="url(#wood-pillar)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
            <rect x="86.5" y="14" width="4.5" height="92" rx="1.5" fill="url(#wood-pillar)" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />

            {/* Wood Base and Top Caps */}
            <rect x="24" y="10" width="72" height="8" rx="2.5" fill="url(#wood-base)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
            <rect x="24" y="102" width="72" height="8" rx="2.5" fill="url(#wood-base)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />

            {/* Gold Accents / Trim details */}
            <rect x="36" y="8" width="48" height="2" rx="0.5" fill="url(#gold-accent)" />
            <rect x="36" y="110" width="48" height="2" rx="0.5" fill="url(#gold-accent)" />
            <circle cx="31.2" cy="14" r="1.5" fill="url(#gold-accent)" />
            <circle cx="88.8" cy="14" r="1.5" fill="url(#gold-accent)" />
            <circle cx="31.2" cy="106" r="1.5" fill="url(#gold-accent)" />
            <circle cx="88.8" cy="106" r="1.5" fill="url(#gold-accent)" />
          </svg>
        </div>
      )}

      {/* ── 4. STAINLESS PROGRESS RADIAL OUTLINE (Medieval / Jungle / Cyber Standard) ── */}
      {!isHourglass && (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none select-none z-10">
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
            stroke={themeGlow}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(progress, 100) / 100)}
            className="transition-all duration-1000"
          />
        </svg>
      )}

      {/* ── 5. CORE DIGITAL DISPLAY (Percentage & Time label) ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-20">
        <span
          className={`font-black drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] tabular-nums transition-all duration-300 ${
            isFuture ? "text-7xl font-mono text-cyan-400 tracking-tight" : "text-7xl text-[#f5efe8]"
          }`}
          style={isFuture ? { textShadow: "0 0 10px rgba(6,182,212,0.6)" } : undefined}
        >
          {Math.round(progress)}%
        </span>
        {timeLabel && (
          <span
            className={`font-bold mt-1.5 drop-shadow-[0_1.5px_6px_rgba(0,0,0,0.85)] tracking-widest ${
              isFuture
                ? "text-xs font-mono text-violet-400 uppercase"
                : isHourglass
                ? "text-xs font-serif text-amber-100/80 uppercase"
                : "text-sm font-mono text-[#f5efe8]/70"
            }`}
            style={isFuture ? { textShadow: "0 0 8px rgba(139,92,246,0.6)" } : undefined}
          >
            {timeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
