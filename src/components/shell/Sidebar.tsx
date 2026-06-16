"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { levelProgress } from "@/lib/xp/levels";
import Logo from "@/components/ui/Logo";

const NAV = [
  { href: "/app",            label: "Dashboard",    icon: "🏠", color: "from-violet-500 to-purple-600",  glow: "rgba(139,92,246,0.4)"  },
  { href: "/app/paths",      label: "Mastery Paths",icon: "🗺️", color: "from-cyan-500 to-teal-600",      glow: "rgba(34,211,238,0.4)"  },
  { href: "/app/contracts",  label: "Contracts",    icon: "🛡️", color: "from-purple-500 to-indigo-600",  glow: "rgba(167,139,250,0.4)" },
  { href: "/app/timer",      label: "Focus Timer",  icon: "⏳", color: "from-amber-500 to-orange-600",   glow: "rgba(251,191,36,0.4)"  },
  { href: "/app/tasks",      label: "Quests",       icon: "⚔️", color: "from-red-500 to-rose-600",       glow: "rgba(244,63,94,0.4)"   },
  { href: "/app/challenges", label: "Challenges",   icon: "🏁", color: "from-orange-500 to-red-600",     glow: "rgba(249,115,22,0.4)"  },
  { href: "/app/stats",      label: "Stats",        icon: "📊", color: "from-blue-500 to-indigo-600",    glow: "rgba(99,102,241,0.4)"  },
  { href: "/app/rewards",    label: "Rewards",      icon: "🎁", color: "from-yellow-500 to-amber-600",   glow: "rgba(234,179,8,0.4)"   },
  { href: "/app/coach",      label: "AI Coach",     icon: "🤖", color: "from-teal-500 to-cyan-600",      glow: "rgba(20,184,166,0.4)"  },
  { href: "/app/memory",     label: "Focus Memory", icon: "🧠", color: "from-pink-500 to-rose-600",      glow: "rgba(236,72,153,0.4)"  },
  { href: "/app/music",      label: "Music",        icon: "🎵", color: "from-violet-600 to-purple-700",  glow: "rgba(124,58,237,0.4)"  },
  { href: "/app/settings",   label: "Settings",     icon: "⚙️", color: "from-zinc-500 to-zinc-600",      glow: "rgba(128,128,128,0.4)" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { totalXp, level } = useXp();
  const progress = levelProgress(totalXp);
  const pct = Math.round((progress.current / progress.required) * 100);

  let pet: { emoji?: string; name?: string } = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const petCtx = usePet();
    pet = { emoji: petCtx.activePet?.emoji, name: petCtx.activePet?.name };
  } catch { /* PetProvider not mounted */ }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/8 bg-surface/80 backdrop-blur-xl">
      {/* Logo */}
      <Link href="/" className="group px-5 py-5 block">
        <Logo theme="purple" size="md" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
        {NAV.map((item, i) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item-in group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Active glow line */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full"
                  style={{ background: `linear-gradient(to bottom, ${item.glow.replace('0.4','0.8')}, ${item.glow})` }}
                />
              )}

              {/* Color-coded icon orb */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm transition-all duration-200 ${
                  active
                    ? `${item.color} shadow-md`
                    : "bg-white/5 group-hover:bg-white/10"
                }`}
                style={active ? { boxShadow: `0 4px 14px ${item.glow}` } : {}}
              >
                {item.icon}
              </div>
              <span className="truncate">{item.label}</span>

              {/* Active indicator dot */}
              {active && (
                <div
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: item.glow.replace('0.4','1') }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pet preview */}
      {pet.emoji && (
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
          <div className="pet-bounce-loop text-xl">{pet.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-300">{pet.name}</p>
            <p className="text-[10px] text-zinc-500">Your companion</p>
          </div>
        </div>
      )}

      {/* Level + XP */}
      <div className="border-t border-white/8 px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[10px] font-black text-white">
              {level}
            </div>
            <span className="font-semibold text-zinc-200">Level {level}</span>
          </div>
          <span className="text-zinc-500">{progress.current}/{progress.required} XP</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(139,92,246,0.5)" }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-600">{pct}% to Level {level + 1}</p>
      </div>
    </aside>
  );
}
