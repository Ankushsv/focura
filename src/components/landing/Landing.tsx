"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  IconBuildingCastle, 
  IconSword, 
  IconMap, 
  IconShield, 
  IconMoon, 
  IconBook 
} from "@tabler/icons-react";

function IconScroll(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M17 18c.5 0 1 .5 1 1s-.5 1 -1 1h-10c-1.5 0 -3 -1.2 -3 -3s1.5 -3 3 -3h10c1.5 0 3 .8 3 2.5s-1.5 2.5 -3 2.5" />
      <path d="M17 14v-8c0 -1.5 -1.5 -2.5 -3 -2.5s-3 1 -3 2.5v12" />
    </svg>
  );
}

export default function Landing() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0e0c0a] flex items-center justify-center">
        <div className="font-quick text-[#f5efe8] text-sm tracking-widest animate-pulse">
          PREPARING THE REALM...
        </div>
      </div>
    );
  }

  // Chapter metadata for Section 3
  const CHAPTERS = [
    { 
      name: "The War Room", 
      desc: "Know what matters. Replaces your dashboard entirely with a tactical center.", 
      icon: IconBuildingCastle 
    },
    { 
      name: "The Battle", 
      desc: "Enter pure focus. Reframe distraction into a legendary battle against time.", 
      icon: IconSword 
    },
    { 
      name: "The Scroll", 
      desc: "Accept your missions. Dynamic RPG tasks, strikes, and boss fights.", 
      icon: IconScroll 
    },
    { 
      name: "The Great Quests", 
      desc: "Build your mastery. Map out long-term skill development roadmaps.", 
      icon: IconMap 
    },
    { 
      name: "The Knight's Oath", 
      desc: "Commit to consistency. Shields protect your Oath Fire from turning to ash.", 
      icon: IconShield 
    },
    { 
      name: "Your Familiar", 
      desc: "Never fight alone. A spirit companion that grows and fights alongside you.", 
      icon: IconMoon 
    },
    { 
      name: "The Chronicle", 
      desc: "Your legend, written in time. A comprehensive record of your daily victories.", 
      icon: IconBook 
    },
  ];

  // Familiar Stages metadata for Section 4
  const EVOLUTIONS = [
    { stage: "First Bond", emoji: "🥚", label: "Stage 1: Summoned" },
    { stage: "Battle Tested", emoji: "🐣", label: "Stage 2: Awakened" },
    { stage: "War Hardened", emoji: "🦊", label: "Stage 3: Familiar Art" },
    { stage: "Awakened Spirit", emoji: "🐉", label: "Stage 4: Ancient Power" }
  ];

  // Journal entries for Section 5
  const CHRONICLES = [
    {
      entry: "Entry I",
      date: "Day 47",
      text: "The DSA Dark Lord is defeated. My Familiar reached Level 8 today.",
      sig: "— Sir Kaelen, Stormborn"
    },
    {
      entry: "Entry II",
      date: "Day 90",
      text: "The Oath Fire has never dimmed. I am no longer a Commoner.",
      sig: "— Dame Alys, Knight"
    },
    {
      entry: "Entry III",
      date: "Day 180",
      text: "They call me Champion now. The Fog still comes. I ride anyway.",
      sig: "— Commander Thorne, Legend"
    }
  ];

  // Framer Motion animation presets
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0e0c0a] text-[#f5efe8] font-sans selection:bg-[#f0a868]/30 selection:text-[#f5e6d3] overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="font-quick font-bold text-xl tracking-wider text-[#f5efe8]">
          focura<span className="text-[#f0a868]">.</span>
        </Link>
        <Link
          href="/login"
          className="font-quick font-bold text-xs uppercase tracking-widest text-[#f5efe8]/80 hover:text-[#f0a868] transition duration-300 border border-rgba(255,245,235,0.07) px-5 py-2.5 rounded-full bg-[#1a1714]/30 backdrop-blur-sm"
        >
          Enter War Room
        </Link>
      </header>

      {/* ── SECTION 1: HERO SECTION ── */}
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center px-6 text-center drifting-fog overflow-hidden">
        
        {/* Faint Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,245,235,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,245,235,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none opacity-40 z-10" />
        
        {/* Gradient light behind content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f0a868]/5 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-3xl relative z-20 space-y-8 mt-12">
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-quick font-bold uppercase tracking-[0.25em] text-xs text-[#f0a868]"
          >
            FOR THE STORMBORN
          </motion.p>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-cinzel text-3xl sm:text-5xl lg:text-[3.5rem] font-bold leading-tight text-[#f5efe8] drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]"
          >
            Every Legend Began as Someone<br />Who Almost Gave Up.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-lora italic text-[#f5efe8]/65 text-sm sm:text-lg leading-relaxed max-w-xl mx-auto"
          >
            Your mind moves like lightning.<br />
            Your ideas arrive like storms.<br />
            And every single day, The Fog tries to swallow you before you begin.<br /><br />
            Focura is not a productivity app.<br />
            It is the story of what you became<br />
            when you decided to fight back.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
          >
            <Link
              href="/login"
              className="font-quick font-bold text-xs uppercase tracking-widest text-[#0e0c0a] bg-[#f0a868] px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(240,168,104,0.3)] transition duration-300"
            >
              Begin Your Journey →
            </Link>
            <a
              href="#problem"
              className="font-quick text-xs uppercase tracking-widest text-[#f5efe8]/50 hover:text-[#f5efe8] transition duration-300 underline underline-offset-4"
            >
              See how it works
            </a>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM ── */}
      <section id="problem" className="relative py-28 lg:py-36 bg-[#0e0c0a] border-t border-[#1a1714] overflow-hidden">
        
        {/* Dynamic Fog Overlay (Gets heavier, then clears on scroll) */}
        <motion.div
          initial={{ opacity: 0.03 }}
          whileInView={{ opacity: [0.03, 0.12, 0.03] }}
          viewport={{ once: false, margin: "-25% 0px -25% 0px" }}
          transition={{ duration: 5, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#f5efed]/[0.04] pointer-events-none filter blur-3xl"
        />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-cinzel text-2xl sm:text-4xl text-[#f5efe8]"
          >
            The Fog is Real.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-lora italic text-lg sm:text-2xl text-[#f5efe8]/65 max-w-2xl mx-auto leading-relaxed"
          >
            &ldquo;It is not laziness.<br />
            It is not weakness.<br />
            It is a storm inside a mind<br />
            that was built for something greater —<br />
            but never given the right map.&rdquo;
          </motion.p>
        </div>
      </section>

      {/* ── SECTION 3: THE JOURNEY ── */}
      <section className="relative py-28 lg:py-36 bg-[#141210] border-t border-b border-[#1a1714] overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          
          <div className="text-center mb-20">
            <h2 className="font-cinzel text-2xl sm:text-4xl text-[#f5efe8]">
              Your Journey Has Seven Chapters
            </h2>
            <p className="font-lora italic text-xs sm:text-sm text-[#f5efe8]/45 mt-2">
              The path of the Stormborn is written in focus.
            </p>
          </div>

          {/* Interactive Quest Road Path */}
          <div className="relative pl-12 sm:pl-16">
            
            {/* The Quest Path: Gold vertical line */}
            <div className="absolute left-[26px] top-6 bottom-6 w-[1.5px] bg-gradient-to-b from-[#f0a868]/15 via-[#f0a868]/80 to-[#f0a868]/15 pointer-events-none" />

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
              className="space-y-12"
            >
              {CHAPTERS.map((chap, idx) => (
                <motion.div 
                  key={chap.name}
                  variants={itemVariants}
                  className="relative group flex items-start gap-5 text-left"
                >
                  {/* Node icon indicator */}
                  <div className="absolute -left-[48px] sm:-left-[54px] w-9 h-9 rounded-full bg-[#1a1714] border border-[#f0a868]/30 group-hover:border-[#f0a868] flex items-center justify-center text-[#f0a868]/60 group-hover:text-[#f0a868] transition duration-300 shadow-[0_0_15px_rgba(14,12,10,0.5)] relative z-10">
                    <chap.icon size={15} stroke={2} />
                  </div>

                  <div>
                    <h3 className="font-quick font-bold text-[#f0a868] text-base group-hover:text-[#f5efe8] transition duration-300">
                      {chap.name}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#f5efe8]/50 mt-1 max-w-xl">
                      {chap.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── SECTION 4: THE FAMILIAR ── */}
      <section className="relative py-28 lg:py-36 bg-[#0e0c0a] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            
            {/* Silhouettes Left */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 order-2 lg:order-1"
            >
              {EVOLUTIONS.map((evo) => (
                <motion.div
                  key={evo.stage}
                  variants={itemVariants}
                  className="flex flex-col items-center p-6 bg-[#1a1714] rounded-2xl border border-rgba(255,245,235,0.07) relative group overflow-hidden"
                >
                  {/* Background glow on hover */}
                  <div className="absolute inset-0 bg-[#f0a868]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative w-24 h-24 flex items-center justify-center bg-[#141210] rounded-full mb-3 border border-rgba(255,245,235,0.05)">
                    <div className="absolute inset-0 bg-[#f0a868]/10 rounded-full filter blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Silhouette transition to full color on hover */}
                    <span className="text-5xl select-none filter brightness-0 drop-shadow-[0_0_12px_rgba(240,168,104,0.6)] group-hover:brightness-100 group-hover:drop-shadow-[0_0_20px_rgba(240,168,104,0.8)] transition-all duration-700">
                      {evo.emoji}
                    </span>
                  </div>
                  <span className="font-quick font-bold text-sm text-[#f0a868] relative z-10">{evo.stage}</span>
                  <span className="font-sans text-[10px] text-[#f5efe8]/45 mt-0.5 relative z-10">{evo.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Narrative Right */}
            <div className="space-y-6 order-1 lg:order-2 text-center lg:text-left">
              <span className="font-quick font-bold uppercase tracking-wider text-xs text-[#a78bfa]">
                SPIRIT COMPANION
              </span>
              <h2 className="font-cinzel text-2xl sm:text-4xl text-[#f5efe8]">
                You Were Never Meant to Fight Alone.
              </h2>
              <p className="font-lora italic text-[#f5efe8]/65 text-sm sm:text-base leading-relaxed">
                Your Familiar chose you. It grows when you grow. It rests when you fall. 
                It has been with every great knight — now it is with you.<br /><br />
                Watch it awaken from a dormant spirit shell into a dragon companion 
                as you fulfill missions on the Scroll.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECTION 5: THE CHRONICLE (Hall of Legends) ── */}
      <section className="relative py-28 lg:py-36 bg-[#141210] border-t border-b border-[#1a1714] overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          
          <div className="mb-16">
            <span className="font-quick font-bold uppercase tracking-wider text-xs text-[#f0a868]">
              THE CHRONICLE
            </span>
            <h2 className="font-cinzel text-2xl sm:text-4xl text-[#f5efe8] mt-2">
              The Hall of Legends
            </h2>
            <p className="font-lora italic text-xs sm:text-sm text-[#f5efe8]/45 mt-2">
              Stories of knights who conquered The Fog.
            </p>
          </div>

          {/* Ancient Scroll Journal Pages */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3 text-left"
          >
            {CHRONICLES.map((item) => (
              <motion.div
                key={item.sig}
                variants={itemVariants}
                className="bg-[#1a1714] border border-[#f0a868]/20 hover:border-[#f0a868]/50 p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[180px] transition duration-300 relative group"
              >
                {/* Ancient torn parchment effect hint */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#f0a868]/10 rounded-tr-2xl group-hover:border-[#f0a868]/40 transition duration-300" />
                
                <div>
                  <div className="flex justify-between items-center text-xs font-mono text-[#f0a868] opacity-75 mb-4">
                    <span>{item.entry}</span>
                    <span>{item.date}</span>
                  </div>
                  <p className="font-lora italic text-sm text-[#f5e6d3] leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
                
                <span className="font-quick text-xs font-semibold text-[#f5efe8]/40 mt-4 block">
                  {item.sig}
                </span>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ── */}
      <section className="relative py-32 lg:py-40 bg-[#0e0c0a] overflow-hidden text-center flex flex-col items-center justify-center">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,245,235,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,245,235,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f0a868]/5 rounded-full filter blur-[150px] pointer-events-none" />

        <div className="max-w-2xl px-6 space-y-6 relative z-10">
          <h2 className="font-cinzel text-3xl sm:text-5xl text-[#f5efe8] leading-tight">
            The Kingdom Will Not<br />Build Itself.
          </h2>
          <p className="font-lora italic text-sm sm:text-lg text-[#f5efe8]/60">
            Your quest begins the moment you decide.
          </p>
          
          <div className="pt-6">
            <Link
              href="/login"
              className="font-quick font-bold text-xs uppercase tracking-widest text-[#0e0c0a] bg-[#f0a868] px-10 py-5 rounded-full hover:shadow-[0_0_40px_rgba(240,168,104,0.4)] transition duration-300 inline-block"
            >
              Claim Your Title →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-8 bg-[#0e0c0a] border-t border-[#1a1714] z-10 text-center">
        <p className="font-mono text-[10px] text-[#f5efe8]/20 tracking-wider">
          THE REALM OF FOCURA &copy; 2026 &middot; BUILT FOR THE STORMBORN
        </p>
      </footer>

    </div>
  );
}
