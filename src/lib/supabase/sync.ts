import { createClient } from "@/lib/supabase/client";

const XP_KEY = "focura.xp.v1";
const TASKS_KEY = "focura.tasks.v1";
const ENERGY_KEY = "focura.energy.v1";
const PATHS_KEY = "focura.paths.v1";
const CONTRACTS_KEY = "focura.contracts.v1";
const CHALLENGES_KEY = "focura.challenges.v1";
const REWARDS_KEY = "focura.rewards.v1";
const MEMORY_KEY = "focura.memory.v1";
const SESSIONS_KEY = "focura.sessions.v1";
const COACH_KEY = "focura.coach.v1";
const USERNAME_KEY = "focura.username";
const AVATAR_KEY = "focura.avatar";
const SYNC_USER_KEY = "focura.sync.userId";

// Level helper from @/lib/xp/levels
function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Perform a safe upsert to handle database column mismatches (e.g. energy vs energy_level, text vs label)
 */
async function safeUpsert(table: string, records: any | any[]) {
  const supabase = createClient();
  const isArray = Array.isArray(records);
  const list = isArray ? records : [records];
  
  if (list.length === 0) return { data: [], error: null };

  // Helper to remove keys and try again
  const attemptUpsert = async (payload: any[]) => {
    return await supabase.from(table).upsert(payload);
  };

  let { data, error } = await attemptUpsert(list);

  if (error) {
    console.warn(`Initial upsert to ${table} failed, attempting schema-matching fallback...`, error);
    
    // Check if error is due to missing columns
    const errMsg = error.message.toLowerCase();
    
    if (table === "tasks") {
      // Try resolving tasks column conflicts
      const fallbackList = list.map(item => {
        const copy = { ...item };
        if (errMsg.includes("energy_level")) {
          delete copy.energy_level;
        } else if (errMsg.includes("energy")) {
          delete copy.energy;
        }
        return copy;
      });
      const res = await attemptUpsert(fallbackList);
      data = res.data;
      error = res.error;
    } else if (table === "subtasks") {
      // Try resolving subtasks column conflicts
      const fallbackList = list.map(item => {
        const copy = { ...item };
        if (errMsg.includes("user_id")) {
          delete copy.user_id;
        }
        if (errMsg.includes("label")) {
          delete copy.label;
        }
        if (errMsg.includes("text")) {
          delete copy.text;
        }
        return copy;
      });
      const res = await attemptUpsert(fallbackList);
      data = res.data;
      error = res.error;
    }
  }

  return { data, error };
}

/**
 * 1. Sync Task to Supabase
 */
export async function syncTaskToDb(task: any, userId: string) {
  try {
    const taskPayload = {
      id: task.id,
      user_id: userId,
      title: task.title,
      priority: task.priority,
      energy: task.energy,
      energy_level: task.energy, // duplicate for schema tolerance
      tag: task.tag || null,
      xp: task.xp || 25,
      done: task.done || false,
      is_boss: task.isBoss || false,
      memory_note: task.memoryNote || null,
      difficulty_before: task.difficultyBefore || null,
      difficulty_after: task.difficultyAfter || null,
      completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
      created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString()
    };

    await safeUpsert("tasks", taskPayload);

    if (task.subtasks && task.subtasks.length > 0) {
      await syncSubtasksToDb(task.subtasks, task.id, userId);
    }
  } catch (err) {
    console.warn("Error syncing task to DB:", err);
  }
}

/**
 * Sync Subtasks
 */
export async function syncSubtasksToDb(subtasks: any[], taskId: string, userId: string) {
  try {
    const subPayloads = subtasks.map(sub => ({
      id: sub.id,
      task_id: taskId,
      user_id: userId,
      label: sub.label || sub.text || "",
      text: sub.label || sub.text || "",
      xp: sub.xp || 10,
      done: sub.done || false
    }));
    await safeUpsert("subtasks", subPayloads);
  } catch (err) {
    console.warn("Error syncing subtasks to DB:", err);
  }
}

/**
 * 2. Sync Paths
 */
