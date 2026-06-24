"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { type Task } from "@/lib/tasks/types";
import {
  type TimelineBlock,
  type LifeCategory,
  snapToQuarter,
  minutesToTime,
  timeToMinutes,
  toDateString,
  formatDuration,
} from "@/lib/timeline/types";
import { MIN_PX } from "./TimelineGrid";

// ── Ghost data during drag ─────────────────────────────────────────────────
export interface GhostBlock {
  startMinutes: number;
  durationMinutes: number;
  label: string;
}

interface DndTimelineProviderProps {
  children: ReactNode;
  selectedDate: Date;
  blocks: TimelineBlock[];
  onCreateBlock: (block: Omit<TimelineBlock, "id" | "user_id" | "created_at" | "updated_at">) => Promise<TimelineBlock | null>;
  onUpdateBlock: (id: string, updates: Partial<TimelineBlock>) => Promise<void>;
  onSwapBlocks: (a: string, b: string) => Promise<void>;
  ghostBlock: GhostBlock | null;
  setGhostBlock: (g: GhostBlock | null) => void;
  onConflictConfirm?: (label: string) => Promise<boolean>;
}

// ── Overlay card during drag ───────────────────────────────────────────────
function DragOverlayCard({ label, durationMinutes }: { label: string; durationMinutes: number }) {
  return (
    <div
      className="rounded-xl border border-warm-purple/50 bg-warm-surface px-3 py-2 shadow-2xl pointer-events-none"
      style={{ background: "rgba(167,139,250,0.15)", minWidth: "160px", opacity: 0.9 }}
    >
      <p className="font-quick font-semibold text-xs text-warm-text truncate">{label}</p>
      <p className="text-[10px] text-warm-textMuted font-space mt-0.5">⏱ {formatDuration(durationMinutes)}</p>
    </div>
  );
}

// ── Compute drop minute from a raw clientY pointer position ───────────────
function getMinutesFromPointerY(clientY: number): number | null {
  const scrollContainer = document.getElementById("timeline-scroll-container");
  if (!scrollContainer) return null;

  const containerRect = scrollContainer.getBoundingClientRect();
  const scrollTop = scrollContainer.scrollTop;

  // Position relative to the scrollable content top
  const relativeY = clientY - containerRect.top + scrollTop;
  if (relativeY < 0) return null;

  const rawMinutes = relativeY / MIN_PX;
  return snapToQuarter(Math.max(0, Math.min(rawMinutes, 24 * 60 - 15)));
}

