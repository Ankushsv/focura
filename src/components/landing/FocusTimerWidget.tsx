"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { IconHourglass, IconVolume, IconMusic, IconVolume2, IconVolume3 } from "@tabler/icons-react";
import Magnetic from "./Magnetic";
import Ripple from "./Ripple";
import { ease } from "@/lib/landing/designSystem";

export default function FocusTimerWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [seconds, setSeconds] = useState(1500); // 25:00
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    setIsMobile(media.matches);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 1500));
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xVal = (e.clientX - rect.left) / rect.width;
    const yVal = (e.clientY - rect.top) / rect.height;
    
    // RotateX/Y angles
    const rotateY = (xVal - 0.5) * 16;
    const rotateX = (0.5 - yVal) * 16;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <section ref={containerRef} className="relative py-24 sm:py-32 z-20 overflow-hidden border-t border-white/[0.03] select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
        
        {/* Left: Info */}
        <div className="space-y-6">
          <span className="font-mono text-xs uppercase tracking-widest text-warm-amber/60 font-bold block">
            03 / The Battle Arena
          </span>
          <h2 className="font-space font-bold text-3xl sm:text-5xl text-[#f5efe8] tracking-tight leading-[1.05]">
            Shield thy attention.
          </h2>
          <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
            Focura's Focus Timer is structured to isolate deep work cycles. Start Pomodoros or customized focus slots paired with dynamic acoustic shields.
          </p>
          <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
            Tilt the card on the right to feel the 3D depth of the interface, and click the start button to see the clock count down in real-time.
          </p>
          <div className="h-[2px] w-20 bg-realm-gold/40 rounded-full pt-0.5" />
        </div>

        {/* Right: Interactive 3D Perspective Card */}
        <div className="flex items-center justify-center">
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: isMobile 
                ? undefined 
                : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`,
              transition: "transform 0.15s ease-out",
              boxShadow: "0 30px 60px rgba(0,0,0,0.3)"
            }}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: ease.expo }}
            className="w-full max-w-[420px] aspect-[4/5] border border-[rgba(245,239,232,0.06)] rounded-[32px] bg-[#161412]/80 backdrop-blur-xl p-8 flex flex-col justify-between relative group"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a78bfa]/40 border border-[#a78bfa]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.04]" />
              </div>
              <span className="font-mono text-[8px] uppercase tracking-widest text-warm-textMuted/60">
                focura.battle_timer
              </span>
              <IconHourglass size={12} className="text-warm-textMuted opacity-50" />
            </div>

            {/* Circular Timer Visualizer */}
            <div className="my-8 flex-1 flex flex-col items-center justify-center relative">
              <div className="relative h-44 w-44 flex items-center justify-center">
                
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(245,239,232,0.02)" strokeWidth="4" />
                  <motion.circle 
                    cx="50%" 
                    cy="50%" 
                    r="44%" 
                    fill="none" 
                    stroke="var(--color-warm-amber)" 
                    strokeWidth="6" 
                    strokeDasharray="280"
                    animate={{ strokeDashoffset: (seconds / 1500) * 280 }}
                    transition={{ ease: "linear" }}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 8px rgba(240, 168, 104, 0.45))" }}
                  />
                </svg>

                <div className="text-center space-y-1">
                  <h3 className="font-mono text-3xl font-black text-realm-text tracking-wider leading-none">
                    {formatTime(seconds)}
                  </h3>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-realm-gold font-bold">
                    {running ? "active flow" : "paused"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/[0.04] pt-5 flex justify-between items-center">
              <div className="flex gap-2">
                <button className="h-8 w-8 rounded-lg border border-white/[0.05] bg-white/[0.02] flex items-center justify-center text-warm-textMuted hover:border-realm-gold/40 hover:text-[#f5efe8] transition">
                  <IconVolume size={14} className="opacity-75" />
                </button>
                <button className="h-8 w-8 rounded-lg border border-white/[0.05] bg-white/[0.02] flex items-center justify-center text-warm-textMuted hover:border-realm-gold/40 hover:text-[#f5efe8] transition">
                  <IconMusic size={14} className="opacity-75" />
                </button>
              </div>

              <Magnetic>
                <button
                  onClick={() => setRunning(!running)}
                  className="relative font-space font-bold text-[10px] uppercase tracking-widest text-[#0c0c0e] bg-realm-gold px-6 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(240,168,104,0.35)] transition-all duration-300 flex items-center justify-center"
                >
                  <Ripple color="rgba(12,12,14,0.12)" />
                  <span className="relative z-10">{running ? "Pause" : "Start"}</span>
                </button>
              </Magnetic>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
