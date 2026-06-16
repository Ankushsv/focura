import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        primary: { DEFAULT: "#8b5cf6", dim: "#6d28d9" },
        accent: "#22d3ee",
        xp: "#fbbf24",
        priority: {
          critical: "#f43f5e",
          high: "#f97316",
          medium: "#38bdf8",
        },
        // Warm Minimal Design Tokens
        warm: {
          bg: "var(--color-warm-bg)",
          surface: "var(--color-warm-surface)",
          surface2: "var(--color-warm-surface2)",
          border: "var(--color-warm-border)",
          purple: "var(--color-warm-purple)",
          teal: "var(--color-warm-teal)",
          amber: "var(--color-warm-amber)",
          cream: "var(--color-warm-cream)",
          text: "var(--color-warm-text)",
          textMuted: "var(--color-warm-text-muted)",
          textHint: "var(--color-warm-text-hint)",
        },
        // Knight/Medieval Journey Theme Tokens
        realm: {
          bg: '#0e0c0a',
          surface: '#1a1714',
          surface2: '#141210',
          border: 'rgba(255,245,235,0.07)',
          text: '#f5efe8',
          muted: 'rgba(245,239,232,0.45)',
          hint: 'rgba(245,239,232,0.18)',
          gold: '#f0a868',
          'gold-dim': 'rgba(240,168,104,0.15)',
          teal: '#5eead4',
          purple: '#a78bfa',
          crimson: '#f87171',
          cream: '#f5e6d3',
        },
      },
      fontFamily: {
        sans: ["var(--font-space)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        space: ["var(--font-space)", "system-ui", "sans-serif"],
        quicksand: ["var(--font-quicksand)", "system-ui", "sans-serif"],
        caveat: ["var(--font-caveat)", "cursive"],
        mono: ["var(--font-mono)", "monospace"],
        cinzel: ["var(--font-cinzel)", "Cinzel Decorative", "serif"],
        quick: ["var(--font-quicksand)", "Quicksand", "sans-serif"],
        lora: ["var(--font-lora)", "Lora", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
