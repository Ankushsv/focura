"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { IconBrain, IconMap, IconMusic, IconAdjustments, IconVolume } from "@tabler/icons-react";
import { colors, ease } from "@/lib/landing/designSystem";

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  bgGradient: string;
  scrollYProgress: MotionValue<number>;
  index: number;
}

function GalleryCard({ title, description, icon, tag, bgGradient, scrollYProgress, index }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    setIsMobile(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Compute card scale based on center scroll positioning (Index 0 centers at 0, Index 1 at 0.5, Index 2 at 1.0)
  const targetScrollVal = index === 0 ? 0 : index === 1 ? 0.5 : 1.0;
  
  const scale = useTransform(
    scrollYProgress,
    [targetScrollVal - 0.25, targetScrollVal, targetScrollVal + 0.25],
    [0.95, 1.05, 0.95]
  );
  const smoothScale = useSpring(scale, { stiffness: 120, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xVal = (e.clientX - rect.left) / rect.width; // 0 to 1
    const yVal = (e.clientY - rect.top) / rect.height; // 0 to 1
    
    // Slight 3D rotation limits (-8 to +8 deg)
    const rotateY = (xVal - 0.5) * 16;
    const rotateX = (0.5 - yVal) * 16;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        scale: smoothScale,
        transform: isMobile 
          ? undefined 
          : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`,
        transition: "transform 0.15s ease-out",
        boxShadow: "0 30px 60px rgba(0,0,0,0.25)"
      }}
      className={`h-[400px] w-[300px] sm:w-[450px] shrink-0 border border-[rgba(245,239,232,0.06)] rounded-[32px] bg-gradient-to-br ${bgGradient} p-8 flex flex-col justify-between overflow-hidden relative group cursor-grab active:cursor-grabbing select-none`}
    >
      {/* Decorative float particle element */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/[0.02] blur-xl group-hover:scale-125 transition-transform duration-500" />
      
      {/* Dynamic Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-700" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[9px] uppercase tracking-wider text-realm-gold font-bold px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
            {tag}
          </span>
          <div className="text-warm-textMuted group-hover:scale-105 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <h4 className="font-space font-bold text-xl sm:text-2xl text-realm-text tracking-tight mt-6">
          {title}
        </h4>
        <p className="font-quick text-xs text-warm-textMuted leading-relaxed">
          {description}
        </p>
      </div>

      <div className="h-[1px] w-full bg-white/[0.06] my-6" />

      {/* Tactile mockup details inside the panel */}
      {index === 0 && (
        <div className="border border-white/[0.05] bg-black/20 rounded-2xl p-4 space-y-2">
          <div className="flex gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">idea</span>
            <span className="font-mono text-[8px] text-warm-textMuted leading-loose">logged 2 hours ago</span>
          </div>
          <p className="font-quick text-xs text-realm-text italic">
            &ldquo;Combine the astrolabe animations with clean backdrop-blur overlays.&rdquo;
          </p>
        </div>
      )}

      {index === 1 && (
        <div className="border border-white/[0.05] bg-black/20 rounded-2xl p-4 flex gap-4 items-center">
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] text-realm-gold font-bold">NODE</span>
            <span className="font-mono text-xs font-bold text-realm-text">04</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between font-mono text-[8px] text-warm-textMuted">
              <span>FOUNDATIONS</span>
              <span className="text-realm-teal">AVAILABLE</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-realm-teal rounded-full" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      )}

      {index === 2 && (
        <div className="border border-white/[0.05] bg-black/20 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconVolume size={14} className="text-realm-gold" />
            <span className="font-space font-bold text-xs text-realm-text">Gamma Beat</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="h-3 w-1 bg-realm-gold rounded-full" style={{ opacity: 0.15 + i * 0.15 }} />
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}

export default function HorizontalGallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map scroll progress to horizontal translation (from 0px to end of cards width)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66%"]);
  const smoothX = useSpring(x, { stiffness: 100, damping: 20 });

  return (
    <div ref={containerRef} className="relative h-[300vh] z-20">
      
      {/* ── Sticky Frame ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center select-none">
        
        {/* Gallery title header */}
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-warm-amber/60 font-bold block mb-2">
            04 / Auxiliary systems
          </span>
          <h3 className="font-space font-bold text-2xl sm:text-5xl text-[#f5efe8] tracking-tight leading-none">
            Deep focus. Deeper logs.
          </h3>
        </div>

        {/* Scrolling flex row */}
        <div className="relative w-full overflow-visible">
          <motion.div
            style={{ x: smoothX }}
            className="flex gap-8 px-6 sm:px-12 w-fit relative z-10"
          >
            <GalleryCard 
              index={0}
              title="Focus Memory Notebook"
              description="Keep thoughts cataloged. Log ideas, roadblocks, tips, or bookmarks during focus cycles without losing context of your work. Notes are bound to specific tasks for easy retrieval."
              icon={<IconBrain size={24} className="text-realm-purple" />}
              tag="scrapbook logs"
              bgGradient="from-[#1c1a17]/95 via-[#221815]/95 to-[#1c1a17]/95"
              scrollYProgress={scrollYProgress}
            />

            <GalleryCard 
              index={1}
              title="Mastery Skill Paths"
              description="Map long-term master goals as node-based trees. Break coding, learning, or fitness plans into progressive sequences. Node completion awards LP and levels your companion."
              icon={<IconMap size={24} className="text-realm-teal" />}
              tag="progression trees"
              bgGradient="from-[#1c1a17]/95 via-[#15201d]/95 to-[#1c1a17]/95"
              scrollYProgress={scrollYProgress}
            />

            <GalleryCard 
              index={2}
              title="Soundscape customizer"
              description="Tune your acoustic shield. Shift focus frequencies, select noise envelopes, and adjust volume sliders client-side using our zero-resource synthesizer engine."
              icon={<IconMusic size={24} className="text-realm-gold" />}
              tag="acoustic shield"
              bgGradient="from-[#1c1a17]/95 via-[#1f1e16]/95 to-[#1c1a17]/95"
              scrollYProgress={scrollYProgress}
            />
          </motion.div>
        </div>

      </div>

    </div>
  );
}
