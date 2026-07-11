"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ENERGY_LABELS, PRIORITY_STYLES, type Task } from "@/lib/tasks/types";
import { IconFlame, IconBook, IconSkull, IconShield, IconBrain, IconListDetails, IconClock, IconTrash } from "@tabler/icons-react";
import { useTimer } from "@/components/providers/TimerProvider";

// ─── Deadline State ───────────────────────────────────────────────────────────

type DeadlineState =
  | { state: "overdue"; days: number }
  | { state: "today"; hours: number; minutes: number }
  | { state: "imminent"; days: number }
  | { state: "soon"; days: number }
  | { state: "upcoming"; days: number; dateLabel: string }
  | { state: "distant"; dateLabel: string }
  | null;

function getDeadlineState(dueDate: string | null | undefined): DeadlineState {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const dateLabel = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  if (diffMs < 0 && diffDays < 0) return { state: "overdue", days: Math.abs(diffDays) };
  if (diffDays <= 0) return { state: "today", hours: Math.max(0, diffHours), minutes: Math.max(0, diffMins) };
  if (diffDays <= 2) return { state: "imminent", days: diffDays };
  if (diffDays <= 6) return { state: "soon", days: diffDays };
  if (diffDays <= 14) return { state: "upcoming", days: diffDays, dateLabel };
  return { state: "distant", dateLabel };
}

