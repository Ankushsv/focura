/**
 * petFrames.ts — Pixel art frame data for all pet stages and animations.
 * Extended to support:
 * 0: Egg
 * 1: Chick (animal base)
 * 2: Bird (animal flying)
 * 3: Owl (animal wise)
 * 4: Lizard (Charmander/Charizard/Dragonite/Rayquaza)
 * 5: Rodent (Pikachu/Jolteon/Zapdos)
 * 6: Turtle (Squirtle/Vaporeon)
 * 7: Fox/Quadruped (Eevee/Flareon/Umbreon/Espeon)
 * 8: Mystic/Floating (Mewtwo/Mew/Deoxys/Arceus/Gastly)
 */

export type Frame = string[]; // array of equal-length strings (14x14)
export type AnimationType = "idle" | "walk" | "read" | "stretch" | "dance" | "sleep";
export type PetStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const PALETTE: Record<string, string> = {
  " ": "",          // transparent
  Y: "#fbbf24",     // golden yellow (chick/rodent body)
  y: "#d97706",     // dark amber (shading)
  O: "#f97316",     // orange (beak, feet, flame)
  o: "#c2410c",     // dark orange
  W: "#fef9c3",     // cream white (eye white)
  B: "#312e81",     // deep indigo (pupil)
  P: "#fda4af",     // pink (blush cheeks)
  N: "#92400e",     // brown (book cover)
  n: "#fef08a",     // pale yellow (book pages)
  E: "#f8fafc",     // eggshell white
  e: "#94a3b8",     // egg shadow
  c: "#60a5fa",     // crack line
  T: "#7c3aed",     // purple (bird body)
  t: "#4c1d95",     // dark purple
  G: "#86efac",     // green
  q: "#fbbf24",     // gold
  A: "#a78bfa",     // lavender (owl body)
  a: "#7c3aed",     // deep purple
  Z: "#e2e8f0",     // zzz text
  R: "#f43f5e",     // red
  S: "#0ea5e9",     // sky blue
  s: "#0369a1",     // dark blue
};

// ============================================================
// STAGE 0 — EGG
// ============================================================
const eggIdle1: Frame = [
  "              ",
  "    EEEEEE    ",
  "   EEEEEEEE   ",
  "  EEEEEEEEEE  ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEE  ",
  "   EEEEEEEE   ",
  "    EEEEEE    ",
  "              ",
  "              ",
  "              ",
];
const eggIdle2: Frame = [
  "              ",
  "    EEEEEE    ",
  "   EEEEEEEE   ",
  "  EEEEEEEEEE  ",
  "  EEEEcEEEEE  ",
  "  EEEccEEEEE  ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEEE ",
  "  EEEEEEEEEE  ",
  "   EEEEEEEE   ",
  "    EEEEEE    ",
  "              ",
  "              ",
  "              ",
];

// ============================================================
// STAGE 1 — CHICK
// ============================================================
const chickIdle1: Frame = [
  "              ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  "  YWWYYYWYWY  ",
  "  YWBYYYWYBY  ",
  "  YWWYYYWYWY  ",
  "  YYYOOOYYY   ",
  "  YYYYYYYYYY  ",
  "   YYYYYYYY   ",
  "    YY  YY    ",
  "    YY  YY    ",
  "   OYYYYYY O  ",
  "   OO    OO   ",
  "              ",
];
const chickWalk1: Frame = [
  "              ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  "  YWWYYYWYWY  ",
  "  YWBYYYWYBY  ",
  "  YWWYYYWYWY  ",
  "  YYYOOOYYY   ",
  "  YYYYYYYYYY  ",
  "   YYYYYY     ",
  "    YY  YY    ",
  "   OYY        ",
  "   Oo    YY   ",
  "         OO   ",
  "              ",
];
const chickWalk2: Frame = [
  "              ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  "  YWWYYYWYWY  ",
  "  YWBYYYWYBY  ",
  "  YWWYYYWYWY  ",
  "  YYYOOOYYY   ",
  "  YYYYYYYYYY  ",
  "    YYYYYY    ",
  "    YY  YY    ",
  "         YYO  ",
  "   YY    oO   ",
  "   OO         ",
  "              ",
];
const chickRead: Frame = [
  "              ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  "  YWWYYYWYWY  ",
  "  YWBYYYWYBY  ",
  "  YWWYYYWYWY  ",
  "  YYYOOOYYY   ",
  "  YYYYYYYYYyNN",
  "   YYYYYYYYNnn",
  "    YY  YYyNnn",
  "    YY  YYNNN ",
  "   OYYYYYY O  ",
  "   OO    OO   ",
  "              ",
];
const chickSleep: Frame = [
  "              ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  "  Y--YYY--YY  ",
  "  YWWYYYWYWY  ",
  "  YYYOOOYYY   ",
  "  YYYYYYYYYY  ",
  "   YYYYYYYY   ",
  "   YY    YY   ",
  "   OYYYYYY O  ",
  "   OO    OO   ",
  "          Z   ",
  "        Z     ",
  "              ",
];

