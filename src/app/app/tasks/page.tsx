"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import HallOfLegends from "@/components/tasks/HallOfFame";
import TaskCard from "@/components/tasks/TaskCard";
import { useTasks } from "@/hooks/useTasks";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { generateBreakdown, generateMicroStep } from "@/lib/tasks/breakdown";
import {
  ENERGY_LABELS,
  PRIORITY_ORDER,
  PRIORITY_STYLES,
  energyDistance,
  type Energy,
  type Priority,
  type Task,
} from "@/lib/tasks/types";
import { IconSword, IconShield, IconListDetails, IconBook, IconSkull, IconBackhoe } from "@tabler/icons-react";

const ENERGIES: Energy[] = ["low", "medium", "high"];

const TIPS = [
  { icon: "📋", text: "One focus task at a time defeats decision fatigue." },
  { icon: "🤖", text: "The AI Coach's breakdown turns any complex task into simple steps." },
  { icon: "🛡️", text: "Stuck? Activate rescue mode to find the smallest next step." },
  { icon: "⚡", text: "Match your current focus targets to match your energy level." },
];

export default function TasksPage() {
  const router = useRouter();
  const {
    tasks,
    loaded,
    energy,
    setEnergy,
    addTask,
    deleteTask,
    completeTask,
    toggleSubtask,
    applyBreakdown,
    setMemoryNote,
    rateDifficulty,
  } = useTasks();
  const { awardXp } = useXp();

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [taskEnergy, setTaskEnergy] = useState<Energy>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [rescue, setRescue] = useState<{ title: string; step: string } | null>(null);
  const [name, setName] = useState("adventurer");
  const stuckCountRef = useRef(0);

  // ── 90-second inactivity → ritual redirect ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.push("/app?ritual=true");
      }, 90_000);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [router]);

  // Load User Name
  useEffect(() => {
    async function loadProfileName() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, name")
            .eq("id", user.id)
            .single();
          if (profile) {
            setName(profile.username || profile.name || user.email?.split("@")[0] || "adventurer");
          }
        }
      } catch {}
    }
    loadProfileName();
  }, []);

  const active = useMemo(() => {
    const sorted = tasks
      .filter((t) => !t.done)
      .sort((a, b) => {
        const p = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
        if (p !== 0) return p;
        return energyDistance(a.energy, energy) - energyDistance(b.energy, energy);
      });

    // Deadline urgency sort: "today" tasks bubble to top
    return sorted.sort((a, b) => {
      const urgency = (t: Task) => {
        if (!t.due_date) return 4;
        const days = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 86_400_000);
        if (days <= 0) return 0;   // today
        if (days <= 2) return 1;   // imminent
        if (days < 0) return 2;    // overdue (negative days caught here)
        return 3;
      };
      return urgency(a) - urgency(b);
    });
  }, [tasks, energy]);

  const mainQuest = active[0];
  const sideQuests = active.slice(1);
  const doneTasks = useMemo(() => tasks.filter((t) => t.done), [tasks]);

  function handleComplete(task: Task) {
    completeTask(task.id);
    awardXp(task.xp, "tasks");
    fireConfetti();
    bus.emit("task:completed", { task });
    bus.emit("pet:react", {
      message: task.isBoss ? "Milestone task completed! High-five!" : "Task completed. One step closer!",
    });
  }

  function handleDelete(task: Task) {
    void deleteTask(task.id);
    bus.emit("pet:react", {
      message: "Task deleted from your chronicle.",
    });
  }

  function handleToggleSubtask(task: Task, subId: string) {
    const sub = task.subtasks.find((s) => s.id === subId);
    toggleSubtask(task.id, subId);
    if (sub && !sub.done) {
      awardXp(sub.xp, "tasks");
      bus.emit("pet:react", { message: "Step completed! Keep it up!" });
    }
  }

  async function handleBreakdown(task: Task) {
    bus.emit("pet:react", { message: "AI Coach is breaking down the task..." });
    const breakdown = await generateBreakdown(task.title);
    applyBreakdown(task.id, breakdown);
    bus.emit("pet:react", { message: "Task breakdown created. Take it one step at a time." });
  }

  async function handleStuck(task: Task) {
    stuckCountRef.current += 1;
    if (stuckCountRef.current >= 2) {
      // Double-stuck → redirect to ritual with the task name
      router.push(`/app?ritual=true&task=${encodeURIComponent(task.title)}`);
      return;
    }
    bus.emit("pet:react", { message: "AI Coach is finding a way forward..." });
    const step = await generateMicroStep(task.title);
    setRescue({ title: task.title, step });
    bus.emit("pet:react", { message: "Rescue mode activated! Here is your smallest next step." });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      priority,
      energy: taskEnergy,
      due_date: dueDate || null,
      estimated_minutes: estimatedMinutes,
    });
    bus.emit("pet:react", { message: "Task added to your list." });
    setTitle("");
    setDueDate("");
    setEstimatedMinutes(30);
    setShowAdd(false);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-warm-amber/30 border-t-warm-amber" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-8 space-y-8">
      {/* ── Page Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-warm-surface p-6 sm:p-8 shadow-xl">
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-warm-amber/5 blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 font-mono text-[10px] text-warm-textMuted uppercase tracking-wider hidden sm:block">
          TASKS ✦ TARGETS
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-space text-xl sm:text-3xl font-bold text-warm-text">Tasks</h1>
            <p className="font-quick text-xs sm:text-sm text-warm-textMuted">
              &ldquo;Define your focus blocks and break them down into action steps.&rdquo;
            </p>
            <p className="text-xs text-warm-textMuted mt-1.5">
              <span className="font-bold text-warm-text">{active.length}</span> tasks active &middot; sorted for{" "}
              <span className="text-warm-amber font-bold">{ENERGY_LABELS[energy]}</span> energy
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Energy picker */}
            <div className="flex items-center gap-1 rounded-full border border-warm-border bg-warm-surface2 p-1.5">
              {ENERGIES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergy(e)}
                  className={`rounded-full px-4 py-1.5 text-xs font-quick font-bold transition duration-200 ${
                    energy === e
                      ? "bg-warm-surface text-warm-amber shadow"
                      : "text-warm-textMuted hover:text-warm-text"
                  }`}
                >
                  {ENERGY_LABELS[e]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdd((v) => !v)}
              className="rounded-full bg-warm-amber text-warm-bg px-6 py-2 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
            >
              {showAdd ? "✕ Cancel" : "+ Add Task"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Add to Scroll Form ── */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-warm-amber/20 bg-warm-surface p-5 shadow-lg border-l-4 border-l-warm-amber"
        >
          <p className="mb-4 text-[10px] font-quick font-bold uppercase tracking-widest text-warm-amber">
            📋 New Task Form
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What task needs focus today?"
              className="min-w-[260px] flex-1 rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text outline-none placeholder:text-warm-textMuted/50 focus:border-warm-amber transition"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text focus:outline-none focus:border-warm-amber transition"
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_STYLES[p].label} priority
                </option>
              ))}
            </select>
            <select
              value={taskEnergy}
              onChange={(e) => setTaskEnergy(e.target.value as Energy)}
              className="rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text focus:outline-none focus:border-warm-amber transition"
            >
              {ENERGIES.map((e) => (
                <option key={e} value={e}>
                  {ENERGY_LABELS[e]} energy
                </option>
              ))}
            </select>
          </div>

          {/* Due date + time estimate row */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Due date picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                Due date (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl border border-warm-border bg-warm-surface2 px-3 py-2 text-sm font-mono text-warm-text focus:outline-none focus:border-warm-amber transition"
              />
            </div>

            {/* Time estimate pills */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                How long do you think this takes?
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className={`rounded-full border px-3 py-1 text-xs font-mono font-bold transition ${
                      estimatedMinutes === mins
                        ? "border-warm-amber bg-warm-amber/20 text-warm-amber"
                        : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:border-warm-amber/40 hover:text-warm-text"
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}{mins === 120 ? "+" : ""}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-auto rounded-xl bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition self-end"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* ── The Retreat Overlay / Card ── */}
      {rescue && (
        <div className="fixed inset-0 z-50 bg-warm-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="font-space text-3xl font-bold text-warm-amber uppercase tracking-widest">
              Rescue Mode
            </h1>
            <p className="font-quick text-warm-textMuted text-base leading-relaxed">
              &ldquo;Feeling stuck is completely normal. Take a deep breath and start with the smallest possible action.&rdquo;
            </p>
            
            <div className="bg-warm-surface border border-warm-border rounded-2xl p-6 shadow-xl space-y-4">
              <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-priority-critical">
                SMALLEST NEXT STEP
              </p>
              <h3 className="font-quick font-bold text-lg text-warm-text">
                {rescue.step}
              </h3>
              <p className="text-xs text-warm-textMuted font-quick italic">
                Task: &ldquo;{rescue.title}&rdquo;
              </p>
              
              <button
                onClick={() => {
                  setRescue(null);
                  bus.emit("pet:react", { message: "Ready to focus! Let's do this!" });
                }}
                className="w-full mt-2 rounded-xl bg-warm-amber text-warm-bg py-3 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
              >
                Let's do this →
              </button>
            </div>
            
            <p className="text-xs text-warm-textMuted font-quick font-bold uppercase tracking-widest">
              🛡️ Your companion supports you.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN: Quests */}
        <div className="space-y-8">
          {/* Today's Quest · Dark Lord Battle */}
          {mainQuest ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-priority-critical/40 to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-priority-critical">
                  Primary Focus Task
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-priority-critical/40 to-transparent" />
              </div>
              <TaskCard
                task={mainQuest}
                hero
                showDifficulty
                due_date={mainQuest.due_date}
                onComplete={handleComplete}
                onToggleSubtask={handleToggleSubtask}
                onBreakdown={handleBreakdown}
                onStuck={handleStuck}
                onMemory={(t, note) => setMemoryNote(t.id, note)}
                onRate={(t, n) => rateDifficulty(t.id, n)}
                onDelete={handleDelete}
              />
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-warm-border bg-warm-surface2 p-10 text-center shadow-md">
              <p className="text-4xl">🕊️</p>
              <p className="mt-4 font-space text-lg font-bold text-warm-teal">
                Your task list is empty. Excellent work!
              </p>
              <p className="mt-2 text-xs font-quick italic text-warm-textMuted max-w-sm mx-auto">
                No active tasks remain. Take a break, check your contracts, or add a new task when you're ready.
              </p>
            </div>
          )}

          {/* Field Missions (Side Quests) */}
          {sideQuests.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-warm-border to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted">
                  Other Tasks &middot; {sideQuests.length} remaining
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-warm-border to-transparent" />
              </div>
              <div className="space-y-3">
                {sideQuests.map((t) => {
                  const priorityBorder =
                    t.priority === "critical"
                      ? "border-l-priority-critical"
                      : t.priority === "high"
                      ? "border-l-warm-amber"
                      : t.priority === "medium"
                      ? "border-l-warm-purple"
                      : "border-l-warm-border";
                  return (
                    <div
                      key={t.id}
                      className={`overflow-hidden rounded-2xl border border-warm-border border-l-[4px] ${priorityBorder} bg-warm-surface2 hover:border-warm-amber/20 transition`}
                    >
                      <TaskCard
                        task={t}
                        due_date={t.due_date}
                        onComplete={handleComplete}
                        onToggleSubtask={handleToggleSubtask}
                        onBreakdown={handleBreakdown}
                        onStuck={handleStuck}
                        onMemory={(task, note) => setMemoryNote(task.id, note)}
                        onRate={(task, n) => rateDifficulty(task.id, n)}
                        onDelete={handleDelete}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Victories Today (Completed Tasks) */}
          {doneTasks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-warm-border to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-textMuted">
                  Completed Today &middot; {doneTasks.length} complete
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-warm-border to-transparent" />
              </div>
              <div className="space-y-3 opacity-60">
                {doneTasks.map((t) => (
                  <div key={t.id} className="overflow-hidden rounded-2xl border border-warm-border bg-warm-surface px-1.5 py-1">
                    <TaskCard
                      task={t}
                      onComplete={() => {}}
                      onToggleSubtask={() => {}}
                      onBreakdown={() => {}}
                      onStuck={() => {}}
                      onMemory={() => {}}
                      onRate={() => {}}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="space-y-6">
          <HallOfLegends tasks={tasks} />

          {/* Tips card */}
          <Card className="p-5 bg-warm-surface border border-warm-border">
            <h2 className="text-xs font-quick font-bold uppercase tracking-widest text-warm-textMuted">
              💡 Focus Guidelines
            </h2>
            <ul className="mt-4 space-y-4">
              {TIPS.map((tip) => (
                <li key={tip.icon} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warm-surface2 border border-warm-border text-sm">
                    {tip.icon}
                  </span>
                  <p className="text-xs leading-relaxed font-quick text-warm-textMuted">{tip.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
