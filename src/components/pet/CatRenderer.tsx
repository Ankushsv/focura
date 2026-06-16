"use client";

import React from "react";

interface CatRendererProps {
  animation: string;
  className?: string;
}

export default function CatRenderer({ animation, className = "" }: CatRendererProps) {
  // Map timer/companion states to renderer states
  let state = animation;
  if (state === "dance") state = "idle-happy";
  if (state === "stretch") state = "idle-stretch";
  if (state === "read") state = "reading";

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: "80px", height: "80px" }}>
      {/* Self-contained CSS Animations */}
      <style jsx>{`
        .cat-container {
          width: 80px;
          height: 80px;
          position: relative;
        }

        /* Vector origins */
        .head {
          transform-origin: 40px 48px;
        }
        .tail {
          transform-origin: 56px 52px;
        }
        .ear-l {
          transform-origin: 30px 32px;
        }
        .ear-r {
          transform-origin: 50px 32px;
        }
        .leg-fl {
          transform-origin: 34px 58px;
        }
        .leg-fr {
          transform-origin: 40px 58px;
        }
        .leg-bl {
          transform-origin: 48px 58px;
        }
        .leg-br {
          transform-origin: 54px 58px;
        }
        .eye-l, .eye-r {
          transform-origin: center;
        }

        /* ── IDLE STATE ── */
        .state-idle .tail {
          animation: tail-wag 2s ease-in-out infinite;
        }
        .state-idle .head {
          animation: head-breath 3s ease-in-out infinite;
        }
        .state-idle .eye-l, .state-idle .eye-r {
          animation: eye-blink 4s infinite;
        }

        /* ── HAPPY IDLE (DANCE) ── */
        .state-idle-happy .head {
          animation: head-happy 0.8s ease-in-out infinite alternate;
        }
        .state-idle-happy .tail {
          animation: tail-fast-wag 0.4s linear infinite;
        }
        .state-idle-happy .eye-l, .state-idle-happy .eye-r {
          animation: eye-happy 0.8s infinite alternate;
        }

        /* ── STRETCH IDLE ── */
        .state-idle-stretch .cat-svg {
          animation: cat-stretch-anim 2.5s ease-in-out infinite;
        }
        .state-idle-stretch .tail {
          animation: tail-stretch-anim 2.5s ease-in-out infinite;
        }

        /* ── READING STATE ── */
        .state-reading .head {
          animation: head-read 4s ease-in-out infinite;
        }
        .state-reading .eye-l, .state-reading .eye-r {
          animation: eye-read-blink 5s infinite;
        }

        /* ── WALK STATE ── */
        .state-walk .head {
          animation: head-walk 0.6s ease-in-out infinite alternate;
        }
        .state-walk .leg-fl {
          animation: leg-swing-forward 0.6s ease-in-out infinite alternate;
        }
        .state-walk .leg-br {
          animation: leg-swing-forward 0.6s ease-in-out infinite alternate;
        }
        .state-walk .leg-fr {
          animation: leg-swing-backward 0.6s ease-in-out infinite alternate;
        }
        .state-walk .leg-bl {
          animation: leg-swing-backward 0.6s ease-in-out infinite alternate;
        }
        .state-walk .tail {
          animation: tail-wag 1s ease-in-out infinite;
        }

        /* ── RUN STATE ── */
        .state-run .head {
          animation: head-run 0.3s ease-in-out infinite alternate;
        }
        .state-run .leg-fl {
          animation: leg-run-swing-forward 0.3s linear infinite alternate;
        }
        .state-run .leg-br {
          animation: leg-run-swing-forward 0.3s linear infinite alternate;
        }
        .state-run .leg-fr {
          animation: leg-run-swing-backward 0.3s linear infinite alternate;
        }
        .state-run .leg-bl {
          animation: leg-run-swing-backward 0.3s linear infinite alternate;
        }
        .state-run .tail {
          animation: tail-fast-wag 0.25s linear infinite;
        }
        .state-run .cat-svg {
          animation: body-run-bob 0.3s ease-in-out infinite alternate;
        }

        /* ── JUMP STATE ── */
        .state-jump .cat-svg {
          animation: body-jump 0.6s ease-out infinite;
        }
        .state-jump .leg-fl, .state-jump .leg-fr {
          animation: legs-jump-front 0.6s ease-out infinite;
        }
        .state-jump .leg-bl, .state-jump .leg-br {
          animation: legs-jump-back 0.6s ease-out infinite;
        }
        .state-jump .tail {
          animation: tail-jump-anim 0.6s ease-out infinite;
        }

        /* ── SCREAM STATE ── */
        .state-scream .cat-svg {
          animation: body-shiver 0.1s linear infinite;
        }
        .state-scream .head {
          transform: scale(1.05) translate(-1px, -1px);
        }
        .state-scream .mouth {
          animation: mouth-scream-open 0.4s ease-out forwards;
        }
        .state-scream .ear-l {
          transform: rotate(-15deg);
        }
        .state-scream .ear-r {
          transform: rotate(15deg);
        }
        .state-scream .tail {
          animation: tail-puff 0.15s linear infinite alternate;
        }

        /* ── CRY STATE ── */
        .state-cry .head {
          transform: translateY(3px) rotate(3deg);
        }
        .state-cry .ear-l {
          transform: rotate(-10deg) translateY(1.5px);
        }
        .state-cry .ear-r {
          transform: rotate(10deg) translateY(1.5px);
        }
        .state-cry .eye-l, .state-cry .eye-r {
          animation: eye-sad 1s infinite alternate;
        }
        .state-cry .tail {
          animation: tail-sad 3s ease-in-out infinite;
        }
        .tear-drop {
          animation: tear-fall 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
        }
        .tear-drop-2 {
          animation: tear-fall 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
          animation-delay: 0.6s;
        }

        /* ── SLEEP STATE ── */
        .state-sleep .cat-svg {
          transform: rotate(15deg) translateY(5px) scale(0.95);
        }
        .state-sleep .eye-l, .state-sleep .eye-r {
          transform: scaleY(0.1);
        }
        .state-sleep .head {
          animation: head-sleep 3.5s ease-in-out infinite;
        }
        .state-sleep .tail {
          animation: tail-sad 4s ease-in-out infinite;
        }
        .sleep-zzz {
          animation: zzz-bubble 3.2s ease-in-out infinite;
          transform-origin: bottom left;
        }

        /* ── KEYFRAMES ── */
        @keyframes tail-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(22deg); }
        }
        @keyframes tail-fast-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(35deg); }
        }
        @keyframes tail-sad {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes tail-puff {
          0%, 100% { transform: scaleY(1.2) rotate(10deg); }
          50% { transform: scaleY(1.2) rotate(-5deg); }
        }
        @keyframes head-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(1.5px); }
        }
        @keyframes head-happy {
          0% { transform: rotate(-5deg) translateY(0); }
          100% { transform: rotate(5deg) translateY(-2px); }
        }
        @keyframes head-walk {
          0% { transform: translateY(-1px) rotate(-1deg); }
          100% { transform: translateY(1.5px) rotate(1deg); }
        }
        @keyframes head-run {
          0% { transform: translateY(-2px) rotate(-3deg); }
          100% { transform: translateY(2px) rotate(3deg); }
        }
        @keyframes head-read {
          0%, 100% { transform: rotate(8deg) translateY(1px); }
          50% { transform: rotate(12deg) translateY(2px); }
        }
        @keyframes head-sleep {
          0%, 100% { transform: translateY(1px) scale(0.98); }
          50% { transform: translateY(2px) scale(1.01); }
        }
        @keyframes eye-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes eye-read-blink {
          0%, 93%, 100% { transform: scaleY(0.7); }
          96% { transform: scaleY(0.1); }
        }
        @keyframes eye-happy {
          0% { transform: scale(1); }
          100% { transform: scale(1.2) scaleY(0.7); }
        }
        @keyframes eye-sad {
          0%, 100% { transform: scaleY(0.5) translateY(0.5px); }
          50% { transform: scaleY(0.4) translateY(1px); }
        }
        @keyframes leg-swing-forward {
          0% { transform: rotate(-22deg); }
          100% { transform: rotate(22deg); }
        }
        @keyframes leg-swing-backward {
          0% { transform: rotate(22deg); }
          100% { transform: rotate(-22deg); }
        }
        @keyframes leg-run-swing-forward {
          0% { transform: rotate(-40deg) translateY(-1px); }
          100% { transform: rotate(40deg) translateY(1px); }
        }
        @keyframes leg-run-swing-backward {
          0% { transform: rotate(40deg) translateY(1px); }
          100% { transform: rotate(-40deg) translateY(-1px); }
        }
        @keyframes body-run-bob {
          0% { transform: translateY(-2px); }
          100% { transform: translateY(1.5px); }
        }
        @keyframes body-jump {
          0%, 100% { transform: scaleY(0.8) translateY(4px); }
          30% { transform: scaleY(1.15) translateY(-5px); }
          70% { transform: scaleY(0.95) translateY(-2px); }
        }
        @keyframes legs-jump-front {
          0%, 100% { transform: translateY(1px); }
          30% { transform: rotate(-20deg) translateY(-3px); }
          70% { transform: rotate(10deg); }
        }
        @keyframes legs-jump-back {
          0%, 100% { transform: translateY(1px); }
          30% { transform: rotate(25deg) translateY(-1px); }
          70% { transform: rotate(-5deg); }
        }
        @keyframes tail-jump-anim {
          0%, 100% { transform: rotate(-30deg); }
          30% { transform: rotate(10deg); }
          70% { transform: rotate(-15deg); }
        }
        @keyframes cat-stretch-anim {
          0%, 100% { transform: scaleX(1); }
          40% { transform: scaleX(1.18) skewX(-8deg) translateY(1px); }
          60% { transform: scaleX(1.18) skewX(-8deg) translateY(1px); }
        }
        @keyframes tail-stretch-anim {
          0%, 100% { transform: rotate(0); }
          40% { transform: rotate(-45deg) translateX(-4px); }
          60% { transform: rotate(-45deg) translateX(-4px); }
        }
        @keyframes mouth-scream-open {
          0% { transform: scale(0.1); }
          100% { transform: scale(1.4) translateY(0.5px); }
        }
        @keyframes body-shiver {
          0% { transform: translate(0.5px, 0.5px) rotate(0.5deg); }
          50% { transform: translate(-0.5px, -0.5px) rotate(-0.5deg); }
          100% { transform: translate(0.5px, 0.5px) rotate(0.5deg); }
        }
        @keyframes tear-fall {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.9; }
          70% { transform: translate(0, 20px); opacity: 0.8; }
          100% { transform: translate(0, 25px); opacity: 0; }
        }
        @keyframes zzz-bubble {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          40% { opacity: 0.8; }
          80% { transform: translate(15px, -20px) scale(1); opacity: 0.4; }
          100% { transform: translate(18px, -25px) scale(0.8); opacity: 0; }
        }
      `}</style>

      {/* SVG Canvas for Ginger Cat */}
      <div className={`cat-container state-${state}`}>
        <svg
          viewBox="0 0 80 80"
          className="cat-svg w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
          style={{ transition: "all 0.25s ease-in-out" }}
        >
          {/* Shadow */}
          <ellipse cx="45" cy="61" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />

          {/* TAIL */}
          <g className="tail">
            {/* Fluffy tail base */}
            <path d="M 52 50 C 58 50, 64 45, 62 34 C 61 28, 57 28, 59 22 C 61 16, 68 18, 66 12 C 64 6, 55 12, 57 20 C 59 28, 52 38, 48 44" fill="url(#ginger-stripe)" />
            <path d="M 52 50 C 58 50, 64 45, 62 34 C 61 28, 57 28, 59 22 C 61 16, 68 18, 66 12 C 64 6, 55 12, 57 20 C 59 28, 52 38, 48 44 Z" fill="none" stroke="#b85f2c" strokeWidth="1" />
            {/* White tip */}
            <path d="M 66 12 C 65 10, 60 11, 57 14 C 55 12, 60 7, 63 8 C 65 8, 67 9, 66 12 Z" fill="#ffffff" />
          </g>

          {/* LEGS BACK */}
          <g className="legs-back">
            {/* Left back leg */}
            <rect className="leg-bl" x="46" y="48" width="5" height="11" rx="2.5" fill="#ca6a30" stroke="#a04d1c" strokeWidth="1" />
            {/* Right back leg */}
            <rect className="leg-br" x="52" y="48" width="5" height="11" rx="2.5" fill="#e28743" stroke="#b85f2c" strokeWidth="1" />
          </g>

          {/* BODY */}
          <g className="body">
            {/* Torso */}
            <path d="M 32 44 L 54 44 Q 58 44 58 49 L 58 52 Q 58 58 52 58 L 34 58 Q 30 58 30 52 L 30 49 Q 30 44 32 44" fill="url(#ginger-body)" stroke="#b85f2c" strokeWidth="1" />
            {/* Cream Chest */}
            <path d="M 30 47 Q 36 47 38 52 Q 38 58 33 58 C 31 58, 30 54, 30 52 Z" fill="#fcf6ec" />
            {/* Orange Stripes */}
            <path d="M 44 44 L 43 50 L 46 50 Z" fill="#ca6a30" />
            <path d="M 49 44 L 48 51 L 51 51 Z" fill="#ca6a30" />
            <path d="M 54 45 L 53 51 L 55 51 Z" fill="#ca6a30" />
          </g>

          {/* LEGS FRONT */}
          <g className="legs-front">
            {/* Left front leg */}
            <rect className="leg-fl" x="32" y="48" width="5" height="11" rx="2.5" fill="#ca6a30" stroke="#a04d1c" strokeWidth="1" />
            {/* Right front leg */}
            <rect className="leg-fr" x="38" y="48" width="5" height="11" rx="2.5" fill="#e28743" stroke="#b85f2c" strokeWidth="1" />
            {/* White socks */}
            <rect className="leg-fl" x="32" y="55" width="5" height="4" rx="1.5" fill="#ffffff" />
            <rect className="leg-fr" x="38" y="55" width="5" height="4" rx="1.5" fill="#ffffff" />
          </g>

          {/* HEAD */}
          <g className="head">
            {/* Left Ear */}
            <path className="ear-l" d="M 26 35 L 23 20 L 35 29 Z" fill="#e28743" stroke="#b85f2c" strokeWidth="1" />
            <path className="ear-l" d="M 28 33 L 26 23 L 33 29 Z" fill="#fda4af" />
            
            {/* Right Ear */}
            <path className="ear-r" d="M 41 29 L 53 20 L 50 35 Z" fill="#e28743" stroke="#b85f2c" strokeWidth="1" />
            <path className="ear-r" d="M 43 29 L 50 23 L 48 33 Z" fill="#fda4af" />

            {/* Face/Skull */}
            <circle cx="38" cy="38" r="12" fill="url(#ginger-body)" stroke="#b85f2c" strokeWidth="1" />
            {/* Cream Face Cheek patches */}
            <path d="M 28 42 Q 33 42 35 38 Q 33 34 30 35 Q 26 38 28 42 Z" fill="#fcf6ec" />
            <path d="M 48 42 Q 43 42 41 38 Q 43 34 46 35 Q 50 38 48 42 Z" fill="#fcf6ec" />

            {/* Whiskers Left */}
            <line x1="24" y1="38" x2="15" y2="36" stroke="#b85f2c" strokeWidth="1" />
            <line x1="24" y1="40" x2="13" y2="40" stroke="#b85f2c" strokeWidth="1" />
            <line x1="24" y1="42" x2="16" y2="44" stroke="#b85f2c" strokeWidth="1" />

            {/* Whiskers Right */}
            <line x1="52" y1="38" x2="61" y2="36" stroke="#b85f2c" strokeWidth="1" />
            <line x1="52" y1="40" x2="63" y2="40" stroke="#b85f2c" strokeWidth="1" />
            <line x1="52" y1="42" x2="60" y2="44" stroke="#b85f2c" strokeWidth="1" />

            {/* Left Eye */}
            <g className="eye-l-group">
              <ellipse className="eye-l" cx="32" cy="35" rx="1.8" ry="2.2" fill="#18181b" />
              <circle className="eye-l" cx="31.2" cy="34" r="0.6" fill="#ffffff" />
            </g>
            
            {/* Right Eye */}
            <g className="eye-r-group">
              <ellipse className="eye-r" cx="44" cy="35" rx="1.8" ry="2.2" fill="#18181b" />
              <circle className="eye-r" cx="43.2" cy="34" r="0.6" fill="#ffffff" />
            </g>

            {/* Nose & Mouth */}
            <polygon points="37,38 39,38 38,39" fill="#fda4af" />
            <path d="M 36.5 40 Q 38 41 38 40 Q 38 41 39.5 40" fill="none" stroke="#18181b" strokeWidth="0.8" strokeLinecap="round" />
            <path className="mouth" d="M 37 40 Q 38 43 39 40 Z" fill="#f43f5e" style={{ transformOrigin: "38px 40px" }} />
          </g>

          {/* Reading Book Element */}
          {state === "reading" && (
            <g className="book-element" style={{ transform: "translate(-2px, 8px)" }}>
              {/* Cover */}
              <path d="M 24 53 L 24 62 L 38 64 L 52 62 L 52 53 Z" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1" />
              {/* Pages */}
              <path d="M 26 52 L 38 55 L 50 52 L 50 60 L 38 62 L 26 60 Z" fill="#fef08a" />
              {/* Text lines */}
              <line x1="29" y1="55" x2="35" y2="56.5" stroke="#7c2d12" strokeWidth="0.8" opacity="0.6" />
              <line x1="29" y1="57" x2="34" y2="58.5" stroke="#7c2d12" strokeWidth="0.8" opacity="0.6" />
              <line x1="41" y1="56.5" x2="47" y2="55" stroke="#7c2d12" strokeWidth="0.8" opacity="0.6" />
              <line x1="42" y1="58.5" x2="47" y2="57" stroke="#7c2d12" strokeWidth="0.8" opacity="0.6" />
            </g>
          )}

          {/* Fallback gradients & patterns */}
          <defs>
            <linearGradient id="ginger-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f39c12" />
              <stop offset="60%" stopColor="#e28743" />
              <stop offset="100%" stopColor="#ca6a30" />
            </linearGradient>
            <linearGradient id="ginger-stripe" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f2994a" />
              <stop offset="100%" stopColor="#d35400" />
            </linearGradient>
          </defs>
        </svg>

        {/* ── CRY STATE TEARDROPS ── */}
        {state === "cry" && (
          <>
            <svg viewBox="0 0 80 80" className="absolute inset-0 pointer-events-none">
              <path className="tear-drop" d="M 31 38 Q 31.5 41 31 43 Q 30.5 41 31 38 Z" fill="#38bdf8" style={{ transformOrigin: "31px 38px" }} />
              <path className="tear-drop-2" d="M 45 38 Q 45.5 41 45 43 Q 44.5 41 45 38 Z" fill="#38bdf8" style={{ transformOrigin: "45px 38px" }} />
            </svg>
          </>
        )}

        {/* ── SLEEP STATE Zzzs ── */}
        {state === "sleep" && (
          <div className="absolute top-2 left-12 pointer-events-none sleep-zzz flex flex-col gap-1 text-[8px] font-black text-primary font-mono select-none">
            <span>Z</span>
            <span className="text-[10px] ml-1.5 opacity-80">Z</span>
            <span className="text-[12px] ml-3 opacity-60">z</span>
          </div>
        )}
      </div>
    </div>
  );
}