// ============================================================
// STAGE 2 — BIRD (Sky-blue Bird)
// ============================================================
const birdIdle: Frame = [
  "              ",
  "   SSSSSSSS   ",
  "  SSSSSSSSSS  ",
  "  SWWSSSSWWS  ",
  "  SWBSSSSWBS  ",
  "  SWWSSSSWWS  ",
  "  SSSOOOSSSS  ",
  "  SSSSSSSSSSS ",
  "  sSSSSSSSss  ",
  " sSSSSSSSSSss ",
  "  SS      SS  ",
  "  sS      Ss  ",
  "  ss      ss  ",
  "              ",
];
const birdWalk1: Frame = [
  "              ",
  "   SSSSSSSS   ",
  "  SSSSSSSSSS  ",
  "  SWWSSSSWWS  ",
  "  SWBSSSSWBS  ",
  "  SWWSSSSWWS  ",
  "  SSSOOOSSSS  ",
  "  SSSSSSSSSSS ",
  "  sSSSSSSSss  ",
  "  SS      SS  ",
  "  sS           ",
  "  ss  SS      ",
  "      ss      ",
  "              ",
];
const birdRead: Frame = [
  "              ",
  "   SSSSSSSS   ",
  "  SSSSSSSSSS  ",
  "  SWWSSSSWWS  ",
  "  SWBSSSSWBS  ",
  "  SWWSSSSWWS  ",
  "  SSSOOOSSSS  ",
  "  SSSSSSSSSSyNN",
  "  sSSSSSSSNnn  ",
  " sSSSSSSSSNnn  ",
  "  SS      NNNN ",
  "  sS      Ss  ",
  "  ss      ss  ",
  "              ",
];
const birdSleep: Frame = [
  "              ",
  "   SSSSSSSS   ",
  "  SSSSSSSSSS  ",
  "  S--SSSS--S  ",
  "  SWWSSSSWWS  ",
  "  SSSOOOSSSS  ",
  "  SSSSSSSSSS  ",
  "  sSSSSSSSss  ",
  " sSSSSSSSSSss ",
  "  SS      SS  ",
  "  ss      ss  ",
  "          Z   ",
  "        Z     ",
  "              ",
];

// ============================================================
// STAGE 3 — OWL (Wise purple owl)
// ============================================================
const owlIdle: Frame = [
  "              ",
  "   AAAAAAAA   ",
  "  aAAAAAAAAa  ",
  "  AWWAAAAWWA  ",
  "  AGBAAAAGBA  ",
  "  AWWAAA AWWA ",
  "  AAAqqqAAAA  ",
  "  aAAAAAAAAa  ",
  "  AAAAAAAAAA  ",
  " aAAAAAAAAAAAA",
  "  AA      AA  ",
  "  aA      Aa  ",
  "  aa      aa  ",
  "              ",
];
const owlWalk1: Frame = [
  "              ",
  "   AAAAAAAA   ",
  "  aAAAAAAAAa  ",
  "  AWWAAAAWWA  ",
  "  AGBAAAAGBA  ",
  "  AWWAAAAWWA  ",
  "  AAAqqqAAAA  ",
  "  aAAAAAAAAa  ",
  "  AAAAAAAAAA  ",
  " aAAAAAAAAAAAA",
  "  AA           ",
  "  aA    AA    ",
  "  aa    aa    ",
  "              ",
];
const owlRead: Frame = [
  "              ",
  "   AAAAAAAA   ",
  "  aAAAAAAAAa  ",
  "  AWWAAAAWWA  ",
  "  AGBAAAAGBA  ",
  "  AWWAAAAWWA  ",
  "  AAAqqqAAAA  ",
  "  aAAAAAAAAaNNN",
  "  AAAAAAAANnnn ",
  " aAAAAAAANnnn  ",
  "  AA      NNNN ",
  "  aA      Aa  ",
  "  aa      aa  ",
  "              ",
];

