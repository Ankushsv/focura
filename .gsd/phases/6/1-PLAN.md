---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Landing Page Performance & Production Verification

## Objective
Implement scroll performance optimizations for GSAP ScrollTrigger timeline and Three.js rendering quality/visibility toggles. Verify that the production build compiles cleanly without errors.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- src/app/page.tsx

## Tasks

<task type="auto">
  <name>Optimize Three.js & GSAP Scroll Performance in page.tsx</name>
  <files>src/app/page.tsx</files>
  <action>
    - Respect `prefers-reduced-motion` settings inside the canvas component.
    - If `prefers-reduced-motion` is active, decrease particle count to 20 on desktop/mobile and disable the particle drift animation loop.
    - Implement a `visibilitychange` listener to pause the requestAnimationFrame loop when the browser tab is hidden.
    - Cancel the requestAnimationFrame render loop immediately when page transition/redirection to `/app` begins to avoid CPU overhead.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    TypeScript compilation succeeds and the visibility / motion optimization code is in page.tsx.
  </done>
</task>

<task type="auto">
  <name>Run Production Next.js Build and Verification</name>
  <files>src/app/page.tsx</files>
  <action>
    - Run `npm run build` to compile the application and verify no errors are thrown during NextJS Static Site Generation (SSG) / Server-Side Rendering (SSR).
  </action>
  <verify>npm run build</verify>
  <done>
    Next.js production build completes with 0 errors.
  </done>
</task>

## Success Criteria
- [ ] Landing page animations pause when the tab is hidden or when the user redirects.
- [ ] Next.js production build compiles with no errors.
