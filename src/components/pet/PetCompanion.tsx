"use client";

import { useEffect, useRef, useState } from "react";
import { bus } from "@/lib/events";
import { useXp } from "@/components/providers/XpProvider";
import { usePet, ALL_PET_SPECIES } from "@/components/providers/PetProvider";
import PixelPet from "./PixelPet";
import CatRenderer from "./CatRenderer";
import Button from "@/components/ui/Button";
import { type AnimationType } from "./petFrames";
import { playPetSound } from "@/lib/pet/sounds";

const IDLE_MESSAGES = [
  "Peace and quiet. Perfect for focus.",
  "Resting is part of the progress.",
  "Taking a break is natural. Return when ready.",
  "The consistency streak is strong.",
  "Drink water. Take a quick breathing break.",
  "Ready for the next session. Let's do this.",
];

const XP_MESSAGES = [
  "Great job! Keep it up.",
  "Awesome progress!",
  "Keep building momentum!",
  "Task completed!",
];

const IDLE_ANIMATIONS: AnimationType[] = ["idle", "read", "stretch", "sleep", "walk"];

const getNavTargets = () => {
  if (typeof window === "undefined") return [];
  const items = document.querySelectorAll(
    "header nav a, header button, header .flex.items-center.gap-4 a, header .flex.items-center.gap-4 button, header a.group"
  );
  return Array.from(items);
};

const triggerLinkInteraction = (el: HTMLElement) => {
  el.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s";
  el.style.transform = "scale(1.15) translateY(-5px)";
  el.style.filter = "drop-shadow(0 0 8px rgba(240, 168, 104, 0.8))";
  
  setTimeout(() => {
    el.style.transform = "scale(0.95) translateY(2px)";
    setTimeout(() => {
      el.style.transform = "";
      el.style.filter = "";
    }, 150);
  }, 350);
};

