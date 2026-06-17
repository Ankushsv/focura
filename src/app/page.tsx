"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
      filter.connect(masterGain);
      this.filter = filter;

      // Pulse Gain Node for LFO battle pulse
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(1.0, ctx.currentTime);
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
      if (mute) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      } else {
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        this.masterGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.2);
      }
    }
  }

  destroy() {
    if (this.lowOsc) this.lowOsc.stop();
    if (this.highOsc) this.highOsc.stop();
    if (this.lfo) this.lfo.stop();
    if (this.shimmer) this.shimmer.stop();
    if (this.ctx) this.ctx.close();
  }
}

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Act text refs
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

  // Setup sound interactions
  useEffect(() => {
    const handleInteraction = () => {
      if (audioManagerRef.current && !isMuted) {
        audioManagerRef.current.setMute(false);
      }
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };

    window.addEventListener("scroll", handleInteraction);
    window.addEventListener("click", handleInteraction);

    return () => {
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [isMuted]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Mobile check
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Audio Manager
    const audioManager = new AudioManager();
    audioManagerRef.current = audioManager;

    // 1. Init Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const skyColor = new THREE.Color("#0e0c0a");
    scene.background = skyColor;

    // Setup Fog
    scene.fog = new THREE.FogExp2(0xf5efe8, 0.08);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    // 2. Build Ground
    const groundWidth = 200;
    const groundDepth = 800;
    const groundSegmentsW = 30;
    const groundSegmentsD = 100;
    const groundGeo = new THREE.PlaneGeometry(
      groundWidth,
      groundDepth,
      groundSegmentsW,
      groundSegmentsD
    );

    // Apply Vertex Noise before rotation (displace Z which becomes height)
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const zNoise =
        Math.sin(x * 0.05) * Math.cos(y * 0.05) * 1.5 + Math.sin(x * 0.1) * 0.5;
      posAttr.setZ(i, zNoise);
    }
    groundGeo.computeVertexNormals();
    groundGeo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x1a1410,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, 0, 0);
    scene.add(ground);

    // 3. Build Knight
    const knightGroup = new THREE.Group();
    knightGroup.position.set(0, 0.4, 0);
    scene.add(knightGroup);

    // Shared Materials
    const knightBodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x3a3028,
      flatShading: true,
    });

    const capeMaterial = new THREE.MeshLambertMaterial({
      color: 0x7a1a1a,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });

    const crownMaterial = new THREE.MeshLambertMaterial({
      color: 0xf0a868,
      flatShading: true,
    });

    const swordMaterial = new THREE.MeshLambertMaterial({
      color: 0x8a8070,
      flatShading: true,
    });

    // Torso (0.5, 0.7, 0.3)
    const torsoMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.3),
      knightBodyMaterial
    );
    torsoMesh.position.set(0, 0.35, 0);
    knightGroup.add(torsoMesh);

    // Head Joint and Box
    const headJoint = new THREE.Group();
    headJoint.position.set(0, 0.7, 0);
    const headMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.35),
      knightBodyMaterial
    );
    headMesh.position.set(0, 0.175, 0);
    headJoint.add(headMesh);
    knightGroup.add(headJoint);

    // Crown (composed of a gold band and 4 cones)
    const crownGroup = new THREE.Group();
    crownGroup.scale.set(0, 0, 0); // start hidden

    const crownBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.06, 0.38),
      crownMaterial
    );
    crownBand.position.set(0, 0.38, 0);
    crownGroup.add(crownBand);

    const spikeGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
    const spike1 = new THREE.Mesh(spikeGeo, crownMaterial);
    spike1.position.set(-0.16, 0.45, -0.16);
    crownGroup.add(spike1);

    const spike2 = new THREE.Mesh(spikeGeo, crownMaterial);
    spike2.position.set(0.16, 0.45, -0.16);
    crownGroup.add(spike2);

    const spike3 = new THREE.Mesh(spikeGeo, crownMaterial);
    spike3.position.set(-0.16, 0.45, 0.16);
    crownGroup.add(spike3);

    const spike4 = new THREE.Mesh(spikeGeo, crownMaterial);
    spike4.position.set(0.16, 0.45, 0.16);
    crownGroup.add(spike4);

    headJoint.add(crownGroup);

    // Rig limbs for rotation at joint pivot
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.35, 0.6, 0);
    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.5, 0.2),
      knightBodyMaterial
    );
    leftArm.position.set(0, -0.25, 0);
    leftShoulder.add(leftArm);
    knightGroup.add(leftShoulder);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.35, 0.6, 0);
    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.5, 0.2),
      knightBodyMaterial
    );
    rightArm.position.set(0, -0.25, 0);
    rightShoulder.add(rightArm);
    knightGroup.add(rightShoulder);

    // Sword in right arm
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0, -0.45, 0.1);
    swordGroup.rotation.x = Math.PI / 2; // point forward

    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.5, 0.02),
      swordMaterial
    );
    swordBlade.position.set(0, 0.25, 0);
    swordGroup.add(swordBlade);

    const swordGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.03, 0.05),
      crownMaterial // gold trim
    );
    swordGuard.position.set(0, 0, 0);
    swordGroup.add(swordGuard);

    const swordHilt = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.04),
      knightBodyMaterial
    );
    swordHilt.position.set(0, -0.06, 0);
    swordGroup.add(swordHilt);

    rightShoulder.add(swordGroup);

    // Legs
    const leftHip = new THREE.Group();
    leftHip.position.set(-0.15, 0.3, 0);
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.55, 0.22),
      knightBodyMaterial
    );
    leftLeg.position.set(0, -0.275, 0);
    leftHip.add(leftLeg);
    knightGroup.add(leftHip);

    const rightHip = new THREE.Group();
    rightHip.position.set(0.15, 0.3, 0);
    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.55, 0.22),
      knightBodyMaterial
    );
    rightLeg.position.set(0, -0.275, 0);
    rightHip.add(rightLeg);
    knightGroup.add(rightHip);

    // Cape (behind torso)
    const capeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.8),
      capeMaterial
    );
    capeMesh.position.set(0, 0.25, -0.16);
    knightGroup.add(capeMesh);

    // 4. Build Castle
    const castleGroup = new THREE.Group();
    castleGroup.position.set(0, 0, -20);
    castleGroup.scale.set(0.3, 0.3, 0.3); // starts scaled down
    scene.add(castleGroup);

    const castleMaterial = new THREE.MeshLambertMaterial({
      color: 0x2a2018,
      flatShading: true,
    });

    // Castle base floor
    const castleFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 20),
      new THREE.MeshLambertMaterial({ color: 0x1e1610, flatShading: true })
    );
    castleFloor.rotateX(-Math.PI / 2);
    castleFloor.position.set(0, 0.01, -4);
    castleGroup.add(castleFloor);

    // Keep keep (6, 8, 4)
    const mainKeep = new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 4),
      castleMaterial
    );
    mainKeep.position.set(0, 4, -8);
    castleGroup.add(mainKeep);

    // Towers left/right
    const towerL = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      castleMaterial
    );
    towerL.position.set(-4, 5, 0);
    castleGroup.add(towerL);

    const towerR = new THREE.Mesh(
      new THREE.BoxGeometry(2, 10, 2),
      castleMaterial
    );
    towerR.position.set(4, 5, 0);
    castleGroup.add(towerR);

    // Gate Arch posts & cap
    const gatePostL = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4.0, 0.5),
      castleMaterial
    );
    gatePostL.position.set(-1.5, 2.0, 0.1);
    castleGroup.add(gatePostL);

    const gatePostR = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4.0, 0.5),
      castleMaterial
    );
    gatePostR.position.set(1.5, 2.0, 0.1);
    castleGroup.add(gatePostR);

    const gateTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.6, 0.5),
      castleMaterial
    );
    gateTop.position.set(0, 4.3, 0.1);
    castleGroup.add(gateTop);

    // Battlements
    const battlementSize = 0.5;
    for (let i = -3; i <= 3; i += 1.5) {
      const bat = new THREE.Mesh(
        new THREE.BoxGeometry(battlementSize, battlementSize, battlementSize),
        castleMaterial
      );
      bat.position.set(i, 8.25, -8);
      castleGroup.add(bat);
    }
    // Towers Battlements
    for (const tx of [-4, 4]) {
      for (let tz = -0.75; tz <= 0.75; tz += 1.5) {
        const batL = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.4),
          castleMaterial
        );
        batL.position.set(tx - 0.75, 10.2, tz);
        castleGroup.add(batL);
        const batR = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.4),
          castleMaterial
        );
        batR.position.set(tx + 0.75, 10.2, tz);
        castleGroup.add(batR);
      }
    }

    // Throne Room - Throne
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 0.05, -7);

    const throneBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.25, 1.2),
      castleMaterial
    );
    throneBase.position.set(0, 0.125, 0);
    throneGroup.add(throneBase);

    const throneSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x3d3025, flatShading: true })
    );
    throneSeat.position.set(0, 0.55, 0);
    throneGroup.add(throneSeat);

    const throneBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.18),
      new THREE.MeshLambertMaterial({ color: 0xf0a868, flatShading: true }) // gold back
    );
    throneBack.position.set(0, 1.25, -0.4);
    throneGroup.add(throneBack);

    castleGroup.add(throneGroup);

    // 5. Build Trees (Act 1 dead trees)
    const treeCount = isMobile ? 8 : 20;
    const treesGroup = new THREE.Group();
    scene.add(treesGroup);

    const treeMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a1814,
      flatShading: true,
      transparent: true,
    });
    const trunkMaterial = new THREE.MeshLambertMaterial({
      color: 0x12100e,
      flatShading: true,
      transparent: true,
    });

    const trunkGeo = new THREE.ConeGeometry(0.3, 2, 4);
    const canopyGeo = new THREE.ConeGeometry(0.8, 2.5, 5);

    const treesList: THREE.Group[] = [];
    for (let i = 0; i < treeCount; i++) {
      const singleTree = new THREE.Group();

      const trunkM = new THREE.Mesh(trunkGeo, trunkMaterial);
      trunkM.position.set(0, 1, 0);
      singleTree.add(trunkM);

      const canopyM = new THREE.Mesh(canopyGeo, treeMaterial);
      canopyM.position.set(0, 2.8, 0);
      singleTree.add(canopyM);

      // Scatter: Z range 5 to 25. Avoid pathway center (|X| > 2)
      const side = Math.random() < 0.5 ? -1 : 1;
      const tx = side * (2 + Math.random() * 8);
      const tz = 5 + Math.random() * 20;
      singleTree.position.set(tx, 0, tz);

      // Random scale variation
      const s = 0.7 + Math.random() * 0.6;
      singleTree.scale.set(s, s, s);

      treesGroup.add(singleTree);
      treesList.push(singleTree);
    }

    // 6. Build Particles (Gold sparks around knight)
    const partCount = prefersReducedMotion ? 20 : (isMobile ? 80 : 300);
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(partCount * 3);

    for (let i = 0; i < partCount; i++) {
      // uniform random inside sphere of radius 2
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2;
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf0a868,
      size: 0.04,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    // Draw only half the particles initially to increase them at Coronation
    particleGeo.setDrawRange(0, Math.floor(partCount / 2));
    knightGroup.add(particles);

    // 7. Build Stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      // uniform random inside sphere of radius 50
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 50;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xf5efe8,
      size: 0.05,
      transparent: true,
      opacity: 0,
    });
    const stars = new THREE.Points(starGeo, starMaterial);
    stars.position.set(0, 0, -25);
    scene.add(stars);

    // 8. Setup Lighting
    const ambientLight = new THREE.AmbientLight(0x604030, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xf0a868, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Hero PointLight above knight
    const pointLight = new THREE.PointLight(0xf0a868, 1.0, 8);
    scene.add(pointLight);

    // 9. Build Camera Path
    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3, 30), // Act 1: far back
      new THREE.Vector3(-2, 2, 20), // Act 2: drift left
      new THREE.Vector3(0, 2, 12), // Act 3: closing
      new THREE.Vector3(1, 1.5, 5), // Act 4: knight level approach
      new THREE.Vector3(0, 1.8, 0), // Act 5: close-up pass
      new THREE.Vector3(0, 2.5, -5), // Act 6: rising view
      new THREE.Vector3(0, 4, -15), // Act 7: wide shot of castle
      new THREE.Vector3(0, 2, -25), // Act 7: throne approach
    ]);

    // 10. Update Scene Logic (called on scroll progress)
    const tempColor = new THREE.Color();
    const updateScene = (progress: number) => {
      if (!sceneRef.current) return;

      // ── Audio updates ──
      audioManager.update(progress);

      // ── Camera positioning ──
      const cameraPoint = cameraPath.getPoint(progress);
      // lookAt follows the spline slightly ahead
      const lookAtPoint = cameraPath.getPoint(Math.min(progress + 0.05, 1.0));
      camera.position.copy(cameraPoint);
      camera.lookAt(lookAtPoint);

      // ── Ground color lerping ──
      const groundColor = tempColor
        .set(0x1a1410)
        .lerp(new THREE.Color(0x2a1f12), progress);
      groundMat.color.copy(groundColor);

      // ── Fog updates (clears by progress 0.5) ──
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        if (progress <= 0.5) {
          scene.fog.density = 0.08 * (1.0 - progress / 0.5);
        } else {
          scene.fog.density = 0.0;
        }
      }

      // ── Sky background color updates ──
      let currentSkyHex = 0x0e0c0a;
      if (progress <= 0.33) {
        const t = progress / 0.33;
        tempColor.set(0x0e0c0a).lerp(new THREE.Color(0x1a1208), t);
      } else if (progress <= 0.66) {
        const t = (progress - 0.33) / 0.33;
        tempColor.set(0x1a1208).lerp(new THREE.Color(0x2a1a0a), t);
      } else {
        const t = (progress - 0.66) / 0.34;
        tempColor.set(0x2a1a0a).lerp(new THREE.Color(0x0e0c18), t);
      }
      scene.background = tempColor;

      // ── Trees opacity (1 -> 0 between 0.2 -> 0.4) ──
      let treeOpacity = 1.0;
      if (progress <= 0.2) {
        treeOpacity = 1.0;
      } else if (progress <= 0.4) {
        treeOpacity = 1.0 - (progress - 0.2) / 0.2;
      } else {
        treeOpacity = 0.0;
      }
      treeMaterial.opacity = treeOpacity;
      trunkMaterial.opacity = treeOpacity;
      treesGroup.visible = treeOpacity > 0;

      // ── Castle scale (0.3 -> 1.0 between 0.2 -> 0.9) ──
      let castleScale = 0.3;
      if (progress > 0.2 && progress <= 0.9) {
        const t = (progress - 0.2) / 0.7;
        castleScale = 0.3 + t * 0.7;
      } else if (progress > 0.9) {
        castleScale = 1.0;
      }
      castleGroup.scale.set(castleScale, castleScale, castleScale);

      // ── Knight transitions ──
      // Position Z displacement: moves 0 -> -27 from progress 0.4 -> 0.8
      let knightZ = 0;
      if (progress <= 0.4) {
        knightZ = 0;
      } else if (progress <= 0.8) {
        const t = (progress - 0.4) / 0.4;
        knightZ = t * -27; // lerps to -27
      } else {
        knightZ = -27;
      }
      knightGroup.position.z = knightZ;

      // Knight scale: 0.8 -> 0.9 (by 0.2) -> 1.0 (by 0.6) -> 1.1 (by 1.0)
      let knightScale = 0.8;
      if (progress <= 0.2) {
        knightScale = 0.8 + (progress / 0.2) * 0.1;
      } else if (progress <= 0.6) {
        knightScale = 0.9 + ((progress - 0.2) / 0.4) * 0.1;
      } else {
        knightScale = 1.0 + ((progress - 0.6) / 0.4) * 0.1;
      }
      knightGroup.scale.set(knightScale, knightScale, knightScale);

      // Body posture rotation.x: 0.3 -> 0.1 (by 0.2) -> 0.0 (by 0.4)
      let knightRotX = 0;
      if (progress <= 0.2) {
        knightRotX = 0.3 - (progress / 0.2) * 0.2;
      } else if (progress <= 0.4) {
        knightRotX = 0.1 - ((progress - 0.2) / 0.2) * 0.1;
      } else {
        knightRotX = 0;
      }
      knightGroup.rotation.x = knightRotX;

      // Color transition
      if (progress <= 0.2) {
        const t = progress / 0.2;
        tempColor.set(0x3a3028).lerp(new THREE.Color(0x5a4a38), t);
      } else if (progress <= 0.4) {
        const t = (progress - 0.2) / 0.2;
        tempColor.set(0x5a4a38).lerp(new THREE.Color(0x7a6a58), t);
      } else if (progress <= 0.6) {
        const t = (progress - 0.4) / 0.2;
        tempColor.set(0x7a6a58).lerp(new THREE.Color(0x8a8070), t);
      } else if (progress <= 0.8) {
        const t = (progress - 0.6) / 0.2;
        tempColor.set(0x8a8070).lerp(new THREE.Color(0xa09080), t);
      } else {
        const t = (progress - 0.8) / 0.2;
        tempColor.set(0xa09080).lerp(new THREE.Color(0xf0a868), t);
      }
      knightBodyMaterial.color.copy(tempColor);

      // Arm positions (Victory pose vs Sword stance)
      let rightArmRotX = 0;
      let rightArmRotZ = 0;
      let leftArmRotX = 0;
      let leftArmRotZ = 0;

      if (progress <= 0.4) {
        rightArmRotX = 0;
        rightArmRotZ = 0;
      } else if (progress <= 0.6) {
        // Sword raises slightly
        const t = (progress - 0.4) / 0.2;
        rightArmRotX = t * -0.5;
        rightArmRotZ = t * 0.15;
      } else if (progress <= 0.8) {
        // Blending into victory pose
        const t = (progress - 0.6) / 0.2;
        rightArmRotX = -0.5 + t * -2.2; // -> -2.7
        rightArmRotZ = 0.15 + t * 1.0;  // -> 1.15
        leftArmRotX = t * -2.7;
        leftArmRotZ = t * -1.15;
      } else {
        // Coronation Victory
        rightArmRotX = -2.7;
        rightArmRotZ = 1.15;
        leftArmRotX = -2.7;
        leftArmRotZ = -1.15;
      }

      // Add walk cycle animation to base rotations (only active when traveling)
      if (!prefersReducedMotion && progress > 0.05 && progress < 0.78) {
        // walking animation fades out by 0.78
        const fade = progress < 0.68 ? 1.0 : (0.78 - progress) / 0.1;
        const speed = 16;
        const angle = Math.sin(Date.now() * 0.005 * speed) * 0.4 * fade;

        leftHip.rotation.x = angle;
        rightHip.rotation.x = -angle;

        // Apply walk bob to limbs
        leftShoulder.rotation.x = leftArmRotX - angle * 0.5;
        rightShoulder.rotation.x = rightArmRotX + angle * 0.5;
        leftShoulder.rotation.z = leftArmRotZ;
        rightShoulder.rotation.z = rightArmRotZ;

        // Torso bobbing Y height
        knightGroup.position.y = 0.4 + Math.abs(Math.sin(Date.now() * 0.01 * speed)) * 0.08 * fade;
      } else {
        leftHip.rotation.x = 0;
        rightHip.rotation.x = 0;
        leftShoulder.rotation.x = leftArmRotX;
        rightShoulder.rotation.x = rightArmRotX;
        leftShoulder.rotation.z = leftArmRotZ;
        rightShoulder.rotation.z = rightArmRotZ;
        knightGroup.position.y = 0.4;
      }

      // Cape opacity (lerps 0 -> 1 between 0.4 -> 0.6)
      if (progress <= 0.4) {
        capeMaterial.opacity = 0;
      } else if (progress <= 0.6) {
        capeMaterial.opacity = (progress - 0.4) / 0.2;
      } else {
        capeMaterial.opacity = 1.0;
      }

      // Crown scale (lerps 0 -> 1 between 0.85 -> 1.0)
      if (progress <= 0.85) {
        crownGroup.scale.set(0, 0, 0);
      } else {
        const t = (progress - 0.85) / 0.15;
        crownGroup.scale.set(t, t, t);
      }

      // Particles sparks opacity (0 -> 1 between 0.6 -> 0.75)
      if (progress < 0.6) {
        particleMaterial.opacity = 0;
      } else if (progress <= 0.75) {
        particleMaterial.opacity = (progress - 0.6) / 0.15;
      } else {
        particleMaterial.opacity = 1.0;
      }

      // Particle count & scale (at progress >= 0.9)
      const visibleParticles = progress >= 0.9 ? partCount : Math.floor(partCount / 2);
      particleGeo.setDrawRange(0, visibleParticles);

      const pScale = progress >= 0.9 ? 2.0 : 1.0;
      particles.scale.setScalar(pScale);

      // Stars opacity (0 -> 0.8 between 0.75 -> 0.9)
      if (progress < 0.75) {
        starMaterial.opacity = 0;
      } else if (progress <= 0.9) {
        starMaterial.opacity = ((progress - 0.75) / 0.15) * 0.8;
      } else {
        starMaterial.opacity = 0.8;
      }

      // ── Lighting updates ──
      const ambColorVal = tempColor
        .set(0x604030)
        .lerp(new THREE.Color(0xf0a868), progress);
      ambientLight.color.copy(ambColorVal);
      ambientLight.intensity = 0.4 + progress * 0.8;
      directionalLight.intensity = 0.8 + progress * 1.7;

      pointLight.position.copy(knightGroup.position);
      pointLight.position.y += 2.0;

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
      }
    };

    // Initialize scene state once
    updateScene(0);
    setLoading(false);

    // 11. GSAP ScrollTrigger timeline for text overlays
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          updateScene(self.progress);
        },
      },
    });

    // Fade in/out configs for 7 Acts
    // Act 1: 0.0 -> 0.15 (peaks at 0.075)
    tl.fromTo(
      act1Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.075 },
      0.0
    ).to(
      act1Ref.current,
      { opacity: 0, y: -30, duration: 0.075 },
      0.075
    );

    // Act 2: 0.15 -> 0.28 (peaks at 0.215)
    tl.fromTo(
      act2Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.065 },
      0.15
    ).to(
      act2Ref.current,
      { opacity: 0, y: -30, duration: 0.065 },
      0.215
    );

    // Act 3: 0.28 -> 0.42 (peaks at 0.35)
    tl.fromTo(
      act3Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.07 },
      0.28
    ).to(
      act3Ref.current,
      { opacity: 0, y: -30, duration: 0.07 },
      0.35
    );

    // Act 4: 0.42 -> 0.56 (peaks at 0.49)
    tl.fromTo(
      act4Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.07 },
      0.42
    ).to(
      act4Ref.current,
      { opacity: 0, y: -30, duration: 0.07 },
      0.49
    );

    // Act 5: 0.56 -> 0.70 (peaks at 0.63)
    tl.fromTo(
      act5Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.07 },
      0.56
    ).to(
      act5Ref.current,
      { opacity: 0, y: -30, duration: 0.07 },
      0.63
    );

    // Act 6: 0.70 -> 0.85 (peaks at 0.775)
    tl.fromTo(
      act6Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.075 },
      0.7
    ).to(
      act6Ref.current,
      { opacity: 0, y: -30, duration: 0.075 },
      0.775
    );

    // Act 7: 0.85 -> 1.0 (remains visible)
    tl.fromTo(
      act7Ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.15 },
      0.85
    );

    // 12. Render / Animation Loop
    const clock = new THREE.Clock();
    const render = () => {
      if (redirectingRef.current) return;

      // Slow particle float upwards inside the particle shader buffer
      const positions = particleGeo.attributes.position.array as Float32Array;
      const progress = tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
      const driftSpeed = progress >= 1.0 ? 0.005 : 0.002;
      const radius = progress >= 1.0 ? 4 : 2;

      for (let i = 0; i < partCount; i++) {
        // Drift Y upward
        positions[i * 3 + 1] += driftSpeed;

        if (positions[i * 3 + 1] > radius) {
          // Reset to bottom of sphere
          positions[i * 3 + 1] = -radius;
          const theta = Math.random() * 2 * Math.PI;
          const r = Math.random() * radius;
          positions[i * 3] = r * Math.cos(theta);
          positions[i * 3 + 2] = r * Math.sin(theta);
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      render();
    }

    // 13. Tab Visibility Handler
    const handleVisibility = () => {
      if (prefersReducedMotion) return;
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
      } else {
        if (!animFrameIdRef.current && !redirectingRef.current) {
          animFrameIdRef.current = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 14. Window Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (prefersReducedMotion) {
        renderer.render(scene, camera);
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

      // Kill scrolltriggers
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();

      // Dispose audio
      audioManager.destroy();

      // Traverse & dispose three assets
      scene.traverse((node) => {
        disposeNode(node);
      });
      renderer.dispose();
    };
  }, []);

  // Final Action Redirect
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

    </div>
  );
}
