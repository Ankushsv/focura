"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import InteractiveMockup from "./InteractiveMockup";
import { colors, ease } from "@/lib/landing/designSystem";

const STEPS = [
  {
    title: "Swear Oaths & Defeat Boss Tasks",
    description: "Gamify large milestones into epic Boss fights. When you create subtasks, the boss is assigned a matching health pool. Checking off items deals direct damage to the Boss task HP, tracking consistency and rewarding you with Legend points (LP) without guilt.",
    tag: "Quest scroll",
    icon: "⚔️"
  },
  {
    title: "Focus Arena & Wave Audio Tones",
    description: "Equip custom focus timer soundscapes generated dynamically in your browser. Block out noisy offices or household clutter with white, pink, or brown noise paired with custom Alpha (12Hz) flow waves or Solfeggio 528Hz tuning frequencies. Waving equalizers reflect audio play states.",
    tag: "Focus timer",
    icon: "⏱️"
  },
  {
    title: "Structure Today's Map",
    description: "Plan your day relative to wake and sleep hours. Drag quests from the Unscheduled Board directly onto your grid. Focus blocks and Life blocks stack nicely. If a focus session runs over, the Overrun Resolution Engine pushes subsequent slots forward to prevent schedule collisions.",
    tag: "Day timeline",
    icon: "📅"
  },
  {
    title: "Clear Roadblocks with The Sage",
    description: "Feeling frozen or overwhelmed? Open a chat console with the AI Coach. The Sage analyzes your profile and tasks to suggest micro-steps. If a project is too large, the Sage will automatically break it into tiny, bite-sized tasks so you can build momentum.",
    tag: "AI Coach",
    icon: "🔮"
  },
  {
    title: "Analyze the Chronicle",
    description: "Reflect on accomplishments through weekly analytics charts, completion rate badges, and calibration stats. The Anticipation vs Reality index measures estimated difficulty against actual effort to show you that work is often easier than it feels in your head.",
    tag: "The Chronicle",
    icon: "📊"
  }
];

export default function DashboardWalkthrough() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Listen to scroll changes and update active stage index (0 to 4)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const step = Math.min(Math.floor(latest * 5), 4);
      setActiveStep(step);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="relative h-[500vh] z-20">
      
      {/* ── Sticky Pinned Wrapper ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Ambient background glow shifting color based on active step */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] opacity-15 transition-all duration-1000"
            style={{
              backgroundColor: 
                activeStep === 0 ? colors.crimson :
                activeStep === 1 ? colors.amber :
                activeStep === 2 ? colors.teal :
                activeStep === 3 ? colors.purple :
                colors.teal
            }}
          />
        </div>

        {/* ── Main Layout Grid ── */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-12 px-6 sm:px-12 items-center relative z-10">
          
          {/* Left Column: Fixed space for displaying the current step text */}
          <div className="space-y-8 select-none">
            <AnimatePresence mode="wait">
              {STEPS.map((step, idx) => {
                if (idx !== activeStep) return null;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -16, filter: "blur(8px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 16, filter: "blur(8px)" }}
                    transition={{ duration: 0.5, ease: ease.expo }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full border border-realm-gold/20 bg-realm-gold/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-realm-gold font-space">
                      <span>{step.icon}</span>
                      <span>{step.tag}</span>
                    </div>

                    <h3 className="font-space font-bold text-2xl sm:text-4xl text-[#f5efe8] leading-[1.05] tracking-tight">
                      {step.title}
                    </h3>
                    
                    <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
                      {step.description}
                    </p>

                    {/* Step Indicators dots */}
                    <div className="flex gap-2 pt-4">
                      {STEPS.map((_, i) => (
                        <span 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === activeStep ? "w-6 bg-realm-gold" : "w-1.5 bg-warm-textHint/35"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Column: Sticky Mockup dashboard frame */}
          <div className="h-[300px] sm:h-[400px] lg:h-[480px] w-full flex items-center justify-center">
            <div className="w-full h-full max-w-[720px] aspect-[4/3] rounded-[24px]">
              <InteractiveMockup activeStep={activeStep} />
            </div>
          </div>

        </div>

      </div>

      {/* ── Scroll Guide spacers (tells browser how to scroll) ── */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        <div className="h-screen" />
        <div className="h-screen" />
        <div className="h-screen" />
        <div className="h-screen" />
        <div className="h-screen" />
      </div>

    </div>
  );
}
