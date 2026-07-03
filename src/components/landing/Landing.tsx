"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from "framer-motion";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [activeVignette, setActiveVignette] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  // Section 3: Sticky Scroll feature container pinning (5 features require 500vh height)
  const section3Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollYSection3 } = useScroll({
    target: section3Ref,
    offset: ["start start", "end end"]
  });

  // Calculate active feature index based on scroll progress of Section 3
  useMotionValueEvent(scrollYSection3, "change", (latest) => {
    // 0 to 1 progress split into five steps:
    // Step 0: [0, 0.2)
    // Step 1: [0.2, 0.4)
    // Step 2: [0.4, 0.6)
    // Step 3: [0.6, 0.8)
    // Step 4: [0.8, 1.0]
    if (latest < 0.2) {
      setActiveFeature(0);
    } else if (latest >= 0.2 && latest < 0.4) {
      setActiveFeature(1);
    } else if (latest >= 0.4 && latest < 0.6) {
      setActiveFeature(2);
    } else if (latest >= 0.6 && latest < 0.8) {
      setActiveFeature(3);
    } else {
      setActiveFeature(4);
    }
  });

  // Animate the vertical translation and rotation of the HUD card on scroll
  const yHUD = useTransform(scrollYSection3, [0, 1], [100, -100]);
  const rotateHUD = useTransform(scrollYSection3, [0, 1], [-5, 5]);
  const smoothYHUD = useSpring(yHUD, { stiffness: 100, damping: 25, restDelta: 0.001 });
  const smoothRotateHUD = useSpring(rotateHUD, { stiffness: 100, damping: 25, restDelta: 0.001 });

  // Section 4B: Sanctuary Quote Panel scroll effects
  const sectionQuoteRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scrollYQuote } = useScroll({
    target: sectionQuoteRef,
    offset: ["start end", "end start"]
  });

  const yQuote = useTransform(scrollYQuote, [0, 1], [60, -60]);
  const smoothYQuote = useSpring(yQuote, { stiffness: 100, damping: 25, restDelta: 0.001 });

  // Stagger animation presets
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  // ADHD cycle data
  const vignettes = [
    {
      title: "The Paralysis of starting",
      subtitle: "EXHIBIT I // EXECUTIVE DYSFUNCTION",
      description: "When tasks carry identical weight, your cognitive board freezes. The brain sees a simple todo list and initiates a defense mechanism—resulting in endless stalling and guilt.",
      imgUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "The Illusion of 'Later'",
      subtitle: "EXHIBIT II // TIME BLINDNESS",
      description: "Time is experienced as either 'Now' or 'Not Now.' Standard calendar blocks assume chronological logic. For you, hours are either invisible or feel like an eternity, causing deadlines to crash in.",
      imgUrl: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "The Pain of Boredom",
      subtitle: "EXHIBIT III // DOPAMINE DYSREGULATION",
      description: "Without immediate novelty or gamified stakes, attention falls off a cliff. A standard task checklist has zero cognitive voltage, causing a physical sensation of fatigue when forcing focus.",
      imgUrl: "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&q=80&w=600",
    },
  ];

  // Features description array for Sticky Scroll
  const features = [
    {
      title: "The Scroll",
      subtitle: "EXHIBIT III // ACTIVE QUESTS",
      description: "ADHD task paralysis solver. Select a single quest, and Focura cloaks the rest of the workspace. Hiding all secondary tasks and sidebars prevents visual overwhelm and freezes.",
    },
    {
      title: "The Battle",
      subtitle: "EXHIBIT IV // FOCUS TIMER",
      description: "A cinematic countdown timer paired with immersive medieval soundscapes. Restricts browser focus, blocking distractions while providing a rhythmic, dopamine-friendly focus cadence.",
    },
    {
      title: "The Great Quests",
      subtitle: "EXHIBIT V // MASTERY PATHS",
      description: "Long-term professional or habit goals are mapped out as visual node paths. Watch your milestones progress step-by-step, satisfying the ADHD brain's hunger for visual progression.",
    },
    {
      title: "The Knight's Oath",
      subtitle: "EXHIBIT VI // CONSISTENCY SHIELDS",
      description: "Swear Habit Oaths instead of tracking rigid streaks. Buy Streak Shields using your quest XP. If burnout or bad days strike, shields absorb the loss, preventing reset shame.",
    },
    {
      title: "The Familiar",
      subtitle: "EXHIBIT VII // SPIRIT COMPANION",
      description: "Dopamine-driven progression. Choose a spirit companion that levels up and feeds on your focus sessions. Squire Familiars comment on your focus stats with zero shame.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-structured-putty text-structured-ink font-helvetica-now selection:bg-structured-ink/10 select-none overflow-x-clip">
      
      {/* ── Minimal Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-6 bg-structured-putty/80 backdrop-blur-md border-b border-structured-vellum">
        {/* Circled Monogram Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full border border-structured-ink flex items-center justify-center font-davinci font-bold text-lg leading-none transition-transform group-hover:rotate-12 duration-300">
            F
          </div>
          <span className="font-helvetica-now font-bold text-xs uppercase tracking-widest">
            Focura
          </span>
        </Link>

        {/* Ghost text link */}
        <Link 
          href="/login" 
          className="font-helvetica-now font-bold text-[10px] uppercase tracking-widest text-structured-ink hover:underline transition-all"
        >
          Swear the Oath
        </Link>
      </header>

      {/* ── Section 1: Hero (Putty Canvas) ── */}
      <section className="relative min-h-screen flex flex-col justify-between pt-32 pb-16 px-6 lg:px-12 z-10 bg-structured-putty">
        
        {/* Floating background grids for museum-wall style */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-0" />

        {/* Center Cluster */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] font-bold uppercase tracking-widest text-structured-ink/60 border border-structured-ink/20 rounded-full px-3 py-1 bg-structured-bone"
          >
            ADHD-FIRST COGNITION SYSTEM
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-davinci text-4xl sm:text-6xl lg:text-[72px] font-medium leading-[1.05] tracking-[-0.03em] text-structured-ink"
          >
            The storm is not your enemy.<br/>
            It is your <span className="italic font-light">raw material</span>.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-helvetica-now text-sm sm:text-base text-structured-graphite max-w-md leading-relaxed"
          >
            Thy focus is not broken. It simply rejects boring dashboards. Focura structures consistency through energy-based quests, safety shields, and zero-shame RPG loops.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="pt-2"
          >
            <Link
              href="/login"
              className="inline-block bg-structured-ink text-structured-paper font-helvetica-now font-bold text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-structured-graphite transition-all hover:scale-[1.02] duration-300"
            >
              Enter the Realm
            </Link>
          </motion.div>
        </div>

        {/* Monumental Hero Wordmark: Discipline */}
        <div className="w-full text-center overflow-hidden relative z-10 pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="select-none pointer-events-none"
          >
            <h1 className="font-davinci font-bold text-[12vw] lg:text-[374px] text-structured-ink tracking-[-0.09em] leading-[0.84] w-full text-center">
              Discipline
            </h1>
          </motion.div>
        </div>

      </section>

      {/* ── Section 2: The Struggle (Ink Room - Dark section) ── */}
      <section className="relative py-32 bg-structured-ink text-structured-paper overflow-hidden z-10">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          
          {/* Section labels */}
          <div className="w-full flex justify-between items-center border-b border-structured-paper/10 pb-6 mb-16">
            <span className="font-helvetica-now text-[10px] font-bold uppercase tracking-widest text-structured-paper/40">
              SECTION I // THE PARADOX
            </span>
            <span className="font-davinci text-lg text-structured-paper/40 italic">
              The ADHD Trap
            </span>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
            
            {/* Story copy */}
            <div className="space-y-6">
              <h2 className="font-davinci text-5xl lg:text-[72px] font-medium leading-[0.9] tracking-[-0.03em] text-structured-paper">
                The fog of execution.
              </h2>
              <p className="font-helvetica-now text-sm lg:text-base text-structured-paper/70 leading-relaxed max-w-md">
                For the ADHD mind, the world does not unfold in neat increments. Tasks do not stand in an orderly line; they crash like waves.
              </p>
              <p className="font-helvetica-now text-sm lg:text-base text-structured-paper/70 leading-relaxed max-w-md">
                The traditional calendar—with its rigid grids and accusing alarms—is not a helper. It is a monument to shame. Every unchecked box is a tiny defeat, leading straight to paralysis.
              </p>
              <div className="pt-8">
                <span className="font-mono text-[9px] uppercase tracking-widest text-structured-paper/40 block mb-2">
                  CLICK AN EXHIBIT TO EXAMINE THE CYCLE
                </span>
                <div className="flex gap-2">
                  {vignettes.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVignette(idx)}
                      className={`w-10 h-10 border rounded-full font-helvetica-now font-bold text-xs flex items-center justify-center transition-all ${
                        activeVignette === idx
                          ? "bg-structured-paper text-structured-ink border-structured-paper"
                          : "bg-transparent text-structured-paper/60 border-structured-paper/20 hover:border-structured-paper/50"
                      }`}
                    >
                      0{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Circular Vignette Showcase */}
            <div className="flex flex-col items-center justify-center p-8 bg-structured-paper/[0.02] border border-structured-paper/10 rounded-[9px] min-h-[480px] w-full max-w-xl mx-auto">
              <motion.div
                key={activeVignette}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center space-y-6 flex flex-col items-center"
              >
                {/* Vintage Exhibition label metadata */}
                <span className="font-helvetica-now text-[9px] uppercase tracking-widest text-structured-paper/40">
                  {vignettes[activeVignette].subtitle}
                </span>

                {/* Circular image vignette */}
                <div className="w-[200px] h-[200px] rounded-full overflow-hidden border border-structured-paper/20 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vignettes[activeVignette].imgUrl}
                    alt={vignettes[activeVignette].title}
                    className="w-full h-full object-cover grayscale contrast-[1.1] transition-transform duration-[4s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-structured-ink/10 mix-blend-overlay" />
                </div>

                {/* Caption above hexagonal nav */}
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-davinci text-2xl lg:text-3xl text-structured-paper tracking-tight leading-none">
                    {vignettes[activeVignette].title}
                  </h3>
                  <p className="font-helvetica-now text-xs text-structured-paper/60 leading-relaxed">
                    {vignettes[activeVignette].description}
                  </p>
                </div>

                {/* Hexagonal indicator */}
                <div className="flex items-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className={`w-3.5 h-3.5 transition-all ${
                        activeVignette === i
                          ? "stroke-structured-paper fill-structured-paper"
                          : "stroke-structured-paper/30 fill-transparent hover:stroke-structured-paper/60"
                      } stroke-1.5`}
                      onClick={() => setActiveVignette(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <polygon points="12,2 20,6.6 20,15.4 12,20 4,15.4 4,6.6" />
                    </svg>
                  ))}
                </div>

              </motion.div>
            </div>

          </div>

        </div>

      </section>

      {/* ── Section 3: Atmospheric Canvas (Full-bleed Painting with Product Card Sticky Scroll) ── */}
      <section ref={section3Ref} className="relative h-[500vh] bg-structured-ink z-10">
        
        {/* Sticky Wrapper (Fixes viewport on scroll) */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
          
          {/* Full-bleed Renaissance Landscape Painting */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=1600"
              alt="Renaissance art backdrop"
              className="w-full h-full object-cover filter grayscale-[40%] contrast-[1.05] brightness-[0.5]"
            />
            {/* Subtle warm tint overlay */}
            <div className="absolute inset-0 bg-[#3a3528]/15 mix-blend-color-burn" />
            <div className="absolute inset-0 bg-gradient-to-b from-structured-ink via-transparent to-structured-ink" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            {/* Left side: Feature Storytelling Labels (Fade based on activeFeature index) */}
            <div className="relative h-[300px] flex items-center">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={activeFeature === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute inset-x-0 space-y-4 text-left ${activeFeature === idx ? "pointer-events-auto" : "pointer-events-none"}`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest text-structured-paper/40">
                    {feature.subtitle}
                  </span>
                  <h3 className="font-davinci text-4xl lg:text-5xl font-light text-structured-paper leading-tight tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="font-helvetica-now text-sm text-structured-paper/60 leading-relaxed max-w-md">
                    {feature.description}
                  </p>
                  
                  {/* Hexagonal dots to show pagination */}
                  <div className="flex gap-2 pt-2">
                    {features.map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        className={`w-3.5 h-3.5 transition-all ${activeFeature === i ? "stroke-structured-paper fill-structured-paper" : "stroke-structured-paper/30 fill-transparent"} stroke-1.5`}
                      >
                        <polygon points="12,2 20,6.6 20,15.4 12,20 4,15.4 4,6.6" />
                      </svg>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right side: The Notched Product Card HUD */}
            <div className="flex justify-center">
              <motion.div
                style={{
                  y: smoothYHUD,
                  rotate: smoothRotateHUD,
                  clipPath: "polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)",
                }}
                className="w-full max-w-sm aspect-square bg-structured-ink text-structured-paper p-8 flex flex-col justify-between shadow-2xl border border-structured-paper/10 transition-all duration-500 hover:border-structured-paper/30"
              >
                
                {/* ── Feature 0: The Scroll / Active Quests HUD ── */}
                {activeFeature === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between border-b border-structured-paper/10 pb-4">
                      <div className="w-5 h-5 rounded-full border border-structured-paper flex items-center justify-center font-davinci font-bold text-[10px]">F</div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">focura.realm // active_quest</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4 my-4">
                      <div>
                        <span className="font-mono text-[9px] text-structured-paper/50 uppercase tracking-widest block mb-1">⚔️ ACTIVE QUEST OBJECTIVE</span>
                        <h4 className="font-davinci text-2xl font-light text-structured-paper leading-tight">Conquer the Astrolabe UI</h4>
                      </div>
                      <div className="border border-structured-paper/10 bg-structured-paper/[0.02] p-4 rounded-[9px]">
                        <span className="font-mono text-[8px] text-structured-paper/40 block mb-1">COGNITIVE REQUIREMENTS</span>
                        <div className="flex justify-between font-helvetica-now text-xs">
                          <span>FOCUS ENERGY:</span>
                          <span className="font-bold text-structured-paper">40% (Medium)</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-structured-paper/10 pt-4 flex justify-between items-center font-mono text-[9px] text-structured-paper/40">
                      <span>WORKSTATION: CLOAKED</span>
                      <span>REWARDS: +150 XP</span>
                    </div>
                  </motion.div>
                )}

                {/* ── Feature 1: The Battle / Focus Timer HUD ── */}
                {activeFeature === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between border-b border-structured-paper/10 pb-4">
                      <div className="w-5 h-5 rounded-full border border-structured-paper flex items-center justify-center font-davinci font-bold text-[10px]">F</div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">focura.realm // battle_timer</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center text-center space-y-4 my-4">
                      <h4 className="font-davinci text-6xl font-bold tracking-widest text-structured-paper">25:00</h4>
                      <span className="font-mono text-[9px] text-structured-paper/50 uppercase tracking-widest animate-pulse">⚔️ Battle phase active</span>
                      <div className="flex justify-center gap-4 pt-2">
                        <button className="border border-structured-paper/20 hover:border-structured-paper/60 px-4 py-1.5 text-[9px] font-mono rounded-full tracking-wider transition-colors">PAUSE BATTLE</button>
                        <button className="border border-structured-paper/20 hover:border-structured-paper/60 px-4 py-1.5 text-[9px] font-mono rounded-full tracking-wider transition-colors text-red-400">RETREAT</button>
                      </div>
                    </div>

                    <div className="border-t border-structured-paper/10 pt-4 flex justify-between items-center font-mono text-[9px] text-structured-paper/40">
                      <span>SOUNDS: SAGE CHANTS</span>
                      <span>BATTLE ENEMY: FOG</span>
                    </div>
                  </motion.div>
                )}

                {/* ── Feature 2: The Great Quests / Mastery Paths HUD ── */}
                {activeFeature === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between border-b border-structured-paper/10 pb-4">
                      <div className="w-5 h-5 rounded-full border border-structured-paper flex items-center justify-center font-davinci font-bold text-[10px]">F</div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">focura.realm // mastery_path</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-3 my-4 text-xs font-mono">
                      <span className="font-mono text-[9px] text-structured-paper/50 uppercase tracking-widest block mb-1">PATH OF THE ARCHITECT</span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-structured-paper/40">
                          <span>[x]</span>
                          <span className="line-through">Squire's Trial (Lv.1)</span>
                        </div>
                        <div className="flex items-center gap-2 text-structured-paper font-bold border-l-2 border-structured-paper pl-2">
                          <span>[&gt;]</span>
                          <span>Astrolabe UI Design (Lv.2)</span>
                        </div>
                        <div className="flex items-center gap-2 text-structured-paper/20">
                          <span>[ ]</span>
                          <span>Forge Interface Mechanics (Lv.3)</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-structured-paper/10 pt-4 flex justify-between items-center font-mono text-[9px] text-structured-paper/40">
                      <span>RANK: ELITE SQUIRE</span>
                      <span>COMPLETED: 2/5</span>
                    </div>
                  </motion.div>
                )}

                {/* ── Feature 3: The Knight's Oath / Consistency Shields HUD ── */}
                {activeFeature === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between border-b border-structured-paper/10 pb-4">
                      <div className="w-5 h-5 rounded-full border border-structured-paper flex items-center justify-center font-davinci font-bold text-[10px]">F</div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">focura.realm // oath_shield</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-3 my-4">
                      <div>
                        <span className="font-mono text-[9px] text-structured-paper/50 uppercase tracking-widest block mb-1">🛡️ ACTIVE OATH SHIELD</span>
                        <h4 className="font-davinci text-xl text-structured-paper leading-tight">Oath of the Iron Pen</h4>
                      </div>
                      <div className="flex gap-1 justify-center py-2">
                        {[true, true, true, false, true, true, true].map((filled, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-3.5 border ${
                              filled ? "bg-structured-paper border-structured-paper" : "bg-transparent border-structured-paper/20"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between font-mono text-[8px] text-structured-paper/40">
                        <span>STREAK: 12 DAYS</span>
                        <span>SHIELDS: 2/3 ACTIVE</span>
                      </div>
                    </div>

                    <div className="border-t border-structured-paper/10 pt-4 flex justify-between items-center font-mono text-[9px] text-structured-paper/40">
                      <span>OATH PERIOD: WEEKLY</span>
                      <span>STATUS: PROTECTED</span>
                    </div>
                  </motion.div>
                )}

                {/* ── Feature 4: The Familiar / Companion Spirit HUD ── */}
                {activeFeature === 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-center justify-between border-b border-structured-paper/10 pb-4">
                      <div className="w-5 h-5 rounded-full border border-structured-paper flex items-center justify-center font-davinci font-bold text-[10px]">F</div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">focura.realm // companion_familiar</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-3 my-4 text-left">
                      <div>
                        <span className="font-mono text-[9px] text-structured-paper/50 uppercase tracking-widest block mb-1">🐣 SQUIRE COMPANION</span>
                        <h4 className="font-davinci text-2xl text-structured-paper leading-none">Level 4 Hesperides</h4>
                      </div>
                      <p className="font-davinci italic text-xs text-structured-paper/70 leading-normal border-l-2 border-structured-paper/20 pl-2">
                        &ldquo;Hesperides chirps: 'A worthy quest completed, Sire! Consistency is thy blade!'&rdquo;
                      </p>
                      <div className="h-1 w-full bg-structured-paper/10 rounded-full overflow-hidden">
                        <div className="h-full bg-structured-paper" style={{ width: "68%" }} />
                      </div>
                    </div>

                    <div className="border-t border-structured-paper/10 pt-4 flex justify-between items-center font-mono text-[9px] text-structured-paper/40">
                      <span>BOND: 85% TRUST</span>
                      <span>COMPANION ART: ACTIVE</span>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            </div>

          </div>

        </div>

      </section>

      {/* ── Section 4: The Intervention / The Method (Putty Room) ── */}
      <section className="relative py-32 bg-structured-putty text-structured-ink overflow-hidden z-10">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          {/* Section labels */}
          <div className="w-full flex justify-between items-center border-b border-structured-ink/10 pb-6 mb-16">
            <span className="font-helvetica-now text-[10px] font-bold uppercase tracking-widest text-structured-ink/40">
              SECTION II // THE SYSTEM
            </span>
            <span className="font-davinci text-lg text-structured-ink/40 italic">
              Restructured Focus
            </span>
          </div>

          <div className="space-y-16">
            {/* Display header */}
            <div className="max-w-3xl">
              <h2 className="font-davinci text-5xl lg:text-[72px] font-medium leading-[0.9] tracking-[-0.03em] text-structured-ink">
                Built for the stormborn.
              </h2>
              <p className="font-helvetica-now text-sm lg:text-base text-structured-graphite leading-relaxed max-w-lg mt-6">
                Focura doesn’t ask you to adapt to the dashboard. It adapts the system to your cognitive biochemistry.
              </p>
            </div>

            {/* Three key pillars */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8"
            >
              {/* Pillar 1 */}
              <motion.div variants={itemVariants} className="space-y-4 border-t border-structured-ink/20 pt-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-structured-ink/40">
                  METHOD 01
                </span>
                <h4 className="font-davinci text-2xl font-light text-structured-ink">
                  Energy-Based planning.
                </h4>
                <p className="font-helvetica-now text-xs text-structured-graphite leading-relaxed">
                  Ignore hours. Categorize quests by the mental battery they demand (High Focus, Low Focus, Low Energy). Open the workstation and select only what your current energy reserves allow.
                </p>
              </motion.div>

              {/* Pillar 2 */}
              <motion.div variants={itemVariants} className="space-y-4 border-t border-structured-ink/20 pt-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-structured-ink/40">
                  METHOD 02
                </span>
                <h4 className="font-davinci text-2xl font-light text-structured-ink">
                  Consistency oaths.
                </h4>
                <p className="font-helvetica-now text-xs text-structured-graphite leading-relaxed">
                  Rigid streaks breed guilt and abandonment. Swear Habit Oaths instead, and earn Streak Shields using your XP. Bad days happen—shields absorb the damage so you never start over.
                </p>
              </motion.div>

              {/* Pillar 3 */}
              <motion.div variants={itemVariants} className="space-y-4 border-t border-structured-ink/20 pt-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-structured-ink/40">
                  METHOD 03
                </span>
                <h4 className="font-davinci text-2xl font-light text-structured-ink">
                  Workstation cloak.
                </h4>
                <p className="font-helvetica-now text-xs text-structured-graphite leading-relaxed">
                  A pure, zero-clutter execution space. When you enter a battle, all other tasks, metrics, and sidebars vanish. It is just you, the ticking hourglass, and your quest companion.
                </p>
              </motion.div>

            </motion.div>

          </div>

        </div>

      </section>

      {/* ── Section 4B: The Sanctuary (Full-bleed Painting with Quote) ── */}
      <section ref={sectionQuoteRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden z-10">
        {/* Full-bleed Renaissance Art Study */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=1600"
            alt="Renaissance nature painting"
            className="w-full h-full object-cover filter grayscale-[30%] contrast-[1.05] brightness-[0.75]"
          />
          {/* Subtle warm tint overlay */}
          <div className="absolute inset-0 bg-[#3a3528]/10 mix-blend-color-burn" />
          <div className="absolute inset-0 bg-gradient-to-b from-structured-putty/30 via-transparent to-structured-ink" />
        </div>

        {/* Floating Quote moving on scroll */}
        <motion.div
          style={{
            y: smoothYQuote,
            clipPath: "polygon(15px 0%, calc(100% - 15px) 0%, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0% calc(100% - 15px), 0% 15px)",
          }}
          className="relative z-10 max-w-3xl mx-6 text-center space-y-4 bg-structured-ink/95 text-structured-paper p-10 backdrop-blur-sm"
        >
          <span className="font-mono text-[9px] uppercase tracking-widest text-structured-paper/40 block">
            THE SAGE // OATH OF SILENCE
          </span>
          <h3 className="font-davinci text-2xl sm:text-4xl lg:text-5xl font-light text-structured-paper leading-tight tracking-tight">
            &ldquo;Focus is not the absence of storm.<br/>It is the capacity to remain still within it.&rdquo;
          </h3>
        </motion.div>
      </section>

      {/* ── Section 5: The Testimonials (Ink Room - Dark section) ── */}
      <section className="relative py-32 bg-structured-ink text-structured-paper overflow-hidden z-10">
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          {/* Section labels */}
          <div className="w-full flex justify-between items-center border-b border-structured-paper/10 pb-6 mb-16">
            <span className="font-helvetica-now text-[10px] font-bold uppercase tracking-widest text-structured-paper/40">
              SECTION III // TESTIMONIALS
            </span>
            <span className="font-davinci text-lg text-structured-paper/40 italic">
              Chronicles of Oaths
            </span>
          </div>

          {/* Museum labels grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="border border-structured-paper/10 bg-structured-paper/[0.02] p-8 flex flex-col justify-between min-h-[280px]">
              <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/30 block mb-6">
                EXHIBIT 14 // THE SQUIRE'S TALE
              </span>
              <p className="font-davinci text-lg text-structured-paper/80 leading-snug italic">
                &ldquo;I used to freeze at my keyboard. Focura's energy planning changed everything. I tackle high-energy code blocks in the morning, and do low-energy reviews when tired. No shame, just progress.&rdquo;
              </p>
              <div className="mt-8 pt-4 border-t border-structured-paper/5">
                <span className="font-helvetica-now font-bold text-[10px] text-structured-paper block">
                  Squire Julian
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">
                  DEVELOPER / ADHD-PI
                </span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="border border-structured-paper/10 bg-structured-paper/[0.02] p-8 flex flex-col justify-between min-h-[280px]">
              <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/30 block mb-6">
                EXHIBIT 28 // THE BARD'S TALE
              </span>
              <p className="font-davinci text-lg text-structured-paper/80 leading-snug italic">
                &ldquo;Standard tools feel like work. Focura feels like a quiet gallery of my ambitions. Swearing a weekly Oath and seeing my Familiar hatch keeps me coming back without feeling forced.&rdquo;
              </p>
              <div className="mt-8 pt-4 border-t border-structured-paper/5">
                <span className="font-helvetica-now font-bold text-[10px] text-structured-paper block">
                  Lady Beatrice
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">
                  CREATIVE DIRECTOR / ADHD-C
                </span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="border border-structured-paper/10 bg-structured-paper/[0.02] p-8 flex flex-col justify-between min-h-[280px]">
              <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/30 block mb-6">
                EXHIBIT 41 // THE KNIGHT'S TALE
              </span>
              <p className="font-davinci text-lg text-structured-paper/80 leading-snug italic">
                &ldquo;Streak Shields are the single greatest feature ever designed. I had a severe burnout week, and instead of losing my 120-day streak and quitting, my shield absorbed the blow. I returned with confidence.&rdquo;
              </p>
              <div className="mt-8 pt-4 border-t border-structured-paper/5">
                <span className="font-helvetica-now font-bold text-[10px] text-structured-paper block">
                  Knight Arthur
                </span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40">
                  RESEARCH ANALYST / ADHD-HI
                </span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ── Section 6: The Covenant / Final CTA (Putty Room) ── */}
      <section className="relative py-40 bg-structured-putty text-structured-ink overflow-hidden z-10 flex flex-col items-center justify-center text-center">
        
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

        <div className="max-w-2xl mx-auto px-6 space-y-8 relative z-10">
          
          {/* Centered Circle Monogram Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-16 h-16 mx-auto rounded-full border border-structured-ink flex items-center justify-center bg-structured-bone hover:rotate-12 transition-transform duration-300"
          >
            <span className="font-davinci text-xl font-bold">F</span>
          </motion.div>

          {/* Heading */}
          <h2 className="font-davinci text-4xl sm:text-6xl font-medium tracking-[-0.03em] leading-none">
            Swear your Oath.
          </h2>

          <p className="font-helvetica-now text-sm sm:text-base text-structured-graphite max-w-md mx-auto leading-relaxed">
            Construct habits aligned with your focus energy. Step into Focura's zero-shame workstation today.
          </p>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/login";
            }}
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 pt-4"
          >
            <input
              type="email"
              placeholder="Enter thy email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 rounded-full border border-structured-ink bg-transparent px-6 py-3.5 text-xs text-structured-ink placeholder-structured-graphite/40 focus:outline-none focus:border-structured-ink focus:ring-1 focus:ring-structured-ink transition-all font-helvetica-now"
            />
            <button
              type="submit"
              className="bg-structured-ink text-structured-paper font-helvetica-now font-bold text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-full hover:bg-structured-graphite transition-all shrink-0 hover:scale-[1.02] duration-300"
            >
              Enter the Realm
            </button>
          </form>

        </div>

      </section>

      {/* ── Footer ── */}
      <footer className="relative py-12 bg-structured-chalk border-t border-structured-vellum z-20 text-center">
        <p className="font-mono text-[9px] text-structured-graphite tracking-widest uppercase">
          FOCURA &copy; {new Date().getFullYear()} &middot; ARCHITECTED IN MONTREAL FOR ADHD COGNITION
        </p>
      </footer>

    </div>
  );
}
