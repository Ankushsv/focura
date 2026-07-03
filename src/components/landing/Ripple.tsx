"use client";

import React, { useState, useEffect } from "react";

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleProps {
  color?: string;
}

export default function Ripple({ color = "rgba(245, 239, 232, 0.16)" }: RippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  useEffect(() => {
    if (ripples.length === 0) return;

    // Clean up older ripples after their animation ends
    const timer = setTimeout(() => {
      setRipples([]);
    }, 600);

    return () => clearTimeout(timer);
  }, [ripples]);

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  return (
    <div
      onClick={addRipple}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit]"
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            backgroundColor: color,
            transform: "scale(0)",
          }}
        />
      ))}
    </div>
  );
}
