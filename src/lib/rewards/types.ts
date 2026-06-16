export type RewardCategory = "pet" | "title" | "theme" | "cosmetic";

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  icon: string;
  cost: number; // XP cost
  unlocked: boolean;
  equipped: boolean;
}

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  pet: "Pet Skin",
  title: "Title",
  theme: "Theme",
  cosmetic: "Cosmetic",
};

export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "r1",
    name: "Night Owl",
    description: "A mysterious purple aura for your pet",
    category: "pet",
    icon: "🦉",
    cost: 100,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r2",
    name: "Quest Master",
    description: "Show off your quest-crushing title",
    category: "title",
    icon: "🏆",
    cost: 150,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r3",
    name: "Emerald Theme",
    description: "Swap the purple accent for emerald green",
    category: "theme",
    icon: "💚",
    cost: 200,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r4",
    name: "Rainbow Trail",
    description: "XP orbs leave a rainbow trail",
    category: "cosmetic",
    icon: "🌈",
    cost: 120,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r5",
    name: "The Relentless",
    description: "A title for those who never quit",
    category: "title",
    icon: "⚡",
    cost: 250,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r6",
    name: "Golden Pet",
    description: "Your pixel pet shines in gold",
    category: "pet",
    icon: "✨",
    cost: 300,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r7",
    name: "Sunset Theme",
    description: "Warm orange and rose tones for the app",
    category: "theme",
    icon: "🌅",
    cost: 200,
    unlocked: false,
    equipped: false,
  },
  {
    id: "r8",
    name: "Focus Halo",
    description: "A glowing ring around your avatar in the sidebar",
    category: "cosmetic",
    icon: "👑",
    cost: 180,
    unlocked: false,
    equipped: false,
  },
];