// ============================================================
// STAGE 4 — LIZARD (Charmander/Charizard lizard-like)
// ============================================================
const lizardIdle: Frame = [
  "              ",
  "    YYYYYY    ",
  "   YYYYYYYY   ",
  "   YWWYYYWY   ",
  "   YWBYYYWB   ",
  "   YYYOOOYY   ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYY  ",
  "YYYYYYYYYY    ",
  "  YY    YY    ",
  "  YY    YY    ",
  " OYY    YYO   ",
  "  OO    OO    ",
];
const lizardWalk1: Frame = [
  "              ",
  "    YYYYYY    ",
  "   YYYYYYYY   ",
  "   YWWYYYWY   ",
  "   YWBYYYWB   ",
  "   YYYOOOYY   ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYY  ",
  "YYYYYYYYYY    ",
  "  YY          ",
  "  YY    YY    ",
  " OYY    OO    ",
  "  OO          ",
];
const lizardRead: Frame = [
  "              ",
  "    YYYYYY    ",
  "   YYYYYYYY   ",
  "   YWWYYYWY   ",
  "   YWBYYYWB   ",
  "   YYYOOOYY   ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYyNN",
  " YYYYYYYYYNNnn",
  "YYYYYYYYYY NNn",
  "  YY    YY    ",
  "  YY    YY    ",
  " OYY    YYO   ",
  "  OO    OO    ",
];
const lizardSleep: Frame = [
  "              ",
  "              ",
  "    YYYYYY    ",
  "   YYYYYYYY   ",
  "   Y--YYY--   ",
  "   YYYOOOYY   ",
  "   YYYYYYYY   ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYY  ",
  "YYYYYYYYYY  Z ",
  "  YY    YY Z  ",
  "  YY    YY    ",
  " OYY    YYO   ",
  "  OO    OO    ",
];

// ============================================================
// STAGE 5 — RODENT (Pikachu rodent-like, long upright ears)
// ============================================================
const rodentIdle: Frame = [
  "  YY      YY  ", // long ears
  "  YY      YY  ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYYY ",
  " YWWYYYYWWYYY ",
  " YWBYYYYWBYYY ",
  " YWWYYYYWWYYY ",
  " YYPPOOOPPYYY ", // cheeks
  " YYYYYYYYYYYY ",
  "  YYYYYYYYYY  ",
  "   YY    YY   ",
  "   YY    YY   ",
  "  OYY    YYO  ",
  "  OO      OO  ",
];
const rodentWalk1: Frame = [
  "  YY      YY  ",
  "  YY      YY  ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYYY ",
  " YWWYYYYWWYYY ",
  " YWBYYYYWBYYY ",
  " YWWYYYYWWYYY ",
  " YYPPOOOPPYYY ",
  " YYYYYYYYYYYY ",
  "  YYYYYYYYYY  ",
  "   YY         ",
  "   YY    YY   ",
  "  OYY    oO   ",
  "  OO          ",
];
const rodentRead: Frame = [
  "  YY      YY  ",
  "  YY      YY  ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYYY ",
  " YWWYYYYWWYYY ",
  " YWBYYYYWBYYY ",
  " YWWYYYYWWYYY ",
  " YYPPOOOPPYYY ",
  " YYYYYYYYYYNN ", // holding book
  "  YYYYYYYYNNnn",
  "   YY    YNNnn",
  "   YY    YY   ",
  "  OYY    YYO  ",
  "  OO      OO  ",
];
const rodentSleep: Frame = [
  "  YY      YY  ",
  "  YY      YY  ",
  "  YYYYYYYYYY  ",
  " YYYYYYYYYYYY ",
  " Y--YYYY--YYY ", // closed eyes
  " YWWYYYYWWYYY ",
  " YYPPOOOPPYYY ",
  " YYYYYYYYYYYY ",
  "  YYYYYYYYYY  ",
  "   YY    YY   ",
  "  OYY    YYO Z",
  "  OO      OOZ ",
  "            Z ",
  "              ",
];

