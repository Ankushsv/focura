"use client";

import { useEffect, useState } from "react";
import { useXp } from "@/components/providers/XpProvider";
import { createClient } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { 
  IconCircleCheck, 
  IconShield, 
  IconHourglass, 
  IconFlame, 
  IconCalendar, 
  IconChevronRight, 
  IconTrendingUp, 
  IconClock, 
  IconChartBar,
  IconBrain,
  IconHistory
} from "@tabler/icons-react";
import type { Task } from "@/lib/tasks/types";
import type { FocusSession } from "@/lib/sessions";

type DayBar = { label: string; minutes: number };

function relativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function formatFocusTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function StatsPage() {
  const { totalXp } = useXp();
  const { tasks, loaded: tasksLoaded } = useTasks();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [weekBars, setWeekBars] = useState<DayBar[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch sessions
        const { data: dbSessions } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("ended_at", { ascending: false });

        const parsedSessions: FocusSession[] = (dbSessions || []).map((s: any) => ({
          id: s.id,
          taskId: s.task_id,
          taskTitle: s.task_title || "Free focus",
          plannedMinutes: s.planned_minutes,
          actualMinutes: s.actual_minutes,
          endedAt: s.ended_at ? new Date(s.ended_at).getTime() : Date.now(),
        }));
        setSessions(parsedSessions);

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const bars: DayBar[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const start = d.getTime();
          const end = start + 86_400_000;
          const dayMinutes = parsedSessions
            .filter((s) => s.endedAt >= start && s.endedAt < end)
            .reduce((acc, s) => acc + s.actualMinutes, 0);
          bars.push({ label: dayNames[d.getDay()], minutes: dayMinutes });
        }
        setWeekBars(bars);
      } catch (err) {
        console.warn("Failed to load sessions for stats:", err);
      } finally {
        setLoaded(true);
      }
    }
    loadSessions();
  }, [tasksLoaded]);

  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.actualMinutes, 0);
  const doneTasks = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;
  const recentSessions = [...sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 5);

  const tasksWithDifficulty = tasks.filter(
    (t) => t.difficultyBefore != null && t.difficultyAfter != null
  );
  const avgBefore =
    tasksWithDifficulty.length > 0
      ? tasksWithDifficulty.reduce((acc, t) => acc + (t.difficultyBefore ?? 0), 0) /
        tasksWithDifficulty.length
      : null;
  const avgAfter =
    tasksWithDifficulty.length > 0
      ? tasksWithDifficulty.reduce((acc, t) => acc + (t.difficultyAfter ?? 0), 0) /
        tasksWithDifficulty.length
      : null;

  const maxBarMinutes = Math.max(...weekBars.map((b) => b.minutes), 1);

  // Achievement computations
  const longestSession = sessions.length > 0 ? Math.max(...sessions.map((s) => s.actualMinutes)) : 0;
  const mostProductiveDay = weekBars.reduce((max, b) => (b.minutes > max.minutes ? b : max), { label: "—", minutes: 0 });

  if (!loaded || !tasksLoaded)
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-bg text-warm-text">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-warm-amber border-t-transparent" />
          <p className="text-sm text-warm-textMuted font-quick italic">Consulting your focus stats…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-warm-bg text-warm-text px-4 py-8 md:px-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-warm-amber/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-warm-purple/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-warm-teal/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1400px] w-full space-y-8">

        {/* HERO BANNER - STATS & INSIGHTS */}
        <div className="relative overflow-hidden rounded-3xl border border-warm-border bg-gradient-to-br from-warm-amber/10 via-warm-surface to-warm-surface2 p-8 shadow-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-warm-amber/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-warm-purple/5 blur-2xl" />
          </div>

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: XP counter */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-warm-textMuted font-space">
                XP Accumulated
              </p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">⚡</span>
                <div className="bg-gradient-to-r from-warm-amber via-amber-200 to-yellow-100 bg-clip-text text-6xl font-black text-transparent leading-none font-space">
                  {totalXp.toLocaleString()}
                </div>
              </div>
              <p className="mt-2 text-xs text-warm-textMuted font-quick italic">Your total focus score across all tasks and sessions</p>
            </div>

            {/* Right: metric pills */}
            <div className="flex flex-wrap gap-3 font-space">
              <div className="flex items-center gap-3 rounded-2xl border border-warm-teal/20 bg-warm-teal/5 px-4 py-3 shadow-sm">
                <IconHourglass className="text-warm-teal" size={24} />
                <div>
                  <p className="text-lg font-bold text-warm-cream leading-tight">{formatFocusTime(totalFocusMinutes)}</p>
                  <p className="text-[10px] text-warm-textMuted uppercase tracking-wide">Hours Focused</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-warm-purple/20 bg-warm-purple/5 px-4 py-3 shadow-sm">
                <IconCircleCheck className="text-warm-purple" size={24} />
                <div>
                  <p className="text-lg font-bold text-warm-cream leading-tight">{doneTasks}</p>
                  <p className="text-[10px] text-warm-textMuted uppercase tracking-wide">Tasks Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-warm-border bg-warm-surface2 px-4 py-3 shadow-sm">
                <IconShield className="text-warm-amber" size={24} />
                <div>
                  <p className="text-lg font-bold text-warm-cream leading-tight">{sessions.length}</p>
                  <p className="text-[10px] text-warm-textMuted uppercase tracking-wide">Sessions Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WEEKLY CHART + COMPLETION RATE RING */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly focus chart ── spans 2 cols */}
          <div className="col-span-1 lg:col-span-2 rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-space text-sm text-warm-cream flex items-center gap-2">
                <IconChartBar size={18} className="text-warm-amber" />
                Weekly Focus Logs
              </h2>
              <span className="text-xs text-warm-textMuted font-quick italic">Last 7 days</span>
            </div>

            <div className="flex items-end justify-between gap-2 px-1" style={{ height: "160px" }}>
              {weekBars.map((bar, i) => {
                const pct = bar.minutes / maxBarMinutes;
                const barH = Math.max(Math.round(pct * 120), bar.minutes > 0 ? 8 : 4);
                const isToday = i === 6;
                return (
                  <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative flex w-full flex-col items-center justify-end" style={{ height: "130px" }}>
                      {bar.minutes > 0 && (
                        <span className="mb-1.5 text-[10px] font-bold text-warm-amber font-mono tabular-nums">{bar.minutes}m</span>
                      )}
                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-700 ${
                          isToday
                            ? "bg-gradient-to-t from-warm-amber to-warm-purple shadow-md shadow-warm-amber/25"
                            : bar.minutes > 0
                            ? "bg-gradient-to-t from-warm-purple/50 to-warm-purple/10 border-t border-warm-purple/35"
                            : "bg-warm-surface2 border border-warm-border"
                        }`}
                        style={{ height: `${barH}px` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold font-space ${
                        isToday ? "text-warm-amber" : "text-warm-textMuted"
                      }`}
                    >
                      {bar.label}
                      {isToday && <span className="ml-0.5 text-[8px] text-warm-amber">●</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {sessions.length === 0 && (
              <p className="mt-4 text-center text-xs text-warm-textMuted font-quick italic">
                Start a focus block to log your first session! ⏱️
              </p>
            )}
          </div>

          {/* Completion Rate ring */}
          <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 flex flex-col items-center justify-center shadow-md">
            <h2 className="mb-5 text-center font-space text-sm text-warm-cream flex items-center gap-2">
              <IconTrendingUp size={18} className="text-warm-teal" />
              Completion Rate
            </h2>
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-warm-border bg-warm-surface2 shadow-inner">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="var(--color-warm-teal)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - (totalTasks > 0 ? doneTasks / totalTasks : 0))}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: "drop-shadow(0 0 4px rgba(94, 234, 212, 0.3))" }}
                />
              </svg>
              <div className="z-10 text-center font-space">
                <div className="text-2xl font-black text-warm-cream leading-none">
                  {totalTasks === 0 ? "0%" : `${Math.round((doneTasks / totalTasks) * 100)}%`}
                </div>
                <div className="text-[10px] text-warm-textMuted uppercase tracking-widest mt-1">
                  {doneTasks} / {totalTasks}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-warm-textMuted font-quick italic">
              {totalTasks === 0
                ? "No tasks created on your board yet."
                : `${doneTasks} of ${totalTasks} tasks completed.`}
            </p>
          </div>
        </div>

        {/* DIFFICULTY + FOCUS HISTORY */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Difficulty calibration */}
          <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-md">
            <h2 className="mb-4 font-space text-sm text-warm-cream flex items-center gap-2">
              <IconBrain size={18} className="text-warm-purple" />
              Anticipation vs Reality (Task Difficulty)
            </h2>
            {avgBefore !== null && avgAfter !== null ? (
              <div className="space-y-5">
                <p className="text-xs text-warm-textMuted font-space">
                  Based on {tasksWithDifficulty.length} rated task{tasksWithDifficulty.length !== 1 ? "s" : ""}
                </p>

                <div className="space-y-4 font-space">
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-warm-textMuted">Your Anticipation (Expected Difficulty)</span>
                      <span className="font-bold text-warm-amber">{avgBefore.toFixed(1)} / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-warm-surface2 border border-warm-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-warm-amber to-orange-500 transition-all duration-700"
                        style={{ width: `${(avgBefore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-warm-textMuted">Your Reality (Actual Difficulty)</span>
                      <span className="font-bold text-warm-teal">{avgAfter.toFixed(1)} / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-warm-surface2 border border-warm-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-warm-teal to-teal-300 transition-all duration-700"
                        style={{ width: `${(avgAfter / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-warm-border bg-warm-surface2/60 p-4">
                  <p className="text-xs leading-relaxed text-warm-textMuted font-quick italic">
                    {avgAfter < avgBefore
                      ? "🎯 The tasks in your mind seemed larger than they actually were! Work is easier than expected."
                      : avgAfter > avgBefore
                      ? "💡 The tasks were tougher than expected. Try breaking them down into smaller focus target blocks."
                      : "✨ Your estimation of task difficulty is perfectly calibrated."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-border bg-warm-surface2 text-4xl">
                  <IconBrain size={32} className="text-warm-textMuted" />
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-cream font-space">No calibration records</p>
                  <p className="mt-1 text-xs text-warm-textMuted font-quick italic">
                    Rate task difficulty before and after sessions to compile calibration counsel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Session History — timeline style */}
          <div className="rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-md">
            <h2 className="mb-4 font-space text-sm text-warm-cream flex items-center gap-2">
              <IconHistory size={18} className="text-warm-amber" />
              Focus Session History
            </h2>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-border bg-warm-surface2 text-4xl">
                  <IconClock size={32} className="text-warm-textMuted" />
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-cream font-space">No focus sessions logged yet</p>
                  <p className="mt-1 text-xs text-warm-textMuted font-quick italic">
                    Add a task and start a focus session to see history here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative space-y-0">
                {/* Vertical timeline line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gradient-to-b from-warm-amber/40 via-warm-border to-transparent" />
                <div className="space-y-4 pl-10">
                  {recentSessions.map((s, idx) => {
                    const variance = s.actualMinutes - s.plannedMinutes;
                    return (
                      <div key={s.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 border-warm-surface ${
                          idx === 0 ? "bg-warm-teal" : "bg-warm-purple/60"
                        }`} />

                        <div className="rounded-xl border border-warm-border bg-warm-surface2/40 p-3 transition-all hover:border-warm-amber/20 hover:bg-warm-surface2/70">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm font-bold text-warm-cream font-space">
                              {s.taskTitle}
                            </p>
                            <span className="shrink-0 text-xs text-warm-textMuted font-space">{relativeDate(s.endedAt)}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 font-space">
                            <span className="text-xs text-warm-textMuted">{s.plannedMinutes}m plan</span>
                            <span className="text-warm-border">·</span>
                            <span
                              className={`text-xs font-bold ${
                                variance > 0
                                  ? "text-warm-amber"
                                  : variance < 0
                                  ? "text-warm-teal"
                                  : "text-warm-textMuted"
                              }`}
                            >
                              {s.actualMinutes}m focus
                            </span>
                            {variance !== 0 && (
                              <span className={`text-[10px] ${variance < 0 ? "text-warm-teal" : "text-warm-amber"} font-mono`}>
                                ({variance > 0 ? "+" : ""}{variance}m)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* METRIC CARDS ROW */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <IconFlame className="text-warm-amber" size={24} />,
              label: "Longest Session",
              value: longestSession > 0 ? formatFocusTime(longestSession) : "—",
              sub: longestSession > 0 ? "Personal best duration" : "No sessions logged",
              color: "from-warm-amber/10 to-warm-surface2",
              border: "border-warm-amber/20",
              textColor: "text-warm-amber",
            },
            {
              icon: <IconCalendar className="text-warm-purple" size={24} />,
              label: "Peak Day",
              value: mostProductiveDay.minutes > 0 ? mostProductiveDay.label : "—",
              sub: mostProductiveDay.minutes > 0 ? `${mostProductiveDay.minutes}m in focus` : "No data this week",
              color: "from-warm-purple/15 to-warm-surface2",
              border: "border-warm-purple/20",
              textColor: "text-warm-purple",
            },
            {
              icon: <IconCircleCheck className="text-warm-teal" size={24} />,
              label: "Total Tasks Completed",
              value: doneTasks > 0 ? String(doneTasks) : "—",
              sub: doneTasks > 0 ? `out of ${totalTasks} tasks` : "Complete your first task",
              color: "from-warm-teal/15 to-warm-surface2",
              border: "border-warm-teal/20",
              textColor: "text-warm-teal",
            },
          ].map((ach) => (
            <div
              key={ach.label}
              className={`relative overflow-hidden rounded-2xl border ${ach.border} bg-gradient-to-br ${ach.color} p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm-surface2 border border-warm-border">
                  {ach.icon}
                </div>
              </div>
              <div className="mt-4 font-space">
                <p className={`text-2xl font-black ${ach.textColor}`}>{ach.value}</p>
                <p className="mt-0.5 text-xs font-bold text-warm-cream">{ach.label}</p>
                <p className="mt-1 text-[10px] text-warm-textMuted font-quick italic leading-none">{ach.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
