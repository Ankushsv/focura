"use client";

import { useRef, useState, useEffect } from "react";
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
  IconArrowRight,
  IconMaximize,
  IconAdjustments,
  IconVolume
} from "@tabler/icons-react";

// Premium Easing Curve
const EXPO_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PILLARS = [
  { 
    title: "Energy-Based Quests", 
    desc: "Rate your focus fuel. Filter quests by low, medium, or high energy to defeat procrastination without shame.", 
    icon: "🔋" 
  },
  { 
    title: "Streak Shields", 
    desc: "Your streak is protected. Equipped safety shields keep your progress intact when life gets in the way.", 
    icon: "🛡️" 
  },
  { 
    title: "AI Micro-Breakdowns", 
    desc: "Feeling stuck or frozen? The AI Sage breaks down gargantuan tasks into tiny, bite-sized steps.", 
    icon: "🧠" 
  },
  { 
    title: "Focus Soundscapes", 
    desc: "Silence hyperactivity with phase-shifted low hums, ocean waves, and brown noise beats.", 
    icon: "🎵" 
  },
  { 
    title: "Mastery Paths", 
    desc: "Chart long-term goals as graphical skill trees. Unlock nodes, earn LP, and level up your companion.", 
    icon: "🗺️" 
  },
  { 
    title: "ADHD-Friendly Layout", 
    desc: "Zero warnings, zero guilt. Designed specifically to reduce cognitive loading and promote consistency.", 
    icon: "🕊️" 
  },
];

const MODULES = [
  { name: "The War Room", desc: "A dashboard with daily tasks, energy filters, and active companion stats.", icon: IconChartBar },
  { name: "Focus Arena", desc: "Flow blocks paired with customizable ambient entrainment noise.", icon: IconHourglass },
  { name: "The Quest Board", desc: "Clean checklist layout with instant step breakdowns and priority markers.", icon: IconCircleCheck },
  { name: "Mastery Paths", desc: "Visual growth trees maps tracking your climb from Novice to Sage.", icon: IconMap },
  { name: "Consistency Contracts", desc: "Habit agreements reinforced by glowing protective consistency shields.", icon: IconShield },
  { name: "The AI Sage", desc: "A helpful console to clear focus blockages and draft micro-steps.", icon: IconBrain },
];