// ============================================================
// STAGE 6 — TURTLE (Squirtle shell shape)
// ============================================================
const turtleIdle: Frame = [
  "              ",
  "    SSSSSS    ",
  "   SSSSSSSS   ",
  "  SSWWSSWWSS  ",
  "  SSBSSSBSSS  ",
  "  SSSSSSSSSS  ",
  "   SSSSSSSS   ",
  "  ssssssssss  ", // shell backing
  " ssssssssssss ",
  " ssssssssssss ",
  "  SS      SS  ",
  "  SS      SS  ",
  "  ss      ss  ",
  "              ",
];
const turtleWalk1: Frame = [
  "              ",
  "    SSSSSS    ",
  "   SSSSSSSS   ",
  "  SSWWSSWWSS  ",
  "  SSBSSSBSSS  ",
  "  SSSSSSSSSS  ",
  "   SSSSSSSS   ",
  "  ssssssssss  ",
  " ssssssssssss ",
  "  SS      SS  ",
  "  SS          ",
  "  ss    SS    ",
  "        ss    ",
  "              ",
];
const turtleRead: Frame = [
  "              ",
  "    SSSSSS    ",
  "   SSSSSSSS   ",
  "  SSWWSSWWSS  ",
  "  SSBSSSBSSS  ",
  "  SSSSSSSSSS  ",
  "   SSSSSSSSNN ",
  "  ssssssssNNnn",
  " ssssssssNNnn ",
  " sssssssssNN  ",
  "  SS      SS  ",
  "  SS      SS  ",
  "  ss      ss  ",
  "              ",
];
const turtleSleep: Frame = [
  "              ",
  "    SSSSSS    ",
  "   SSSSSSSS   ",
  "  SS--SS--SS  ", // tucked
  "  SSSSSSSSSS  ",
  "   SSSSSSSS   ",
  "  ssssssssss  ",
  " ssssssssssss ",
  " ssssssssssss ",
  "  SS      SS  ",
  "  SS      SS Z",
  "  ss      ssZ ",
  "            Z ",
  "              ",
];

// ============================================================
// STAGE 7 — FOX (Eevee/Umbreon quadruped shape, four distinct legs)
// ============================================================
const foxIdle: Frame = [
  "  AA      AA  ", // floppy fox ears
  "  AA      AA  ",
  "  AAAAAAAAAA  ",
  " AWWAAAAWWAAAA",
  " AWBAAAAWBAAAA",
  " AWWAAAAWWAAAA",
  " AAPPAAAAPPAAA", // cheeks
  "  AAAAAAAAAA  ",
  "  AAAAAAAAAA  ",
  " aAAAAAAAAAAa ", // body backing
  " aAaA    aAaA ", // 4 leg waddle
  " aa        aa ",
  " aa        aa ",
  "              ",
];
const foxWalk1: Frame = [
  "  AA      AA  ",
  "  AA      AA  ",
  "  AAAAAAAAAA  ",
  " AWWAAAAWWAAAA",
  " AWBAAAAWBAAAA",
  " AWWAAAAWWAAAA",
  " AAPPAAAAPPAAA",
  "  AAAAAAAAAA  ",
  "  AAAAAAAAAA  ",
  " aAAAAAAAAAAa ",
  " aA        aA ",
  " aa    aa  aa ",
  "       aa     ",
  "              ",
];
const foxRead: Frame = [
  "  AA      AA  ",
  "  AA      AA  ",
  "  AAAAAAAAAA  ",
  " AWWAAAAWWAAAA",
  " AWBAAAAWBAAAA",
  " AWWAAAAWWAAAA",
  " AAPPAAAAPPAAA",
  "  AAAAAAAAANNN", // book cover
  "  AAAAAAAAaNnn",
  " aAAAAAAAAaNnn",
  " aAaA    aAaAN ",
  " aa        aa ",
  " aa        aa ",
  "              ",
];
const foxSleep: Frame = [
  "              ",
  "  AA      AA  ",
  "  AA      AA  ",
  "  AAAAAAAAAA  ",
  " A--AAAA--AAAA",
  " AWWAAAAWWAAAA",
  " AAPPAAAAPPAAA",
  "  AAAAAAAAAA  ",
  "  AAAAAAAAAA  ",
  " aAAAAAAAAAAa ",
  " aAaA    aAaAZ",
  " aa        aaZ",
  "            Z ",
  "              ",
];

