"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { 
  IconHourglass, 
  IconMap, 
  IconShield, 
  IconCircleCheck, 
  IconChartBar, 
  IconMusic, 
  IconBrain,
  IconArrowRight
} from "@tabler/icons-react";

// Premium Easing Curve (easeOutExpo)
const EXPO_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.p 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: EXPO_EASE }}
      className="font-space font-bold text-[10px] uppercase tracking-[0.25em] text-warm-amber mb-4 flex items-center gap-2"
    >
      <span className="h-1 w-6 bg-warm-amber/60 rounded-full" />
      {children}
    </motion.p>
  );
}

const PILLARS = [
  { 
    title: "Energy-Based Planning", 
    desc: "Match tasks to your mental capacity (low, medium, or high energy) so you always know what you can handle next.", 
    icon: "🔋" 
  },
  { 
    title: "Streak Protection", 
    desc: "Life happens. Safety shields prevent your streaks from resetting to zero when you need to take a day off.", 
    icon: "🛡️" 
  },
  { 
    title: "AI Micro-Breakdowns", 
    desc: "Stuck on a task? The AI Coach breaks overwhelming items down into absolute micro-steps so you can start anywhere.", 
    icon: "🧠" 
  },
  { 
    title: "Focus Soundscapes", 
    desc: "Quiet the background noise and sharpen attention with low hums, ocean waves, and binaural beats.", 
    icon: "🎵" 
  },
  { 
    title: "Mastery Paths", 
    desc: "Long-term goal mapping with sequential milestones and visual climber tracking to map your progression.", 
    icon: "🛣️" 
  },
  { 
    title: "Zero-Shame Layout", 
    desc: "No aggressive warnings. No guilt. Just clean stats, visual companion feedback, and supportive guidance.", 
    icon: "🕊️" 
  },
];

const CHAPTERS = [
  { name: "Dashboard", desc: "A distraction-free overview of daily tasks and focus rings.", icon: IconChartBar },
  { name: "Focus Timer", desc: "Flow blocks paired with customizable audio entrainment hums.", icon: IconHourglass },
  { name: "Tasks Workspace", desc: "Clean task boards with priority tagging and step breakdowns.", icon: IconCircleCheck },
  { name: "Mastery Paths", desc: "Roadmaps that track your growth from Novice to Master.", icon: IconMap },
  { name: "Consistency Contracts", desc: "Habit agreements shielded against accidental slips.", icon: IconShield },
  { name: "AI Advisor", desc: "A chat console to get micro-steps when feeling stuck or frozen.", icon: IconBrain },
  { name: "Soundscape Customizer", desc: "Live mixer to adjust white, brown, pink noise and binaural waves.", icon: IconMusic },
];