export async function syncPathToDb(path: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("paths").upsert({
      id: path.id,
      user_id: userId,
      title: path.title,
      goal: path.goal || null,
      category: path.category,
      created_at: path.createdAt ? new Date(path.createdAt).toISOString() : new Date().toISOString()
    });

    if (path.nodes && path.nodes.length > 0) {
      const nodePayloads = path.nodes.map((node: any, idx: number) => {
        const parentId = idx > 0 ? path.nodes[idx - 1].id : null;
        return {
          id: node.id,
          path_id: path.id,
          user_id: userId,
          label: node.label,
          description: node.description || null,
          xp: node.xp || 30,
          status: node.status,
          parent_id: parentId,
          sort_order: idx,
          created_at: path.createdAt ? new Date(path.createdAt).toISOString() : new Date().toISOString()
        };
      });
      await supabase.from("path_nodes").upsert(nodePayloads);
    }
  } catch (err) {
    console.warn("Error syncing path to DB:", err);
  }
}

export async function deletePathFromDb(pathId: string, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("paths").delete().eq("id", pathId).eq("user_id", userId);
  } catch (err) {
    console.warn("Error deleting path from DB:", err);
  }
}

/**
 * 3. Sync Contracts & Check-ins
 */
export async function syncContractToDb(contract: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("contracts").upsert({
      id: contract.id,
      user_id: userId,
      title: contract.title,
      description: contract.description || null,
      frequency: contract.frequency,
      shields_max: contract.shieldsMax,
      shields_used: contract.shieldsUsed,
      xp_per_checkin: contract.xpPerCheckin || 15,
      streak: contract.streak,
      best_streak: contract.bestStreak,
      created_at: contract.createdAt ? new Date(contract.createdAt).toISOString() : new Date().toISOString()
    });

    if (contract.checkIns && contract.checkIns.length > 0) {
      const checkinPayloads = contract.checkIns.map((ci: any) => ({
        contract_id: contract.id,
        user_id: userId,
        date: ci.date,
        done: ci.done || false
      }));
      await supabase.from("contract_checkins").upsert(checkinPayloads);
    }
  } catch (err) {
    console.warn("Error syncing contract to DB:", err);
  }
}

export async function deleteContractFromDb(contractId: string, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("contracts").delete().eq("id", contractId).eq("user_id", userId);
  } catch (err) {
    console.warn("Error deleting contract from DB:", err);
  }
}

export async function syncCheckinToDb(checkin: any, contractId: string, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("contract_checkins").upsert({
      contract_id: contractId,
      user_id: userId,
      date: checkin.date,
      done: checkin.done
    });
  } catch (err) {
    console.warn("Error syncing checkin to DB:", err);
  }
}

/**
 * 4. Sync Challenges
 */
export async function syncChallengeToDb(challenge: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("challenges").upsert({
      id: challenge.id,
      user_id: userId,
      title: challenge.title,
      description: challenge.description || null,
      category: challenge.category,
      icon: challenge.icon || null,
      target: challenge.target,
      progress: challenge.progress,
      xp_reward: challenge.xpReward,
      claimed: challenge.claimed || false,
      expires_at: new Date(challenge.expiresAt).toISOString(),
      created_at: challenge.createdAt ? new Date(challenge.createdAt).toISOString() : new Date().toISOString()
    });
  } catch (err) {
    console.warn("Error syncing challenge to DB:", err);
  }
}

/**
 * 5. Sync Rewards
 */
export async function syncRewardToDb(rewardId: string, equipped: boolean, userId: string) {
  try {
    const supabase = createClient();
    // Insert/update in user_rewards
    await supabase.from("user_rewards").upsert({
      user_id: userId,
      reward_id: rewardId,
      equipped: equipped,
      unlocked_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Error syncing reward to DB:", err);
  }
}

/**
 * 6. Sync Memory Notes
 */
export async function syncMemoryNoteToDb(note: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("memory_notes").upsert({
      id: note.id,
      user_id: userId,
      text: note.text,
      tag: note.tag,
      task_id: note.taskId || null,
      created_at: note.createdAt ? new Date(note.createdAt).toISOString() : new Date().toISOString()
    });
  } catch (err) {
    console.warn("Error syncing memory note to DB:", err);
  }
}

export async function deleteMemoryNoteFromDb(noteId: string, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("memory_notes").delete().eq("id", noteId).eq("user_id", userId);
  } catch (err) {
    console.warn("Error deleting memory note from DB:", err);
  }
}

