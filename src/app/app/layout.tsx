"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { XpProvider, useXp } from "@/components/providers/XpProvider";
import { PetProvider } from "@/components/providers/PetProvider";
import PetCompanion from "@/components/pet/PetCompanion";
import SetupWizard from "@/components/onboarding/SetupWizard";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
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
  const router = useRouter();
  const isHome = pathname === "/app" || pathname === "/app/";

  // Global Header States
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("Adventurer");
  const [avatar, setAvatar] = useState("🧗");
  const [isLight, setIsLight] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [equippedTheme, setEquippedTheme] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<"idle" | "wizard" | "tour" | "done">("idle");
  const [syncing, setSyncing] = useState(true);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);



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
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          setUser(supabaseUser);
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", supabaseUser.id)
            .single();
          
          if (profile) {
            const profileName = profile.name || profile.username || supabaseUser.email?.split("@")[0] || "Adventurer";
            setName(profileName);
            if (profile.avatar_emoji) setAvatar(profile.avatar_emoji);
            
            // Onboarding step
            if (profile.onboarding_complete) {
              setOnboardingStep("done");
            } else {
              setOnboardingStep("wizard");
            }

            // Theme
            const isProfileLight = profile.theme === "light";
            setIsLight(isProfileLight);
            if (isProfileLight) {
              document.documentElement.classList.add("light-theme");
            } else {
              document.documentElement.classList.remove("light-theme");
            }
          }
        } else {
          setUser(null);
          router.push("/login");
        }
      } catch (err) {
        console.warn("Failed to load user profile:", err);
        setUser(null);
        router.push("/login");
      } finally {
        setSyncing(false);
      }
    }
    loadUser();

    // Load Equipped Theme from DB
    const loadEquippedTheme = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: dbRewards } = await supabase
          .from("user_rewards")
          .select("reward_id, equipped")
          .eq("user_id", user.id);
        if (dbRewards) {
          const equippedThemeReward = dbRewards.find(r => r.equipped && (r.reward_id === "r3" || r.reward_id === "r7"));
          if (equippedThemeReward) {
            setEquippedTheme(equippedThemeReward.reward_id);
          } else {
            setEquippedTheme(null);
          }
        }
      } catch {
        setEquippedTheme(null);
      }
    };
    loadEquippedTheme();

    window.addEventListener("focura:rewards-updated", loadEquippedTheme);

    return () => {
      window.removeEventListener("focura:rewards-updated", loadEquippedTheme);
    };
  }, [router]);

  // Handle Theme Toggle
  const toggleTheme = (light: boolean) => {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add("light-theme");
      // Save theme to profiles table
      void (async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ theme: "light" }).eq("id", user.id);
        }
      })();
    } else {
      document.documentElement.classList.remove("light-theme");
      void (async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ theme: "dark" }).eq("id", user.id);
        }
      })();
    }
    bus.emit("theme:changed", { theme: light ? "light" : "dark" });
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setUserDropdownOpen(false);
      router.push("/");
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  if (syncing) {
    return (
      <div className="min-h-screen bg-warm-bg text-warm-text font-space select-none flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-warm-purple/8 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="pointer-events-none absolute right-[-5%] top-[15%] h-[450px] w-[450px] rounded-full bg-warm-teal/6 blur-[100px]" />
        
        <div className="text-center space-y-6 max-w-sm px-6 z-10">
          <div className="h-16 w-16 mx-auto rounded-full border border-realm-border flex items-center justify-center text-realm-text text-4xl shadow-lg animate-spin" style={{ animationDuration: '3s' }}>
            ⚔️
          </div>
          <h2 className="font-quick font-bold text-xl tracking-wider text-realm-text animate-pulse">COMMUNING WITH THE REALM</h2>
          <p className="font-quick text-sm text-realm-muted font-bold">Synchronizing your scrolls and victories with the cloud...</p>
        </div>
      </div>
    );
  }

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

                      {/* Login or Logout link */}
                      {user ? (
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-realm-muted hover:bg-white/5 hover:text-realm-text transition text-left"
                          type="button"
                        >
                          <IconUser size={14} className="text-[#ea580c]" />
                          Logout
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-realm-muted hover:bg-white/5 hover:text-realm-text transition"
                        >
                          <IconUser size={14} className="text-realm-teal" />
                          Login
                        </Link>
                      )}
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

        {/* Onboarding Flow */}
        {onboardingStep === "wizard" && (
          <SetupWizard onComplete={() => setOnboardingStep("tour")} />
        )}
        {onboardingStep === "tour" && (
          <OnboardingTour onComplete={() => setOnboardingStep("done")} />
        )}
      </PetProvider>
    </XpProvider>
  );
}
