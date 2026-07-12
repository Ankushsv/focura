"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { bus } from "@/lib/events";
import { RewardRollResult } from "@/lib/variableReward";
import { fireConfetti } from "@/lib/confetti";

export default function RewardOverlay() {
  const [activeReward, setActiveReward] = useState<(RewardRollResult & { baseXp: number }) | null>(null);
  const [showGoldFlash, setShowGoldFlash] = useState(false);
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    const unsub = bus.on("reward:triggered", (payload) => {
      setActiveReward(payload);

      if (payload.effect === "normal") {
        fireConfetti(90);
      } else if (payload.effect === "enhanced") {
        fireConfetti(130);
        setShowGlow(true);
        setTimeout(() => setShowGlow(false), 1500);
      } else if (payload.effect === "spectacular") {
        setShowGoldFlash(true);
        setTimeout(() => setShowGoldFlash(false), 300);
        
        // Multi-burst confetti for legendary feel
        fireConfetti(150);
        setTimeout(() => fireConfetti(100), 400);
        setTimeout(() => fireConfetti(80), 800);
      }
    });

    return () => unsub();
  }, []);

  return (
    <>
      {/* ── Brief Gold Screen Glow (Enhanced/Spectacular) ── */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-[9990] ring-[30px] ring-realm-gold/45 shadow-[inset_0_0_100px_rgba(232,151,90,0.3)]"
          />
        )}
      </AnimatePresence>

      {/* ── Spectacular Gold Flash ── */}
      <AnimatePresence>
        {showGoldFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-realm-gold pointer-events-none z-[9999]"
          />
        )}
      </AnimatePresence>

      {/* ── Enhanced/Spectacular Reward Overlay Modal ── */}
      <AnimatePresence>
        {activeReward && activeReward.effect !== "normal" && (
          <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="relative max-w-md w-full mx-4 rounded-3xl border border-realm-gold/40 bg-gradient-to-b from-warm-surface to-warm-bg p-8 text-center shadow-[0_24px_50px_-12px_rgba(232,151,90,0.25)] space-y-6 overflow-hidden"
            >
              {/* Subtle ambient rotating ray in background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,151,90,0.06)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="space-y-2 relative z-10">
                {activeReward.tier === "legendary" ? (
                  <motion.h1
                    initial={{ letterSpacing: "-0.05em", opacity: 0 }}
                    animate={{ letterSpacing: "0.15em", opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-serif text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-realm-gold via-amber-300 to-realm-gold tracking-widest uppercase"
                    style={{ fontFamily: "'Cinzel', 'Georgia', serif" }}
                  >
                    Legendary Victory
                  </motion.h1>
                ) : (
                  <h1 className="font-space text-2xl font-bold text-realm-gold uppercase tracking-wider">
                    Bonus Quest Reward!
                  </h1>
                )}
                <p className="text-xs font-quick text-warm-textMuted uppercase tracking-widest">
                  {activeReward.tier} tier roll
                </p>
              </div>

              {/* Familiar animation / Sparkle display */}
              <div className="relative flex justify-center py-6">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-7xl relative select-none"
                >
                  {activeReward.tier === "legendary" ? "🦉✨" : "🦉"}
                  <motion.span
                    animate={{
                      scale: [0.6, 1.2, 0.6],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-3 -right-3 text-2xl"
                  >
                    ✨
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1.2, 0.6, 1.2],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-2 -left-3 text-2xl"
                  >
                    🌟
                  </motion.span>
                </motion.div>
              </div>

              {/* XP Result Text */}
              <div className="space-y-1 relative z-10">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl font-mono font-black text-realm-gold tracking-wide"
                >
                  +{Math.round(activeReward.baseXp * activeReward.multiplier)} XP
                </motion.div>
                <p className="text-sm font-quick text-warm-text">
                  Multiplier: <span className="font-bold font-mono text-realm-gold">{activeReward.multiplier}x</span> (Base: {activeReward.baseXp} XP)
                </p>
                {activeReward.tier === "rare" && (
                  <p className="text-xs font-quick text-amber-400/90 font-medium">
                    ✦ Rare roll drop multiplier applied! ✦
                  </p>
                )}
                {activeReward.tier === "legendary" && (
                  <p className="text-xs font-quick text-yellow-300 font-semibold animate-pulse">
                    ✦ Extraordinary cosmic luck! ✦
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 relative z-10">
                <button
                  onClick={() => setActiveReward(null)}
                  className="w-full rounded-xl bg-realm-gold text-warm-bg py-3.5 text-sm font-bold font-quick hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(232,151,90,0.35)] transition duration-200"
                >
                  Triumph!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
