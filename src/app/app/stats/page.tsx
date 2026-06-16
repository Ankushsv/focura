"use client";

import { useEffect, useState } from "react";
import { useXp } from "@/components/providers/XpProvider";
import { 
  IconSword, 
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
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekBars, setWeekBars] = useState<DayBar[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const rawSessions = localStorage.getItem("focura.sessions.v1");
      const rawTasks = localStorage.getItem("focura.tasks.v1");
      const parsedSessions: FocusSession[] = rawSessions ? JSON.parse(rawSessions) : [];
      const parsedTasks: Task[] = rawTasks ? JSON.parse(rawTasks) : [];
      setSessions(parsedSessions);
      setTasks(parsedTasks);

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
    } catch {
      /* storage unavailable */
    }
    setLoaded(true);
  }, []);

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

  if (!loaded)
    return (
      <div className="flex min-h-screen items-center justify-center bg-realm-bg text-realm-text">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-gold border-t-transparent" />
          <p className="text-sm text-realm-muted font-lora italic">Consulting the Chronicles…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-realm-bg text-realm-text px-4 py-8 md:px-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-realm-gold/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-realm-purple/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-realm-teal/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">

        {/* HERO BANNER - THE CHRONICLE */}
        <div className="relative overflow-hidden rounded-3xl border border-realm-border bg-gradient-to-br from-realm-gold-dim via-realm-surface to-realm-surface2 p-8 shadow-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-realm-gold/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-realm-purple/5 blur-2xl" />
          </div>

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: LP counter */}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-realm-muted font-space">
                Legend Points Accumulated
              </p>
              <div className="flex items-center gap-3">
                <span className="text-5xl">👑</span>
                <div className="bg-gradient-to-r from-realm-gold via-amber-200 to-yellow-100 bg-clip-text text-6xl font-black text-transparent leading-none font-space">
                  {totalXp.toLocaleString()}
                </div>
              </div>
              <p className="mt-2 text-xs text-realm-muted font-lora italic">Your total prestige across all battles and oaths</p>
            </div>

            {/* Right: metric pills */}
            <div className="flex flex-wrap gap-3 font-space">
              <div className="flex items-center gap-3 rounded-2xl border border-realm-teal/20 bg-realm-teal/5 px-4 py-3 shadow-sm">
                <IconHourglass className="text-realm-teal" size={24} />
                <div>
                  <p className="text-lg font-bold text-realm-cream leading-tight">{formatFocusTime(totalFocusMinutes)}</p>
                  <p className="text-[10px] text-realm-muted uppercase tracking-wide">Hours in Battle</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-realm-purple/20 bg-realm-purple/5 px-4 py-3 shadow-sm">
                <IconSword className="text-realm-purple" size={24} />
                <div>
                  <p className="text-lg font-bold text-realm-cream leading-tight">{doneTasks}</p>
                  <p className="text-[10px] text-realm-muted uppercase tracking-wide">Missions Fulfilled</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-realm-border bg-realm-surface2 px-4 py-3 shadow-sm">
                <IconShield className="text-realm-gold" size={24} />
                <div>
                  <p className="text-lg font-bold text-realm-cream leading-tight">{sessions.length}</p>
                  <p className="text-[10px] text-realm-muted uppercase tracking-wide">Battles Fought</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WEEKLY CHART + VICTORY RATE RING */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly focus chart — spans 2 cols */}
          <div className="col-span-1 lg:col-span-2 rounded-2xl border border-realm-border bg-realm-surface p-6 shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-cinzel text-sm text-realm-cream flex items-center gap-2">
                <IconChartBar size={18} className="text-realm-gold" />
                Weekly Battle Logs
              </h2>
              <span className="text-xs text-realm-muted font-lora italic">Last 7 days</span>
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
                        <span className="mb-1.5 text-[10px] font-bold text-realm-gold font-mono tabular-nums">{bar.minutes}m</span>
                      )}
                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-700 ${
                          isToday
                            ? "bg-gradient-to-t from-realm-gold to-realm-purple shadow-md shadow-realm-gold/25"
                            : bar.minutes > 0
                            ? "bg-gradient-to-t from-realm-purple/50 to-realm-purple/10 border-t border-realm-purple/35"
                            : "bg-realm-surface2 border border-realm-border"
                        }`}
                        style={{ height: `${barH}px` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold font-space ${
                        isToday ? "text-realm-gold" : "text-realm-muted"
                      }`}
                    >
                      {bar.label}
                      {isToday && <span className="ml-0.5 text-[8px] text-realm-gold">●</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {sessions.length === 0 && (
              <p className="mt-4 text-center text-xs text-realm-muted font-lora italic">
                Ride to battle to log your first focus chronicle! ⚔️
              </p>
            )}
          </div>

          {/* Victory Rate completion ring */}
          <div className="rounded-2xl border border-realm-border bg-realm-surface p-6 flex flex-col items-center justify-center shadow-md">
            <h2 className="mb-5 text-center font-cinzel text-sm text-realm-cream flex items-center gap-2">
              <IconTrendingUp size={18} className="text-realm-teal" />
              Victory Rate
            </h2>
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-realm-border bg-realm-surface2 shadow-inner">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(245,239,232,0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#5eead4"
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
                <div className="text-2xl font-black text-realm-cream leading-none">
                  {totalTasks === 0 ? "0%" : `${Math.round((doneTasks / totalTasks) * 100)}%`}
                </div>
                <div className="text-[10px] text-realm-muted uppercase tracking-widest mt-1">
                  {doneTasks} / {totalTasks}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-realm-muted font-lora italic">
              {totalTasks === 0
                ? "No quests declared on the scroll yet."
                : `${doneTasks} of ${totalTasks} missions fulfilled.`}
            </p>
          </div>
        </div>

        {/* DIFFICULTY + BATTLE HISTORY */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Difficulty calibration */}
          <div className="rounded-2xl border border-realm-border bg-realm-surface p-6 shadow-md">
            <h2 className="mb-4 font-cinzel text-sm text-realm-cream flex items-center gap-2">
              <IconBrain size={18} className="text-realm-purple" />
              Expected vs Actual Trial Weight
            </h2>
            {avgBefore !== null && avgAfter !== null ? (
              <div className="space-y-5">
                <p className="text-xs text-realm-muted font-space">
                  Based on {tasksWithDifficulty.length} rated mission{tasksWithDifficulty.length !== 1 ? "s" : ""}
                </p>

                <div className="space-y-4 font-space">
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-realm-muted">Squire's Anticipation (Expected Weight)</span>
                      <span className="font-bold text-realm-gold">{avgBefore.toFixed(1)} / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-realm-surface2 border border-realm-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-realm-gold to-orange-500 transition-all duration-700"
                        style={{ width: `${(avgBefore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-realm-muted">Knight's Reality (Actual Difficulty)</span>
                      <span className="font-bold text-realm-teal">{avgAfter.toFixed(1)} / 10</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-realm-surface2 border border-realm-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-realm-teal to-teal-300 transition-all duration-700"
                        style={{ width: `${(avgAfter / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-realm-border bg-realm-surface2/60 p-4">
                  <p className="text-xs leading-relaxed text-realm-muted font-lora italic">
                    {avgAfter < avgBefore
                      ? "⚔️ The monsters in your mind were larger than life! Missions are easier than expected. Your blade is sharp."
                      : avgAfter > avgBefore
                      ? "🛡️ The trial was heavy. Your strength is tested. Break future quests into micro-steps at the Sage's advice."
                      : "✨ Your estimation of battle difficulty is perfectly calibrated."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-realm-border bg-realm-surface2 text-4xl">
                  <IconBrain size={32} className="text-realm-muted" />
                </div>
                <div>
                  <p className="text-sm font-bold text-realm-cream font-space">No calibration records</p>
                  <p className="mt-1 text-xs text-realm-muted font-lora italic">
                    Rate mission difficulty before and after battles to compile calibration counsel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Session History — timeline style */}
          <div className="rounded-2xl border border-realm-border bg-realm-surface p-6 shadow-md">
            <h2 className="mb-4 font-cinzel text-sm text-realm-cream flex items-center gap-2">
              <IconHistory size={18} className="text-realm-gold" />
              Chronicle of Recent Battles
            </h2>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-realm-border bg-realm-surface2 text-4xl">
                  <IconClock size={32} className="text-realm-muted" />
                </div>
                <div>
                  <p className="text-sm font-bold text-realm-cream font-space">No battles fought yet</p>
                  <p className="mt-1 text-xs text-realm-muted font-lora italic">
                    Accept a mission and ride to battle to write history here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative space-y-0">
                {/* Vertical timeline line */}
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gradient-to-b from-realm-gold/40 via-realm-border to-transparent" />
                <div className="space-y-4 pl-10">
                  {recentSessions.map((s, idx) => {
                    const variance = s.actualMinutes - s.plannedMinutes;
                    return (
                      <div key={s.id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 border-realm-surface ${
                          idx === 0 ? "bg-realm-teal" : "bg-realm-purple/60"
                        }`} />

                        <div className="rounded-xl border border-realm-border bg-realm-surface2/40 p-3 transition-all hover:border-realm-gold/20 hover:bg-realm-surface2/70">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm font-bold text-realm-cream font-space">
                              {s.taskTitle}
                            </p>
                            <span className="shrink-0 text-xs text-realm-muted font-space">{relativeDate(s.endedAt)}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 font-space">
                            <span className="text-xs text-realm-muted">{s.plannedMinutes}m plan</span>
                            <span className="text-realm-border">·</span>
                            <span
                              className={`text-xs font-bold ${
                                variance > 0
                                  ? "text-realm-gold"
                                  : variance < 0
                                  ? "text-realm-teal"
                                  : "text-realm-muted"
                              }`}
                            >
                              {s.actualMinutes}m battle
                            </span>
                            {variance !== 0 && (
                              <span className={`text-[10px] ${variance < 0 ? "text-realm-teal" : "text-realm-gold"} font-mono`}>
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
              icon: <IconFlame className="text-realm-gold" size={24} />,
              label: "Longest Battle",
              value: longestSession > 0 ? formatFocusTime(longestSession) : "—",
              sub: longestSession > 0 ? "Personal best duration" : "No sessions logged",
              color: "from-realm-gold-dim to-realm-surface2",
              border: "border-realm-gold/20",
              textColor: "text-realm-gold",
            },
            {
              icon: <IconCalendar className="text-realm-purple" size={24} />,
              label: "Masterful Day",
              value: mostProductiveDay.minutes > 0 ? mostProductiveDay.label : "—",
              sub: mostProductiveDay.minutes > 0 ? `${mostProductiveDay.minutes}m in focus` : "No data this week",
              color: "from-realm-purple/15 to-realm-surface2",
              border: "border-realm-purple/20",
              textColor: "text-realm-purple",
            },
            {
              icon: <IconSword className="text-realm-teal" size={24} />,
              label: "Total Missions Fulfilled",
              value: doneTasks > 0 ? String(doneTasks) : "—",
              sub: doneTasks > 0 ? `out of ${totalTasks} quests` : "Complete your first mission",
              color: "from-realm-teal/15 to-realm-surface2",
              border: "border-realm-teal/20",
              textColor: "text-realm-teal",
            },
          ].map((ach) => (
            <div
              key={ach.label}
              className={`relative overflow-hidden rounded-2xl border ${ach.border} bg-gradient-to-br ${ach.color} p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-realm-surface2 border border-realm-border">
                  {ach.icon}
                </div>
              </div>
              <div className="mt-4 font-space">
                <p className={`text-2xl font-black ${ach.textColor}`}>{ach.value}</p>
                <p className="mt-0.5 text-xs font-bold text-realm-cream">{ach.label}</p>
                <p className="mt-1 text-[10px] text-realm-muted font-lora italic leading-none">{ach.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
