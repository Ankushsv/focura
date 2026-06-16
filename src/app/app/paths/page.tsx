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
  coding: "Artificer Arts",
  fitness: "Marshal Training",
  learning: "Scholar Studies",
  creative: "Bardic Crafts",
  other: "Field Deeds",
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
  const [name, setName] = useState("knight");

  useEffect(() => {
    const saved = localStorage.getItem("focura.username");
    if (saved) setName(saved);
  }, []);

  const activePaths = paths.filter((p) => p.nodes.some((n) => n.status !== "done"));
  const completedPaths = paths.filter((p) => p.nodes.every((n) => n.status === "done"));
  const displayedPaths = activeTab === "active" ? activePaths : completedPaths;

  async function handleAddPath(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    bus.emit("pet:react", { message: "Consulting maps... designing your skill tree... 🗺️" });
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
        const path = paths.find((p) => p.id === pathId);
        if (path) {
          const doneCount = path.nodes.filter((n) => n.status === "done" || n.id === nodeId).length;
          const isFullyDone = doneCount === path.nodes.length;
          
          if (isFullyDone) {
            bus.emit("pet:react", { 
              message: `🏆 QUEST COMPLETE! You have fully mastered "${path.title}"!` 
            });
            setTimeout(() => fireConfetti(), 400);
            setTimeout(() => fireConfetti(), 800);
          } else {
            bus.emit("pet:react", { message: "Your title rises. Legend Points earned! 🌳" });
          }
        }
      }
      setUnlocking(null);
    }, 300);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0c0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f0a868]/30 border-t-[#f0a868]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0c0a] px-4 py-6 sm:px-8 space-y-8">
      {/* ── Map / Compass Hero ── */}
      <div className="relative mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-[#1a1714] px-8 py-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-realm-gold/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-realm-purple/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-realm-border bg-[#141210] text-4xl shadow-lg">
                  <IconMap className="h-10 w-10 text-realm-gold" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#f0a868]">
                  THE PATH OF MASTERY
                </div>
                <h1 className="font-cinzel text-xl sm:text-3xl font-bold text-[#f5efe8]">
                  The Great Quests
                </h1>
                <p className="font-lora italic text-xs sm:text-sm text-realm-muted">
                  &ldquo;These are the journeys that will define you. Not in days — in years.&rdquo;
                </p>
                {paths.length > 0 && (
                  <div className="mt-4 flex gap-4 text-xs font-quick text-realm-muted">
                    <div>
                      <span className="text-sm font-mono font-bold text-[#f5efe8]">{paths.length}</span> active quest scrolls
                    </div>
                    <div>
                      <span className="text-sm font-mono font-bold text-realm-gold">
                        {paths.reduce((acc, p) => acc + p.nodes.filter((n) => n.status === "done").length, 0)}
                      </span> milestones reached
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
            >
              {showForm ? "✕ Cancel" : "+ Begin a Quest"}
            </button>
          </div>
        </div>

        {/* ── New Path Form ── */}
        {showForm && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-realm-border bg-realm-surface shadow-xl border-l-4 border-l-realm-gold">
            <div className="border-b border-realm-border bg-[#141210] px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-quick font-bold text-[#f5efe8] uppercase tracking-wider">
                <IconMap className="h-4 w-4 text-realm-gold" /> Begin a New Great Quest
              </h2>
            </div>
            <form onSubmit={handleAddPath} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    Quest Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master the Blade of Rust (System Programming)"
                    required
                    className="w-full rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2.5 text-sm font-quick text-realm-text placeholder-realm-muted/50 outline-none focus:border-realm-gold transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                    Summit Vision (End Goal)
                  </label>
                  <input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Forge a full operating layout"
                    className="w-full rounded-xl border border-realm-border bg-realm-surface2 px-4 py-2.5 text-sm font-quick text-realm-text placeholder-realm-muted/50 outline-none focus:border-realm-gold transition"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-quick font-bold uppercase tracking-wider text-realm-muted">
                  The Bardic discipline
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-quick font-bold transition duration-200 ${
                        category === cat
                          ? "border-realm-gold bg-realm-gold-dim text-realm-gold shadow"
                          : "border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-text"
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
                  className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
                >
                  {creating ? "Mapping quest..." : "Swear This Quest ⚔️"}
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-realm-surface2 border border-realm-border text-realm-muted px-6 py-2.5 text-xs font-quick font-bold hover:text-realm-text hover:bg-realm-surface transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {paths.length === 0 && !showForm && (
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-realm-gold/30 border-dashed bg-realm-surface px-8 py-20 text-center shadow">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-realm-gold/30 bg-[#141210]">
              <IconMap className="h-8 w-8 text-realm-gold" />
            </div>
            <div className="space-y-1">
              <h2 className="font-cinzel text-lg font-bold text-realm-text">Begin a New Great Quest</h2>
              <p className="font-lora italic text-xs text-realm-muted max-w-sm mx-auto">
                Every legend starts with a single step. sworn on this board, your path of mastery begins.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-realm-gold text-[#0e0c0a] px-6 py-2.5 text-xs font-quick font-bold hover:shadow-[0_0_15px_rgba(240,168,104,0.3)] transition"
            >
              Begin a Great Quest
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs Switcher ── */}
      {paths.length > 0 && (
        <div className="mx-auto mb-6 flex max-w-5xl gap-2 border-b border-realm-border pb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-full px-5 py-2 text-xs font-quick font-bold transition duration-200 ${
              activeTab === "active"
                ? "bg-realm-gold-dim text-realm-gold border border-realm-gold/25"
                : "text-realm-muted hover:text-realm-text"
            }`}
          >
            Active Quests ({activePaths.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`rounded-full px-5 py-2 text-xs font-quick font-bold transition duration-200 ${
              activeTab === "completed"
                ? "bg-realm-teal/10 text-realm-teal border border-realm-teal/20"
                : "text-realm-muted hover:text-realm-text"
            }`}
          >
            Conquered ({completedPaths.length})
          </button>
        </div>
      )}

      {/* ── Paths List (Quest Scrolls) ── */}
      {paths.length > 0 && (
        <div className="relative mx-auto max-w-5xl space-y-8">
          {displayedPaths.length === 0 ? (
            <div className="rounded-2xl border border-realm-border bg-realm-surface p-12 text-center text-realm-muted font-quick">
              {activeTab === "active"
                ? "All quests completed! Re-evaluate your scrolls or swearing a new great quest."
                : "Your Chronicle has no mastered quests yet. Conquering skills will write your history."}
            </div>
          ) : (
            displayedPaths.map((path) => {
              const done = path.nodes.filter((n) => n.status === "done").length;
              const total = path.nodes.length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              const color = CATEGORY_COLORS[path.category];

              // Rank mappings:
              // 0% -> Commoner, 25% -> Squire, 50% -> Knight, 75% -> Champion, 100% -> Legend
              const currentRank = 
                pct === 100 ? "Legend" : 
                pct >= 75 ? "Champion" :
                pct >= 50 ? "Knight" :
                pct >= 25 ? "Squire" :
                "Commoner";

              return (
                <div
                  key={path.id}
                  className="group overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-6 shadow transition hover:shadow-lg"
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
                          <h2 className="text-base font-quick font-bold text-[#f5efe8]">{path.title}</h2>
                          <span
                            className="rounded-full border border-realm-gold/20 bg-realm-gold-dim px-2.5 py-0.5 text-[9px] font-quick font-bold text-realm-gold uppercase tracking-wider"
                          >
                            {CATEGORY_LABELS[path.category]}
                          </span>
                          <span className="rounded-full border border-realm-border bg-realm-surface2 px-2.5 py-0.5 font-mono text-[10px] text-realm-muted">
                            {done}/{total} milestones
                          </span>
                        </div>
                        {path.goal && (
                          <p className="mt-1 text-xs font-lora italic text-realm-muted">🎯 Vision: {path.goal}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Rank Badge */}
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-realm-gold px-2.5 py-1 font-cinzel text-[10px] font-bold text-realm-gold bg-realm-gold-dim uppercase tracking-wider">
                        {currentRank}
                      </span>
                      <button
                        onClick={() => deletePath(path.id)}
                        className="rounded-lg p-1.5 text-realm-muted opacity-0 hover:bg-realm-surface2 hover:text-realm-crimson group-hover:opacity-100 transition"
                        title="Abandon quest"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Mountain visual & Progress bar */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 items-center border-t border-realm-border/50">
                    <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-realm-surface2 border border-realm-border">
                        <div
                          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-realm-gold to-realm-gold/70"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[10px] text-realm-muted">
                        <span>{Math.round(pct)}% of Quest conquered</span>
                        <span>{total - done} steps to summit</span>
                      </div>
                    </div>

                    {/* SVG Mountain visualization */}
                    <div className="flex items-center justify-center bg-[#151310] border border-realm-border rounded-xl p-3 h-20 relative overflow-hidden">
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
                      <span className="absolute top-1 text-sm select-none" style={{ left: "calc(50% - 7px)" }}>🏴</span>
                      
                      {/* Climber (Knight chess character) climbing mountain based on percentage */}
                      <span 
                        className="absolute text-sm select-none transition-all duration-1000"
                        style={{
                          left: `calc(${pct * 0.45}% + 2.5%)`,
                          bottom: `calc(${pct * 0.25}px + 12px)`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        ♞
                      </span>
                      <span className="text-[10px] font-quick font-bold text-realm-gold uppercase tracking-wider relative z-10">
                        THE CLIMB
                      </span>
                    </div>
                  </div>

                  {/* Skill Tree / Path of Mastery */}
                  <div className="border-t border-realm-border/50 pt-5">
                    <h3 className="text-xs font-quick font-bold uppercase tracking-widest text-realm-muted mb-4">
                      The Path of Mastery
                    </h3>
                    <div className="mx-auto max-w-md">
                      {path.nodes.map((node, idx) => {
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
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold bg-realm-gold text-[#0e0c0a] shadow-lg shadow-realm-gold/15"
                                  >
                                    ✓
                                  </div>
                                )}
                                {isAvail && (
                                  <button
                                    onClick={() => handleUnlock(path.id, node.id)}
                                    disabled={unlocking === node.id}
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-realm-gold bg-[#141210] animate-pulse"
                                    title="Unlock milestone"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-realm-gold" />
                                  </button>
                                )}
                                {isLocked && (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-realm-border bg-realm-surface2 text-xs text-realm-muted">
                                    <IconLock className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1">
                                <h4
                                  className={`font-quick font-bold text-sm ${
                                    isLocked ? "text-realm-muted" : "text-[#f5efe8]"
                                  }`}
                                >
                                  {node.label}
                                </h4>
                                <p className="text-xs font-quick text-realm-muted mt-0.5">{node.description}</p>
                              </div>

                              {/* LP value */}
                              <div className="text-right shrink-0">
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    isLocked ? "text-realm-hint" : "text-realm-gold"
                                  }`}
                                >
                                  +{node.xp} LP
                                </span>
                              </div>
                            </div>

                            {/* Connecting Line */}
                            {idx < path.nodes.length - 1 && (
                              <div className="flex pl-[15px] my-1">
                                <div
                                  className="w-0.5 h-8 transition-colors duration-500"
                                  style={{
                                    backgroundColor: isDone ? "#f0a868" : "rgba(255,245,235,0.07)",
                                    boxShadow: isDone ? "0 0 8px #f0a868" : "none",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* The Sage speaks (Roadmap insight block) */}
                  <div className="mt-6 border-t border-realm-border/50 pt-5">
                    <div className="bg-[#191512] border-l-3 border-[#a78bfa] rounded-r-xl p-4 flex gap-3.5">
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#a78bfa]/10 text-[#a78bfa]">
                        <IconWand className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-quick font-bold uppercase tracking-widest text-[#a78bfa]">
                          The Sage speaks:
                        </p>
                        <p className="font-lora italic text-xs leading-relaxed text-[#f5e6d3]">
                          &ldquo;This Quest is a testament to your endurance. The {currentRank} rank suits you, but your Familiar senses a Knightly heart.&rdquo;
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
