"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { bus } from "@/lib/events";

const AVATAR_OPTIONS = ["🧗", "🦊", "🚀", "🧙‍♂️", "🎯", "🧠", "🎨", "⚡", "👾", "☕", "🦄", "🍀"];

export default function SettingsPage() {
  const { totalXp, level, awardXp } = useXp();
  const { activePet } = usePet();

  // Settings State
  const [name, setName] = useState("Adventurer");
  const [avatar, setAvatar] = useState("🧗");
  const [focusDur, setFocusDur] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [isLight, setIsLight] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Status feedback
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load Settings
  useEffect(() => {
    // 1. User Name & Avatar
    const savedName = localStorage.getItem("focura.username") || "Adventurer";
    const savedAvatar = localStorage.getItem("focura.avatar") || "🧗";
    setName(savedName);
    setAvatar(savedAvatar);

    // 2. Timer settings
    const savedFocus = localStorage.getItem("focura.timer.focus_duration");
    const savedShort = localStorage.getItem("focura.timer.short_break_duration");
    const savedLong = localStorage.getItem("focura.timer.long_break_duration");
    if (savedFocus) setFocusDur(parseInt(savedFocus, 10));
    if (savedShort) setShortBreak(parseInt(savedShort, 10));
    if (savedLong) setLongBreak(parseInt(savedLong, 10));

    // 3. App settings (theme and toggles)
    const savedTheme = localStorage.getItem("focura.theme");
    const initialLight = savedTheme === "light" || document.documentElement.classList.contains("light-theme");
    setIsLight(initialLight);

    const savedSounds = localStorage.getItem("focura.settings.sounds_enabled");
    if (savedSounds !== null) setSoundsEnabled(savedSounds === "true");

    const savedNotify = localStorage.getItem("focura.settings.notifications_enabled");
    if (savedNotify !== null) setNotificationsEnabled(savedNotify === "true");
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

  // Save Settings handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(null);

    // Save profile settings
    localStorage.setItem("focura.username", name.trim());
    localStorage.setItem("focura.avatar", avatar);

    // Save timer settings
    localStorage.setItem("focura.timer.focus_duration", focusDur.toString());
    localStorage.setItem("focura.timer.short_break_duration", shortBreak.toString());
    localStorage.setItem("focura.timer.long_break_duration", longBreak.toString());

    // Save other settings
    localStorage.setItem("focura.settings.sounds_enabled", soundsEnabled.toString());
    localStorage.setItem("focura.settings.notifications_enabled", notificationsEnabled.toString());

    // Trigger feedback
    setSavedStatus("Settings saved successfully! ✨");
    bus.emit("pet:react", { message: "Preferences adjusted. Feels clean! ⚙️" });

    // Clear feedback timer
    setTimeout(() => {
      setSavedStatus(null);
    }, 3000);
  };

  // Reset Data handler
  const handleResetData = () => {
    // Clear localStorage items except critical auth
    const keysToKeep = ["sb-", "supabase.auth"];
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.some(k => key.startsWith(k))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Trigger reset reaction
    setShowResetConfirm(false);
    setSavedStatus("Data cleared! Reloading...");
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-8">
        <div className="space-y-1">
          <p className="text-[10px] font-quicksand font-bold uppercase tracking-widest text-warm-textMuted">
            Preferences ✦ custom configuration
          </p>
          <h1 className="text-3xl font-quicksand font-bold text-warm-text">
            Settings
          </h1>
        </div>

        <form onSubmit={handleSave} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT COLUMN: SETTINGS PANELS */}
          <div className="space-y-6">
            {/* Status alerts */}
            {savedStatus && (
              <div className="bg-warm-teal/10 border border-warm-teal/30 rounded-2xl px-5 py-4 text-sm font-quicksand font-bold text-warm-teal animate-fade-in flex items-center justify-between">
                <span>{savedStatus}</span>
                <span className="text-xs font-mono opacity-50">Just now</span>
              </div>
            )}

            {/* PANEL 1: PROFILE */}
            <div className="bg-gradient-to-br from-warm-surface to-warm-surface2 rounded-3xl border border-warm-border p-6 sm:p-8 space-y-6 shadow-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-warm-amber" />
              <h2 className="text-lg font-quicksand font-bold text-warm-text flex items-center gap-2">
                <span>👤</span> Profile Settings
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Name field */}
                <div className="space-y-2">
                  <label htmlFor="name-input" className="block text-xs font-quicksand font-bold text-warm-textMuted uppercase tracking-wider">
                    Your Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-warm-bg/60 border border-warm-border rounded-xl px-4 py-3 text-sm text-warm-text font-quicksand focus:border-warm-amber/60 focus:outline-none transition"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Avatar Display */}
                <div className="space-y-2">
                  <label className="block text-xs font-quicksand font-bold text-warm-textMuted uppercase tracking-wider">
                    Current Avatar
                  </label>
                  <div className="flex items-center gap-3 bg-warm-bg/40 border border-warm-border rounded-xl p-2 h-[50px] w-fit px-4">
                    <span className="text-2xl">{avatar}</span>
                    <span className="text-xs font-mono text-warm-textMuted">Custom Preset</span>
                  </div>
                </div>
              </div>

              {/* Avatar Selector Emojis */}
              <div className="space-y-3">
                <label className="block text-xs font-quicksand font-bold text-warm-textMuted uppercase tracking-wider">
                  Choose Avatar Emoji
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center text-xl transition-all duration-200 ${
                        avatar === emoji
                          ? "bg-warm-amber/10 border-warm-amber shadow-[0_0_8px_rgba(240,168,104,0.2)] scale-110"
                          : "bg-warm-surface2 border-warm-border hover:border-warm-text/30 hover:scale-105"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL 2: TIMER DURATIONS */}
            <div className="bg-gradient-to-br from-warm-surface to-warm-surface2 rounded-3xl border border-warm-border p-6 sm:p-8 space-y-6 shadow-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-warm-purple" />
              <h2 className="text-lg font-quicksand font-bold text-warm-text flex items-center gap-2">
                <span>⏱️</span> Default Timer Intervals
              </h2>

              <div className="grid gap-6 sm:grid-cols-3">
                {/* Focus Block */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-quicksand font-bold uppercase tracking-wider text-warm-textMuted">
                    <span>Focus Period</span>
                    <span className="font-mono text-warm-amber font-semibold">{focusDur}m</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={focusDur}
                    onChange={(e) => setFocusDur(parseInt(e.target.value, 10))}
                    className="w-full accent-warm-amber bg-warm-bg border border-warm-border rounded-lg h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-warm-textHint font-mono">
                    <span>5 min</span>
                    <span>90 min</span>
                  </div>
                </div>

                {/* Short Break */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-quicksand font-bold uppercase tracking-wider text-warm-textMuted">
                    <span>Short Break</span>
                    <span className="font-mono text-warm-purple font-semibold">{shortBreak}m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={shortBreak}
                    onChange={(e) => setShortBreak(parseInt(e.target.value, 10))}
                    className="w-full accent-warm-purple bg-warm-bg border border-warm-border rounded-lg h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-warm-textHint font-mono">
                    <span>2 min</span>
                    <span>20 min</span>
                  </div>
                </div>

                {/* Long Break */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-quicksand font-bold uppercase tracking-wider text-warm-textMuted">
                    <span>Long Break</span>
                    <span className="font-mono text-warm-teal font-semibold">{longBreak}m</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={longBreak}
                    onChange={(e) => setLongBreak(parseInt(e.target.value, 10))}
                    className="w-full accent-warm-teal bg-warm-bg border border-warm-border rounded-lg h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-warm-textHint font-mono">
                    <span>5 min</span>
                    <span>60 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 3: SOUNDS & NOTIFICATIONS */}
            <div className="bg-gradient-to-br from-warm-surface to-warm-surface2 rounded-3xl border border-warm-border p-6 sm:p-8 space-y-6 shadow-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-warm-teal" />
              <h2 className="text-lg font-quicksand font-bold text-warm-text flex items-center gap-2">
                <span>⚙️</span> Sound & Alert Settings
              </h2>

              <div className="space-y-4">
                {/* Sounds toggle */}
                <div className="flex items-center justify-between border-b border-warm-border pb-3">
                  <div>
                    <h4 className="font-quicksand font-bold text-sm text-warm-text">Timer Soundscapes</h4>
                    <p className="text-xs text-warm-textMuted mt-0.5">Play ambient sounds/notifications automatically</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundsEnabled(prev => !prev)}
                    className={`h-6 w-11 rounded-full p-0.5 transition duration-300 ${
                      soundsEnabled ? "bg-warm-teal" : "bg-warm-surface2 border border-warm-border"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full bg-warm-bg shadow-sm transition duration-300 ${
                      soundsEnabled ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>

                {/* Notifications toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-quicksand font-bold text-sm text-warm-text">Quest Reminders</h4>
                    <p className="text-xs text-warm-textMuted mt-0.5">Send alerts when milestone timers run out</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled(prev => !prev)}
                    className={`h-6 w-11 rounded-full p-0.5 transition duration-300 ${
                      notificationsEnabled ? "bg-warm-teal" : "bg-warm-surface2 border border-warm-border"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full bg-warm-bg shadow-sm transition duration-300 ${
                      notificationsEnabled ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIONS / SUMMARY */}
          <aside className="space-y-6">
            {/* Action Card */}
            <div className="bg-gradient-to-br from-warm-surface to-warm-surface2 rounded-3xl border border-warm-border p-6 space-y-4 shadow-lg text-center">
              <div className="h-16 w-16 bg-warm-amber/10 border border-warm-amber/20 rounded-full flex items-center justify-center text-3xl mx-auto shadow animate-pulse">
                {avatar}
              </div>
              <div className="space-y-1">
                <h4 className="font-quicksand font-bold text-warm-text">{name}</h4>
                <p className="text-xs text-warm-textMuted">Level {level} Companion Trainer</p>
              </div>

              <div className="border-t border-warm-border/60 pt-4 flex justify-between text-xs text-warm-textMuted">
                <span>XP Balance</span>
                <span className="font-mono text-warm-amber font-semibold">{totalXp} XP</span>
              </div>

              {activePet && (
                <div className="border-t border-warm-border/60 pt-4 flex justify-between text-xs text-warm-textMuted">
                  <span>Companion</span>
                  <span className="font-quicksand font-semibold text-warm-teal">{activePet.emoji} {activePet.name}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-warm-amber text-warm-bg py-3 px-4 font-quicksand font-bold text-sm transition duration-200 hover:scale-102 hover:-translate-y-0.5 shadow-md shadow-warm-amber/10 hover:shadow-warm-amber/20"
              >
                💾 Save Changes
              </button>

              <Link
                href="/app"
                className="w-full rounded-2xl border border-warm-border bg-warm-surface2/40 hover:bg-white/5 py-3 px-4 font-quicksand font-bold text-xs text-warm-text block transition"
              >
                Cancel & Return
              </Link>
            </div>

            {/* Developer Testing / DEV TOOL */}
            <div className="bg-warm-surface rounded-2xl border border-warm-border border-l-2 border-l-warm-amber/50 p-5 space-y-3 shadow-md">
              <h4 className="text-[10px] font-quicksand font-bold uppercase tracking-widest text-warm-amber">
                🛠️ Testing Developer Tools
              </h4>
              <p className="text-xs text-warm-textMuted leading-relaxed">
                Add XP instantly to unlock rewards and level up your companion pet.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    awardXp(1000, "testing_tool");
                  }}
                  className="rounded bg-warm-amber/10 border border-warm-amber text-warm-amber px-2.5 py-1.5 text-xs font-quicksand font-bold hover:bg-warm-amber/20 transition"
                >
                  +1,000 XP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    awardXp(50000, "testing_tool");
                  }}
                  className="rounded bg-gradient-to-r from-warm-amber to-warm-purple text-black px-3 py-1.5 text-xs font-quicksand font-extrabold hover:opacity-90 transition"
                >
                  +50,000 XP
                </button>
              </div>
            </div>

            {/* Reset / DANGER ZONE */}
            <div className="bg-warm-surface rounded-2xl border border-warm-border border-l-2 border-l-red-500/50 p-5 space-y-3 shadow-md">
              <h4 className="text-[10px] font-quicksand font-bold uppercase tracking-widest text-red-400">
                🚨 Danger Zone
              </h4>
              <p className="text-xs text-warm-textMuted leading-relaxed">
                Clear all productivity metrics, focus history, custom logs and settings reset.
              </p>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 px-3 py-1.5 text-xs font-quicksand font-bold hover:bg-red-500/10 transition"
                >
                  Reset All Data
                </button>
              ) : (
                <div className="space-y-2 border border-red-500/30 bg-red-500/5 p-3 rounded-xl">
                  <p className="text-[10px] text-red-400 font-bold">Are you absolutely sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="rounded bg-red-500 text-white px-2.5 py-1 text-[10px] font-quicksand font-bold hover:bg-red-600 transition"
                    >
                      Yes, reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="rounded bg-warm-surface2 border border-warm-border text-warm-text px-2.5 py-1 text-[10px] font-quicksand font-bold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </form>
    </div>
  );
}