const CHRONICLES = [
  {
    entry: "Insight I",
    date: "Day 47",
    text: "Breaking down complex projects to micro-steps helped me complete my coding assignment. My companion reached level 8.",
    sig: "— Kaelen, Software Developer"
  },
  {
    entry: "Insight II",
    date: "Day 90",
    text: "The streak protection contract is amazing. I missed one busy day but didn't lose my momentum.",
    sig: "— Alys, Designer"
  },
  {
    entry: "Insight III",
    date: "Day 180",
    text: "I finally found a system that works with my ADHD. Consistency feels natural now.",
    sig: "— Thorne, Project Lead"
  }
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 1. Scroll tracking setup
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth scroll progress bar value
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 25,
    restDelta: 0.001
  });

  // 2. Scroll-linked ambient background transformations
  const orb1Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.4, 0.8]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const orb2Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 1.3]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  
  const orb3Y = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-warm-bg text-warm-text font-quick selection:bg-warm-amber/30 overflow-x-hidden">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-warm-amber via-orange-400 to-warm-purple z-50 origin-left"
        style={{ scaleX }}
      />

      {/* ── Scroll-Linked Ambient Backgrounds ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          style={{ scale: orb1Scale, y: orb1Y }}
          className="absolute -top-[20vh] -left-[10vw] w-[60vw] h-[60vw] bg-warm-purple/4 rounded-full blur-[150px]" 
        />
        <motion.div 
          style={{ scale: orb2Scale, y: orb2Y }}
          className="absolute top-[30vh] -right-[15vw] w-[50vw] h-[50vw] bg-warm-amber/4 rounded-full blur-[150px]" 
        />
        <motion.div 
          style={{ y: orb3Y }}
          className="absolute bottom-[-10vh] left-[20vw] w-[40vw] h-[40vw] bg-warm-teal/2.5 rounded-full blur-[120px]" 
        />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-warm-bg/60 backdrop-blur-md border-b border-warm-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-space font-bold text-lg tracking-wider text-white">
            focura<span className="text-warm-amber">.</span>
          </Link>
          <Link
            href="/login"
            className="font-space font-bold text-[11px] uppercase tracking-widest text-white/80 hover:text-warm-amber transition-colors duration-300 border border-white/10 px-4 py-2 rounded-full bg-warm-surface2/30 backdrop-blur-sm"
          >
            Enter Dashboard
          </Link>
        </div>
      </header>

      {/* ================================================================
         HERO SECTION (Spring & Easing Viewport Entrances)
      ================================================================ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EXPO_EASE }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-amber/30 bg-warm-amber/5 px-4 py-1.5 text-xs font-semibold text-warm-amber font-space">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-amber opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-warm-amber"></span>
              </span>
              ADHD-FIRST PRODUCTIVITY WORKSPACE
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: EXPO_EASE }}
            className="font-space font-bold text-[clamp(2.5rem,7vw,4.8rem)] leading-[1.05] tracking-[-0.03em] text-warm-cream"
          >
            Focus is not a talent.<br />
            <span className="text-warm-amber bg-gradient-to-r from-warm-amber to-orange-400 bg-clip-text text-transparent">It is a system.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EXPO_EASE }}
            className="font-quick text-base sm:text-lg text-warm-textMuted max-w-2xl mx-auto leading-relaxed"
          >
            Your brain is not broken. It simply needs a distraction-free layout.
            Focura replaces overwhelming dashboards with immediate feedback loops, streak protections, and micro-task steps.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: EXPO_EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/login"
              className="group font-space font-bold text-xs uppercase tracking-widest text-warm-bg bg-warm-amber px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(240,168,104,0.35)] hover:scale-[1.02] transition-all duration-300 flex items-center gap-2"
            >
              Get Started
              <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#philosophy"
              className="font-space font-bold text-xs uppercase tracking-widest text-warm-textMuted hover:text-warm-text border border-white/10 hover:border-warm-amber/30 px-8 py-4 rounded-full transition-all duration-300"
            >
              See Architecture
            </a>
          </motion.div>

        </div>
      </section>

      {/* ================================================================
         STICKY SPLIT-SCREEN FEATURE SECTION (Viewport Detection & Sticky positions)
      ================================================================ */}
      <section id="philosophy" className="relative py-28 lg:py-36 bg-warm-surface/20 border-y border-warm-border/50 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.3fr] gap-16 items-start">
            
            {/* Sticky Left Column */}
            <div className="md:sticky md:top-32 h-fit space-y-6">
              <SectionLabel>Philosophy</SectionLabel>
              <h2 className="font-space font-bold text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-warm-cream">
                Designed to reduce cognitive friction.
              </h2>
              <p className="font-quick text-warm-textMuted leading-relaxed">
                Traditional productivity apps expect you to organize, plan, and schedule perfectly. For ADHD brains, that planning phase is exactly where focus breaks.
              </p>
              <p className="font-quick text-warm-textMuted leading-relaxed">
                Focura shifts the heavy lifting to its clean design system. Break tasks down with AI counsel, buffer against miss days, and keep streaks alive under your own terms.
              </p>
              <div className="pt-4 hidden md:block">
                <div className="h-[2px] w-20 bg-warm-amber/30 rounded-full" />
              </div>
            </div>

            {/* Right Column: Viewport-detected scrolling cards */}
            <div className="space-y-6">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 18, 
                    mass: 0.8,
                    delay: i * 0.05 
                  }}
                  className="p-6 rounded-2xl bg-warm-surface/50 border border-warm-border/80 hover:border-warm-amber/30 transition-all duration-300 group flex gap-4 items-start shadow-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warm-surface2 border border-warm-border text-2xl group-hover:scale-110 group-hover:border-warm-amber/20 transition-all">
                    {pillar.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-space font-bold text-sm text-warm-cream group-hover:text-warm-amber transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="font-quick text-xs text-warm-textMuted leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================
         COMPREHENSIVE WORKSPACE SECTION (Viewport Cascading animations)
      ================================================================ */}
      <section className="relative py-28 lg:py-36 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-20 space-y-4">
            <SectionLabel>Architecture</SectionLabel>
            <h2 className="font-space font-bold text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-warm-cream">
              Distraction-Free Layout
            </h2>
            <p className="font-quick text-warm-textMuted max-w-lg mx-auto">
              A premium, minimalist product shell structured around energy states and progress cycles.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((ch, i) => (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ 
                  type: "spring", 
                  stiffness: 120, 
                  damping: 18,
                  delay: i * 0.04 
                }}
                className="group relative overflow-hidden rounded-2xl border border-warm-border bg-warm-surface/40 p-6 flex flex-col justify-between hover:border-warm-amber/20 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm-surface2 border border-warm-border text-warm-amber group-hover:scale-105 transition-transform duration-300">
                    <ch.icon size={22} stroke={2} />
                  </div>
                  <div>
                    <h3 className="font-space font-bold text-sm text-warm-cream group-hover:text-warm-amber transition-colors duration-300">
                      {ch.name}
                    </h3>
                    <p className="font-quick text-xs text-warm-textMuted mt-1 leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================================
         TESTIMONIALS (Micro-interactive triggers)
      ================================================================ */}
      <section className="relative py-28 lg:py-36 bg-warm-surface/20 border-y border-warm-border/50 z-10">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center mb-20 space-y-4">
            <SectionLabel>User Insights</SectionLabel>
            <h2 className="font-space font-bold text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-warm-cream">
              Consistent focus, zero shame
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CHRONICLES.map((item, i) => (
              <motion.div
                key={item.sig}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EXPO_EASE }}
                className="bg-warm-surface border border-warm-border hover:border-warm-amber/30 p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[200px] transition duration-300 relative group"
              >
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-warm-amber/10 rounded-tr-2xl group-hover:border-warm-amber/40 transition duration-300" />
                
                <div>
                  <div className="flex justify-between items-center text-[10px] font-space text-warm-amber opacity-75 mb-4">
                    <span>{item.entry}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="font-quick italic text-sm text-warm-cream leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
                
                <span className="font-space text-xs font-semibold text-warm-textMuted mt-6 block">
                  {item.sig}
                </span>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================================
         FINAL CTA (Scale & Spring triggers)
      ================================================================ */}
      <section className="relative py-32 lg:py-40 z-10 text-center overflow-hidden">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warm-amber/5 rounded-full filter blur-[150px] pointer-events-none" />

        <div className="max-w-2xl px-6 space-y-6 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-16 h-16 mx-auto rounded-full bg-warm-amber/10 border border-warm-amber/20 flex items-center justify-center"
          >
            <span className="text-2xl animate-pulse">⚡</span>
          </motion.div>
          
          <h2 className="font-space font-bold text-3xl sm:text-5xl text-warm-cream leading-tight">
            Your Focus Workspace Awaits.
          </h2>
          <p className="font-quick text-sm sm:text-lg text-warm-textMuted">
            Start building positive routines today.
          </p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.8, ease: EXPO_EASE }}
            className="pt-6"
          >
            <Link
              href="/login"
              className="font-space font-bold text-xs uppercase tracking-widest text-warm-bg bg-warm-amber px-10 py-5 rounded-full hover:shadow-[0_0_40px_rgba(240,168,104,0.4)] transition duration-300 inline-block"
            >
              Get Started →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-8 bg-warm-bg border-t border-warm-border z-10 text-center font-space">
        <p className="font-mono text-[10px] text-warm-textMuted tracking-wider">
          FOCURA &copy; {new Date().getFullYear()} &middot; DESIGNED FOR ADHD COGNITION
        </p>
      </footer>

    </div>
  );
}
