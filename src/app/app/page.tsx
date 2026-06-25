"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { useMorningBriefing } from "@/hooks/useMorningBriefing";
import { levelProgress } from "@/lib/xp/levels";
import { fireConfetti } from "@/lib/confetti";
import { bus } from "@/lib/events";
import type { Task, Energy } from "@/lib/tasks/types";
import { CATEGORY_ICONS } from "@/lib/paths/types";
import DayVessel from "@/components/dashboard/DayVessel";

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

// Deadline State Helper
function getDeadlineState(dueDateStr: string | null | undefined) {
  if (!dueDateStr) return null;
  const now = new Date();
  const due = new Date(dueDateStr);
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const msRemaining = endOfDay.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, Math.round(msRemaining / (1000 * 60 * 60)));
    return {
      state: "today",
      label: `Due today · ${hoursRemaining}h remaining`,
    };
  } else if (diffDays > 0 && diffDays <= 2) {
    return {
      state: "imminent",
      label: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
    };
  } else if (diffDays > 2 && diffDays <= 6) {
    return {
      state: "soon",
      label: `Due in ${diffDays} days`,
    };
  }
  return null;
}

export default function DashboardPage() {
  const { totalXp, level, awardXp } = useXp();
  const { activePet, petStats, petUsage, feedPet } = usePet();
  const { show: showBriefing, dismiss: dismissBriefing } = useMorningBriefing();
  const router = useRouter();
  const progress = levelProgress(totalXp);
  const pct = Math.round((progress.current / progress.required) * 100);

  // States
  const [user, setUser] = useState<any>(null);
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
    async function loadData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (!user && supabaseUser) {
          setUser(supabaseUser);
        }

        if (supabaseUser) {
          // 1. Fetch Profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", supabaseUser.id)
            .single();

          if (profile) {
            setName(profile.username || profile.name || supabaseUser.email?.split("@")[0] || "Adventurer");
            if (profile.avatar_emoji) setAvatar(profile.avatar_emoji);
            const isProfileLight = profile.theme === "light";
            setIsLight(isProfileLight);
            if (isProfileLight) {
              document.documentElement.classList.add("light-theme");
            } else {
              document.documentElement.classList.remove("light-theme");
            }
          }

          // 2. Load Tasks
          const { data: dbTasks } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", supabaseUser.id);
          if (dbTasks) {
            setTasks(dbTasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              energy: t.energy || "medium",
              xp: t.xp || 25,
              done: t.done || false,
              isBoss: t.is_boss || false,
              subtasks: [],
              createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
              due_date: t.due_date || null,
              calibrated_estimate: t.calibrated_estimate ?? null,
              estimated_minutes: t.estimated_minutes ?? null,
            })));
          }

          // 3. Load Sessions
          const { data: dbSessions } = await supabase
            .from("sessions")
            .select("*")
            .eq("user_id", supabaseUser.id);
          if (dbSessions) {
            setSessions(dbSessions.map((s: any) => ({
              id: s.id,
              taskId: s.task_id,
              taskTitle: s.task_title || "Free focus",
              plannedMinutes: s.planned_minutes,
              actualMinutes: s.actual_minutes,
              endedAt: s.ended_at ? new Date(s.ended_at).getTime() : Date.now(),
            })));
          }

          // 4. Load Mastery Paths with nodes
          const { data: dbPaths } = await supabase
            .from("paths")
            .select("*")
            .eq("user_id", supabaseUser.id);
          const { data: dbNodes } = await supabase
            .from("path_nodes")
            .select("*")
            .eq("user_id", supabaseUser.id);
          if (dbPaths) {
            const mapped = dbPaths.map((p: any) => {
              const nodes = (dbNodes || [])
                .filter((n: any) => n.path_id === p.id)
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((n: any) => ({
                  id: n.id,
                  label: n.label,
                  status: n.status,
                }));
              return { ...p, nodes };
            });
            setPaths(mapped);
          }

          // 5. Load Weekly Goals (Challenges)
          const { data: dbChallenges } = await supabase
            .from("challenges")
            .select("title")
            .eq("user_id", supabaseUser.id);
          if (dbChallenges) {
            setWeeklyGoals(dbChallenges.map((c: any) => c.title));
          }

          // 6. Calculate Streak from Contracts Check-Ins
          const { data: dbCheckins } = await supabase
            .from("contract_checkins")
            .select("date, done")
            .eq("user_id", supabaseUser.id);

          if (dbCheckins) {
            const checkInDates = new Set(
              dbCheckins
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
        }
      } catch (err) {
        console.warn("Failed to load dashboard data from Supabase:", err);
      }
    }
    loadData();
  }, [user]);

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
    setQuickstartDismissed(true);
  };

  // Toggle Theme
  const toggleTheme = async (light: boolean) => {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await supabase
          .from("profiles")
          .update({ theme: light ? "light" : "dark" })
          .eq("id", supabaseUser.id);
      }
    } catch (err) {
      console.warn("Failed to save theme in profile:", err);
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
        const nodesList = p.nodes || [];
        const done = nodesList.filter((n: any) => n.status === "done").length;
        const total = nodesList.length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...p, percent };
      })
      .sort((a, b) => b.percent - a.percent)[0];
  }, [paths]);

  // Companion Level based on focus minutes
  const activeUsage = petUsage[activePet.id] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
  const petLevel = Math.max(1, Math.floor(activeUsage.focusMinutes / 120) + 1);

  // Deadline-aware task data for morning briefing + pet messages
  const todayTasks = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return activeTasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due >= todayStart && due <= todayEnd;
    });
  }, [activeTasks]);

  const thisWeekTasks = useMemo(() => {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    return activeTasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due <= weekEnd;
    });
  }, [activeTasks]);

  const tomorrowTasks = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return activeTasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return (
        due.getFullYear() === tomorrow.getFullYear() &&
        due.getMonth() === tomorrow.getMonth() &&
        due.getDate() === tomorrow.getDate()
      );
    });
  }, [activeTasks]);

  // Available focus hours estimate (wakeHour–sleepHour window × realistic ratio)
  const availableFocusHours = useMemo(() => {
    const wakeHour = 8;
    const sleepHour = 23;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const remaining = Math.max(0, sleepHour - currentHour);
    return (remaining * 0.6).toFixed(1);
  }, []);

  // 1. Next Recommended Mission (top priority incomplete task, sorted by soonest due date)
  const recommendedMission = useMemo(() => {
    if (activeTasks.length === 0) return null;
    return [...activeTasks].sort((a, b) => {
      const priorityMap = { critical: 0, high: 1, medium: 2 };
      const aPri = priorityMap[a.priority as keyof typeof priorityMap] ?? 99;
      const bPri = priorityMap[b.priority as keyof typeof priorityMap] ?? 99;
      
      if (aPri !== bPri) return aPri - bPri;
      
      // Soonest due date first
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return a.createdAt - b.createdAt;
    })[0];
  }, [activeTasks]);

  // 2. Dynamic Focus Energy Capacity remaining today
  const energyHours = useMemo(() => {
    const sleepHour = 23;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const remainingDayHours = Math.max(0, sleepHour - currentHour);
    
    // Focus sessions actual minutes focused today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime();
    const todaySess = sessions.filter(s => s.endedAt >= startMs);
    const timeSpentMinutes = todaySess.reduce((sum: number, s: any) => sum + (s.actualMinutes || 0), 0);
    const spentHours = timeSpentMinutes / 60;
    
    return Math.max(0, remainingDayHours - spentHours);
  }, [sessions]);

  const displayEnergyHours = useMemo(() => {
    return energyHours > 0 ? energyHours : 8.0; // fallback to static 8.0
  }, [energyHours]);

  const energyMinutes = useMemo(() => {
    return displayEnergyHours * 60;
  }, [displayEnergyHours]);

  const plannedMinutes = useMemo(() => {
    return todayTasks.reduce((sum, t) => sum + (t.calibrated_estimate || t.estimated_minutes || 30), 0);
  }, [todayTasks]);

  const isOvercapacity = useMemo(() => {
    return plannedMinutes > energyMinutes;
  }, [plannedMinutes, energyMinutes]);

  const fillPercentage = useMemo(() => {
    if (energyMinutes <= 0) return 100;
    return Math.min(100, (plannedMinutes / energyMinutes) * 100);
  }, [plannedMinutes, energyMinutes]);

  // 3. Dynamic Familiar Alert/Ready Message
  const familiarMessage = useMemo(() => {
    const energy = petStats?.energy ?? 100;
    if (energy > 50) {
      return {
        icon: "🧙‍♂️",
        text: "The Sage is ready. Your time sense is sharpening.",
        style: "border-warm-amber/20 bg-warm-amber/5 text-warm-cream",
      };
    } else if (energy < 30) {
      return {
        icon: "🥺",
        text: "The Familiar is concerned. Please rest after this battle.",
        style: "border-red-500/20 bg-red-500/5 text-red-200",
      };
    }
    return {
      icon: "🛡️",
      text: "The Familiar is watching over your quest progress.",
      style: "border-warm-border/50 bg-warm-surface2/30 text-warm-textMuted",
    };
  }, [petStats]);

  // Escape key handler for morning briefing
  useEffect(() => {
    if (!showBriefing) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissBriefing();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showBriefing, dismissBriefing]);

  // Familiar speech bubble — deadline takes priority over ambient
  const petAmbientMessage = useMemo(() => {
    // Check sessionStorage to only show deadline messages once per session
    const shownKey = "focura_pet_deadline_shown";
    const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(shownKey);
    if (!alreadyShown) {
      if (todayTasks.length > 0) {
        if (typeof window !== "undefined") sessionStorage.setItem(shownKey, "1");
        return `"${todayTasks[0].title}" is due today. You've got this! 🔥`;
      }
      if (tomorrowTasks.length > 0) {
        if (typeof window !== "undefined") sessionStorage.setItem(shownKey, "1");
        return `"${tomorrowTasks[0].title}" is due tomorrow. Plan your time wisely ⏳`;
      }
    }
    if (todayCount >= focusGoal) return "Goal achieved! We're legendary today! 🏆";
    if (activeTasks.length === 0) return "Quests cleared! Rest up, partner ☕";
    if (petStats.energy < 30) return "A bit tired, but ready whenever you are 💤";
    return "Ready when you are — I'm here 🔥";
  }, [todayCount, activeTasks.length, petStats.energy, focusGoal, todayTasks, tomorrowTasks]);

  return (
    <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-8 space-y-8 animate-fade-in">
      {/* ── Morning Briefing Modal ── */}
      <MorningBriefingModal
        show={showBriefing}
        onDismiss={dismissBriefing}
        onPlanDay={() => { dismissBriefing(); router.push("/app/timeline"); }}
        todayTasks={todayTasks}
        thisWeekCount={thisWeekTasks.length}
        availableFocusHours={availableFocusHours}
      />

      {/* ── HEADER HERO PANEL ── */}
      <section className="relative overflow-hidden rounded-3xl border border-warm-border bg-gradient-to-br from-warm-surface via-warm-surface to-warm-surface2/40 p-6 sm:p-8 shadow-xl">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-warm-amber/5 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-warm-purple/5 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warm-amber animate-pulse" />
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-warm-amber">
                ADVENTURER STATION &middot; PROFILE LEVEL {level}
              </p>
            </div>
            
            <h1 className="font-space text-2xl sm:text-4xl font-extrabold text-warm-cream leading-none tracking-tight">
              {greetingLabel === "Good morning" ? (
                <>Welcome back, <span className="text-warm-amber">{name}</span>. Let's make today count. ☀️</>
              ) : greetingLabel === "Good afternoon" ? (
                <>Good afternoon, <span className="text-warm-amber">{name}</span>. Keep up the momentum. ⚡</>
              ) : (
                <>Good evening, <span className="text-warm-amber">{name}</span>. Time to wrap up. 🌙</>
              )}
            </h1>
            <p className="font-quick text-sm sm:text-base text-warm-textMuted leading-relaxed">
              &ldquo;{quote.text}&rdquo; <span className="text-warm-amber font-medium font-space text-xs uppercase tracking-wider">— {quote.author}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {/* User Level progress bar */}
            <div className="flex items-center gap-4 bg-warm-surface2/60 border border-warm-border/60 rounded-2xl p-4 hover:border-warm-amber/30 transition duration-300">
              <div className="relative h-14 w-14 shrink-0 flex items-center justify-center rounded-full bg-warm-bg/85 border border-warm-border">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="2.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="var(--color-warm-amber)"
                    strokeWidth="2.5"
                    strokeDasharray="100"
                    strokeDashoffset={100 - pct}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "18px 18px" }}
                  />
                </svg>
                <span className="text-sm font-mono font-bold text-warm-amber">{level}</span>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-warm-textMuted">Level Progression</p>
                <h4 className="font-quick font-bold text-sm text-warm-text mt-0.5">{pct}% complete</h4>
                <p className="text-[9px] text-warm-textMuted font-mono mt-0.5">{totalXp} Total XP</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THREE COLUMN COMMAND CENTER GRID (12-column) ── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* ── COLUMN 1: QUEST BOARD (Left sidebar - col-span-3, order-2) ── */}
        <div className="col-span-12 lg:col-span-3 order-2 lg:order-1 space-y-6">
          
          {/* Active Quests Board */}
          <section className="bg-warm-surface border border-warm-border rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-warm-amber">Quest Board</p>
                <h2 className="font-space font-bold text-lg text-warm-text mt-0.5">Active Quests</h2>
              </div>
              <Link href="/app/tasks" className="text-xs text-warm-amber hover:underline font-bold font-quick">
                Manage Quests →
              </Link>
            </div>

            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <div className="border border-dashed border-warm-border bg-warm-surface2/30 rounded-xl p-8 text-center text-warm-textMuted">
                  <p className="text-sm font-quick">No active quests right now.</p>
                  <Link href="/app/tasks" className="text-xs text-warm-amber underline font-bold mt-2 inline-block">
                    Create your first quest
                  </Link>
                </div>
              ) : (
                activeTasks.slice(0, 4).map(task => {
                  const deadline = getDeadlineState(task.due_date);
                  
                  let borderClass = "border-warm-border/50";
                  let shadowClass = "";
                  let motionProps = {};
                  
                  if (deadline?.state === "today") {
                    borderClass = "border-[#f87171]";
                    shadowClass = "shadow-[0_0_12px_rgba(248,113,113,0.25)]";
                  } else if (deadline?.state === "imminent") {
                    motionProps = {
                      animate: { borderColor: ["#f0a868", "#f87171", "#f0a868"] },
                      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    };
                  } else if (deadline?.state === "soon") {
                    borderClass = "border-l-[3px] border-l-[#f0a868] border-t-warm-border/50 border-r-warm-border/50 border-b-warm-border/50";
                  }
                  
                  return (
                    <motion.div
                      key={task.id}
                      {...motionProps}
                      className={`flex items-center justify-between border bg-warm-surface2/40 rounded-xl p-4 hover:border-warm-amber/20 transition duration-200 ${borderClass} ${shadowClass}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] shrink-0">
                          {task.priority === "critical" ? "🔴" : task.priority === "high" ? "🟠" : "🟡"}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-quick font-bold text-sm text-warm-text truncate">{task.title}</h4>
                          <span className="text-[9px] text-warm-textMuted font-mono uppercase mt-0.5 block truncate">
                            {task.energy} energy &middot; +{task.xp} XP
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/app/timer?task=${task.id}`}
                        className="rounded-full border border-warm-border bg-warm-surface hover:bg-warm-surface2 hover:border-warm-amber/30 text-warm-text px-3.5 py-1.5 text-[10px] font-quick font-bold transition duration-200 shrink-0 ml-2"
                      >
                        ▶ focus
                      </Link>
                    </motion.div>
                  );
                })
              )}
            </div>
          </section>

          {/* Squire's Checklist */}
          {!quickstartDismissed && !quickstartCompleted && (
            <section className="bg-warm-surface border border-warm-border rounded-2xl p-6 shadow-md relative">
              <button
                onClick={dismissQuickstart}
                className="absolute top-4 right-4 text-warm-textMuted hover:text-warm-text transition-colors text-xs font-mono font-bold"
                aria-label="Dismiss Quickstart"
              >
                CLOSE
              </button>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-warm-amber">
                    GETTING STARTED
                  </p>
                  <h2 className="font-space font-bold text-base text-warm-text mt-0.5">
                    First Trials
                  </h2>
                </div>
                <span className="rounded-full bg-warm-bg border border-warm-border px-2.5 py-0.5 text-[10px] font-mono text-warm-textMuted mr-12">
                  {completedCount}/3
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: "plan",
                    title: "Create your first task",
                    desc: "Go to Tasks and add a task to get started",
                    xp: 25,
                    done: hasPlanned,
                    href: "/app/tasks",
                    btnText: "Go to Tasks →",
                  },
                  {
                    id: "run",
                    title: "Complete your first focus block",
                    desc: "Start a 25-minute focus session with the timer",
                    xp: 50,
                    done: hasRun,
                    href: "/app/timer",
                    btnText: "Start Timer →",
                  },
                  {
                    id: "tick",
                    title: "Create a contract",
                    desc: "Swear and honor your first consistency contract",
                    xp: 25,
                    done: hasTicked,
                    href: "/app/contracts",
                    btnText: "View Contracts →",
                  },
                ].map(item => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between border border-warm-border/50 bg-warm-surface2/30 rounded-xl p-3.5 gap-3 transition duration-200 ${
                      item.done ? "opacity-45" : "hover:border-warm-amber/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          item.done
                            ? "bg-warm-teal border-warm-teal text-warm-bg"
                            : "border-warm-border text-warm-amber/60"
                        }`}
                      >
                        {item.done ? "✓" : "⚡"}
                      </div>
                      <div>
                        <h3 className={`font-quick font-bold text-xs text-warm-text ${item.done ? "line-through text-warm-textMuted" : ""}`}>
                          {item.title}
                        </h3>
                        <p className="font-sans text-[10px] text-warm-textMuted mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-mono text-[10px] text-warm-amber font-bold">
                        +{item.xp} XP
                      </span>
                      {!item.done && (
                        <Link
                          href={item.href}
                          className="rounded-full bg-warm-text/5 border border-warm-border text-warm-text px-3 py-1 text-[10px] font-quick font-bold hover:bg-warm-text/10 transition duration-200"
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
        </div>

        {/* ── COLUMN 2: WAR ROOM HERO (Center main area - col-span-6, order-1) ── */}
        <div className="col-span-12 lg:col-span-6 order-1 lg:order-2 space-y-6">
          
          {/* War Room Hero Card */}
          <section className="bg-[#1a1714] border border-[rgba(255,245,235,0.08)] rounded-2xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)] space-y-6">
            <div>
              <h1 className="font-space text-2xl font-semibold text-warm-cream leading-tight">
                Good {greetingLabel === "Good morning" ? "morning" : greetingLabel === "Good afternoon" ? "afternoon" : "evening"}, {name}.
              </h1>
              <p className="text-sm text-warm-textMuted mt-1">
                The realm awaits. Let's conquer the next battle.
              </p>
            </div>
            
            <div className="h-[1px] bg-[rgba(255,245,235,0.08)] w-full" />
            
            {recommendedMission ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-warm-amber">
                    Next Recommended Mission
                  </p>
                  <h3 className="font-space text-lg font-semibold text-warm-cream mt-1 leading-snug">
                    {recommendedMission.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                  {/* Time Cost Badge */}
                  <div className="flex flex-col">
                    <span className="text-xs text-warm-amber font-mono font-semibold">
                      ⏱ ~{recommendedMission.calibrated_estimate ?? recommendedMission.estimated_minutes ?? 30} min
                    </span>
                    <span className="text-[10px] text-warm-textMuted font-sans">
                      {recommendedMission.calibrated_estimate && recommendedMission.estimated_minutes && recommendedMission.calibrated_estimate !== recommendedMission.estimated_minutes
                        ? `(you usually estimate ${recommendedMission.estimated_minutes} min for this)`
                        : `(based on initial estimate)`}
                    </span>
                  </div>

                  {/* Deadline Badge */}
                  {(() => {
                    const deadline = getDeadlineState(recommendedMission.due_date);
                    if (!deadline) return null;
                    if (deadline.state === "today") {
                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20 animate-pulse self-start mt-0.5">
                          ● {deadline.label}
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-warm-amber/10 text-warm-amber border border-warm-amber/15 self-start mt-0.5">
                        ● {deadline.label}
                      </span>
                    );
                  })()}
                </div>

                <Link
                  href={`/app/timer?task=${recommendedMission.id}`}
                  className="btn-shimmer-sweep w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dim text-white font-quick font-bold text-sm py-4 hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all duration-300 active:scale-95 text-center block"
                >
                  ⚔️ Enter the Battle
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-warm-textMuted text-sm font-quick">
                All active quests are completed. Swear a new oath or rest up at the Hearth! 🛡️
              </div>
            )}
          </section>

          {/* Today's Battlefield Day Vessel Progress Bar */}
          <section className="bg-warm-surface border border-warm-border rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-warm-textMuted">Today's Battlefield</p>
              <h2 className="font-space font-bold text-base text-warm-cream mt-0.5">Day Vessel Capacity</h2>
            </div>

            <div className="space-y-2.5">
              <div className="h-3 w-full bg-[#0e0c0a] rounded-full overflow-hidden border border-warm-border/30">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isOvercapacity 
                      ? "bg-[#f87171] drop-shadow-[0_0_8px_rgba(248,113,113,0.4)] animate-pulse" 
                      : "bg-gradient-to-r from-[#a78bfa] to-[#f0a868]"
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-warm-textMuted font-mono">
                <span>{(plannedMinutes / 60).toFixed(1)}h planned</span>
                <span>{displayEnergyHours.toFixed(1)}h energy capacity</span>
              </div>
              
              {isOvercapacity && (
                <p className="text-[10px] text-[#f87171] font-quick font-semibold animate-pulse mt-1">
                  ⚠️ OVERCAPACITY: You have planned more quests than your remaining daily focus energy allows. Consider postponing some tasks!
                </p>
              )}
            </div>
          </section>

          {/* Quick Actions Shortcuts */}
          <section className="bg-warm-surface border border-warm-border rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-warm-textMuted">
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/app/timer" className="flex items-center gap-2 rounded-xl bg-warm-surface2 border border-warm-border p-3 text-xs font-bold text-warm-text hover:border-warm-amber/30 transition duration-200">
                ⏱️ Timer
              </Link>
              <Link href="/app/music" className="flex items-center gap-2 rounded-xl bg-warm-surface2 border border-warm-border p-3 text-xs font-bold text-warm-text hover:border-warm-amber/30 transition duration-200">
                🎵 Music
              </Link>
              <Link href="/app/coach" className="flex items-center gap-2 rounded-xl bg-warm-surface2 border border-warm-border p-3 text-xs font-bold text-warm-text hover:border-warm-amber/30 transition duration-200">
                🤖 AI Coach
              </Link>
              <Link href="/app/challenges" className="flex items-center gap-2 rounded-xl bg-warm-surface2 border border-warm-border p-3 text-xs font-bold text-warm-text hover:border-warm-amber/30 transition duration-200">
                🏆 Arena
              </Link>
            </div>
          </section>
        </div>

        {/* ── COLUMN 3: GAMIFICATION & STREAK (Right sidebar - col-span-3, order-3) ── */}
        <div className="col-span-12 lg:col-span-3 order-3 lg:order-3 space-y-6">
          
          {/* Card 1: The Familiar State */}
          <section className={`border rounded-2xl p-5 shadow-md flex gap-3.5 items-start transition duration-300 ${familiarMessage.style}`}>
            <span className="text-2xl shrink-0 mt-0.5">{familiarMessage.icon}</span>
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-warm-textMuted">
                Familiar State
              </h4>
              <p className="text-xs font-quick font-semibold leading-relaxed">
                {familiarMessage.text}
              </p>
            </div>
          </section>

          {/* Card 2: Quick Stats (Minimalist) */}
          <section className="bg-warm-surface border border-warm-border rounded-2xl p-5 shadow-md space-y-4">
            <h4 className="text-[9px] font-mono uppercase tracking-widest text-warm-textMuted">
              Command Metrics
            </h4>
            
            <div className="grid grid-cols-1 gap-3 font-space">
              <div className="flex items-center gap-3 bg-warm-surface2/60 border border-warm-border/50 rounded-xl p-3.5 hover:border-warm-amber/20 transition">
                <span className="text-2xl shrink-0">🔥</span>
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-warm-textMuted">Oath Streak</p>
                  <p className="text-sm font-semibold text-warm-amber">{streakDays > 0 ? `${streakDays} Day Streak` : "0 Days"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-warm-surface2/60 border border-warm-border/50 rounded-xl p-3.5 hover:border-warm-amber/20 transition">
                <span className="text-2xl shrink-0">⚡</span>
                <div>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-warm-textMuted">Focus Energy</p>
                  <p className="text-sm font-semibold text-warm-teal">{displayEnergyHours.toFixed(1)}h Remaining</p>
                </div>
              </div>
            </div>
          </section>

          {/* Active Mastery Path */}
          <section className="bg-warm-surface border border-warm-border rounded-2xl p-5 space-y-3 shadow-md">
            <h4 className="text-[9px] font-mono uppercase tracking-widest text-warm-purple">
              ACTIVE PATHWAY
            </h4>
            {primaryPath ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-space font-bold text-warm-text flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[primaryPath.category as keyof typeof CATEGORY_ICONS]}</span>
                    <span className="truncate max-w-[150px]">{primaryPath.title}</span>
                  </span>
                  <span className="font-mono text-[10px] text-warm-teal font-bold">
                    {primaryPath.percent}%
                  </span>
                </div>
                <div className="h-2 bg-warm-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warm-teal transition-all duration-700"
                    style={{ width: `${primaryPath.percent}%` }}
                  />
                </div>
                <p className="text-[9px] text-warm-textMuted font-mono uppercase mt-1">
                  Rank: {primaryPath.percent < 25 ? "Novice" :
                         primaryPath.percent < 50 ? "Apprentice" :
                         primaryPath.percent < 75 ? "Practitioner" :
                         primaryPath.percent < 100 ? "Specialist" :
                         "Master"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-warm-textMuted font-sans">
                No active paths.{" "}
                <Link href="/app/paths" className="text-warm-amber underline font-semibold">
                  Start a Path
                </Link>
                .
              </p>
            )}
          </section>

          {/* Demo Lab */}
          {!user && (
            <section className="relative overflow-hidden bg-gradient-to-br from-warm-purple/10 via-warm-surface to-warm-surface border border-warm-border rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-warm-purple">
                DEMO LAB
              </h4>
              <div className="flex justify-between items-center gap-2">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-warm-textMuted">Demo Practice</p>
                  <p className="text-xs font-quick font-bold text-warm-text mt-1">{totalXp} XP</p>
                </div>
                <button
                  onClick={() => {
                    awardXp(50, "demo");
                    fireConfetti();
                    bus.emit("pet:react", { message: "Practice completed! +50 XP!" });
                  }}
                  className="rounded-full bg-warm-purple text-warm-bg px-4 py-2 text-[10px] font-quick font-bold hover:shadow-[0_0_15px_rgba(167,139,250,0.4)] hover:scale-[1.02] transition duration-200"
                >
                  Earn Demo XP
                </button>
              </div>
            </section>
          )}

        </div>

      </div>
    </div>
  );
}

// ─── Morning Briefing Modal ───────────────────────────────────────────────────
function MorningBriefingModal({
  show,
  onDismiss,
  onPlanDay,
  todayTasks,
  thisWeekCount,
  availableFocusHours,
}: {
  show: boolean;
  onDismiss: () => void;
  onPlanDay: () => void;
  todayTasks: Task[];
  thisWeekCount: number;
  availableFocusHours: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="briefing-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0e0c0a]/80 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="briefing-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Morning briefing"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="pointer-events-auto w-full max-w-[480px] rounded-2xl border border-[rgba(255,245,235,0.08)] bg-[#1a1714] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
            >
              {/* Header */}
              <div className="mb-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#f0a868]/70 mb-1">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <h2 className="font-cinzel text-xl font-bold text-[#f5efe8]">
                  Your Morning Briefing
                </h2>
                <p className="mt-1 text-xs font-quick text-[rgba(245,239,232,0.45)] italic">
                  A knight who knows the battlefield wins before the fight begins.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Today's tasks */}
                <div className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/5 px-4 py-3">
                  <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-[#f87171] mb-1.5">
                    ● Due Today
                  </p>
                  {todayTasks.length === 0 ? (
                    <p className="text-sm font-quick text-[rgba(245,239,232,0.45)]">No tasks due today ✓</p>
                  ) : (
                    <ul className="space-y-1">
                      {todayTasks.slice(0, 3).map((t) => (
                        <li key={t.id} className="text-sm font-quick font-semibold text-[#f5efe8] flex items-center gap-2">
                          <span className="text-[#f87171]">&rsaquo;</span> {t.title}
                        </li>
                      ))}
                      {todayTasks.length > 3 && (
                        <li className="text-xs font-quick text-[rgba(245,239,232,0.45)]">
                          +{todayTasks.length - 3} more tasks due today
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* This week */}
                <div className="rounded-xl border border-[#f0a868]/20 bg-[#f0a868]/5 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-quick text-[rgba(245,239,232,0.7)]">
                    Tasks due this week
                  </p>
                  <span className="font-mono font-bold text-[#f0a868]">{thisWeekCount}</span>
                </div>

                {/* Available focus hours */}
                <div className="rounded-xl border border-[rgba(255,245,235,0.07)] bg-[rgba(255,245,235,0.03)] px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-quick text-[rgba(245,239,232,0.7)]">
                    Available focus hours today
                  </p>
                  <span className="font-mono font-bold text-[#5eead4]">{availableFocusHours}h</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  autoFocus
                  onClick={onPlanDay}
                  className="flex-1 rounded-xl bg-[#f0a868] py-2.5 text-sm font-quick font-bold text-[#0e0c0a] hover:shadow-[0_0_20px_rgba(240,168,104,0.2)] transition"
                >
                  Plan my day →
                </button>
                <button
                  onClick={onDismiss}
                  className="rounded-xl border border-[rgba(255,245,235,0.08)] px-4 py-2.5 text-sm font-quick text-[rgba(245,239,232,0.45)] hover:text-[rgba(245,239,232,0.7)] transition"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
