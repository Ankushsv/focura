"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import Magnetic from "./Magnetic";
import Ripple from "./Ripple";
import { ease, duration } from "@/lib/landing/designSystem";

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    setIsMobile(media.matches);
  }, []);

  const headline = "Focus is not a talent. It is a system.";
  const words = headline.split(" ");

  // Staggered variants for words
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 12, 
      filter: "blur(6px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: ease.expo }
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 z-20 pt-28 overflow-hidden select-none">
      
      {/* ── Background Wireframe Grid (Slow Fade In) ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.035 }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,239,232,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,239,232,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"
      />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 sm:gap-16 items-center relative z-10">
        
        {/* Left Side: Copy */}
        <div className="space-y-6 sm:space-y-8 text-left">
          
          {/* Label banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: ease.expo }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-realm-gold/25 bg-realm-gold/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-realm-gold font-space">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-realm-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-realm-gold"></span>
              </span>
              ADHD-FIRST PRODUCTIVITY SYSTEM
            </span>
          </motion.div>

          {/* Word-by-word Headline Reveal */}
          <motion.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-space font-bold text-[clamp(2.5rem,7.5vw,5.5rem)] leading-[0.93] tracking-[-0.04em] text-[#f5efe8]"
          >
            {words.map((word, i) => (
              <motion.span 
                key={i} 
                variants={wordVariants}
                className={`inline-block mr-[0.22em] ${word === "talent." || word === "system." ? "italic font-serif font-normal text-realm-gold" : ""}`}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subparagraph fade in */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: ease.expo }}
            className="font-quick text-sm sm:text-base text-warm-textMuted max-w-xl leading-relaxed"
          >
            Thy focus is not broken. It simply rejects noisy, demanding dashboards. Focura structures consistency through energy-based planning, safety shields, and zero-shame RPG feedback loops.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: ease.expo }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <Magnetic>
              <Link
                href="/login"
                className="group relative font-space font-bold text-xs uppercase tracking-widest text-[#0c0c0e] bg-realm-gold px-8 py-4.5 rounded-full hover:shadow-[0_0_30px_rgba(240,168,104,0.35)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Ripple color="rgba(12,12,14,0.12)" />
                <span className="relative z-10">Get Started</span>
                <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href="#pillars"
                className="group relative font-space font-bold text-xs uppercase tracking-widest text-warm-textMuted hover:text-realm-text border border-white/10 hover:border-realm-gold/30 px-8 py-4.5 rounded-full transition-all duration-300 flex items-center justify-center"
              >
                <Ripple />
                <span className="relative z-10">See Pillars</span>
              </a>
            </Magnetic>
          </motion.div>

        </div>

        {/* Right Side: Product Mockup Screen zoom & blur reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.25, ease: ease.expo }}
          className="relative border border-[rgba(245,239,232,0.06)] rounded-[24px] bg-[#161412]/50 p-4 aspect-[4/3] flex flex-col justify-between shadow-2xl overflow-hidden group select-none"
        >
          {/* Mock Browser details */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500/30" />
              <span className="h-2 w-2 rounded-full bg-yellow-500/30" />
              <span className="h-2 w-2 rounded-full bg-green-500/30" />
            </div>
            <span className="font-mono text-[8px] uppercase tracking-widest text-warm-textMuted/45">
              focura.realm // main_view
            </span>
            <div className="h-2 w-2 rounded bg-white/5" />
          </div>

          {/* Center Graphic: Warm minimal HUD layout representing Focura */}
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-mono text-[9px] text-realm-teal uppercase font-bold tracking-wider">
                  🐣 Companion Hatchling
                </span>
                <h4 className="font-space font-bold text-lg text-realm-text mt-1">Level 4 Chick</h4>
              </div>
              <span className="font-mono text-xs text-realm-teal font-bold">XP 1,200</span>
            </div>

            {/* Exp gauge mock */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-realm-teal" style={{ width: "68%" }} />
            </div>

            {/* Mock Task Card */}
            <div className="border border-white/[0.05] bg-black/25 rounded-2xl p-4 flex justify-between items-center mt-2">
              <div className="flex items-center gap-3">
                <span className="h-4.5 w-4.5 rounded-full border border-realm-gold/30 flex items-center justify-center text-[10px] text-realm-gold font-bold">
                  ⚔️
                </span>
                <div>
                  <h5 className="font-space font-bold text-xs text-realm-text leading-none">Complete Viking astrolabe UI</h5>
                  <span className="font-mono text-[8px] text-warm-textMuted mt-0.5 block">25 min remaining</span>
                </div>
              </div>
              <span className="font-mono text-[9px] text-realm-gold">+50 LP</span>
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-3 mt-3 flex justify-between items-center text-[9px] font-mono text-warm-textMuted">
            <span>🛡️ STREAK SHIELDS: 3/3</span>
            <span className="text-realm-gold">RUNNING PERIOD ▶</span>
          </div>

        </motion.div>

      </div>

      {/* ── Bouncing Scroll indicator ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0] }}
        transition={{ repeat: Infinity, duration: 2, delay: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 font-mono text-[8px] uppercase tracking-widest text-warm-textMuted z-10 pointer-events-none"
      >
        <span>scroll down</span>
        <motion.span 
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-xs"
        >
          ↓
        </motion.span>
      </motion.div>

    </section>
  );
}
