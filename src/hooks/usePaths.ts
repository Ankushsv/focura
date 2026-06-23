"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type MasteryPath,
  type PathNode,
  type NodeStatus,
  generateSkillTree,
  uid,
} from "@/lib/paths/types";

/**
 * Mastery Paths state with direct Supabase database persistence.
 * Completely removes local storage.
 */
export function usePaths() {
  const [paths, setPaths] = useState<MasteryPath[]>([]);
  const [loaded, setLoaded] = useState(false);

  const pathsRef = useRef(paths);
  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  // Fetch paths from Supabase
  useEffect(() => {
    let active = true;

    async function loadPaths() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dbPaths, error: pathsError } = await supabase
          .from("paths")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (pathsError) throw pathsError;

        const { data: dbNodes, error: nodesError } = await supabase
          .from("path_nodes")
          .select("*")
          .eq("user_id", user.id);

        if (nodesError) throw nodesError;

        if (active && dbPaths) {
          const mappedPaths: MasteryPath[] = dbPaths.map((p: any) => {
            const nodes = (dbNodes || [])
              .filter((n: any) => n.path_id === p.id)
              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((n: any) => ({
                id: n.id,
                label: n.label,
                description: n.description || "",
                xp: n.xp || 30,
                status: n.status as NodeStatus,
                children: [] as string[],
              }));

            // Chain child nodes sequentially
            for (let i = 0; i < nodes.length - 1; i++) {
              nodes[i].children = [nodes[i + 1].id];
            }

            return {
              id: p.id,
              title: p.title,
              goal: p.goal || "",
              category: p.category,
              createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
              nodes,
            };
          });
          setPaths(mappedPaths);
        }
      } catch (err) {
        console.error("Failed to load paths from Supabase:", err);
      } finally {
        if (active) setLoaded(true);
      }
    }

    loadPaths();

    return () => {
      active = false;
    };
  }, []);

  const savePathToDb = useCallback(async (path: MasteryPath) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: pathError } = await supabase.from("paths").upsert({
        id: path.id,
        user_id: user.id,
        title: path.title,
        goal: path.goal || null,
        category: path.category,
        created_at: path.createdAt ? new Date(path.createdAt).toISOString() : new Date().toISOString(),
      });

      if (pathError) {
        console.error("Failed to upsert path in DB:", pathError);
        return;
      }

      if (path.nodes && path.nodes.length > 0) {
        const nodePayloads = path.nodes.map((node, idx) => ({
          id: node.id,
          path_id: path.id,
          user_id: user.id,
          label: node.label,
          description: node.description || null,
          xp: node.xp,
          status: node.status,
          parent_id: idx > 0 ? path.nodes[idx - 1].id : null,
          sort_order: idx,
        }));

        // Upsert sequentially to prevent foreign key constraint race conditions in the DB
        for (const payload of nodePayloads) {
          const { error: nodeError } = await supabase
            .from("path_nodes")
            .upsert(payload);
          if (nodeError) {
            console.error("Failed to upsert path node in DB:", payload.label, nodeError);
          }
        }
      }
    } catch (err) {
      console.error("Failed to save path to Supabase:", err);
    }
  }, []);

  const addPath = useCallback(
    async (input: { title: string; goal: string; category: MasteryPath["category"] }) => {
      let path: MasteryPath;
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

        path = {
          id: uid(),
          title: input.title,
          goal: input.goal,
          category: input.category,
          createdAt: Date.now(),
          nodes: data.nodes,
        };
      } catch (error) {
        console.warn("AI path generation failed, falling back to templates:", error);
        const nodes = generateSkillTree(input.category);
        path = {
          id: uid(),
          title: input.title,
          goal: input.goal,
          category: input.category,
          createdAt: Date.now(),
          nodes,
        };
      }
      
      setPaths((prev) => [path, ...prev]);
      void savePathToDb(path);
      return path;
    },
    [savePathToDb]
  );

  const unlockNode = useCallback(
    (pathId: string, nodeId: string): number => {
      const currentPaths = pathsRef.current;
      const path = currentPaths.find((p) => p.id === pathId);
      if (!path) return 0;

      let xpEarned = 0;
      const nodesList = path.nodes || [];
      const updatedNodes = nodesList.map((n) => {
        if (n.id === nodeId && n.status === "available") {
          xpEarned = n.xp;
          return { ...n, status: "done" as NodeStatus };
        }
        return n;
      });

      const doneNode = updatedNodes.find((n) => n.id === nodeId);
      if (doneNode) {
        doneNode.children.forEach((childId) => {
          const child = updatedNodes.find((n) => n.id === childId);
          if (child && child.status === "locked") {
            child.status = "available";
          }
        });
      }

      const targetPath = { ...path, nodes: updatedNodes };

      // Update state synchronously
      setPaths((prev) => prev.map((p) => (p.id === pathId ? targetPath : p)));

      // Save to DB immediately
      void savePathToDb(targetPath);

      return xpEarned;
    },
    [savePathToDb]
  );

  const deletePath = useCallback((pathId: string) => {
    setPaths((prev) => prev.filter((p) => p.id !== pathId));
    void (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("paths").delete().eq("id", pathId).eq("user_id", user.id);
        if (error) {
          console.error("Failed to delete path from DB:", error);
        }
      } catch (err) {
        console.error("Failed to delete path from Supabase:", err);
      }
    })();
  }, []);

  return { paths, loaded, addPath, unlockNode, deletePath };
}
