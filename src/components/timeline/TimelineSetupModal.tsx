"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineSetupModalProps {
  onComplete: (wakeHour: number, sleepHour: number) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? "AM" : "PM";
  const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return { value: i, label: `${h}:00 ${ampm}` };
});

export default function TimelineSetupModal({ onComplete }: TimelineSetupModalProps) {
  const [wakeHour, setWakeHour] = useState(6);
  const [sleepHour, setSleepHour] = useState(23);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md mx-4 rounded-2xl border border-warm-border bg-warm-surface p-8 shadow-2xl"
        >
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-warm-purple/10 via-transparent to-warm-amber/5" />

          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">📅</div>
              <h2 className="font-quick font-bold text-xl text-warm-text">
                Set Up Your Day
              </h2>
              <p className="text-sm text-warm-textMuted font-space">
                Tell us your typical schedule so we can build your timeline.
                <br />
                <span className="text-warm-textHint text-xs">You can change this anytime in Settings.</span>
              </p>
            </div>

            {/* Wake Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-textMuted font-space">
                <span className="text-warm-amber">🌅</span>
                Wake Time
              </label>
              <select
                value={wakeHour}
                onChange={e => setWakeHour(Number(e.target.value))}
                className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-3 text-sm font-space text-warm-text focus:border-warm-purple/60 focus:outline-none focus:ring-1 focus:ring-warm-purple/30 transition"
              >
                {HOUR_OPTIONS.slice(0, 18).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Sleep Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-textMuted font-space">
                <span className="text-warm-purple">😴</span>
                Sleep Time
              </label>
              <select
                value={sleepHour}
                onChange={e => setSleepHour(Number(e.target.value))}
                className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-3 text-sm font-space text-warm-text focus:border-warm-purple/60 focus:outline-none focus:ring-1 focus:ring-warm-purple/30 transition"
              >
                {HOUR_OPTIONS.slice(18).concat(HOUR_OPTIONS.slice(0, 6)).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <p className="text-[11px] text-warm-textHint font-space text-center">
              The timeline always shows the full 24-hour day. Wake/sleep time highlights your active hours.
            </p>

            {/* CTA */}
            <button
              onClick={() => onComplete(wakeHour, sleepHour)}
              className="w-full rounded-xl bg-gradient-to-r from-warm-purple to-warm-teal/80 py-3.5 text-sm font-bold font-quick text-white shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              Begin The Chronicle ⚔️
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
