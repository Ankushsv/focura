// Focura Unified Design System & Animation Tokens

// 1. Spacing System (8-point grid based)
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem",  // 8px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  xxl: "3rem",   // 48px
  layout: "4rem" // 64px
};

// 2. Border Radius Tokens
export const radii = {
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px"
};

// 3. Durations & Easing Curves
export const duration = {
  fast: 0.25,
  normal: 0.4,
  reveal: 0.8,
  slow: 1.2
};

export const ease = {
  // Apple/Linear Expo Out Curve
  expo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  // Smooth Micro-Hover Curve
  quart: [0.22, 1, 0.36, 1] as [number, number, number, number],
  // Soft exit/entry transitions
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number]
};

// 4. Color Variables (Thematic Realm Palette)
export const colors = {
  bg: "#0c0c0e",       // Deep charcoal backdrop
  surface: "#161412",  // Elevated stone slate
  surfaceElevated: "#1e1b18",
  border: "rgba(245, 239, 232, 0.05)",
  borderHover: "rgba(245, 239, 232, 0.12)",
  text: "#f5efe8",      // Aged parchment text
  textMuted: "rgba(245, 239, 232, 0.5)",
  textHint: "rgba(245, 239, 232, 0.25)",
  
  // Accents
  amber: "#f0a868",    // Gold
  teal: "#5eead4",     // Sage Teal
  purple: "#a78bfa",   // Magic Purple
  crimson: "#f87171",  // Danger/Boss health Crimson
};

// 5. Global Motion Architecture Presets (Framer Motion variants)
export const motionPresets = {
  reveal: {
    hidden: { 
      opacity: 0, 
      y: 24, 
      filter: "blur(12px)" 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: duration.reveal, ease: ease.expo }
    },
    exit: {
      opacity: 0,
      y: -16,
      filter: "blur(6px)",
      transition: { duration: duration.normal, ease: ease.smooth }
    }
  },
  
  fade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: duration.reveal, ease: ease.expo } 
    },
    exit: { 
      opacity: 0, 
      transition: { duration: duration.normal, ease: ease.smooth } 
    }
  },
  
  staggerContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  },

  scaleUp: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: duration.reveal, ease: ease.expo } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.96, 
      transition: { duration: duration.normal, ease: ease.smooth } 
    }
  }
};
