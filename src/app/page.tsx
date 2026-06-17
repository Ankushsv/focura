"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { useRouter } from "next/navigation";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Draggable);
}

// ── WEB AUDIO API drone manager ──
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowOsc: OscillatorNode | null = null;
  private highOsc: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private shimmer: OscillatorNode | null = null;
  private shimmerGain: GainNode | null = null;
  private initialized = false;
  private isMuted = true;

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      this.ctx = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.masterGain = masterGain;

      // Master lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      filter.connect(masterGain);
      this.filter = filter;

      // Pulse low frequency gain node
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(0.04, ctx.currentTime);
      pulseGain.connect(filter);

      // Low Osc (55Hz)
      const lowOsc = ctx.createOscillator();
      lowOsc.type = "sine";
      lowOsc.frequency.setValueAtTime(55, ctx.currentTime);
      const lowGain = ctx.createGain();
      lowGain.gain.setValueAtTime(0.03, ctx.currentTime);
      lowOsc.connect(lowGain);
      lowGain.connect(pulseGain);
      lowOsc.start();
      this.lowOsc = lowOsc;

      // Second Osc (110Hz)
      const highOsc = ctx.createOscillator();
      highOsc.type = "sine";
      highOsc.frequency.setValueAtTime(110, ctx.currentTime);
      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.03, ctx.currentTime);
      highOsc.connect(highGain);
      highGain.connect(pulseGain);
      highOsc.start();
      this.highOsc = highOsc;

      // LFO for Act 3 battle pulse (1.5Hz) modulating pulseGain
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(1.5, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.0, ctx.currentTime); // start silent

      lfo.connect(lfoGain);
      lfoGain.connect(pulseGain.gain);
      lfo.start();

      this.lfo = lfo;
      this.lfoGain = lfoGain;

      // Coronation shimmer (880Hz) for Act 7
      const shimmer = ctx.createOscillator();
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(880, ctx.currentTime);
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(filter);
      shimmer.start();

      this.shimmer = shimmer;
      this.shimmerGain = shimmerGain;

      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext not supported in this environment", e);
    }
  }

  update(progress: number) {
    if (!this.initialized || !this.ctx || !this.filter || !this.lfoGain || !this.shimmerGain) return;
    const t = this.ctx.currentTime;

    // Filter frequency lerps 200Hz -> 2000Hz
    const cutoff = 200 + progress * 1800;
    this.filter.frequency.setTargetAtTime(cutoff, t, 0.1);

    // Act 3 (0.28 to 0.42): add battle pulse LFO modulation (peaks at 0.35)
    let pulseVal = 0;
    if (progress >= 0.28 && progress <= 0.42) {
      const mid = 0.35;
      if (progress < mid) {
        pulseVal = ((progress - 0.28) / (mid - 0.28)) * 0.15;
      } else {
        pulseVal = (1.0 - (progress - mid) / (0.42 - mid)) * 0.15;
      }
    }
    this.lfoGain.gain.setTargetAtTime(pulseVal, t, 0.1);

    // Act 7 (0.85 to 1.00): coronation shimmer (880Hz) fades in
    let shimmerVal = 0;
    if (progress >= 0.85) {
      shimmerVal = ((progress - 0.85) / 0.15) * 0.025;
    }
    this.shimmerGain.gain.setTargetAtTime(shimmerVal, t, 0.1);
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (!this.initialized && !mute) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      const targetGain = mute ? 0 : 0.4;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
  }

  destroy() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
    }
  }
}

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const act1Ref = useRef<HTMLDivElement | null>(null);
  const act2Ref = useRef<HTMLDivElement | null>(null);
  const act3Ref = useRef<HTMLDivElement | null>(null);
  const act4Ref = useRef<HTMLDivElement | null>(null);
  const act5Ref = useRef<HTMLDivElement | null>(null);
  const act6Ref = useRef<HTMLDivElement | null>(null);
  const act7Ref = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const redirectingRef = useRef(false);

  const audioManagerRef = useRef<AudioManager | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  
  const dragObjRef = useRef<any>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorPupilRef = useRef<SVGCircleElement | null>(null);

  // Helper for cleanup recursion
  const disposeNode = (node: any) => {
    if (!node) return;
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((m: any) => m.dispose());
      } else {
        node.material.dispose();
      }
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const audioManager = new AudioManager();
    audioManagerRef.current = audioManager;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#0a0907");
    scene.fog = new THREE.FogExp2(0x231d17, 0.08);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    const groundGeo = new THREE.PlaneGeometry(200, 200, 30, 30);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(x * 0.05) * Math.cos(y * 0.05) * 1.5 + Math.sin(x * 0.1) * 0.5);
    }
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x13110f, flatShading: true });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    scene.add(ground);

    const swordGroup = new THREE.Group();
    swordGroup.position.set(0, 1.2, 0);
    scene.add(swordGroup);

    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xddeeff, metalness: 0.9, roughness: 0.1, flatShading: true });
    const guardMaterial = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2, flatShading: true });
    const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x2b1e15, roughness: 0.7, flatShading: true });
    const runicGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });

    const bladeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.04), bladeMaterial);
    bladeMesh.position.set(0, 1.3, 0);
    swordGroup.add(bladeMesh);
    const runicGroove = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.8, 0.05), runicGlowMaterial);
    runicGroove.position.set(0, 1.3, 0);
    swordGroup.add(runicGroove);
    const guardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.12), guardMaterial);
    swordGroup.add(guardMesh);
    const gripMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), gripMaterial);
    gripMesh.position.set(0, -0.35, 0);
    swordGroup.add(gripMesh);
    const pommelMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), guardMaterial);
    pommelMesh.position.set(0, -0.7, 0);
    swordGroup.add(pommelMesh);

    const archGroup = new THREE.Group();
    scene.add(archGroup);
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (i / 5) * Math.PI;
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.2, 0.7), stoneMaterial);
      col.position.set(Math.sin(angle) * 4.8, 2.1, -Math.cos(angle) * 4.8);
      col.rotation.y = -angle;
      archGroup.add(col);
    }

    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(0, 1.2, 0);
    scene.add(orbitGroup);
    const smallStones: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.18), stoneMaterial);
      stone.position.set(Math.cos(angle) * 2.0, (Math.random() - 0.5) * 0.3, Math.sin(angle) * 2.0);
      orbitGroup.add(stone);
      smallStones.push(stone);
    }

    const partCount = prefersReducedMotion ? 20 : (isMobile ? 80 : 300);
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const u = Math.random(), v = Math.random();
      const theta = u * 2 * Math.PI, phi = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()) * 2.5;
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xf0a868, size: 0.04, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particleGeo, particleMaterial);
    particleGeo.setDrawRange(0, Math.floor(partCount / 2));
    swordGroup.add(particles);

    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const u = Math.random(), v = Math.random();
      const r = Math.cbrt(Math.random()) * 50;
      const theta = u * 2 * Math.PI, phi = Math.acos(2 * v - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 10;
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0 });
    const stars = new THREE.Points(starGeo, starMaterial);
    scene.add(stars);

    const ambientLight = new THREE.AmbientLight(0x503525, 0.3);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xf5efe8, 0.6);
    directionalLight.position.set(5, 15, 10);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xf0a868, 1.5, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.0, 9), new THREE.Vector3(-8, 1.6, 6), new THREE.Vector3(-6, 3.2, -6),
      new THREE.Vector3(0, 2.0, -9), new THREE.Vector3(6, 1.6, -6), new THREE.Vector3(8, 2.8, 6), new THREE.Vector3(0, 1.6, 3.8)
    ]);

    const updateScene = (progress: number) => {
      if (!sceneRef.current) return;
      audioManager.update(progress);
      camera.position.copy(cameraPath.getPoint(progress));
      camera.lookAt(new THREE.Vector3(0, 1.4, 0));
      groundMat.color.set(0x13110f).lerp(new THREE.Color(0x231d17), progress);
      if (scene.fog instanceof THREE.FogExp2) scene.fog.density = progress <= 0.5 ? 0.08 * (1.0 - progress / 0.5) : 0;
      
      if (progress <= 0.33) scene.background = new THREE.Color(0x0a0907).lerp(new THREE.Color(0x130d07), progress / 0.33);
      else if (progress <= 0.66) scene.background = new THREE.Color(0x130d07).lerp(new THREE.Color(0x1d120a), (progress - 0.33) / 0.33);
      else scene.background = new THREE.Color(0x1d120a).lerp(new THREE.Color(0x06060c), (progress - 0.66) / 0.34);
      
      particleMaterial.opacity = progress < 0.4 ? 0 : progress <= 0.6 ? (progress - 0.4) / 0.2 : 1.0;
      starMaterial.opacity = progress < 0.75 ? 0 : progress <= 0.9 ? ((progress - 0.75) / 0.15) * 0.8 : 0.8;
      
      ambientLight.color.set(0x503525).lerp(new THREE.Color(0xd4af37), progress);
      ambientLight.intensity = 0.3 + progress * 0.7;
      directionalLight.intensity = 0.6 + progress * 1.4;
    };

    updateScene(0);
    setLoading(false);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          updateScene(self.progress);
          if (dragObjRef.current && !dragObjRef.current.isDragging && !dragObjRef.current.isThrowing) {
            gsap.set("#middleNavRing", { rotation: self.progress * 360, transformOrigin: "center center" });
          }
        },
      },
    });

    // Fade text overlays in and out as we scroll
    tl.to(act1Ref.current, { opacity: 1, y: -20, duration: 0.08, ease: "power1.out" }, 0.0)
      .to(act1Ref.current, { opacity: 0, y: -40, duration: 0.08, ease: "power1.in" }, 0.12)
      
      .to(act2Ref.current, { opacity: 1, x: 20, duration: 0.08, ease: "power1.out" }, 0.16)
      .to(act2Ref.current, { opacity: 0, x: 40, duration: 0.08, ease: "power1.in" }, 0.28)
      
      .to(act3Ref.current, { opacity: 1, x: -20, duration: 0.08, ease: "power1.out" }, 0.32)
      .to(act3Ref.current, { opacity: 0, x: -40, duration: 0.08, ease: "power1.in" }, 0.44)
      
      .to(act4Ref.current, { opacity: 1, y: -20, duration: 0.08, ease: "power1.out" }, 0.48)
      .to(act4Ref.current, { opacity: 0, y: -40, duration: 0.08, ease: "power1.in" }, 0.60)
      
      .to(act5Ref.current, { opacity: 1, x: 20, duration: 0.08, ease: "power1.out" }, 0.64)
      .to(act5Ref.current, { opacity: 0, x: 40, duration: 0.08, ease: "power1.in" }, 0.74)
      
      .to(act6Ref.current, { opacity: 1, x: -20, duration: 0.08, ease: "power1.out" }, 0.78)
      .to(act6Ref.current, { opacity: 0, x: -40, duration: 0.08, ease: "power1.in" }, 0.86)
      
      .to(act7Ref.current, { opacity: 1, y: -20, duration: 0.1, ease: "power1.out" }, 0.90);

    gsap.to("#outerRunicRing", { rotation: -360, repeat: -1, duration: 45, ease: "none", transformOrigin: "center center" });
    if (typeof window !== "undefined") {
      dragObjRef.current = Draggable.create("#middleNavRing", {
        type: "rotation",
        onDrag: function() {
          const progress = (this.rotation % 360 + 360) % 360 / 360;
          window.scrollTo(0, progress * (document.documentElement.scrollHeight - window.innerHeight));
        }
      })[0];
    }

    const render = () => {
      if (redirectingRef.current) return;
      swordGroup.rotation.y += 0.003;
      swordGroup.position.y = 1.2 + Math.sin(Date.now() * 0.001) * 0.08;
      orbitGroup.rotation.y += 0.004;
      smallStones.forEach((s, i) => s.position.y = Math.sin(Date.now() * 0.001 + i) * 0.08);
      
      const pos = particleGeo.attributes.position.array as Float32Array;
      const progress = tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
      const radius = progress >= 1.0 ? 4 : 2.5;
      for (let i = 0; i < partCount; i++) {
        pos[i * 3 + 1] += (progress >= 1.0 ? 0.005 : 0.002);
        if (pos[i * 3 + 1] > radius) {
          pos[i * 3 + 1] = -radius;
          const t = Math.random() * 2 * Math.PI, r = Math.random() * radius;
          pos[i * 3] = r * Math.cos(t); pos[i * 3 + 2] = r * Math.sin(t);
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    if (!prefersReducedMotion) render();
    else renderer.render(scene, camera);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      if (dragObjRef.current) dragObjRef.current.kill();
      audioManager.destroy();
      scene.traverse(disposeNode);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX - 25,
          y: e.clientY - 25,
          duration: 0.1,
          ease: "power2.out",
        });
      }
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = centerX - e.clientX;
      const dy = centerY - e.clientY;
      const distance = Math.hypot(dx, dy) || 1;
      
      const maxOffset = 5;
      if (cursorPupilRef.current) {
        gsap.to(cursorPupilRef.current, {
          cx: 25 - (dx / distance) * maxOffset,
          cy: 25 - (dy / distance) * maxOffset,
          duration: 0.2,
          ease: "power1.out",
        });
      }
    };
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest('[data-cursor="drag"]') || 
                            target.closest('[data-cursor="click"]') || 
                            target.closest('button') || 
                            target.closest('a');
      
      if (isInteractive) {
        gsap.to("#odinEyeGroup", { opacity: 0, duration: 0.2 });
        gsap.to("#vegvisirGroup", { opacity: 1, duration: 0.2 });
        gsap.to(cursorRef.current, { scale: 1.3, duration: 0.2 });
      } else {
        gsap.to("#odinEyeGroup", { opacity: 1, duration: 0.2 });
        gsap.to("#vegvisirGroup", { opacity: 0, duration: 0.2 });
        gsap.to(cursorRef.current, { scale: 1.0, duration: 0.2 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  const beginLegend = () => {
    redirectingRef.current = true;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setRedirecting(true);
    // Canvas fades out
    if (canvasRef.current) {
      gsap.to(canvasRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    }
    // Final text overlay fades out
    if (act7Ref.current) {
      gsap.to(act7Ref.current, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }

    // After 0.6 seconds, redirect to the login page
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (audioManagerRef.current) {
      audioManagerRef.current.setMute(newState);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0e0c0a] text-[#f5efe8] font-sans select-none overflow-x-hidden">

      {/* ── Fixed WebGL Canvas ── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none transition-opacity duration-500"
        style={{ background: "#0e0c0a" }}
      />

      {/* ── Concentric Circular Dials (Astrolabe) ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
        <svg
          id="astrolabeSvg"
          viewBox="0 0 800 800"
          className="w-[320px] h-[320px] sm:w-[540px] sm:h-[540px] pointer-events-auto filter drop-shadow-[0_0_35px_rgba(240,168,104,0.15)] transition-all duration-300"
        >
          <defs>
            <path id="outerRingPath" d="M 400, 70 A 330,330 0 1,1 399.9,70 Z" />
            <path id="middleRingPath" d="M 400, 150 A 250,250 0 1,1 399.9,150 Z" />
          </defs>

          {/* Outer Ring - Constant rotation */}
          <g id="outerRunicRing">
            <circle cx="400" cy="400" r="330" fill="none" stroke="rgba(240,168,104,0.1)" strokeWidth="1" />
            <text fill="#f5efe8" opacity="0.25" fontSize="13" className="font-mono tracking-[0.3em]">
              <textPath href="#outerRingPath" startOffset="0%">
                ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ ✦ ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ ✦
              </textPath>
            </text>
          </g>

          {/* Middle Ring - Interactive navigation dial */}
          <g id="middleNavRing" cursor="grab" className="pointer-events-auto" data-cursor="drag">
            <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(240,168,104,0)" strokeWidth="40" />
            <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(240,168,104,0.2)" strokeWidth="2" strokeDasharray="5, 10" />
            
            {/* Circular project/section text */}
            <text fill="#f5efe8" fontSize="13" className="font-cinzel tracking-[0.2em] font-bold" fillOpacity="0.8">
              <textPath href="#middleRingPath" startOffset="0%">
                THE CALL ✦ THE BATTLE ✦ THE OATH ✦ THE SAGE ✦ THE CHRONICLE ✦ THE TREASURY ✦
              </textPath>
            </text>
          </g>

          {/* Inner Ring - Gold core button */}
          <g id="innerCore" className="cursor-pointer pointer-events-auto" data-cursor="click" onClick={beginLegend}>
            <circle cx="400" cy="400" r="160" fill="rgba(26,23,20,0.4)" stroke="rgba(240,168,104,0.3)" strokeWidth="1" />
            <circle cx="400" cy="400" r="145" fill="rgba(240,168,104,0.05)" stroke="rgba(240,168,104,0.5)" strokeWidth="1" strokeDasharray="3, 6" />
            <circle cx="400" cy="400" r="90" fill="rgba(240,168,104,0.1)" className="transition duration-300 hover:fill-rgba(240,168,104,0.2)" />
            <text x="400" y="410" textAnchor="middle" fill="#f0a868" className="font-cinzel text-xl font-bold tracking-[0.3em]">
              ENTER
            </text>
            <text x="400" y="428" textAnchor="middle" fill="#f5efe8" opacity="0.4" className="font-mono text-[9px] tracking-[0.2em]">
              REALM
            </text>
          </g>
        </svg>
      </div>

      {/* ── Scroll Container (Driving ScrollTrigger) ── */}
      <div
        ref={containerRef}
        className="relative h-[700vh] w-full z-10 pointer-events-none"
      />

      {/* ── Fixed Text Overlays ── */}
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-8">

        {/* Header */}
        <header className="w-full flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
          <div className="font-quicksand font-bold text-xl tracking-wider text-[#f5efe8]">
            focura<span className="text-[#f0a868]">.</span>
          </div>
          <button
            onClick={() => router.push("/login")}
            data-cursor="click"
            className="font-quicksand font-bold text-xs uppercase tracking-widest text-[#f5efe8]/80 hover:text-[#f0a868] transition duration-300 border border-white/5 px-5 py-2.5 rounded-full bg-[#1a1714]/30 backdrop-blur-sm"
          >
            Enter War Room
          </button>
        </header>

        {/* Text Acts Placement Area */}
        <div className="relative w-full h-[70vh] max-w-7xl mx-auto flex items-center justify-center">

          {/* ACT 1: Center 45% */}
          <div
            ref={act1Ref}
            className="absolute left-1/2 -translate-x-1/2 text-center w-full max-w-2xl px-6 opacity-0 select-text"
            style={{ top: "45%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE REALM OF FOCURA
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              The Fog was always there.
            </h1>
          </div>

          {/* ACT 2: Left 30% */}
          <div
            ref={act2Ref}
            className="absolute left-[8%] text-left w-full max-w-lg px-6 opacity-0 select-text"
            style={{ top: "25%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE STORMBORN
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-4 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              But so were you.
            </h2>
            <p className="font-lora italic text-[#f5efe8]/65 text-base sm:text-lg leading-relaxed">
              Your mind moves like lightning.
              <br />
              The Fog could never hold you forever.
            </p>
          </div>

          {/* ACT 3: Right 35% */}
          <div
            ref={act3Ref}
            className="absolute right-[8%] text-right w-full max-w-lg px-6 opacity-0 select-text"
            style={{ top: "30%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE FIRST BATTLE
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-4 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              Your first battle was terrifying.
            </h2>
            <p className="font-lora italic text-[#f5efe8]/65 text-base sm:text-lg leading-relaxed">
              You rode anyway.
            </p>
          </div>

          {/* ACT 4: Center 40% */}
          <div
            ref={act4Ref}
            className="absolute left-1/2 -translate-x-1/2 text-center w-full max-w-2xl px-6 opacity-0 select-text"
            style={{ top: "35%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE FORGING
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-4 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              Piece by piece,
            </h2>
            <p className="font-lora italic text-lg text-[#f5efe8]/80 mb-2">
              you forged yourself.
            </p>
            <p className="font-lora italic text-[#f5efe8]/40 text-xs sm:text-sm">
              &quot;Focus sessions. Quests. Oaths kept in the dark when no one was watching.&quot;
            </p>
          </div>

          {/* ACT 5: Left 50% */}
          <div
            ref={act5Ref}
            className="absolute left-[8%] text-left w-full max-w-lg px-6 opacity-0 select-text"
            style={{ top: "45%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE DARK LORD
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-4 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              The enemy is real.
            </h2>
            <p className="font-lora italic text-[#f5efe8]/65 text-base sm:text-lg leading-relaxed">
              Procrastination. The Fog. Overwhelm.
              <br />
              It has a name. And you have a blade.
            </p>
          </div>

          {/* ACT 6: Right 35% */}
          <div
            ref={act6Ref}
            className="absolute right-[8%] text-right w-full max-w-lg px-6 opacity-0 select-text"
            style={{ top: "30%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              THE VICTORY
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-4 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              The victory was not given.
            </h2>
            <p className="font-lora italic text-[#f5efe8]/65 text-base sm:text-lg mb-2">
              It was taken.
            </p>
            <p className="font-lora italic text-[#f5efe8]/40 text-xs sm:text-sm">
              &quot;One focus block. One quest. One oath kept.&quot;
            </p>
          </div>

          {/* ACT 7: Coronation (Centered 25%) */}
          <div
            ref={act7Ref}
            className="absolute left-1/2 -translate-x-1/2 text-center w-full max-w-2xl px-6 opacity-0 flex flex-col items-center"
            style={{ top: "20%" }}
          >
            <div className="font-quicksand font-bold text-xs uppercase tracking-[0.25em] text-[#f0a868] mb-4">
              YOUR CORONATION
            </div>
            <h2 className="font-cinzel text-3xl sm:text-5xl font-bold leading-tight text-[#f5efe8] mb-3 drop-shadow-[0_2px_10px_rgba(14,12,10,0.8)]">
              Welcome, Stormborn.
            </h2>
            <p className="font-lora italic text-[#f5efe8]/65 text-base sm:text-lg mb-8">
              The realm remembers.
            </p>

            {/* CTA SECTION */}
            <div className="pointer-events-auto flex flex-col items-center space-y-3">
              <button
                onClick={beginLegend}
                data-cursor="click"
                className="font-quicksand font-bold text-base uppercase tracking-widest text-[#0e0c0a] bg-[#f0a868] px-10 py-5 rounded-full shadow-[0_0_40px_rgba(240,168,104,0.4)] hover:shadow-[0_0_60px_rgba(240,168,104,0.6)] hover:scale-105 transition-all duration-300"
              >
                Begin Your Legend →
              </button>
              <div className="font-lora italic text-[11px] text-[#f5efe8]/30">
                No credit card. No subscription trap. Just your journey.
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="w-full text-center max-w-7xl mx-auto pb-4">
          <p className="font-mono text-[9px] text-[#f5efe8]/20 tracking-wider">
            THE REALM OF FOCURA &copy; 2026 &middot; BUILT FOR THE STORMBORN
          </p>
        </footer>

      </div>

      {/* ── Audio Control (Top-Right Fixed) ── */}
      <button
        onClick={toggleMute}
        data-cursor="click"
        className="fixed top-24 right-8 z-30 pointer-events-auto p-3 rounded-full border border-white/5 bg-[#1a1714]/30 backdrop-blur-sm text-[#f5efe8]/75 hover:text-[#f0a868] transition duration-300"
        title={isMuted ? "Unmute Ambient Audio" : "Mute Audio"}
      >
        {isMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z"
            />
          </svg>
        )}
      </button>

      {/* ── Loading Screen ── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0c0a] transition-opacity duration-700">
          <div className="flex flex-col items-center space-y-6">
            <div className="font-quicksand font-bold text-3xl tracking-widest text-[#f5efe8]">
              focura<span className="text-[#f0a868]">.</span>
            </div>
            {/* CSS Animated Growing Gold Line */}
            <div className="relative w-48 h-[1px] bg-white/5 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full bg-[#f0a868] animate-load-bar"
                style={{
                  width: "100%",
                  animation: "load-bar 1.2s ease-in-out forwards",
                }}
              />
            </div>
            <div className="font-lora italic text-[11px] text-[#f5efe8]/40 tracking-wider">
              Summoning the Stormborn...
            </div>
          </div>
        </div>
      )}

      {/* ── Transition Redirect Overlay ── */}
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0c0a] animate-fade-in duration-500">
          <div className="font-quicksand font-bold text-2xl tracking-widest text-[#f5efe8] animate-pulse">
            focura<span className="text-[#f0a868]">.</span>
          </div>
        </div>
      )}

      {/* ── Custom Odin's Eye Cursor ── */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-[50px] h-[50px] pointer-events-none z-50 transition-all duration-300 ease-out cursor-follower hidden md:block"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* Cursor SVG Container */}
        <svg viewBox="0 0 50 50" className="w-full h-full">
          {/* Odin's Eye (Standard State) */}
          <g id="odinEyeGroup" className="transition-opacity duration-300 opacity-100 cursor-eye-element">
            {/* Runic Border */}
            <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(240,168,104,0.3)" strokeWidth="1" />
            {/* Eye Shape */}
            <path
              d="M 12,25 C 18,15 32,15 38,25 C 32,35 18,35 12,25 Z"
              fill="none"
              stroke="#f0a868"
              strokeWidth="1.5"
            />
            {/* Pupil */}
            <circle ref={cursorPupilRef} cx="25" cy="25" r="4.5" fill="#f5efe8" />
          </g>

          {/* Vegvisir Compass (Hover / Drag State) */}
          <g id="vegvisirGroup" className="transition-opacity duration-300 opacity-0 cursor-compass-element" stroke="#f0a868" strokeWidth="1.2" fill="none">
            {/* Circular Compass Grid */}
            <circle cx="25" cy="25" r="22" stroke="rgba(240,168,104,0.2)" strokeWidth="0.5" strokeDasharray="2, 2" />
            <circle cx="25" cy="25" r="12" stroke="rgba(240,168,104,0.1)" strokeWidth="0.5" />
            
            {/* Compass Lines */}
            <line x1="25" y1="3" x2="25" y2="47" stroke="#f0a868" />
            <line x1="3" y1="25" x2="47" y2="25" stroke="#f0a868" />
            <line x1="9" y1="9" x2="41" y2="41" stroke="#f0a868" />
            <line x1="41" y1="9" x2="9" y2="41" stroke="#f0a868" />
            
            {/* Center Runic Node */}
            <circle cx="25" cy="25" r="2.5" fill="#f0a868" />
          </g>
        </svg>
      </div>

    </div>
  );
}
