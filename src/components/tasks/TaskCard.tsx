"use client";

import { useState } from "react";
import Link from "next/link";
import { ENERGY_LABELS, PRIORITY_STYLES, type Task } from "@/lib/tasks/types";
import { IconSword, IconBook, IconFlame, IconSkull, IconShield, IconBrain } from "@tabler/icons-react";

type Props = {
  task: Task;
  hero?: boolean;
  showDifficulty?: boolean;
  onComplete: (task: Task) => void;
  onToggleSubtask: (task: Task, subId: string) => void;
  onBreakdown: (task: Task) => void;
  onStuck: (task: Task) => void;
  onMemory: (task: Task, note: string) => void;
  onRate: (task: Task, rating: number) => void;
};

export default function TaskCard({
  task,
  hero = false,
  showDifficulty = false,
  onComplete,
  onToggleSubtask,
  onBreakdown,
  onStuck,
  onMemory,
  onRate,
}: Props) {
  const [showMemory, setShowMemory] = useState(false);
  const style = PRIORITY_STYLES[task.priority];

  const totalHp = task.subtasks.reduce((sum, s) => sum + s.xp, 0);
  const remainingHp = task.subtasks.filter((s) => !s.done).reduce((sum, s) => sum + s.xp, 0);
  const hpPct = totalHp > 0 ? Math.round((remainingHp / totalHp) * 100) : 0;
  const bossDefeated = task.isBoss && totalHp > 0 && remainingHp === 0;

  return (
    <div
      className={`glass border-l-4 ${style.border} p-4 transition ${
        task.done ? "opacity-50" : ""
      } ${hero ? "ring-1 ring-realm-gold/40 shadow-[0_0_20px_rgba(240,168,104,0.1)]" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label="Complete task"
          onClick={() => !task.done && onComplete(task)}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition ${
            task.done
              ? "border-realm-teal bg-realm-teal text-realm-bg flex items-center justify-center font-bold text-xs"
              : "border-realm-muted hover:border-realm-gold hover:bg-realm-gold/20"
          }`}
        >
          {task.done && "✓"}
        </button>
        
        <div className="min-w-0 flex-1">
          <p className={`font-quick font-bold leading-snug ${task.done ? "line-through text-realm-muted" : "text-realm-text"}`}>
            {task.isBoss && <IconSkull className="inline h-4 w-4 mr-1.5 text-realm-crimson animate-pulse" />}
            {task.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`font-quick font-bold uppercase tracking-wider text-[10px] ${style.text}`}>{style.label}</span>
            <span className="rounded-full bg-realm-gold-dim px-2.5 py-0.5 font-mono font-bold text-realm-gold border border-realm-gold/10">
              +{task.xp} LP
            </span>
            <span className="text-realm-muted font-quick font-medium">{ENERGY_LABELS[task.energy]} energy</span>
            {task.tag && <span className="rounded-full bg-realm-surface2 border border-realm-border px-2 py-0.5 text-realm-muted font-quick font-bold text-[10px]">#{task.tag}</span>}
          </div>
        </div>
      </div>

      {task.isBoss && totalHp > 0 && !task.done && (
        <div className="mt-4 bg-realm-surface2 border border-realm-border rounded-xl p-3">
          <div className="flex justify-between text-xs font-quick font-bold text-realm-muted mb-1.5">
            <span className="flex items-center gap-1.5 text-realm-crimson uppercase tracking-wider text-[10px]">
              <IconSword className="h-3.5 w-3.5" /> Dark Lord HP
            </span>
            <span className="font-mono text-realm-crimson">
              {remainingHp}/{totalHp}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-realm-bg border border-realm-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-realm-crimson to-realm-gold transition-all duration-500"
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      )}

      {task.subtasks.length > 0 && !task.done && (
        <ul className="mt-4 space-y-2 border-t border-realm-border/50 pt-3">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onToggleSubtask(task, s.id)}
                className="h-4 w-4 rounded border-realm-border bg-realm-surface text-realm-gold focus:ring-realm-gold"
              />
              <span className={`font-quick ${s.done ? "text-realm-muted line-through" : "text-realm-text"}`}>{s.text}</span>
              <span className="ml-auto font-mono text-xs text-realm-gold">+{s.xp} LP</span>
            </li>
          ))}
        </ul>
      )}

      {bossDefeated && (
        <button
          onClick={() => onComplete(task)}
          className="mt-4 w-full rounded-xl bg-realm-crimson py-2.5 text-sm font-quick font-bold text-realm-bg hover:bg-realm-crimson/90 transition shadow-lg shadow-realm-crimson/15 flex items-center justify-center gap-1.5"
        >
          <IconSword className="h-4 w-4" /> Victory over the Dark Lord!
        </button>
      )}

      {showDifficulty && task.difficultyBefore === undefined && !task.done && (
        <div className="mt-4 bg-realm-surface2 border border-realm-border rounded-xl p-3">
          <p className="text-xs font-quick font-bold text-realm-muted">How fierce is this quest? (1–10)</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onRate(task, n)}
                className="h-7 w-7 rounded-lg border border-realm-border text-xs font-mono text-realm-text bg-realm-surface hover:border-realm-gold hover:bg-realm-gold-dim transition duration-200"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {task.difficultyBefore !== undefined && !task.done && (
        <p className="mt-3 text-xs font-lora italic text-realm-muted">
          ⚔️ Marked as a severity of {task.difficultyBefore}/10 before battle.
        </p>
      )}

      {!task.done && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-realm-border/50 pt-3">
          {task.subtasks.length === 0 && (
            <button
              onClick={() => onBreakdown(task)}
              className="rounded-lg border border-realm-border bg-realm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-realm-text hover:bg-realm-surface hover:border-realm-gold/30 transition flex items-center gap-1"
            >
              <IconBook className="h-3.5 w-3.5 text-realm-gold" /> The Sage breaks this down
            </button>
          )}
          <button
            onClick={() => onStuck(task)}
            className="rounded-lg border border-realm-border bg-realm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-realm-text hover:bg-realm-surface hover:border-realm-gold/30 transition flex items-center gap-1"
          >
            <IconShield className="h-3.5 w-3.5 text-realm-crimson" /> Sound the retreat
          </button>
          <button
            onClick={() => setShowMemory((v) => !v)}
            className="rounded-lg border border-realm-border bg-realm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-realm-text hover:bg-realm-surface hover:border-realm-gold/30 transition flex items-center gap-1"
          >
            <IconBrain className="h-3.5 w-3.5 text-realm-purple" /> Tome
          </button>
          <Link
            href={`/app/timer?task=${task.id}`}
            className="ml-auto rounded-lg bg-realm-gold px-4 py-1.5 text-xs font-quick font-bold text-[#0e0c0a] hover:shadow-[0_0_15px_rgba(240,168,104,0.35)] transition"
          >
            Accept this mission
          </Link>
        </div>
      )}

      {showMemory && !task.done && (
        <textarea
          defaultValue={task.memoryNote}
          onBlur={(e) => onMemory(task, e.target.value)}
          placeholder="Record your scroll notes here... Future-you will inherit this knowledge."
          rows={2}
          className="mt-3 w-full rounded-xl border border-realm-border bg-realm-surface2 px-3 py-2 text-sm font-quick text-realm-text outline-none focus:border-realm-gold transition"
        />
      )}

      {task.memoryNote && !showMemory && !task.done && (
        <p className="mt-3 rounded-lg bg-realm-gold-dim border border-realm-gold/10 px-3 py-2 text-xs font-lora italic text-realm-gold flex items-center gap-1.5">
          <IconBook className="h-3.5 w-3.5 shrink-0" /> Tome: {task.memoryNote}
        </p>
      )}
    </div>
  );
}