type Props = {
  task: Task;
  hero?: boolean;
  showDifficulty?: boolean;
  due_date?: string | null;
  onComplete: (task: Task) => void;
  onToggleSubtask: (task: Task, subId: string) => void;
  onBreakdown: (task: Task) => void;
  onStuck: (task: Task) => void;
  onMemory: (task: Task, note: string) => void;
  onRate: (task: Task, rating: number) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskCard({
  task,
  hero = false,
  showDifficulty = false,
  due_date,
  onComplete,
  onToggleSubtask,
  onBreakdown,
  onStuck,
  onMemory,
  onRate,
  onDelete,
}: Props) {
  const [showMemory, setShowMemory] = useState(false);
  const [deadline, setDeadline] = useState<DeadlineState>(() => getDeadlineState(due_date));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const style = PRIORITY_STYLES[task.priority];

  const totalHp = task.subtasks.reduce((sum, s) => sum + s.xp, 0);
  const remainingHp = task.subtasks.filter((s) => !s.done).reduce((sum, s) => sum + s.xp, 0);
  const hpPct = totalHp > 0 ? Math.round((remainingHp / totalHp) * 100) : 0;
  const bossDefeated = task.isBoss && totalHp > 0 && remainingHp === 0;

  // Live countdown for "today" — updates every minute
  useEffect(() => {
    setDeadline(getDeadlineState(due_date));
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (due_date) {
      intervalRef.current = setInterval(() => {
        setDeadline(getDeadlineState(due_date));
      }, 60_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [due_date]);

  // ─── Deadline border/container classes ──────────────────────────────────────
  const getContainerClasses = () => {
    if (!deadline || task.done) return "";
    switch (deadline.state) {
      case "today":
        return "border-[#f87171] shadow-[0_0_16px_rgba(248,113,113,0.25),inset_0_0_8px_rgba(248,113,113,0.05)]";
      case "soon":
        return "border-l-[#f0a868] shadow-[2px_0_12px_rgba(240,168,104,0.15)]";
      default:
        return "";
    }
  };

  // Time estimate display
  const timeEstimate = task.calibrated_estimate ?? task.estimated_minutes;
  const showUnderestimate =
    task.calibrated_estimate != null &&
    task.estimated_minutes != null &&
    (task.actual_minutes_history?.length ?? 0) >= 2 &&
    task.calibrated_estimate > task.estimated_minutes * 1.2;
  const underestimatePct = showUnderestimate
    ? Math.round(((task.calibrated_estimate! - task.estimated_minutes!) / task.estimated_minutes!) * 100)
    : 0;

  return (
    <div className="relative">
      {/* Fog overlay for overdue tasks */}
      {deadline?.state === "overdue" && !task.done && (
        <div
          className="absolute inset-0 z-10 rounded-2xl pointer-events-none"
          style={{
            background: "rgba(245,239,232,0.025)",
            backdropFilter: "blur(0.5px)",
          }}
        />
      )}

      {/* Imminent pulsing border wrapper */}
      {deadline?.state === "imminent" && !task.done ? (
        <motion.div
          animate={{ borderColor: ["#f0a868", "#f87171", "#f0a868"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="glass border-l-4 p-0 rounded-2xl overflow-hidden"
          style={{ borderColor: "#f0a868" }}
        >
          <div className={`glass border-l-4 ${style.border} p-4 transition ${task.done ? "opacity-50" : ""} ${hero ? "ring-1 ring-warm-amber/40 shadow-[0_0_20px_rgba(240,168,104,0.05)]" : ""} ${getContainerClasses()}`}>
            <CardInner
              task={task}
              style={style}
              hero={hero}
              showDifficulty={showDifficulty}
              totalHp={totalHp}
              remainingHp={remainingHp}
              hpPct={hpPct}
              bossDefeated={bossDefeated}
              deadline={deadline}
              timeEstimate={timeEstimate}
              showUnderestimate={showUnderestimate}
              underestimatePct={underestimatePct}
              showMemory={showMemory}
              setShowMemory={setShowMemory}
              onComplete={onComplete}
              onToggleSubtask={onToggleSubtask}
              onBreakdown={onBreakdown}
              onStuck={onStuck}
              onMemory={onMemory}
              onRate={onRate}
              onDelete={onDelete}
            />
          </div>
        </motion.div>
      ) : (
        <div
          className={`glass border-l-4 ${style.border} p-4 transition ${task.done ? "opacity-50" : ""} ${hero ? "ring-1 ring-warm-amber/40 shadow-[0_0_20px_rgba(240,168,104,0.05)]" : ""} ${getContainerClasses()}`}
        >
          <CardInner
            task={task}
            style={style}
            hero={hero}
            showDifficulty={showDifficulty}
            totalHp={totalHp}
            remainingHp={remainingHp}
            hpPct={hpPct}
            bossDefeated={bossDefeated}
            deadline={deadline}
            timeEstimate={timeEstimate}
            showUnderestimate={showUnderestimate}
            underestimatePct={underestimatePct}
            showMemory={showMemory}
            setShowMemory={setShowMemory}
            onComplete={onComplete}
            onToggleSubtask={onToggleSubtask}
            onBreakdown={onBreakdown}
            onStuck={onStuck}
            onMemory={onMemory}
            onRate={onRate}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}

// ─── Inner card content (shared between pulsing / normal) ─────────────────────
function CardInner({
  task,
  style,
  hero,
  showDifficulty,
  totalHp,
  remainingHp,
  hpPct,
  bossDefeated,
  deadline,
  timeEstimate,
  showUnderestimate,
  underestimatePct,
  showMemory,
  setShowMemory,
  onComplete,
  onToggleSubtask,
  onBreakdown,
  onStuck,
  onMemory,
  onRate,
  onDelete,
}: {
  task: Task;
  style: { border: string; label: string; text: string };
  hero: boolean;
  showDifficulty: boolean;
  totalHp: number;
  remainingHp: number;
  hpPct: number;
  bossDefeated: boolean;
  deadline: DeadlineState;
  timeEstimate: number | null | undefined;
  showUnderestimate: boolean;
  underestimatePct: number;
  showMemory: boolean;
  setShowMemory: (v: boolean | ((prev: boolean) => boolean)) => void;
  onComplete: (task: Task) => void;
  onToggleSubtask: (task: Task, subId: string) => void;
  onBreakdown: (task: Task) => void;
  onStuck: (task: Task) => void;
  onMemory: (task: Task, note: string) => void;
  onRate: (task: Task, rating: number) => void;
  onDelete?: (task: Task) => void;
}) {
  const timerContext = useTimer();
  const totalFocused = task.actual_minutes_history?.reduce((a, b) => a + b, 0) || 0;

  const isCurrentTask = timerContext.taskId === task.id;
  const isTimerRunning = timerContext.running && timerContext.stage === "session" && !timerContext.isBreakMode;
  const liveMinutes = (isCurrentTask && isTimerRunning) ? (timerContext.elapsed / 60) : 0;
  const currentFocused = totalFocused + liveMinutes;

  const displayPercent = timeEstimate ? Math.round((currentFocused / timeEstimate) * 100) : 0;
  const barPercent = timeEstimate ? Math.min(100, Math.round((currentFocused / timeEstimate) * 100)) : 0;

  return (
    <>
      <div className="flex items-start gap-3">
        <button
          aria-label="Complete task"
          onClick={() => !task.done && onComplete(task)}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 transition ${
            task.done
              ? "border-warm-teal bg-warm-teal text-warm-bg flex items-center justify-center font-bold text-xs"
              : "border-warm-border hover:border-warm-amber hover:bg-warm-amber/20"
          }`}
        >
          {task.done && "✓"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`font-quick font-bold leading-snug ${
                task.done
                  ? "line-through text-warm-textMuted"
                  : deadline?.state === "overdue"
                  ? "text-warm-textMuted"
                  : "text-warm-text"
              }`}
            >
              {task.isBoss && <IconFlame className="inline h-4 w-4 mr-1.5 text-priority-critical animate-pulse" />}
              {task.title}
            </p>

            {onDelete && (
              <button
                aria-label="Delete task"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    onDelete(task);
                  }
                }}
                className="text-warm-textMuted hover:text-priority-critical transition p-1.5 rounded-xl hover:bg-white/5 shrink-0 -mt-1"
                title="Delete task"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Deadline badge */}
          {deadline && !task.done && (
            <div className="mt-1 flex items-center gap-1.5">
              {deadline.state === "today" && (
                <span className="flex items-center gap-1 text-[11px] font-semibold font-mono text-[#f87171]">
                  <span className="animate-pulse">●</span>
                  Due today · {deadline.hours}h {deadline.minutes}m remaining
                </span>
              )}
              {deadline.state === "overdue" && (
                <span className="text-[11px] font-quick text-[#f0a868]/80">
                  {deadline.days} day{deadline.days !== 1 ? "s" : ""} overdue — the battle was lost, but not the war
                </span>
              )}
              {deadline.state === "imminent" && (
                <span className="text-[11px] font-semibold font-quick text-[#f0a868]">
                  ⚠ Due in {deadline.days} day{deadline.days !== 1 ? "s" : ""}
                </span>
              )}
              {deadline.state === "soon" && (
                <span className="text-[11px] font-quick text-[#f0a868]/80">
                  Due in {deadline.days} days
                </span>
              )}
              {(deadline.state === "upcoming" || deadline.state === "distant") && (
                <span className="text-[11px] font-quick" style={{ color: "rgba(245,239,232,0.25)" }}>
                  Due {deadline.state === "upcoming" ? deadline.dateLabel : deadline.dateLabel}
                </span>
              )}
            </div>
          )}

          {/* Time estimate badge */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {timeEstimate != null && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-warm-textMuted">
                <IconClock className="h-3 w-3" />
                ~{timeEstimate} min
              </span>
            )}
            {currentFocused > 0 && (
              <span className={`flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                isCurrentTask && isTimerRunning 
                  ? "text-warm-amber bg-warm-amber/10 border-warm-amber/30 animate-pulse" 
                  : "text-warm-amber bg-warm-amber/10 border-warm-amber/20"
              }`}>
                ⏱️ {Math.round(currentFocused * 10) / 10}m focused
              </span>
            )}
            {showUnderestimate && (
              <span className="text-[10px] font-quick text-[#f0a868]/70 italic">
                (you usually underestimate by {underestimatePct}%)
              </span>
            )}
          </div>

          {/* Thematic Focus Progress Bar */}
          {timeEstimate != null && timeEstimate > 0 && (
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-warm-textMuted">
                <span>Focus Goal Progress</span>
                <span className={displayPercent >= 100 ? "text-warm-teal font-bold" : "text-warm-amber font-bold"}>
                  {displayPercent}% ({Math.round(currentFocused * 10) / 10} / {timeEstimate}m)
                </span>
              </div>
              <div className="h-1.5 w-full bg-warm-surface2 border border-warm-border rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-warm-amber to-[#f87171]"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${barPercent}%`,
                    boxShadow: isCurrentTask && isTimerRunning 
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
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`font-quick font-bold uppercase tracking-wider text-[10px] ${style.text}`}>{style.label}</span>
            <span className="rounded-full bg-warm-amber/15 px-2.5 py-0.5 font-mono font-bold text-warm-amber border border-warm-amber/10">
              +{task.xp} XP
            </span>
            <span className="text-warm-textMuted font-quick font-medium">{ENERGY_LABELS[task.energy]} energy</span>
            {task.tag && (
              <span className="rounded-full bg-warm-surface2 border border-warm-border px-2 py-0.5 text-warm-textMuted font-quick font-bold text-[10px]">
                #{task.tag}
              </span>
            )}
          </div>
        </div>
      </div>

      {task.isBoss && totalHp > 0 && !task.done && (
        <div className="mt-4 bg-warm-surface2 border border-warm-border rounded-xl p-3">
          <div className="flex justify-between text-xs font-quick font-bold text-warm-textMuted mb-1.5">
            <span className="flex items-center gap-1.5 text-priority-critical uppercase tracking-wider text-[10px]">
              <IconFlame className="h-3.5 w-3.5" /> Steps Remaining
            </span>
            <span className="font-mono text-priority-critical">
              {remainingHp}/{totalHp}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-warm-bg border border-warm-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-priority-critical to-warm-amber transition-all duration-500"
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      )}

      {task.subtasks.length > 0 && !task.done && (
        <ul className="mt-4 space-y-2 border-t border-warm-border/50 pt-3">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onToggleSubtask(task, s.id)}
                className="h-4 w-4 rounded border-warm-border bg-warm-surface text-warm-amber focus:ring-warm-amber"
              />
              <span className={`font-quick ${s.done ? "text-warm-textMuted line-through" : "text-warm-text"}`}>{s.text}</span>
              <span className="ml-auto font-mono text-xs text-warm-amber">+{s.xp} XP</span>
            </li>
          ))}
        </ul>
      )}

      {bossDefeated && (
        <button
          onClick={() => onComplete(task)}
          className="mt-4 w-full rounded-xl bg-priority-critical py-2.5 text-sm font-quick font-bold text-warm-bg hover:bg-priority-critical/90 transition shadow-lg shadow-priority-critical/15 flex items-center justify-center gap-1.5"
        >
          <IconFlame className="h-4 w-4" /> Complete Milestone Task
        </button>
      )}

      {showDifficulty && task.difficultyBefore === undefined && !task.done && (
        <div className="mt-4 bg-warm-surface2 border border-warm-border rounded-xl p-3">
          <p className="text-xs font-quick font-bold text-warm-textMuted">How complex is this task? (1–10)</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onRate(task, n)}
                className="h-7 w-7 rounded-lg border border-warm-border text-xs font-mono text-warm-text bg-warm-surface hover:border-warm-amber hover:bg-warm-amber/15 transition duration-200"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {task.difficultyBefore !== undefined && !task.done && (
        <p className="mt-3 text-xs font-quick italic text-warm-textMuted">
          ⚡ Estimated complexity: {task.difficultyBefore}/10.
        </p>
      )}

      {!task.done && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-warm-border/50 pt-3">
          {task.subtasks.length === 0 && (
            <button
              onClick={() => onBreakdown(task)}
              className="rounded-lg border border-warm-border bg-warm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-warm-text hover:bg-warm-surface hover:border-warm-amber/30 transition flex items-center gap-1"
            >
              <IconListDetails className="h-3.5 w-3.5 text-warm-amber" /> AI Breakdown
            </button>
          )}
          <button
            onClick={() => onStuck(task)}
            className="rounded-lg border border-warm-border bg-warm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-warm-text hover:bg-warm-surface hover:border-warm-amber/30 transition flex items-center gap-1"
          >
            <IconShield className="h-3.5 w-3.5 text-priority-critical" /> Rescue Me
          </button>
          <button
            onClick={() => setShowMemory((v) => !v)}
            className="rounded-lg border border-warm-border bg-warm-surface2 px-3 py-1.5 text-xs font-quick font-bold text-warm-text hover:bg-warm-surface hover:border-warm-amber/30 transition flex items-center gap-1"
          >
            <IconBrain className="h-3.5 w-3.5 text-warm-purple" /> Note
          </button>
          <Link
            href={`/app/timer?task=${task.id}`}
            className="ml-auto rounded-lg bg-warm-amber px-4 py-1.5 text-xs font-quick font-bold text-warm-bg hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
          >
            Focus on this task
          </Link>
        </div>
      )}

      {showMemory && !task.done && (
        <textarea
          defaultValue={task.memoryNote}
          onBlur={(e) => onMemory(task, e.target.value)}
          placeholder="Record task notes here..."
          rows={2}
          className="mt-3 w-full rounded-xl border border-warm-border bg-warm-surface2 px-3 py-2 text-sm font-quick text-warm-text outline-none focus:border-warm-amber transition"
        />
      )}

      {task.memoryNote && !showMemory && !task.done && (
        <p className="mt-3 rounded-lg bg-warm-amber/15 border border-warm-amber/10 px-3 py-2 text-xs font-quick italic text-warm-amber flex items-center gap-1.5">
          <IconBook className="h-3.5 w-3.5 shrink-0" /> Notes: {task.memoryNote}
        </p>
      )}
    </>
  );
}
