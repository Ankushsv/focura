"use client";

import { useState, useEffect } from "react";
import { useRewards } from "@/hooks/useRewards";
import { useXp } from "@/components/providers/XpProvider";
import { usePet, ALL_PET_SPECIES, type PetSpecies } from "@/components/providers/PetProvider";
import { CATEGORY_LABELS } from "@/lib/rewards/types";
import { bus } from "@/lib/events";
import { fireConfetti } from "@/lib/confetti";
import { 
  IconShield, 
  IconFlame, 
  IconTrophy, 
  IconCoin, 
  IconVolume, 
  IconVolumeOff, 
  IconMessage, 
  IconCookie, 
  IconSwords, 
  IconSparkles,
  IconLock,
  IconBookmark
} from "@tabler/icons-react";
import PixelPet from "@/components/pet/PixelPet";

type Tab = "pets" | "shop" | "collection";

const CATEGORY_COLORS: Record<string, string> = {
  pet: "bg-realm-purple/10 text-realm-purple border-realm-purple/30 font-space",
  title: "bg-realm-gold/10 text-realm-gold border-realm-gold/30 font-space",
  theme: "bg-realm-teal/10 text-realm-teal border-realm-teal/30 font-space",
  cosmetic: "bg-realm-crimson/10 text-realm-crimson border-realm-crimson/30 font-space",
};