// ============================================================
// STAGE 8 — MYSTIC (Mewtwo hovering, long floating tail)
// ============================================================
const mysticIdle: Frame = [
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "   AWWAAWWA   ",
  "   AGBAAGBA   ",
  "   AAAAAAAA   ",
  "    AAAAAA    ",
  "     AAAA     ",
  "    AAAAAA    ", // floating body
  "   AAAAAAAA   ",
  "  AAAAAAAAAA  ",
  "  Aa      aA  ",
  "   a      a   ",
  "   aaaaaaa    ", // curled floating tail
  "   aaaaa      ",
];
const mysticWalk1: Frame = [
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "   AWWAAWWA   ",
  "   AGBAAGBA   ",
  "   AAAAAAAA   ",
  "    AAAAAA    ",
  "     AAAA     ",
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "  AAAAAAAAAA  ",
  "  Aa      aA  ",
  "   a      a   ",
  "     aaaaaaa  ", // tail shifts left/right
  "       aaaaa  ",
];
const mysticRead: Frame = [
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "   AWWAAWWA   ",
  "   AGBAAGBA   ",
  "   AAAAAAAA   ",
  "    AAAAAA NN ", // floating book
  "     AAAA  Nnn",
  "    AAAAAANnnn",
  "   AAAAAAANNN ",
  "  AAAAAAAAAA  ",
  "  Aa      aA  ",
  "   a      a   ",
  "   aaaaaaa    ",
  "   aaaaa      ",
];
const mysticSleep: Frame = [
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "   AW-AAW-A   ", // closed eyes
  "   AAAAAAAA   ",
  "    AAAAAA    ",
  "     AAAA     ",
  "    AAAAAA    ",
  "   AAAAAAAA   ",
  "  AAAAAAAAAA  ",
  "  Aa      aA  ",
  "   a      a   ",
  "   aaaaaaa  Z ",
  "   aaaaa   Z  ",
  "          Z   ",
];


// ============================================================
// ANIMATION SETS — map stage × animation → frames + interval
// ============================================================

type StageAnimations = Record<AnimationType, { frames: Frame[]; intervalMs: number }>;

