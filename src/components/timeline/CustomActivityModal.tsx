"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type LifeCategory, LIFE_CATEGORIES } from "@/lib/timeline/types";

interface CustomActivityModalProps {
  onClose: () => void;
  onSave: (cat: LifeCategory) => void;
}

const EMOJI_OPTIONS = [
  "🏃","🧘","📚","🎮","🎨","🎵","☕","🍕","💻","🛁",
  "🛒","🧹","📞","🌳","🏊","🚴","✍️","🤝","😴","🧠",
  "🎯","🌍","📝","🏠","💪","🎤","🎬","🌺","🚀","⚡",
];

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];

export default function CustomActivityModal({ onClose, onSave }: CustomActivityModalProps) {
  const [emoji, setEmoji] = useState("🎯");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(30);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: `custom-${Date.now()}`,
      emoji,
      label: label.trim(),
      defaultDurationMinutes: duration,
      color: "rgba(245,239,232,0.06)",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-sm mx-4 rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-2xl space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="font-quick font-bold text-sm text-warm-text">Custom Activity</h3>

          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-textHint font-space">Emoji</label>
            <button
              onClick={() => setShowEmojiGrid(p => !p)}
              className="flex items-center gap-3 rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm w-full hover:border-warm-purple/40 transition"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs text-warm-textMuted font-space">Click to change</span>
            </button>
            {showEmojiGrid && (
              <div className="grid grid-cols-10 gap-1 p-2 rounded-xl border border-warm-border bg-warm-surface2">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setEmoji(e); setShowEmojiGrid(false); }}
                    className={`text-base rounded-lg p-1 hover:bg-white/10 transition ${emoji === e ? "bg-white/10" : ""}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Label input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-textHint font-space">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Evening Walk"
              maxLength={32}
              className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-space text-warm-text placeholder:text-warm-textHint focus:border-warm-purple/50 focus:outline-none transition"
            />
          </div>

          {/* Duration picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-textHint font-space">Default Duration</label>
            <div className="grid grid-cols-5 gap-1.5">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-xl py-2 text-[10px] font-bold font-space transition ${
                    duration === d
                      ? "bg-warm-purple/20 border border-warm-purple/40 text-warm-purple"
                      : "border border-warm-border bg-warm-surface2 text-warm-textMuted hover:border-warm-border/70 hover:text-warm-text"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-warm-border py-2.5 text-xs font-bold font-quick text-warm-textMuted hover:text-warm-text transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!label.trim()}
              className="flex-1 rounded-xl bg-warm-purple/80 py-2.5 text-xs font-bold font-quick text-white hover:bg-warm-purple disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Add Activity
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
