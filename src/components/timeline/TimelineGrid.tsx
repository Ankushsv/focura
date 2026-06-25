"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useTimer } from "@/components/providers/TimerProvider";
import { formatHourLabel, timeToMinutes, type TimelineBlock, type TimelineUserPrefs, type TimelineLayer } from "@/lib/timeline/types";
import FocusBlock from "./FocusBlock";
import LifeBlock from "./LifeBlock";

const formatTimeMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, "0");
  return `${displayH}:${displayM}${ampm}`;
};

// 1 hour = 80px, 15 min = 20px
export const HOUR_PX = 80;
export const MIN_PX = HOUR_PX / 60;

interface TimelineGridProps {
  blocks: TimelineBlock[];
  prefs: TimelineUserPrefs;
  layer: TimelineLayer;
  selectedDate: Date;
  onUpdateBlock: (id: string, updates: Partial<TimelineBlock>) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onStartFocus: (block: TimelineBlock) => void;
  onCompleteBlock: (blockId: string, actualMinutes: number) => Promise<{ overflow: string[]; overrun: number }>;
  ghostBlock?: { startMinutes: number; durationMinutes: number; label: string } | null;
}

const TOTAL_HOURS = 24;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i);

export default function TimelineGrid({
  blocks,
  prefs,
  layer,
  selectedDate,
  onUpdateBlock,
  onDeleteBlock,
  onStartFocus,
  onCompleteBlock,
  ghostBlock,
}: TimelineGridProps) {
  const timer = useTimer();
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // Real-time tick update to stretch block height in real-time
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!timer.activeBlockId || !timer.running) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [timer.activeBlockId, timer.running]);

  // Update "now" indicator every 60 seconds
  useEffect(() => {
    const updateNow = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current time on first load (today) or wake time on other days
  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    hasScrolled.current = true;
    const targetMinutes = isToday && currentMinutes !== null
      ? Math.max(0, currentMinutes - 60)
      : prefs.wake_hour * 60;
    const scrollTop = targetMinutes * MIN_PX - 40;
    scrollRef.current.scrollTop = Math.max(0, scrollTop);
  }, [isToday, currentMinutes, prefs.wake_hour]);

  const { setNodeRef: setDropRef } = useDroppable({ id: "timeline-grid" });

  const totalHeight = TOTAL_HOURS * HOUR_PX;

  const filteredBlocks = blocks.filter(b => {
    if (layer === "plan") return b.layer === "plan" || !b.layer;
    if (layer === "actual") return b.layer === "actual";
    return true; // "both"
  });

  return (
    <div
      ref={(node) => {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        setDropRef(node);
      }}
      id="timeline-scroll-container"
      className="flex-1 overflow-y-auto relative"
      style={{ height: "100%" }}
    >
      <div
        className="relative mx-auto max-w-2xl"
        style={{ height: `${totalHeight}px`, minWidth: "320px" }}
      >
        {/* ── Vertical axis line ─────────────────────────────── */}
        <div
          className="absolute left-16 top-0 bottom-0 border-l pointer-events-none"
          style={{ borderColor: "rgba(255,245,235,0.06)" }}
        />

        {/* ── Hour grid lines ─────────────────────────────────── */}
        {HOURS.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start pointer-events-none"
            style={{ top: `${h * HOUR_PX}px` }}
          >
            {/* Time label */}
            <div
              className="w-16 shrink-0 pr-3 text-right select-none"
              style={{ marginTop: "-9px" }}
            >
              <span className="font-space text-[10px] font-bold text-warm-textHint">
                {h < 24 ? formatHourLabel(h) : ""}
              </span>
            </div>

            {/* Solid hour line */}
            <div
              className="flex-1 border-t"
              style={{ borderColor: "rgba(255,245,235,0.04)" }}
            />

            {/* 15-min snap markers next to vertical axis line */}
            {h < 24 && [15, 30, 45].map(offset => (
              <div
                key={`${h}-${offset}`}
                className="absolute left-16 h-1 w-1 rounded-full bg-warm-border/40 -ml-[2.5px] pointer-events-none"
                style={{ top: `${offset * MIN_PX}px` }}
              />
            ))}
          </div>
        ))}

        {/* ── 30-min dashed lines ──────────────────────────────── */}
        {Array.from({ length: TOTAL_HOURS }, (_, h) => (
          <div
            key={`half-${h}`}
            className="absolute left-16 right-0 pointer-events-none"
            style={{
              top: `${h * HOUR_PX + HOUR_PX / 2}px`,
              borderTop: "1px dashed rgba(255,245,235,0.02)",
            }}
          />
        ))}

        {/* ── Day-phase Landmark Background Bands ─────────────── */}
        {(() => {
          const wake = prefs.wake_hour;
          const sleep = prefs.sleep_hour;
          const morningStart = wake;
          const morningEnd = Math.min(sleep, Math.max(wake, 12));
          const afternoonStart = Math.min(sleep, Math.max(wake, 12));
          const afternoonEnd = Math.min(sleep, Math.max(wake, 18));
          const eveningStart = Math.min(sleep, Math.max(wake, 18));
          const eveningEnd = sleep;

          return (
            <>
              {/* Morning Band */}
              {morningEnd > morningStart && (
                <div
                  className="absolute left-16 right-0 pointer-events-none border-l border-amber-500/10"
                  style={{
                    top: `${morningStart * HOUR_PX}px`,
                    height: `${(morningEnd - morningStart) * HOUR_PX}px`,
                    background: "linear-gradient(to right, rgba(245, 158, 11, 0.012) 0%, transparent 100%)",
                  }}
                >
                  <span className="absolute top-2.5 left-3 text-[8px] font-bold tracking-widest uppercase text-warm-amber/35 font-space select-none">
                    🌅 Morning Focus
                  </span>
                </div>
              )}

              {/* Afternoon Band */}
              {afternoonEnd > afternoonStart && (
                <div
                  className="absolute left-16 right-0 pointer-events-none border-l border-orange-500/10"
                  style={{
                    top: `${afternoonStart * HOUR_PX}px`,
                    height: `${(afternoonEnd - afternoonStart) * HOUR_PX}px`,
                    background: "linear-gradient(to right, rgba(234, 88, 12, 0.012) 0%, transparent 100%)",
                  }}
                >
                  <span className="absolute top-2.5 left-3 text-[8px] font-bold tracking-widest uppercase text-orange-400/35 font-space select-none">
                    ☀️ Afternoon Flow
                  </span>
                </div>
              )}

              {/* Evening Band */}
              {eveningEnd > eveningStart && (
                <div
                  className="absolute left-16 right-0 pointer-events-none border-l border-rose-500/10"
                  style={{
                    top: `${eveningStart * HOUR_PX}px`,
                    height: `${(eveningEnd - eveningStart) * HOUR_PX}px`,
                    background: "linear-gradient(to right, rgba(244, 63, 94, 0.012) 0%, transparent 100%)",
                  }}
                >
                  <span className="absolute top-2.5 left-3 text-[8px] font-bold tracking-widest uppercase text-[#fda4af]/30 font-space select-none">
                    🌌 Evening Routine
                  </span>
                </div>
              )}

              {/* Sleep / Night Bands (Rest Zone) */}
              {[
                { start: 0, end: wake },
                { start: sleep, end: 24 }
              ].map(({ start, end }, idx) => {
                if (end <= start) return null;
                return (
                  <div
                    key={idx}
                    className="absolute left-16 right-0 pointer-events-none bg-rest-pattern"
                    style={{
                      top: `${start * HOUR_PX}px`,
                      height: `${(end - start) * HOUR_PX}px`,
                      borderLeft: "1px solid rgba(120, 113, 108, 0.04)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 p-3 opacity-[0.12] select-none">
                      <span className="text-[10px]">🌙</span>
                      <span className="text-[8px] font-bold tracking-widest uppercase text-stone-500 font-space">
                        Rest & Recharge
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Wake Boundary Badge */}
              <div
                className="absolute left-16 right-0 pointer-events-none flex items-center gap-2 z-10"
                style={{ top: `${wake * HOUR_PX}px`, transform: "translateY(-50%)" }}
              >
                <div className="h-[1px] flex-1 bg-amber-500/20" />
                <span className="text-[8px] font-space font-bold tracking-widest uppercase text-warm-amber bg-[#12100e] px-2 py-0.5 border border-amber-500/20 rounded-full shadow-sm">
                  🌅 Wake & Rise
                </span>
                <div className="h-[1px] flex-1 bg-amber-500/20" />
              </div>

              {/* Sleep Boundary Badge */}
              <div
                className="absolute left-16 right-0 pointer-events-none flex items-center gap-2 z-10"
                style={{ top: `${sleep * HOUR_PX}px`, transform: "translateY(-50%)" }}
              >
                <div className="h-[1px] flex-1 bg-[#b45309]/20" />
                <span className="text-[8px] font-space font-bold tracking-widest uppercase text-[#fed7aa] bg-[#12100e] px-2 py-0.5 border border-[#b45309]/20 rounded-full shadow-sm">
                  💤 Boundary of Rest
                </span>
                <div className="h-[1px] flex-1 bg-[#b45309]/20" />
              </div>
            </>
          );
        })()}

        {/* ── Timeline blocks ──────────────────────────────────── */}
        <div className="absolute left-16 right-2 top-0">
          {filteredBlocks.map(block => {
            const startMins = timeToMinutes(block.start_time);
            const topPx = startMins * MIN_PX;

            // Dynamically calculate block duration if it is currently active
            const isActive = timer.activeBlockId === block.id && block.status === "active";
            const duration = isActive && timer.sessionStartTime
              ? Math.max(1, Math.ceil((Date.now() - timer.sessionStartTime) / 60000))
              : (block.actual_duration_minutes || block.planned_duration_minutes);

            const heightPx = Math.max(20, duration * MIN_PX);
            const opacity = layer === "both" && block.layer === "plan" ? 0.7 : 1;

            return (
              <div
                key={block.id}
                className="absolute left-0 right-0"
                style={{ top: `${topPx}px`, height: `${heightPx}px`, opacity }}
              >
                {block.block_type === "focus" ? (
                  <FocusBlock
                    block={block}
                    heightPx={heightPx}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                    onDelete={() => onDeleteBlock(block.id)}
                    onStart={() => onStartFocus(block)}
                    onComplete={(actualMinutes) => onCompleteBlock(block.id, actualMinutes)}
                    onResizeEnd={(newDuration) =>
                      onUpdateBlock(block.id, { planned_duration_minutes: newDuration })
                    }
                  />
                ) : (
                  <LifeBlock
                    block={block}
                    heightPx={heightPx}
                    onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                    onDelete={() => onDeleteBlock(block.id)}
                    onResizeEnd={(newDuration) =>
                      onUpdateBlock(block.id, { planned_duration_minutes: newDuration })
                    }
                  />
                )}
              </div>
            );
          })}

          {/* ── Ghost block during drag ──────────────────────────── */}
          {ghostBlock && (
            <div
              className="absolute left-0 right-0 rounded-xl border-2 border-warm-purple/50 bg-warm-purple/10 flex items-center justify-center pointer-events-none transition-none timeline-ghost"
              style={{
                top: `${ghostBlock.startMinutes * MIN_PX}px`,
                height: `${Math.max(20, ghostBlock.durationMinutes * MIN_PX)}px`,
              }}
            >
              <span className="text-xs font-quick font-bold text-warm-purple/80 px-2 text-center truncate">
                {ghostBlock.label}
              </span>
            </div>
          )}
        </div>

        {/* ── Current time indicator (today only) ──────────────── */}
        {isToday && currentMinutes !== null && (
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
            style={{ top: `${currentMinutes * MIN_PX}px`, transform: "translateY(-50%)" }}
          >
            {/* Digital Clock pill on left */}
            <div className="w-16 pr-2.5 text-right flex justify-end">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-black text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(234,88,12,0.35)] select-none">
                {formatTimeMinutes(currentMinutes)}
              </span>
            </div>
            {/* Laser Line and Pulse Ring */}
            <div className="flex-1 flex items-center relative">
              <div
                className="h-[1.5px] flex-1 now-laser-line"
                style={{ background: "linear-gradient(to right, #ea580c 30%, rgba(240,168,104,0.15) 100%)" }}
              />
              <div className="absolute left-0 -ml-1 flex items-center justify-center">
                {/* Double ring pulse */}
                <div className="absolute h-5 w-5 rounded-full bg-orange-500/25 now-pulse-ring" />
                <div className="absolute h-3 w-3 rounded-full bg-amber-500/30 now-pulse-ring" style={{ animationDelay: "0.5s" }} />
                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_#ea580c] relative z-10" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