export default function RewardsPage() {
  const { totalXp, awardXp } = useXp();
  const { shopRewards, unlockedRewards, purchaseReward, equipReward, loaded } = useRewards();
  const {
    activePet,
    ownedPetIds,
    petStats,
    petUsage,
    unlockPet,
    equipPet,
    feedPet,
    triggerBattleMove,
    soundEnabled,
    toggleSound,
    eeveeChoicePending,
    resolveEeveeBranch,
    setEeveeChoicePending,
    activeBattleMove,
    clearBattleMove,
  } = usePet();

  const [activeTab, setActiveTab] = useState<Tab>("pets");
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [petFilter, setPetFilter] = useState<"all" | "pokemon" | "legendary" | "mythic">("all");
  const [battleLogs, setBattleLogs] = useState<string[]>([]);

  // Automatically clear battle move and log after a brief period
  useEffect(() => {
    if (activeBattleMove) {
      const logs = [
        "A devastating blow!",
        "The Dark Lord reels!",
        `Your Companion ${activePet.name} channels ancient power!`,
        "The Fog recedes slightly from the shockwave!"
      ];
      setBattleLogs(logs);
      
      const timer = setTimeout(() => {
        clearBattleMove();
        setBattleLogs([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeBattleMove, clearBattleMove, activePet.name]);

  function handlePurchase(id: string) {
    const success = purchaseReward(id, totalXp);
    if (success) {
      setJustUnlocked(id);
      fireConfetti();
      bus.emit("pet:react", { message: "A new artifact has been secured in the Treasury! ✨" });
      setTimeout(() => setJustUnlocked(null), 2000);
    }
  }

  function handleUnlockPet(species: PetSpecies) {
    if (totalXp >= species.cost) {
      const success = unlockPet(species.id, species.cost);
      if (success) {
        awardXp(0, "pet-unlock");
        fireConfetti();
        bus.emit("pet:react", { message: `${species.name} has pledged their loyalty to your cause! 🌟` });
      }
    }
  }

  function handleFeed() {
    feedPet();
    bus.emit("pet:react", { message: "Your spirit companion devours the feast and grows stronger! 🍖" });
  }

  function handleSpeak() {
    bus.emit("pet:react", { message: `The bond between knight and companion strengthens. Let us ride to battle, master! ${activePet.emoji}` });
  }

  const activeUsage = petUsage[activePet.id] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
  const focusHours = (activeUsage.focusMinutes / 60).toFixed(1);
  const isEvolved = activePet.evolutionFrom !== undefined;

  // Familiar Arts Levels mapped to skills
  const skills = [
    {
      name: "Starter Passive (First Bond)",
      desc: activePet.ultimatePower + ": " + activePet.ultimateDesc,
      unlocked: true,
      progress: "100%",
    },
    {
      name: "Focused Bond (Battle Tested)",
      desc: "Earned by 5h focus with this pet active.",
      unlocked: activeUsage.focusMinutes >= 300,
      progress: `${(activeUsage.focusMinutes / 60).toFixed(1)}h / 5h`,
    },
    {
      name: "LP Synchronization (Legend Touched)",
      desc: "Earned by gaining 500 LP with this pet active.",
      unlocked: activeUsage.xpEarned >= 500,
      progress: `${activeUsage.xpEarned} / 500 LP`,
    },
    {
      name: "Quest Companion (War Hardened)",
      desc: "Earned by completing 10 missions with this pet active.",
      unlocked: activeUsage.tasksDone >= 10,
      progress: `${activeUsage.tasksDone} / 10 missions`,
    },
    {
      name: "Evolutionary Might (Awakened)",
      desc: "Unlocked automatically upon pet evolution.",
      unlocked: isEvolved,
      progress: isEvolved ? "Unlocked" : "Locked (Needs Evo)",
    },
    {
      name: "Ultimate Power (Legendary Ascendance)",
      desc: "Ultimate: " + activePet.ultimatePower + ". Requires 20h focus.",
      unlocked: activeUsage.focusMinutes >= 1200,
      progress: `${(activeUsage.focusMinutes / 60).toFixed(1)}h / 20h`,
      isUltimate: true,
    },
  ];

  const filteredPets = ALL_PET_SPECIES.filter((species) => {
    if (petFilter === "pokemon") return species.category === "pokemon" && species.cost <= 5000;
    if (petFilter === "legendary") return species.cost >= 10000;
    if (petFilter === "mythic") return species.unlockCondition !== undefined;
    return true;
  });

  if (!loaded)
    return (
      <div className="flex min-h-screen items-center justify-center bg-realm-bg text-realm-text">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-gold border-t-transparent" />
          <p className="text-sm text-realm-muted font-lora italic">Unlocking the Treasury Vaults…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-realm-bg text-realm-text px-4 py-8 md:px-8">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-realm-gold/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-realm-purple/5 blur-3xl" />
        <div className="absolute top-1/3 left-0 h-64 w-64 rounded-full bg-realm-teal/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">

        {/* EEVEE CHOICE MODAL */}
        {eeveeChoicePending && (
          <div className="relative overflow-hidden rounded-3xl border border-realm-gold bg-gradient-to-br from-realm-gold-dim via-realm-surface to-realm-surface2 p-8 text-center shadow-2xl">
            <div className="absolute inset-0 bg-realm-gold/5 animate-pulse" />
            <div className="relative">
              <div className="mb-3 flex justify-center text-6xl">🦊</div>
              <h2 className="font-cinzel text-2xl text-realm-cream">Eevee is Ready to Evolve!</h2>
              <p className="mt-2 text-sm text-realm-muted font-lora italic">
                Choose Eevee&apos;s elemental path based on your focus style:
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {[
                  { id: "espeon", name: "Espeon 🌸", desc: "Study Focus", color: "border-pink-400/40 hover:bg-pink-500/10" },
                  { id: "vaporeon", name: "Vaporeon 🌊", desc: "Relax Mood", color: "border-blue-400/40 hover:bg-blue-500/10" },
                  { id: "jolteon", name: "Jolteon ⚡", desc: "Coding Focus", color: "border-yellow-400/40 hover:bg-yellow-500/10" },
                  { id: "flareon", name: "Flareon 🔥", desc: "Hype Focus", color: "border-orange-400/40 hover:bg-orange-500/10" },
                  { id: "umbreon", name: "Umbreon 🌑", desc: "Night Focus", color: "border-indigo-400/40 hover:bg-indigo-500/10" },
                ].map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => resolveEeveeBranch(ev.id)}
                    className={`rounded-2xl border ${ev.color} bg-realm-surface2 px-5 py-4 text-center transition-all hover:scale-105`}
                  >
                    <p className="font-bold text-realm-cream font-space">{ev.name}</p>
                    <p className="mt-0.5 text-[11px] text-realm-muted font-lora italic">{ev.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEeveeChoicePending(false)}
                className="mt-5 text-xs text-realm-muted underline hover:text-realm-cream transition-colors font-space"
              >
                Cancel for now
              </button>
            </div>
          </div>
        )}

        {/* XP BALANCE HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-realm-border bg-gradient-to-br from-amber-950/40 via-realm-surface to-yellow-950/20 p-8 shadow-xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-realm-gold/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-realm-purple/5 blur-2xl" />
          </div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: coin + LP */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-realm-gold/20 blur-xl scale-150" />
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-full border border-realm-gold/30 bg-gradient-to-br from-realm-gold/20 to-realm-surface shadow-2xl text-5xl"
                  style={{ animation: "float-slow 3s ease-in-out infinite" }}
                >
                  <IconCoin size={44} className="text-realm-gold" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-realm-muted font-space">
                  Available Legend Points
                </p>
                <div className="bg-gradient-to-r from-realm-gold via-amber-200 to-yellow-100 bg-clip-text text-6xl font-black text-transparent leading-none mt-1 font-space">
                  {totalXp.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-realm-muted font-space">LP Coins</p>
              </div>
            </div>

            {/* Right: active pet profile widget */}
            <div className="flex flex-col gap-1 sm:text-right font-space">
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="text-lg">{activePet.emoji}</span>
                <span className="text-sm font-bold text-realm-cream">{activePet.name}</span>
                <span className="rounded-full border border-realm-teal/30 bg-realm-teal/10 px-2 py-0.5 text-[9px] font-bold text-realm-teal">ACTIVE FAMILIAR</span>
              </div>
              <p className="text-xs text-realm-muted">{ownedPetIds.length} Spirit Companions Summoned · {ALL_PET_SPECIES.length - ownedPetIds.length} remaining</p>
              <button
                onClick={toggleSound}
                className={`mt-2 self-start sm:self-end rounded-xl border px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  soundEnabled
                    ? "border-realm-teal/40 bg-realm-teal/10 text-realm-teal"
                    : "border-realm-border bg-realm-surface2 text-realm-muted hover:text-realm-cream"
                }`}
              >
                {soundEnabled ? (
                  <>
                    <IconVolume size={14} />
                    <span>Sounds On</span>
                  </>
                ) : (
                  <>
                    <IconVolumeOff size={14} />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* COMBAT LOG OVERLAY WHEN ULTIMATE ACTIVE */}
        {activeBattleMove && battleLogs.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border-2 border-realm-gold bg-realm-surface2 p-6 shadow-2xl animate-pulse">
            <div className="absolute inset-0 bg-realm-gold/5 pointer-events-none" />
            <div className="relative flex flex-col items-center text-center">
              <h3 className="font-cinzel text-xl text-realm-gold flex items-center gap-2">
                <IconSwords className="text-realm-gold animate-bounce" />
                ULTIMATE ACTIVATED: {activeBattleMove}
              </h3>
              <div className="mt-3 space-y-1 font-lora italic text-realm-cream text-sm">
                {battleLogs.map((log, idx) => (
                  <p key={idx} className={idx === 0 ? "text-realm-crimson font-bold" : ""}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB BAR */}
        <div className="flex gap-1 rounded-2xl border border-realm-border bg-realm-surface2 p-1.5 w-fit backdrop-blur-sm">
          {[
            { id: "pets", label: "🦊 Companions" },
            { id: "shop", label: "🛒 Treasury Shop" },
            { id: "collection", label: "✨ Artifact Vault" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 font-space ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg shadow-lg"
                  : "text-realm-muted hover:text-realm-cream"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════ PETS TAB ══════════════════════════════ */}
        {activeTab === "pets" && (
          <div className="space-y-8">
            {/* Active pet profile */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Pet card */}
              <div className="relative overflow-hidden rounded-2xl border border-realm-border bg-realm-surface p-6 flex flex-col items-center text-center shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-realm-purple/5 via-transparent to-realm-gold/5 pointer-events-none" />
                <div className="absolute top-2 right-2 rounded-full border border-realm-border bg-realm-surface2/85 px-2.5 py-0.5 text-[9px] text-realm-muted font-space">
                  {activePet.theme} Element
                </div>
                <div className="relative mt-4 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-realm-purple/10 blur-xl scale-150" />
                    <span className="relative text-7xl w-24 h-24 flex items-center justify-center bg-realm-surface2 rounded-full ring-2 ring-realm-purple/35 animate-bounce">
                      {activePet.emoji}
                    </span>
                  </div>
                  <h2 className="font-cinzel text-2xl mt-4 text-realm-cream">{activePet.name}</h2>
                  <p className="text-xs text-realm-muted mt-1 uppercase tracking-widest font-space">{activePet.category} familiar</p>
                  <p className="text-xs text-realm-muted mt-3 px-4 italic leading-relaxed font-lora">{activePet.description}</p>
                </div>
                <div className="mt-6 flex gap-2 w-full font-space">
                  <button
                    onClick={handleFeed}
                    className="flex-1 text-xs py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 font-bold"
                  >
                    <IconCookie size={14} />
                    Feed
                  </button>
                  <button
                    onClick={handleSpeak}
                    className="flex-1 text-xs py-2 border border-realm-border bg-realm-surface2 text-realm-cream rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 font-bold"
                  >
                    <IconMessage size={14} />
                    Speak
                  </button>
                </div>
              </div>

              {/* Pet stats */}
              <div className="rounded-2xl border border-realm-border bg-realm-surface p-6 md:col-span-2 space-y-4 shadow-lg">
                <h3 className="font-cinzel text-lg text-realm-cream flex items-center gap-2 border-b border-realm-border pb-3">
                  📊 Companion Bond & Stats
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "❤️ Spirit Happiness", val: petStats.happiness, color: "from-realm-crimson to-red-400", tip: "Increases on missions completed" },
                    { label: "⚡ Battle Energy", val: petStats.energy, color: "from-realm-gold to-orange-400", tip: "Increases when resting between battles" },
                    { label: "🤝 Oath Bond Level", val: petStats.bond, color: "from-realm-purple to-realm-teal", tip: "Increases with daily consistency" },
                    { label: "🎯 Focus Attunement", val: petStats.focus, color: "from-realm-gold via-yellow-400 to-teal-400", tip: "Grows as focus battles are fought" },
                  ].map((stat) => (
                    <div key={stat.label} className="space-y-2 rounded-xl border border-realm-border bg-realm-surface2/60 p-3">
                      <div className="flex justify-between text-xs font-bold text-realm-cream font-space">
                        <span>{stat.label}</span>
                        <span>{stat.val}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-realm-border">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-700`}
                          style={{ width: `${stat.val}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-realm-muted font-lora italic">{stat.tip}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-realm-purple/20 bg-realm-purple/5 p-4 flex justify-between items-center font-space">
                  <div>
                    <p className="text-sm font-bold text-realm-purple">Battle Log</p>
                    <p className="text-[10px] text-realm-muted mt-0.5">
                      Focus: {focusHours}h · Tasks: {activeUsage.tasksDone} · LP: {activeUsage.xpEarned}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-realm-muted">Ultimate Strike</p>
                    <p className={`text-sm font-black ${activeUsage.focusMinutes >= 1200 ? "text-realm-gold animate-pulse" : "text-realm-muted/50"}`}>
                      {activeUsage.focusMinutes >= 1200 ? "⚡ READY" : "LOCKED"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills board (Familiar Arts) */}
            <div className="rounded-2xl border border-realm-border bg-realm-surface p-6 shadow-lg">
              <div className="flex items-center justify-between border-b border-realm-border pb-3 mb-5">
                <h3 className="font-cinzel text-lg text-realm-cream flex items-center gap-2">
                  ⚔️ Familiar Arts & Combat Skills
                </h3>
                <span className="text-xs text-realm-muted font-lora italic">Unlock tiers by fighting battles with this companion</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill, idx) => (
                  <div
                    key={skill.name}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                      skill.unlocked
                        ? "border-realm-purple/30 bg-gradient-to-br from-realm-purple/5 to-realm-surface2 shadow-md"
                        : "border-realm-border/50 bg-realm-surface2/20 opacity-50"
                    }`}
                  >
                    {skill.unlocked && (
                      <div className="absolute top-0 right-0 h-16 w-16 rounded-full bg-realm-purple/5 blur-xl pointer-events-none" />
                    )}
                    <div className="relative flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-black tracking-widest text-realm-purple font-space">
                        Tier {idx + 1}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold font-space ${
                        skill.unlocked ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-realm-border text-realm-muted"
                      }`}>
                        {skill.unlocked ? "UNLOCKED" : "LOCKED"}
                      </span>
                    </div>
                    <h4 className="font-bold text-realm-cream font-space">{skill.name}</h4>
                    <p className="text-xs text-realm-muted mt-1 leading-relaxed font-lora italic">{skill.desc}</p>
                    <div className="mt-3 flex justify-between items-center text-[10px] text-realm-muted font-space">
                      <span>Requirement</span>
                      <span className={skill.unlocked ? "text-realm-purple font-bold" : ""}>{skill.progress}</span>
                    </div>
                    {skill.isUltimate && skill.unlocked && (
                      <button
                        onClick={() => triggerBattleMove(activePet.ultimatePower)}
                        className="mt-3 w-full py-1.5 text-xs font-bold bg-gradient-to-r from-realm-gold to-orange-400 border border-realm-gold/20 text-realm-bg rounded-lg hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <IconSwords size={14} />
                        ⚡ UNLEASH ULTIMATE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pet Roster */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-realm-border pb-3">
                <h3 className="font-cinzel text-lg text-realm-cream flex items-center gap-2">
                  🦊 Roster & Companions
                </h3>
                {/* Filter pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Companions" },
                    { id: "pokemon", label: "Commoner / Squire" },
                    { id: "legendary", label: "Legendary" },
                    { id: "mythic", label: "Special Quest" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setPetFilter(filter.id as "all" | "pokemon" | "legendary" | "mythic")}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all font-space ${
                        petFilter === filter.id
                          ? "bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg shadow-md"
                          : "border border-realm-border bg-realm-surface text-realm-muted hover:text-realm-cream"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPets.map((species) => {
                  const isOwned = ownedPetIds.includes(species.id);
                  const isActive = activePet.id === species.id;
                  const canAfford = totalXp >= species.cost;

                  return (
                    <div
                      key={species.id}
                      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                        isActive
                          ? "border-realm-gold bg-gradient-to-br from-realm-gold-dim to-realm-surface shadow-md"
                          : isOwned
                          ? "border-realm-border bg-realm-surface hover:border-realm-gold/20 hover:scale-[1.02] cursor-pointer"
                          : "border-realm-border/40 bg-realm-surface2/20 opacity-60"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-realm-gold/5 blur-2xl pointer-events-none" />
                      )}

                      <div className="relative flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all ${
                              isActive ? "bg-realm-gold-dim shadow-lg scale-105 border border-realm-gold/20" : "bg-realm-surface2"
                            }`}
                          >
                            {species.emoji}
                          </div>
                          {isActive ? (
                            <span className="rounded-full border border-realm-gold/40 bg-realm-gold-dim px-2.5 py-0.5 text-[10px] font-bold text-realm-gold font-space">
                              ★ Active
                            </span>
                          ) : isOwned ? (
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-[10px] font-bold text-green-300 font-space">
                              Summoned
                            </span>
                          ) : species.unlockCondition ? (
                            <span className="rounded-full border border-realm-crimson/20 bg-realm-crimson/10 px-2.5 py-0.5 text-[10px] font-bold text-realm-crimson font-space flex items-center gap-0.5">
                              <IconLock size={10} /> Special
                            </span>
                          ) : (
                            <span className="rounded-full border border-realm-border bg-realm-surface2 px-2.5 py-0.5 text-[10px] font-bold text-realm-muted font-space flex items-center gap-0.5">
                              <IconLock size={10} /> Locked
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-realm-cream font-space">{species.name}</h3>
                          <p className="mt-1 text-xs text-realm-muted font-lora italic leading-relaxed min-h-[36px]">
                            {species.description}
                          </p>
                        </div>

                        {species.unlockCondition && !isOwned && (
                          <div className="text-[10px] text-realm-crimson bg-realm-crimson/5 border border-realm-crimson/10 rounded-lg p-2 font-mono">
                            Quest: {species.unlockCondition}
                          </div>
                        )}

                        <div className="pt-2 border-t border-realm-border font-space">
                          {isOwned ? (
                            <button
                              disabled={isActive}
                              onClick={() => equipPet(species.id)}
                              className={`text-xs px-3 py-2 w-full rounded-xl font-bold transition-all ${
                                isActive 
                                  ? "bg-realm-gold-dim border border-realm-gold/20 text-realm-gold cursor-default" 
                                  : "bg-realm-surface2 border border-realm-border text-realm-cream hover:bg-realm-border"
                              }`}
                            >
                              {isActive ? "✓ Guided by this Spirit" : "Summon Companion"}
                            </button>
                          ) : species.unlockCondition ? (
                            <button
                              disabled
                              className="text-xs px-3 py-2 w-full text-realm-muted bg-realm-surface2 border border-realm-border/50 rounded-xl cursor-not-allowed font-bold"
                            >
                              Fulfill quest to unlock
                            </button>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-sm font-bold text-realm-muted font-space">
                                🟡{" "}
                                <span className={canAfford ? "text-realm-gold font-black" : ""}>
                                  {species.cost.toLocaleString()}
                                </span>
                              </span>
                              <div className="relative group/unlock">
                                <button
                                  disabled={!canAfford}
                                  onClick={() => handleUnlockPet(species)}
                                  className="text-xs px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg font-bold shadow-md hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                                >
                                  Summon
                                </button>
                                {!canAfford && (
                                  <div className="absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-xl border border-realm-border bg-realm-surface2 px-3 py-1.5 text-xs text-realm-muted shadow-2xl group-hover/unlock:block font-space z-20">
                                    Requires {(species.cost - totalXp).toLocaleString()} more LP
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ SHOP TAB ══════════════════════════════ */}
        {activeTab === "shop" && (
          <div>
            {shopRewards.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-realm-gold/20 bg-gradient-to-br from-amber-950/20 via-realm-surface to-realm-surface2 py-20 text-center shadow-lg">
                <div className="flex flex-col items-center gap-4">
                  <IconTrophy size={64} className="text-realm-gold animate-bounce" />
                  <p className="font-cinzel text-xl text-realm-cream">All Treasures Secured!</p>
                  <p className="text-sm text-realm-muted font-lora italic">You have unlocked all artifacts available in the Treasury. Continue your watch, knight!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {shopRewards.map((reward) => {
                  const canAfford = totalXp >= reward.cost;
                  const isJustUnlocked = justUnlocked === reward.id;
                  return (
                    <div
                      key={reward.id}
                      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                        canAfford ? "border-realm-border bg-realm-surface hover:border-realm-gold/30 hover:scale-[1.02]" : "border-realm-border bg-realm-surface2 opacity-50"
                      } ${isJustUnlocked ? "border-realm-gold bg-realm-gold-dim shadow-xl" : ""}`}
                    >
                      {/* Locked overlay */}
                      {!canAfford && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-[1px]">
                          <div className="flex flex-col items-center gap-1 font-space">
                            <IconLock size={20} className="text-realm-muted" />
                            <span className="text-[10px] font-bold text-realm-muted">
                              Need {(reward.cost - totalXp).toLocaleString()} more LP
                            </span>
                          </div>
                        </div>
                      )}

                      {canAfford && (
                        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-realm-gold/5 blur-2xl transition-all group-hover:bg-realm-gold/10" />
                      )}
                      {isJustUnlocked && (
                        <div className="absolute inset-0 rounded-2xl bg-realm-gold/5 animate-pulse pointer-events-none" />
                      )}

                      <div className="relative flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all ${
                            isJustUnlocked ? "bg-realm-gold-dim scale-110 border border-realm-gold/20" : "bg-realm-surface2"
                          }`}>
                            {reward.icon}
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              CATEGORY_COLORS[reward.category] || "border-realm-border bg-realm-surface2 text-realm-muted"
                            }`}
                          >
                            {CATEGORY_LABELS[reward.category]}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-realm-cream font-space">{reward.name}</h3>
                          <p className="mt-1 text-xs text-realm-muted font-lora italic leading-relaxed">{reward.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-realm-border font-space">
                          <span className="flex items-center gap-1 text-sm font-bold text-realm-muted">
                            <span>🟡</span>
                            <span className={canAfford ? "text-realm-gold font-black" : ""}>
                              {reward.cost.toLocaleString()}
                            </span>
                          </span>
                          <button
                            disabled={!canAfford}
                            onClick={() => handlePurchase(reward.id)}
                            className="text-xs px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg font-bold shadow-md hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                          >
                            {isJustUnlocked ? "✓ Secured" : "Secure"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════ COLLECTION TAB ══════════════════════════════ */}
        {activeTab === "collection" && (
          <div>
            {unlockedRewards.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-realm-border bg-realm-surface py-20 text-center shadow-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-realm-border bg-realm-surface2 text-5xl">
                    <IconBookmark size={48} className="text-realm-muted/50" />
                  </div>
                  <p className="font-cinzel text-xl text-realm-cream">Your Vault is Empty</p>
                  <p className="text-sm text-realm-muted font-lora italic">
                    Amass Legend Points and claim relics from the Treasury shop!
                  </p>
                  <button 
                    onClick={() => setActiveTab("shop")} 
                    className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg font-bold shadow-md hover:scale-105 active:scale-95 transition-all font-space"
                  >
                    Browse Treasury Shop →
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unlockedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
                      reward.equipped
                        ? "border-realm-gold bg-gradient-to-br from-realm-gold-dim to-realm-surface shadow-md"
                        : "border-realm-border bg-realm-surface hover:border-realm-gold/20"
                    }`}
                  >
                    {reward.equipped && (
                      <div className="absolute inset-0 bg-gradient-to-br from-realm-gold-dim to-transparent pointer-events-none" />
                    )}

                    <div className="relative flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all ${
                            reward.equipped
                              ? "bg-realm-gold-dim shadow-lg scale-105 border border-realm-gold/20"
                              : "bg-realm-surface2"
                          }`}
                        >
                          {reward.icon}
                          {reward.equipped && (
                            <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-realm-gold/25 bg-realm-gold text-[10px]">
                              👑
                            </div>
                          )}
                        </div>
                        {reward.equipped && (
                          <span className="rounded-full border border-realm-gold/40 bg-realm-gold-dim px-2.5 py-0.5 text-[10px] font-black text-realm-gold font-space">
                            Equipped
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-realm-cream font-space">{reward.name}</h3>
                        <p className="mt-1 text-xs text-realm-muted font-lora italic leading-relaxed">{reward.description}</p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          CATEGORY_COLORS[reward.category] || "border-realm-border bg-realm-surface2 text-realm-muted"
                        }`}
                      >
                        {CATEGORY_LABELS[reward.category]}
                      </span>

                      <button
                        onClick={() => equipReward(reward.id)}
                        className={`text-xs px-3 py-2 w-full rounded-xl font-bold transition-all font-space ${
                          reward.equipped 
                            ? "bg-realm-surface2 border border-realm-border text-realm-muted hover:text-realm-cream" 
                            : "bg-gradient-to-r from-realm-gold to-orange-400 text-realm-bg shadow-md"
                        }`}
                      >
                        {reward.equipped ? "Unequip Relic" : "Equip Relic"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
