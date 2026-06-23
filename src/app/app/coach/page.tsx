"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Task } from "@/lib/tasks/types";
import type { FocusSession } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { 
  IconSparkles, 
  IconBrain, 
  IconTrash, 
  IconFlame, 
  IconHourglass, 
  IconShield, 
  IconClock, 
  IconSend, 
  IconMessage, 
  IconInfoCircle,
  IconCircleCheck
} from "@tabler/icons-react";

type Role = "user" | "coach";
interface Message {
  id: string;
  role: Role;
  text: string;
  ts: number;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
}

const COACH_STORE = "focura.coach.v1";

const CANNED_RESPONSES = [
  "Based on your stats, you are making great strides. Remember — progress is made step by step, not in a single overwhelming push. Keep going! 🧠\n\n— AI Coach",
  "If your current focus is blocked, take a short break or break the task down into a smaller step. 💡\n\n— AI Coach",
  "Your streak is burning bright! Consistency is built one day at a time. ⚡\n\n— AI Coach",
  "It is important to rest. Even five minutes of focus keeps momentum alive. 🧘\n\n— AI Coach",
  "You are further along than you think. Look back at your stats — you have completed more than you remember. 📈\n\n— AI Coach",
  "Small focus blocks compound into massive progress. Each task completed rewires your brain. 🧠\n\n— AI Coach",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Simple safe markdown parser helpers
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts = [];
  let currentIndex = 0;
  // Match bold (**text** or __text__), italics (*text* or _text_), and inline code (`text`)
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-extrabold text-warm-cream">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italics
      parts.push(
        <em key={match.index} className="italic text-warm-textMuted">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Inline Code
      parts.push(
        <code key={match.index} className="rounded bg-warm-surface2 px-1.5 py-0.5 font-mono text-xs text-warm-teal border border-warm-border">
          {match[6]}
        </code>
      );
    }

    currentIndex = regex.lastIndex;
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // 1. Headers (### Heading)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = parseInlineMarkdown(headerMatch[2]);
      if (level === 1) return <h1 key={idx} className="font-space text-base text-warm-cream mt-3 mb-1.5">{content}</h1>;
      if (level === 2) return <h2 key={idx} className="font-space text-sm text-warm-cream mt-2.5 mb-1.5">{content}</h2>;
      return <h3 key={idx} className="font-space text-xs text-warm-cream mt-2 mb-1">{content}</h3>;
    }

    // 2. Unordered lists (- item or * item)
    const listMatch = line.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      const content = parseInlineMarkdown(listMatch[1]);
      return (
        <div key={idx} className="flex gap-2 pl-3 my-1 text-sm text-warm-textMuted font-quick items-start">
          <span className="text-warm-amber font-bold">•</span>
          <span className="flex-1">{content}</span>
        </div>
      );
    }

    // 3. Blockquotes (> quote)
    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      const content = parseInlineMarkdown(quoteMatch[1]);
      return (
        <blockquote key={idx} className="border-l-2 border-warm-amber/50 pl-3 py-1 my-1.5 italic text-warm-textMuted text-xs font-quick">
          {content}
        </blockquote>
      );
    }

    // 4. Empty lines
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }

    // 5. Default paragraph
    return (
      <p key={idx} className="text-sm leading-relaxed text-warm-cream my-0.5 font-quick">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
}

