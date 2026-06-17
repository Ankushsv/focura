---
milestone: focura-rebuild
version: 1.0.0
updated: 2026-06-16T12:45:00Z
---

# Roadmap

> **Current Phase:** 6 - Performance & Production Audit
> **Status:** 🔄 In Progress

## Must-Haves (from SPEC)

- [x] Extended `tailwind.config.ts` with `realm` colors and custom typography fonts.
- [x] Google Fonts (`Cinzel Decorative`, `Lora`, `Quicksand`) loaded in `RootLayout`.
- [x] Cinematic 6-section landing page with CSS floating fog.
- [x] Home Screen ("The War Room") with Greeting, Squire's Trial quickstart, main quest banner, and SVG Battle Fury ring.
- [x] Tasks page ("The Scroll") fully rebranded with themed buttons, recommendations, HP bar, and "The Retreat" overlay.
- [x] Focus Timer ("The Battle") upgraded with themed screens and Cinematic Entrance.
- [x] Mastery Paths ("The Great Quests") rebranded with rank badges and flag peaks.
- [x] Consistency page ("The Knight's Oath") with "Oath Shield", gold GitHub heatmap, and knight chess piece climber.
- [x] Pet page ("The Familiar") and speech bubble widget rebranded.
- [x] Stats page ("The Chronicle"), Rewards page ("The Treasury"), Music page ("The Bard's Hall"), AI Coach ("The Sage"), and Focus Memory rebranded.
- [x] Knight-framed micro-copy, toast messages, modals, loading states, error states, and empty states.

---

## Phases

### Phase 1: Foundations & Design System
**Status:** ✅ Complete
**Objective:** Establish the Tailwind tokens, Google Font integration, global CSS overrides, and baseline theme classes.
**Requirements:** SPEC-28, SPEC-29

**Plans:**
- [x] Plan 1.1: Extend Tailwind configuration with `realm` colors and font families.
- [x] Plan 1.2: Import and load Google Fonts (`Cinzel Decorative`, `Lora`) in `src/app/layout.tsx`.
- [x] Plan 1.3: Update `src/app/globals.css` with the medieval color palette and CSS drifting fog styles.

---

### Phase 2: Landing Page & App Layout
**Status:** ✅ Complete
**Objective:** Deliver the cinematic game-intro landing page and the app shell layout/navigation with themed elements.
**Depends on:** Phase 1

**Plans:**
- [x] Plan 2.1: Rebuild Landing Page (`src/app/page.tsx`) with 6 narrative sections and CSS fog.
- [x] Plan 2.2: Update App Layout (`src/app/app/layout.tsx`) with rebranded tabs, user title badges, date format, and the floating Familiar widget.

---

### Phase 3: The War Room & The Scroll
**Status:** ✅ Complete
**Objective:** Rebuild the main dashboard (The War Room) and the tasks manager (The Scroll) with full medieval copy, RPG mechanics, and The Retreat overlay.
**Depends on:** Phase 2

**Plans:**
- [x] Plan 3.1: Redesign Dashboard (`src/app/app/page.tsx`) to implement The War Room layout, Squire's Trial checklist, and Battle Fury ring.
- [x] Plan 3.2: Rebuild Tasks Page (`src/app/app/tasks/page.tsx`) as The Scroll, integrating the Sage's recommendations, Boss Battle HP, and the full-screen "The Retreat" overlay.

---

### Phase 4: Focus Timer & Core Quest/Oath Modules
**Status:** ✅ Complete
**Objective:** Upgrade the Focus Timer (The Battle) and the core progress modules (Mastery Paths and Consistency Contracts).
**Depends on:** Phase 3

**Plans:**
- [x] Plan 4.1: Rebuild Focus Timer (`src/app/app/timer/page.tsx`) as The Battle with 4 rebranded stages, active messages, and hyperfocus guard.
- [x] Plan 4.2: Rebuild Mastery Paths (`src/app/app/paths/page.tsx`) as The Great Quests with rank badges, flag peaks, and path nodes.
- [x] Plan 4.3: Rebuild Consistency (`src/app/app/contracts/page.tsx`) as The Knight's Oath with Oath Scrolls, Oath Shield, and gold heatmap.

---

### Phase 5: Stats, Rewards, AI Coach, Music & Polish
**Status:** ✅ Complete
**Objective:** Update the statistics, shop, AI coach, music studio, and finalize system copy and animations.
**Depends on:** Phase 4

**Plans:**
- [x] Plan 5.1: Rebuild Rewards Page (`src/app/app/rewards/page.tsx`) as The Treasury/Familiar collection page.
- [x] Plan 5.2: Rebuild Stats Page (`src/app/app/stats/page.tsx`) as The Chronicle.
- [x] Plan 5.3: Rebuild Music Page (`src/app/app/music/page.tsx`) as The Bard's Hall.
- [x] Plan 5.4: Rebuild AI Coach (`src/app/app/coach/page.tsx`) as The Sage.
- [x] Plan 5.5: Rebuild Memory Page (`src/app/app/memory/page.tsx`) as Focus Memory/Tome.
- [x] Plan 5.6: Implement knight-framed micro-copy/toasts and verify full application build.

---

### Phase 6: Performance & Production Audit
**Status:** 🔄 In Progress
**Objective:** Address Landing page scroll rendering and animation bottlenecks, optimize performance, and verify end-to-end database features.
**Depends on:** Phase 5

**Plans:**
- [ ] Plan 6.1: Implement scroll performance optimizations for GSAP ScrollTrigger timeline and Three.js rendering quality/visibility toggles.

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1     | ✅     | 3/3   | 2026-06-16 |
| 2     | ✅     | 2/2   | 2026-06-16 |
| 3     | ✅     | 2/2   | 2026-06-17 |
| 4     | ✅     | 3/3   | 2026-06-17 |
| 5     | ✅     | 6/6   | 2026-06-17 |
| 6     | 🔄     | 0/1   | —        |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1     | 2026-06-16 | 2026-06-16 | <1h     |
| 2     | 2026-06-16 | 2026-06-16 | <1h     |
| 3     | 2026-06-16 | 2026-06-17 | <1d     |
| 4     | 2026-06-17 | 2026-06-17 | <1d     |
| 5     | 2026-06-17 | 2026-06-17 | <1d     |
| 6     | 2026-06-17 | —         | —        |
