# Research: Landing Page Scroll & Render Performance

## 1. Key Performance Bottlenecks

Upon analyzing the landing page implementation in `src/app/page.tsx`, we identified the following optimization opportunities:

### Continuous requestAnimationFrame (rAF) Loop
- **Current Behavior**: The `render()` loop runs constantly using `requestAnimationFrame(render)`, even if:
  - The user has switched to a different browser tab.
  - The landing page is in the process of redirecting the user to `/app` (after clicking "Begin your Journey" / "Enter the Realm").
- **Solution**: 
  - Add a listener for `visibilitychange` to pause `requestAnimationFrame` when the document is hidden (`document.hidden === true`).
  - Stop the animation loop immediately when the fadeout/redirect animation starts.

### Particle coordinates recalculation in JS
- **Current Behavior**: Loops through 300 particles on every frame, modifying array values and calling `particleGeo.attributes.position.needsUpdate = true`.
- **Solution**: Keep the coordinate changes minimal, use local variables to store loop limits, and check if animations are disabled via user preferences.

### Respecting `prefers-reduced-motion`
- **Current Behavior**: Complex camera transitions, particle drifts, and GSAP fading animations run unconditionally.
- **Solution**: 
  - Detect `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - If enabled, disable the particle drift loop, restrict the particle count, disable Three.js animation rendering updates unless scrolling, and set GSAP scrub times to `0` or disable animations entirely.

---

## 2. Implementation Strategy

### Check for Reduced Motion in React
```typescript
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReduced = mediaQuery.matches;
```

### Tab Visibility Event Listener
```typescript
const handleVisibility = () => {
  if (document.hidden) {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = null;
  } else {
    if (!animFrameIdRef.current && stage !== "complete") {
      animFrameIdRef.current = requestAnimationFrame(render);
    }
  }
};
document.addEventListener("visibilitychange", handleVisibility);
```

---

## 3. Production Verification

We will run a production check using `npm run build` to confirm all pages, route callback, API routes, and components compile clean without any types or layout issues.
