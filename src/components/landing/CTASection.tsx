"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Magnetic from "./Magnetic";
import Ripple from "./Ripple";
import { ease } from "@/lib/landing/designSystem";

export default function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [email, setEmail] = useState("");

  // Canvas particle drift animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Array<{ x: number; y: number; vy: number; vx: number; size: number; alpha: number }> = [];

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 450;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 40;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: - (Math.random() * 0.2 + 0.05), // float upward
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.25 + 0.15,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Screen wraps
        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0 || p.x > canvas.width) p.x = Math.random() * canvas.width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 239, 232, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative py-32 sm:py-40 z-20 text-center overflow-hidden border-t border-white/[0.03]">
      
      {/* ── Floating upward particles canvas ── */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-40" />

      {/* ── Large Backdrop Calm Glow ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-realm-gold/5 rounded-full filter blur-[150px] pointer-events-none z-0" />

      <div className="max-w-3xl mx-auto px-6 space-y-8 relative z-10 select-none">
        
        {/* Scale-in Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="w-16 h-16 mx-auto rounded-[18px] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shadow-lg"
        >
          <span className="text-2xl animate-pulse">⚔️</span>
        </motion.div>
        
        {/* Title reveal */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: ease.expo }}
          className="font-space font-bold text-3xl sm:text-5xl text-[#f5efe8] tracking-tight leading-[0.98]"
        >
          Swear Thy Consistency Oath.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 0.7, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: ease.expo }}
          className="font-quick text-sm sm:text-base text-warm-textMuted max-w-md mx-auto leading-relaxed"
        >
          Construct habits aligned with your focus energy. Step into Focura's zero-shame workstation today.
        </motion.p>
        
        {/* Slide-up Form inputs & Magnetic CTA action */}
        <motion.form 
          onSubmit={(e) => e.preventDefault()}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: ease.expo }}
          className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-6"
        >
          <input 
            type="email" 
            placeholder="Enter thy email..." 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 rounded-full border border-white/[0.08] bg-[#161412]/80 backdrop-blur-sm px-6 py-4.5 text-xs text-realm-text placeholder-warm-textMuted/40 focus:outline-none focus:border-realm-gold/40 focus:ring-1 focus:ring-realm-gold/30 transition-all font-space"
          />
          <Magnetic>
            <button
              type="submit"
              className="relative font-space font-bold text-xs uppercase tracking-widest text-[#0c0c0e] bg-realm-gold px-8 py-4.5 rounded-full hover:shadow-[0_0_30px_rgba(240,168,104,0.35)] transition-all duration-300 flex items-center justify-center shrink-0"
            >
              <Ripple color="rgba(12,12,14,0.12)" />
              <span className="relative z-10">Enter Realm</span>
            </button>
          </Magnetic>
        </motion.form>

      </div>
    </section>
  );
}