// ── Check if a clientY is within the timeline column ─────────────────────
function isOverTimeline(clientX: number, clientY: number): boolean {
  const scrollContainer = document.getElementById("timeline-scroll-container");
  if (!scrollContainer) return false;
  const rect = scrollContainer.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export default function DndTimelineProvider({
  children,
  selectedDate,
  blocks,
  onCreateBlock,
  onUpdateBlock,
  onSwapBlocks,
  ghostBlock,
  setGhostBlock,
  onConflictConfirm,
}: DndTimelineProviderProps) {
  const [activeItem, setActiveItem] = useState<{
    type: "task" | "life" | "block";
    label: string;
    durationMinutes: number;
    id?: string;
  } | null>(null);

  // Track last known pointer position across all drag events
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Track whether pointer is currently over the timeline column
  const overTimeline = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // ── Drag start ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) return;

    // Capture initial pointer position
    const e = event.activatorEvent as PointerEvent;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    if (data.type === "task") {
      const task = data.task as Task;
      const dur = task.calibrated_estimate ?? task.estimated_minutes ?? 30;
      setActiveItem({ type: "task", label: task.title, durationMinutes: dur, id: task.id });
    } else if (data.type === "life") {
      const cat = data.category as LifeCategory;
      setActiveItem({ type: "life", label: `${cat.emoji} ${cat.label}`, durationMinutes: cat.defaultDurationMinutes });
    } else if (data.type === "block") {
      const block = data.block as TimelineBlock;
      const label = (block as any).task_title || block.life_label || "Block";
      setActiveItem({ type: "block", label, durationMinutes: block.planned_duration_minutes, id: block.id });
    }
  }, []);

  // ── Drag move — update pointer position and ghost ──────────────────────
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // @dnd-kit: activatorEvent is the original event, delta is cumulative displacement
    const activator = event.activatorEvent as PointerEvent;
    const currentX = activator.clientX + event.delta.x;
    const currentY = activator.clientY + event.delta.y;
    lastPointer.current = { x: currentX, y: currentY };

    const onTL = isOverTimeline(currentX, currentY);
    overTimeline.current = onTL;

    if (!onTL || !activeItem) {
      setGhostBlock(null);
      return;
    }

    const mins = getMinutesFromPointerY(currentY);
    if (mins === null) return;

    setGhostBlock({
      startMinutes: mins,
      durationMinutes: activeItem.durationMinutes,
      label: activeItem.label,
    });
  }, [activeItem, setGhostBlock]);

  // ── Drag end ───────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setGhostBlock(null);

    const { x: currentX, y: currentY } = lastPointer.current;
    const onTL = isOverTimeline(currentX, currentY);

    setActiveItem(null);

    if (!onTL) return; // dropped outside timeline — ignore

    const dropMins = getMinutesFromPointerY(currentY);
    if (dropMins === null) return;

    const data = event.active.data.current;
    if (!data) return;

    // ── Drop: task from bank → timeline ────────────────────────────
    if (data.type === "task") {
      const task = data.task as Task;
      const dur = task.calibrated_estimate ?? task.estimated_minutes ?? 30;

      const conflict = blocks.find(b => {
        const bStart = timeToMinutes(b.start_time);
        const bEnd = bStart + b.planned_duration_minutes;
        return dropMins < bEnd && (dropMins + dur) > bStart;
      });

      if (conflict && onConflictConfirm) {
        const label = (conflict as any).task_title || conflict.life_label || "another block";
        const swap = await onConflictConfirm(label);
        if (!swap) return;
        await onSwapBlocks(conflict.id, event.active.id as string);
        return;
      }

      await onCreateBlock({
        date: toDateString(selectedDate),
        block_type: "focus",
        task_id: task.id,
        life_category: null,
        life_label: null,
        life_emoji: null,
        start_time: minutesToTime(dropMins),
        planned_duration_minutes: dur,
        status: "planned",
        position_order: 0,
        layer: "plan",
      } as any);

    // ── Drop: life chip from bank → timeline ────────────────────────
    } else if (data.type === "life") {
      const cat = data.category as LifeCategory;

      await onCreateBlock({
        date: toDateString(selectedDate),
        block_type: "life",
        task_id: null,
        life_category: cat.id,
        life_label: cat.label,
        life_emoji: cat.emoji,
        start_time: minutesToTime(dropMins),
        planned_duration_minutes: cat.defaultDurationMinutes,
        status: "planned",
        position_order: 0,
        layer: "plan",
      });

    // ── Drop: move existing block ───────────────────────────────────
    } else if (data.type === "block") {
      const blockId = event.active.id as string;
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;

      const conflict = blocks.find(b => {
        if (b.id === blockId) return false;
        const bStart = timeToMinutes(b.start_time);
        const bEnd = bStart + b.planned_duration_minutes;
        const newEnd = dropMins + block.planned_duration_minutes;
        return dropMins < bEnd && newEnd > bStart;
      });

      if (conflict && onConflictConfirm) {
        const label = (conflict as any).task_title || conflict.life_label || "another block";
        const swap = await onConflictConfirm(label);
        if (!swap) return;
        await onSwapBlocks(blockId, conflict.id);
        return;
      }

      await onUpdateBlock(blockId, { start_time: minutesToTime(dropMins) });
    }
  }, [blocks, selectedDate, onCreateBlock, onUpdateBlock, onSwapBlocks, onConflictConfirm, setGhostBlock]);

  const handleDragCancel = useCallback(() => {
    setGhostBlock(null);
    setActiveItem(null);
  }, [setGhostBlock]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      {/* Drag overlay (floating card while dragging) */}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <DragOverlayCard
            label={activeItem.label}
            durationMinutes={activeItem.durationMinutes}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