const TESTIMONIALS = [
  {
    entry: "Chronicle I",
    date: "Day 47",
    text: "Micro-steps saved my thesis. When I was frozen, the Sage broke the outline into sentences I could actually write.",
    sig: "— Kaelen, Developer"
  },
  {
    entry: "Chronicle II",
    date: "Day 112",
    text: "Safety shields are the only reason I kept my streak. Missing a busy day didn't make me want to give up.",
    sig: "— Alys, Designer"
  },
  {
    entry: "Chronicle III",
    date: "Day 194",
    text: "Usually, productivity apps feel like a chore. Focura is the first system that respects my energy levels.",
    sig: "— Thorne, Writer"
  },
  {
    entry: "Chronicle IV",
    date: "Day 32",
    text: "The ambient noise generator masks everything. I put on the brown noise preset and block out the world.",
    sig: "— Sam, Student"
  },
  {
    entry: "Chronicle V",
    date: "Day 78",
    text: "Unlocking skill tree nodes feels like a real RPG. It gamifies the mundane in a truly healthy way.",
    sig: "— Lyra, Engineer"
  },
  {
    entry: "Chronicle VI",
    date: "Day 240",
    text: "Zero aggressive alarms or guilt trips. Just structured, compassionate guidance. Pure game changer.",
    sig: "— Val, Founder"
  }
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillarsSectionRef = useRef<HTMLDivElement>(null);
  const testimonialsSectionRef = useRef<HTMLDivElement>(null);

  // 1. Page Scroll Progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 25,
    restDelta: 0.001
  });

  // 2. High-Contrast Color Theme Scroll Mapping (Charcoal <-> Cream)
  // Transition points:
  // Start: Charcoal (#0c0c0e)
  // Scroll down to features: transition to Cream (#f5efe8)
  // Scroll to previewer/testimonials: transition back to Charcoal (#0c0c0e)
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.15, 0.25, 0.55, 0.68, 1],
    ["#0c0c0e", "#0c0c0e", "#f5efe8", "#f5efe8", "#0c0c0e", "#0c0c0e"]
  );

  const textColor = useTransform(
    scrollYProgress,
    [0, 0.15, 0.25, 0.55, 0.68, 1],
    ["#f5efe8", "#f5efe8", "#0c0c0e", "#0c0c0e", "#f5efe8", "#f5efe8"]
  );

  const lineColor = useTransform(
    scrollYProgress,
    [0, 0.15, 0.25, 0.55, 0.68, 1],
    ["rgba(245, 239, 232, 0.04)", "rgba(245, 239, 232, 0.04)", "rgba(12, 12, 14, 0.05)", "rgba(12, 12, 14, 0.05)", "rgba(245, 239, 232, 0.04)", "rgba(245, 239, 232, 0.04)"]
  );

  // 3. Multi-Layer Background Parallax Speeds
  const bgTextY1 = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const bgTextY2 = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgTextY3 = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  // 4. Offset Columns Parallax (Pillars Section)
  const { scrollYProgress: pillarsScrollY } = useScroll({
    target: pillarsSectionRef,
    offset: ["start end", "end start"]
  });
  const pillarCol1Y = useTransform(pillarsScrollY, [0, 1], [60, -60]);
  const pillarCol2Y = useTransform(pillarsScrollY, [0, 1], [-60, 60]);

  // 5. Offset Columns Parallax (Testimonials Section)
  const { scrollYProgress: testimonialsScrollY } = useScroll({
    target: testimonialsSectionRef,
    offset: ["start end", "end start"]
  });
  const testCol1Y = useTransform(testimonialsScrollY, [0, 1], [80, -80]);
  const testCol2Y = useTransform(testimonialsScrollY, [0, 1], [-80, 80]);
  const testCol3Y = useTransform(testimonialsScrollY, [0, 1], [40, -40]);

  // 6. Interactive Previewer Widget State
  const [accentTheme, setAccentTheme] = useState<"charcoal" | "cream" | "forest" | "amber">("charcoal");
  const [fontSize, setFontSize] = useState<number>(14);
  const [letterSpacing, setLetterSpacing] = useState<number>(-0.02);

  // Theme presets mapping
  const themePresets = {
    charcoal: { bg: "#0c0c0e", text: "#f5efe8", border: "#f5efe820", accent: "#a78bfa" },
    cream: { bg: "#f5efe8", text: "#0c0c0e", border: "#0c0c0e15", accent: "#e08e45" },
    forest: { bg: "#12221a", text: "#f0eae1", border: "#f0eae115", accent: "#5eead4" },
    amber: { bg: "#221612", text: "#fcf8f2", border: "#fcf8f215", accent: "#fbbf24" }
  };

  const activeTheme = themePresets[accentTheme];

  return (
    <motion.div 
      ref={containerRef} 
      style={{ backgroundColor: bgColor, color: textColor }}
      className="relative min-h-screen font-quick transition-colors duration-300 selection:bg-neutral-500/20 overflow-x-hidden"
    >
      {/* ── Top Scroll Progress Bar ── */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
        style={{ 
          scaleX: smoothScrollProgress,
          background: useTransform(
            scrollYProgress,
            [0, 0.25, 0.68, 1],
            ["#f0a868", "#0c0c0e", "#f5efe8", "#f0a868"]
          )
        }}
      />

      {/* ── Vertical Line Grid Overlay (Editorial Anchor) ── */}
      <div className="fixed inset-0 pointer-events-none z-10 flex justify-between max-w-7xl mx-auto px-6 sm:px-12">
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i} 
            style={{ borderColor: lineColor }}
            className="h-full border-r first:border-l" 
          />
        ))}
      </div>

      {/* ── Background Parallax Typography ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none font-space font-black opacity-[0.015] uppercase tracking-tighter">
        <motion.div 
          style={{ y: bgTextY1 }} 
          className="absolute top-10 left-5 text-[15vw] leading-none"
        >
          Structure
        </motion.div>
        <motion.div 
          style={{ y: bgTextY2 }} 
          className="absolute top-[40vh] right-5 text-[18vw] leading-none"
        >
          Focus
        </motion.div>
        <motion.div 
          style={{ y: bgTextY3 }} 
          className="absolute bottom-10 left-10 text-[16vw] leading-none"
        >
          Clarity
        </motion.div>
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-transparent border-b border-transparent backdrop-blur-[2px] py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-12">
          <Link href="/" className="font-space font-bold text-lg tracking-wider text-inherit">
            focura<span className="text-amber-500 font-black">.</span>
          </Link>
          <Link
            href="/login"
            className="font-space font-bold text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-transform duration-200 border border-current px-5 py-2.5 rounded-full"
          >
            Enter Workspace
          </Link>
        </div>
      </header>

      {/* ── Part 1: Hero Section ── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 z-20 pt-24">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EXPO_EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-current/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest font-space"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              ADHD-Friendly Workspace
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: EXPO_EASE }}
              className="font-space font-bold text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.92] tracking-[-0.04em]"
            >
              Focus is not a talent.<br />
              <span className="opacity-60 italic font-serif tracking-normal">It is a system.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EXPO_EASE }}
              className="font-quick text-base sm:text-lg opacity-70 max-w-xl leading-relaxed"
            >
              Your brain isn't broken. It simply rejects noisy, demanding dashboards. Focura aligns consistency with energy-based planning, safety shields, and zero-shame layouts.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EXPO_EASE }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                href="/login"
                className="group font-space font-bold text-xs uppercase tracking-widest bg-current text-neutral-950 px-8 py-4.5 rounded-full hover:opacity-90 hover:scale-[1.01] transition flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#pillars"
                className="font-space font-bold text-xs uppercase tracking-widest border border-current/25 hover:border-current/60 px-8 py-4.5 rounded-full transition flex items-center justify-center"
              >
                Explore System
              </a>
            </motion.div>
          </div>

          {/* Abstract Side Poster (Neue Montreal Typographic Art) */}
          <div className="hidden lg:block border border-current/10 rounded-3xl p-8 relative overflow-hidden aspect-[4/5] bg-current/[0.02]">
            <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-current/10" />
            <div className="h-full flex flex-col justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-widest opacity-40">System Core / v0.1</p>
                <h3 className="font-space font-black text-6xl mt-4 tracking-tighter leading-none">Foc.<br/>ura</h3>
              </div>
              <div className="space-y-4">
                <div className="h-[1px] w-full bg-current/10" />
                <p className="font-mono text-[10px] leading-relaxed opacity-50">
                  A dynamic playground utilizing cognitive-friction reduction parameters. Designed in Montreal.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 border border-current/20 rounded font-mono text-[8px]">ADHD_COGNITION</span>
                  <span className="px-2 py-0.5 border border-current/20 rounded font-mono text-[8px]">PERSISTENT_TICK</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Part 2: Feature Pillars (Vertical Parallax Columns) ── */}
      <section id="pillars" ref={pillarsSectionRef} className="relative py-32 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
            {/* Left Header */}
            <div className="lg:sticky lg:top-32 space-y-6">
              <span className="font-mono text-xs uppercase tracking-widest opacity-50">01 / The Core Pillars</span>
              <h2 className="font-space font-bold text-[clamp(2rem,5vw,3.8rem)] leading-[0.95] tracking-[-0.04em]">
                Designed around cognitive limits.
              </h2>
              <p className="font-quick text-sm sm:text-base opacity-70 leading-relaxed">
                Most task managers expect you to plan and organize perfectly. But for neurodivergent minds, that planning phase is exactly where attention splits. Focura simplifies the mechanics so you can focus on execution.
              </p>
              <div className="h-[1px] w-20 bg-current/25" />
            </div>

            {/* Right Offset Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Column 1 - Translates Up */}
              <motion.div style={{ y: pillarCol1Y }} className="space-y-8">
                {PILLARS.slice(0, 3).map((pillar) => (
                  <div 
                    key={pillar.title}
                    className="p-8 rounded-3xl border border-current/10 bg-current/[0.01] hover:bg-current/[0.02] hover:border-current/25 transition-all duration-300 group space-y-6"
                  >
                    <div className="text-4xl">{pillar.icon}</div>
                    <div className="space-y-2">
                      <h3 className="font-space font-bold text-base tracking-tight">{pillar.title}</h3>
                      <p className="font-quick text-xs opacity-75 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Column 2 - Translates Down */}
              <motion.div style={{ y: pillarCol2Y }} className="space-y-8 md:mt-16">
                {PILLARS.slice(3, 6).map((pillar) => (
                  <div 
                    key={pillar.title}
                    className="p-8 rounded-3xl border border-current/10 bg-current/[0.01] hover:bg-current/[0.02] hover:border-current/25 transition-all duration-300 group space-y-6"
                  >
                    <div className="text-4xl">{pillar.icon}</div>
                    <div className="space-y-2">
                      <h3 className="font-space font-bold text-base tracking-tight">{pillar.title}</h3>
                      <p className="font-quick text-xs opacity-75 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Part 3: Interactive Workspace Previewer Widget ── */}
      <section className="relative py-32 z-20 border-y border-current/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
          
          <div className="space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest opacity-50">02 / Interactive Trial</span>
            <h2 className="font-space font-bold text-[clamp(2rem,5vw,3.8rem)] leading-[0.95] tracking-[-0.04em]">
              Experience the zero-shame layout.
            </h2>
            <p className="font-quick text-sm sm:text-base opacity-70 leading-relaxed">
              We believe a workspace should adapt to your sensory requirements. Test Focura's preview widget on the right: toggle ambient theme presets and adjust font metrics to see how we accommodate focus.
            </p>

            {/* Customizer controls */}
            <div className="p-6 border border-current/15 rounded-3xl space-y-6 bg-current/[0.01]">
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-60">Accent Tone Preset</span>
                <div className="flex gap-2 flex-wrap">
                  {(["charcoal", "cream", "forest", "amber"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAccentTheme(t)}
                      className={`font-space text-[10px] uppercase font-bold px-4 py-2 border rounded-full transition-all ${
                        accentTheme === t 
                          ? "bg-current text-neutral-900 border-current" 
                          : "border-current/25 hover:border-current/60"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-60 flex justify-between">
                    <span>Text Size</span>
                    <span>{fontSize}px</span>
                  </span>
                  <input 
                    type="range" 
                    min="12" 
                    max="22" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-current h-1 bg-current/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-60 flex justify-between">
                    <span>Letter Spacing</span>
                    <span>{letterSpacing.toFixed(2)}em</span>
                  </span>
                  <input 
                    type="range" 
                    min="-0.05" 
                    max="0.05" 
                    step="0.01"
                    value={letterSpacing} 
                    onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                    className="w-full accent-current h-1 bg-current/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mock Preview Panel */}
          <div 
            style={{ 
              backgroundColor: activeTheme.bg, 
              color: activeTheme.text,
              borderColor: activeTheme.border,
              boxShadow: `0 20px 40px rgba(0,0,0,0.15)`
            }} 
            className="border-2 rounded-3xl p-6 sm:p-8 transition-all duration-500 aspect-[4/3] flex flex-col justify-between"
          >
            {/* Header controls mock */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activeTheme.border }}>
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">focura.workspace</span>
              <IconMaximize size={12} className="opacity-50" />
            </div>

            {/* Inner Content mock */}
            <div className="my-6 space-y-4 flex-1 flex flex-col justify-center">
              <div>
                <span 
                  className="font-space font-bold uppercase px-2 py-0.5 rounded text-[9px]" 
                  style={{ backgroundColor: `${activeTheme.accent}20`, color: activeTheme.accent }}
                >
                  ⚡ Active Battle
                </span>
              </div>
              <h4 
                className="font-space font-bold leading-tight"
                style={{ 
                  fontSize: `${fontSize}px`, 
                  letterSpacing: `${letterSpacing}em` 
                }}
              >
                Defeat the procrastination dragon (Design Landing Page)
              </h4>
              <p className="font-quick text-xs opacity-60">
                12 minutes elapsed · 2 subtasks remaining
              </p>
              
              {/* Progress bar mock */}
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: activeTheme.border }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: "66%", backgroundColor: activeTheme.accent }} />
              </div>
            </div>

            {/* Quick action footer mock */}
            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: activeTheme.border }}>
              <div className="flex gap-1.5">
                <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-white/5 transition" style={{ borderColor: activeTheme.border }}>
                  <IconAdjustments size={12} className="opacity-75" />
                </button>
                <button className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-white/5 transition" style={{ borderColor: activeTheme.border }}>
                  <IconVolume size={12} className="opacity-75" />
                </button>
              </div>
              <span className="font-space text-[10px] font-bold" style={{ color: activeTheme.accent }}>
                Running... ▶
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* ── Part 4: Layout Architecture Module Shells ── */}
      <section className="relative py-32 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest opacity-50">03 / The Blueprint</span>
            <h2 className="font-space font-bold text-[clamp(2rem,5vw,3.8rem)] leading-[0.95] tracking-[-0.04em] text-center">
              Modular Architecture
            </h2>
            <p className="font-quick text-sm sm:text-base opacity-70">
              Focura is structured into distinct, clean workspaces designed to limit clutter and promote flow.
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((ch, i) => (
              <div
                key={ch.name}
                className="group relative overflow-hidden rounded-3xl border border-current/10 bg-current/[0.005] hover:bg-current/[0.015] hover:border-current/20 p-8 flex flex-col justify-between aspect-[4/3] transition-all duration-300"
              >
                <div className="space-y-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-current/[0.03] border border-current/10 group-hover:scale-105 transition-transform duration-300">
                    <ch.icon size={22} stroke={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-space font-bold text-base tracking-tight">
                      {ch.name}
                    </h3>
                    <p className="font-quick text-xs opacity-70 leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Part 5: User Insights (3-Column Offset Parallax) ── */}
      <section ref={testimonialsSectionRef} className="relative py-32 z-20 border-t border-current/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-24 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest opacity-50">04 / User Stories</span>
            <h2 className="font-space font-bold text-[clamp(2rem,5vw,3.8rem)] leading-[0.95] tracking-[-0.04em] text-center">
              Consistent focus. Zero shame.
            </h2>
          </div>

          {/* Testimonial Parallax Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            
            {/* Column 1 - Translates Up */}
            <motion.div style={{ y: testCol1Y }} className="space-y-8">
              {TESTIMONIALS.slice(0, 2).map((item) => (
                <div 
                  key={item.sig}
                  className="bg-current/[0.015] border border-current/10 p-8 rounded-3xl space-y-6"
                >
                  <div className="flex justify-between font-mono text-[9px] opacity-50 uppercase">
                    <span>{item.entry}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="font-quick italic text-sm leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                  <span className="font-space text-xs font-semibold block">{item.sig}</span>
                </div>
              ))}
            </motion.div>

            {/* Column 2 - Translates Down */}
            <motion.div style={{ y: testCol2Y }} className="space-y-8 lg:mt-12">
              {TESTIMONIALS.slice(2, 4).map((item) => (
                <div 
                  key={item.sig}
                  className="bg-current/[0.015] border border-current/10 p-8 rounded-3xl space-y-6"
                >
                  <div className="flex justify-between font-mono text-[9px] opacity-50 uppercase">
                    <span>{item.entry}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="font-quick italic text-sm leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                  <span className="font-space text-xs font-semibold block">{item.sig}</span>
                </div>
              ))}
            </motion.div>

            {/* Column 3 - Translates Up */}
            <motion.div style={{ y: testCol3Y }} className="space-y-8">
              {TESTIMONIALS.slice(4, 6).map((item) => (
                <div 
                  key={item.sig}
                  className="bg-current/[0.015] border border-current/10 p-8 rounded-3xl space-y-6"
                >
                  <div className="flex justify-between font-mono text-[9px] opacity-50 uppercase">
                    <span>{item.entry}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="font-quick italic text-sm leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                  <span className="font-space text-xs font-semibold block">{item.sig}</span>
                </div>
              ))}
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── Part 6: Final CTA Section ── */}
      <section className="relative py-40 z-20 text-center overflow-hidden border-t border-current/10">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-current/[0.03] border border-current/10 flex items-center justify-center"
          >
            <span className="text-2xl animate-pulse">⚡</span>
          </motion.div>
          
          <h2 className="font-space font-bold text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.04em]">
            Take back control.
          </h2>
          <p className="font-quick text-sm sm:text-base opacity-75 max-w-md mx-auto">
            Build habits that work with your focus capacity. Enter Focura's zero-shame workspace today.
          </p>
          
          <div className="pt-6">
            <Link
              href="/login"
              className="font-space font-bold text-xs uppercase tracking-widest bg-current text-neutral-900 px-10 py-5 rounded-full hover:opacity-90 hover:scale-[1.02] transition duration-200 inline-block"
            >
              <span className="mix-blend-difference text-white">Enter Workspace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-12 border-t border-current/10 z-20 text-center font-space">
        <p className="font-mono text-[9px] opacity-45 tracking-widest">
          FOCURA &copy; {new Date().getFullYear()} &middot; ARCHITECTED IN MONTREAL FOR ADHD COGNITION
        </p>
      </footer>

    </motion.div>
  );
}
