"use client";

import { useCallback, useEffect, useState } from "react";
import {
  seedTasks,
  uid,
  type Energy,
  type Priority,
  type Subtask,
  type Task,
} from "@/lib/tasks/types";

const STORE_KEY = "focura.tasks.v1";
const ENERGY_KEY = "focura.energy.v1";

/**
 * Task state with localStorage persistence.
 * Supabase sync (tables in 0002_tasks.sql) is wired in once auth gating lands;
 * the action surface below maps 1:1 onto those tables.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergyState] = useState<Energy>("medium");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      setTasks(raw ? (JSON.parse(raw) as Task[]) : seedTasks());
      const e = localStorage.getItem(ENERGY_KEY) as Energy | null;
      if (e) setEnergyState(e);
    } catch {
      setTasks(seedTasks());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const setEnergy = useCallback((e: Energy) => {
    setEnergyState(e);
    localStorage.setItem(ENERGY_KEY, e);
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t))
    );
  }, []);

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
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    []
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
