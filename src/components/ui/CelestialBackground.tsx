"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  phase: number;
}

export default function CelestialBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

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
    let particles: Particle[] = [];
    const maxParticles = 60;
    const maxDistance = 110;

    // Handle high DPI screens
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
      particles = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          size: Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.15 + 0.08,
          pulseSpeed: Math.random() * 0.01 + 0.003,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const mouse = mouseRef.current;

      // Update & Draw Particles
      particles.forEach((p) => {
        // Subtle drift movement
        p.x += p.vx;
        p.y += p.vy;

        // Interactive mouse push (repelling force)
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxPushDist = 130;
          if (dist < maxPushDist) {
            const force = (maxPushDist - dist) / maxPushDist;
            const push = force * 22; // push strength
            const angle = Math.atan2(dy, dx);
            // Move smoothly towards target/pushed coordinates
            p.x += Math.cos(angle) * push * 0.05;
            p.y += Math.sin(angle) * push * 0.05;
          }
        }

        // Screen wrap constraints
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pulse opacity slightly
        p.phase += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.phase) * 0.04;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 239, 232, ${Math.max(0.02, currentAlpha)})`;
        ctx.fill();
      });

      // Draw constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.06;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(245, 239, 232, ${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* ── Dynamic Ambient Northern Lights Orbs ── */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-warm-purple/6 blur-[130px] animate-ambient-orb-slow pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-warm-teal/5 blur-[140px] animate-ambient-orb-medium pointer-events-none" />
      <div className="absolute top-[25%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-warm-amber/4 blur-[120px] animate-ambient-orb-fast pointer-events-none" />

      {/* ── Interactive Celestial Particle field Canvas ── */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* ── Giant Astrolabe Circles & Vegvisir (Runic Compass) ── */}
      <div className="absolute -right-32 -bottom-32 sm:-right-48 sm:-bottom-48 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] opacity-[0.025] transition-opacity duration-1000 z-0">
        <svg viewBox="0 0 800 800" width="100%" height="100%" className="animate-astrolabe-spin-cw text-warm-cream">
          {/* Concentric rings */}
          <circle cx="400" cy="400" r="390" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 9" />
          <circle cx="400" cy="400" r="360" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="180 4 20 4 45 4" />
          <circle cx="400" cy="400" r="340" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <circle cx="400" cy="400" r="280" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="400" r="220" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="400" cy="400" r="140" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="2 18" />

          {/* Compass degree ticks */}
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

          {/* Major crosshairs */}
          <line x1="400" y1="20" x2="400" y2="780" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 10" />
          <line x1="20" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 10" />

          {/* Central Vegvisir Morphs */}
          <g transform="translate(400, 400) scale(1.6)" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Center circle */}
            <circle cx="0" cy="0" r="10" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="currentColor" />

            {/* 8 branches of the compass */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              // Runic stems & symbols
              const isDiagonal = angle % 90 !== 0;
              return (
                <g key={`branch-${idx}`} transform={`rotate(${angle})`}>
                  {/* Stem */}
                  <line x1="0" y1="-10" x2="0" y2="-55" />
                  
                  {/* Branch Details */}
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

                      {/* Runic tips */}
                      <path d="M -6,-55 L 0,-50 L 6,-55" />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* ── Giant Astrolabe Outer Counter-Rotating Dial ── */}
      <div className="absolute -right-32 -bottom-32 sm:-right-48 sm:-bottom-48 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] opacity-[0.012] pointer-events-none z-0">
        <svg viewBox="0 0 800 800" width="100%" height="100%" className="animate-astrolabe-spin-ccw text-warm-cream">
          <circle cx="400" cy="400" r="375" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 30 12 30" />
          <circle cx="400" cy="400" r="310" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="40 10 10 10" />
          
          {/* Elder Futhark-inspired runic ring text notches */}
          {[...Array(24)].map((_, i) => {
            const angle = i * 15;
            return (
              <g key={`rune-${i}`} transform={`rotate(${angle} 400 400) translate(400, 50)`}>
                {/* Minimalist runic representation marker */}
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