function coachReply(input: string, sessions: FocusSession[], tasks: Task[]): string {
  const lower = input.toLowerCase();
  const doneTasks = tasks.filter((t) => t.done).length;
  const avgSession =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.actualMinutes, 0) / sessions.length)
      : null;

  if (/(focus|timer|session|pomodoro)/.test(lower)) {
    if (avgSession !== null) {
      return `Your average focus block is **${avgSession} minutes**! Short, focused sessions of 25-50 minutes followed by a quick recharge break work best. The mind requires recovery to maintain high focus. 🎯\n\n— AI Coach`;
    }
    return "Focus sessions are the heartbeat of productivity. Try starting with just **15 minutes** — the hardest part is always beginning. Once you're in flow, you can extend naturally. ⏱️\n\n— AI Coach";
  }

  if (/(task|quest|complete|finish|todo|mission)/.test(lower)) {
    const rate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : null;
    if (rate !== null) {
      return `You have completed **${doneTasks} tasks** — a **${rate}% completion rate**! A good strategy: tackle high-energy tasks in the morning when your focus is fresh, and leave simpler tasks for the afternoon. Keep your dashboard organized. 📈\n\n— AI Coach`;
    }
    return "Breaking tasks into micro-steps is a superpower for ADHD. Instead of *'Write report'*, try: \n- Open document \n- Write first sentence \n\nEach tiny win releases dopamine and builds momentum. ✅\n\n— AI Coach";
  }

  if (/(stress|overwhelm|anxious|anxiety|too much|can't|cannot|procrastinat|stuck|lazy|energy)/.test(lower)) {
    return "Take a deep breath. 🌿 When overwhelm is thick, your mind is calling for a break. Choose just **ONE micro-task** to start in the next 5 minutes. Not the whole project. Just do one tiny step. That small movement breaks procrastination. 💡\n\n— AI Coach";
  }

  if (/(sleep|rest|tired|exhaust|fatigue)/.test(lower)) {
    return "Rest **IS** essential. Sleep is when your brain processes information, solidifies learning, and replenishes focus. Guard your nightly rest like a priority. 🌙\n\n— AI Coach";
  }

  if (/(reward|fun|game|play|enjoy|shop)/.test(lower)) {
    return "Rewards are not luxuries — they fuel your motivation. Your brain responds powerfully to immediate progress. Visit the rewards shop to reinforce the feedback loop. 🏆\n\n— AI Coach";
  }

  const idx = Math.floor(Date.now() / 1000) % CANNED_RESPONSES.length;
  return CANNED_RESPONSES[idx];
}

