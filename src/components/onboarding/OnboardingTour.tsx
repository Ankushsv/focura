"use client";

import { useState } from "react";

interface TourStep {
  title: string;
  description: string;
  icon: string;
  target: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "The War Room",
    description: "Your command center. View your daily quest, active streaks, battle progress, and quick stats at a glance.",
    icon: "🏰",
    target: "dashboard",
  },
  {
    title: "The Scroll",
    description: "Manage your missions. Add tasks, set priorities, use AI to break down big quests, or get unstuck with the Retreat.",
    icon: "⚔️",
    target: "tasks",
  },
  {
    title: "Great Quests",
    description: "Define long-term mastery paths. Each path is a skill tree — complete nodes to level up your rank.",
    icon: "🗺️",
    target: "paths",
  },
  {
    title: "The Battle",
    description: "Start a focus timer session. Choose your task, duration, and soundscape. Each minute earns XP.",
    icon: "⏱️",
    target: "timer",
  },
  {
    title: "Your Companion",
    description: "Your pet grows with you. Earn XP, hatch eggs, evolve species, and unlock unique powers as you stay consistent.",
    icon: "🥚",
    target: "pet",
  },
  {
    title: "The Treasury",
    description: "Spend XP on pets, titles, themes, and artifacts. Collect all 25 species and unlock legendary creatures.",
    icon: "💰",
    target: "rewards",
  },
];

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-[#0e0c0a]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 mb-8 sm:mb-0 animate-fade-in">
        <div className="rounded-3xl border border-realm-border bg-gradient-to-b from-[#1a1714] to-[#141210] shadow-2xl overflow-hidden">
          <div className="relative p-8 sm:p-10">
            {/* Progress bar */}
            <div className="flex gap-1 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-[#f0a868]" : "bg-realm-border"
                  }`}
                />
              ))}
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl">{current.icon}</div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-[#f5efe8]">
                {current.title}
              </h2>
              <p className="font-lora italic text-sm text-realm-muted leading-relaxed max-w-sm mx-auto">
                {current.description}
              </p>
            </div>

            {/* Quick links for actionable steps */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {current.target === "tasks" && (
                <a
                  href="/app/tasks"
                  onClick={(e) => { e.preventDefault(); onComplete(); window.location.href = "/app/tasks"; }}
                  className="rounded-full bg-[#f0a868]/10 border border-[#f0a868]/30 text-[#f0a868] px-4 py-1.5 text-[10px] font-quick font-bold hover:bg-[#f0a868]/20 transition"
                >
                  Go to The Scroll →
                </a>
              )}
              {current.target === "timer" && (
                <a
                  href="/app/timer"
                  onClick={(e) => { e.preventDefault(); onComplete(); window.location.href = "/app/timer"; }}
                  className="rounded-full bg-[#f0a868]/10 border border-[#f0a868]/30 text-[#f0a868] px-4 py-1.5 text-[10px] font-quick font-bold hover:bg-[#f0a868]/20 transition"
                >
                  Start a Battle →
                </a>
              )}
              {current.target === "rewards" && (
                <a
                  href="/app/rewards"
                  onClick={(e) => { e.preventDefault(); onComplete(); window.location.href = "/app/rewards"; }}
                  className="rounded-full bg-[#f0a868]/10 border border-[#f0a868]/30 text-[#f0a868] px-4 py-1.5 text-[10px] font-quick font-bold hover:bg-[#f0a868]/20 transition"
                >
                  Visit The Treasury →
                </a>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-realm-border px-8 sm:px-10 py-4 flex items-center justify-between bg-[#0e0c0a]/50">
            <p className="text-[10px] text-realm-muted font-mono">
              {step + 1} / {TOUR_STEPS.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onComplete}
                className="text-[10px] text-realm-muted hover:text-[#f5efe8] transition font-quick underline underline-offset-2"
              >
                Skip tour
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl border border-realm-border bg-[#141210] px-4 py-2 text-[10px] font-quick font-bold text-realm-muted hover:text-[#f5efe8] transition"
                >
                  ← Back
                </button>
              )}
              {step < TOUR_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="rounded-xl bg-[#f0a868] text-[#0e0c0a] px-5 py-2 text-[10px] font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onComplete}
                  className="rounded-xl bg-[#f0a868] text-[#0e0c0a] px-5 py-2 text-[10px] font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
                >
                  Enter the Realm →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
