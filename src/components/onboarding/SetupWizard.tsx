"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uid, type Priority, type Energy } from "@/lib/tasks/types";
import { createClient } from "@/lib/supabase/client";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";

const AVATAR_OPTIONS = ["🧗", "🦊", "🚀", "🧙‍♂️", "🎯", "🧠", "🎨", "⚡", "👾", "☕", "🦄", "🍀"];

const PRIORITIES: { value: Priority; label: string; icon: string }[] = [
  { value: "critical", label: "Critical", icon: "🔴" },
  { value: "high", label: "High", icon: "🟠" },
  { value: "medium", label: "Medium", icon: "🟡" },
];

const STEPS = ["Summoning", "Identity", "First Quest"];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧗");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);

  const canAdvance = useCallback(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return true;
    return true;
  }, [step, name]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Update Profile name and avatar
      await supabase.from("profiles").update({
        username: name.trim(),
        name: name.trim(),
        avatar_emoji: avatar,
        onboarding_complete: true,
      }).eq("id", user.id);

      // 2. Add first task
      if (taskTitle.trim()) {
        const taskId = uid();
        const xp = taskPriority === "critical" ? 50 : taskPriority === "high" ? 35 : 25;
        await supabase.from("tasks").insert({
          id: taskId,
          user_id: user.id,
          title: taskTitle.trim(),
          priority: taskPriority,
          energy: "medium",
          xp: xp,
          done: false,
          created_at: new Date().toISOString()
        });
      }

      // Award XP
      const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
      const currentXp = profile?.total_xp || 0;
      await supabase.from("profiles").update({
        total_xp: currentXp + 100,
        level: 1
      }).eq("id", user.id);

      fireConfetti();
      bus.emit("xp:awarded", { amount: 100, source: "onboarding", total: currentXp + 100, level: 1 });
      bus.emit("pet:react", { message: "Welcome, brave one! Your journey begins now! 🎉" });
    } catch (err) {
      console.warn("Failed to complete onboarding wizard in Supabase:", err);
    } finally {
      setSubmitting(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c0a]/98 backdrop-blur-xl">
      <div className="relative w-full max-w-lg mx-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-quick font-bold uppercase tracking-widest transition-all duration-300 ${
                  i === step
                    ? "bg-[#f0a868]/15 text-[#f0a868] border border-[#f0a868]/30"
                    : i < step
                    ? "bg-[#5eead4]/10 text-[#5eead4] border border-[#5eead4]/20"
                    : "bg-[#141210] text-realm-muted border border-realm-border"
                }`}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < step ? "bg-[#5eead4]/40" : "bg-realm-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-realm-border bg-gradient-to-b from-[#1a1714] to-[#141210] shadow-2xl">
          <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[#f0a868]/3 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-[#a78bfa]/3 blur-3xl pointer-events-none" />

          <div className="relative p-8 sm:p-10">
            {/* Step 0: Welcome + Name */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">🏰</div>
                  <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#f5efe8]">
                    Welcome to Focura
                  </h1>
                  <p className="font-lora italic text-sm text-realm-muted leading-relaxed max-w-sm mx-auto">
                    &ldquo;The realm of focus — where every battle sharpens the mind and every quest builds the legend.&rdquo;
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-realm-border to-transparent" />

                <div className="space-y-3">
                  <label className="block text-xs font-quick font-bold uppercase tracking-wider text-[#f0a868]">
                    What shall we call you?
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={24}
                    className="w-full rounded-xl border border-realm-border bg-[#0e0c0a] px-5 py-3.5 text-sm font-quick text-[#f5efe8] outline-none placeholder:text-realm-muted/40 focus:border-[#f0a868]/60 transition text-center"
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                  />
                  <p className="text-[10px] text-realm-muted font-space text-center">
                    This will be your &ldquo;Stormborn&rdquo; name throughout the realm
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Avatar Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">{avatar}</div>
                  <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#f5efe8]">
                    Your Champion&apos;s Mark
                  </h1>
                  <p className="font-lora italic text-sm text-realm-muted leading-relaxed max-w-sm mx-auto">
                    Choose an emblem that represents your spirit in battle.
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-realm-border to-transparent" />

                <div className="grid grid-cols-6 gap-2.5">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-14 w-14 rounded-2xl border flex items-center justify-center text-2xl transition-all duration-200 mx-auto ${
                        avatar === emoji
                          ? "bg-[#f0a868]/10 border-[#f0a868] shadow-[0_0_12px_rgba(240,168,104,0.2)] scale-110"
                          : "bg-[#0e0c0a] border-realm-border hover:border-[#f5efe8]/30 hover:scale-105"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {name && (
                  <p className="text-center text-xs text-realm-muted font-quick">
                    {avatar} {name} &middot; Stormborn
                  </p>
                )}
              </div>
            )}

            {/* Step 2: First Quest + Pet Intro */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">🥚</div>
                  <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#f5efe8]">
                    Your First Quest
                  </h1>
                  <p className="font-lora italic text-sm text-realm-muted leading-relaxed max-w-sm mx-auto">
                    Every legend begins with a single step. What is your first mission?
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-realm-border to-transparent" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-quick font-bold uppercase tracking-wider text-[#f0a868]">
                      Mission Title
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Finish project draft, Study for exam..."
                      maxLength={80}
                      className="w-full rounded-xl border border-realm-border bg-[#0e0c0a] px-5 py-3.5 text-sm font-quick text-[#f5efe8] outline-none placeholder:text-realm-muted/40 focus:border-[#f0a868]/60 transition"
                      onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-quick font-bold uppercase tracking-wider text-realm-muted">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setTaskPriority(p.value)}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-quick font-bold transition ${
                            taskPriority === p.value
                              ? "bg-[#f0a868]/10 border-[#f0a868] text-[#f0a868]"
                              : "bg-[#0e0c0a] border-realm-border text-realm-muted hover:text-[#f5efe8]"
                          }`}
                        >
                          {p.icon} {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-realm-border to-transparent" />

                {/* Pet Introduction */}
                <div className="rounded-2xl border border-realm-border bg-[#0e0c0a]/80 p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#141210] border border-realm-border flex items-center justify-center text-3xl shrink-0">
                    🥚
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#5eead4]">
                      Your Companion Awaits
                    </p>
                    <p className="text-xs text-realm-muted leading-relaxed">
                      A Mysterious Egg has chosen you as its partner. Complete quests and gain XP to hatch it into a loyal companion.
                    </p>
                  </div>
                </div>

                <p className="text-center text-[10px] text-realm-muted font-quick uppercase tracking-wider">
                  +100 XP for completing your summoning
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className="rounded-xl border border-realm-border bg-[#141210] px-5 py-2.5 text-xs font-quick font-bold text-realm-muted hover:text-[#f5efe8] transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="rounded-xl bg-[#f0a868] text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition disabled:opacity-40"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={submitting}
                  className="rounded-xl bg-[#f0a868] text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition disabled:opacity-40 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-[#0e0c0a] border-t-transparent" />
                      Summoning...
                    </>
                  ) : (
                    "Begin Your Legend →"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Skip link */}
        <p className="text-center mt-4">
          <button
            type="button"
            onClick={handleFinish}
            className="text-[10px] text-realm-muted hover:text-[#f5efe8] transition font-quick underline underline-offset-2"
          >
            Skip setup — I know my way around
          </button>
        </p>
      </div>
    </div>
  );
}
