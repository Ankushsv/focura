"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type TimelineBlock,
  type DayTemplate,
  type DayTemplateBlock,
  type TimelineUserPrefs,
  minutesToTime,
  timeToMinutes,
  toDateString,
} from "@/lib/timeline/types";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimeline(date: string) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<TimelineUserPrefs>({
    wake_hour: 6,
    sleep_hour: 23,
    timeline_setup_done: false,
  });
  const [templates, setTemplates] = useState<DayTemplate[]>([]);

  // ── Load blocks for the given date ─────────────────────────────────────
  const loadBlocks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("timeline_blocks")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("start_time", { ascending: true });

      if (!error && data) {
        setBlocks(data as TimelineBlock[]);
      }
    } catch (err) {
      console.warn("Failed to load timeline blocks:", err);
    }
  }, [date]);

  // ── Load user prefs ────────────────────────────────────────────────────
  const loadPrefs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("wake_hour, sleep_hour, timeline_setup_done")
        .eq("id", user.id)
        .single();

      const localSetupDone = typeof window !== "undefined" && window.localStorage.getItem("focura_timeline_setup_done") === "true";

      if (data) {
        setPrefs({
          wake_hour: data.wake_hour ?? 6,
          sleep_hour: data.sleep_hour ?? 23,
          timeline_setup_done: data.timeline_setup_done || localSetupDone || false,
        });
      } else {
        setPrefs(prev => ({
          ...prev,
          timeline_setup_done: localSetupDone,
        }));
      }
    } catch (err) {
      console.warn("Failed to load timeline prefs:", err);
    }
  }, []);

  // ── Load templates ─────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("day_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setTemplates(data as DayTemplate[]);
    } catch (err) {
      console.warn("Failed to load templates:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadBlocks(), loadPrefs(), loadTemplates()]);
      } catch (err) {
        console.warn("Error initializing timeline hook:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => { active = false; };
  }, [date, loadBlocks, loadPrefs, loadTemplates]);

  // ── Save prefs ─────────────────────────────────────────────────────────
  const savePrefs = useCallback(async (updates: Partial<TimelineUserPrefs>) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update(updates).eq("id", user.id);
      
      if (updates.timeline_setup_done && typeof window !== "undefined") {
        window.localStorage.setItem("focura_timeline_setup_done", "true");
      }
      
      setPrefs(prev => ({ ...prev, ...updates }));
    } catch (err) {
      console.warn("Failed to save prefs:", err);
    }
  }, []);

  // ── Create block ───────────────────────────────────────────────────────
  const createBlock = useCallback(async (
    block: Omit<TimelineBlock, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<TimelineBlock | null> => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("timeline_blocks")
        .insert({ ...block, user_id: user.id })
        .select()
        .single();

      if (!error && data) {
        const newBlock = data as TimelineBlock;
        setBlocks(prev => [...prev, newBlock].sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        ));
        return newBlock;
      }
    } catch (err) {
      console.warn("Failed to create block:", err);
    }
    return null;
  }, []);

  // ── Update block ───────────────────────────────────────────────────────
  const updateBlock = useCallback(async (
    id: string,
    updates: Partial<TimelineBlock>
  ) => {
    // Optimistic update
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

    try {
      const supabase = createClient();
      await supabase.from("timeline_blocks").update(updates).eq("id", id);
    } catch (err) {
      console.warn("Failed to update block:", err);
      void loadBlocks(); // revert on error
    }
  }, [loadBlocks]);

  // ── Delete block ───────────────────────────────────────────────────────
  const deleteBlock = useCallback(async (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    try {
      const supabase = createClient();
      await supabase.from("timeline_blocks").delete().eq("id", id);
    } catch (err) {
      console.warn("Failed to delete block:", err);
      void loadBlocks();
    }
  }, [loadBlocks]);

  // ── Swap two blocks' start times ───────────────────────────────────────
  const swapBlocks = useCallback(async (idA: string, idB: string) => {
    const a = blocks.find(b => b.id === idA);
    const b = blocks.find(b => b.id === idB);
    if (!a || !b) return;

    await Promise.all([
      updateBlock(idA, { start_time: b.start_time }),
      updateBlock(idB, { start_time: a.start_time }),
    ]);
  }, [blocks, updateBlock]);

  // ── Push blocks after an overrun ───────────────────────────────────────
  const pushBlocksAfter = useCallback(async (
    overranBlockId: string,
    overrunMinutes: number
  ): Promise<string[]> => {
    const overranBlock = blocks.find(b => b.id === overranBlockId);
    if (!overranBlock) return [];

    const overranEndMinutes =
      timeToMinutes(overranBlock.start_time) + overranBlock.planned_duration_minutes;

    const pushable = blocks
      .filter(b => b.id !== overranBlockId && timeToMinutes(b.start_time) >= overranEndMinutes)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    const overflow: string[] = [];

    for (const block of pushable) {
      const newStartMins = timeToMinutes(block.start_time) + overrunMinutes;
      const newEndMins = newStartMins + block.planned_duration_minutes;

      if (newEndMins > 24 * 60) {
        overflow.push(block.id);
      }

      await updateBlock(block.id, { start_time: minutesToTime(newStartMins) });
    }

    return overflow;
  }, [blocks, updateBlock]);

  // ── Complete a session (save actual duration, push if needed) ──────────
  const completeSession = useCallback(async (
    blockId: string,
    actualMinutes: number
  ) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return { overflow: [] as string[], overrun: 0 };

    const overrun = actualMinutes - block.planned_duration_minutes;
    const status: TimelineBlock["status"] =
      actualMinutes < block.planned_duration_minutes
        ? "completed"
        : overrun > 5
        ? "overran"
        : "completed";

    await updateBlock(blockId, {
      status,
      actual_duration_minutes: actualMinutes,
      planned_duration_minutes: status === "overran"
        ? actualMinutes
        : block.planned_duration_minutes,
    });

    let overflow: string[] = [];
    if (status === "overran") {
      overflow = await pushBlocksAfter(blockId, overrun);
    }

    return { overflow, overrun: status === "overran" ? overrun : 0 };
  }, [blocks, updateBlock, pushBlocksAfter]);

  // ── Save current life blocks as template ───────────────────────────────
  const saveTemplate = useCallback(async (name: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const lifeBlocks: DayTemplateBlock[] = blocks
        .filter(b => b.block_type === "life")
        .map(b => ({
          block_type: "life" as const,
          life_category: b.life_category ?? undefined,
          life_label: b.life_label ?? undefined,
          life_emoji: b.life_emoji ?? undefined,
          start_time: b.start_time,
          planned_duration_minutes: b.planned_duration_minutes,
        }));

      const { data } = await supabase
        .from("day_templates")
        .insert({ user_id: user.id, name, blocks: lifeBlocks })
        .select()
        .single();

      if (data) {
        setTemplates(prev => [data as DayTemplate, ...prev]);
      }
    } catch (err) {
      console.warn("Failed to save template:", err);
    }
  }, [blocks]);

  // ── Apply a template (skip conflicts) ─────────────────────────────────
  const applyTemplate = useCallback(async (
    template: DayTemplate,
    onConflict?: (label: string) => Promise<boolean>
  ) => {
    for (const tblock of template.blocks) {
      const startMins = timeToMinutes(tblock.start_time);
      const endMins = startMins + tblock.planned_duration_minutes;

      // Check overlap
      const hasConflict = blocks.some(existing => {
        const eStart = timeToMinutes(existing.start_time);
        const eEnd = eStart + existing.planned_duration_minutes;
        return startMins < eEnd && endMins > eStart;
      });

      if (hasConflict) {
        const skip = onConflict
          ? !(await onConflict(tblock.life_label || tblock.life_category || "Block"))
          : true;
        if (skip) continue;
      }

      await createBlock({
        date,
        block_type: "life",
        life_category: tblock.life_category ?? null,
        life_label: tblock.life_label ?? null,
        life_emoji: tblock.life_emoji ?? null,
        start_time: tblock.start_time,
        planned_duration_minutes: tblock.planned_duration_minutes,
        status: "planned",
        position_order: 0,
        layer: "plan",
      });
    }
  }, [blocks, date, createBlock]);

  // ── Computed summary stats ─────────────────────────────────────────────
  const summary = (() => {
    const totalDayMinutes = 24 * 60;
    let focusPlanned = 0;
    let lifePlanned = 0;
    let completedCount = 0;

    for (const b of blocks) {
      if (b.block_type === "focus") {
        focusPlanned += b.actual_duration_minutes ?? b.planned_duration_minutes;
        if (b.status === "completed" || b.status === "overran") completedCount++;
      } else {
        lifePlanned += b.planned_duration_minutes;
      }
    }

    const free = Math.max(0, totalDayMinutes - focusPlanned - lifePlanned);

    return {
      focusMinutes: focusPlanned,
      lifeMinutes: lifePlanned,
      freeMinutes: free,
      completedTasks: completedCount,
      focusPct: Math.min(100, (focusPlanned / totalDayMinutes) * 100),
      lifePct: Math.min(100, (lifePlanned / totalDayMinutes) * 100),
      freePct: Math.min(100, (free / totalDayMinutes) * 100),
    };
  })();

  return {
    blocks,
    loading,
    prefs,
    templates,
    summary,
    loadBlocks,
    savePrefs,
    createBlock,
    updateBlock,
    deleteBlock,
    swapBlocks,
    pushBlocksAfter,
    completeSession,
    saveTemplate,
    applyTemplate,
  };
}
