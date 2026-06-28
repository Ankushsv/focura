"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/tasks/types";
import type { FocusSession } from "@/lib/sessions";
import { 
  IconSparkles, 
  IconSend, 
  IconMinimize, 
  IconArrowsMaximize, 
  IconX, 
  IconMessageChatbot
} from "@tabler/icons-react";

type Role = "user" | "coach";
interface Message {
  id: string;
  role: Role;
  text: string;
  ts: number;
}

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

// Heuristic response fallback generator
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

// Simple safe markdown parser helper
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts = [];
  let currentIndex = 0;
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-extrabold text-warm-cream">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={match.index} className="italic text-warm-textMuted">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
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

export default function FloatingAICoach() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [displayedCoach, setDisplayedCoach] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const { tasks } = useTasks();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history & session data
  useEffect(() => {
    if (!isOpen) return;

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
      } catch (err) {
        console.warn("Failed to load coach history in floating chat:", err);
      }
    }
    loadData();
  }, [isOpen]);

  // Auto-scroll messages list
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, displayedCoach, isOpen, typing]);

  // Typewriter effect
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

  // Send message
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
      console.warn("API failed, using fallback coach heuristics:", err);
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
        console.warn("Failed to save fallback msg to DB:", dbErr);
      }
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const suggestedPrompts = [
    "I am overwhelmed today",
    "No motivation to start",
    "How to manage focus blocks"
  ];

  return (
    <>
      {/* ── Toggle Floating Action Button (Bottom Left) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[60] w-12 h-12 rounded-full border border-warm-border bg-warm-surface2 flex items-center justify-center text-warm-text hover:text-warm-amber hover:border-warm-amber/40 shadow-2xl hover:scale-105 transition-transform duration-200 cursor-pointer"
        title="Chat with AI Coach"
        type="button"
      >
        <IconMessageChatbot size={22} className={isOpen ? "rotate-12 text-warm-amber" : ""} />
      </button>

      {/* ── Chat Pop-up Window ── */}
      {isOpen && (
        <div 
          className="fixed bottom-20 left-6 z-[60] w-[360px] sm:w-[380px] h-[480px] bg-warm-surface border border-warm-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-space"
          style={{ contentVisibility: "auto" }}
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-warm-surface2/60 border-b border-warm-border">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <span className="font-quick font-bold text-xs uppercase tracking-widest text-warm-cream">
                AI Coach Counsel
              </span>
            </div>
            
            {/* Header controls (Extend & Minimize) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  router.push("/app/coach");
                  setIsOpen(false);
                }}
                className="text-warm-textMuted hover:text-warm-text p-1 transition rounded hover:bg-white/5"
                title="Extend to full page"
                type="button"
              >
                <IconArrowsMaximize size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-warm-textMuted hover:text-warm-text p-1 transition rounded hover:bg-white/5"
                title="Minimize chat"
                type="button"
              >
                <IconMinimize size={15} />
              </button>
            </div>
          </div>

          {/* Messages scroll section */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-warm-surface/20 scrollbar-thin scrollbar-thumb-warm-border scrollbar-track-transparent"
          >
            {messages.map((msg) => {
              const isCoach = msg.role === "coach";
              const displayText = isCoach ? (displayedCoach[msg.id] ?? "") : msg.text;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isCoach ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[85%] break-words ${
                      isCoach
                        ? "bg-warm-surface border border-warm-border/60 rounded-tl-none text-warm-textMuted"
                        : "bg-warm-surface2 border border-warm-border rounded-tr-none text-warm-text"
                    }`}
                  >
                    {isCoach ? (
                      <div className="space-y-1">
                        {displayText.split("\n").map((line, idx) => (
                          <p key={idx} className="min-h-[1em]">
                            {parseInlineMarkdown(line)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-warm-textHint mt-1 px-1">
                    {new Date(msg.ts).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}

            {typing && (
              <div className="flex items-center gap-2 text-warm-textMuted/60 text-[10px] italic pl-2">
                <IconSparkles size={12} className="animate-spin text-warm-amber" />
                <span>AI Coach is counseling...</span>
              </div>
            )}
          </div>

          {/* Suggested prompts (displays only if user is at start of chat) */}
          {messages.length <= 1 && !typing && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-warm-surface/40 border-t border-warm-border/40">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-[9px] font-bold text-warm-textMuted bg-warm-surface2 border border-warm-border hover:border-warm-amber/30 hover:text-warm-text px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Bottom input area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-warm-surface2/60 border-t border-warm-border flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask the AI Coach..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={typing}
              className="flex-1 bg-warm-surface border border-warm-border rounded-xl px-4 py-2.5 text-xs text-warm-text placeholder-warm-textMuted/30 focus:outline-none focus:border-warm-amber/40 focus:ring-1 focus:ring-warm-amber/30 transition-all font-space"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="p-2.5 bg-warm-surface2 border border-warm-border text-warm-text hover:text-warm-amber hover:border-warm-amber/30 rounded-xl transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <IconSend size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