export const PET_ANIMATIONS: Record<PetStage, StageAnimations> = {
  0: {
    idle:    { frames: [eggIdle1, eggIdle1, eggIdle2, eggIdle1], intervalMs: 900 },
    walk:    { frames: [eggIdle1, eggIdle2], intervalMs: 600 },
    read:    { frames: [eggIdle2], intervalMs: 800 },
    stretch: { frames: [eggIdle1, eggIdle2], intervalMs: 700 },
    dance:   { frames: [eggIdle1, eggIdle2], intervalMs: 300 },
    sleep:   { frames: [eggIdle1], intervalMs: 1200 },
  },
  1: {
    idle:    { frames: [chickIdle1, chickIdle1, chickWalk1, chickIdle1], intervalMs: 800 },
    walk:    { frames: [chickWalk1, chickWalk2], intervalMs: 200 },
    read:    { frames: [chickRead], intervalMs: 900 },
    stretch: { frames: [chickIdle1, chickWalk1], intervalMs: 500 },
    dance:   { frames: [chickWalk1, chickWalk2, chickIdle1], intervalMs: 180 },
    sleep:   { frames: [chickSleep], intervalMs: 1100 },
  },
  2: {
    idle:    { frames: [birdIdle], intervalMs: 800 },
    walk:    { frames: [birdWalk1, birdIdle], intervalMs: 200 },
    read:    { frames: [birdRead], intervalMs: 900 },
    stretch: { frames: [birdIdle, birdWalk1], intervalMs: 500 },
    dance:   { frames: [birdWalk1, birdIdle], intervalMs: 180 },
    sleep:   { frames: [birdSleep], intervalMs: 1100 },
  },
  3: {
    idle:    { frames: [owlIdle], intervalMs: 900 },
    walk:    { frames: [owlWalk1, owlIdle], intervalMs: 220 },
    read:    { frames: [owlRead], intervalMs: 1000 },
    stretch: { frames: [owlIdle, owlWalk1], intervalMs: 500 },
    dance:   { frames: [owlWalk1, owlIdle], intervalMs: 190 },
    sleep:   { frames: [owlIdle], intervalMs: 1200 },
  },
  4: {
    idle:    { frames: [lizardIdle, lizardIdle, lizardWalk1, lizardIdle], intervalMs: 800 },
    walk:    { frames: [lizardWalk1, lizardIdle], intervalMs: 220 },
    read:    { frames: [lizardRead], intervalMs: 950 },
    stretch: { frames: [lizardIdle, lizardWalk1], intervalMs: 600 },
    dance:   { frames: [lizardWalk1, lizardIdle, lizardWalk1], intervalMs: 200 },
    sleep:   { frames: [lizardSleep], intervalMs: 1200 },
  },
  5: {
    idle:    { frames: [rodentIdle, rodentIdle, rodentWalk1, rodentIdle], intervalMs: 850 },
    walk:    { frames: [rodentWalk1, rodentIdle], intervalMs: 200 },
    read:    { frames: [rodentRead], intervalMs: 900 },
    stretch: { frames: [rodentIdle, rodentWalk1], intervalMs: 500 },
    dance:   { frames: [rodentWalk1, rodentIdle, rodentWalk1], intervalMs: 180 },
    sleep:   { frames: [rodentSleep], intervalMs: 1250 },
  },
  6: {
    idle:    { frames: [turtleIdle, turtleIdle, turtleWalk1, turtleIdle], intervalMs: 900 },
    walk:    { frames: [turtleWalk1, turtleIdle], intervalMs: 230 },
    read:    { frames: [turtleRead], intervalMs: 1000 },
    stretch: { frames: [turtleIdle, turtleWalk1], intervalMs: 600 },
    dance:   { frames: [turtleWalk1, turtleIdle, turtleWalk1], intervalMs: 190 },
    sleep:   { frames: [turtleSleep], intervalMs: 1300 },
  },
  7: {
    idle:    { frames: [foxIdle, foxIdle, foxWalk1, foxIdle], intervalMs: 800 },
    walk:    { frames: [foxWalk1, foxIdle], intervalMs: 210 },
    read:    { frames: [foxRead], intervalMs: 950 },
    stretch: { frames: [foxIdle, foxWalk1], intervalMs: 500 },
    dance:   { frames: [foxWalk1, foxIdle, foxWalk1], intervalMs: 180 },
    sleep:   { frames: [foxSleep], intervalMs: 1200 },
  },
  8: {
    idle:    { frames: [mysticIdle, mysticIdle, mysticWalk1, mysticIdle], intervalMs: 950 },
    walk:    { frames: [mysticWalk1, mysticIdle], intervalMs: 240 },
    read:    { frames: [mysticRead], intervalMs: 1000 },
    stretch: { frames: [mysticIdle, mysticWalk1], intervalMs: 600 },
    dance:   { frames: [mysticWalk1, mysticIdle, mysticWalk1], intervalMs: 190 },
    sleep:   { frames: [mysticSleep], intervalMs: 1400 },
  },
};

/** Which pet stage should show at a given XP level for normal animals */
export function stageForLevel(level: number): PetStage {
  if (level >= 15) return 3;
  if (level >= 8) return 2;
  if (level >= 3) return 1;
  return 0;
}
