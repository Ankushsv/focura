"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import { ease } from "@/lib/landing/designSystem";

const STATS_ITEMS = [
  {
    value: 12450,
    suffix: "+",
    label: "Focus Hours Tracked",
    description: "Total cycles logged by Stormborn Knights fighting distraction in Focura.",
    color: "text-realm-gold"
  },
  {
    value: 48900,
    suffix: "+",
    label: "Milestones Conquered",
    description: "Completed quest chains and boss task items cleared from the Scroll.",
    color: "text-realm-teal"
  },
  {
    value: 3620,
    suffix: "+",
    label: "Knights Oaths Sworn",
    description: "Daily habit contracts established under glowing safety shields protection.",
    color: "text-realm-purple"
  }
];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 sm:py-32 z-20 overflow-hidden border-t border-white/[0.03] select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STATS_ITEMS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: ease.expo }}
              className="p-8 border border-[rgba(245,239,232,0.05)] bg-[#161412]/30 rounded-[24px] space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-warm-textMuted/60">
                  {idx === 0 && "Chronicle Log I"}
                  {idx === 1 && "Chronicle Log II"}
                  {idx === 2 && "Chronicle Log III"}
                </span>
                
                {/* Count Up Number */}
                <h4 className={`font-space font-black text-3xl sm:text-5xl tracking-tight leading-none ${stat.color}`}>
                  {isInView ? (
                    <AnimatedCounter value={stat.value} duration={2.4} suffix={stat.suffix} />
                  ) : (
                    `0${stat.suffix}`
                  )}
                </h4>
              </div>

              <div className="space-y-1">
                <h5 className="font-space font-bold text-xs sm:text-sm text-realm-text">
                  {stat.label}
                </h5>
                <p className="font-quick text-[11px] text-warm-textMuted leading-relaxed">
                  {stat.description}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
