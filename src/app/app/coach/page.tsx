"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Task } from "@/lib/tasks/types";
import type { FocusSession } from "@/lib/sessions";
import { 
  IconSparkles, 
  IconWand, 
  IconTrash, 
  IconFlame, 
  IconSword, 
  IconShield, 
  IconClock, 
  IconSend, 
  IconMessage, 
  IconInfoCircle
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
  "Based on the Chronicles, you are making great strides. Remember — victory is won step by step, not in a single glorious charge. Rest your shield, knight. 🛡️\n\n— The Sage",
  "A wise warrior does not strike a stone wall repeatedly. If your current path is blocked by the Fog, sound a tactical retreat and raid a side quest.\n\n— The Sage",
  "The Oath Fire burns bright! Your daily watch keeps the Fog at bay. Real consistency is built in daily training. ⚡\n\n— The Sage",
  "It is honorable to rest. Even five minutes in battle keeps the blade sharp and momentum alive.\n\n— The Sage",
  "You are further along your quest than you believe. Consult the Chronicle of your victories — you have slain more beasts than you remember.\n\n— The Sage",
  "Small skirmishes compound into massive conquests. Each mission fulfilled rewires your mind for legendary focus. 🧠\n\n— The Sage",
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
        <strong key={match.index} className="font-extrabold text-realm-cream">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italics
      parts.push(
        <em key={match.index} className="italic text-realm-muted">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Inline Code
      parts.push(
        <code key={match.index} className="rounded bg-realm-surface2 px-1.5 py-0.5 font-mono text-xs text-realm-teal border border-realm-border">
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
      if (level === 1) return <h1 key={idx} className="font-cinzel text-base text-realm-cream mt-3 mb-1.5">{content}</h1>;
      if (level === 2) return <h2 key={idx} className="font-cinzel text-sm text-realm-cream mt-2.5 mb-1.5">{content}</h2>;
      return <h3 key={idx} className="font-cinzel text-xs text-realm-cream mt-2 mb-1">{content}</h3>;
    }

    // 2. Unordered lists (- item or * item)
    const listMatch = line.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      const content = parseInlineMarkdown(listMatch[1]);
      return (
        <div key={idx} className="flex gap-2 pl-3 my-1 text-sm text-realm-muted font-lora italic items-start">
          <span className="text-realm-gold font-bold">•</span>
          <span className="flex-1">{content}</span>
        </div>
      );
    }

    // 3. Blockquotes (> quote)
    const quoteMatch = line.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      const content = parseInlineMarkdown(quoteMatch[1]);
      return (
        <blockquote key={idx} className="border-l-2 border-realm-gold/50 pl-3 py-1 my-1.5 italic text-realm-muted text-xs font-lora">
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
      <p key={idx} className="text-sm leading-relaxed text-realm-cream my-0.5 font-lora italic">
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

  if (/(focus|timer|session|pomodoro|battle)/.test(lower)) {
    if (avgSession !== null) {
      return `Your average focus battle is **${avgSession} minutes** — a stout defense! For the Stormborn, short, fierce skirmishes of 20–30 minutes followed by a rest at the tavern work best. The mind requires recovery to sharpen the blade for the next charge. 🎯\n\n— The Sage`;
    }
    return "Focus sessions are the heartbeat of productivity. Try starting with just **15 minutes** — the hardest part is always beginning. Once you're in flow, you can extend naturally. ⏱️\n\n— The Sage";
  }

  if (/(task|quest|complete|finish|todo|mission)/.test(lower)) {
    const rate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : null;
    if (rate !== null) {
      return `You have fulfilled **${doneTasks} missions** — a **${rate}% victory rate**! A battle plan: strike high-energy boss battles in the morning when the sun is high, and leave simple scrolls for the evening. Keep your campaigns organized. ⚔️\n\n— The Sage`;
    }
    return "Breaking tasks into micro-steps is a superpower for ADHD. Instead of *'Write report'*, try: \n- Open document \n- Write first sentence \n\nEach tiny win releases dopamine and builds momentum. ✅\n\n— The Sage";
  }

  if (/(stress|overwhelm|anxious|anxiety|too much|can't|cannot|fog)/.test(lower)) {
    return "Halt, knight — lower your visor. 🌿 When the Fog of overwhelm is thick, your mind is calling for a ceasefire. Choose just **ONE micro-task** to strike in the next 5 minutes. Not the grand boss. Just clear one branch. That small movement breaks the paralysis. 🛡️\n\n— The Sage";
  }

  if (/(motivat|inspire|stuck|procrastinat|lazy|energy)/.test(lower)) {
    const streak = sessions.length;
    return `Dread not, motivation follows action, not the other way around. You do not need to feel ready to charge; you must simply draw your sword. You have logged **${streak} battle${streak !== 1 ? "s" : ""}** — proof that your oath stands strong. Just 2 minutes of focus. Draw your blade! ⚔️\n\n— The Sage`;
  }

  if (/(sleep|rest|tired|exhaust|fatigue)/.test(lower)) {
    return "Rest **IS** training for the Stormborn. Sleep is when your brain repairs its armor, solidifies the lessons of battle, and replenishes its focus. Guard your nightly rest like your castle's gate. 🌙\n\n— The Sage";
  }

  if (/(reward|fun|game|play|enjoy|treasury)/.test(lower)) {
    return "Rewards are not luxuries — they are the fuel of the crusade. Your fast mind responds powerfully to immediate triumph. Visit the Treasury, equip your artifacts, and summon your Familiar. It reinforces the victory loop. 🏆\n\n— The Sage";
  }

  const idx = Math.floor(Date.now() / 1000) % CANNED_RESPONSES.length;
  return CANNED_RESPONSES[idx];
}

const SUGGESTED_PROMPTS = [
  "How do I fight the Fog?",
  "The Fog is too thick today",
  "My blade feels heavy (No motivation)",
  "Preparing for nightly rest",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [displayedCoach, setDisplayedCoach] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    try {
      const rawSessions = localStorage.getItem("focura.sessions.v1");
      const rawTasks = localStorage.getItem("focura.tasks.v1");
      const parsedSessions: FocusSession[] = rawSessions ? JSON.parse(rawSessions) : [];
      const parsedTasks: Task[] = rawTasks ? JSON.parse(rawTasks) : [];
      setSessions(parsedSessions);
      setTasks(parsedTasks);

      const insightList: Insight[] = [];
      if (parsedSessions.length > 0) {
        insightList.push({ 
          icon: <IconShield size={14} className="text-realm-teal" />, 
          text: `${parsedSessions.length} focus battle${parsedSessions.length !== 1 ? "s" : ""} logged` 
        });
        const avg = Math.round(parsedSessions.reduce((a, s) => a + s.actualMinutes, 0) / parsedSessions.length);
        insightList.push({ 
          icon: <IconClock size={14} className="text-realm-gold" />, 
          text: `Avg battle: ${avg} min` 
        });
      }
      const done = parsedTasks.filter((t) => t.done).length;
      if (parsedTasks.length > 0) {
        insightList.push({ 
          icon: <IconSword size={14} className="text-realm-purple" />, 
          text: `${done}/${parsedTasks.length} missions completed` 
        });
      }
      if (insightList.length === 0) {
        insightList.push({ 
          icon: <IconSparkles size={14} className="text-realm-gold" />, 
          text: "Seek counsel from the Sage on focus or ADHD" 
        });
      }
      setInsights(insightList);
    } catch { /* noop */ }

    try {
      const raw = localStorage.getItem(COACH_STORE);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        setMessages(parsed);
        const displayed: Record<string, string> = {};
        parsed.forEach((m) => {
          if (m.role === "coach") displayed[m.id] = m.text;
        });
        setDisplayedCoach(displayed);
      } else {
        const welcome: Message = {
          id: uid(),
          role: "coach",
          text: "Hail, traveler! I am the Sage. 🔮 I am here to assist you in fighting the Fog, understanding your cognitive rhythms, and sharpening your focus. What counsel do you seek today?",
          ts: Date.now(),
        };
        setMessages([welcome]);
        setDisplayedCoach({ [welcome.id]: welcome.text });
      }
    } catch { /* noop */ }
  }, []);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(COACH_STORE, JSON.stringify(messages.slice(-100)));
      } catch { /* noop */ }
    }
  }, [messages]);

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

    const userMsg: Message = { id: uid(), role: "user", text: trimmed, ts: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
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

      if (!response.ok) {
        throw new Error("API failed");
      }

      const data = await response.json();
      const coachMsg: Message = { id: uid(), role: "coach", text: data.reply, ts: Date.now() };
      setMessages((prev) => [...prev, coachMsg]);
      typewriterMessage(coachMsg);
    } catch (err) {
      console.warn("API failed, falling back to heuristics:", err);
      const replyText = coachReply(trimmed, sessions, tasks);
      const coachMsg: Message = { id: uid(), role: "coach", text: replyText, ts: Date.now() };
      setMessages((prev) => [...prev, coachMsg]);
      typewriterMessage(coachMsg);
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

  function clearChat() {
    const welcome: Message = {
      id: uid(),
      role: "coach",
      text: "A fresh parchment! 📜 I stand ready to offer counsel. Speak, knight, what sits upon your mind?",
      ts: Date.now(),
    };
    setMessages([welcome]);
    setDisplayedCoach({ [welcome.id]: welcome.text });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* The Sage Console */}
      <div className="flex flex-col rounded-3xl border border-realm-border bg-realm-surface backdrop-blur-md overflow-hidden h-[calc(100vh-220px)] min-h-[500px] max-h-[750px] shadow-2xl relative">
        
        {/* ── Sage Header ── */}
        <div className="border-b border-realm-border bg-realm-surface2/60 backdrop-blur-xl px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Coach avatar */}
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-realm-gold to-orange-400 text-realm-bg shadow-lg shadow-realm-gold/20">
                  <IconWand size={22} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-realm-surface bg-realm-teal shadow-sm" />
              </div>
              <div>
                <h1 className="font-cinzel text-lg text-realm-cream leading-tight">
                  The Sage
                </h1>
                <p className="text-[10px] text-realm-muted font-space uppercase tracking-wider">ADHD Sage Counselor · Consulting the scrolls</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="rounded-xl border border-realm-border px-3.5 py-1.5 text-xs text-realm-muted font-space font-bold transition hover:border-realm-gold/40 hover:text-realm-cream"
            >
              Renew Counsel 🕯️
            </button>
          </div>
        </div>

        {/* ── Insight Pills ── */}
        {insights.length > 0 && (
          <div className="border-b border-realm-border bg-realm-surface2/30 px-6 py-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-space font-bold uppercase tracking-widest text-realm-muted mr-1">Tome metrics</span>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-realm-border bg-realm-surface2 px-3 py-1 text-xs font-semibold text-realm-muted font-space"
                >
                  {ins.icon}
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Messages Box ── */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-realm-surface2/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Sage avatar */}
              {msg.role === "coach" && (
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-realm-gold to-orange-400 text-realm-bg shadow-md select-none">
                  <IconWand size={18} />
                </div>
              )}

              {/* Chat bubble */}
              <div
                className={`group relative max-w-[78%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "user"
                    ? "rounded-br-sm bg-realm-teal/10 border border-realm-teal/30 text-realm-cream font-space"
                    : "rounded-bl-sm border-l-4 border-realm-gold border-y border-r border-realm-border bg-realm-surface2 text-realm-cream font-lora italic"
                }`}
              >
                {msg.role === "coach" ? (
                  <div className="space-y-1.5">
                    {renderMarkdown(displayedCoach[msg.id] ?? "")}
                    {(displayedCoach[msg.id] ?? "").length < msg.text.length && (
                      <span className="typing-cursor ml-1 inline-block h-[14px] w-0.5 bg-realm-teal align-middle animate-pulse" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
                <span className="mt-2 block text-right text-[8px] font-space text-realm-muted opacity-40">
                  {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing bubble */}
          {typing && (
            <div className="flex items-end gap-3">
              <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-realm-gold to-orange-400 text-realm-bg shadow-md">
                <IconWand size={18} />
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-realm-border bg-realm-surface2 p-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-realm-gold animate-bounce"
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
          <div className="border-t border-realm-border bg-realm-surface2 px-6 py-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={typing}
                  className="rounded-xl border border-realm-border bg-realm-surface px-3 py-1.5 text-xs font-bold text-realm-muted font-space transition hover:border-realm-gold/40 hover:text-realm-cream disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="border-t border-realm-border bg-realm-surface2 px-6 py-4 shrink-0 font-space">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Seek counsel from the Sage on the Fog, missions, or focus…"
                disabled={typing}
                className="w-full rounded-2xl border border-realm-border bg-realm-surface px-5 py-3.5 text-sm text-realm-cream placeholder-realm-muted outline-none transition focus:border-realm-gold focus:bg-realm-surface/60 disabled:opacity-40"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg font-bold shadow-md hover:scale-102 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconSend size={18} />
            </button>
          </div>
          <p className="mt-2.5 text-center text-[10px] text-realm-muted">
            Press Enter to send counsel request · Consulting the Sage's Grimoire
          </p>
        </div>
      </div>
    </div>
  );
}
