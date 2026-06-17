"use client";

import { useEffect, useState, useMemo } from "react";
import type { Task } from "@/lib/tasks/types";
import { createClient } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { 
  IconSparkles, 
  IconShieldOff, 
  IconBook, 
  IconWand, 
  IconSearch, 
  IconTrash, 
  IconChevronDown, 
  IconBookmark, 
  IconLock
} from "@tabler/icons-react";

type MemoryTag = "idea" | "block" | "thought" | "tip";

interface MemoryNote {
  id: string;
  text: string;
  tag: MemoryTag;
  createdAt: number;
}

const TAG_META: Record<MemoryTag, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; leftBorder: string }> = {
  idea: {
    label: "Whisper (Idea)",
    icon: <IconSparkles size={14} />,
    color: "text-realm-teal",
    bg: "bg-realm-teal/10",
    border: "border-realm-teal/30",
    leftBorder: "#5eead4",
  },
  block: {
    label: "Stumbling Block (Blocker)",
    icon: <IconShieldOff size={14} />,
    color: "text-realm-crimson",
    bg: "bg-realm-crimson/10",
    border: "border-realm-crimson/30",
    leftBorder: "#f87171",
  },
  thought: {
    label: "Reflection (Thought)",
    icon: <IconBook size={14} />,
    color: "text-realm-purple",
    bg: "bg-realm-purple/10",
    border: "border-realm-purple/30",
    leftBorder: "#a78bfa",
  },
  tip: {
    label: "Sage Council (Tip)",
    icon: <IconWand size={14} />,
    color: "text-realm-gold",
    bg: "bg-realm-gold/10",
    border: "border-realm-gold/30",
    leftBorder: "#f0a868",
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

const TAGS: MemoryTag[] = ["idea", "block", "thought", "tip"];

export default function MemoryPage() {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const { tasks, loaded: tasksLoaded } = useTasks();
  const [noteText, setNoteText] = useState("");
  const [selectedTag, setSelectedTag] = useState<MemoryTag>("thought");
  const [filterTag, setFilterTag] = useState<MemoryTag | "all">("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(true);

  useEffect(() => {
    async function loadNotes() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("memory_notes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            text: d.text,
            tag: d.tag as MemoryTag,
            createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
          }));
          setNotes(mapped);
        }
      } catch (err) {
        console.warn("Failed to load memory notes from Supabase:", err);
      } finally {
        setLoaded(true);
      }
    }
    loadNotes();
  }, []);

  async function handleAddNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const noteId = uid();
    const newNote: MemoryNote = {
      id: noteId,
      text: trimmed,
      tag: selectedTag,
      createdAt: Date.now(),
    };
    
    // Optimistic update
    setNotes((prev) => [newNote, ...prev]);
    setNoteText("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("memory_notes").insert({
        id: noteId,
        user_id: user.id,
        text: trimmed,
        tag: selectedTag,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to add memory note:", err);
      // Revert on failure
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }

  async function handleDeleteNote(id: string) {
    const originalNotes = [...notes];
    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("memory_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to delete memory note:", err);
      setNotes(originalNotes);
    }
  }

  const taskMemoryNotes = useMemo(
    () => tasks.filter((t) => t.memoryNote && t.memoryNote.trim()),
    [tasks]
  );

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (filterTag !== "all") filtered = filtered.filter((n) => n.tag === filterTag);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((n) => n.text.toLowerCase().includes(q));
    }
    return filtered;
  }, [notes, filterTag, search]);

  const filteredTaskNotes = useMemo(() => {
    if (!search.trim()) return taskMemoryNotes;
    const q = search.toLowerCase();
    return taskMemoryNotes.filter(
      (t) =>
        t.memoryNote!.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    );
  }, [taskMemoryNotes, search]);

  if (!loaded || !tasksLoaded)
    return (
      <div className="flex min-h-screen items-center justify-center bg-realm-bg text-realm-text">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-realm-gold/30 border-t-realm-gold" />
          <span className="absolute inset-0 flex items-center justify-center text-xl">🧠</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-realm-bg text-realm-text px-4 py-8 md:px-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-realm-purple/5 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-realm-crimson/5 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-realm-teal/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl space-y-8">
        {/* ── Brain Hero ── */}
        <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-gradient-to-br from-realm-purple/10 via-realm-surface to-realm-crimson/5 px-8 py-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-realm-purple/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-realm-crimson/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-realm-purple/30 bg-gradient-to-br from-realm-purple/20 to-realm-surface text-4xl shadow-lg shadow-realm-purple/10">
                  <IconBook size={40} className="text-realm-purple" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-realm-purple/15 blur-md pointer-events-none" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-realm-purple font-space">
                  <span className="h-px w-4 bg-realm-purple/50" />
                  Brain Dump
                  <span className="h-px w-4 bg-realm-purple/50" />
                </div>
                <h1 className="font-cinzel text-4xl tracking-tight text-realm-cream sm:text-5xl">
                  The Tome of Memories
                </h1>
                <p className="mt-2 text-sm text-realm-muted font-lora italic">
                  No judgment. Just capture. Unburden your mind, traveler. 🔮
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 font-space">
              <div className="text-center">
                <div className="text-2xl font-bold text-realm-cream">{notes.length}</div>
                <div className="text-[10px] text-realm-muted uppercase tracking-wider">Unbound</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-realm-purple">{taskMemoryNotes.length}</div>
                <div className="text-[10px] text-realm-muted uppercase tracking-wider">From Battles</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Note Form ── */}
        <div className="overflow-hidden rounded-2xl border border-realm-border bg-realm-surface shadow-md">
          {/* Collapsible header */}
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-realm-surface2/45 font-space"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-realm-cream">
              <IconBook size={18} className="text-realm-gold" />
              Record in The Tome
            </span>
            <IconChevronDown size={16} className={`text-realm-muted transition-transform duration-200 ${formOpen ? "rotate-180" : ""}`} />
          </button>

          {formOpen && (
            <div className="border-t border-realm-border px-6 pb-6 pt-4 space-y-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What sits upon your mind? An idea, a blocker, a scroll from your journey..."
                rows={3}
                className="w-full resize-none rounded-xl border border-realm-border bg-realm-surface2/60 px-4 py-3 text-sm text-realm-cream placeholder-realm-muted outline-none transition-all focus:border-realm-gold font-lora italic"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleAddNote();
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 font-space">
                {/* Tag selector */}
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => {
                    const m = TAG_META[tag];
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                          selectedTag === tag
                            ? `${m.bg} ${m.border} ${m.color} shadow-sm`
                            : "border-realm-border bg-realm-surface2 text-realm-muted hover:border-realm-gold/20 hover:text-realm-cream"
                        }`}
                        style={
                          selectedTag === tag
                            ? { boxShadow: `0 0 10px ${m.leftBorder}20` }
                            : undefined
                        }
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="rounded-xl bg-gradient-to-r from-realm-gold to-orange-400 px-5 py-2.5 text-xs font-bold text-realm-bg shadow-md hover:scale-102 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Record Recollection
                </button>
              </div>
              <p className="text-[10px] text-realm-muted font-space">Press Ctrl+Enter to save quickly</p>
            </div>
          )}
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col gap-3 sm:flex-row font-space">
          <div className="relative flex-1">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-realm-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all memories in the Tome…"
              className="w-full rounded-xl border border-realm-border bg-realm-surface py-3 pl-10 pr-4 text-sm text-realm-cream placeholder-realm-muted outline-none transition-all focus:border-realm-gold"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                filterTag === "all"
                  ? "bg-realm-surface2 border border-realm-gold text-realm-gold shadow-sm"
                  : "border border-realm-border bg-realm-surface text-realm-muted hover:text-realm-cream"
              }`}
            >
              All
            </button>
            {TAGS.map((tag) => {
              const m = TAG_META[tag];
              return (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? "all" : tag)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                    filterTag === tag
                      ? `${m.bg} ${m.border} ${m.color}`
                      : "border-realm-border bg-realm-surface text-realm-muted hover:text-realm-cream"
                  }`}
                >
                  {m.icon} <span>{m.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── From Quests Section (Battle Campaign Scrolls) ── */}
        {filteredTaskNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-cinzel text-xs text-realm-muted uppercase tracking-[0.15em]">
              <span>⚔️</span> Battle Campaign Scrolls
              <span className="rounded-full border border-realm-border bg-realm-surface2 px-2 py-0.5 text-xs text-realm-cream font-mono">
                {filteredTaskNotes.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredTaskNotes.map((task) => (
                <div
                  key={task.id}
                  className="note-in group relative overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-5 transition-all hover:border-realm-purple/30 hover:scale-[1.01]"
                >
                  {/* Left accent border */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-realm-purple to-realm-teal" />
                  <div className="pl-1.5">
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <span className="truncate text-xs font-bold text-realm-purple font-space">{task.title}</span>
                      <span className="shrink-0 rounded-full border border-realm-purple/20 bg-realm-purple/5 px-2 py-0.5 text-[10px] font-bold text-realm-purple font-space">
                        Campaign Note
                      </span>
                    </div>
                    <p className="text-sm text-realm-cream leading-relaxed font-lora italic">{task.memoryNote}</p>
                    <p className="mt-3 text-[10px] text-realm-muted font-space">
                      {task.completedAt ? relativeDate(task.completedAt) : relativeDate(task.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Standalone Notes (Unbound Recollections) ── */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-cinzel text-xs text-realm-muted uppercase tracking-[0.15em]">
            <span>📜</span> Unbound Recollections
            <span className="rounded-full border border-realm-border bg-realm-surface2 px-2 py-0.5 text-xs text-realm-cream font-mono">
              {filteredNotes.length}
            </span>
          </h2>

          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center gap-5 rounded-2xl border border-realm-border bg-realm-surface py-20 text-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-realm-purple/5 blur-xl pointer-events-none" />
                <IconBookmark size={64} className="text-realm-muted/50 animate-bounce" />
              </div>
              <div className="font-space">
                <p className="font-bold text-realm-cream">
                  {notes.length === 0
                    ? "The Tome lies open. Record your first unburdening, traveler."
                    : "No recollections match your filter."}
                </p>
                <p className="mt-1 text-xs text-realm-muted font-lora italic">
                  {notes.length === 0
                    ? "Use the form above to record your thoughts and clear the path to focus."
                    : "Try selecting a different filter or clearing your search scroll."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredNotes.map((note) => {
                const m = TAG_META[note.tag];
                return (
                  <div
                    key={note.id}
                    className="note-in group relative overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-5 transition-all hover:border-realm-gold/20 hover:scale-[1.01]"
                  >
                    {/* Left colored accent border */}
                    <div
                      className="absolute left-0 top-0 h-full w-1"
                      style={{ backgroundColor: m.leftBorder }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        background: `linear-gradient(135deg, ${m.leftBorder}15 0%, transparent 50%)`,
                      }}
                    />

                    <div className="relative pl-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-space ${m.bg} ${m.border} ${m.color}`}
                        >
                          {m.icon} <span>{m.label.split(" ")[0]}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="shrink-0 rounded-lg p-1 text-realm-muted opacity-0 transition-all hover:bg-realm-surface2 hover:text-realm-crimson group-hover:opacity-100"
                          title="Erase Note"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-realm-cream font-lora italic">{note.text}</p>
                      <p className="mt-3.5 text-[10px] text-realm-muted font-space">{relativeDate(note.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes noteIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .note-in {
          animation: noteIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
