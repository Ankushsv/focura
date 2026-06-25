"use client";

import { formatDuration } from "@/lib/timeline/types";

interface SummaryBarProps {
  focusMinutes: number;
  lifeMinutes: number;
  freeMinutes: number;
  completedTasks: number;
  focusPct: number;
  lifePct: number;
  freePct: number;
}

export default function SummaryBar({
  focusMinutes,
  lifeMinutes,
  freeMinutes,
  completedTasks,
  focusPct,
  lifePct,
  freePct,
}: SummaryBarProps) {
  return (
    <div
      className="relative z-30 mx-4 mb-4 mt-2 rounded-2xl border border-warm-border bg-[#141210]/95 backdrop-blur-md shadow-2xl shrink-0"
      style={{ height: "64px" }}
    >
      <div className="h-full flex items-center justify-between gap-6 px-6">
        {/* Stats Widgets */}
        <div className="flex items-center gap-3 shrink-0">
          <Stat emoji="⚔️" label="Focus" value={formatDuration(focusMinutes)} color="text-warm-amber font-semibold" />
          <Stat emoji="🌿" label="Life"  value={formatDuration(lifeMinutes)}  color="text-orange-300 font-semibold" />
          <Stat emoji="⬜" label="Free"  value={formatDuration(freeMinutes)}  color="text-warm-textMuted" />
          <Stat emoji="✅" label="Done"  value={`${completedTasks} tasks`}    color="text-amber-500 font-semibold" />
        </div>

        {/* Mini 24h timeline bar with clean segments */}
        <div className="flex-1 flex items-center gap-3 min-w-0 max-w-md">
          <span className="text-[9px] text-warm-textHint font-space font-bold uppercase tracking-wider shrink-0 select-none">
            Day
          </span>
          <div className="flex-1 h-3 rounded-full overflow-hidden bg-warm-surface2 flex p-[1.5px] border border-warm-border/40 shadow-inner">
            {/* Focus segment */}
            {focusPct > 0 && (
              <div
                className="h-full bg-warm-amber transition-all duration-700 rounded-l-full"
                style={{ width: `${focusPct}%` }}
                title={`Focus: ${formatDuration(focusMinutes)}`}
              />
            )}
            {/* Life segment */}
            {lifePct > 0 && (
              <div
                className="h-full bg-[#fed7aa] transition-all duration-700"
                style={{
                  width: `${lifePct}%`,
                  borderTopLeftRadius: focusPct === 0 ? "9999px" : "0px",
                  borderBottomLeftRadius: focusPct === 0 ? "9999px" : "0px",
                  borderTopRightRadius: freePct === 0 ? "9999px" : "0px",
                  borderBottomRightRadius: freePct === 0 ? "9999px" : "0px",
                }}
                title={`Life: ${formatDuration(lifeMinutes)}`}
              />
            )}
            {/* Free segment fills remaining */}
          </div>
          <span className="text-[9px] text-warm-textHint font-space font-bold uppercase tracking-wider shrink-0 select-none">
            24h
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/10 border border-warm-border/10 shadow-sm transition duration-150 cursor-default select-none">
      <span className="text-sm filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{emoji}</span>
      <div className="flex flex-col">
        <p className={`text-xs font-bold font-quick tracking-wide leading-none ${color}`}>{value}</p>
        <p className="text-[8px] text-warm-textHint font-space font-semibold uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
