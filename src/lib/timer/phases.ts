export type Phase = {
  name: string;
  min: number;
  liquid: [string, string];
  glow: string;
  petMsg: string;
  ambientFreq: number;
  soundLabel: string;
  petClass: string;
};

export const PHASES: Phase[] = [
  {
    name: "Entering the Fog",
    min: 0,
    liquid: ["#f0a868", "#f87171"],
    glow: "#f0a868",
    petMsg: "The Fog is thick today. Keep moving.",
    ambientFreq: 110,
    soundLabel: "Entering the Fog",
    petClass: "",
  },
  {
    name: "Through the Fog",
    min: 30,
    liquid: ["#5eead4", "#a78bfa"],
    glow: "#5eead4",
    petMsg: "You're cutting through it. I can feel it.",
    ambientFreq: 146,
    soundLabel: "Through the Fog",
    petClass: "pet-bounce-loop",
  },
  {
    name: "The Final Push",
    min: 70,
    liquid: ["#a78bfa", "#f0a868"],
    glow: "#a78bfa",
    petMsg: "Almost through. Don't stop now, knight.",
    ambientFreq: 174,
    soundLabel: "The Final Push",
    petClass: "pet-bounce-loop",
  },
  {
    name: "Legendary Focus ⚡",
    min: 90,
    liquid: ["#f0a868", "#a78bfa"],
    glow: "#f0a868",
    petMsg: "LEGENDARY! This is what you were born for!",
    ambientFreq: 220,
    soundLabel: "Legendary Focus",
    petClass: "pet-dance",
  },
];

export function phaseFor(progress: number): Phase {
  return [...PHASES].reverse().find((p) => progress >= p.min) ?? PHASES[0];
}
