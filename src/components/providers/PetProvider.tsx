"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { bus } from "@/lib/events";
import { playPetSound, type SoundProfile } from "@/lib/pet/sounds";

export interface PetSpecies {
  id: string;
  name: string;
  emoji: string;
  category: "pokemon" | "animal" | "cosmic";
  theme: string;
  cost: number;
  description: string;
  ultimatePower: string;
  ultimateDesc: string;
  soundProfile: SoundProfile;
  evolutionFrom?: string;
  evolutionHours?: number; // Track A
  evolutionXp?: number; // Track B
  unlockCondition?: string;
}

export interface PetUsage {
  focusMinutes: number;
  tasksDone: number;
  xpEarned: number;
}

export interface PetStats {
  happiness: number;
  energy: number;
  bond: number;
  focus: number;
}

export const ALL_PET_SPECIES: PetSpecies[] = [
  {
    id: "cat",
    name: "Cat",
    emoji: "🐈",
    category: "animal",
    theme: "Normal",
    cost: 0,
    description: "A realistic cat companion that walks on your navbar and plays with you.",
    ultimatePower: "Cat Nap",
    ultimateDesc: "Passive: Increases rest break efficiency by 15%.",
    soundProfile: "cat-meow",
  },
  // Animals (Track B: XP Milestones)
  {
    id: "egg",
    name: "Mysterious Egg",
    emoji: "🥚",
    category: "animal",
    theme: "Normal",
    cost: 0,
    description: "Your very first companion. Take care of it to hatch it!",
    ultimatePower: "Warm Shell",
    ultimateDesc: "Passive: Increases task completion XP by 10%.",
    soundProfile: "animal-chick",
  },
  {
    id: "hatchling",
    name: "Hatchling",
    emoji: "🐣",
    category: "animal",
    theme: "Normal",
    cost: 0,
    description: "It just cracked open! Eager to see the world.",
    ultimatePower: "First Chirp",
    ultimateDesc: "Chirp: Grants +10 XP every morning you open the app.",
    soundProfile: "animal-chick",
    evolutionFrom: "egg",
    evolutionXp: 500,
  },
  {
    id: "chick",
    name: "Happy Chick",
    emoji: "🐥",
    category: "animal",
    theme: "Normal",
    cost: 0,
    description: "Bouncing and chirping, full of positive energy.",
    ultimatePower: "Peck away",
    ultimateDesc: "Passive: Low-energy tasks grant double XP.",
    soundProfile: "animal-chick",
    evolutionFrom: "hatchling",
    evolutionXp: 1200,
  },
  {
    id: "bird",
    name: "Swift Bird",
    emoji: "🐦",
    category: "animal",
    theme: "Normal",
    cost: 0,
    description: "Majestic wings ready to fly high above consistency mountains.",
    ultimatePower: "Tailwind",
    ultimateDesc: "Active: Focus session timer runs 1.25x faster for 30 min.",
    soundProfile: "animal-chick",
    evolutionFrom: "chick",
    evolutionXp: 2500,
  },

  // Starters / Base Pokémon
  {
    id: "charmander",
    name: "Charmander",
    emoji: "🔥",
    category: "pokemon",
    theme: "Fire",
    cost: 2500,
    description: "A friendly lizard Pokémon with a flame on its tail.",
    ultimatePower: "Ember Spark",
    ultimateDesc: "Passive: Fire tasks generate double motivation bank.",
    soundProfile: "fire",
  },
  {
    id: "charmeleon",
    name: "Charmeleon",
    emoji: "🦖",
    category: "pokemon",
    theme: "Fire",
    cost: 0,
    description: "Tough-minded and likes hot challenges.",
    ultimatePower: "Rage Flame",
    ultimateDesc: "Active: Instant critical boost to all quests today.",
    soundProfile: "fire",
    evolutionFrom: "charmander",
    evolutionHours: 12,
  },
  {
    id: "charizard",
    name: "Charizard",
    emoji: "🐉",
    category: "pokemon",
    theme: "Fire",
    cost: 0,
    description: "Flying dragon that breathes hot, focus-fueled flames.",
    ultimatePower: "Flamethrower",
    ultimateDesc: "Active: Orange burn effect; tasks completed grant +150 XP.",
    soundProfile: "fire",
    evolutionFrom: "charmeleon",
    evolutionHours: 30,
  },
  {
    id: "pikachu",
    name: "Pikachu",
    emoji: "⚡",
    category: "pokemon",
    theme: "Electric",
    cost: 2000,
    description: "Electric mouse that sparks with excitement.",
    ultimatePower: "Static Glow",
    ultimateDesc: "Passive: 10% chance to duplicate task completion XP.",
    soundProfile: "electric",
  },
  {
    id: "squirtle",
    name: "Squirtle",
    emoji: "🐢",
    category: "pokemon",
    theme: "Water",
    cost: 2000,
    description: "Cute turtle that loves washing away stress.",
    ultimatePower: "Bubble Shield",
    ultimateDesc: "Shield: Prevents one commitment shield break per week.",
    soundProfile: "water",
  },
  {
    id: "bulbasaur",
    name: "Bulbasaur",
    emoji: "🌱",
    category: "pokemon",
    theme: "Grass",
    cost: 2000,
    description: "A plant dinosaur with a seed growing on its back.",
    ultimatePower: "Growth Spurt",
    ultimateDesc: "Passive: Mastery path nodes give +50% XP.",
    soundProfile: "animal-chick",
  },
  {
    id: "gastly",
    name: "Gastly",
    emoji: "👻",
    category: "pokemon",
    theme: "Ghost",
    cost: 2200,
    description: "A gaseous ghost that makes night sessions exciting.",
    ultimatePower: "Spooky Hour",
    ultimateDesc: "Passive: Night sessions (after 10 PM) award +50% XP.",
    soundProfile: "ghost",
  },

  // Eevee Branching (Track C)
  {
    id: "eevee",
    name: "Eevee",
    emoji: "🦊",
    category: "pokemon",
    theme: "Normal",
    cost: 2500,
    description: "A fluffy companion that adapts and evolves based on your mood.",
    ultimatePower: "Adaptability",
    ultimateDesc: "Passive: Bumps lowest pet stat by +20.",
    soundProfile: "animal-chick",
  },
  {
    id: "espeon",
    name: "Espeon",
    emoji: "🌸",
    category: "pokemon",
    theme: "Psychic",
    cost: 0,
    description: "Study mood evolution of Eevee. Deep intellectual energy.",
    ultimatePower: "Psychic Study",
    ultimateDesc: "Ultimate: Multiplies study task XP by 3x for 1 hour.",
    soundProfile: "cosmic",
    evolutionFrom: "eevee",
    evolutionHours: 15,
  },
  {
    id: "vaporeon",
    name: "Vaporeon",
    emoji: "🌊",
    category: "pokemon",
    theme: "Water",
    cost: 0,
    description: "Relax mood evolution of Eevee. Calm, serene water companion.",
    ultimatePower: "Healing Rain",
    ultimateDesc: "Ultimate: Instantly restores companion stats to 100%.",
    soundProfile: "water",
    evolutionFrom: "eevee",
    evolutionHours: 15,
  },
  {
    id: "jolteon",
    name: "Jolteon",
    emoji: "⚡",
    category: "pokemon",
    theme: "Electric",
    cost: 0,
    description: "Coding mood evolution of Eevee. High voltage speed flow.",
    ultimatePower: "Thunder Speed",
    ultimateDesc: "Ultimate: Tasks take half focus time for the next session.",
    soundProfile: "electric",
    evolutionFrom: "eevee",
    evolutionHours: 15,
  },
  {
    id: "flareon",
    name: "Flareon",
    emoji: "🔥",
    category: "pokemon",
    theme: "Fire",
    cost: 0,
    description: "Hype mood evolution of Eevee. Burning motivation.",
    ultimatePower: "Hype Fire",
    ultimateDesc: "Ultimate: Doubles XP for all tasks completed in next 2 hours.",
    soundProfile: "fire",
    evolutionFrom: "eevee",
    evolutionHours: 15,
  },
  {
    id: "umbreon",
    name: "Umbreon",
    emoji: "🌑",
    category: "pokemon",
    theme: "Dark",
    cost: 0,
    description: "Night focus evolution of Eevee. Glowing moon companion.",
    ultimatePower: "Midnight Shadow",
    ultimateDesc: "Ultimate: Boosts night-time productivity XP by 4x.",
    soundProfile: "ghost",
    evolutionFrom: "eevee",
    evolutionHours: 15,
  },

  // 15 Legendaries
  {
    id: "articuno",
    name: "Articuno",
    emoji: "❄️",
    category: "pokemon",
    theme: "Ice",
    cost: 30000,
    description: "Legendary freeze bird that clears all distractions.",
    ultimatePower: "Blizzard",
    ultimateDesc: "Ultimate: Freeze all distractions. No notifications, clean UI for 2h.",
    soundProfile: "water",
  },
  {
    id: "zapdos",
    name: "Zapdos",
    emoji: "⚡",
    category: "pokemon",
    theme: "Electric",
    cost: 30000,
    description: "Legendary storm bird. Energizes focus minutes.",
    ultimatePower: "Thunder Storm",
    ultimateDesc: "Ultimate: Every single minute of focus awards +3 XP for 1 hour.",
    soundProfile: "electric",
  },
  {
    id: "moltres",
    name: "Moltres",
    emoji: "🔥",
    category: "pokemon",
    theme: "Fire",
    cost: 30000,
    description: "Legendary phoenix. Rekindles focus motivation.",
    ultimatePower: "Sky Attack",
    ultimateDesc: "Ultimate: Your habit shields cannot break for the next 48 hours.",
    soundProfile: "fire",
  },
  {
    id: "dragonite",
    name: "Dragonite",
    emoji: "🐉",
    category: "pokemon",
    theme: "Dragon",
    cost: 28000,
    description: "Kindhearted dragon of immense power.",
    ultimatePower: "Hyper Beam",
    ultimateDesc: "Ultimate: All passive skills from all owned pets activate for 30 min.",
    soundProfile: "animal-dragon",
  },
  {
    id: "mewtwo",
    name: "Mewtwo",
    emoji: "🧬",
    category: "pokemon",
    theme: "Psychic",
    cost: 25000,
    description: "Created by science, possessing absolute focus and prestige.",
    ultimatePower: "Psystrike",
    ultimateDesc: "Ultimate: XP earned is multiplied by 4x for 1 hour.",
    soundProfile: "cosmic",
  },
  {
    id: "mew",
    name: "Mew",
    emoji: "🌟",
    category: "pokemon",
    theme: "Normal",
    cost: 15000,
    description: "Contains DNA of all Pokémon. Mystical, rare, and playful.",
    ultimatePower: "Transform",
    ultimateDesc: "Ultimate: Randomly copies any owned pet's ultimate power.",
    soundProfile: "cosmic",
  },
  {
    id: "suicune",
    name: "Suicune",
    emoji: "🌊",
    category: "pokemon",
    theme: "Water",
    cost: 35000,
    description: "Symbol of peace and clean streams. Restores calm.",
    ultimatePower: "Aurora Beam",
    ultimateDesc: "Ultimate: Unlocks 24h Calm Mode (no streak pressure, hides XP count).",
    soundProfile: "water",
  },
  {
    id: "raikou",
    name: "Raikou",
    emoji: "⚡",
    category: "pokemon",
    theme: "Electric",
    cost: 35000,
    description: "Embodies speed of lightning. Boosts energy tracking.",
    ultimatePower: "Discharge",
    ultimateDesc: "Ultimate: Energy tracking bonus. Active focus sessions give +30% XP for 2h.",
    soundProfile: "electric",
  },
  {
    id: "entei",
    name: "Entei",
    emoji: "🔥",
    category: "pokemon",
    theme: "Fire",
    cost: 35000,
    description: "Born of volcanic eruption. Boosts task completion dopamine.",
    ultimatePower: "Sacred Fire",
    ultimateDesc: "Ultimate: Task completions award 3x focus dopamine for 1 hour.",
    soundProfile: "fire",
  },
  {
    id: "lugia",
    name: "Lugia",
    emoji: "🌀",
    category: "pokemon",
    theme: "Psychic",
    cost: 40000,
    description: "Guardian of the seas. Speeds up time vessels.",
    ultimatePower: "Aeroblast",
    ultimateDesc: "Ultimate: Focus session timer fills 2x faster for 45 minutes.",
    soundProfile: "cosmic",
  },
  {
    id: "ho-oh",
    name: "Ho-Oh",
    emoji: "❤️",
    category: "pokemon",
    theme: "Fire",
    cost: 40000,
    description: "Rainbow wings. Brings rebirth to broken habits.",
    ultimatePower: "Sacred Rebirth",
    ultimateDesc: "Ultimate: Instantly restore a broken habit streak (once per month).",
    soundProfile: "fire",
  },
  {
    id: "celebi",
    name: "Celebi",
    emoji: "🌿",
    category: "pokemon",
    theme: "Psychic",
    cost: 38000,
    description: "Forest voice that wanders through time.",
    ultimatePower: "Leaf Storm",
    ultimateDesc: "Ultimate: Unlocks the full 30-day Focus DNA deep report.",
    soundProfile: "cosmic",
  },
  {
    id: "jirachi",
    name: "Jirachi",
    emoji: "🔮",
    category: "pokemon",
    theme: "Steel",
    cost: 42000,
    description: "Grants wishes inscribed on tags on its head.",
    ultimatePower: "Doom Desire",
    ultimateDesc: "Ultimate: Wish for tomorrow. All tomorrow's tasks auto-planned by AI Coach.",
    soundProfile: "cosmic",
  },
  {
    id: "darkrai",
    name: "Darkrai",
    emoji: "🌑",
    category: "pokemon",
    theme: "Dark",
    cost: 45000,
    description: "Inhabits nightmares, but rewards midnight productivity.",
    ultimatePower: "Dark Void",
    ultimateDesc: "Ultimate: Night XP x5 for 2 hours (only active after 10 PM).",
    soundProfile: "ghost",
  },
  {
    id: "rayquaza",
    name: "Rayquaza",
    emoji: "🌌",
    category: "pokemon",
    theme: "Dragon",
    cost: 50000,
    description: "Lord of the high skies. The ultimate productivity dragon.",
    ultimatePower: "Dragon Ascent",
    ultimateDesc: "Ultimate: Prestige Mode! All owned skills activate for 1h + Golden UI.",
    soundProfile: "animal-dragon",
  },

  // 10 Mythics (Special Conditions)
  {
    id: "shaymin",
    name: "Shaymin",
    emoji: "🌸",
    category: "pokemon",
    theme: "Nature",
    cost: 0,
    description: "Gratitude hedgehog. Unlocks after a 100-day streak.",
    ultimatePower: "Seed Flare",
    ultimateDesc: "Ultimate: Every completed task plants a seed worth +50 XP at day end.",
    soundProfile: "animal-chick",
    unlockCondition: "100-day streak",
  },
  {
    id: "deoxys",
    name: "Deoxys",
    emoji: "🌀",
    category: "pokemon",
    theme: "Psychic",
    cost: 0,
    description: "DNA mutated in space. Unlocks after a 60-day streak.",
    ultimatePower: "Psycho Boost",
    ultimateDesc: "Ultimate: IQ Mode. AI Coach yields 3 highly personalized insights.",
    soundProfile: "cosmic",
    unlockCondition: "60-day streak",
  },
  {
    id: "arceus",
    name: "Arceus",
    emoji: "👑",
    category: "pokemon",
    theme: "Creator",
    cost: 0,
    description: "The Alpha creator. Unlocked when all 25 standard Pokémon are owned.",
    ultimatePower: "Judgement",
    ultimateDesc: "Ultimate: Set your own XP multiplier (1x - 10x) for any 30-min session.",
    soundProfile: "cosmic",
    unlockCondition: "Own all 25 Pokémon",
  },
  {
    id: "kyurem",
    name: "Kyurem",
    emoji: "❄️",
    category: "pokemon",
    theme: "Ice-Void",
    cost: 0,
    description: "Frozen dragon representing lack. Unlocked at 500 focus hours.",
    ultimatePower: "Glaciate",
    ultimateDesc: "Ultimate: Freeze current XP score. It cannot go down below this checkpoint.",
    soundProfile: "water",
    unlockCondition: "500 Focus Hours",
  },
  {
    id: "zekrom",
    name: "Zekrom",
    emoji: "⚔️",
    category: "pokemon",
    theme: "Dragon",
    cost: 0,
    description: "Dragon of deep truth. Unlocked at 300 focus hours.",
    ultimatePower: "Bolt Strike",
    ultimateDesc: "Ultimate: All challenge XP is doubled permanently while active.",
    soundProfile: "electric",
    unlockCondition: "300 Focus Hours",
  },
  {
    id: "reshiram",
    name: "Reshiram",
    emoji: "🌟",
    category: "pokemon",
    theme: "Dragon",
    cost: 0,
    description: "Dragon of pure ideals. Unlocked at 300 focus hours.",
    ultimatePower: "Blue Flare",
    ultimateDesc: "Ultimate: Unlocks exclusive Focus DNA Legendary report tier.",
    soundProfile: "fire",
    unlockCondition: "300 Focus Hours",
  },
  {
    id: "victini",
    name: "Victini",
    emoji: "🦋",
    category: "pokemon",
    theme: "Normal",
    cost: 0,
    description: "Brings victory. Unlocked by completing 50 challenges.",
    ultimatePower: "V-create",
    ultimateDesc: "Ultimate: Random XP multiplier (between 2x and 10x) on next session.",
    soundProfile: "cosmic",
    unlockCondition: "Win 50 Challenges",
  },
  {
    id: "keldeo",
    name: "Keldeo",
    emoji: "🌊",
    category: "pokemon",
    theme: "Water",
    cost: 0,
    description: "Colt Pokémon of absolute bravery. Unlocked at 30-day challenge streak.",
    ultimatePower: "Secret Sword",
    ultimateDesc: "Ultimate: Rescue mode gives triple XP for tasks completed.",
    soundProfile: "water",
    unlockCondition: "30-day Challenge Streak",
  },
  {
    id: "diancie",
    name: "Diancie",
    emoji: "💎",
    category: "pokemon",
    theme: "Cosmic",
    cost: 0,
    description: "Shines in beauty. Unlocked by acquiring all badges.",
    ultimatePower: "Diamond Storm",
    ultimateDesc: "Ultimate: Badge wall glows gold. Bumps badge rewards by +25% XP forever.",
    soundProfile: "cosmic",
    unlockCondition: "Unlock all badges",
  },
  {
    id: "eternatus",
    name: "Eternatus",
    emoji: "🌌",
    category: "pokemon",
    theme: "Cosmic",
    cost: 0,
    description: "Infinite energy core. Unlocked at 1,000 focus hours.",
    ultimatePower: "Eternabeam",
    ultimateDesc: "Ultimate: XP x10 for exactly 10 minutes. Screen shifts dark purple.",
    soundProfile: "ghost",
    unlockCondition: "1,000 Focus Hours",
  },
];

