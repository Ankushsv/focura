"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  uid,
  type Energy,
  type Priority,
  type Subtask,
  type Task,
} from "@/lib/tasks/types";

/**
 * Task state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergyState] = useState<Energy>("medium");
  const [loaded, setLoaded] = useState(false);

  // Load Tasks, Subtasks & Energy from Supabase
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch tasks
        const { data: dbTasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        // Fetch subtasks
        const { data: dbSubtasks } = await supabase
          .from("subtasks")
          .select("*")
          .eq("user_id", user.id);

        // Fetch profiles (for energy setting)
        const { data: profile } = await supabase
          .from("profiles")
          .select("energy")
          .eq("id", user.id)
          .single();

        if (active) {
          if (profile?.energy) {
            setEnergyState(profile.energy as Energy);
          }

          if (dbTasks) {
            const mappedTasks: Task[] = dbTasks.map((t: any) => {
              const subs = (dbSubtasks || [])
                .filter((s: any) => s.task_id === t.id)
                .map((s: any) => ({
                  id: s.id,
                  label: s.label || s.text || "",
                  text: s.label || s.text || "",
                  xp: s.xp || 10,
                  done: s.done || false,
                }));

              return {
                id: t.id,
                title: t.title,
                priority: t.priority as Priority,
                energy: (t.energy || t.energy_level || "medium") as Energy,
                tag: t.tag || undefined,
                xp: t.xp || 25,
                done: t.done || false,
                isBoss: t.is_boss || false,
                subtasks: subs,
                createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
                completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
                difficultyBefore: t.difficulty_before || undefined,
                difficultyAfter: t.difficulty_after || undefined,
                memoryNote: t.memory_note || undefined,
              };
            });
            setTasks(mappedTasks);
          }
        }
      } catch (err) {
        console.warn("Failed to load tasks from Supabase:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Update energy in database
  const setEnergy = useCallback((e: Energy) => {
    setEnergyState(e);
    void (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("profiles").update({ energy: e }).eq("id", user.id);
      } catch (err) {
        console.warn("Failed to save energy setting:", err);
      }
    })();
  }, []);

  // Helper to upsert tasks safely handling column differences
  const saveTaskToDb = useCallback(async (task: Task) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        id: task.id,
        user_id: user.id,
        title: task.title,
        priority: task.priority,
        energy: task.energy,
        energy_level: task.energy, // schema tolerance
        tag: task.tag || null,
        xp: task.xp,
        done: task.done,
        is_boss: task.isBoss,
        memory_note: task.memoryNote || null,
        difficulty_before: task.difficultyBefore || null,
        difficulty_after: task.difficultyAfter || null,
        completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
        created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
      };

      // Safe retry for columns
      let { error } = await supabase.from("tasks").upsert(payload);
      if (error) {
        const errMsg = error.message.toLowerCase();
        const cleanPayload = { ...payload } as any;
        if (errMsg.includes("energy_level")) {
          delete cleanPayload.energy_level;
        } else if (errMsg.includes("energy")) {
          delete cleanPayload.energy;
        }
        await supabase.from("tasks").upsert(cleanPayload);
      }

      // Upsert subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        const subPayloads = task.subtasks.map((sub) => ({
          id: sub.id,
          task_id: task.id,
          user_id: user.id,
          label: sub.text || "",
          text: sub.text || "",
          xp: sub.xp || 10,
          done: sub.done || false,
        }));
        
        let { error: subErr } = await supabase.from("subtasks").upsert(subPayloads);
        if (subErr) {
          const errMsg = subErr.message.toLowerCase();
          const cleanSubs = subPayloads.map(sub => {
            const cleanSub = { ...sub } as any;
            if (errMsg.includes("user_id")) delete cleanSub.user_id;
            if (errMsg.includes("label")) delete cleanSub.label;
            if (errMsg.includes("text")) delete cleanSub.text;
            return cleanSub;
          });
          await supabase.from("subtasks").upsert(cleanSubs);
        }
      }
    } catch (err) {
      console.warn("Failed to save task to Supabase:", err);
    }
  }, []);

  const patchTask = useCallback(
    (id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)) => {
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t
        );
        const updatedTask = next.find((t) => t.id === id);
        if (updatedTask) {
          void saveTaskToDb(updatedTask);
        }
        return next;
      });
    },
    [saveTaskToDb]
  );

  const addTask = useCallback(
    (input: { title: string; priority: Priority; energy: Energy; tag?: string }) => {
      const task: Task = {
        id: uid(),
        title: input.title,
        priority: input.priority,
        energy: input.energy,
        tag: input.tag,
        xp: input.priority === "critical" ? 50 : input.priority === "high" ? 35 : 25,
        done: false,
        isBoss: false,
        subtasks: [],
        createdAt: Date.now(),
      };
      setTasks((prev) => {
        const next = [task, ...prev];
        void saveTaskToDb(task);
        return next;
      });
      return task;
    },
    [saveTaskToDb]
  );

  const completeTask = useCallback(
    (id: string) => patchTask(id, { done: true, completedAt: Date.now() }),
    [patchTask]
  );

  const toggleSubtask = useCallback(
    (taskId: string, subId: string) => {
      patchTask(taskId, (t) => ({
        subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
      }));
    },
    [patchTask]
  );

  const applyBreakdown = useCallback(
    (taskId: string, subtasks: Subtask[]) => patchTask(taskId, { subtasks, isBoss: true }),
    [patchTask]
  );

  const setMemoryNote = useCallback(
    (taskId: string, memoryNote: string) => patchTask(taskId, { memoryNote }),
    [patchTask]
  );

  const rateDifficulty = useCallback(
    (taskId: string, difficultyBefore: number) => patchTask(taskId, { difficultyBefore }),
    [patchTask]
  );

  const rateDifficultyAfter = useCallback(
    (taskId: string, difficultyAfter: number) => patchTask(taskId, { difficultyAfter }),
    [patchTask]
  );

  return {
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
    rateDifficultyAfter,
  };
}
