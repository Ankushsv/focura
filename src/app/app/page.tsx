"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import RitualOverlay from "@/components/ritual/RitualOverlay";
import { useStuckDetection } from "@/hooks/useStuckDetection";
import { logUserEvent } from "@/lib/userEvents";
import { useTimer } from "@/components/providers/TimerProvider";

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
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const { totalXp, level, awardXp } = useXp();
  const { activePet, petStats, petUsage, feedPet } = usePet();
  const { show: showBriefing, dismiss: dismissBriefing } = useMorningBriefing();
  const router = useRouter();
  const searchParams = useSearchParams();
  const progress = levelProgress(totalXp);
  const pct = Math.round((progress.current / progress.required) * 100);
  const timerContext = useTimer();

  // ── Ritual State ──
  const [showRitual, setShowRitual] = useState(false);
  const [ritualTask, setRitualTask] = useState<string | undefined>(undefined);
  const { shouldTrigger: stuckTrigger } = useStuckDetection();

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

  // ── Log app_opened + check URL params for ritual trigger ──
  useEffect(() => {
    logUserEvent("app_opened");

    // Check if redirected here with ?ritual=true
    const ritualParam = searchParams.get("ritual");
    const taskParam = searchParams.get("task");
    if (ritualParam === "true") {
      setRitualTask(taskParam || undefined);
      setShowRitual(true);
    }
  }, [searchParams]);

  // ── Stuck detection auto-trigger ──
  useEffect(() => {
    if (stuckTrigger && !showRitual) {
      setShowRitual(true);
    }
  }, [stuckTrigger, showRitual]);

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
        icon: "🙂",
        text: "Feeling good and ready to focus alongside you.",
        style: "border-warm-amber/20 bg-warm-amber/5 text-warm-cream",
      };
    } else if (energy < 30) {
      return {
        icon: "😴",
        text: "Running a little low — a short break would help.",
        style: "border-red-500/20 bg-red-500/5 text-red-200",
      };
    }
    return {
      icon: "🙂",
      text: "Here whenever you're ready to get started.",
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

  // Small solid dot color per priority (replaces emoji indicators)
  const priorityColor = (p: string) =>
    p === "critical" ? "#f43f5e" : p === "high" ? "#f97316" : "#38bdf8";

  const theOneThing = useMemo(() => {
    // 1. Session active
    if (timerContext.running && timerContext.taskId) {
      const activeSessionTask = tasks.find(t => t.id === timerContext.taskId);
      return {
        text: `Currently in battle: ${activeSessionTask?.title || "Focus Session"}`,
        btnText: "Return to Timer →",
        href: `/app/timer?task=${timerContext.taskId}`
      };
    }
    
    // 2. Main quest set and not done
    const actualMainQuest = tasks.find(t => !t.done && (t as any).is_main_quest === true);
    if (actualMainQuest) {
      const totalHp = (actualMainQuest.subtasks || []).reduce((sum: number, s: any) => sum + s.xp, 0);
      const remainingHp = (actualMainQuest.subtasks || []).filter((s: any) => !s.done).reduce((sum: number, s: any) => sum + s.xp, 0);
      const hpStr = actualMainQuest.isBoss && totalHp > 0 ? ` · ${remainingHp} HP remaining` : "";
      return {
        text: `${actualMainQuest.title}${hpStr}`,
        btnText: "Continue →",
        href: `/app/timer?task=${actualMainQuest.id}`
      };
    }

    // 3. Tasks due today
    if (todayTasks.length > 0) {
      return {
        text: `Due today: ${todayTasks[0].title}`,
        btnText: "Start this →",
        href: `/app/timer?task=${todayTasks[0].id}`
      };
    }

    // 4. Recommended / AI pick
    if (recommendedMission) {
      return {
        text: `${recommendedMission.title} · Recommended`,
        btnText: "Start →",
        href: `/app/timer?task=${recommendedMission.id}`
      };
    }

    return null;
  }, [timerContext.running, timerContext.taskId, tasks, todayTasks, recommendedMission]);

  return (
    <>
    {/* ── Ritual Overlay ── */}
    <AnimatePresence>
      {showRitual && (
        <RitualOverlay
          initialTask={ritualTask}
          onClose={() => { setShowRitual(false); setRitualTask(undefined); }}
        />
      )}
    </AnimatePresence>

    <div className={`mx-auto max-w-[1120px] w-full px-4 sm:px-8 py-2 space-y-8 animate-fade-in transition-opacity duration-500 ${showRitual ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      {/* ── Painting backdrop (Van Gogh · The Starry Night, public domain) ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-[3px] opacity-[0.28] animate-painting-drift"
          style={{ backgroundImage: "url('/starry-night.jpg')" }}
        />
        {/* Readability + color-harmony wash over the painting */}
        <div className="absolute inset-0 bg-gradient-to-b from-warm-bg/85 via-warm-bg/70 to-warm-bg/90" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_0%,rgba(14,12,10,0.35)_100%)]" />
      </div>

      {/* ── Morning Briefing Modal ── */}
      <MorningBriefingModal
        show={showBriefing}
        onDismiss={dismissBriefing}
        onPlanDay={() => { dismissBriefing(); router.push("/app/timeline"); }}
        todayTasks={todayTasks}
        thisWeekCount={thisWeekTasks.length}
        availableFocusHours={availableFocusHours}
      />

      {/* ── The One Thing Strip ── */}
      {theOneThing && (
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-realm-border bg-warm-surface/20 px-5 py-3.5 rounded-xl backdrop-blur-sm animate-fade-in relative z-20">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-realm-gold animate-pulse shrink-0" />
            <p className="text-xs font-bold text-warm-text tracking-wide uppercase font-space mr-1 shrink-0">
              The One Thing
            </p>
            <span className="text-warm-border/60 hidden sm:inline">|</span>
            <p className="text-sm text-warm-text font-medium truncate">
              {theOneThing.text}
            </p>
          </div>
          <Link
            href={theOneThing.href}
            className="self-start sm:self-auto rounded-lg border border-realm-border/80 hover:border-realm-gold hover:text-realm-gold text-warm-text px-4 py-1.5 text-xs font-bold transition-all duration-200 shrink-0 font-quick"
          >
            {theOneThing.btnText}
          </Link>
        </div>
      )}

      {/* ── TOP BAR: greeting + date + level ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-card-rise">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-warm-textMuted">
            {currentDate}
          </p>
          <h1 className="font-space text-2xl sm:text-3xl font-bold text-warm-text tracking-tight">
            {greetingLabel}, <span className="bg-gradient-to-r from-warm-amber to-warm-cream bg-clip-text text-transparent">{name}</span>
          </h1>
        </div>

        {/* Level chip */}
        <div className="flex items-center gap-3 bg-warm-surface/60 backdrop-blur-md border border-warm-border rounded-2xl px-4 py-3 shrink-0 shadow-lg shadow-black/20">
          <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-warm-border)" strokeWidth="2.5" />
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
          <div className="leading-tight">
            <p className="text-xs font-medium text-warm-text">Level {level}</p>
            <p className="text-xs text-warm-textMuted mt-0.5">{pct}% · {totalXp} XP</p>
          </div>
        </div>
      </header>

      {/* ── MAIN + SIDEBAR GRID ── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">

        {/* ── MAIN COLUMN (focal point) ── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Focus next — the single clear thing to do */}
          <section className="relative overflow-hidden bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl shadow-black/25 animate-card-rise" style={{ animationDelay: "0.05s" }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-warm-amber/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-warm-teal/10 blur-3xl" />
            <p className="relative text-xs font-semibold uppercase tracking-wider text-warm-amber">
              Focus next
            </p>

            {recommendedMission ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-2 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: priorityColor(recommendedMission.priority) }}
                  />
                  <h2 className="font-space text-xl sm:text-2xl font-semibold text-warm-text leading-snug">
                    {recommendedMission.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-warm-textMuted font-mono">
                    ~{recommendedMission.calibrated_estimate ?? recommendedMission.estimated_minutes ?? 30} min
                  </span>
                  {(() => {
                    const deadline = getDeadlineState(recommendedMission.due_date);
                    if (!deadline) return null;
                    const isToday = deadline.state === "today";
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                        style={{
                          color: isToday ? "#f87171" : "var(--color-warm-amber)",
                          borderColor: isToday ? "rgba(248,113,113,0.25)" : "rgba(240,168,104,0.25)",
                          backgroundColor: isToday ? "rgba(248,113,113,0.08)" : "rgba(240,168,104,0.08)",
                        }}
                      >
                        {deadline.label}
                      </span>
                    );
                  })()}
                </div>

                {(() => {
                  const recEstimate = recommendedMission.calibrated_estimate ?? recommendedMission.estimated_minutes ?? 30;
                  const recFocused = recommendedMission.actual_minutes_history?.reduce((a, b: number) => a + b, 0) || 0;
                  const recIsCurrent = timerContext.taskId === recommendedMission.id;
                  const recIsRunning = timerContext.running && timerContext.stage === "session" && !timerContext.isBreakMode;
                  const recLiveMins = (recIsCurrent && recIsRunning) ? (timerContext.elapsed / 60) : 0;
                  const recCurrentFocused = recFocused + recLiveMins;
                  
                  const recDisplayPercent = recEstimate ? Math.round((recCurrentFocused / recEstimate) * 100) : 0;
                  const recBarPercent = recEstimate ? Math.min(100, Math.round((recCurrentFocused / recEstimate) * 100)) : 0;

                  return (
                    <div className="w-full space-y-1 mt-1 pb-2">
                      <div className="flex justify-between items-center text-[11px] font-mono text-warm-textMuted">
                        <span>Focus Progress</span>
                        <span className={recDisplayPercent >= 100 ? "text-warm-teal font-bold" : "text-warm-amber font-bold"}>
                          {recDisplayPercent}% ({Math.round(recCurrentFocused * 10) / 10} / {recEstimate}m)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-warm-surface2 border border-warm-border rounded-full overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-warm-amber to-[#f87171]"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${recBarPercent}%`,
                            boxShadow: recIsCurrent && recIsRunning 
                              ? [
                                  "0 0 4px rgba(240, 168, 104, 0.4)",
                                  "0 0 12px rgba(240, 168, 104, 0.8)",
                                  "0 0 4px rgba(240, 168, 104, 0.4)"
                                ]
                              : "0 0 0px rgba(0,0,0,0)"
                          }}
                          transition={{ 
                            width: { type: "spring", stiffness: 80, damping: 15 },
                            boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <motion.div
                  animate={!timerContext.running ? {
                    boxShadow: [
                      '0 0 12px rgba(232,151,90,0.2)',
                      '0 0 24px rgba(232,151,90,0.4)',
                      '0 0 12px rgba(232,151,90,0.2)'
                    ]
                  } : {}}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="rounded-xl overflow-hidden"
                >
                  <Link
                    href={`/app/timer?task=${recommendedMission.id}`}
                    className="group relative w-full flex items-center justify-center gap-2 overflow-hidden bg-warm-amber text-warm-bg font-quick font-bold text-base py-4 text-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                  >
                    {/* light sweep on hover */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2">
                      Start focus
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-warm-textMuted text-sm">
                  Nothing queued right now. You're all caught up.
                </p>
                <Link
                  href="/app/tasks"
                  className="inline-block rounded-xl bg-primary hover:bg-primary-dim text-white font-quick font-bold text-sm px-6 py-3 transition-colors duration-200"
                >
                  Add a task
                </Link>
              </div>
            )}
          </section>

          {/* Tasks list */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-4 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-space font-semibold text-lg text-warm-text">Tasks</h2>
              <Link href="/app/tasks" className="text-sm text-warm-amber hover:underline font-medium">
                View all →
              </Link>
            </div>

            <div className="space-y-2.5">
              {activeTasks.length === 0 ? (
                <div className="border border-dashed border-warm-border bg-warm-surface2/30 rounded-xl p-8 text-center">
                  <p className="text-sm text-warm-textMuted">No active tasks right now.</p>
                  <Link href="/app/tasks" className="text-sm text-warm-amber underline font-medium mt-2 inline-block">
                    Create your first task
                  </Link>
                </div>
              ) : (
                activeTasks.slice(0, 5).map(task => {
                  const deadline = getDeadlineState(task.due_date);
                  return (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between gap-3 border border-warm-border/60 bg-warm-surface2/40 rounded-xl p-4 transition-all duration-200 hover:border-warm-amber/30 hover:bg-warm-surface2/70 hover:translate-x-0.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: priorityColor(task.priority) }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm text-warm-text truncate">{task.title}</h4>
                          <span className="text-xs text-warm-textMuted mt-0.5 block truncate">
                            {deadline ? deadline.label : `${task.energy} energy · +${task.xp} XP`}
                          </span>
                          {(() => {
                            const est = task.calibrated_estimate ?? task.estimated_minutes;
                            if (est == null || est <= 0) return null;

                            const histFocused = task.actual_minutes_history?.reduce((a, b: number) => a + b, 0) || 0;
                            const isCur = timerContext.taskId === task.id;
                            const isRun = timerContext.running && timerContext.stage === "session" && !timerContext.isBreakMode;
                            const liveMins = (isCur && isRun) ? (timerContext.elapsed / 60) : 0;
                            const totalCurFocused = histFocused + liveMins;
                            
                            const dispPct = Math.round((totalCurFocused / est) * 100);
                            const barPct = Math.min(100, Math.round((totalCurFocused / est) * 100));

                            return (
                              <div className="mt-2 w-48 sm:w-64 space-y-0.5">
                                <div className="flex justify-between items-center text-[9px] font-mono text-warm-textMuted">
                                  <span>Focus: {dispPct}%</span>
                                  <span>{Math.round(totalCurFocused * 10) / 10} / {est}m</span>
                                </div>
                                <div className="h-1 w-full bg-warm-surface border border-warm-border rounded-full overflow-hidden relative">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-warm-amber to-[#f87171]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barPct}%` }}
                                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <Link
                        href={`/app/timer?task=${task.id}`}
                        className="rounded-lg border border-warm-border bg-warm-surface hover:border-warm-amber/40 hover:text-warm-amber text-warm-text px-4 py-2 text-xs font-medium transition-colors duration-200 shrink-0"
                      >
                        Focus
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Today's capacity */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-4 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-space font-semibold text-lg text-warm-text">Today's capacity</h2>
              <span className="text-sm text-warm-textMuted font-mono">
                {(plannedMinutes / 60).toFixed(1)}h / {displayEnergyHours.toFixed(1)}h
              </span>
            </div>

            <div className="h-2.5 w-full bg-warm-surface2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isOvercapacity
                    ? "bg-gradient-to-r from-[#f0a868] to-[#f87171] shadow-[0_0_12px_rgba(248,113,113,0.4)]"
                    : "bg-gradient-to-r from-warm-teal via-warm-amber to-warm-cream shadow-[0_0_12px_rgba(240,168,104,0.3)]"
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>

            <p className="text-sm text-warm-textMuted">
              {isOvercapacity
                ? "You've planned more than fits in your remaining focus time today. Consider moving a task to tomorrow."
                : `${displayEnergyHours.toFixed(1)}h of focus time left today.`}
            </p>
          </section>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Today stats */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-3 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Today</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-warm-surface2/50 border border-warm-border/60 rounded-xl p-4 transition-colors duration-200 hover:border-warm-amber/30">
                <p className="text-xs text-warm-textMuted">Streak</p>
                <p className="text-2xl font-mono font-semibold text-warm-amber mt-1">{streakDays}</p>
                <p className="text-xs text-warm-textMuted mt-0.5">{streakDays === 1 ? "day" : "days"}</p>
              </div>
              <div className="bg-warm-surface2/50 border border-warm-border/60 rounded-xl p-4 transition-colors duration-200 hover:border-warm-amber/30">
                <p className="text-xs text-warm-textMuted">Focus left</p>
                <p className="text-2xl font-mono font-semibold text-warm-amber mt-1">{displayEnergyHours.toFixed(1)}</p>
                <p className="text-xs text-warm-textMuted mt-0.5">hours</p>
              </div>
            </div>
          </section>

          {/* Companion */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 flex gap-4 items-start shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.25s" }}>
            <span className="text-3xl shrink-0" aria-hidden>{activePet?.emoji ?? "🦉"}</span>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Companion</h3>
              <p className="text-sm text-warm-text leading-relaxed">{familiarMessage.text}</p>
            </div>
          </section>

          {/* Active path */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-3 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Active path</h3>
            {primaryPath ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-sm text-warm-text flex items-center gap-2 min-w-0">
                    <span aria-hidden>{CATEGORY_ICONS[primaryPath.category as keyof typeof CATEGORY_ICONS]}</span>
                    <span className="truncate">{primaryPath.title}</span>
                  </span>
                  <span className="font-mono text-sm text-warm-teal/40 font-semibold shrink-0">
                    {primaryPath.percent}%
                  </span>
                </div>
                <div className="h-2 bg-warm-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warm-teal/40 transition-all duration-700"
                    style={{ width: `${primaryPath.percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-warm-textMuted">
                No active paths.{" "}
                <Link href="/app/paths" className="text-warm-amber underline font-medium">
                  Start one
                </Link>
              </p>
            )}
          </section>

          {/* Get started */}
          {!quickstartDismissed && !quickstartCompleted && (
            <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-4 relative shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.35s" }}>
              <button
                onClick={dismissQuickstart}
                className="absolute top-5 right-5 text-warm-textMuted hover:text-warm-text transition-colors text-xs font-medium"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Get started</h3>
                <p className="text-sm text-warm-text mt-1">{completedCount} of 3 done</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: "plan", title: "Create your first task", done: hasPlanned, href: "/app/tasks", btnText: "Go to Tasks" },
                  { id: "run", title: "Complete a focus session", done: hasRun, href: "/app/timer", btnText: "Start timer" },
                  { id: "tick", title: "Create a contract", done: hasTicked, href: "/app/contracts", btnText: "View contracts" },
                ].map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 border border-warm-border/60 bg-warm-surface2/30 rounded-xl p-3.5 ${item.done ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                          item.done ? "bg-warm-teal border-warm-teal text-warm-bg" : "border-warm-border text-warm-textMuted"
                        }`}
                      >
                        {item.done ? "✓" : ""}
                      </div>
                      <h4 className={`text-sm text-warm-text truncate ${item.done ? "line-through text-warm-textMuted" : ""}`}>
                        {item.title}
                      </h4>
                    </div>
                    {!item.done && (
                      <Link
                        href={item.href}
                        className="rounded-lg border border-warm-border text-warm-text px-3 py-1.5 text-xs font-medium hover:border-warm-amber/40 hover:text-warm-amber transition-colors duration-200 shrink-0"
                      >
                        {item.btnText}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick shortcuts */}
          <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-3 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { href: "/app/timer", label: "Timer" },
                { href: "/app/music", label: "Music" },
                { href: "/app/coach", label: "AI Coach" },
                { href: "/app/challenges", label: "Challenges" },
              ].map(s => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-xl bg-warm-surface2/50 border border-warm-border/60 px-3 py-3 text-sm font-medium text-warm-text hover:border-warm-amber/40 hover:text-warm-amber hover:-translate-y-0.5 transition-all duration-200 text-center"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Demo Lab */}
          {!user && (
            <section className="bg-warm-surface/70 backdrop-blur-md border border-warm-border rounded-2xl p-6 space-y-3 shadow-lg shadow-black/20 animate-card-rise" style={{ animationDelay: "0.45s" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-textMuted">Demo</h3>
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm text-warm-text">{totalXp} XP earned</p>
                <button
                  onClick={() => {
                    awardXp(50, "demo");
                    fireConfetti();
                    bus.emit("pet:react", { message: "Practice completed! +50 XP!" });
                  }}
                  className="rounded-lg bg-warm-purple text-warm-bg px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity duration-200"
                >
                  Earn demo XP
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
    </>
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
                <h2 className="font-space text-xl font-bold text-[#f5efe8]">
                  Good morning
                </h2>
                <p className="mt-1 text-sm font-quick text-[rgba(245,239,232,0.55)]">
                  Here's a quick look at your day before you start.
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
