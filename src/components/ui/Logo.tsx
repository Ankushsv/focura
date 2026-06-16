"use client";

import React from "react";

interface LogoProps {
  theme?: "ember" | "purple" | "white";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({
  theme = "purple",
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  // Size mapping
  const sizeMap = {
    sm: { text: "text-base", iconSize: 28 },
    md: { text: "text-lg", iconSize: 32 },
    lg: { text: "text-2xl", iconSize: 44 },
  };

  const currentSize = sizeMap[size];

  // Colors
  const dotColor = theme === "ember" ? "#ff6b2b" : theme === "purple" ? "#22d3ee" : "#ffffff";

  return (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* Logo Icon */}
      <svg
        width={currentSize.iconSize}
        height={currentSize.iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          {/* Ember Gradients */}
          <linearGradient id="logoSegEmber1" x1="11" y1="9" x2="11" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff8a4e" />
            <stop offset="100%" stopColor="#ff500b" />
          </linearGradient>
          <linearGradient id="logoSegEmber2" x1="18.5" y1="9" x2="29.5" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff9a5c" />
            <stop offset="100%" stopColor="#ff6b2b" />
          </linearGradient>
          <linearGradient id="logoSegEmber3" x1="18.5" y1="17.5" x2="25.5" y2="17.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff9a5c" />
            <stop offset="100%" stopColor="#ff6b2b" />
          </linearGradient>

          {/* Purple Gradients */}
          <linearGradient id="logoSegPurple1" x1="11" y1="9" x2="11" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="logoSegPurple2" x1="18.5" y1="9" x2="29.5" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="logoSegPurple3" x1="18.5" y1="17.5" x2="25.5" y2="17.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>

          {/* White Gradients */}
          <linearGradient id="logoSegWhite" x1="0" y1="9" x2="40" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </linearGradient>
        </defs>

        {/* Segment 1: Left Vertical Pillar */}
        <rect
          x="11"
          y="9"
          width="5"
          height="22"
          rx="2.5"
          fill={
            theme === "ember"
              ? "url(#logoSegEmber1)"
              : theme === "purple"
              ? "url(#logoSegPurple1)"
              : "url(#logoSegWhite)"
          }
          className="transition-transform duration-300 ease-out origin-left group-hover:scale-y-[1.03]"
        />

        {/* Segment 2: Top Horizontal bar */}
        <rect
          x="18.5"
          y="9"
          width="11"
          height="5"
          rx="2.5"
          fill={
            theme === "ember"
              ? "url(#logoSegEmber2)"
              : theme === "purple"
              ? "url(#logoSegPurple2)"
              : "url(#logoSegWhite)"
          }
          className="transition-transform duration-300 ease-out group-hover:translate-x-[2px]"
        />

        {/* Segment 3: Middle Horizontal bar */}
        <rect
          x="18.5"
          y="17.5"
          width="7"
          height="5"
          rx="2.5"
          fill={
            theme === "ember"
              ? "url(#logoSegEmber3)"
              : theme === "purple"
              ? "url(#logoSegPurple3)"
              : "url(#logoSegWhite)"
          }
          className="transition-transform duration-300 ease-out group-hover:translate-x-[1px]"
        />
      </svg>

      {/* Logo Text */}
      {showText && (
        <span
          className={`font-quicksand font-bold tracking-tight text-white/95 ${currentSize.text}`}
        >
          focura
          <span
            className="font-black transition-all duration-300"
            style={{ color: dotColor }}
          >
            .
          </span>
        </span>
      )}
    </div>
  );
}
