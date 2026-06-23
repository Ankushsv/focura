"use client";

import { useState, useEffect } from "react";
import { usePaths } from "@/hooks/usePaths";
import { useXp } from "@/components/providers/XpProvider";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import Card from "@/components/ui/Card";
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  type MasteryPath,
} from "@/lib/paths/types";
import { IconSword, IconShield, IconLock, IconMap, IconBook, IconWand, IconFlag } from "@tabler/icons-react";

const CATEGORIES: MasteryPath["category"][] = [
  "coding",
  "fitness",
  "learning",
  "creative",
  "other",
];

const CATEGORY_LABELS = {
  coding: "Coding & Tech",
  fitness: "Fitness & Health",
  learning: "Academic & Studies",
  creative: "Creative & Design",
  other: "Daily & Productive",
};

export default function PathsPage() {
  const { paths, loaded, addPath, unlockNode, deletePath } = usePaths();
  const { awardXp } = useXp();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState<MasteryPath["category"]>("coding");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [name, setName] = useState("User");
  
  useEffect(() => {
    async function loadProfileName() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, name")
            .eq("id", user.id)
            .single();
          if (profile) {
            setName(profile.username || profile.name || user.email?.split("@")[0] || "User");
          }
        }
      } catch {}
    }
    loadProfileName();
  }, []);

  const activePaths = (paths || []).filter((p) => (p.nodes || []).some((n) => n.status !== "done"));
  const completedPaths = (paths || []).filter((p) => (p.nodes || []).every((n) => n.status === "done"));
  const displayedPaths = activeTab === "active" ? activePaths : completedPaths;

  async function handleAddPath(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    bus.emit("pet:react", { message: "Designing your mastery path... 🗺️" });
    await addPath({ title: title.trim(), goal: goal.trim(), category });
    setTitle("");
    setGoal("");
    setCategory("coding");
    setCreating(false);
    setShowForm(false);
    bus.emit("pet:react", { message: "Your custom Mastery Path is ready! Let's begin. 🚀" });
  }

  function handleUnlock(pathId: string, nodeId: string) {
    setUnlocking(nodeId);
    setTimeout(() => {
      const xp = unlockNode(pathId, nodeId);
      if (xp > 0) {
        awardXp(xp, "paths");
        fireConfetti();
        
        // Check if the path is now fully completed
        const path = (paths || []).find((p) => p.id === pathId);
        if (path) {
          const nodesList = path.nodes || [];
          const doneCount = nodesList.filter((n) => n.status === "done" || n.id === nodeId).length;
          const isFullyDone = doneCount === nodesList.length;
          
          if (isFullyDone) {
            bus.emit("pet:react", { 
              message: `🏆 PATH COMPLETED! You have fully mastered "${path.title}"!` 
            });
            setTimeout(() => fireConfetti(), 400);
            setTimeout(() => fireConfetti(), 800);
          } else {
            bus.emit("pet:react", { message: "Milestone unlocked! XP earned! 🌳" });
          }
        }
      }
      setUnlocking(null);
    }, 300);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-warm-amber/30 border-t-warm-amber" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg px-4 py-6 sm:px-8 space-y-8">
      {/* ── Map / Compass Hero ── */}
      <div className="relative mx-auto max-w-[1400px]">
        <div className="relative overflow-hidden rounded-2xl border border-warm-border bg-warm-surface px-8 py-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-warm-amber/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-warm-purple/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-warm-border bg-warm-surface2 text-4xl shadow-lg">
                  <IconMap className="h-10 w-10 text-warm-amber" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-amber">
                  THE PATH OF MASTERY
                </div>
                <h1 className="font-space text-xl sm:text-3xl font-bold text-warm-text">
                  Mastery Paths
                </h1>
                <p className="font-quick italic text-xs sm:text-sm text-warm-textMuted">
                  &ldquo;These are the journeys that will define you. Not in days — in years.&rdquo;
                </p>
                {(paths || []).length > 0 && (
                  <div className="mt-4 flex gap-4 text-xs font-quick text-warm-textMuted">
                    <div>
                      <span className="text-sm font-mono font-bold text-warm-text">{(paths || []).length}</span> active mastery paths
                    </div>
                    <div>
                      <span className="text-sm font-mono font-bold text-warm-amber">
                        {(paths || []).reduce((acc, p) => acc + (p.nodes || []).filter((n) => n.status === "done").length, 0)}
                      </span> milestones completed
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
            >
              {showForm ? "✕ Cancel" : "+ Start a Mastery Path"}
            </button>
          </div>
        </div>

        {/* ── New Path Form ── */}
        {showForm && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-warm-border bg-warm-surface shadow-xl border-l-4 border-l-warm-amber">
            <div className="border-b border-warm-border bg-warm-surface2 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-quick font-bold text-warm-text uppercase tracking-wider">
                <IconMap className="h-4 w-4 text-warm-amber" /> Start a New Mastery Path
              </h2>
            </div>
            <form onSubmit={handleAddPath} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    Path Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master the Rust Programming Language"
                    required
                    className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text placeholder-warm-textMuted/50 outline-none focus:border-warm-amber transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                    Summit Vision (End Goal)
                  </label>
                  <input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Forge a full operating system"
                    className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm font-quick text-warm-text placeholder-warm-textMuted/50 outline-none focus:border-warm-amber transition"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-warm-textMuted">
                  Discipline Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-quick font-bold transition duration-200 ${
                        category === cat
                          ? "border-warm-amber bg-warm-amber/15 text-warm-amber shadow"
                          : "border-warm-border bg-warm-surface2 text-warm-textMuted hover:text-warm-text"
                      }`}
                    >
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span>{CATEGORY_LABELS[cat]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
                >
                  {creating ? "Mapping path..." : "Start This Path 🚀"}
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-warm-surface2 border border-warm-border text-warm-textMuted px-6 py-2.5 text-xs font-quick font-bold hover:text-warm-text hover:bg-warm-surface transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {(paths || []).length === 0 && !showForm && (
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-warm-amber/30 border-dashed bg-warm-surface px-8 py-20 text-center shadow">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-amber/30 bg-warm-surface2">
              <IconMap className="h-8 w-8 text-warm-amber" />
            </div>
            <div className="space-y-1">
              <h2 className="font-space text-lg font-bold text-warm-text">Begin a New Mastery Path</h2>
              <p className="font-quick italic text-xs text-warm-textMuted max-w-sm mx-auto">
                Every journey starts with a single step. Define your path, and begin your mastery journey today.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-warm-amber text-warm-bg px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.15)] transition"
            >
              Begin a Mastery Path
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs Switcher ── */}
      {(paths || []).length > 0 && (
        <div className="mx-auto mb-6 flex max-w-[1400px] gap-2 border-b border-warm-border pb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-full px-5 py-2 text-xs font-quick font-bold transition duration-200 ${
              activeTab === "active"
                ? "bg-warm-amber/10 text-warm-amber border border-warm-amber/20"
                : "text-warm-textMuted hover:text-warm-text"
            }`}
          >
            Active Paths ({activePaths.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`rounded-full px-5 py-2 text-xs font-quick font-bold transition duration-200 ${
              activeTab === "completed"
                ? "bg-warm-teal/10 text-warm-teal border border-warm-teal/20"
                : "text-warm-textMuted hover:text-warm-text"
            }`}
          >
            Completed ({completedPaths.length})
          </button>
        </div>
      )}

      {/* ── Paths List ── */}
      {(paths || []).length > 0 && (
        <div className="relative mx-auto max-w-[1400px] space-y-8">
          {displayedPaths.length === 0 ? (
            <div className="rounded-2xl border border-warm-border bg-warm-surface p-12 text-center text-warm-textMuted font-quick">
              {activeTab === "active"
                ? "All paths completed! Select a new mastery path to begin."
                : "Your history has no mastered paths yet. Conquering milestones will build your stats."}
            </div>
          ) : (
            displayedPaths.map((path) => {
              const nodesList = path.nodes || [];
              const done = nodesList.filter((n) => n.status === "done").length;
              const total = nodesList.length;
              const pct = total > 0 ? (done / total) * 100 : 0;

              // Rank mappings:
              // 0-24%: Novice, 25-49%: Apprentice, 50-74%: Practitioner, 75-99%: Specialist, 100%: Master
              const currentRank = 
                pct === 100 ? "Master" : 
                pct >= 75 ? "Specialist" :
                pct >= 50 ? "Practitioner" :
                pct >= 25 ? "Apprentice" :
                "Novice";

              return (
                <div
                  key={path.id}
                  className="group overflow-hidden rounded-2xl border border-warm-border bg-warm-surface p-6 shadow transition hover:shadow-lg"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                        style={{
                          backgroundColor: "rgba(240, 168, 104, 0.05)",
                          border: "1px solid rgba(240, 168, 104, 0.15)",
                        }}
                      >
                        {CATEGORY_ICONS[path.category]}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-quick font-bold text-warm-text">{path.title}</h2>
                          <span
                            className="rounded-full border border-warm-amber/20 bg-warm-amber/10 px-2.5 py-0.5 text-[9px] font-quick font-bold text-warm-amber uppercase tracking-wider"
                          >
                            {CATEGORY_LABELS[path.category]}
                          </span>
                          <span className="rounded-full border border-warm-border bg-warm-surface2 px-2.5 py-0.5 font-mono text-[10px] text-warm-textMuted">
                            {done}/{total} milestones
                          </span>
                        </div>
                        {path.goal && (
                          <p className="mt-1 text-xs font-quick italic text-warm-textMuted">🎯 Vision: {path.goal}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Rank Badge */}
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-warm-amber px-2.5 py-1 font-space text-[10px] font-bold text-warm-amber bg-warm-amber/10 uppercase tracking-wider">
                        {currentRank}
                      </span>
                      <button
                        onClick={() => deletePath(path.id)}
                        className="rounded-lg p-1.5 text-warm-textMuted opacity-0 hover:bg-warm-surface2 hover:text-priority-critical group-hover:opacity-100 transition"
                        title="Abandon path"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Mountain visual & Progress bar */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 items-center border-t border-warm-border/50">
                    <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-surface2 border border-warm-border">
                        <div
                          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-warm-amber to-warm-amber/70"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[10px] text-warm-textMuted">
                        <span>{Math.round(pct)}% of Path completed</span>
                        <span>{total - done} steps to summit</span>
                      </div>
                    </div>

                    {/* SVG Mountain visualization */}
                    <div className="flex items-center justify-center bg-warm-surface2 border border-warm-border rounded-xl p-3 h-20 relative overflow-hidden">
                      <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 100 40" preserveAspectRatio="none">
                        <polygon points="0,40 50,5 100,40" fill="url(#goldGrad)" />
                        <defs>
                          <linearGradient id="goldGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#f0a868" stopOpacity="0" />
                            <stop offset="100%" stopColor="#f0a868" stopOpacity="0.4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Summit Flag */}
                      <span className="absolute top-1 text-sm select-none" style={{ left: "calc(50% - 7px)" }}>🏁</span>
                      
                      {/* Climber climber emoji climbing mountain based on percentage */}
                      <span 
                        className="absolute text-sm select-none transition-all duration-1000"
                        style={{
                          left: `calc(${pct * 0.45}% + 2.5%)`,
                          bottom: `calc(${pct * 0.25}px + 12px)`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        🧗
                      </span>
                      <span className="text-[10px] font-quick font-bold text-warm-amber uppercase tracking-wider relative z-10">
                        THE CLIMB
                      </span>
                    </div>
                  </div>

                  {/* Skill Tree / Path of Mastery */}
                  <div className="border-t border-warm-border/50 pt-5">
                    <h3 className="text-xs font-quick font-bold uppercase tracking-widest text-warm-textMuted mb-4">
                      The Path of Mastery
                    </h3>
                    <div className="mx-auto max-w-md">
                      {(path.nodes || []).map((node, idx) => {
                        const isDone = node.status === "done";
                        const isAvail = node.status === "available";
                        const isLocked = node.status === "locked";
                        
                        return (
                          <div key={node.id}>
                            <div className="flex items-center gap-4">
                              {/* Connector dot */}
                              <div className="relative flex-shrink-0 z-10">
                                {isDone && (
                                  <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold bg-warm-amber text-warm-bg shadow-lg shadow-warm-amber/15"
                                  >
                                    ✓
                                  </div>
                                )}
                                {isAvail && (
                                  <button
                                    onClick={() => handleUnlock(path.id, node.id)}
                                    disabled={unlocking === node.id}
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-warm-amber bg-warm-surface2 animate-pulse"
                                    title="Unlock milestone"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-warm-amber" />
                                  </button>
                                )}
                                {isLocked && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-warm-border bg-warm-surface2 text-xs text-warm-textMuted">
                                    <IconLock className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1">
                                <h4
                                  className={`font-quick font-bold text-sm ${
                                    isLocked ? "text-warm-textMuted" : "text-warm-text"
                                  }`}
                                >
                                  {node.label}
                                </h4>
                                <p className="text-xs font-quick text-warm-textMuted mt-0.5">{node.description}</p>
                              </div>

                              {/* XP value */}
                              <div className="text-right shrink-0">
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    isLocked ? "text-warm-textHint" : "text-warm-amber"
                                  }`}
                                >
                                  +{node.xp} XP
                                </span>
                              </div>
                            </div>

                            {/* Connecting Line */}
                            {idx < (path.nodes || []).length - 1 && (
                              <div className="flex pl-[15px] my-1">
                                <div
                                  className="w-0.5 h-8 transition-colors duration-500"
                                  style={{
                                    backgroundColor: isDone ? "var(--color-warm-amber)" : "var(--color-warm-border)",
                                    boxShadow: isDone ? "0 0 8px var(--color-warm-amber)" : "none",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Coach reflects (Roadmap insight block) */}
                  <div className="mt-6 border-t border-warm-border/50 pt-5">
                    <div className="bg-warm-surface2 border-l-4 border-warm-purple rounded-r-xl p-4 flex gap-3.5">
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-warm-purple/10 text-warm-purple">
                        <IconWand className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-warm-purple">
                          AI Coach reflects:
                        </p>
                        <p className="font-quick italic text-xs leading-relaxed text-warm-cream">
                          &ldquo;This Mastery Path is a testament to your endurance. You are progressing well as a {currentRank}.&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
