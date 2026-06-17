---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Rebuild Landing Page with Circular Runic Dial & Odin's Eye Cursor

## Objective
Rebuild the landing page (`src/app/page.tsx`) with an interactive concentric circular Norse astrolabe dial (Runic Dial) using SVG paths, a WebGL background featuring a floating glowing Norse sword inside a monolithic stone archway (Three.js), and a custom Odin's Eye mouse follower cursor.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- .gsd/phases/7/RESEARCH.md
- src/app/page.tsx

## Tasks

<task type="auto">
  <name>Implement WebGL 3D Background with Verve-Blade & Monolithic Arch</name>
  <files>src/app/page.tsx</files>
  <action>
    - Rebuild the Three.js geometry in page.tsx:
      - Replace the linear ground plane and simple shapes with a 3D Viking sword (Verve-Blade) suspended in the center. The blade should be made of a metallic mesh with glowing orange/gold runic glyphs.
      - Add a circular stone archway constructed of distressed stone columns.
      - Add 8 orbiting monolith stones rotating slowly around the sword.
      - Update the camera path inside page.tsx to orbit the sword: as scroll progress advances, the camera should circular-lerp around the centerpiece, zooming in on runes and showing wide-angle coronation shots.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    TypeScript compilation succeeds, and the Three.js centerpiece has been updated to the glowing sword and stone arch.
  </done>
</task>

<task type="auto">
  <name>Create Concentric Circular Dials & Odin's Eye Follower Cursor</name>
  <files>src/app/page.tsx</files>
  <action>
    - Add three concentric SVG rings in the HTML markup of page.tsx:
      - Outer Ring: Carved Elder Futhark runes spinning continuously.
      - Middle Ring: Text paths containing the section titles (THE CALL, THE BATTLE, THE OATH, etc.).
      - Inner Ring: An absolute centered button to "ENTER THE REALM".
    - Wire a GSAP scroll/drag listener that rotates the middle dial and synchronizes it with the active story act and the camera orbit angle.
    - Implement a custom absolute mouse-follower component (Odin's Eye) in page.tsx:
      - The pupil element should dynamically offset towards the center to "look" around.
      - Hovering over buttons/dials should scale the cursor and morph it into a Vegvisir (Runic Compass) vector path using CSS transitions.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    SVG dials and Odin's Eye cursor are fully integrated into page.tsx, and compile without errors.
  </done>
</task>

<task type="auto">
  <name>Build and Compile Verification</name>
  <files>src/app/page.tsx</files>
  <action>
    - Run Next.js production build command (`npm run build`) to ensure that all static generation, page data collection, and styles build cleanly.
  </action>
  <verify>npm run build</verify>
  <done>
    Production build command completes with zero errors.
  </done>
</task>

## Success Criteria
- [ ] Concentric SVG dials are rendered in the center and rotate smoothly on scroll.
- [ ] Three.js camera orbits around the glowing 3D Viking sword on the landing page based on scroll progress.
- [ ] The custom Odin's Eye follower cursor follows the mouse, pupil moves dynamically, and morphs into a Vegvisir compass on hover.
- [ ] Next.js production build compiles successfully with no errors.
