# Research: Viking Runic Astrolabe Landing Page

This document details the technical research and animation formulas required for implementing the circular runic dial, background camera orbits around the glowing 3D sword, and mouse-follower coordinate translations.

---

## 1. Circular Text layout in SVG

To render concentric circular menus without using pre-rendered outline paths (which are hard to translate, edit, or style), we will use native SVG `<textPath>` components:

```xml
<svg viewBox="0 0 800 800" className="w-full h-full">
  <defs>
    <!-- Circular Path (r=300, centered at 400, 400) -->
    <path id="middleRingPath" d="M 400, 100 A 300,300 0 1,1 399.9,100 Z" />
    <path id="outerRingPath" d="M 400, 50 A 350,350 0 1,1 399.9,50 Z" />
  </defs>

  <!-- Elder Futhark runes rotating constantly -->
  <g className="animate-spin-slow">
    <text fill="#f5efe8" opacity="0.15" fontSize="14" letterSpacing="6">
      <textPath href="#outerRingPath" startOffset="0%">
        ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ
      </textPath>
    </text>
  </g>

  <!-- Interactive Section Titles (Middle Dial) -->
  <g id="interactiveDial">
    <text fill="#f5efe8" fontSize="11" fontWeight="bold" letterSpacing="4" cursor="pointer">
      <textPath href="#middleRingPath" startOffset="0%">
        THE CALL ✦ THE BATTLE ✦ THE OATH ✦ THE SAGE ✦ THE CHRONICLE ✦ THE TREASURY ✦
      </textPath>
    </text>
  </g>
</svg>
```

---

## 2. GSAP Dial Rotation & Camera Tracking

To rotate the middle dial and synchronize it with the scroll position, we will bind the GSAP ScrollTrigger timeline to the rotation angle of the SVG `<g>` element:

```typescript
// Create a timeline that handles 360 degree rotation of the dial
const dialTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top top",
    end: "bottom bottom",
    scrub: 1.5,
  }
});

dialTimeline.to("#interactiveDial", {
  rotation: 360,
  ease: "none",
  transformOrigin: "center center"
});
```

As the timeline advances (based on scroll), we will translate the scroll progress to the Three.js camera position. Instead of a linear path, the camera will rotate around the **Sword of Destiny**:

```typescript
const orbitRadius = 15;
const heightOffset = 2;

const updateCamera = (progress: number) => {
  // Orbit angle (Progress mapped to a portion of a circle)
  const angle = progress * Math.PI * 1.5; 
  
  camera.position.x = Math.sin(angle) * orbitRadius;
  camera.position.z = Math.cos(angle) * orbitRadius;
  camera.position.y = heightOffset + Math.sin(progress * Math.PI) * 2;
  
  camera.lookAt(new THREE.Vector3(0, 1.5, 0)); // Look at the floating sword
};
```

---

## 3. Custom Odin's Eye Cursor Translation

The custom cursor component will track the mouse coordinates using a standard lerped mouse-follower hook. 
To make the pupil "look" toward the center of the screen or active center coordinate, we calculate the offset vector:

```typescript
const [mouse, setMouse] = useState({ x: 0, y: 0 });
const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
    
    // Calculate direction vector from cursor coordinate to screen center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = centerX - e.clientX;
    const dy = centerY - e.clientY;
    const distance = Math.hypot(dx, dy) || 1;
    
    // Cap pupil offset at maximum 5 pixels radius
    const maxOffset = 5;
    setPupilOffset({
      x: (dx / distance) * maxOffset,
      y: (dy / distance) * maxOffset
    });
  };
  
  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, []);
```
When hovering over interactive buttons (e.g. `data-cursor="drag"` or `data-cursor="click"`), we scale up the cursor and change its SVG representation to the **Vegvisir (Runic Compass)**.
