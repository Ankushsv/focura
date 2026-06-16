# SPEC.md — The Realm of Focura Rebuild

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No code may be written until this spec is marked `FINALIZED`.

## Vision
Rebuild Focura — an ADHD productivity platform — with a complete knight/medieval journey narrative theme applied across every single page, component, and line of copy. This is not a visual skin but a complete narrative reframe of the entire product. Users are redefined as the "Stormborn" fighting against "The Fog" (distraction, procrastination, overwhelm) in "The Realm of Focura", progressing from "Commoner" to "King/Queen".

## Goals
1. **Narrative Immersion** — Refocus the entire application copy, headings, notifications, empty states, and layout on the knight's journey.
2. **Complete Rebrand** — Replace all generic productivity terms (Dashboard, Tasks, Focus Timer, etc.) with thematic names (War Room, Scroll, Battle, etc.).
3. **Medieval-Soul Design System** — Implement a warm, minimal, premium medieval dark UI (near-black, elevated wood/stone charcoal surfaces, gold and purple glows, Cinzel Decorative for headings, Lora for quotes/lore, Quicksand for UI labels).
4. **Tabler Iconography Integration** — Eliminate emoji from standard UI controls and replace with Tabler Icons themed to the knight aesthetic (swords, shields, scrolls, hearth, etc.).
5. **Preserved ADHD UX** — Keep all existing ADHD-specific features (I'm Stuck/Retreat, Energy matching, Task Chains, Web Audio soundscapes, Pet combat feeds, AI Breakdown, Rescue Mode) fully functional.

## Non-Goals (Out of Scope)
- Deleting existing functional code or database schema (display layer change only).
- Creating highly illustrated, cartoonish, or pixel-art game assets.
- Removing any core features of the Focus Timer, Quests Board, or AI Coach.

## Constraints
- **Tailwind Extension**: Must extend `tailwind.config.js` with the new theme colors and fonts instead of hardcoding.
- **Font Imports**: Google Fonts `Cinzel+Decorative`, `Lora`, and `Quicksand` must be imported and integrated.
- **Framer Motion Animations**: Page transitions, Familiar float animations, and battle phase transitions must be implemented using Framer Motion.

## Success Criteria
- [ ] Tailwind config extended with `realm` colors and custom typography fonts.
- [ ] Google Fonts imported and loaded in `RootLayout`.
- [ ] Landing page completely redesigned into a cinematic 6-section storytelling page with CSS floating fog.
- [ ] Home Screen ("The War Room") implemented with Greeting, Squire's Trial quickstart, main quest banner, SVG Battle Fury ring, and sidebar widgets.
- [ ] Tasks page ("The Scroll") fully rebranded with themed buttons, recommendations, HP bar, and full-screen "The Retreat" overlay.
- [ ] Focus Timer ("The Battle") upgraded with themed screens (Pre-session, Cinematic Entrance, Active Session, Completion).
- [ ] Mastery Paths ("The Great Quests") rebranded with "Path of Mastery", rank badges, flag peak visualizations, and timeline nodes.
- [ ] Consistency page ("The Knight's Oath") rewritten with "Oath Shield" indicators, gold GitHub heatmap, and knight chess climber.
- [ ] Pet page ("The Familiar") and speech bubble widget rebranded with spirit companions and Bond/Arts stats.
- [ ] Stats page ("The Chronicle"), Rewards page ("The Treasury"), Music page ("The Bard's Hall"), and AI Coach ("The Sage") rebranded.
- [ ] All toast messages, modals, loading states, error states, and empty states knight-framed.

---

*Last updated: 2026-06-16*
