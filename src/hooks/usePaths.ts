"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type MasteryPath,
  type PathNode,
  type NodeStatus,
  generateSkillTree,
  uid,
} from "@/lib/paths/types";

const STORE_KEY = "focura.paths.v1";

export function usePaths() {
  const [paths, setPaths] = useState<MasteryPath[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      setPaths(raw ? (JSON.parse(raw) as MasteryPath[]) : []);
    } catch {
      setPaths([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORE_KEY, JSON.stringify(paths));
  }, [paths, loaded]);

  const addPath = useCallback(
    async (input: { title: string; goal: string; category: MasteryPath["category"] }) => {
      try {
        const response = await fetch("/api/paths", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            goal: input.goal,
            category: input.category,
          }),
        });

        if (!response.ok) throw new Error("API failed");
        const data = await response.json();

        const path: MasteryPath = {
          id: uid(),
          title: input.title,
          goal: input.goal,
          category: input.category,
          createdAt: Date.now(),
          nodes: data.nodes,
        };
        setPaths((prev) => [path, ...prev]);
        return path;
      } catch (error) {
        console.warn("AI path generation failed, falling back to templates:", error);
        const nodes = generateSkillTree(input.category);
        const path: MasteryPath = {
          id: uid(),
          title: input.title,
          goal: input.goal,
          category: input.category,
          createdAt: Date.now(),
          nodes,
        };
        setPaths((prev) => [path, ...prev]);
        return path;
      }
    },
    []
  );

  const unlockNode = useCallback((pathId: string, nodeId: string): number => {
    let xpEarned = 0;
    setPaths((prev) =>
      prev.map((p) => {
        if (p.id !== pathId) return p;
        const updatedNodes = p.nodes.map((n) => {
          if (n.id === nodeId && n.status === "available") {
            xpEarned = n.xp;
            return { ...n, status: "done" as NodeStatus };
          }
          return n;
        });
        // Unlock children of the just-completed node
        const doneNode = updatedNodes.find((n) => n.id === nodeId);
        if (doneNode) {
          doneNode.children.forEach((childId) => {
            const child = updatedNodes.find((n) => n.id === childId);
            if (child && child.status === "locked") {
              child.status = "available";
            }
          });
        }
        return { ...p, nodes: [...updatedNodes] };
      })
    );
    return xpEarned;
  }, []);

  const deletePath = useCallback((pathId: string) => {
    setPaths((prev) => prev.filter((p) => p.id !== pathId));
  }, []);

  return { paths, loaded, addPath, unlockNode, deletePath };
}
