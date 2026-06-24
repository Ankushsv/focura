"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type TimelineLayer } from "@/lib/timeline/types";
import { type DayTemplate } from "@/lib/timeline/types";

interface DayNavBarProps {
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  layer: TimelineLayer;
  onLayerChange: (l: TimelineLayer) => void;
  templates: DayTemplate[];
  onSaveTemplate: () => void;
  onUseTemplate: (t: DayTemplate) => void;
}

const LAYERS: { value: TimelineLayer; label: string }[] = [
  { value: "plan",   label: "Plan" },
  { value: "actual", label: "Actual" },
  { value: "both",   label: "Both" },
];

function formatDateDisplay(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (d.toDateString() === today.toDateString()) return `Today — ${dateStr}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday — ${dateStr}`;
  return dateStr;
}

export default function DayNavBar({
  selectedDate,
  onDateChange,
  layer,
  onLayerChange,
  templates,
  onSaveTemplate,
  onUseTemplate,
}: DayNavBarProps) {
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-warm-border bg-[#0e0c0a]/90 backdrop-blur-md sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      {/* Left: Date navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-warm-border bg-warm-surface text-warm-textMuted hover:text-warm-text hover:border-warm-border/60 hover:scale-105 active:scale-95 transition"
          title="Previous day"
        >
          ‹
        </button>

        <div className="text-center min-w-[140px] select-none">
          <p className={`font-quick font-bold text-sm leading-tight transition-colors ${isToday ? "text-warm-amber" : "text-warm-text"}`}>
            {formatDateDisplay(selectedDate)}
          </p>
          <p className="text-[9px] text-warm-textHint font-mono uppercase tracking-wider mt-0.5">
            {selectedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
          </p>
        </div>

        <button
          onClick={goForward}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-warm-border bg-warm-surface text-warm-textMuted hover:text-warm-text hover:border-warm-border/60 hover:scale-105 active:scale-95 transition"
          title="Next day"
        >
          ›
        </button>

        {!isToday && (
          <button
            onClick={() => onDateChange(new Date())}
            className="flex items-center gap-1.5 rounded-xl border border-warm-amber/35 bg-warm-amber/10 px-3 py-1.5 text-[9px] font-bold font-quick text-warm-amber hover:bg-warm-amber/20 hover:scale-105 active:scale-95 transition shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-warm-amber animate-pulse" />
            Return to Today
          </button>
        )}
      </div>

      {/* Center: Layer toggle */}
      <div className="flex items-center gap-1 rounded-full border border-warm-border bg-black/45 p-1 shadow-inner">
        {LAYERS.map(l => (
          <button
            key={l.value}
            onClick={() => onLayerChange(l.value)}
            className={`relative rounded-full px-4 py-1.5 text-xs font-bold font-quick transition-all duration-200 ${
              layer === l.value
                ? "text-warm-text"
                : "text-warm-textMuted hover:text-warm-text"
            }`}
          >
            {layer === l.value && (
              <motion.div
                layoutId="layer-pill"
                className="absolute inset-0 rounded-full bg-warm-surface border border-warm-border/40 shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{l.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Template actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveTemplate}
          className="rounded-xl border border-warm-border bg-warm-surface2 px-3 py-1.5 text-xs font-bold font-quick text-warm-textMuted hover:text-warm-text hover:border-warm-teal/40 transition"
          title="Save current life blocks as a template"
        >
          💾 Save Template
        </button>

        <div className="relative">
          <button
            onClick={() => setTemplateMenuOpen(p => !p)}
            className="rounded-xl border border-warm-border bg-warm-surface2 px-3 py-1.5 text-xs font-bold font-quick text-warm-textMuted hover:text-warm-text hover:border-warm-purple/40 transition flex items-center gap-1.5"
          >
            📋 Use Template
            <span className="text-[10px] opacity-60">{templateMenuOpen ? "▲" : "▼"}</span>
          </button>

          {templateMenuOpen && (
            <div className="absolute right-0 top-10 w-52 rounded-xl border border-warm-border bg-warm-surface shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
              {templates.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-warm-textHint font-space">
                  No templates saved yet. Add life blocks and save one!
                </p>
              ) : (
                templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onUseTemplate(t);
                      setTemplateMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-quick font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
                  >
                    📋 {t.name}
                    <span className="ml-2 text-[10px] text-warm-textHint font-space font-normal">
                      {(t.blocks as any[]).length} blocks
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
