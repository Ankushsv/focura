"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useXp } from "@/components/providers/XpProvider";
import { usePet } from "@/components/providers/PetProvider";
import { createClient } from "@/lib/supabase/client";
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
  const [wakeHour, setWakeHour] = useState(6);
  const [sleepHour, setSleepHour] = useState(23);

  // Status feedback
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setName(profile.username || profile.name || user.email?.split("@")[0] || "Adventurer");
          setAvatar(profile.avatar_emoji || "🧗");
          if (profile.focus_duration) setFocusDur(profile.focus_duration);
          if (profile.short_break_duration) setShortBreak(profile.short_break_duration);
          if (profile.long_break_duration) setLongBreak(profile.long_break_duration);
          
          const isProfileLight = profile.theme === "light";
          setIsLight(isProfileLight);
          if (isProfileLight) {
            document.documentElement.classList.add("light-theme");
          } else {
            document.documentElement.classList.remove("light-theme");
          }

          if (profile.sounds_enabled !== undefined && profile.sounds_enabled !== null) {
            setSoundsEnabled(profile.sounds_enabled);
          }
          if (profile.notifications_enabled !== undefined && profile.notifications_enabled !== null) {
            setNotificationsEnabled(profile.notifications_enabled);
          }
          if (profile.wake_hour !== undefined && profile.wake_hour !== null) {
            setWakeHour(profile.wake_hour);
          }
          if (profile.sleep_hour !== undefined && profile.sleep_hour !== null) {
            setSleepHour(profile.sleep_hour);
          }
        }
      } catch (err) {
        console.warn("Failed to load settings from Supabase:", err);
      }
    }
    loadSettings();
  }, []);

  // Handle Theme Toggle
  const toggleTheme = async (light: boolean) => {
    setIsLight(light);
    if (light) {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
    bus.emit("theme:changed", { theme: light ? "light" : "dark" });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ theme: light ? "light" : "dark" })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Failed to save theme in profile:", err);
    }
  };

  // Save Settings handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullPayload = {
        username: name.trim(),
        name: name.trim(),
        avatar_emoji: avatar,
        focus_duration: focusDur,
        short_break_duration: shortBreak,
        long_break_duration: longBreak,
        sounds_enabled: soundsEnabled,
        notifications_enabled: notificationsEnabled,
        wake_hour: wakeHour,
        sleep_hour: sleepHour,
        timeline_setup_done: true,
      };

      let { error } = await supabase
        .from("profiles")
        .update(fullPayload)
        .eq("id", user.id);

      if (error) {
        console.warn("Failed to save full settings, retrying with base columns...", error);
        
        // Fallback update with base columns that are guaranteed to exist
        const basePayload = {
          username: name.trim(),
          avatar_emoji: avatar,
          wake_hour: wakeHour,
          sleep_hour: sleepHour,
          timeline_setup_done: true,
        };

        const { error: fallbackError } = await supabase
          .from("profiles")
          .update(basePayload)
          .eq("id", user.id);

        if (fallbackError) throw fallbackError;
      }

      // Local storage fallback for timeline setup completion
      if (typeof window !== "undefined") {
        window.localStorage.setItem("focura_timeline_setup_done", "true");
      }

      // Trigger feedback
      setSavedStatus("Settings saved successfully! ✨");
      bus.emit("pet:react", { message: "Preferences adjusted. Feels clean! ⚙️" });
    } catch (err) {
      console.warn("Failed to save settings:", err);
      setSavedStatus("Error saving settings.");
    }

    // Clear feedback timer
    setTimeout(() => {
      setSavedStatus(null);
    }, 3000);
  };

  // Reset Data handler
  const handleResetData = async () => {
    setShowResetConfirm(false);
    setSavedStatus("Clearing data from the cloud...");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from all user tables
      await Promise.all([
        supabase.from("tasks").delete().eq("user_id", user.id),
        supabase.from("subtasks").delete().eq("user_id", user.id),
        supabase.from("sessions").delete().eq("user_id", user.id),
        supabase.from("coach_messages").delete().eq("user_id", user.id),
        supabase.from("memory_notes").delete().eq("user_id", user.id),
        supabase.from("contracts").delete().eq("user_id", user.id),
        supabase.from("contract_checkins").delete().eq("user_id", user.id),
        supabase.from("challenges").delete().eq("user_id", user.id),
        supabase.from("user_rewards").delete().eq("user_id", user.id),
      ]);

      // Reset profile
      const fullResetPayload = {
        total_xp: 0,
        level: 1,
        theme: "dark",
        focus_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        sounds_enabled: true,
        notifications_enabled: true,
        onboarding_complete: false,
      };

      let { error: resetError } = await supabase
        .from("profiles")
        .update(fullResetPayload)
        .eq("id", user.id);

      if (resetError) {
        console.warn("Failed to reset full profile fields, retrying with base columns...", resetError);
        const baseResetPayload = {
          total_xp: 0,
          level: 1,
        };
        const { error: fallbackResetError } = await supabase
          .from("profiles")
          .update(baseResetPayload)
          .eq("id", user.id);

        if (fallbackResetError) throw fallbackResetError;
      }

      setSavedStatus("Data cleared! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.warn("Failed to reset data:", err);
      setSavedStatus("Reset failed. Try again.");
    }
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

              {/* Timeline Preferences */}
              <div className="grid gap-6 sm:grid-cols-2 border-t border-warm-border/40 pt-5">
                {/* Wake Hour */}
                <div className="space-y-2">
                  <label htmlFor="wake-hour-select" className="block text-xs font-quicksand font-bold text-warm-textMuted uppercase tracking-wider">
                    🌅 Wake Up Hour (Timeline)
                  </label>
                  <select
                    id="wake-hour-select"
                    value={wakeHour}
                    onChange={(e) => setWakeHour(parseInt(e.target.value, 10))}
                    className="w-full bg-[#161412] border border-warm-border rounded-xl px-4 py-3 text-sm text-warm-text font-quicksand focus:border-warm-amber/60 focus:outline-none transition"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const ampm = i < 12 ? "AM" : "PM";
                      const h = i % 12 === 0 ? 12 : i % 12;
                      return (
                        <option key={i} value={i} className="bg-warm-surface text-warm-text">
                          {h}:00 {ampm}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Sleep Hour */}
                <div className="space-y-2">
                  <label htmlFor="sleep-hour-select" className="block text-xs font-quicksand font-bold text-warm-textMuted uppercase tracking-wider">
                    💤 Bedtime Hour (Timeline)
                  </label>
                  <select
                    id="sleep-hour-select"
                    value={sleepHour}
                    onChange={(e) => setSleepHour(parseInt(e.target.value, 10))}
                    className="w-full bg-[#161412] border border-warm-border rounded-xl px-4 py-3 text-sm text-warm-text font-quicksand focus:border-warm-amber/60 focus:outline-none transition"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const ampm = i < 12 ? "AM" : "PM";
                      const h = i % 12 === 0 ? 12 : i % 12;
                      return (
                        <option key={i} value={i} className="bg-warm-surface text-warm-text">
                          {h}:00 {ampm}
                        </option>
                      );
                    })}
                  </select>
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