export default function PetCompanion() {
  const { totalXp, level } = useXp();
  const {
    activePet,
    petStats,
    petUsage,
    feedPet,
    activeBattleMove,
    clearBattleMove,
    evolutionCelebration,
    clearEvolutionCelebration,
    soundEnabled,
  } = usePet();

  const isCat = activePet.id === "cat";

  const [message, setMessage] = useState("Your journey begins here.");
  const [animation, setAnimation] = useState<AnimationType | string>("idle");
  const [visible, setVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Coordinates (Percentage for normal pets, Pixels for Cat)
  const [posX, setPosX] = useState(85);
  const [posY, setPosY] = useState(80);
  const [flipX, setFlipX] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);

  // Snapping and Dragging States (Cat specific)
  const [isSnappedToNavbar, setIsSnappedToNavbar] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [activeAction, setActiveAction] = useState<"jump" | "run" | "scream" | "cry" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const bounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const idleAnimTimer = useRef<ReturnType<typeof setTimeout>>();
  const walkInterval = useRef<ReturnType<typeof setInterval>>();

  // Show pet after short delay (mount animation)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Initialize Coordinates based on Pet Species
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isCat) {
      const headerEl = document.querySelector("header");
      const navbarBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 80;
      setPosX(window.innerWidth / 2);
      setPosY(navbarBottom - 22);
      setIsSnappedToNavbar(true);
    } else {
      setPosX(85);
      setPosY(80);
      setIsSnappedToNavbar(false);
    }
  }, [activePet.id, isCat]);

  // Keep responsive position of navbar-snapped Cat on window resize
  useEffect(() => {
    if (typeof window === "undefined" || !isCat) return;

    const handleResize = () => {
      if (isSnappedToNavbar) {
        const headerEl = document.querySelector("header");
        const navbarBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 80;
        setPosY(navbarBottom - 22);
        setPosX((prev) => Math.min(window.innerWidth - 50, Math.max(50, prev)));
      } else {
        setPosX((prev) => Math.min(window.innerWidth - 50, Math.max(50, prev)));
        setPosY((prev) => Math.min(window.innerHeight - 50, Math.max(50, prev)));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCat, isSnappedToNavbar]);

  // Check stats for tired/sleepy state
  useEffect(() => {
    if (isFocusing) return;
    if (petStats.energy < 30) {
      setAnimation("sleep");
      setMessage("Time to recharge. 😴");
    } else if (petStats.happiness < 30) {
      setAnimation("sleep");
      setMessage("Feeling blocked? Let's start a quick focus session! 🚀");
    } else {
      setAnimation("idle");
    }
  }, [petStats.energy, petStats.happiness, isFocusing]);

  // Wander / Walk Loop
  useEffect(() => {
    walkInterval.current = setInterval(() => {
      // Only wander if not actively focusing, sleeping, dragging, or in action
      if (isFocusing || animation === "sleep" || !visible || isDragging || activeAction) return;

      if (isCat) {
        if (isSnappedToNavbar) {
          // Walk along navbar contents
          const targets = getNavTargets();
          if (targets.length > 0) {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)] as HTMLElement;
            const targetRect = randomTarget.getBoundingClientRect();
            const destX = targetRect.left + targetRect.width / 2;

            setFlipX(destX < posX);
            setAnimation("walk");
            setPosX(destX);

            // Trigger Link interaction upon reaching
            setTimeout(() => {
              if (activePet.id === "cat" && !isDragging && !activeAction) {
                setAnimation("dance");
                triggerLinkInteraction(randomTarget);
                if (soundEnabled) playPetSound("cat-meow");
                setMessage(`Pawing at ${randomTarget.innerText || "navbar item"}! 🐾`);
                
                setTimeout(() => {
                  setAnimation("idle");
                }, 2000);
              }
            }, 2200);
          }
        } else {
          // Wander left/right on current floor height
          const nextX = Math.floor(Math.random() * (window.innerWidth - 160)) + 80;
          setFlipX(nextX < posX);
          setAnimation("walk");
          setPosX(nextX);

          setTimeout(() => {
            if (activePet.id === "cat" && !isDragging && !activeAction) {
              setAnimation("idle");
            }
          }, 3000);
        }
      } else {
        // Original wander loop for other pixel pets
        setAnimation("walk");
        const nextX = Math.floor(Math.random() * 75) + 5;
        const nextY = Math.floor(Math.random() * 70) + 15;
        
        setPosX((currentX) => {
          setFlipX(nextX < currentX);
          return nextX;
        });
        setPosY(nextY);

        setTimeout(() => {
          setAnimation((prev) => {
            if (isFocusing) return "read";
            if (petStats.energy < 30) return "sleep";
            return "idle";
          });
        }, 5000);
      }
    }, 12000);

    return () => clearInterval(walkInterval.current);
  }, [isFocusing, animation, visible, petStats.energy, isCat, isSnappedToNavbar, posX, posY, isDragging, activeAction, soundEnabled, activePet.id]);

  // Global events listener
  useEffect(() => {
    function react(msg: string, anim: AnimationType | string, durationMs = 3000) {
      setMessage(msg);
      setAnimation(anim);
      clearTimeout(bounceTimer.current);
      bounceTimer.current = setTimeout(() => {
        if (isFocusing) setAnimation("read");
        else if (petStats.energy < 30) setAnimation("sleep");
        else setAnimation("idle");
      }, durationMs);
    }

    const offXp = bus.on("xp:awarded", ({ amount }: { amount: number }) => {
      react(
        `+${amount} XP! ${XP_MESSAGES[Math.floor(Math.random() * XP_MESSAGES.length)]}`,
        "dance",
        2200
      );
      if (soundEnabled && isCat) playPetSound("cat-meow");
    });
    const offLevel = bus.on("level:up", ({ level: lv }: { level: number }) => {
      react(`LEVEL ${lv}! Look at you go! 🎉`, "dance", 4000);
      if (soundEnabled && isCat) playPetSound("cat-meow");
    });
    const offReact = bus.on("pet:react", ({ message: msg }: { message: string }) =>
      react(msg, "walk", 3000)
    );

    const offTimerStart = bus.on("timer:start", () => {
      setIsFocusing(true);
      setAnimation("read");
      setMessage("Focus session active. Let's do this! 🚀");
    });
    const offTimerPause = bus.on("timer:pause", () => {
      setIsFocusing(false);
      setAnimation("idle");
      setMessage("Focus session paused. Let's take a quick break. 🧘");
    });
    const offTimerResume = bus.on("timer:resume", () => {
      setIsFocusing(true);
      setAnimation("read");
      setMessage("Focus session resumed! 🚀");
    });
    const offTimerStop = bus.on("timer:stop", () => {
      setIsFocusing(false);
      setAnimation("idle");
      setMessage("Focus session completed! Great work! 🌙");
    });

    // Rotate idle messages
    const msgInterval = setInterval(() => {
      if (!isFocusing) {
        setMessage(IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);
      }
    }, 28000);

    // Rotate idle animations
    function scheduleIdleAnim() {
      const delay = 15000 + Math.random() * 20000;
      idleAnimTimer.current = setTimeout(() => {
        if (animation === "idle" && !isFocusing) {
          const anim = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
          setAnimation(anim);
          setTimeout(() => {
            if (!isFocusing) setAnimation("idle");
          }, 5000);
          scheduleIdleAnim();
        }
      }, delay);
    }
    scheduleIdleAnim();

    return () => {
      offXp();
      offLevel();
      offReact();
      offTimerStart();
      offTimerPause();
      offTimerResume();
      offTimerStop();
      clearInterval(msgInterval);
      clearTimeout(bounceTimer.current);
      clearTimeout(idleAnimTimer.current);
    };
  }, [animation, isFocusing, petStats.energy, isCat, soundEnabled]);

  // Handle auto-clear for battle moves
  useEffect(() => {
    if (activeBattleMove) {
      const t = setTimeout(() => {
        clearBattleMove();
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [activeBattleMove, clearBattleMove]);

  // Pointer event handlers for dragging the Cat
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only drag with left click
    if (activeAction) return; // Disable drag during active play actions
    
    setIsDragging(true);
    setIsSnappedToNavbar(false);
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartOffset.current = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const nextX = e.clientX - dragStartOffset.current.x;
    const nextY = e.clientY - dragStartOffset.current.y;
    
    // Boundary offsets
    const boundedX = Math.max(40, Math.min(window.innerWidth - 40, nextX));
    const boundedY = Math.max(40, Math.min(window.innerHeight - 40, nextY));
    
    setPosX(boundedX);
    setPosY(boundedY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const headerEl = document.querySelector("header");
    if (headerEl) {
      const headerRect = headerEl.getBoundingClientRect();
      // Snap to navbar if dropped near the top header zone
      if (e.clientY <= headerRect.bottom + 50) {
        setIsSnappedToNavbar(true);
        setPosY(headerRect.bottom - 22);
        setMessage("Sitting on the navbar! 🐈");
        if (soundEnabled) playPetSound("cat-meow");
      } else {
        setMessage("Chilling here! 🛋️");
        if (soundEnabled) playPetSound("cat-meow");
      }
    }
  };

  // Play Actions triggers
  const handlePlayJump = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAction) return;
    setActiveAction("jump");
    setAnimation("jump");
    setMessage("Wheee! 🦘");
    if (soundEnabled) playPetSound("cat-jump");

    const originalY = posY;
    setPosY(originalY - 120);

    setTimeout(() => {
      setPosY(originalY);
      if (soundEnabled) playPetSound("cat-meow");
      setTimeout(() => {
        setAnimation("idle");
        setActiveAction(null);
      }, 200);
    }, 350);
  };

  const handlePlayRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAction) return;
    setActiveAction("run");
    setAnimation("run");
    setMessage("Gotta go fast! ⚡🐈");
    if (soundEnabled) playPetSound("cat-meow");

    const originalX = posX;
    const screenW = window.innerWidth;
    
    // Zoom to left
    setFlipX(true);
    setPosX(screenW * 0.15);

    setTimeout(() => {
      // Zoom to right
      setFlipX(false);
      setPosX(screenW * 0.85);
      if (soundEnabled) playPetSound("cat-meow");

      setTimeout(() => {
        // Return back
        setFlipX(originalX < posX);
        setPosX(originalX);

        setTimeout(() => {
          setAnimation("idle");
          setActiveAction(null);
        }, 800);
      }, 800);
    }, 800);
  };

  const handlePlayScream = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAction) return;
    setActiveAction("scream");
    setAnimation("scream");
    setMessage("MEEEEEEEEEOOOOOOOOWWW!!! 🙀⚡");
    if (soundEnabled) playPetSound("cat-scream");

    setTimeout(() => {
      setAnimation("idle");
      setActiveAction(null);
    }, 2000);
  };

  const handlePlayCry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAction) return;
    setActiveAction("cry");
    setAnimation("cry");
    setMessage("Mew... sob... 🥺😭");
    if (soundEnabled) playPetSound("cat-cry");

    setTimeout(() => {
      setAnimation("idle");
      setActiveAction(null);
    }, 3000);
  };

  return (
    <>
      {/* 1. Global Floating Companion */}
      <div
        ref={containerRef}
        className={`fixed z-40 flex flex-col items-center gap-2 select-none ${
          isDragging ? "cursor-grabbing" : isCat ? "cursor-grab" : ""
        }`}
        onPointerDown={isCat ? handlePointerDown : undefined}
        onPointerMove={isCat ? handlePointerMove : undefined}
        onPointerUp={isCat ? handlePointerUp : undefined}
        style={{
          left: isCat ? `${posX}px` : `${posX}%`,
          top: isCat ? `${posY}px` : `${posY}%`,
          transform: "translate(-50%, -50%)",
          opacity: visible ? 1 : 0,
          transition: isDragging
            ? "opacity 0.7s ease"
            : activeAction === "run"
            ? "left 0.8s linear, top 0.8s linear, opacity 0.7s ease"
            : activeAction === "jump"
            ? "left 0.4s ease-out, top 0.35s ease-out, opacity 0.7s ease"
            : isCat
            ? "left 2.2s ease-in-out, top 2.2s ease-in-out, opacity 0.7s ease"
            : "left 5s ease-in-out, top 5s ease-in-out, opacity 0.7s ease",
          pointerEvents: "auto",
          touchAction: isCat ? "none" : "auto",
        }}
      >
        {/* Speech bubble */}
        <div className="glass max-w-[190px] px-3 py-2 text-[11px] leading-snug text-warm-text font-quick italic relative shadow-lg">
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-white/10 bg-void/90" />
          {message}
        </div>

        {/* Companion Wrapper */}
        <div className="flex items-end gap-2 relative group">
          {/* Action Play Drawer */}
          {isCat && (
            <div
              className={`absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-void/95 border border-white/10 rounded-full px-2.5 py-1.5 shadow-2xl transition-all duration-200 pointer-events-auto z-50 whitespace-nowrap ${
                showPlayMenu
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
              }`}
            >
              <button
                onClick={handlePlayJump}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold text-primary transition"
                type="button"
              >
                🦘 Jump
              </button>
              <span className="text-white/20 text-[9px]">|</span>
              <button
                onClick={handlePlayRun}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold text-accent transition"
                type="button"
              >
                ⚡ Run
              </button>
              <span className="text-white/20 text-[9px]">|</span>
              <button
                onClick={handlePlayScream}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold text-priority-critical transition"
                type="button"
              >
                🔊 Scream
              </button>
              <span className="text-white/20 text-[9px]">|</span>
              <button
                onClick={handlePlayCry}
                className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[9px] font-bold text-pink-400 transition"
                type="button"
              >
                😢 Cry
              </button>
            </div>
          )}

          {/* Quick Stats Flyout (Hover / click toggle) */}
          {showStats && (
            <div className="absolute bottom-20 right-0 glass p-4 rounded-xl border border-white/10 w-48 space-y-2 text-xs z-50 shadow-2xl animate-fade-in">
              <p className="font-bold text-white flex items-center justify-between">
                <span>{activePet.name}</span>
                <span className="text-[10px] text-primary">{activePet.theme}</span>
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Happiness</span>
                  <span>{petStats.happiness}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500" style={{ width: `${petStats.happiness}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Energy</span>
                  <span>{petStats.energy}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${petStats.energy}%` }} />
                </div>
              </div>
              <button
                onClick={() => {
                  feedPet();
                  setMessage("Munch munch munch! Yummy! 🍔❤️");
                  setAnimation("dance");
                  setTimeout(() => setAnimation("idle"), 2500);
                }}
                className="w-full text-center py-1 mt-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-[10px] font-bold border border-green-500/30 transition"
              >
                🍔 Feed Companion
              </button>
            </div>
          )}

          {/* Level Info */}
          <div className="text-right select-none opacity-80 pointer-events-none">
            <div className="text-[9px] text-warm-textMuted font-bold uppercase tracking-wider font-quick">
              {activePet.name}
            </div>
            <div className="text-[10px] text-warm-amber font-mono font-bold">
              Lv.{level}
            </div>
          </div>

          {/* Canvas or SVG Component */}
          <div className="familiar-float">
            <div
              className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
              style={{
                transform: flipX ? "scaleX(-1)" : "none",
                transition: "transform 0.3s",
              }}
              title={isCat ? "Click to play! Double click to view stats" : "Click to pet! Double click to view stats"}
              onClick={() => {
                if (isCat) {
                  setShowPlayMenu((prev) => !prev);
                  setAnimation("dance");
                  setMessage("Meow! Let's play! 🐾");
                  if (soundEnabled) playPetSound("cat-meow");
                  clearTimeout(bounceTimer.current);
                  bounceTimer.current = setTimeout(() => {
                    setAnimation("idle");
                  }, 2500);
                } else {
                  setAnimation("dance");
                  setMessage("Yay! I love focus training! 🎉");
                  clearTimeout(bounceTimer.current);
                  bounceTimer.current = setTimeout(() => {
                    setAnimation("idle");
                  }, 2500);
                }
              }}
              onDoubleClick={() => setShowStats((prev) => !prev)}
            >
              {isCat ? (
                <CatRenderer animation={animation} className="select-none" />
              ) : (
                <PixelPet speciesId={activePet.id} animation={animation as AnimationType} scale={4.5} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full Screen Evolution Animation */}
      {evolutionCelebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-pulse" />

          {/* Shaking Evolution Vortex */}
          <div className="relative z-10 flex flex-col items-center max-w-md text-center p-8 space-y-6">
            <div className="h-40 w-40 flex items-center justify-center bg-white/5 border border-white/10 rounded-full shadow-2xl relative animate-bounce">
              <span className="text-8xl select-none filter drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]">
                {activePet.emoji}
              </span>
              <div className="absolute inset-0 rounded-full border-2 border-primary border-dashed animate-spin" />
            </div>

            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">Evolution Complete!</h2>
              <h1 className="text-3xl font-bold text-white mt-1">
                {evolutionCelebration.oldName} evolved into{" "}
                <span className="text-xp bg-clip-text bg-gradient-to-r from-xp to-yellow-300">
                  {evolutionCelebration.petName}
                </span>
                !
              </h1>
              <p className="text-xs text-zinc-400 mt-3">
                Your focused hours have triggered a genetic code breakthrough. New skills are ready to train!
              </p>
            </div>

            <Button
              onClick={clearEvolutionCelebration}
              className="px-8 py-3 bg-gradient-to-r from-primary to-accent border border-primary/40 hover:scale-105 transition"
            >
              Fantastic! ✨
            </Button>
          </div>
        </div>
      )}

      {/* 3. Full-Screen Battle Move Takeovers */}
      {activeBattleMove && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 transition-opacity duration-500" />

          {/* Move-Specific Visuals */}
          {activeBattleMove === "Flamethrower" && (
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-orange-600 via-yellow-500 to-transparent opacity-90 animate-pulse flex flex-col justify-end p-12">
              <div className="text-center">
                <h2 className="text-5xl font-black italic tracking-wider text-orange-200 animate-bounce uppercase">
                  FLAMETHROWER!
                </h2>
                <p className="text-sm font-semibold text-yellow-100 mt-1">Burning through distraction piles</p>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.3),transparent)] animate-ping" />
            </div>
          )}

          {activeBattleMove === "Thunder Storm" && (
            <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay flex flex-col items-center justify-center transition-all duration-300">
              <div className="w-1.5 h-full bg-white shadow-[0_0_40px_#eab308] rotate-12 transform scale-y-125 animate-pulse" />
              <div className="absolute text-center mt-12 bg-void/80 px-8 py-4 rounded-2xl border border-yellow-400/40">
                <h2 className="text-4xl font-extrabold text-yellow-300 uppercase tracking-widest animate-pulse">
                  THUNDER STORM!
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Focus speed multipliers activated (+3 XP/min)</p>
              </div>
            </div>
          )}

          {activeBattleMove === "Aurora Beam" && (
            <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-900/60 via-teal-900/40 to-transparent flex flex-col justify-start p-12">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 blur-2xl opacity-60 animate-pulse" />
              <div className="text-center relative z-10 mt-12">
                <h2 className="text-4xl font-black tracking-widest text-teal-200 uppercase">
                  AURORA BEAM
                </h2>
                <p className="text-xs text-zinc-300 mt-1">Peace & Clarity active (Streak pressures frozen)</p>
              </div>
            </div>
          )}

          {activeBattleMove === "Judgement" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-500/10">
              <div className="w-80 h-80 rounded-full border-[6px] border-yellow-400/60 border-dashed animate-spin flex items-center justify-center">
                <div className="w-60 h-60 rounded-full border-4 border-yellow-300/40 border-dotted" />
              </div>
              <div className="absolute text-center mt-12 bg-void/90 px-8 py-4 rounded-2xl border border-yellow-300/50">
                <h2 className="text-4xl font-black text-yellow-300 uppercase tracking-widest">
                  JUDGEMENT!
                </h2>
                <p className="text-xs text-zinc-400 mt-1">The Alpha force: Customize your XP multipliers</p>
              </div>
            </div>
          )}

          {activeBattleMove === "Eternabeam" && (
            <div className="absolute inset-0 bg-purple-950 flex flex-col items-center justify-center p-8">
              <div className="w-32 h-32 bg-purple-600 rounded-full border border-purple-300 animate-ping absolute" />
              <div className="relative text-center">
                <h2 className="text-5xl font-black text-purple-200 tracking-wider uppercase animate-bounce">
                  ETERNABEAM
                </h2>
                <p className="text-sm font-semibold text-purple-400 mt-1">10x XP acceleration loop engaged</p>
              </div>
            </div>
          )}

          {!["Flamethrower", "Thunder Storm", "Aurora Beam", "Judgement", "Eternabeam"].includes(activeBattleMove) && (
            <div className="absolute inset-x-0 bottom-1/3 text-center bg-void/90 py-6 border-y border-primary/30 flex flex-col items-center">
              <h2 className="text-4xl font-black text-primary tracking-widest uppercase animate-pulse">
                {activeBattleMove}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Unleashing unique legendary focus skill</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
