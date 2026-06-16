"use client";

import { useEffect, useRef } from "react";
import {
  PALETTE,
  PET_ANIMATIONS,
  type AnimationType,
  type PetStage,
} from "./petFrames";
import { ALL_PET_SPECIES } from "@/components/providers/PetProvider";

interface PixelPetProps {
  speciesId: string;
  animation: AnimationType;
  scale?: number; // pixels per pixel-art pixel (default 4)
  className?: string;
}

const PIXEL_W = 14; // pixel-art grid width
const PIXEL_H = 14; // pixel-art grid height

function getStageForSpecies(speciesId: string): PetStage {
  if (speciesId === "egg") return 0;
  if (speciesId === "hatchling") return 1;
  if (speciesId === "chick") return 1;
  if (speciesId === "bird") return 2;
  if (speciesId === "owl") return 3;

  const lizards = ["charmander", "charmeleon", "charizard", "dragonite", "moltres", "entei", "ho-oh", "rayquaza"];
  if (lizards.includes(speciesId)) return 4;

  const rodents = ["pikachu", "jolteon", "zapdos", "raikou"];
  if (rodents.includes(speciesId)) return 5;

  const turtles = ["squirtle", "vaporeon", "suicune", "keldeo"];
  if (turtles.includes(speciesId)) return 6;

  const foxes = ["eevee", "flareon", "umbreon", "espeon", "shaymin"];
  if (foxes.includes(speciesId)) return 7;

  // All other mythics/legendaries/mistical shapes are Stage 8 (Mystic/Floating)
  return 8;
}

export default function PixelPet({
  speciesId,
  animation,
  scale = 4,
  className,
}: PixelPetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdxRef = useRef(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vy: number; vx: number; color: string; life: number }>>([]);

  const stage = getStageForSpecies(speciesId);
  const canvasW = PIXEL_W * scale;
  const canvasH = PIXEL_H * scale;

  // Find species theme info
  const species = ALL_PET_SPECIES.find((s) => s.id === speciesId) || ALL_PET_SPECIES[0];
  const theme = species.theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animDef = PET_ANIMATIONS[stage][animation];
    frameIdxRef.current = 0;
    particlesRef.current = [];

    // Create Palette Overrides based on Theme
    const overriddenPalette = { ...PALETTE };

    if (theme === "Fire") {
      // Body yellow/purple/blue -> Fire Orange
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#f97316"));
      // Shading -> Deep Red Orange
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#ea580c"));
      // Accent Beak -> Hot Gold
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#eab308"));
    } else if (theme === "Water") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#38bdf8"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#0284c7"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#e0f2fe"));
    } else if (theme === "Electric") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#facc15"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#ca8a04"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#fef08a"));
    } else if (theme === "Grass" || theme === "Nature") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#4ade80"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#16a34a"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#fbcfe8")); // pink flower
    } else if (theme === "Ghost" || theme === "Dark") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#52525b"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#18181b"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#c084fc"));
    } else if (theme === "Psychic" || theme === "Cosmic" || theme === "Creator") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#c084fc"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#7c3aed"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#ffd700"));
    } else if (theme === "Ice" || theme === "Ice-Void") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#bae6fd"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#3b82f6"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#ffffff"));
    } else if (theme === "Dragon") {
      ["Y", "T", "A", "S"].forEach((k) => (overriddenPalette[k] = "#0d9488"));
      ["y", "t", "a", "s"].forEach((k) => (overriddenPalette[k] = "#115e59"));
      ["O", "q"].forEach((k) => (overriddenPalette[k] = "#f59e0b"));
    }

    function spawnParticle() {
      if (Math.random() > 0.4) return;
      let color = "#ffffff";
      if (theme === "Fire") color = ["#f97316", "#ef4444", "#facc15"][Math.floor(Math.random() * 3)];
      else if (theme === "Water") color = ["#38bdf8", "#60a5fa", "#e0f2fe"][Math.floor(Math.random() * 3)];
      else if (theme === "Electric") color = ["#facc15", "#fef08a", "#ffffff"][Math.floor(Math.random() * 3)];
      else if (theme === "Grass" || theme === "Nature") color = ["#4ade80", "#22c55e", "#fbcfe8"][Math.floor(Math.random() * 3)];
      else if (theme === "Ghost" || theme === "Dark") color = ["#c084fc", "#818cf8", "#3f3f46"][Math.floor(Math.random() * 3)];
      else if (theme === "Psychic" || theme === "Cosmic" || theme === "Creator") color = ["#e9d5ff", "#c084fc", "#fef08a"][Math.floor(Math.random() * 3)];
      else if (theme === "Ice" || theme === "Ice-Void") color = ["#bae6fd", "#e0f2fe", "#ffffff"][Math.floor(Math.random() * 3)];
      else if (theme === "Dragon") color = ["#2dd4bf", "#f59e0b", "#0d9488"][Math.floor(Math.random() * 3)];
      else return; // normal animal gets no particles

      particlesRef.current.push({
        x: Math.random() * canvasW,
        y: canvasH - 2,
        vy: -(0.5 + Math.random() * 1.2),
        vx: (Math.random() - 0.5) * 0.4,
        color,
        life: 20 + Math.random() * 20,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      const frame = animDef.frames[frameIdxRef.current % animDef.frames.length];
      ctx.clearRect(0, 0, canvasW, canvasH);

      // 1. Draw base waddling pet matrix
      frame.forEach((row, rowIdx) => {
        for (let col = 0; col < row.length; col++) {
          const char = row[col];
          let color = overriddenPalette[char];
          
          // Eevee tail blush modification
          if (speciesId === "eevee" && char === "P") {
            color = "#fbcfe8";
          }

          if (!color) continue; // transparent
          ctx.fillStyle = color;
          ctx.fillRect(col * scale, rowIdx * scale, scale, scale);
        }
      });

      // 2. Update and draw particles for legendary/themed aura effects
      spawnParticle();
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0 || p.x < 0 || p.x > canvasW || p.y < 0) return false;

        ctx.fillStyle = p.color;
        // Draw 2x2 retro pixel particles
        ctx.fillRect(p.x, p.y, scale / 2 || 2, scale / 2 || 2);
        return true;
      });
    }

    draw();

    const interval = setInterval(() => {
      frameIdxRef.current = (frameIdxRef.current + 1) % animDef.frames.length;
      draw();
    }, animDef.intervalMs);

    return () => clearInterval(interval);
  }, [stage, animation, scale, canvasW, canvasH, theme, speciesId]);

  // Apply custom glow styles based on theme
  const getGlowFilter = () => {
    if (theme === "Fire") return "drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))";
    if (theme === "Water") return "drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))";
    if (theme === "Electric") return "drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))";
    if (theme === "Ghost" || theme === "Dark") return "drop-shadow(0 0 6px rgba(192, 132, 252, 0.6))";
    if (theme === "Psychic" || theme === "Cosmic" || theme === "Creator") return "drop-shadow(0 0 10px rgba(192, 132, 252, 0.8))";
    if (theme === "Ice" || theme === "Ice-Void") return "drop-shadow(0 0 6px rgba(147, 197, 253, 0.6))";
    if (theme === "Dragon") return "drop-shadow(0 0 8px rgba(13, 148, 136, 0.6))";
    return "none";
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      className={className}
      style={{
        imageRendering: "pixelated",
        width: canvasW,
        height: canvasH,
        filter: getGlowFilter(),
      }}
      aria-label={`Pixel art ${speciesId} companion`}
      role="img"
    />
  );
}