interface PetContextType {
  activePet: PetSpecies;
  ownedPetIds: string[];
  petStats: PetStats;
  petUsage: Record<string, PetUsage>;
  totalFocusHours: number;
  soundEnabled: boolean;
  activeBattleMove: string | null;
  eeveeChoicePending: boolean;
  evolutionCelebration: { petName: string; oldName: string } | null;
  unlockPet: (petId: string, cost: number) => boolean;
  equipPet: (petId: string) => void;
  feedPet: () => void;
  incrementFocusMinutes: (mins: number) => void;
  addXpForActivePet: (amount: number) => void;
  addTaskForActivePet: () => void;
  triggerBattleMove: (moveName: string) => void;
  clearBattleMove: () => void;
  resolveEeveeBranch: (evolutionId: string) => void;
  clearEvolutionCelebration: () => void;
  toggleSound: () => void;
  setEeveeChoicePending: (pending: boolean) => void;
  setTotalFocusHours: (val: number) => void;
}

const PetContext = createContext<PetContextType | null>(null);

const STORE_KEY = "focura.pet_system.v2";

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [activePetId, setActivePetId] = useState<string>("egg");
  const [ownedPetIds, setOwnedPetIds] = useState<string[]>(["egg", "cat"]);
  const [petStats, setPetStats] = useState<PetStats>({
    happiness: 100,
    energy: 100,
    bond: 50,
    focus: 0,
  });
  const [petUsage, setPetUsage] = useState<Record<string, PetUsage>>({});
  const [totalFocusHours, setTotalFocusHours] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeBattleMove, setActiveBattleMove] = useState<string | null>(null);
  const [eeveeChoicePending, setEeveeChoicePending] = useState<boolean>(false);
  const [evolutionCelebration, setEvolutionCelebration] = useState<{ petName: string; oldName: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load state from local storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.activePetId) setActivePetId(parsed.activePetId);
        if (parsed.ownedPetIds) setOwnedPetIds(parsed.ownedPetIds);
        if (parsed.petStats) setPetStats(parsed.petStats);
        if (parsed.petUsage) setPetUsage(parsed.petUsage);
        if (parsed.totalFocusHours) setTotalFocusHours(parsed.totalFocusHours);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
      }
    } catch (e) {
      console.error("Failed to load pet stats", e);
    }
    setLoaded(true);
  }, []);

  // Save state to local storage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          activePetId,
          ownedPetIds,
          petStats,
          petUsage,
          totalFocusHours,
          soundEnabled,
        })
      );
    }
  }, [activePetId, ownedPetIds, petStats, petUsage, totalFocusHours, soundEnabled, loaded]);

  const activePet = ALL_PET_SPECIES.find((p) => p.id === activePetId) || ALL_PET_SPECIES[0];

  // Helper to trigger sounds
  const playSound = useCallback(
    (profile: SoundProfile) => {
      if (soundEnabled) {
        playPetSound(profile);
      }
    },
    [soundEnabled]
  );

  // Stats decrease slowly over time or on inactivity events
  useEffect(() => {
    const interval = setInterval(() => {
      setPetStats((prev) => ({
        ...prev,
        happiness: Math.max(0, prev.happiness - 1),
        energy: Math.max(0, prev.energy - 1),
      }));
    }, 120000); // every 2 min
    return () => clearInterval(interval);
  }, []);

  // Listen to global events for stats bumps / moves
  useEffect(() => {
    const handleXp = ({ amount }: { amount: number }) => {
      setPetStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 5),
        bond: Math.min(100, prev.bond + 1),
      }));
      addXpForActivePet(amount);
    };

    const handleTaskComplete = () => {
      playSound("chirp");
      setPetStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 10),
        bond: Math.min(100, prev.bond + 2),
      }));
      addTaskForActivePet();
    };

    const handleFocusComplete = () => {
      playSound("jingle");
      setPetStats((prev) => ({
        ...prev,
        energy: Math.max(0, prev.energy - 15),
        happiness: Math.min(100, prev.happiness + 15),
        bond: Math.min(100, prev.bond + 5),
      }));
    };

    const handleBreakComplete = () => {
      setPetStats((prev) => ({
        ...prev,
        energy: Math.min(100, prev.energy + 35),
      }));
    };

    const handleStreakBreak = () => {
      setPetStats((prev) => ({
        ...prev,
        happiness: Math.max(0, prev.happiness - 20),
        bond: Math.max(0, prev.bond - 10),
      }));
    };

    const offXp = bus.on("xp:awarded", handleXp);
    const offTask = bus.on("task:completed", handleTaskComplete);
    const offFocus = bus.on("timer:session-complete", handleFocusComplete);
    const offBreak = bus.on("timer:break-complete", handleBreakComplete);
    const offStreak = bus.on("streak:broken", handleStreakBreak);

    return () => {
      offXp();
      offTask();
      offFocus();
      offBreak();
      offStreak();
    };
  }, [playSound, activePetId]);

  const unlockPet = useCallback(
    (petId: string, cost: number): boolean => {
      if (ownedPetIds.includes(petId)) return true;
      setOwnedPetIds((prev) => [...prev, petId]);
      playSound("cosmic");
      return true;
    },
    [ownedPetIds, playSound]
  );

  const equipPet = useCallback(
    (petId: string) => {
      if (ownedPetIds.includes(petId)) {
        setActivePetId(petId);
        const species = ALL_PET_SPECIES.find((p) => p.id === petId);
        if (species) {
          playSound(species.soundProfile);
        }
      }
    },
    [ownedPetIds, playSound]
  );

  const feedPet = useCallback(() => {
    setPetStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 25),
      energy: Math.min(100, prev.energy + 20),
      bond: Math.min(100, prev.bond + 3),
    }));
    playSound("chirp");
  }, [playSound]);

  const triggerEvolution = useCallback(
    (nextSpeciesId: string) => {
      const oldSpecies = activePet;
      const nextSpecies = ALL_PET_SPECIES.find((p) => p.id === nextSpeciesId);
      if (!nextSpecies) return;

      setOwnedPetIds((prev) => [...prev, nextSpeciesId]);
      setActivePetId(nextSpeciesId);
      setEvolutionCelebration({
        petName: nextSpecies.name,
        oldName: oldSpecies.name,
      });
      playSound("dramatic");
    },
    [activePet, playSound]
  );

  // Check animal evolution paths (Track B) when active pet earns XP
  const checkAnimalEvolution = useCallback(
    (newXpEarned: number) => {
      const nextSpecies = ALL_PET_SPECIES.find(
        (p) => p.evolutionFrom === activePetId && p.evolutionXp && newXpEarned >= p.evolutionXp
      );
      if (nextSpecies) {
        triggerEvolution(nextSpecies.id);
      }
    },
    [activePetId, triggerEvolution]
  );

  // Check pokemon evolution paths (Track A / C) when active pet earns focus minutes
  const checkPokemonEvolution = useCallback(
    (newFocusMins: number) => {
      const focusHrs = newFocusMins / 60;
      
      // Eevee special branching check
      if (activePetId === "eevee" && focusHrs >= 15) {
        setEeveeChoicePending(true);
        return;
      }

      const nextSpecies = ALL_PET_SPECIES.find(
        (p) => p.evolutionFrom === activePetId && p.evolutionHours && focusHrs >= p.evolutionHours
      );
      if (nextSpecies) {
        triggerEvolution(nextSpecies.id);
      }
    },
    [activePetId, triggerEvolution]
  );

  const incrementFocusMinutes = useCallback(
    (mins: number) => {
      setTotalFocusHours((prev) => prev + mins / 60);
      setPetUsage((prev) => {
        const usage = prev[activePetId] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
        const updatedMinutes = usage.focusMinutes + mins;
        
        // Asynchronous check for evolution on tick
        setTimeout(() => {
          checkPokemonEvolution(updatedMinutes);
        }, 10);

        return {
          ...prev,
          [activePetId]: {
            ...usage,
            focusMinutes: updatedMinutes,
          },
        };
      });
      setPetStats((prev) => ({
        ...prev,
        focus: Math.min(100, prev.focus + Math.round(mins * 2)),
      }));
    },
    [activePetId, checkPokemonEvolution]
  );

  const addXpForActivePet = useCallback(
    (amount: number) => {
      setPetUsage((prev) => {
        const usage = prev[activePetId] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
        const updatedXp = usage.xpEarned + amount;
        
        setTimeout(() => {
          checkAnimalEvolution(updatedXp);
        }, 10);

        return {
          ...prev,
          [activePetId]: {
            ...usage,
            xpEarned: updatedXp,
          },
        };
      });
    },
    [activePetId, checkAnimalEvolution]
  );

  const addTaskForActivePet = useCallback(() => {
    setPetUsage((prev) => {
      const usage = prev[activePetId] || { focusMinutes: 0, tasksDone: 0, xpEarned: 0 };
      return {
        ...prev,
        [activePetId]: {
          ...usage,
          tasksDone: usage.tasksDone + 1,
        },
      };
    });
  }, [activePetId]);

  const triggerBattleMove = useCallback((moveName: string) => {
    setActiveBattleMove(moveName);
    playSound("dramatic");
  }, [playSound]);

  const clearBattleMove = useCallback(() => {
    setActiveBattleMove(null);
  }, []);

  const resolveEeveeBranch = useCallback(
    (evolutionId: string) => {
      setEeveeChoicePending(false);
      triggerEvolution(evolutionId);
    },
    [triggerEvolution]
  );

  const clearEvolutionCelebration = useCallback(() => {
    setEvolutionCelebration(null);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return (
    <PetContext.Provider
      value={{
        activePet,
        ownedPetIds,
        petStats,
        petUsage,
        totalFocusHours,
        soundEnabled,
        activeBattleMove,
        eeveeChoicePending,
        evolutionCelebration,
        unlockPet,
        equipPet,
        feedPet,
        incrementFocusMinutes,
        addXpForActivePet,
        addTaskForActivePet,
        triggerBattleMove,
        clearBattleMove,
        resolveEeveeBranch,
        clearEvolutionCelebration,
        toggleSound,
        setEeveeChoicePending,
        setTotalFocusHours,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePet must be used within a PetProvider");
  return context;
}
