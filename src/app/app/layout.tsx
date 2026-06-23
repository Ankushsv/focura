"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { XpProvider, useXp } from "@/components/providers/XpProvider";
import { PetProvider } from "@/components/providers/PetProvider";
import PetCompanion from "@/components/pet/PetCompanion";
import SetupWizard from "@/components/onboarding/SetupWizard";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { TimerProvider } from "@/components/providers/TimerProvider";
import FloatingTimerOverlay from "@/components/timer/FloatingTimerOverlay";
import { bus } from "@/lib/events";
import { levelFromXp } from "@/lib/xp/levels";
import { 
  IconUser, 
  IconSettings, 
  IconSun, 
  IconMoon, 
  IconCalendar,
  IconChartBar,
  IconGift
} from "@tabler/icons-react";

function UserTitleBadge() {
  const { totalXp } = useXp();
  const currentLevel = levelFromXp(totalXp);
  const userTitle =
    currentLevel <= 2 ? "Novice" :
    currentLevel <= 5 ? "Apprentice" :
    currentLevel <= 9 ? "Practitioner" :
    currentLevel <= 14 ? "Specialist" :
    currentLevel <= 20 ? "Expert" :
    "Master";

  return (
    <span className="font-quick font-bold text-xs uppercase tracking-wider text-warm-amber">
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
  // Use localStorage cache so returning users skip the blocking sync screen
  const [onboardingStep, setOnboardingStep] = useState<"idle" | "wizard" | "tour" | "done">(() => {
    if (typeof window !== "undefined" && localStorage.getItem("focura.onboarded") === "1") return "done";
    return "idle";
  });
  const [syncing, setSyncing] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("focura.onboarded") === "1") return false;
    return true;
  });
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
            
            // Onboarding step — localStorage cache wins to avoid re-showing wizard
            const alreadyOnboarded = localStorage.getItem("focura.onboarded") === "1";
            if (profile.onboarding_complete || alreadyOnboarded) {
              localStorage.setItem("focura.onboarded", "1");
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
          <div className="h-16 w-16 mx-auto rounded-full border border-warm-border flex items-center justify-center text-warm-text text-4xl shadow-lg animate-spin" style={{ animationDuration: '3s' }}>
            ⚡
          </div>
          <h2 className="font-quick font-bold text-xl tracking-wider text-warm-text animate-pulse">SYNCHRONIZING DATA</h2>
          <p className="font-quick text-sm text-warm-textMuted font-bold">Updating your tasks and focus metrics with the database...</p>
        </div>
      </div>
    );
  }

  return (
    <XpProvider>
      <PetProvider>
        <TimerProvider>
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
                  focura<span className="text-warm-amber">.</span>
                </Link>

                {/* Pill Navigation Tab Group */}
                <nav className="flex items-center gap-1.5 rounded-full bg-warm-surface2 border border-warm-border p-1.5 relative">
                  {[
                    { href: "/app", label: "📊 Dashboard" },
                    { href: "/app/tasks", label: "📋 Tasks" },
                    { href: "/app/paths", label: "🛣️ Paths" },
                    { href: "/app/music", label: "🎵 Focus Music" },
                  ].map(tab => {
                    const active = pathname === tab.href;
                    return (
                      <Link
                        key={tab.label}
                        href={tab.href}
                        className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-quick font-bold transition duration-200 ${
                          active
                            ? "bg-warm-surface text-warm-text shadow-sm"
                            : "text-warm-textMuted hover:text-warm-text"
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
                          "/app/coach",
                          "/app/memory", "/app/contracts", "/app/challenges", "/app/timer"
                        ].includes(pathname)
                          ? "bg-warm-surface text-warm-text shadow-sm"
                          : "text-warm-textMuted hover:text-warm-text"
                      }`}
                      type="button"
                    >
                      <span>More</span>
                      <span className="text-[10px] opacity-75">{dropdownOpen ? "▲" : "▼"}</span>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute top-[44px] left-0 bg-warm-surface border border-warm-border rounded-2xl p-3.5 shadow-2xl w-48 space-y-1 z-50 animate-fade-in text-left">
                        {[
                          { href: "/app/timer", label: "⏱️ Focus Timer" },
                          { href: "/app/coach", label: "🤖 AI Coach" },
                          { href: "/app/memory", label: "🧠 Focus Memory" },
                          { href: "/app/contracts", label: "🤝 Focus Contracts" },
                          { href: "/app/challenges", label: "🏆 Challenges" },
                        ].map(item => {
                          const active = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-quick font-bold transition duration-200 ${
                                active
                                  ? "bg-warm-surface2 text-warm-amber"
                                  : "text-warm-textMuted hover:bg-white/5 hover:text-warm-text"
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
                  className={`h-10 w-10 rounded-full border bg-warm-surface2/60 flex items-center justify-center text-warm-text hover:border-warm-amber/40 hover:scale-105 transition ${
                    userDropdownOpen ? "border-warm-amber/60 ring-1 ring-warm-amber/35" : "border-warm-border"
                  }`}
                  title="User Menu"
                  type="button"
                >
                  <IconUser size={18} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute top-[48px] right-0 bg-warm-surface border border-warm-border rounded-2xl p-4 shadow-2xl w-64 space-y-4 z-50 animate-fade-in text-left">
                    {/* Adventure / Profile Section */}
                    <div className="flex items-center gap-3 border-b border-warm-border pb-3">
                      <span className="text-2xl shrink-0">{avatar}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-warm-cream truncate">{name}</p>
                        <div className="mt-0.5">
                          <UserTitleBadge />
                        </div>
                      </div>
                    </div>

                    {/* Date & Info */}
                    <div className="space-y-2 text-xs text-warm-textMuted font-space">
                      <div className="flex items-center gap-1.5">
                        <IconCalendar size={14} className="text-warm-amber" />
                        <span>{currentDate}</span>
                      </div>
                    </div>

                          {/* Action links */}
                    <div className="space-y-1 font-space">
                      {/* Statistics link */}
                      <Link
                        href="/app/stats"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition animate-fade-in"
                      >
                        <IconChartBar size={14} className="text-warm-teal" />
                        Statistics
                      </Link>

                      {/* Rewards link */}
                      <Link
                        href="/app/rewards"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition animate-fade-in"
                      >
                        <IconGift size={14} className="text-warm-purple" />
                        Rewards
                      </Link>

                      {/* Settings link */}
                      <Link
                        href="/app/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
                      >
                        <IconSettings size={14} className="text-warm-amber" />
                        Settings
                      </Link>
 
                      {/* Login or Logout link */}
                      {user ? (
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition text-left"
                          type="button"
                        >
                          <IconUser size={14} className="text-[#ea580c]" />
                          Logout
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs font-bold text-warm-textMuted hover:bg-white/5 hover:text-warm-text transition"
                        >
                          <IconUser size={14} className="text-warm-teal" />
                          Login
                        </Link>
                      )}
                    </div>

                    <div className="h-px bg-warm-border" />

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between font-space">
                      <span className="text-xs text-warm-textMuted">App Tone</span>
                      <button
                        onClick={() => {
                          toggleTheme(!isLight);
                          setUserDropdownOpen(false);
                        }}
                        className="rounded-xl border border-warm-border bg-warm-surface2 px-3.5 py-1.5 text-xs font-bold text-warm-cream hover:border-warm-amber/40 transition flex items-center gap-1.5"
                        type="button"
                      >
                        {isLight ? (
                          <>
                            <IconMoon size={14} className="text-warm-purple" />
                            <span>Dark</span>
                          </>
                        ) : (
                          <>
                            <IconSun size={14} className="text-warm-amber" />
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
          <FloatingTimerOverlay />
        </div>

        {/* Onboarding Flow */}
        {onboardingStep === "wizard" && (
          <SetupWizard onComplete={() => setOnboardingStep("tour")} />
        )}
        {onboardingStep === "tour" && (
          <OnboardingTour onComplete={() => setOnboardingStep("done")} />
        )}
        </TimerProvider>
      </PetProvider>
    </XpProvider>
  );
}
