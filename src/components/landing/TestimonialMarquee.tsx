"use client";

import React from "react";
import { colors } from "@/lib/landing/designSystem";

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

function TestimonialCard({ item, index }: { item: typeof TESTIMONIALS[0]; index: number }) {
  // Add subtle random-looking vertical offsets based on card index
  const offsetClass = index % 3 === 0 ? "translate-y-2" : index % 3 === 1 ? "-translate-y-2.5" : "translate-y-1";

  return (
    <div
      className={`relative w-[280px] sm:w-[350px] shrink-0 border border-[rgba(245,239,232,0.06)] rounded-2xl bg-[#161412]/80 backdrop-blur-md p-6 flex flex-col justify-between min-h-[170px] transition-all duration-300 hover:scale-[1.04] hover:border-realm-gold/30 hover:shadow-2xl hover:z-10 group overflow-hidden ${offsetClass}`}
    >
      
      {/* ── Dynamic Glass Reflection Sheen Sweep ── */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent pointer-events-none rounded-2xl" />
      <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transform skewX(-20deg) transition-all duration-1000 group-hover:left-[150%] pointer-events-none" />

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-realm-gold/75">
          <span>{item.entry}</span>
          <span>{item.date}</span>
        </div>
        <p className="font-quick italic text-xs sm:text-sm text-realm-text leading-relaxed">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
      
      <span className="font-space text-[10px] font-bold text-warm-textMuted mt-4 block">
        {item.sig}
      </span>
    </div>
  );
}

export default function TestimonialMarquee() {
  // Duplicate arrays to make them loop seamlessly without white gaps
  const row1 = [...TESTIMONIALS.slice(0, 3), ...TESTIMONIALS.slice(0, 3), ...TESTIMONIALS.slice(0, 3)];
  const row2 = [...TESTIMONIALS.slice(3, 6), ...TESTIMONIALS.slice(3, 6), ...TESTIMONIALS.slice(3, 6)];

  return (
    <section className="relative py-24 sm:py-32 z-20 border-t border-[rgba(245,239,232,0.05)] overflow-hidden select-none">
      
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mb-16 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-warm-amber/60 font-bold block mb-3">
          05 / The Chronicle
        </span>
        <h2 className="font-space font-bold text-2xl sm:text-5xl text-[#f5efe8] tracking-tight leading-none">
          Consistency Oaths Kept.
        </h2>
      </div>

      {/* Independent marquee conveyor tracks */}
      <div className="space-y-6 sm:space-y-8 w-full relative">
        
        {/* Track 1: Moves Left (←) */}
        <div className="marquee-track overflow-hidden w-full flex">
          <div className="marquee-content flex gap-6 sm:gap-8 animate-marquee-left w-max">
            {row1.map((item, idx) => (
              <TestimonialCard key={`row1-${idx}`} item={item} index={idx} />
            ))}
          </div>
        </div>

        {/* Track 2: Moves Right (→) */}
        <div className="marquee-track overflow-hidden w-full flex">
          <div className="marquee-content flex gap-6 sm:gap-8 animate-marquee-right w-max">
            {row2.map((item, idx) => (
              <TestimonialCard key={`row2-${idx}`} item={item} index={idx} />
            ))}
          </div>
        </div>

      </div>

    </section>
  );
}