const SUGGESTED_PROMPTS = [
  "How do I overcome procrastination?",
  "I am feeling overwhelmed today",
  "No motivation to start",
  "How to wind down for rest",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [displayedCoach, setDisplayedCoach] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const { tasks } = useTasks();
  const [insights, setInsights] = useState<Insight[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch sessions
        const { data: dbSessions } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("ended_at", { ascending: false });

        const parsedSessions: FocusSession[] = (dbSessions || []).map((s: any) => ({
          id: s.id,
          taskId: s.task_id,
          taskTitle: s.task_title || "Free focus",
          plannedMinutes: s.planned_minutes,
          actualMinutes: s.actual_minutes,
          endedAt: s.ended_at ? new Date(s.ended_at).getTime() : Date.now(),
        }));
        setSessions(parsedSessions);

        // Fetch coach messages
        const { data: dbMessages } = await supabase
          .from("coach_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        const parsedMessages: Message[] = (dbMessages || []).map((m: any) => ({
          id: m.id || uid(),
          role: m.role as Role,
          text: m.text,
          ts: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
        }));

        if (parsedMessages.length === 0) {
          const welcome: Message = {
            id: uid(),
            role: "coach",
            text: "Hi! I am your AI Coach. 🤖 I am here to assist you in overcoming procrastination, understanding your cognitive rhythms, and sharpening your focus. What counsel do you seek today?",
            ts: Date.now(),
          };
          setMessages([welcome]);
          setDisplayedCoach({ [welcome.id]: welcome.text });
          // Save welcome message
          await supabase.from("coach_messages").insert({
            id: welcome.id,
            user_id: user.id,
            role: welcome.role,
            text: welcome.text,
            created_at: new Date(welcome.ts).toISOString(),
          });
        } else {
          setMessages(parsedMessages);
          const displayed: Record<string, string> = {};
          parsedMessages.forEach((m) => {
            if (m.role === "coach") displayed[m.id] = m.text;
          });
          setDisplayedCoach(displayed);
        }

        // Setup Insights
        const insightList: Insight[] = [];
        if (parsedSessions.length > 0) {
          insightList.push({ 
            icon: <IconShield size={14} className="text-warm-teal" />, 
            text: `${parsedSessions.length} focus session${parsedSessions.length !== 1 ? "s" : ""} logged` 
          });
          const avg = Math.round(parsedSessions.reduce((a, s) => a + s.actualMinutes, 0) / parsedSessions.length);
          insightList.push({ 
            icon: <IconClock size={14} className="text-warm-amber" />, 
            text: `Avg session: ${avg} min` 
          });
        }
        const done = tasks.filter((t) => t.done).length;
        if (tasks.length > 0) {
          insightList.push({ 
            icon: <IconCircleCheck size={14} className="text-warm-purple" />, 
            text: `${done}/${tasks.length} tasks completed` 
          });
        }
        if (insightList.length === 0) {
          insightList.push({ 
            icon: <IconSparkles size={14} className="text-warm-amber" />, 
            text: "Seek counsel from the AI Coach on focus or ADHD" 
          });
        }
        setInsights(insightList);
      } catch (err) {
        console.warn("Failed to load coach data from Supabase:", err);
      }
    }
    loadData();
  }, [tasks]);

  // Auto-scroll inside chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, displayedCoach]);

  // Typewriter
  const typewriterMessage = useCallback((msg: Message) => {
    setDisplayedCoach((prev) => ({ ...prev, [msg.id]: "" }));
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setDisplayedCoach((prev) => ({
        ...prev,
        [msg.id]: msg.text.slice(0, i),
      }));
      if (i >= msg.text.length) {
        clearInterval(interval);
        setDisplayedCoach((prev) => ({ ...prev, [msg.id]: msg.text }));
      }
    }, 20);
  }, []);

  async function handleSend(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || typing) return;

    const userMsgId = uid();
    const userMsg: Message = { id: userMsgId, role: "user", text: trimmed, ts: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save user message
      await supabase.from("coach_messages").insert({
        id: userMsgId,
        user_id: user.id,
        role: userMsg.role,
        text: userMsg.text,
        created_at: new Date(userMsg.ts).toISOString(),
      });

      // Fetch AI response
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          sessions,
          tasks,
        }),
      });

      let replyText = "";
      if (!response.ok) {
        throw new Error("API failed");
      } else {
        const data = await response.json();
        replyText = data.reply;
      }

      const coachMsgId = uid();
      const coachMsg: Message = { id: coachMsgId, role: "coach", text: replyText, ts: Date.now() };
      setMessages((prev) => [...prev, coachMsg]);
      typewriterMessage(coachMsg);

      // Save coach message
      await supabase.from("coach_messages").insert({
        id: coachMsgId,
        user_id: user.id,
        role: coachMsg.role,
        text: coachMsg.text,
        created_at: new Date(coachMsg.ts).toISOString(),
      });
    } catch (err) {
      console.warn("API or DB failed, falling back to heuristics:", err);
      const replyText = coachReply(trimmed, sessions, tasks);
      const coachMsgId = uid();
      const coachMsg: Message = { id: coachMsgId, role: "coach", text: replyText, ts: Date.now() };
      setMessages((prev) => [...prev, coachMsg]);
      typewriterMessage(coachMsg);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("coach_messages").insert({
            id: coachMsgId,
            user_id: user.id,
            role: coachMsg.role,
            text: coachMsg.text,
            created_at: new Date(coachMsg.ts).toISOString(),
          });
        }
      } catch (dbErr) {
        console.warn("DB insert fallback failed:", dbErr);
      }
    } finally {
      setTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function clearChat() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all coach messages for this user
      await supabase.from("coach_messages").delete().eq("user_id", user.id);

      const welcome: Message = {
        id: uid(),
        role: "coach",
        text: "Chat history cleared! 🧠 I stand ready to offer focus coaching. What is on your mind?",
        ts: Date.now(),
      };
      setMessages([welcome]);
      setDisplayedCoach({ [welcome.id]: welcome.text });

      await supabase.from("coach_messages").insert({
        id: welcome.id,
        user_id: user.id,
        role: welcome.role,
        text: welcome.text,
        created_at: new Date(welcome.ts).toISOString(),
      });
    } catch (err) {
      console.warn("Failed to clear chat in Supabase:", err);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-8 space-y-4 font-quick">
      {/* AI Coach Console */}
      <div className="flex flex-col rounded-3xl border border-warm-border bg-warm-surface backdrop-blur-md overflow-hidden h-[calc(100vh-220px)] min-h-[500px] max-h-[750px] shadow-2xl relative">
        
        {/* ── Coach Header ── */}
        <div className="border-b border-warm-border bg-warm-surface2/60 backdrop-blur-xl px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Coach avatar */}
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-warm-amber to-orange-400 text-warm-bg shadow-lg shadow-warm-amber/20">
                  <IconBrain size={22} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-warm-surface bg-warm-teal shadow-sm" />
              </div>
              <div>
                <h1 className="font-space font-bold text-lg text-warm-cream leading-tight">
                  AI Coach
                </h1>
                <p className="text-[10px] text-warm-textMuted font-space uppercase tracking-wider">ADHD Coach & Advisor · Live guidance</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="rounded-xl border border-warm-border px-3.5 py-1.5 text-xs text-warm-textMuted font-space font-bold transition hover:border-warm-amber/40 hover:text-warm-cream"
            >
              Clear Chat 🧹
            </button>
          </div>
        </div>

        {/* ── Insight Pills ── */}
        {insights.length > 0 && (
          <div className="border-b border-warm-border bg-warm-surface2/30 px-6 py-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-space font-bold uppercase tracking-widest text-warm-textMuted mr-1">Focus metrics</span>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-warm-border bg-warm-surface2 px-3 py-1 text-xs font-semibold text-warm-textMuted font-space"
                >
                  {ins.icon}
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Messages Box ── */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-warm-surface2/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Coach avatar */}
              {msg.role === "coach" && (
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-warm-amber to-orange-400 text-warm-bg shadow-md select-none">
                  <IconBrain size={18} />
                </div>
              )}

              {/* Chat bubble */}
              <div
                className={`group relative max-w-[78%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "user"
                    ? "rounded-br-sm bg-warm-teal/10 border border-warm-teal/30 text-warm-cream font-space"
                    : "rounded-bl-sm border-l-4 border-warm-amber border-y border-r border-warm-border bg-warm-surface2 text-warm-cream font-quick"
                }`}
              >
                {msg.role === "coach" ? (
                  <div className="space-y-1.5">
                    {renderMarkdown(displayedCoach[msg.id] ?? "")}
                    {(displayedCoach[msg.id] ?? "").length < msg.text.length && (
                      <span className="typing-cursor ml-1 inline-block h-[14px] w-0.5 bg-warm-teal align-middle animate-pulse" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
                <span className="mt-2 block text-right text-[8px] font-space text-warm-textMuted opacity-40">
                  {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing bubble */}
          {typing && (
            <div className="flex items-end gap-3">
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-warm-amber to-orange-400 text-warm-bg shadow-md">
                <IconBrain size={18} />
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-warm-border bg-warm-surface2 p-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-warm-amber animate-bounce"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Suggested Prompts (show when no user messages) ── */}
        {messages.filter((m) => m.role === "user").length === 0 && (
          <div className="border-t border-warm-border bg-warm-surface2 px-6 py-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={typing}
                  className="rounded-xl border border-warm-border bg-warm-surface px-3 py-1.5 text-xs font-bold text-warm-textMuted font-space transition hover:border-warm-amber/40 hover:text-warm-cream disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="border-t border-warm-border bg-warm-surface2 px-6 py-4 shrink-0 font-space">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about procrastination, focus tips, or task management…"
                disabled={typing}
                className="w-full rounded-2xl border border-warm-border bg-warm-surface px-5 py-3.5 text-sm text-warm-cream placeholder-warm-textMuted outline-none transition focus:border-warm-amber focus:bg-warm-surface/60 disabled:opacity-40"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-warm-amber to-orange-400 text-warm-bg font-bold shadow-md hover:scale-102 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconSend size={18} />
            </button>
          </div>
          <p className="mt-2.5 text-center text-[10px] text-warm-textMuted">
            Press Enter to send message · AI Coach & Advisor
          </p>
        </div>
      </div>
    </div>
  );
}
