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

const STEPS = ["Setup", "Profile", "First Task"];

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
      bus.emit("pet:react", { message: "Welcome to Focura! Setup completed! 🎉" });
    } catch (err) {
      console.warn("Failed to complete onboarding wizard in Supabase:", err);
    } finally {
      setSubmitting(false);
      localStorage.setItem("focura.onboarded", "1");
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-warm-bg/98 backdrop-blur-xl">
      <div className="relative w-full max-w-lg mx-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-quick font-bold uppercase tracking-widest transition-all duration-300 ${
                  i === step
                    ? "bg-[#f0a868]/15 text-warm-amber border border-warm-amber/30"
                    : i < step
                    ? "bg-warm-teal/10 text-warm-teal border border-warm-teal/20"
                    : "bg-warm-surface2 text-warm-textMuted border border-warm-border"
                }`}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < step ? "bg-warm-teal/40" : "bg-warm-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl border border-warm-border bg-gradient-to-b from-warm-surface to-warm-surface2 shadow-2xl">
          <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-warm-amber/3 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-warm-purple/3 blur-3xl pointer-events-none" />

          <div className="relative p-8 sm:p-10">
            {/* Step 0: Welcome + Name */}
            {step === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">⚡</div>
                  <h1 className="font-space text-2xl sm:text-3xl font-bold text-warm-text">
                    Welcome to Focura
                  </h1>
                  <p className="font-quick italic text-sm text-warm-textMuted leading-relaxed max-w-sm mx-auto">
                    &ldquo;A focus workspace built to help you block out distractions and build consistent focus habits.&rdquo;
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-warm-border to-transparent" />

                <div className="space-y-3">
                  <label className="block text-xs font-quick font-bold uppercase tracking-wider text-warm-amber">
                    What shall we call you?
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={24}
                    className="w-full rounded-xl border border-warm-border bg-warm-bg px-5 py-3.5 text-sm font-quick text-warm-text outline-none placeholder:text-warm-textMuted/40 focus:border-warm-amber/60 transition text-center"
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                  />
                  <p className="text-[10px] text-warm-textMuted font-space text-center">
                    This will be your display name in the app
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Avatar Selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">{avatar}</div>
                  <h1 className="font-space text-2xl sm:text-3xl font-bold text-warm-text">
                    Choose Your Profile Emoji
                  </h1>
                  <p className="font-quick italic text-sm text-warm-textMuted leading-relaxed max-w-sm mx-auto">
                    Select an emoji that represents you.
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-warm-border to-transparent" />

                <div className="grid grid-cols-6 gap-2.5">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-14 w-14 rounded-2xl border flex items-center justify-center text-2xl transition-all duration-200 mx-auto ${
                        avatar === emoji
                          ? "bg-warm-amber/10 border-warm-amber shadow-[0_0_12px_rgba(240,168,104,0.2)] scale-110"
                          : "bg-warm-bg border-warm-border hover:border-warm-text/30 hover:scale-105"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {name && (
                  <p className="text-center text-xs text-warm-textMuted font-quick">
                    {avatar} {name}
                  </p>
                )}
              </div>
            )}

            {/* Step 2: First Quest + Pet Intro */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-3">
                  <div className="text-5xl mb-2">🥚</div>
                  <h1 className="font-space text-2xl sm:text-3xl font-bold text-warm-text">
                    Your First Task
                  </h1>
                  <p className="font-quick italic text-sm text-warm-textMuted leading-relaxed max-w-sm mx-auto">
                    Every habit starts with a single step. What task do you want to accomplish today?
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-warm-border to-transparent" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-quick font-bold uppercase tracking-wider text-warm-amber">
                      Task Title
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Finish project draft, Study for exam..."
                      maxLength={80}
                      className="w-full rounded-xl border border-warm-border bg-warm-bg px-5 py-3.5 text-sm font-quick text-warm-text outline-none placeholder:text-warm-textMuted/40 focus:border-warm-amber/60 transition"
                      onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-quick font-bold uppercase tracking-wider text-warm-textMuted">
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
                              ? "bg-warm-amber/10 border-warm-amber text-warm-amber"
                              : "bg-warm-bg border-warm-border text-warm-textMuted hover:text-warm-text"
                          }`}
                        >
                          {p.icon} {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-warm-border to-transparent" />

                {/* Pet Introduction */}
                <div className="rounded-2xl border border-warm-border bg-warm-bg/80 p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-warm-surface2 border border-warm-border flex items-center justify-center text-3xl shrink-0">
                    🥚
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-teal">
                      Your Companion Awaits
                    </p>
                    <p className="text-xs text-warm-textMuted leading-relaxed">
                      A Mysterious Egg has chosen you as its partner. Complete tasks and gain XP to hatch it into a loyal companion.
                    </p>
                  </div>
                </div>

                <p className="text-center text-[10px] text-warm-textMuted font-quick uppercase tracking-wider">
                  +100 XP for completing setup
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className="rounded-xl border border-warm-border bg-warm-surface2 px-5 py-2.5 text-xs font-quick font-bold text-warm-textMuted hover:text-warm-text transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="rounded-xl bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition disabled:opacity-40"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={submitting}
                  className="rounded-xl bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition disabled:opacity-40 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border border-warm-bg border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Begin Your Journey →"
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
            onClick={() => { localStorage.setItem("focura.onboarded", "1"); handleFinish(); }}
            className="text-[10px] text-warm-textMuted hover:text-warm-text transition font-quick underline underline-offset-2"
          >
            Skip setup — I know my way around
          </button>
        </p>
      </div>
    </div>
  );
}
