"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  IconFlame, 
  IconShield, 
  IconHourglass, 
  IconVolume, 
  IconTrendingUp, 
  IconBrain,
  IconMap,
  IconCircleCheck
} from "@tabler/icons-react";
import Magnetic from "./Magnetic";
import { ease, motionPresets } from "@/lib/landing/designSystem";

const PILLARS = [
  { 
    title: "Energy-Based Planning", 
    desc: "Match tasks to your mental fuel. Select low, medium, or high energy activities to clear your checklist without shame.", 
    icon: "🔋" 
  },
  { 
    title: "Streak Safety Shields", 
    desc: "Equip up to 3 safety shields. If life intervenes and you miss a day, shields absorb the blow so your streak remains intact.", 
    icon: "🛡️" 
  },
  { 
    title: "AI Micro-Breakdowns", 
    desc: "Stuck or frozen? The Sage breaks complex milestone blocks down into absolute micro-steps so you can start anywhere.", 
    icon: "🧠" 
  },
  { 
    title: "Focus Soundscapes", 
    desc: "Mask sensory interruptions. Select phase-shifted white, pink, or brown noise paired with custom Alpha or Gamma waves.", 
    icon: "🎵" 
  },
  { 
    title: "Mastery Roadmaps", 
    desc: "Plot long-term goals as visual skill nodes. Unlock successive milestones and track your companion's growth.", 
    icon: "🗺️" 
  },
  { 
    title: "Zero-Guilt Architecture", 
    desc: "No aggressive warnings, no red notifications, no alarms. Structured solely to promote focus and positive reinforcement.", 
    icon: "🕊️" 
  },
];

export default function FeatureCardsSection() {
  return (
    <section id="pillars" className="relative py-24 sm:py-32 z-20 overflow-hidden border-t border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-16 items-start">
          
          {/* Left: Sticky Header */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-warm-amber/60 font-bold block">
              02 / The Philosophy
            </span>
            <h2 className="font-space font-bold text-3xl sm:text-5xl text-[#f5efe8] tracking-tight leading-[1.05]">
              Designed around cognitive limits.
            </h2>
            <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
              Standard task managers expect you to organize, sequence, and execute perfectly. For ADHD brains, that heavy administrative planning is exactly where focus fails. 
            </p>
            <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
              Focura eliminates administrative friction, matching daily activities to your active energy levels and protecting consistency.
            </p>
            <div className="h-[2px] w-20 bg-realm-gold/40 rounded-full pt-0.5" />
          </div>

          {/* Right: Grid of feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PILLARS.map((p, idx) => (
              <motion.div
                key={p.title}
                initial={{ 
                  opacity: 0, 
                  y: 40,
                  scale: 0.95,
                  filter: "blur(8px)"
                }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)"
                }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: (idx % 2) * 0.12, 
                  ease: ease.expo 
                }}
                whileHover={{
                  y: -6,
                  scale: 1.015,
                  borderColor: "rgba(240, 168, 104, 0.22)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35), 0 0 15px rgba(240, 168, 104, 0.08)",
                  backgroundColor: "rgba(245, 239, 232, 0.015)"
                }}
                className="p-8 border border-[rgba(245,239,232,0.06)] bg-[#161412]/50 rounded-[24px] space-y-6 relative group overflow-hidden transition-all duration-300 shadow-xl"
              >
                {/* Visual glow backdrop on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-realm-gold/[0.005] to-transparent pointer-events-none rounded-[24px]" />
                
                {/* Floating element */}
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-realm-gold/[0.01] blur-md group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-realm-bg/80 border border-white/[0.04] text-3xl group-hover:scale-110 group-hover:border-realm-gold/25 transition-all duration-300">
                  {p.icon}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-space font-bold text-sm sm:text-base text-[#f5efe8] group-hover:text-realm-gold transition-colors duration-300">
                    {p.title}
                  </h3>
                  <p className="font-quick text-xs text-warm-textMuted leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
