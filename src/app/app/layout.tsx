"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XpProvider, useXp } from "@/components/providers/XpProvider";
import { PetProvider } from "@/components/providers/PetProvider";
import PetCompanion from "@/components/pet/PetCompanion";
import { bus } from "@/lib/events";
import { levelFromXp } from "@/lib/xp/levels";
import { 
  IconUser, 
  IconSettings, 
  IconSun, 
  IconMoon, 
  IconCalendar 
} from "@tabler/icons-react";

function UserTitleBadge() {
  const { totalXp } = useXp();
  const currentLevel = levelFromXp(totalXp);
  const userTitle =
    currentLevel <= 2 ? "Commoner" :
    currentLevel <= 5 ? "Squire" :
    currentLevel <= 9 ? "Knight" :
    currentLevel <= 14 ? "Champion" :
    currentLevel <= 20 ? "Legend" :
    "King/Queen";

  return (
    <span className="font-quick font-bold text-xs uppercase tracking-wider text-[#f0a868]">
      {userTitle}
    </span>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/app" || pathname === "/app/";

  // Global Header States
  const [name, setName] = useState("Adventurer");
  const [avatar, setAvatar] = useState("🧗");
  const [isLight, setIsLight] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [equippedTheme, setEquippedTheme] = useState<string | null>(null);

  // Load Date
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Load User Preferences
  useEffect(() => {
    async function loadUser() {
      try {
        const savedName = localStorage.getItem("focura.username");
        if (savedName) setName(savedName);
        else {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", user.id)
              .single();
            if (profile?.name) setName(profile.name);
            else if (user.email) setName(user.email.split("@")[0]);
          }
        }
      } catch {
        const savedName = localStorage.getItem("focura.username");
        if (savedName) setName(savedName);
      }

      const savedAvatar = localStorage.getItem("focura.avatar");
      if (savedAvatar) setAvatar(savedAvatar);

      const savedTheme = localStorage.getItem("focura.theme");
      const initialLight = savedTheme === "light" || document.documentElement.classList.contains("light-theme");
      setIsLight(initialLight);
      if (initialLight) {
        document.documentElement.classList.add("light-theme");
      } else {
        document.documentElement.classList.remove("light-theme");
      }
    }
    loadUser();

    // Load Equipped Theme
    const loadEquippedTheme = () => {
      try {
        const rawRewards = localStorage.getItem("focura.rewards.v1");
        if (rawRewards) {
          const parsed = JSON.parse(rawRewards);
          const equipped = parsed.find((r: any) => r.category === "theme" && r.equipped);
          if (equipped) {
            setEquippedTheme(equipped.id);
          } else {
            setEquippedTheme(null);
          }
        }
      } catch {
        setEquippedTheme(null);
      }
    };
    loadEquippedTheme();

    // Listen to profile/settings updates from SettingsPage
    const handleSettingsSave = () => {
      const savedName = localStorage.getItem("focura.username");
      if (savedName) setName(savedName);
      const savedAvatar = localStorage.getItem("focura.avatar");
      if (savedAvatar) setAvatar(savedAvatar);
    };

    window.addEventListener("storage", handleSettingsSave);
    window.addEventListener("storage", loadEquippedTheme);
    window.addEventListener("focura:rewards-updated", loadEquippedTheme);

    return () => {
      window.removeEventListener("storage", handleSettingsSave);
      window.removeEventListener("storage", loadEquippedTheme);
      window.removeEventListener("focura:rewards-updated", loadEquippedTheme);
    };
  }, []);

  // Handle Theme Toggle
  const toggleTheme = (light: boolean) => {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("focura.theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("focura.theme", "dark");
    }
    bus.emit("theme:changed", { theme: light ? "light" : "dark" });
  };

  return (
    <XpProvider>
      <PetProvider>
        <div className={`min-h-screen bg-warm-bg text-warm-text font-space select-none pb-20 relative overflow-hidden ${
          equippedTheme === "r3" ? "theme-emerald" : equippedTheme === "r7" ? "theme-sunset" : ""
        }`}>
          {/* Background Ambient Glowing Orbs */}
          <div className="pointer-events-none absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-warm-purple/8 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="pointer-events-none absolute right-[-5%] top-[15%] h-[450px] w-[450px] rounded-full bg-warm-teal/6 blur-[100px]" />
          <div className="pointer-events-none absolute left-[30%] bottom-[-10%] h-[550px] w-[550px] rounded-full bg-warm-amber/5 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />

          {/* ── GLOBAL TOP NAV ── */}
          <header className="border-b border-warm-border bg-warm-bg/70 backdrop-blur-md sticky top-0 z-40">
            <div className="mx-auto max-w-[1400px] flex items-center justify-between px-8 py-5">
              <div className="flex items-center gap-8">
                <Link href="/app" className="group font-quick font-bold text-xl tracking-wider text-[#f5efe8]">
                  focura<span className="text-[#f0a868]">.</span>
                </Link>

                {/* Pill Navigation Tab Group */}
                <nav className="flex items-center gap-1.5 rounded-full bg-realm-surface2 border border-realm-border p-1.5 relative">
                  {[
                    { href: "/app", label: "🏰 War Room" },
                    { href: "/app/tasks", label: "⚔️ The Scroll" },
                    { href: "/app/paths", label: "🗺️ Great Quests" },
                    { href: "/app/music", label: "🎵 Bard's Hall" },
                    { href: "/app/stats", label: "📖 Chronicle" },
                  ].map(tab => {
                    const active = pathname === tab.href;
                    return (
                      <Link
                        key={tab.label}
                        href={tab.href}
                        className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-quick font-bold transition duration-200 ${
                          active
                            ? "bg-realm-surface text-realm-text shadow-sm"
                            : "text-realm-muted hover:text-realm-text"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}

                  {/* Dropdown for other modules */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(prev => !prev)}
                      className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-quick font-bold transition duration-200 flex items-center gap-1.5 ${
                        dropdownOpen || [
                          "/app/rewards", "/app/coach",
                          "/app/memory", "/app/contracts", "/app/challenges", "/app/timer"
                        ].includes(pathname)
                          ? "bg-realm-surface text-realm-text shadow-sm"
                          : "text-realm-muted hover:text-realm-text"
                      }`}
                      type="button"
                    >
                      <span>More</span>
                      <span className="text-[10px] opacity-75">{dropdownOpen ? "▲" : "▼"}</span>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute top-[44px] left-0 bg-realm-surface border border-realm-border rounded-2xl p-3.5 shadow-2xl w-48 space-y-1 z-50 animate-fade-in text-left">
                        {[
                          { href: "/app/timer", label: "⚔️ The Battle" },
                          { href: "/app/rewards", label: "💰 The Treasury" },
                          { href: "/app/coach", label: "🧙 The Sage" },
                          { href: "/app/memory", label: "📜 The Tome" },
                          { href: "/app/contracts", label: "🛡️ The Knight's Oath" },
                          { href: "/app/challenges", label: "🏁 Trials" },
                        ].map(item => {
                          const active = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-quick font-bold transition duration-200 ${
                                active
                                  ? "bg-realm-surface2 text-realm-gold"
                                  : "text-realm-muted hover:bg-white/5 hover:text-realm-text"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* User Dropdown Section */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(prev => !prev)}
                  className={`h-10 w-10 rounded-full border bg-realm-surface2/60 flex items-center justify-center text-realm-text hover:border-realm-gold/40 hover:scale-105 transition ${
                    userDropdownOpen ? "border-realm-gold/60 ring-1 ring-realm-gold/35" : "border-realm-border"
                  }`}
                  title="User Menu"
                  type="button"
                >
                  <IconUser size={18} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute top-[48px] right-0 bg-realm-surface border border-realm-border rounded-2xl p-4 shadow-2xl w-64 space-y-4 z-50 animate-fade-in text-left">
                    {/* Adventure / Profile Section */}
                    <div className="flex items-center gap-3 border-b border-realm-border pb-3">
                      <span className="text-2xl shrink-0">{avatar}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-realm-cream truncate">{name}</p>
                        <div className="mt-0.5">
                          <UserTitleBadge />
                        </div>
                      </div>
                    </div>

                    {/* Date & Info */}
                    <div className="space-y-2 text-xs text-realm-muted font-space">
                      <div className="flex items-center gap-1.5">
                        <IconCalendar size={14} className="text-realm-gold" />
                        <span>{currentDate}</span>
                      </div>
                    </div>

                    <div className="h-px bg-realm-border" />

                    {/* Action links */}
                    <div className="space-y-1 font-space">
                      {/* Settings link */}
                      <Link
                        href="/app/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-realm-muted hover:bg-white/5 hover:text-realm-text transition"
                      >
                        <IconSettings size={14} className="text-realm-gold" />
                        Settings
                      </Link>

                      {/* Login link */}
                      <Link
                        href="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-realm-muted hover:bg-white/5 hover:text-realm-text transition"
                      >
                        <IconUser size={14} className="text-realm-teal" />
                        Login
                      </Link>
                    </div>

                    <div className="h-px bg-realm-border" />

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between font-space">
                      <span className="text-xs text-realm-muted">App Tone</span>
                      <button
                        onClick={() => {
                          toggleTheme(!isLight);
                          setUserDropdownOpen(false);
                        }}
                        className="rounded-xl border border-realm-border bg-realm-surface2 px-3.5 py-1.5 text-xs font-bold text-realm-cream hover:border-realm-gold/40 transition flex items-center gap-1.5"
                        type="button"
                      >
                        {isLight ? (
                          <>
                            <IconMoon size={14} className="text-realm-purple" />
                            <span>Dark</span>
                          </>
                        ) : (
                          <>
                            <IconSun size={14} className="text-realm-gold" />
                            <span>Light</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── MAIN CONTENT AREA ── */}
          <main className="mx-auto max-w-[1400px] px-6 py-10 relative z-10">
            {children}
          </main>

          {/* Global Floating Companion */}
          <PetCompanion />
        </div>
      </PetProvider>
    </XpProvider>
  );
}
