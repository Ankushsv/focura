"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { levelProgress } from "@/lib/xp/levels";
import { fireConfetti } from "@/lib/confetti";
import { bus } from "@/lib/events";
import type { Task, Energy } from "@/lib/tasks/types";
import { CATEGORY_ICONS } from "@/lib/paths/types";

// Daily Quotes Pool
const QUOTES = [
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" }
];

// Warm Phrase Generator based on time of day
function getGreetingPhrase(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "let's make today count ☀️";
  if (h >= 12 && h < 17) return "staying focused and steady ⚡";
  return "ready when you are 🌙";
}

export default function DashboardPage() {
  const { totalXp, level, awardXp } = useXp();
  const { activePet, petStats, petUsage, feedPet } = usePet();
  const progress = levelProgress(totalXp);
  const pct = Math.round((progress.current / progress.required) * 100);

  // States
  const [name, setName] = useState("Adventurer");
  const [avatar, setAvatar] = useState("🧗");
  const [isLight, setIsLight] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [quickstartDismissed, setQuickstartDismissed] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [petPopoverOpen, setPetPopoverOpen] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Load Date
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Time of Day Greeting Label
  const greetingLabel = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Time of Day Phrase
  const greetingPhrase = useMemo(() => getGreetingPhrase(), []);

  // Load User Info and Data
  useEffect(() => {
    // 1. Fetch Supabase or Local Storage Name
    async function loadUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();
          if (profile?.name) setName(profile.name);
          else if (user.email) setName(user.email.split("@")[0]);
        } else {
          const saved = localStorage.getItem("focura.username");
          if (saved) setName(saved);
        }
      } catch {
        const saved = localStorage.getItem("focura.username");
        if (saved) setName(saved);
      }

      const savedAvatar = localStorage.getItem("focura.avatar");
      if (savedAvatar) setAvatar(savedAvatar);

      const savedTheme = localStorage.getItem("focura.theme");
      setIsLight(savedTheme === "light" || document.documentElement.classList.contains("light-theme"));
    }
    loadUser();

    // 2. Load Tasks
    try {
      const raw = localStorage.getItem("focura.tasks.v1");
      if (raw) setTasks(JSON.parse(raw));
    } catch {}

    // 3. Load Sessions
    try {
      const raw = localStorage.getItem("focura.sessions.v1");
      if (raw) setSessions(JSON.parse(raw));
    } catch {}

    // 4. Load Mastery Paths
    try {
      const raw = localStorage.getItem("focura.paths.v1");
      if (raw) setPaths(JSON.parse(raw));
    } catch {}

    // 5. Load Weekly Goals
    try {
      const raw = localStorage.getItem("focura.weekly_goals.v1");
      if (raw) setWeeklyGoals(JSON.parse(raw));
    } catch {}

    // 6. Calculate Streak from Contracts
    try {
      const raw = localStorage.getItem("focura.contracts.v1");
      if (raw) {
        const contracts = JSON.parse(raw);
        const checkInDates = new Set(
          contracts
            .flatMap((c: any) => c.checkIns || [])
            .filter((ci: any) => ci.done)
            .map((ci: any) => ci.date)
        );

        let streak = 0;
        const current = new Date();
        let currentStr = current.toISOString().slice(0, 10);

        if (!checkInDates.has(currentStr)) {
          current.setDate(current.getDate() - 1);
          currentStr = current.toISOString().slice(0, 10);
        }

        while (checkInDates.has(currentStr)) {
          streak++;
          current.setDate(current.getDate() - 1);
          currentStr = current.toISOString().slice(0, 10);
        }
        setStreakDays(streak);
      }
    } catch {}

    // 7. Load Quickstart Dismissed state
    const dismissed = localStorage.getItem("focura.quickstart_dismissed.v1") === "true";
    setQuickstartDismissed(dismissed);
  }, []);

  // Compute Active Tasks & Done Tasks
  const activeTasks = useMemo(() => tasks.filter(t => !t.done), [tasks]);
  const doneTasksCount = useMemo(() => tasks.filter(t => t.done).length, [tasks]);

  // Main Quest: task where is_main_quest = true, fallback to first active task
  const mainQuest = useMemo(() => {
    return tasks.find(t => !t.done && (t as any).is_main_quest === true) || activeTasks[0] || null;
  }, [tasks, activeTasks]);

  // Quickstart checklist flags
  const hasPlanned = tasks.length > 0;
  const hasRun = sessions.length > 0;
  const hasTicked = doneTasksCount > 0;
  const quickstartCompleted = hasPlanned && hasRun && hasTicked;
  const completedCount = [hasPlanned, hasRun, hasTicked].filter(Boolean).length;

  // Dismiss Quickstart Checklist
  const dismissQuickstart = () => {
    localStorage.setItem("focura.quickstart_dismissed.v1", "true");
    setQuickstartDismissed(true);
  };

  // Toggle Theme
  const toggleTheme = (light: boolean) => {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("focura.theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("focura.theme", "dark");
    }
  };

  // Today's Completed Focus Sessions (endedAt is timestamp of today)
  const todaySessions = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime();
    return sessions.filter(s => s.endedAt >= startMs);
  }, [sessions]);

  const todayCount = todaySessions.length;
  const focusGoal = 6; // default daily goal
  const progressRatio = Math.min(1, todayCount / focusGoal);

  // SVG Progress Ring calculations (r = 70, circumference = 439.82)
  const strokeCircumference = 439.82;
  const strokeDashoffset = strokeCircumference - progressRatio * strokeCircumference;

  // Primary Mastery Path (path with highest completion percent)
  const primaryPath = useMemo(() => {
    if (paths.length === 0) return null;
    return paths
      .map(p => {
        const done = p.nodes.filter((n: any) => n.status === "done").length;
        const total = p.nodes.length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...p, percent };
      })
      .sort((a, b) => b.percent - a.percent)[0];
  }, [paths]);

  // Companion Level based on focus minutes
  const activeUsage = petUsage[activePet.id] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
  const petLevel = Math.max(1, Math.floor(activeUsage.focusMinutes / 120) + 1);

  // Ambient Message for Pet speech bubble
  const petAmbientMessage = useMemo(() => {
    if (todayCount >= focusGoal) return "Goal achieved! We're legendary today! 🏆";
    if (activeTasks.length === 0) return "Quests cleared! Rest up, partner ☕";
    if (petStats.energy < 30) return "A bit tired, but ready whenever you are 💤";
    return "Ready when you are — I'm here 🔥";
  }, [todayCount, activeTasks.length, petStats.energy, focusGoal]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      
      {/* ── GREETING BANNER ── */}
      <section className="relative overflow-hidden rounded-2xl border border-realm-border bg-[#1a1714] p-6 sm:p-8 shadow-xl">
        {/* Soft decorative glow spot */}
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-[#f0a868]/5 blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 font-mono text-[10px] text-realm-muted uppercase tracking-wider hidden sm:block">
          THE WAR ROOM ✦ COMMAND
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-realm-gold animate-pulse" />
              <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
                STORMBORN &middot; LEVEL {level}
              </p>
            </div>
            
            {/* Time-aware Greeting */}
            <h1 className="font-cinzel text-xl sm:text-3xl font-bold text-[#f5efe8] leading-tight">
              {greetingLabel === "Good morning" ? (
                <>Rise, <span className="text-[#f0a868]">{name}</span>. The realm needs you. ☀️</>
              ) : greetingLabel === "Good afternoon" ? (
                <>The day is half-won, <span className="text-[#f0a868]">{name}</span>. ⚔️</>
              ) : greetingLabel === "Good evening" ? (
                <>The fog thickens at dusk, <span className="text-[#f0a868]">{name}</span>. 🌙</>
              ) : (
                <>The brave ones ride at night, <span className="text-[#f0a868]">{name}</span>. 🌑</>
              )}
            </h1>
            <p className="font-lora italic text-xs sm:text-sm text-realm-muted">
              &ldquo;Your mind moves like lightning, and your legend begins here.&rdquo;
            </p>
          </div>

          {/* Quick Level Status badge */}
          <div className="flex items-center gap-4 bg-[#141210] border border-realm-border rounded-xl p-4 shrink-0 hover:border-[#f0a868]/30 transition duration-300">
            <div className="relative h-12 w-12 shrink-0 flex items-center justify-center rounded-full bg-[#0e0c0a] border border-realm-border">
              {/* Mini SVG Progress around Level */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="2" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#f0a868"
                  strokeWidth="2.5"
                  strokeDasharray="100"
                  strokeDashoffset={100 - pct}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "18px 18px" }}
                />
              </svg>
              <span className="text-sm font-mono font-bold text-[#f0a868]">{level}</span>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-realm-muted">Level Progress</p>
              <h4 className="font-quick font-bold text-xs text-[#f5efe8] mt-0.5">{pct}% to Level {level + 1}</h4>
              <p className="text-[9px] text-realm-muted font-mono mt-0.5">{totalXp} LP accumulated</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE DAY'S QUEST BANNER (Main Quest) ── */}
      <section className="relative overflow-hidden bg-[#1a1714] rounded-2xl border border-realm-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#f0a868]/30 to-transparent" />
        
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#f0a868]/15 border border-[#f0a868]/25 flex items-center justify-center text-lg">
            ⚔️
          </div>
          <div>
            <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
              THE DAY&apos;S QUEST
            </p>
            <h3 className="font-quick font-bold text-sm text-[#f5efe8] mt-0.5">
              {mainQuest ? mainQuest.title : `The Scroll awaits your orders, ${name}.`}
            </h3>
          </div>
        </div>

        <Link
          href={mainQuest ? `/app/timer?task=${mainQuest.id}` : "/app/tasks"}
          className="font-quick font-bold text-xs uppercase tracking-widest text-[#0e0c0a] bg-[#f0a868] px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(240,168,104,0.3)] transition duration-300 self-start sm:self-auto"
        >
          {mainQuest ? "▶ Ride to Battle" : "Set today's quest →"}
        </Link>
      </section>

      {/* ── THE SQUIRE'S TRIAL QUICKSTART ── */}
      {!quickstartDismissed && !quickstartCompleted && (
        <section className="bg-[#141210] rounded-2xl border border-realm-border p-6 relative shadow-md">
          <button
            onClick={dismissQuickstart}
            className="absolute top-4 right-4 text-realm-muted hover:text-[#f5efe8] transition-colors text-xs font-quick font-bold"
            aria-label="Dismiss Quickstart"
          >
            Dismiss
          </button>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
                THE SQUIRE'S TRIAL
              </p>
              <h2 className="font-quick font-bold text-lg text-[#f5efe8] mt-0.5">
                Your First Victories
              </h2>
            </div>
            <span className="rounded-full bg-[#0e0c0a] border border-realm-border px-3 py-1 text-xs font-mono text-realm-muted mr-16">
              {completedCount}/3
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "plan",
                title: "Accept your first mission",
                desc: "Go to The Scroll and select a mission",
                xp: 25,
                done: hasPlanned,
                href: "/app/tasks",
                btnText: "Go to The Scroll →",
              },
              {
                id: "run",
                title: "Enter your first Battle",
                desc: "Ride to battle with a 25-minute focus session",
                xp: 50,
                done: hasRun,
                href: "/app/timer",
                btnText: "Start Battle →",
              },
              {
                id: "tick",
                title: "Light the Oath Fire",
                desc: "Swear and honor your first consistency oath",
                xp: 25,
                done: hasTicked,
                href: "/app/contracts",
                btnText: "Swear Oath →",
              },
            ].map(item => (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between border border-realm-border bg-[#0e0c0a]/50 rounded-xl p-4 gap-4 transition duration-200 ${
                  item.done ? "opacity-45" : "hover:border-[#f0a868]/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                      item.done
                        ? "bg-[#5eead4] border-[#5eead4] text-[#0e0c0a]"
                        : "border-realm-border text-[#f0a868]/60"
                    }`}
                  >
                    {item.done ? "✓" : "⚔️"}
                  </div>
                  <div>
                    <h3 className={`font-quick font-bold text-sm text-[#f5efe8] ${item.done ? "line-through text-realm-muted" : ""}`}>
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-realm-muted mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="font-mono text-xs text-[#f0a868] font-bold">
                    +{item.xp} LP
                  </span>
                  {!item.done && (
                    <Link
                      href={item.href}
                      className="rounded-full bg-[#f5efe8]/10 border border-realm-border text-[#f5efe8] px-4 py-1.5 text-xs font-quick font-bold hover:bg-[#f5efe8]/20 transition duration-200"
                    >
                      {item.btnText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MAIN GRID ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        
        {/* LEFT COLUMN: BATTLE FURY RING + DAILY LORE */}
        <section className="relative overflow-hidden bg-[#1a1714] rounded-2xl border border-realm-border p-6 flex flex-col md:flex-row items-center gap-8 shadow-lg">
          <div className="flex flex-col items-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-[#f0a868]/2 blur-xl pointer-events-none scale-90" />
            
            <div className="relative h-44 w-44">
              <svg className="h-full w-full" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255, 245, 235, 0.02)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#f0a868"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(240,168,104,0.25)]"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "80px 80px" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-quick font-bold text-[#f5efe8]">
                  {todayCount}
                  <span className="text-realm-muted text-lg">/{focusGoal}</span>
                </span>
                <span className="text-[9px] font-quick font-bold uppercase tracking-widest text-[#f0a868] mt-1">
                  BATTLE FURY
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <h3 className="font-quick font-bold text-xl text-[#f5efe8] leading-none">
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </h3>
              <p className="font-mono text-xs text-realm-muted mt-1.5">
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Rotating Lore Quote */}
            <div className="border-l border-realm-border pl-4 py-1">
              <blockquote className="font-lora italic text-[#f5efe8]/65 leading-relaxed text-sm">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <cite className="block text-[10px] text-realm-muted mt-2 not-italic font-quick uppercase tracking-wider">
                — {quote.author}
              </cite>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/app/timer"
                className="rounded-full bg-[#f0a868] text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_20px_rgba(240,168,104,0.3)] transition duration-200"
              >
                ▶ Ride to Battle
              </Link>
              <Link
                href="/app/stats"
                className="rounded-full border border-realm-border text-[#f5efe8] px-6 py-2.5 text-xs font-quick font-bold hover:bg-white/5 transition duration-200"
              >
                Reflect
              </Link>
            </div>

            <div className="text-[11px] text-realm-muted font-sans">
              <span>
                {Math.max(0, focusGoal - todayCount)} battles to seal the day &middot;{" "}
              </span>
              <button
                onClick={() => setShowMilestones(prev => !prev)}
                className="underline hover:text-[#f5efe8] transition-colors"
              >
                {showMilestones ? "view less" : "view milestones"}
              </button>

              {showMilestones && (
                <div className="mt-3 space-y-2 border-t border-realm-border pt-3 animate-fade-in">
                  {todaySessions.length === 0 ? (
                    <p className="italic text-realm-muted/40">No battles logged today yet.</p>
                  ) : (
                    todaySessions.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] text-realm-muted bg-[#141210] border border-realm-border rounded px-3 py-2">
                        <span>⚔️ {s.taskTitle || "General Battle"}</span>
                        <span className="font-mono">
                          {new Date(s.endedAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN STACK */}
        <aside className="space-y-6">
          
          {/* Card 1 — THE REALM THIS WEEK */}
          <div className="bg-[#1a1714] rounded-2xl border border-realm-border p-5 space-y-4 shadow-md">
            <h4 className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
              THIS WEEK &middot; GREAT QUESTS
            </h4>
            {weeklyGoals.length === 0 ? (
              <p className="font-sans text-xs text-realm-muted leading-relaxed">
                No active quest targets for this week. Align your blade by{" "}
                <Link href="/app/paths" className="text-[#f0a868] underline font-semibold">
                  setting goals
                </Link>{" "}
                in The Great Quests.
              </p>
            ) : (
              <div className="space-y-3">
                {weeklyGoals.map((goal, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <p className="text-xs text-[#f5efe8] font-quick font-bold">{goal}</p>
                    <div className="h-1 bg-[#141210] rounded-full overflow-hidden">
                      {/* Simulated gold progress bars */}
                      <div 
                        className="h-full bg-gradient-to-r from-[#f0a868] to-[#f0a868]/70"
                        style={{ width: `${35 + (idx * 20) % 65}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2 — THE OATH FIRE */}
          <div className="bg-[#1a1714] rounded-2xl border border-realm-border p-5 flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <h4 className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                OATH FIRE &middot; STREAK
              </h4>
              <p className={`font-quick font-bold text-sm mt-1.5 ${streakDays > 0 ? "text-[#f0a868]" : "text-realm-muted"}`}>
                {streakDays > 0 ? `${streakDays} days burning` : "The fire awaits your return."}
              </p>
            </div>
            <div className="text-2xl">
              <span className={streakDays > 0 ? "animate-pulse" : "opacity-30"}>🔥</span>
            </div>
          </div>

          {/* Card 3 — YOUR GREAT QUEST */}
          <div className="bg-[#1a1714] rounded-2xl border border-realm-border p-5 space-y-3 shadow-md">
            <h4 className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#a78bfa]">
              GREAT QUEST
            </h4>
            {primaryPath ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-quick font-bold text-[#f5efe8] flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[primaryPath.category as keyof typeof CATEGORY_ICONS]}</span>
                    <span className="truncate max-w-[140px]">{primaryPath.title}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#5eead4] font-bold">
                    {primaryPath.percent}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#141210] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5eead4] transition-all duration-700"
                    style={{ width: `${primaryPath.percent}%` }}
                  />
                </div>
                {/* Rank Mapping Squire -> Knight etc */}
                <p className="text-[9px] text-realm-muted font-sans mt-1">
                  Rank: {primaryPath.percent < 25 ? "Commoner &rarr; Squire" :
                         primaryPath.percent < 50 ? "Squire &rarr; Knight" :
                         primaryPath.percent < 75 ? "Knight &rarr; Champion" :
                         primaryPath.percent < 100 ? "Champion &rarr; Legend" :
                         "Legend &rarr; King/Queen"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-realm-muted font-sans">
                No active quests.{" "}
                <Link href="/app/paths" className="text-[#f0a868] underline font-semibold">
                  Begin a Quest
                </Link>
                .
              </p>
            )}
          </div>

          {/* Card 4 — Demo LP Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#a78bfa]/15 via-[#1a1714] to-[#1a1714] rounded-2xl border border-realm-border p-5 space-y-3 shadow-md">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#a78bfa]/30 to-transparent" />
            <h4 className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#a78bfa]">
              DEMO PRACTICE
            </h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-realm-muted">Practice Rewards</p>
                <p className="text-xs font-quick font-bold text-[#f5efe8] mt-1">{totalXp} Legend Points</p>
              </div>
              <button
                onClick={() => {
                  awardXp(50, "demo");
                  fireConfetti();
                  bus.emit("pet:react", { message: "A fine training session, knight! +50 LP!" });
                }}
                className="rounded-full bg-[#a78bfa] text-[#0e0c0a] px-4 py-2 text-[10px] font-quick font-bold hover:shadow-[0_0_15px_rgba(167,139,250,0.4)] transition duration-200"
              >
                Earn Demo LP
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
