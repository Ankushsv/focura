"use client";

import { useMemo, useState, useEffect } from "react";
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
  { icon: "⚔️", text: "One Day's Quest at a time defeats decision fatigue." },
  { icon: "🧙", text: "The Sage's breakdown turns any beastly task into strikes." },
  { icon: "🛡️", text: "Stuck? Sound the retreat to find the smallest step." },
  { icon: "⚡", text: "Match your current Battle Fury to match your energy level." },
];

export default function TasksPage() {
  const {
    tasks,
    loaded,
    energy,
    setEnergy,
    addTask,
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
  const [rescue, setRescue] = useState<{ title: string; step: string } | null>(null);
  const [name, setName] = useState("knight");

  // Load User Name
  useEffect(() => {
    const saved = localStorage.getItem("focura.username");
    if (saved) setName(saved);
  }, []);

  const active = useMemo(() => {
    return tasks
      .filter((t) => !t.done)
      .sort((a, b) => {
        const p = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
        if (p !== 0) return p;
        return energyDistance(a.energy, energy) - energyDistance(b.energy, energy);
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
      message: task.isBoss ? "BOSS DEFEATED! A legendary victory!" : "Victory. The scroll advances.",
    });
  }

  function handleToggleSubtask(task: Task, subId: string) {
    const sub = task.subtasks.find((s) => s.id === subId);
    toggleSubtask(task.id, subId);
    if (sub && !sub.done) {
      awardXp(sub.xp, "tasks");
      bus.emit("pet:react", { message: "A fine strike! Keep fighting!" });
    }
  }

  async function handleBreakdown(task: Task) {
    bus.emit("pet:react", { message: "The Sage is studying the quest... drawing strikes..." });
    const breakdown = await generateBreakdown(task.title);
    applyBreakdown(task.id, breakdown);
    bus.emit("pet:react", { message: "The battle plan is laid out! Strike one by one." });
  }

  async function handleStuck(task: Task) {
    bus.emit("pet:react", { message: "The Sage seeks a path around the wall..." });
    const step = await generateMicroStep(task.title);
    setRescue({ title: task.title, step });
    bus.emit("pet:react", { message: "Sound the retreat! Here is your smallest action." });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, energy: taskEnergy });
    bus.emit("pet:react", { message: "A new mission is pinned to your Scroll." });
    setTitle("");
    setShowAdd(false);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0c0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f0a868]/30 border-t-[#f0a868]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ── Page Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-[#1a1714] p-6 sm:p-8 shadow-xl">
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-realm-gold/5 blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 font-mono text-[10px] text-realm-muted uppercase tracking-wider hidden sm:block">
          THE SCROLL ✦ SCRIPTS
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-cinzel text-xl sm:text-3xl font-bold text-[#f5efe8]">The Scroll</h1>
            <p className="font-lora italic text-xs sm:text-sm text-realm-muted">
              &ldquo;These are your orders, <span className="text-realm-gold">{name}</span>. The kingdom does not wait.&rdquo;
            </p>
            <p className="text-xs text-realm-muted mt-1.5">
              <span className="font-bold text-realm-text">{active.length}</span> missions active &middot; sorted for{" "}
              <span className="text-realm-gold font-bold">{ENERGY_LABELS[energy]}</span> energy
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Energy picker */}
            <div className="flex items-center gap-1 rounded-full border border-realm-border bg-[#141210] p-1.5">
              {ENERGIES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergy(e)}
                  className={`rounded-full px-4 py-1.5 text-xs font-quick font-bold transition duration-200 ${
                    energy === e
                      ? "bg-realm-surface text-realm-gold shadow"
                      : "text-realm-muted hover:text-realm-text"
                  }`}
                >
                  {ENERGY_LABELS[e]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdd((v) => !v)}
              className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
            >
              {showAdd ? "✕ Cancel" : "+ Add to Scroll"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Add to Scroll Form ── */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-realm-gold/20 bg-realm-surface p-5 shadow-lg border-l-4 border-l-realm-gold"
        >
          <p className="mb-4 text-[10px] font-quick font-bold uppercase tracking-widest text-realm-gold">
            📜 New Mission Scroll
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What task needs to be conquered today?"
              className="min-w-[260px] flex-1 rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2.5 text-sm font-quick text-realm-text outline-none placeholder:text-realm-muted/50 focus:border-realm-gold transition"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-xl border border-realm-border bg-[#141210] px-4 py-2.5 text-sm font-quick text-realm-text focus:outline-none focus:border-realm-gold transition"
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
              className="rounded-xl border border-realm-border bg-[#141210] px-4 py-2.5 text-sm font-quick text-realm-text focus:outline-none focus:border-realm-gold transition"
            >
              {ENERGIES.map((e) => (
                <option key={e} value={e}>
                  {ENERGY_LABELS[e]} energy
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition self-stretch"
            >
              Add Mission
            </button>
          </div>
        </form>
      )}

      {/* ── The Retreat Overlay / Card ── */}
      {rescue && (
        <div className="fixed inset-0 z-50 bg-[#0e0c0a]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="font-cinzel text-3xl font-bold text-realm-gold uppercase tracking-widest">
              The Retreat
            </h1>
            <p className="font-lora italic text-realm-muted text-base leading-relaxed">
              &ldquo;Even the greatest knights retreat. It is not defeat — it is strategy. Choose your smallest action.&rdquo;
            </p>
            
            <div className="bg-realm-surface border border-realm-border rounded-2xl p-6 shadow-xl space-y-4">
              <p className="text-[10px] font-quick font-bold uppercase tracking-wider text-realm-crimson">
                SMALL STEP TO RALLY
              </p>
              <h3 className="font-quick font-bold text-lg text-realm-text">
                {rescue.step}
              </h3>
              <p className="text-xs text-realm-muted font-lora italic">
                Quest: &ldquo;{rescue.title}&rdquo;
              </p>
              
              <button
                onClick={() => {
                  setRescue(null);
                  bus.emit("pet:react", { message: "Ready to charge! Let's do this!" });
                }}
                className="w-full mt-2 rounded-xl bg-realm-gold text-[#0e0c0a] py-3 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
              >
                I can do this →
              </button>
            </div>
            
            <p className="text-xs text-realm-muted font-quick font-bold uppercase tracking-widest">
              🛡️ Your Familiar is with you.
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
                <div className="h-px flex-1 bg-gradient-to-r from-realm-crimson/40 to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-crimson">
                  Today&apos;s Quest &middot; Dark Lord Battle
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-realm-crimson/40 to-transparent" />
              </div>
              <TaskCard
                task={mainQuest}
                hero
                showDifficulty
                onComplete={handleComplete}
                onToggleSubtask={handleToggleSubtask}
                onBreakdown={handleBreakdown}
                onStuck={handleStuck}
                onMemory={(t, note) => setMemoryNote(t.id, note)}
                onRate={(t, n) => rateDifficulty(t.id, n)}
              />
            </section>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-realm-border bg-realm-surface2 p-10 text-center shadow-md">
              <p className="text-4xl">🕊️</p>
              <p className="mt-4 font-cinzel text-lg font-bold text-realm-teal">
                The Scroll is clear. The kingdom awaits your orders.
              </p>
              <p className="mt-2 text-xs font-lora italic text-realm-muted max-w-sm mx-auto">
                No active quests remain. Relight the Oath Fire, rest, or add a field mission when you are ready.
              </p>
            </div>
          )}

          {/* Field Missions (Side Quests) */}
          {sideQuests.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-realm-border to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                  Field Missions &middot; {sideQuests.length} remaining
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-realm-border to-transparent" />
              </div>
              <div className="space-y-3">
                {sideQuests.map((t) => {
                  const priorityBorder =
                    t.priority === "critical"
                      ? "border-l-realm-crimson"
                      : t.priority === "high"
                      ? "border-l-realm-gold"
                      : t.priority === "medium"
                      ? "border-l-realm-purple"
                      : "border-l-realm-border";
                  return (
                    <div
                      key={t.id}
                      className={`overflow-hidden rounded-2xl border border-realm-border border-l-[4px] ${priorityBorder} bg-[#141210] hover:border-realm-gold/20 transition`}
                    >
                      <TaskCard
                        task={t}
                        onComplete={handleComplete}
                        onToggleSubtask={handleToggleSubtask}
                        onBreakdown={handleBreakdown}
                        onStuck={handleStuck}
                        onMemory={(task, note) => setMemoryNote(task.id, note)}
                        onRate={(task, n) => rateDifficulty(task.id, n)}
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
                <div className="h-px flex-1 bg-gradient-to-r from-realm-border to-transparent" />
                <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-realm-muted">
                  Victories Today &middot; {doneTasks.length} complete
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-realm-border to-transparent" />
              </div>
              <div className="space-y-3 opacity-60">
                {doneTasks.map((t) => (
                  <div key={t.id} className="overflow-hidden rounded-2xl border border-realm-border bg-realm-surface px-1.5 py-1">
                    <TaskCard
                      task={t}
                      onComplete={() => {}}
                      onToggleSubtask={() => {}}
                      onBreakdown={() => {}}
                      onStuck={() => {}}
                      onMemory={() => {}}
                      onRate={() => {}}
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
          <Card className="p-5 bg-realm-surface border border-realm-border">
            <h2 className="text-xs font-quick font-bold uppercase tracking-widest text-realm-muted">
              💡 The Knight&apos;s Code
            </h2>
            <ul className="mt-4 space-y-4">
              {TIPS.map((tip) => (
                <li key={tip.icon} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-realm-surface2 border border-realm-border text-sm">
                    {tip.icon}
                  </span>
                  <p className="text-xs leading-relaxed font-quick text-realm-muted">{tip.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
