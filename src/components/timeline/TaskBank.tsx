"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { type Task } from "@/lib/tasks/types";
import { type LifeCategory, LIFE_CATEGORIES, formatDuration, PRIORITY_BORDER_COLOR } from "@/lib/timeline/types";
import CustomActivityModal from "./CustomActivityModal";

interface TaskBankProps {
  tasks: Task[];
  scheduledTaskIds: Set<string>;
}

type CustomLifeCategory = LifeCategory & { isCustom?: boolean };

// Draggable task card in the bank
function DraggableTask({ task, isScheduled }: { task: Task; isScheduled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: "task", task },
    disabled: isScheduled,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : isScheduled ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const borderColor = PRIORITY_BORDER_COLOR[task.priority] ?? PRIORITY_BORDER_COLOR.medium;
  const est = task.calibrated_estimate ?? task.estimated_minutes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative rounded-xl border border-[#3d2f25]/50 bg-[#1c1815]/90 px-3 py-2.5 space-y-1.5 cursor-grab active:cursor-grabbing select-none group hover:border-warm-amber/55 hover:shadow-[0_4px_12px_rgba(240,168,104,0.12)] hover:-translate-y-0.5 transition-all duration-200 ${
        isDragging ? "shadow-2xl scale-[1.02] border-warm-amber/40" : ""
      } ${isScheduled ? "pointer-events-none opacity-40" : ""}`}
      title={isScheduled ? "Already scheduled" : "Drag to timeline"}
    >
      {/* Thicker visual Left border rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: borderColor }}
      />

      {/* Textured grab handle */}
      {!isScheduled && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-20 group-hover:opacity-70 transition-opacity duration-150 pointer-events-none">
          <div className="h-0.5 w-0.5 rounded-full bg-warm-amber/60" />
          <div className="h-0.5 w-0.5 rounded-full bg-warm-amber/60" />
          <div className="h-0.5 w-0.5 rounded-full bg-warm-amber/60" />
        </div>
      )}

      {/* Task name */}
      <p className="font-quick font-semibold text-xs text-[#f5efe8] leading-tight pl-2.5">
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 pl-2.5">
        <div className="flex items-center gap-1.5 text-[9px] text-warm-textMuted font-space font-medium">
          {est && <span>⏱ ~{formatDuration(est)}</span>}
          {task.due_date && (
            <span className="text-warm-amber font-semibold">
              📅 {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <span className="font-mono text-[9px] font-extrabold text-[#f5efe8] shrink-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.15)] flex items-center gap-0.5">
          🪙 +{task.xp} LP
        </span>
      </div>

      {isScheduled && (
        <div className="absolute inset-0 rounded-xl bg-warm-bg/50 backdrop-blur-[0.5px] flex items-center justify-center">
          <span className="text-[9px] font-bold text-warm-textHint font-space tracking-wider uppercase bg-[#181614] border border-warm-border/50 px-2 py-0.5 rounded-full shadow-sm">
            Scheduled ✓
          </span>
        </div>
      )}
    </div>
  );
}

// Draggable life category chip
function DraggableLifeChip({ cat }: { cat: CustomLifeCategory }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `life-${cat.id}`,
    data: { type: "life", category: cat },
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-1.5 rounded-full border border-[#854d0e]/20 bg-[#1a1613] px-3 py-1.5 text-[10px] font-space font-bold tracking-wide text-warm-textMuted cursor-grab active:cursor-grabbing select-none hover:border-warm-amber/60 hover:text-[#f5efe8] hover:bg-[#28211b] hover:shadow-[0_0_8px_rgba(240,168,104,0.15)] transition duration-200"
      title={`Drag to add ${cat.label} (${formatDuration(cat.defaultDurationMinutes)})`}
    >
      <span className="text-xs group-hover:scale-110 transition-transform">{cat.emoji}</span>
      <span>{cat.label}</span>
    </div>
  );
}

export default function TaskBank({ tasks, scheduledTaskIds }: TaskBankProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomLifeCategory[]>([]);

  const unscheduled = tasks.filter(t => !t.done && !scheduledTaskIds.has(t.id));
  const allCategories: CustomLifeCategory[] = [...LIFE_CATEGORIES, ...customCategories];

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden">
      {/* ── Unscheduled Quests ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 border-b border-[#d97706]/15">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-warm-amber/65 font-space flex items-center gap-1.5 mb-3 pb-1 border-b border-[#d97706]/10 select-none">
          <span>⚔️</span> Unscheduled Quests
        </h3>

        {unscheduled.length === 0 ? (
          <div className="rounded-xl border border-[#d97706]/20 bg-[#151210] px-4 py-8 text-center space-y-3 relative overflow-hidden group select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            {/* Ambient warm amber drifting glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-warm-amber/10 via-transparent to-orange-500/5 opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
            
            <div className="text-3xl animate-bounce duration-1000 relative z-10">🏆</div>
            <div className="space-y-1 relative z-10">
              <p className="text-xs font-quick font-bold text-[#f5e6d3] leading-snug">
                Thy Scroll is Clear, Knight!
              </p>
              <p className="text-[10px] font-space text-warm-amber/40 leading-normal">
                Every quest is forged into today's timeline.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {unscheduled.map(task => (
              <DraggableTask
                key={task.id}
                task={task}
                isScheduled={scheduledTaskIds.has(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Life Activities ────────────────────────────────────── */}
      <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: "45%" }}>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-warm-amber/65 font-space flex items-center gap-1.5 pb-1 border-b border-[#d97706]/10 select-none">
          <span>🌿</span> Life Activities
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {allCategories.map(cat => (
            <DraggableLifeChip key={cat.id} cat={cat} />
          ))}
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="mt-1 w-full rounded-xl border border-dashed border-[#854d0e]/30 bg-transparent px-3 py-2 text-[10px] font-space font-bold text-warm-textHint hover:border-warm-amber/60 hover:text-warm-amber hover:bg-[#1a1613]/30 transition"
        >
          + Custom activity
        </button>
      </div>

      {/* Custom Activity Modal */}
      {showCustomModal && (
        <CustomActivityModal
          onClose={() => setShowCustomModal(false)}
          onSave={(cat) => {
            setCustomCategories(prev => [...prev, { ...cat, isCustom: true }]);
            setShowCustomModal(false);
          }}
        />
      )}
    </div>
  );
}
