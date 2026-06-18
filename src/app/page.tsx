"use client";

import { useEffect, useRef, useState } from "react";
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

      // LFO for Chapter 3 battle pulse (1.5Hz) modulating pulseGain
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

      // Coronation shimmer (880Hz) for final chapters
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

    // Filter frequency sweeps from 200Hz to 1600Hz
    const cutoff = 200 + progress * 1400;
    this.filter.frequency.setTargetAtTime(cutoff, t, 0.1);

    // Chapter 3 (0.33 to 0.50): add battle pulse LFO modulation
    let pulseVal = 0;
    if (progress >= 0.33 && progress <= 0.50) {
      const mid = 0.415;
      if (progress < mid) {
        pulseVal = ((progress - 0.33) / (mid - 0.33)) * 0.15;
      } else {
        pulseVal = (1.0 - (progress - mid) / (0.50 - mid)) * 0.15;
      }
    }
    this.lfoGain.gain.setTargetAtTime(pulseVal, t, 0.1);

    // Chapter 6 (0.83 to 1.00): coronation shimmer fades in
    let shimmerVal = 0;
    if (progress >= 0.83) {
      shimmerVal = ((progress - 0.83) / 0.17) * 0.025;
    }
    this.shimmerGain.gain.setTargetAtTime(shimmerVal, t, 0.1);
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (!this.initialized && !mute) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      const targetGain = mute ? 0 : 0.35;
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const c1Ref = useRef<HTMLDivElement | null>(null);
  const c2TitleRef = useRef<HTMLDivElement | null>(null);
  const c2DescRef = useRef<HTMLDivElement | null>(null);
  const c3Ref = useRef<HTMLDivElement | null>(null);
  const c4Ref = useRef<HTMLDivElement | null>(null);
  const c5Ref = useRef<HTMLDivElement | null>(null);
  const c6Ref = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const audioManagerRef = useRef<AudioManager | null>(null);

  useEffect(() => {
    const audioManager = new AudioManager();
    audioManagerRef.current = audioManager;

    const video = videoRef.current;
    let scrollTriggerInstance: any = null;

    const initScrubber = () => {
      setLoading(false);
      
      // Video scrubber tween
      const tween = gsap.fromTo(video, 
        { currentTime: 0 },
        {
          currentTime: 42,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
            onUpdate: (self) => {
              audioManager.update(self.progress);
            }
          }
        }
      );
      scrollTriggerInstance = tween.scrollTrigger;

      // Chapter 1 Animations (0% to 16.66%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter1",
          start: "top 60%",
          end: "bottom 30%",
          scrub: true,
        }
      })
      .fromTo(c1Ref.current, { opacity: 0, filter: "blur(10px)", y: 40 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.4 })
      .to(c1Ref.current, { opacity: 0, filter: "blur(10px)", y: -40, duration: 0.4 }, "+=0.2");

      // Chapter 2 Animations (16.66% to 33.33%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter2",
          start: "top 60%",
          end: "bottom 30%",
          scrub: true,
        }
      })
      .fromTo(c2TitleRef.current, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.3 })
      .fromTo(c2DescRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, "<0.1")
      .to(c2TitleRef.current, { y: -80, opacity: 0, duration: 0.3 }, "+=0.2")
      .to(c2DescRef.current, { y: -40, opacity: 0, duration: 0.3 }, "<");

      // Chapter 3 Animations (33.33% to 50%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter3",
          start: "top 60%",
          end: "bottom 30%",
          scrub: true,
        }
      })
      .fromTo(c3Ref.current, 
        { opacity: 0, y: 80, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }, 
        { opacity: 1, y: 0, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 0.4 }
      )
      .to(c3Ref.current, { opacity: 0, y: -40, duration: 0.4 }, "+=0.2");

      // Chapter 4 Animations (50% to 66.66%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter4",
          start: "top 60%",
          end: "bottom 30%",
          scrub: true,
        }
      })
      .fromTo(c4Ref.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4 })
      .to(c4Ref.current, { opacity: 0, scale: 1.05, duration: 0.4 }, "+=0.2");

      // Chapter 5 Animations (66.66% to 83.33%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter5",
          start: "top 60%",
          end: "bottom 30%",
          scrub: true,
        }
      })
      .fromTo(c5Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 })
      .fromTo("#bgDarkener", { opacity: 0 }, { opacity: 0.6, duration: 0.4 }, "<")
      .to(c5Ref.current, { opacity: 0, y: -40, duration: 0.4 }, "+=0.2")
      .to("#bgDarkener", { opacity: 0, duration: 0.4 }, "<");

      // Chapter 6 Animations (83.33% to 100%)
      gsap.timeline({
        scrollTrigger: {
          trigger: "#chapter6",
          start: "top 60%",
          end: "bottom 80%",
          scrub: true,
        }
      })
      .fromTo(c6Ref.current, { opacity: 0, y: 50, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 });
    };

    if (video) {
      if (video.readyState >= 1) {
        initScrubber();
      } else {
        video.addEventListener("loadedmetadata", initScrubber);
      }
    }

    return () => {
      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
      }
      ScrollTrigger.getAll().forEach(t => t.kill());
      audioManager.destroy();
    };
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (audioManagerRef.current) {
      audioManagerRef.current.setMute(newState);
    }
  };

  const handleStart = () => {
    router.push("/login");
  };

  return (
    <div className="relative bg-[#0e0c0a] text-[#f5efe8] font-sans select-none overflow-x-hidden">
      
      {/* ── Fixed Video Background ── */}
      <video
        ref={videoRef}
        src="/focura-story.mp4"
        className="fixed inset-0 w-screen h-screen object-cover z-0 pointer-events-none"
        muted
        playsInline
        preload="auto"
      />

      {/* ── Background Darkener for Chapter 5 ── */}
      <div
        id="bgDarkener"
        className="fixed inset-0 bg-black pointer-events-none z-10 opacity-0 transition-opacity duration-500"
      />

      {/* ── Premium Vignette Overlay ── */}
      <div className="fixed inset-0 bg-radial-vignette pointer-events-none z-10" />

      {/* ── Premium Film Grain Overlay ── */}
      <div className="fixed inset-0 bg-film-grain pointer-events-none z-10 opacity-[0.03]" />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-8 z-30 pointer-events-auto max-w-7xl mx-auto left-1/2 -translate-x-1/2">
        <div className="font-sans font-bold text-xl tracking-wider text-[#f5efe8]">
          focura<span className="text-[#f0a868]">.</span>
        </div>
        <button
          onClick={handleStart}
          className="font-quicksand font-bold text-xs uppercase tracking-widest text-[#f5efe8]/80 hover:text-[#f0a868] transition duration-300 border border-white/5 px-6 py-3 rounded-full bg-[#1a1714]/30 backdrop-blur-sm"
        >
          Enter War Room
        </button>
      </header>

      {/* ── Mute Button ── */}
      <button
        onClick={toggleMute}
        className="fixed bottom-8 right-8 z-30 pointer-events-auto p-3.5 rounded-full border border-white/5 bg-[#1a1714]/30 backdrop-blur-sm text-[#f5efe8]/75 hover:text-[#f0a868] transition duration-300"
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

      {/* ── Scroll Container (Driving ScrollTrigger) ── */}
      <div ref={containerRef} className="relative w-full z-20">
        
        {/* CHAPTER 1 */}
        <section
          id="chapter1"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div ref={c1Ref} className="pointer-events-auto max-w-4xl space-y-6">
            <div className="text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              Focus Sessions
            </div>
            <h1 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-[#f5efe8]">
              Focus is not a talent.
            </h1>
            <h2 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
              It is a system.
            </h2>
            <div className="font-sans text-base sm:text-lg md:text-xl text-[rgba(245,239,232,0.55)] max-w-xl leading-relaxed space-y-2">
              <p>Most people spend years blaming themselves.</p>
              <p>The problem is rarely intelligence.</p>
              <p>The problem is structure.</p>
            </div>
          </div>
        </section>

        {/* CHAPTER 2 */}
        <section
          id="chapter2"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div className="max-w-4xl space-y-6">
            <div className="text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              ADHD-Friendly Design
            </div>
            <div ref={c2TitleRef} className="space-y-4">
              <h2 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-[#f5efe8]">
                Your brain is not broken.
              </h2>
              <h3 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
                It simply needs a better environment.
              </h3>
            </div>
            <div ref={c2DescRef} className="pointer-events-auto font-sans text-base sm:text-lg md:text-xl text-[rgba(245,239,232,0.55)] max-w-xl leading-relaxed">
              <p className="mb-4">Focura was designed for people who struggle with:</p>
              <ul className="list-disc pl-5 space-y-1 text-[#f5efe8]/80">
                <li>ADHD</li>
                <li>Distraction</li>
                <li>Overwhelm</li>
                <li>Inconsistency</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CHAPTER 3 */}
        <section
          id="chapter3"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div ref={c3Ref} className="pointer-events-auto max-w-4xl space-y-6 text-mask-reveal">
            <div className="text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              Quest System
            </div>
            <h2 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-[#f5efe8]">
              Direction beats motivation.
            </h2>
            <h3 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
              Clarity creates action.
            </h3>
            <p className="font-sans text-base sm:text-lg md:text-xl text-[rgba(245,239,232,0.55)] max-w-xl leading-relaxed">
              When you know what to do next, starting becomes easier.
            </p>
          </div>
        </section>

        {/* CHAPTER 4 */}
        <section
          id="chapter4"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div ref={c4Ref} className="pointer-events-auto max-w-4xl space-y-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              <span>Goal Tracking</span>
              <span>•</span>
              <span>Habit Systems</span>
              <span>•</span>
              <span>Streak Tracking</span>
            </div>
            <h2 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-[#f5efe8]">
              Progress compounds.
            </h2>
            <h3 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
              One session at a time.
            </h3>
            <p className="font-sans text-base sm:text-lg md:text-xl text-[rgba(245,239,232,0.55)] max-w-xl leading-relaxed">
              Small actions repeated daily create extraordinary outcomes.
            </p>
          </div>
        </section>

        {/* CHAPTER 5 */}
        <section
          id="chapter5"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div ref={c5Ref} className="pointer-events-auto max-w-4xl space-y-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              <span>Consistency Tracking</span>
              <span>•</span>
              <span>Progress Analytics</span>
              <span>•</span>
              <span>Daily Reviews</span>
            </div>
            <h2 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-white drop-shadow-md">
              Consistency changes everything.
            </h2>
            <h3 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
              Momentum is a superpower.
            </h3>
            <p className="font-sans text-base sm:text-lg md:text-xl text-[#f5efe8] opacity-90 max-w-xl leading-relaxed">
              Focura helps you build systems that survive bad days.
            </p>
          </div>
        </section>

        {/* CHAPTER 6 */}
        <section
          id="chapter6"
          className="relative h-screen w-full flex flex-col justify-center px-8 sm:px-24 md:px-32 pointer-events-none"
        >
          <div ref={c6Ref} className="pointer-events-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#f0a868] text-xs uppercase tracking-[0.25em] font-sans font-medium">
              <span>Focus Sessions</span>
              <span>•</span>
              <span>Goals</span>
              <span>•</span>
              <span>Analytics</span>
              <span>•</span>
              <span>Music</span>
              <span>•</span>
              <span>Quests</span>
            </div>
            <div className="space-y-4">
              <h2 className="font-cinzel text-5xl sm:text-7xl md:text-8xl font-bold leading-none text-[#f5efe8]">
                Build the life you keep imagining.
              </h2>
              <h3 className="text-[#f0a868] text-2xl sm:text-3xl md:text-4xl font-light tracking-wide">
                One focused day at a time.
              </h3>
            </div>
            <p className="font-sans text-base sm:text-lg md:text-xl text-[rgba(245,239,232,0.55)] max-w-xl leading-relaxed">
              Everything you need to stay focused, build momentum, and move forward.
            </p>

            {/* ── CTA buttons ── */}
            <div className="pt-4 space-y-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleStart}
                  className="font-quicksand font-bold text-base uppercase tracking-widest text-[#0e0c0a] bg-[#f0a868] px-10 py-5 rounded-full shadow-[0_0_40px_rgba(240,168,104,0.3)] hover:shadow-[0_0_60px_rgba(240,168,104,0.5)] hover:scale-[1.03] transition-all duration-300"
                >
                  Enter Focura →
                </button>
                <button
                  onClick={handleStart}
                  className="font-quicksand font-bold text-base uppercase tracking-widest text-[#f5efe8] border border-white/10 hover:border-[#f0a868] px-10 py-5 rounded-full bg-[#1a1714]/30 backdrop-blur-sm hover:scale-[1.03] transition-all duration-300"
                >
                  Start Focusing →
                </button>
              </div>
              <div className="space-y-1 text-xs text-[rgba(245,239,232,0.4)]">
                <p>No complicated setup.</p>
                <p>No productivity guilt.</p>
                <p>Just progress.</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Loading Screen ── */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0e0c0a] transition-opacity duration-700">
          <div className="flex flex-col items-center space-y-6">
            <div className="font-sans font-bold text-3xl tracking-widest text-[#f5efe8]">
              focura<span className="text-[#f0a868]">.</span>
            </div>
            <div className="relative w-48 h-[1px] bg-white/5 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#f0a868] w-full"
                style={{
                  animation: "load-bar 1.5s ease-in-out infinite",
                }}
              />
            </div>
            <div className="font-serif italic text-[11px] text-[#f5efe8]/40 tracking-wider">
              Summoning the system...
            </div>
          </div>
        </div>
      )}

      {/* CSS Anim for loading bar */}
      <style jsx global>{`
        @keyframes load-bar {
          0% { left: -100%; transform: translateX(0); }
          100% { left: 100%; transform: translateX(0); }
        }
      `}</style>

    </div>
  );
}