/**
 * 7. Sync Sessions
 */
export async function syncSessionToDb(session: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("sessions").upsert({
      user_id: userId,
      task_id: session.taskId || null,
      task_title: session.taskTitle,
      planned_minutes: session.plannedMinutes,
      actual_minutes: session.actualMinutes,
      ended_at: new Date(session.endedAt).toISOString()
    });
  } catch (err) {
    console.warn("Error syncing session to DB:", err);
  }
}

/**
 * 8. Sync Coach Messages
 */
export async function syncCoachMessageToDb(message: any, userId: string) {
  try {
    const supabase = createClient();
    await supabase.from("coach_messages").upsert({
      user_id: userId,
      role: message.role,
      text: message.text,
      created_at: message.ts ? new Date(message.ts).toISOString() : new Date().toISOString()
    });
  } catch (err) {
    console.warn("Error syncing coach message to DB:", err);
  }
}

/**
 * Bidirectional sync function on login
 */
export async function syncAll(userId: string) {
  try {
    console.log("Synchronizing Focura with the Cloud...");
    const supabase = createClient();

    // 1. Sync Profile & XP
    const localXp = parseInt(localStorage.getItem(XP_KEY) || "0", 10);
    const localUsername = localStorage.getItem(USERNAME_KEY) || "";
    const localAvatar = localStorage.getItem(AVATAR_KEY) || "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      // Profile does not exist, upload local profile
      await supabase.from("profiles").insert({
        id: userId,
        username: localUsername || null,
        avatar_emoji: localAvatar || null,
        total_xp: localXp,
        level: levelFromXp(localXp)
      });
    } else {
      // Profile exists in DB. If local has more XP, upload local XP. Otherwise, update local storage.
      if (localXp > (profile.total_xp || 0)) {
        await supabase.from("profiles").update({
          username: localUsername || profile.username || null,
          avatar_emoji: localAvatar || profile.avatar_emoji || null,
          total_xp: localXp,
          level: levelFromXp(localXp)
        }).eq("id", userId);
      } else {
        localStorage.setItem(XP_KEY, String(profile.total_xp || 0));
        if (profile.username) localStorage.setItem(USERNAME_KEY, profile.username);
        if (profile.avatar_emoji) localStorage.setItem(AVATAR_KEY, profile.avatar_emoji);
      }
    }

    // 2. Sync Tasks & Subtasks
    const { data: dbTasks } = await supabase.from("tasks").select("*").eq("user_id", userId);
    const { data: dbSubtasks } = await supabase.from("subtasks").select("*").eq("user_id", userId);

    const localTasksRaw = localStorage.getItem(TASKS_KEY);
    const localTasks = localTasksRaw ? JSON.parse(localTasksRaw) : [];

    if (!dbTasks || dbTasks.length === 0) {
      // Cloud is empty, upload all local tasks
      if (localTasks.length > 0) {
        for (const task of localTasks) {
          await syncTaskToDb(task, userId);
        }
      }
    } else {
      // Merge tasks
      const mergedTasksMap = new Map<string, any>();
      
      // Load cloud tasks
      dbTasks.forEach((t: any) => {
        const tSubtasks = (dbSubtasks || [])
          .filter((sub: any) => sub.task_id === t.id)
          .map((sub: any) => ({
            id: sub.id,
            label: sub.label || sub.text || "",
            text: sub.label || sub.text || "",
            xp: sub.xp || 10,
            done: sub.done || false
          }));

        mergedTasksMap.set(t.id, {
          id: t.id,
          title: t.title,
          priority: t.priority,
          energy: t.energy || t.energy_level || "medium",
          tag: t.tag,
          xp: t.xp,
          done: t.done,
          isBoss: t.is_boss,
          subtasks: tSubtasks,
          createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
          completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
          difficultyBefore: t.difficulty_before,
          difficultyAfter: t.difficulty_after,
          memoryNote: t.memory_note
        });
      });

      // Overlay local tasks
      localTasks.forEach((t: any) => {
        const exists = mergedTasksMap.get(t.id);
        if (!exists) {
          // Upload local-only task to cloud
          mergedTasksMap.set(t.id, t);
          void syncTaskToDb(t, userId);
        } else {
          // If local version has newer completion or changes, let local win and sync to DB
          if (t.done && !exists.done) {
            exists.done = true;
            exists.completedAt = t.completedAt || Date.now();
            void syncTaskToDb(exists, userId);
          }
        }
      });

      const mergedTasksArray = Array.from(mergedTasksMap.values());
      localStorage.setItem(TASKS_KEY, JSON.stringify(mergedTasksArray));
    }

    // 3. Sync Mastery Paths
    const { data: dbPaths } = await supabase.from("paths").select("*").eq("user_id", userId);
    const { data: dbPathNodes } = await supabase.from("path_nodes").select("*").eq("user_id", userId);

    const localPathsRaw = localStorage.getItem(PATHS_KEY);
    const localPaths = localPathsRaw ? JSON.parse(localPathsRaw) : [];

    if (!dbPaths || dbPaths.length === 0) {
      if (localPaths.length > 0) {
        for (const path of localPaths) {
          await syncPathToDb(path, userId);
        }
      }
    } else {
      const mergedPathsMap = new Map<string, any>();
      
      dbPaths.forEach((p: any) => {
        const nodes = (dbPathNodes || [])
          .filter((n: any) => n.path_id === p.id)
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((n: any) => ({
            id: n.id,
            label: n.label,
            description: n.description,
            xp: n.xp,
            status: n.status,
            children: [] as string[]
          }));

        // Chain child nodes sequentially
        for (let i = 0; i < nodes.length - 1; i++) {
          nodes[i].children = [nodes[i + 1].id];
        }

        mergedPathsMap.set(p.id, {
          id: p.id,
          title: p.title,
          goal: p.goal,
          category: p.category,
          createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          nodes
        });
      });

      localPaths.forEach((p: any) => {
        const exists = mergedPathsMap.get(p.id);
        if (!exists) {
          mergedPathsMap.set(p.id, p);
          void syncPathToDb(p, userId);
        } else {
          // Merge node unlock statuses
          p.nodes.forEach((n: any) => {
            const matchNode = exists.nodes.find((en: any) => en.id === n.id);
            if (matchNode && n.status === "done" && matchNode.status !== "done") {
              matchNode.status = "done";
              // Update children availability in exists
              const doneIdx = exists.nodes.findIndex((en: any) => en.id === n.id);
              if (doneIdx !== -1 && doneIdx < exists.nodes.length - 1) {
                exists.nodes[doneIdx + 1].status = "available";
              }
              void syncPathToDb(exists, userId);
            }
          });
        }
      });

      localStorage.setItem(PATHS_KEY, JSON.stringify(Array.from(mergedPathsMap.values())));
    }

    // 4. Sync Contracts & Check-ins
    const { data: dbContracts } = await supabase.from("contracts").select("*").eq("user_id", userId);
    const { data: dbCheckins } = await supabase.from("contract_checkins").select("*").eq("user_id", userId);

    const localContractsRaw = localStorage.getItem(CONTRACTS_KEY);
    const localContracts = localContractsRaw ? JSON.parse(localContractsRaw) : [];

    if (!dbContracts || dbContracts.length === 0) {
      if (localContracts.length > 0) {
        for (const c of localContracts) {
          await syncContractToDb(c, userId);
        }
      }
    } else {
      const mergedContractsMap = new Map<string, any>();
      
      dbContracts.forEach((c: any) => {
        const checkins = (dbCheckins || [])
          .filter((ci: any) => ci.contract_id === c.id)
          .map((ci: any) => ({
            date: ci.date,
            done: ci.done
          }));

        mergedContractsMap.set(c.id, {
          id: c.id,
          title: c.title,
          description: c.description || "",
          frequency: c.frequency,
          shieldsMax: c.shields_max,
          shieldsUsed: c.shields_used,
          xpPerCheckin: c.xp_per_checkin,
          streak: c.streak,
          bestStreak: c.best_streak,
          checkIns: checkins,
          createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now()
        });
      });

      localContracts.forEach((c: any) => {
        const exists = mergedContractsMap.get(c.id);
        if (!exists) {
          mergedContractsMap.set(c.id, c);
          void syncContractToDb(c, userId);
        } else {
          // If local streak is higher or has new checkins, merge
          if (c.streak > exists.streak || c.checkIns.length > exists.checkIns.length) {
            exists.streak = Math.max(c.streak, exists.streak);
            exists.bestStreak = Math.max(c.bestStreak, exists.bestStreak);
            exists.shieldsUsed = c.shieldsUsed;
            // merge checkins uniquely
            const dateSet = new Set(exists.checkIns.map((ci: any) => ci.date));
            c.checkIns.forEach((ci: any) => {
              if (!dateSet.has(ci.date)) {
                exists.checkIns.push(ci);
              }
            });
            void syncContractToDb(exists, userId);
          }
        }
      });

      localStorage.setItem(CONTRACTS_KEY, JSON.stringify(Array.from(mergedContractsMap.values())));
    }

    // 5. Sync Challenges
    const { data: dbChallenges } = await supabase.from("challenges").select("*").eq("user_id", userId);
    const localChallengesRaw = localStorage.getItem(CHALLENGES_KEY);
    const localChallenges = localChallengesRaw ? JSON.parse(localChallengesRaw) : [];

    if (!dbChallenges || dbChallenges.length === 0) {
      if (localChallenges.length > 0) {
        for (const c of localChallenges) {
          await syncChallengeToDb(c, userId);
        }
      }
    } else {
      const mergedChallengesMap = new Map<string, any>();
      dbChallenges.forEach((c: any) => {
        mergedChallengesMap.set(c.id, {
          id: c.id,
          title: c.title,
          description: c.description || "",
          category: c.category,
          icon: c.icon || "⚔️",
          target: c.target,
          progress: c.progress,
          xpReward: c.xp_reward,
          claimed: c.claimed,
          expiresAt: new Date(c.expires_at).getTime(),
          createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now()
        });
      });

      localChallenges.forEach((c: any) => {
        const exists = mergedChallengesMap.get(c.id);
        if (!exists) {
          mergedChallengesMap.set(c.id, c);
          void syncChallengeToDb(c, userId);
        } else {
          if (c.progress > exists.progress || c.claimed) {
            exists.progress = Math.max(c.progress, exists.progress);
            exists.claimed = exists.claimed || c.claimed;
            void syncChallengeToDb(exists, userId);
          }
        }
      });

      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(Array.from(mergedChallengesMap.values())));
    }

    // 6. Sync Rewards Collection
    const { data: dbRewards } = await supabase.from("user_rewards").select("*").eq("user_id", userId);
    const localRewardsRaw = localStorage.getItem(REWARDS_KEY);
    
    if (localRewardsRaw) {
      const localRewards = JSON.parse(localRewardsRaw);
      if (dbRewards && dbRewards.length > 0) {
        // Overlay cloud rewards onto local rewards
        const cloudUnlockedMap = new Map(dbRewards.map((r: any) => [r.reward_id, r]));
        const updatedRewards = localRewards.map((r: any) => {
          const cloudReward = cloudUnlockedMap.get(r.id);
          if (cloudReward) {
            return { ...r, unlocked: true, equipped: cloudReward.equipped };
          }
          return r;
        });
        localStorage.setItem(REWARDS_KEY, JSON.stringify(updatedRewards));

        // Push any reward that is unlocked locally but missing in DB
        localRewards.forEach((r: any) => {
          if (r.unlocked && !cloudUnlockedMap.has(r.id)) {
            void syncRewardToDb(r.id, r.equipped, userId);
          }
        });
      } else {
        // DB is empty, push all local unlocked rewards
        localRewards.forEach((r: any) => {
          if (r.unlocked) {
            void syncRewardToDb(r.id, r.equipped, userId);
          }
        });
      }
    }

    // 7. Sync Memory Notes
    const { data: dbNotes } = await supabase.from("memory_notes").select("*").eq("user_id", userId);
    const localNotesRaw = localStorage.getItem(MEMORY_KEY);
    const localNotes = localNotesRaw ? JSON.parse(localNotesRaw) : [];

    if (!dbNotes || dbNotes.length === 0) {
      if (localNotes.length > 0) {
        for (const note of localNotes) {
          await syncMemoryNoteToDb(note, userId);
        }
      }
    } else {
      const mergedNotesMap = new Map<string, any>();
      dbNotes.forEach((n: any) => {
        mergedNotesMap.set(n.id, {
          id: n.id,
          text: n.text,
          tag: n.tag,
          taskId: n.task_id,
          createdAt: n.created_at ? new Date(n.created_at).getTime() : Date.now()
        });
      });

      localNotes.forEach((n: any) => {
        if (!mergedNotesMap.has(n.id)) {
          mergedNotesMap.set(n.id, n);
          void syncMemoryNoteToDb(n, userId);
        }
      });

      localStorage.setItem(MEMORY_KEY, JSON.stringify(Array.from(mergedNotesMap.values())));
    }

    // 8. Sync Focus Sessions
    const { data: dbSessions } = await supabase.from("sessions").select("*").eq("user_id", userId);
    const localSessionsRaw = localStorage.getItem(SESSIONS_KEY);
    const localSessions = localSessionsRaw ? JSON.parse(localSessionsRaw) : [];

    if (!dbSessions || dbSessions.length === 0) {
      if (localSessions.length > 0) {
        for (const s of localSessions.slice(0, 100)) { // limit sync to top 100 to avoid request sizes
          await syncSessionToDb(s, userId);
        }
      }
    } else {
      const mergedSessionsMap = new Map<string, any>();
      dbSessions.forEach((s: any) => {
        const key = `${s.task_id || "null"}-${s.ended_at}`;
        mergedSessionsMap.set(key, {
          id: Math.random().toString(36).slice(2, 10),
          taskId: s.task_id,
          taskTitle: s.task_title || "Focus Battle",
          plannedMinutes: s.planned_minutes,
          actualMinutes: s.actual_minutes,
          endedAt: new Date(s.ended_at).getTime()
        });
      });

      localSessions.forEach((s: any) => {
        const key = `${s.taskId || "null"}-${new Date(s.endedAt).toISOString()}`;
        if (!mergedSessionsMap.has(key)) {
          mergedSessionsMap.set(key, s);
          void syncSessionToDb(s, userId);
        }
      });

      const sortedSessions = Array.from(mergedSessionsMap.values())
        .sort((a: any, b: any) => b.endedAt - a.endedAt);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sortedSessions.slice(0, 500)));
    }

    // 9. Sync Coach Messages
    const { data: dbMessages } = await supabase.from("coach_messages").select("*").eq("user_id", userId);
    const localCoachRaw = localStorage.getItem(COACH_KEY);
    const localCoach = localCoachRaw ? JSON.parse(localCoachRaw) : [];

    if (!dbMessages || dbMessages.length === 0) {
      if (localCoach.length > 0) {
        for (const m of localCoach) {
          await syncCoachMessageToDb(m, userId);
        }
      }
    } else {
      const mergedMsgMap = new Map<string, any>();
      dbMessages.forEach((m: any) => {
        const key = `${m.role}-${m.created_at}`;
        mergedMsgMap.set(key, {
          role: m.role,
          text: m.text,
          ts: new Date(m.created_at).getTime()
        });
      });

      localCoach.forEach((m: any) => {
        const key = `${m.role}-${new Date(m.ts).toISOString()}`;
        if (!mergedMsgMap.has(key)) {
          mergedMsgMap.set(key, m);
          void syncCoachMessageToDb(m, userId);
        }
      });

      const sortedMsgs = Array.from(mergedMsgMap.values())
        .sort((a: any, b: any) => a.ts - b.ts);
      localStorage.setItem(COACH_KEY, JSON.stringify(sortedMsgs.slice(-100)));
    }

    // Set sync userId flag in local storage to prevent continuous full syncs
    localStorage.setItem(SYNC_USER_KEY, userId);
    console.log("Focura synchronization complete!");
  } catch (err) {
    console.error("Focura sync failed critically:", err);
  }
}
