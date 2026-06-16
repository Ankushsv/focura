# TODO

## Landing page scroll animation performance fixes
- [ ] Inspect Landing.tsx for GSAP ScrollTrigger onUpdate + SVG path rendering bottlenecks
- [ ] Implement performance optimizations:
  - [ ] Pre-sample SVG path points once and reuse during scroll (remove getPointAtLength from onUpdate)
  - [ ] Throttle orb movement updates using requestAnimationFrame
  - [ ] Reduce ScrollTrigger scrub value to be less CPU-heavy
  - [ ] Respect `prefers-reduced-motion` to disable expensive animations on request
  - [ ] Auto-downgrade Three.js background quality (lower pixelRatio, fewer particles, pause render loop when not visible)
- [ ] Update any related CSS if needed (keep minimal)
- [ ] Run lint/build checks

