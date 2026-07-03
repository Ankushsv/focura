"use client";

import { useEffect, useRef, useState } from "react";

interface TrailParticle {
  r: number;        // distance from rotation center (center of screen)
  theta: number;    // current angle
  omega: number;    // angular speed
  size: number;
  alpha: number;
  history: { x: number; y: number }[];
  maxHistory: number;
}

interface SandParticle {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  alpha: number;
}

export default function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let trailParticles: TrailParticle[] = [];
    let sandParticles: SandParticle[] = [];
    let sweepAngle = 0;

    const maxTrails = 40;
    const maxSand = 30;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      initParticles();
    };

    const initParticles = () => {
      trailParticles = [];
      sandParticles = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      const diag = Math.sqrt(width * width + height * height);

      // Concentric star trails rotating around the center of the viewport
      for (let i = 0; i < maxTrails; i++) {
        // Distribute radii between 50px and 85% of screen diagonal
        const r = Math.random() * (diag * 0.7) + 50;
        const theta = Math.random() * Math.PI * 2;
        trailParticles.push({
          r,
          theta,
          omega: (Math.random() * 0.0003 + 0.0001) * (Math.random() > 0.5 ? 1 : -1), // Random clockwise/counter-clockwise slow drift
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.15 + 0.06,
          history: [],
          maxHistory: Math.floor(Math.random() * 18 + 12),
        });
      }

      // Hourglass vertical sand drift
      for (let i = 0; i < maxSand; i++) {
        sandParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: Math.random() * 0.3 + 0.12,
          vx: (Math.random() - 0.5) * 0.03,
          size: Math.random() * 1.2 + 0.4,
          alpha: Math.random() * 0.1 + 0.04,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;

      // Dynamic theme color checking
      const isLight = document.documentElement.classList.contains("light-theme");
      const rgbColor = isLight ? "26, 23, 20" : "245, 239, 232"; // Dark charcoal for light mode, light cream for dark mode

      // ── 1. Star Trails ──
      trailParticles.forEach((p) => {
        p.theta += p.omega;
        const x = cx - p.r * Math.cos(p.theta);
        const y = cy - p.r * Math.sin(p.theta);

        p.history.push({ x, y });
        if (p.history.length > p.maxHistory) {
          p.history.shift();
        }

        for (let i = 1; i < p.history.length; i++) {
          const ptStart = p.history[i - 1];
          const ptEnd = p.history[i];
          const ratio = i / p.history.length;

          ctx.beginPath();
          ctx.moveTo(ptStart.x, ptStart.y);
          ctx.lineTo(ptEnd.x, ptEnd.y);
          ctx.strokeStyle = `rgba(${rgbColor}, ${p.alpha * ratio * 0.4})`;
          ctx.lineWidth = p.size * ratio;
          ctx.stroke();
        }
      });

      // ── 2. Hourglass Sand ──
      sandParticles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbColor}, ${p.alpha})`;
        ctx.fill();
      });

      // ── 3. Sweeping Chronometer Line ──
      sweepAngle += 0.0004;
      if (sweepAngle > Math.PI * 2) {
        sweepAngle = 0;
      }
      
      const lineLen = Math.max(width, height) * 0.8;
      const lx = cx - lineLen * Math.cos(sweepAngle);
      const ly = cy - lineLen * Math.sin(sweepAngle);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = `rgba(${rgbColor}, 0.015)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Ambient backgrounds */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-warm-purple/5 blur-[140px] animate-ambient-orb-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-warm-teal/4 blur-[150px] animate-ambient-orb-medium pointer-events-none" />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Astrolabe CW Rotor */}
      <div className="absolute -right-32 -bottom-32 sm:-right-48 sm:-bottom-48 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] opacity-[0.03] dark:opacity-[0.015] transition-opacity duration-1000 z-0">
        <svg viewBox="0 0 800 800" width="100%" height="100%" className="animate-astrolabe-spin-cw text-warm-text">
          <circle cx="400" cy="400" r="390" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 9" />
          <circle cx="400" cy="400" r="360" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="180 4 20 4 45 4" />
          <circle cx="400" cy="400" r="340" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="400" cy="400" r="280" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="400" r="220" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="400" cy="400" r="140" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="2 18" />

          {[...Array(72)].map((_, i) => {
            const angle = i * 5;
            const length = i % 2 === 0 ? 15 : 8;
            return (
              <line
                key={`tick-${i}`}
                x1="400"
                y1={400 - 360}
                x2="400"
                y2={400 - 360 + length}
                stroke="currentColor"
                strokeWidth={i % 2 === 0 ? 1 : 0.6}
                transform={`rotate(${angle} 400 400)`}
              />
            );
          })}

          <line x1="400" y1="20" x2="400" y2="780" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 10" />
          <line x1="20" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 10" />

          <g transform="translate(400, 400) scale(1.6)" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="0" cy="0" r="10" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="currentColor" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              const isDiagonal = angle % 90 !== 0;
              return (
                <g key={`branch-${idx}`} transform={`rotate(${angle})`}>
                  <line x1="0" y1="-10" x2="0" y2="-55" />
                  {isDiagonal ? (
                    <>
                      <line x1="-5" y1="-30" x2="5" y2="-30" />
                      <line x1="-3.5" y1="-35" x2="0" y2="-30" />
                      <line x1="3.5" y1="-35" x2="0" y2="-30" />
                      <circle cx="0" cy="-45" r="3" />
                    </>
                  ) : (
                    <>
                      <line x1="-7" y1="-25" x2="7" y2="-25" />
                      <line x1="-7" y1="-20" x2="0" y2="-25" />
                      <line x1="7" y1="-20" x2="0" y2="-25" />
                      <line x1="-5" y1="-40" x2="5" y2="-40" />
                      <line x1="-5" y1="-45" x2="5" y2="-45" />
                      <path d="M -6,-55 L 0,-50 L 6,-55" />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Astrolabe CCW Rotor */}
      <div className="absolute -right-32 -bottom-32 sm:-right-48 sm:-bottom-48 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] opacity-[0.015] dark:opacity-[0.007]" pointer-events-none="true" z-0="true">
        <svg viewBox="0 0 800 800" width="100%" height="100%" className="animate-astrolabe-spin-ccw text-warm-text">
          <circle cx="400" cy="400" r="375" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 30 12 30" />
          <circle cx="400" cy="400" r="310" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="40 10 10 10" />
          {[...Array(24)].map((_, i) => {
            const angle = i * 15;
            return (
              <g key={`rune-${i}`} transform={`rotate(${angle} 400 400) translate(400, 50)`}>
                <line x1="0" y1="-5" x2="0" y2="5" stroke="currentColor" strokeWidth="2" />
                <path d="M -4,-2 L 0,3 L 4,-2" fill="none" stroke="currentColor" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
