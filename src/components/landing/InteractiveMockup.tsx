"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconFlame, 
  IconShield, 
  IconHourglass, 
  IconVolume, 
  IconTrendingUp, 
  IconBrain,
  IconClock,
  IconHistory,
  IconChevronRight,
  IconCircleCheck
} from "@tabler/icons-react";
import { colors, radii, ease } from "@/lib/landing/designSystem";

interface InteractiveMockupProps {
  activeStep: number;
}

export default function InteractiveMockup({ activeStep }: InteractiveMockupProps) {
  // Inner state overrides for active timer countdown
  const [timerSeconds, setTimerSeconds] = useState(1499); // 24:59
  const [xp, setXp] = useState(2450);
  const [hp, setHp] = useState(300);

  // Timer Tick
  useEffect(() => {
    if (activeStep !== 1) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 1500));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeStep]);

  // HP and XP animations synchronized for Boss Tasks step
  useEffect(() => {
    if (activeStep === 0) {
      const timer = setTimeout(() => {
        setHp(120);
        setXp(2500);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // Reset when not on Boss Tasks step
      setHp(300);
      setXp(2450);
    }
  }, [activeStep]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full h-full border border-[rgba(245,239,232,0.06)] rounded-[24px] bg-[#161412]/90 backdrop-blur-xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
      
      {/* ── Visual Glass Shine overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent pointer-events-none rounded-[24px] z-20" />

      {/* ── Mockup Browser Window Header ── */}
      <div className="flex items-center justify-between border-b border-[rgba(245,239,232,0.06)] pb-4 mb-4 select-none">
        <div className="flex gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/40 border border-[#f87171]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fcd34d]/40 border border-[#fcd34d]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]/40 border border-[#4ade80]/60" />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-warm-textMuted/60 truncate max-w-[180px] sm:max-w-xs">
          {activeStep === 0 && "focura.realm // the_quest_scroll"}
          {activeStep === 1 && "focura.realm // the_battle_arena"}
          {activeStep === 2 && "focura.realm // today_map"}
          {activeStep === 3 && "focura.realm // the_sage_counsel"}
          {activeStep === 4 && "focura.realm // chronicle_stats"}
        </span>
        <div className="h-2 w-2 rounded bg-warm-amber/20" />
      </div>

      {/* ── Morphed View Container ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="boss-tasks"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: ease.expo }}
              className="space-y-4 sm:space-y-6 w-full"
            >
              {/* Boss Dragon Banner */}
              <div className="relative overflow-hidden border border-red-950/20 bg-gradient-to-r from-red-950/20 to-orange-950/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-priority-critical font-bold uppercase tracking-wider">
                    🐉 Legendary Boss Fight
                  </span>
                  <h4 className="font-space font-bold text-sm sm:text-base text-realm-text">
                    The Procrastination Dragon
                  </h4>
                  <p className="font-quick text-[10px] text-warm-textMuted">
                    Swear Consistency Oath & Completing Quests inflicts damage
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-priority-critical font-bold shrink-0">
                  HP {hp}/300
                </div>
              </div>

              {/* Boss HP Bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full rounded-full bg-realm-bg border border-[rgba(245,239,232,0.04)] overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(hp / 300) * 100}%` }}
                    transition={{ duration: 1, ease: ease.expo }}
                    className="h-full rounded-full bg-gradient-to-r from-priority-critical to-warm-amber"
                  />
                </div>
              </div>

              {/* Tasks Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[9px] text-warm-textMuted">
                  <span>ACTIVE QUESTS</span>
                  <span>XP: {xp}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border border-[rgba(245,239,232,0.06)] bg-[#1c1a17] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <motion.span 
                        animate={{ scale: hp === 120 ? [1, 1.3, 1] : 1 }}
                        transition={{ delay: 1 }}
                        className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] ${
                          hp === 120 
                            ? "bg-realm-gold/15 border-realm-gold text-realm-gold" 
                            : "border-warm-textMuted/30"
                        }`}
                      >
                        {hp === 120 ? "✓" : "⚔️"}
                      </motion.span>
                      <span className={`font-quick text-xs font-bold leading-none ${hp === 120 ? "line-through opacity-40 text-warm-textMuted" : "text-realm-text"}`}>
                        Forge Core Design System
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-realm-gold">+50 LP</span>
                  </div>

                  <div className="flex items-center justify-between border border-[rgba(245,239,232,0.04)] bg-[#1c1a17]/50 rounded-xl px-4 py-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <span className="h-4.5 w-4.5 rounded-full flex items-center justify-center border border-warm-textMuted/30 text-[9px]">
                        ⚔️
                      </span>
                      <span className="font-quick text-xs font-bold leading-none text-realm-text">
                        Write Scroll Chronology
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-realm-gold">+25 LP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="focus-timer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: ease.expo }}
              className="flex flex-col items-center justify-center py-4 w-full"
            >
              {/* Circular Countdown visualizer */}
              <div className="relative h-40 w-40 sm:h-48 sm:w-48 flex items-center justify-center">
                
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r="44%" 
                    fill="none" 
                    stroke="rgba(245,239,232,0.02)" 
                    strokeWidth="4" 
                  />
                  <motion.circle 
                    cx="50%" 
                    cy="50%" 
                    r="44%" 
                    fill="none" 
                    stroke="var(--color-warm-amber)" 
                    strokeWidth="6" 
                    strokeDasharray="280"
                    animate={{ strokeDashoffset: (timerSeconds / 1500) * 280 }}
                    transition={{ ease: "linear" }}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 8px rgba(240, 168, 104, 0.45))" }}
                  />
                </svg>

                {/* Inner Text Timer */}
                <div className="text-center space-y-1">
                  <h3 className="font-mono text-3xl sm:text-4xl font-black text-realm-text tracking-wider leading-none">
                    {formatTime(timerSeconds)}
                  </h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-realm-gold font-bold animate-pulse">
                    focus period
                  </p>
                </div>
              </div>

              {/* Soundscape frequency equalizers */}
              <div className="mt-6 flex items-center gap-1.5 justify-center h-8">
                <IconVolume size={14} className="text-warm-textMuted opacity-60 mr-1" />
                {[...Array(9)].map((_, i) => (
                  <motion.span 
                    key={i} 
                    animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: "easeInOut" }}
                    className="w-1 rounded-full bg-realm-gold/40"
                    style={{ height: 4 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="day-timeline"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: ease.expo }}
              className="space-y-3 w-full py-2"
            >
              <div className="flex justify-between items-center font-mono text-[9px] text-warm-textMuted border-b border-[rgba(245,239,232,0.06)] pb-2 mb-2">
                <span>TODAY'S MAP</span>
                <span>WAKE HOUR: 07:00</span>
              </div>

              {/* Hourly block grid */}
              <div className="space-y-2 relative">
                
                {/* Current hour glowing indicator line */}
                <motion.div 
                  animate={{ y: [0, 44, 88, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-[2px] bg-realm-gold z-10 shadow-[0_0_8px_#f0a868]"
                  style={{ top: "28px" }}
                />

                {/* Slot 1: Focus block */}
                <div className="border border-[rgba(245,239,232,0.08)] bg-realm-gold/5 rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">⚔️</span>
                    <div>
                      <h5 className="font-space font-bold text-xs text-realm-text leading-none">Code Base Mapping</h5>
                      <span className="font-mono text-[9px] text-warm-textMuted mt-0.5 block">09:00 - 10:30 (90 min)</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-realm-gold/15 px-2 py-0.5 font-mono text-[8px] text-realm-gold border border-realm-gold/10 uppercase tracking-wide">
                    completed
                  </span>
                </div>

                {/* Slot 2: Life/Break Block */}
                <div className="border border-[rgba(245,239,232,0.04)] bg-[#1a1c1d] rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">🧘</span>
                    <div>
                      <h5 className="font-space font-bold text-xs text-realm-text leading-none">Mindful respite</h5>
                      <span className="font-mono text-[9px] text-warm-textMuted mt-0.5 block">10:30 - 11:00 (30 min)</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-realm-teal/15 px-2 py-0.5 font-mono text-[8px] text-realm-teal border border-realm-teal/10 uppercase tracking-wide">
                    active
                  </span>
                </div>

                {/* Slot 3: Future block */}
                <div className="border border-dashed border-[rgba(245,239,232,0.05)] bg-[#161412]/30 rounded-xl p-3 flex justify-between items-center opacity-40">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">🗺️</span>
                    <div>
                      <h5 className="font-space font-bold text-xs text-realm-text leading-none">Write chronicle summary</h5>
                      <span className="font-mono text-[9px] text-warm-textMuted mt-0.5 block">11:00 - 12:00 (60 min)</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] text-warm-textMuted">planned</span>
                </div>

              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              key="ai-coach"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: ease.expo }}
              className="space-y-4 w-full py-2"
            >
              {/* Chat bubbles list */}
              <div className="space-y-3 flex flex-col">
                
                {/* User Message */}
                <div className="self-end max-w-[80%] bg-[rgba(245,239,232,0.04)] border border-[rgba(245,239,232,0.06)] rounded-2xl rounded-tr-none px-4 py-3">
                  <p className="font-quick text-xs text-realm-text leading-relaxed">
                    I am feeling frozen on building the landing page design.
                  </p>
                </div>

                {/* Sage Reply */}
                <div className="self-start max-w-[85%] bg-realm-gold/5 border border-realm-gold/15 rounded-2xl rounded-tl-none px-4 py-3 relative">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs">🔮</span>
                    <span className="font-mono text-[9px] text-realm-gold uppercase font-black tracking-wider">
                      The Sage
                    </span>
                  </div>
                  
                  {/* Dynamic Typing Counsel Text */}
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="font-quick text-xs text-realm-text leading-relaxed"
                  >
                    Thy Scroll is heavy, traveler. Let us break it down. We shall sketch just one wireframe block. I recommend a 5-minute respite.
                  </motion.p>
                </div>

                {/* Sage typing dot indicators mock */}
                <div className="self-start flex gap-1 bg-[#1a1613] border border-[rgba(245,239,232,0.04)] rounded-full px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-realm-gold animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-realm-gold animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-realm-gold animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>

              </div>
            </motion.div>
          )}

          {activeStep === 4 && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: ease.expo }}
              className="space-y-4 w-full"
            >
              {/* 2-Column top metrics */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Completion rate ring */}
                <div className="border border-[rgba(245,239,232,0.05)] bg-[#1c1a17]/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-[9px] text-warm-textMuted uppercase mb-2">Completion Rate</span>
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(245,239,232,0.01)" strokeWidth="4" />
                      <motion.circle 
                        cx="50%" 
                        cy="50%" 
                        r="40%" 
                        fill="none" 
                        stroke="var(--color-warm-teal)" 
                        strokeWidth="4" 
                        strokeDasharray="100"
                        animate={{ strokeDashoffset: 16 }} // 84%
                        transition={{ duration: 1.5, ease: ease.expo }}
                      />
                    </svg>
                    <span className="font-space font-bold text-xs">84%</span>
                  </div>
                </div>

                {/* Focus history logs bar */}
                <div className="border border-[rgba(245,239,232,0.05)] bg-[#1c1a17]/50 rounded-2xl p-4 flex flex-col justify-between h-full">
                  <span className="font-mono text-[9px] text-warm-textMuted uppercase">Weekly Focus</span>
                  <div className="flex items-end gap-1.5 h-12 justify-between">
                    {[12, 28, 45, 18, 32, 60, 48].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ duration: 1 + idx * 0.1, ease: ease.expo }}
                          className={`w-full rounded-t-sm ${idx === 5 ? "bg-realm-gold" : "bg-realm-purple/50"}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Anticipation vs Reality curve calibration */}
              <div className="border border-[rgba(245,239,232,0.06)] bg-[#1c1a17] rounded-2xl p-4 space-y-3">
                <span className="font-mono text-[9px] text-realm-purple uppercase tracking-wider font-bold block flex items-center gap-1">
                  <IconBrain size={12} /> Calibration insight
                </span>
                <p className="font-quick text-[11px] text-warm-textMuted leading-relaxed">
                  🎯 The tasks in your mind seemed larger than they actually were! Work is easier than expected (Reality score 4.2 / Anticipation 6.8).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dashboard Footer Mock ── */}
      <div className="border-t border-[rgba(245,239,232,0.06)] pt-4 mt-4 flex justify-between items-center select-none shrink-0">
        <div className="flex gap-2">
          <span className="h-6 w-6 rounded border border-[rgba(245,239,232,0.08)] bg-realm-bg/40 flex items-center justify-center text-[10px] text-realm-gold font-bold">
            LP
          </span>
          <span className="h-6 w-6 rounded border border-[rgba(245,239,232,0.08)] bg-realm-bg/40 flex items-center justify-center text-[10px] text-realm-teal font-bold">
            O
          </span>
        </div>
        <span className="font-space text-[10px] font-bold text-realm-gold animate-pulse">
          {activeStep === 0 && "⚡ LEVEL UP PENDING"}
          {activeStep === 1 && "⏱️ FOCUS ACTIVE"}
          {activeStep === 2 && "📅 2 BLOCKS COMPLETED"}
          {activeStep === 3 && "🤖 SAGE ADVICE ONLINE"}
          {activeStep === 4 && "📊 4.5 HOURS TRACKED"}
        </span>
      </div>

    </div>
  );
}
