"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTimeline } from "@/hooks/useTimeline";
import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/components/providers/TimerProvider";
import { bus } from "@/lib/events";
import {
  toDateString,
  type TimelineBlock,
  type TimelineLayer,
  type DayTemplate,
} from "@/lib/timeline/types";

import DndTimelineProvider, { type GhostBlock } from "@/components/timeline/DndTimelineProvider";
import TimelineGrid from "@/components/timeline/TimelineGrid";
import TaskBank from "@/components/timeline/TaskBank";
import DayNavBar from "@/components/timeline/DayNavBar";
import SummaryBar from "@/components/timeline/SummaryBar";
import TimelineSetupModal from "@/components/timeline/TimelineSetupModal";

// ── Conflict confirmation toast (inline) ──────────────────────────────────
function ConflictToast({
  label,
  onSwap,
  onCancel,
}: {
  label: string;
  onSwap: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-warm-border bg-warm-surface px-5 py-4 shadow-2xl animate-fade-in flex items-center gap-4 max-w-sm">
      <p className="text-sm font-quick font-bold text-warm-text flex-1">
        ⚠️ Overlaps <span className="text-warm-amber">&ldquo;{label}&rdquo;</span> — swap?
      </p>
      <button
        onClick={onSwap}
        className="rounded-xl bg-warm-amber/20 border border-warm-amber/40 px-3 py-1.5 text-xs font-bold font-quick text-warm-amber hover:bg-warm-amber/30 transition"
      >
        Swap
      </button>
      <button
        onClick={onCancel}
        className="rounded-xl border border-warm-border px-3 py-1.5 text-xs font-bold font-quick text-warm-textMuted hover:text-warm-text transition"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Overflow toast ─────────────────────────────────────────────────────────
function OverflowToast({
  taskName,
  onTomorrow,
  onKeep,
  onDrop,
}: {
  taskName: string;
  onTomorrow: () => void;
  onKeep: () => void;
  onDrop: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-priority-critical/40 bg-warm-surface px-5 py-4 shadow-2xl animate-fade-in max-w-sm w-full">
      <p className="text-sm font-quick font-bold text-warm-text mb-3">
        ⚠️ The day is full — <span className="text-warm-amber">&ldquo;{taskName}&rdquo;</span> can&apos;t fit today.
      </p>
      <div className="flex gap-2">
        <button onClick={onTomorrow} className="flex-1 rounded-xl bg-warm-teal/5 border border-warm-teal/20 py-1.5 text-xs font-bold font-quick text-warm-teal/40 hover:bg-warm-teal/10 transition">
          Move to Tomorrow
        </button>
        <button onClick={onKeep} className="flex-1 rounded-xl bg-warm-amber text-warm-bg py-1.5 text-xs font-bold font-quick hover:shadow-[0_0_15px_rgba(232,151,90,0.15)] transition">
          Keep It
        </button>
        <button onClick={onDrop} className="flex-1 rounded-xl border border-warm-border py-1.5 text-xs font-bold font-quick text-warm-textMuted hover:text-warm-text transition">
          Drop It
        </button>
      </div>
    </div>
  );
}

// ── Save Template prompt ───────────────────────────────────────────────────
function SaveTemplatePrompt({
  onSave,
  onCancel,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long" }) + " Routine";
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-80 rounded-2xl border border-warm-border bg-warm-surface p-6 shadow-2xl space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-quick font-bold text-sm text-warm-text">Name This Template</h3>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-space text-warm-text focus:border-warm-amber/50 focus:outline-none transition"
        />
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-warm-border py-2 text-xs font-quick font-bold text-warm-textMuted hover:text-warm-text transition">
            Cancel
          </button>
          <button
            onClick={() => onSave(name)}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-warm-amber py-2 text-xs font-quick font-bold text-warm-bg hover:shadow-[0_0_15px_rgba(232,151,90,0.15)] disabled:opacity-40 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [layer, setLayer] = useState<TimelineLayer>("plan");
  const [ghostBlock, setGhostBlock] = useState<GhostBlock | null>(null);
  const [showOverflowToast, setShowOverflowToast] = useState<string[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [conflictPending, setConflictPending] = useState<{
    label: string;
    resolve: (swap: boolean) => void;
  } | null>(null);

  const dateStr = toDateString(selectedDate);

  const {
    blocks,
    loading,
    prefs,
    templates,
    summary,
    savePrefs,
    createBlock,
    updateBlock,
    deleteBlock,
    swapBlocks,
    completeSession,
    saveTemplate,
    applyTemplate,
    loadBlocks,
  } = useTimeline(dateStr);

  const { tasks } = useTasks();
  const timer = useTimer();
  const router = useRouter();

  // ── Onboarding setup ────────────────────────────────────────────────────
  const [showSetup, setShowSetup] = useState(false);
  useEffect(() => {
    if (!loading && !prefs.timeline_setup_done) {
      setShowSetup(true);
    }
  }, [loading, prefs.timeline_setup_done]);

  // ── Maximize vertical height ────────────────────────────────────────────
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const layoutEl = mainEl?.parentElement;
    if (mainEl && layoutEl) {
      mainEl.classList.remove("py-10");
      mainEl.classList.add("py-3");

      layoutEl.classList.remove("pb-20");
      layoutEl.classList.add("pb-4");

      return () => {
        mainEl.classList.add("py-10");
        mainEl.classList.remove("py-3");

        layoutEl.classList.add("pb-20");
        layoutEl.classList.remove("pb-4");
      };
    }
  }, []);

  const handleSetupComplete = async (wakeHour: number, sleepHour: number) => {
    await savePrefs({ wake_hour: wakeHour, sleep_hour: sleepHour, timeline_setup_done: true });
    setShowSetup(false);
  };

  // ── Familiar messages ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const hour = now.getHours();

    if (!isToday) return; // Only show context messages for today

    if (blocks.length === 0) {
      bus.emit("pet:react", { message: "The day is unwritten, knight. Place your first mission." });
    } else {
      const focusBlocks = blocks.filter(b => b.block_type === "focus");
      const freeMins = summary.freeMinutes;
      const plannedFocus = summary.focusMinutes;

      if (plannedFocus > 0 && freeMins > 60) {
        bus.emit("pet:react", {
          message: `${Math.round(plannedFocus / 60 * 10) / 10}h planned. The Fog fills unguarded time.`
        });
      }

      if (hour >= 20) {
        const done = focusBlocks.every(b => b.status === "completed" || b.status === "skipped");
        if (done) {
          bus.emit("pet:react", { message: "The day is won. Rest well — tomorrow we ride." });
        } else {
          bus.emit("pet:react", { message: "Some battles remain. They will wait for tomorrow's knight." });
        }
      }
    }
  }, [loading, blocks.length, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // 15-min pre-battle warning
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const isToday = selectedDate.toDateString() === now.toDateString();
      if (!isToday) return;

      const upcoming = blocks.find(b => {
        if (b.block_type !== "focus" || b.status !== "planned") return false;
        const [h, m] = b.start_time.split(":").map(Number);
        const blockStartMins = h * 60 + m;
        const diff = blockStartMins - nowMins;
        return diff > 0 && diff <= 15;
      });

      if (upcoming) {
        const [h, m] = upcoming.start_time.split(":").map(Number);
        const diff = h * 60 + m - (new Date().getHours() * 60 + new Date().getMinutes());
        const title = (upcoming as any).task_title || "your next mission";
        bus.emit("pet:react", { message: `Your next battle begins soon — "${title}" in ~${Math.ceil(diff)} minutes.` });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [blocks, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload blocks on timer completion or stop
  useEffect(() => {
    const unsubComplete = bus.on("timer:session-complete", () => {
      void loadBlocks();
    });
    const unsubStop = bus.on("timer:stop", () => {
      void loadBlocks();
    });
    return () => {
      unsubComplete();
      unsubStop();
    };
  }, [loadBlocks]);

  // ── Start focus block ────────────────────────────────────────────────────
  const handleStartFocus = useCallback(async (block: TimelineBlock) => {
    if (!block.task_id) return;

    // Find the task's expected duration
    const task = tasks.find(t => t.id === block.task_id);
    const estimate = task ? (task.calibrated_estimate || task.estimated_minutes) : null;
    const hasEstimate = estimate && estimate > 0;
    const duration = hasEstimate ? estimate : block.planned_duration_minutes;

    // Pre-load timer with this task + expected duration
    timer.setActiveBlockId(block.id);
    timer.setTaskId(block.task_id);
    timer.setMinutes(duration);

    if (hasEstimate) {
      // Automatically start focus session if estimation exists
      timer.begin();
      await updateBlock(block.id, {
        status: "active",
        start_time: new Date().toTimeString().split(" ")[0],
        planned_duration_minutes: duration,
      });
      bus.emit("pet:react", { message: "Focus session active. Let's do this! 🚀" });
    } else {
      // Set to setup mode so user can choose duration
      timer.setStage("setup");
      timer.setRunning(false);
    }

    // Redirect to timer page
    router.push("/app/timer");
  }, [timer, tasks, router, updateBlock]);

  // ── Complete a session ──────────────────────────────────────────────────
  const handleCompleteBlock = useCallback(async (
    blockId: string,
    actualMinutes: number
  ) => {
    const result = await completeSession(blockId, actualMinutes);
    if (result.overflow.length > 0) {
      bus.emit("pet:react", { message: "The battle ran long. I've adjusted the rest of the day." });
      setShowOverflowToast(result.overflow);
    }
    return result;
  }, [completeSession]);

  // ── Conflict confirmation ─────────────────────────────────────────────
  const handleConflictConfirm = useCallback((label: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConflictPending({ label, resolve });
    });
  }, []);

  // ── Scheduled task IDs set ────────────────────────────────────────────
  const scheduledTaskIds = new Set(
    blocks.filter(b => b.task_id).map(b => b.task_id!)
  );

  // ── Template handling ─────────────────────────────────────────────────
  const handleApplyTemplate = useCallback(async (template: DayTemplate) => {
    await applyTemplate(template, handleConflictConfirm);
  }, [applyTemplate, handleConflictConfirm]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-pulse">📅</div>
          <p className="text-sm font-quick font-bold text-warm-textMuted">Loading the Chronicle...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 128px)", overflow: "hidden" }}
    >
      {/* ── Setup modal (first visit) ────────────────────────────────── */}
      <AnimatePresence>
        {showSetup && (
          <TimelineSetupModal onComplete={handleSetupComplete} />
        )}
      </AnimatePresence>

      {/* ── Save template prompt ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSaveTemplate && (
          <SaveTemplatePrompt
            onSave={async (name) => {
              await saveTemplate(name);
              setShowSaveTemplate(false);
            }}
            onCancel={() => setShowSaveTemplate(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Conflict toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {conflictPending && (
          <ConflictToast
            label={conflictPending.label}
            onSwap={() => { conflictPending.resolve(true); setConflictPending(null); }}
            onCancel={() => { conflictPending.resolve(false); setConflictPending(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Overflow toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOverflowToast.length > 0 && (
          <OverflowToast
            taskName={
              (() => {
                const b = blocks.find(x => showOverflowToast.includes(x.id));
                return (b as any)?.task_title || b?.life_label || "a block";
              })()
            }
            onTomorrow={() => setShowOverflowToast([])}
            onKeep={() => setShowOverflowToast([])}
            onDrop={async () => {
              for (const id of showOverflowToast) {
                await deleteBlock(id);
              }
              setShowOverflowToast([]);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Top nav bar ───────────────────────────────────────────────── */}
      <DayNavBar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        layer={layer}
        onLayerChange={setLayer}
        templates={templates}
        onSaveTemplate={() => setShowSaveTemplate(true)}
        onUseTemplate={handleApplyTemplate}
      />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <DndTimelineProvider
        selectedDate={selectedDate}
        blocks={blocks}
        onCreateBlock={createBlock}
        onUpdateBlock={updateBlock}
        onSwapBlocks={swapBlocks}
        ghostBlock={ghostBlock}
        setGhostBlock={setGhostBlock}
        onConflictConfirm={handleConflictConfirm}
      >
        <div className="flex flex-1 overflow-hidden relative px-4 pt-4 pb-2 gap-4 bg-[#0e0c0a]/10">
          {/* ── Left panel: Task bank (The Armory Card) ───────────── */}
          <div
            className="hidden md:flex flex-col border border-[#d97706]/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1612] via-[#0e0c0a] to-[#070605] rounded-2xl overflow-hidden shrink-0 shadow-xl"
            style={{ width: "290px", minWidth: "290px" }}
          >
            <div className="px-4 py-3.5 border-b border-[#d97706]/20 bg-white/[0.01]">
              <h2 className="font-quick font-bold text-xs text-[#f5e6d3] flex items-center gap-1.5">
                <span>⚔️</span> The Armory
              </h2>
              <p className="text-[9px] text-warm-amber/60 font-space mt-0.5 uppercase tracking-wider font-semibold">Quest & Activity Bank</p>
            </div>
            <TaskBank tasks={tasks} scheduledTaskIds={scheduledTaskIds} />
          </div>

          {/* ── Right column: Timeline (Today's Map Card) ─────────── */}
          <div
            className="flex-1 flex flex-col border border-warm-border/45 bg-gradient-to-b from-[#141210]/40 to-[#0e0c0a]/40 rounded-2xl overflow-hidden shadow-xl"
            data-scroll-container="true"
          >
            <div id="timeline-drop-zone" className="flex-1 overflow-hidden">
              <TimelineGrid
                blocks={blocks}
                prefs={prefs}
                layer={layer}
                selectedDate={selectedDate}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onStartFocus={handleStartFocus}
                onCompleteBlock={handleCompleteBlock}
                ghostBlock={ghostBlock}
              />
            </div>
          </div>

          {/* ── Mobile: Task bank drawer ──────────────────────────── */}
          <div className="md:hidden">
            {/* Drawer handle */}
            <button
              onClick={() => setMobileDrawerOpen(p => !p)}
              className="fixed bottom-16 right-4 z-40 flex items-center gap-2 rounded-full border border-warm-border bg-warm-surface px-4 py-2.5 text-xs font-bold font-quick text-warm-text shadow-xl"
            >
              ⚔️ {mobileDrawerOpen ? "Close" : "Armory"}
            </button>

            {/* Drawer */}
            <AnimatePresence>
              {mobileDrawerOpen && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t border-[#d97706]/35 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1612] via-[#0e0c0a] to-[#070605] shadow-2xl"
                  style={{ maxHeight: "65vh" }}
                >
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-warm-border/50" />
                  </div>
                  <TaskBank tasks={tasks} scheduledTaskIds={scheduledTaskIds} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DndTimelineProvider>

      {/* ── Fixed summary bar ─────────────────────────────────────────── */}
      <SummaryBar {...summary} />
    </div>
  );
}
