"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  type TimelineBlock,
  formatDuration,
  snapToQuarter,
} from "@/lib/timeline/types";
import { MIN_PX } from "./TimelineGrid";

interface LifeBlockProps {
  block: TimelineBlock;
  heightPx: number;
  onUpdate: (updates: Partial<TimelineBlock>) => Promise<void>;
  onDelete: () => Promise<void>;
  onResizeEnd: (newDurationMinutes: number) => Promise<void>;
}

export default function LifeBlock({
  block,
  heightPx,
  onUpdate,
  onDelete,
  onResizeEnd,
}: LifeBlockProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Resize handle
  const resizeRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartDuration = useRef(block.planned_duration_minutes);

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
    const el = resizeRef.current?.closest(".life-block-wrapper") as HTMLElement | null;
    if (el) el.style.height = `${snapped * MIN_PX}px`;
  }, []);

  const handleResizePointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!resizeRef.current?.hasPointerCapture(e.pointerId)) return;
    resizeRef.current.releasePointerCapture(e.pointerId);
    const deltaPx = e.clientY - dragStartY.current;
    const snapped = Math.max(15, snapToQuarter(dragStartDuration.current + deltaPx / MIN_PX));
    await onResizeEnd(snapped);
  }, [onResizeEnd]);

  const statusIcon = {
    planned: "",
    active:  "▶",
    completed: "✓",
    overran: "",
    skipped: "✕",
  }[block.status] ?? "";

  const isSmall = heightPx < 44;

  const getLifeBlockStyles = () => {
    const category = block.life_category || "";
    
    // Default / Other activity: Cozy Copper/Bronze
    let borderLeft = "3px solid #b45309"; 
    let textColor = "text-orange-400/80";

    if (category === "sleep") {
      borderLeft = "3px solid #9d174d"; // Deep Plum/Rose
      textColor = "text-rose-400/80";
    } else if (category === "break") {
      borderLeft = "3px solid #fed7aa"; // Warm Peach/Cream
      textColor = "text-orange-300";
    } else if (
      category.includes("breakfast") || 
      category.includes("lunch") || 
      category.includes("dinner") || 
      category.includes("routine") ||
      category.includes("commute")
    ) {
      borderLeft = "3px solid #d97706"; // Ochre/Sand Gold
      textColor = "text-amber-500/80";
    }

    if (block.status === "skipped") {
      return {
        background: "#0e0b09",
        border: "1px solid rgba(255, 245, 235, 0.01)",
        borderLeft: "3px solid #242220",
        opacity: 0.3,
        textColor: "text-warm-textHint",
      };
    }

    if (block.status === "completed") {
      return {
        background: "#0e0b09",
        border: "1px solid rgba(255, 245, 235, 0.02)",
        borderLeft: "3px solid #33302e",
        opacity: 0.5,
        textColor: "text-warm-textHint",
      };
    }

    return {
      background: "#12100f",
      border: "1px solid rgba(255, 245, 235, 0.03)",
      borderLeft,
      opacity: 1,
      textColor,
    };
  };

  const styleConfig = getLifeBlockStyles();

  return (
    <motion.div
      layout
      whileHover={{ y: -1.5, scale: 1.008, zIndex: 30 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      className="life-block-wrapper relative h-full rounded-xl overflow-visible cursor-pointer group select-none transition-shadow hover:shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
      style={{
        background: styleConfig.background,
        border: styleConfig.border,
        borderLeft: styleConfig.borderLeft,
        opacity: styleConfig.opacity,
      }}
      onClick={() => setPopoverOpen(p => !p)}
    >
      {/* Always-visible delete button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await onDelete();
        }}
        title="Remove from timeline"
        className="absolute top-1 right-1 z-30 flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold bg-black/40 text-warm-textHint opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all duration-150 shadow-sm"
      >
        ✕
      </button>

      {/* Content Row Layout */}
      <div className="flex items-center gap-2.5 h-full px-2.5 py-1 relative z-10 overflow-hidden">
        {/* Floating emoji avatar frame */}
        <div
          className={`flex items-center justify-center shrink-0 rounded-full border bg-black/20 select-none group-hover:scale-105 transition-transform ${
            isSmall ? "h-5 w-5 text-xs" : "h-7 w-7 text-sm"
          }`}
          style={{
            borderColor: styleConfig.border.replace("1px solid ", ""),
            opacity: block.status === "skipped" ? 0.4 : 1,
          }}
        >
          {block.life_emoji || "🌀"}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className={`font-space font-bold leading-tight text-warm-textMuted truncate group-hover:text-warm-text transition-colors ${
              isSmall ? "text-[10px]" : "text-xs"
            } ${block.status === "skipped" ? "line-through opacity-50" : ""}`}
          >
            {statusIcon && <span className={`mr-1 ${styleConfig.textColor}`}>{statusIcon}</span>}
            {block.life_label || "Activity"}
          </p>
          {!isSmall && (
            <span className="text-[9px] text-warm-textHint font-mono mt-0.5">
              ⏱️ {formatDuration(block.planned_duration_minutes)}
            </span>
          )}
        </div>
      </div>

      {/* Popover */}
      {popoverOpen && (
        <div
          className="absolute left-full ml-2 top-0 z-50 w-44 rounded-xl border border-warm-border bg-warm-surface shadow-2xl p-2 space-y-1 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {block.status === "planned" && (
            <button
              onClick={async () => { await onUpdate({ status: "active" }); setPopoverOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
            >
              ▶ Mark Started
            </button>
          )}
          {(block.status === "planned" || block.status === "active") && (
            <button
              onClick={async () => { await onUpdate({ status: "completed" }); setPopoverOpen(false); }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-teal hover:bg-warm-teal/10 transition"
            >
              ✓ Mark Done
            </button>
          )}
          <button
            onClick={async () => { await onUpdate({ status: "skipped" }); setPopoverOpen(false); }}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
          >
            Skip
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

      {/* Resize handle */}
      <div
        ref={resizeRef}
        className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-30"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-6 h-0.5 rounded-full bg-warm-textHint/40" />
      </div>
    </motion.div>
  );
}
