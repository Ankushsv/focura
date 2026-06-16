import { createBrowserClient } from "@supabase/ssr";

export interface MixerVolumes {
  brownNoise: number;
  pinkNoise: number;
  whiteNoise: number;
  gammaBeat: number; // 40Hz (left: 200Hz, right: 240Hz)
  alphaBeat: number; // 12Hz (left: 200Hz, right: 212Hz)
  thetaBeat: number; // 4Hz  (left: 200Hz, right: 204Hz)
  focusTone: number; // 528Hz sine wave
}

export interface CustomMix {
  id: string;
  name: string;
  icon: string;
  volumes: MixerVolumes;
  created_at?: string;
}

export interface Preset {
  id: string;
  icon: string;
  name: string;
  description: string;
  genre: string;
  volumes: MixerVolumes;
  gradient: string;
  glowColor: string;
  borderActive: string;
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: "deep-work",
    icon: "🧠",
    name: "Deep Work",
    description: "Warm brown noise blended with a Solfeggio 528Hz tone for deep focus.",
    genre: "Solfeggio & Brown",
    volumes: {
      brownNoise: 0.7,
      pinkNoise: 0,
      whiteNoise: 0,
      gammaBeat: 0,
      alphaBeat: 0,
      thetaBeat: 0,
      focusTone: 0.2,
    },
    gradient: "from-amber-950/60 via-stone-900/40 to-orange-950/60",
    glowColor: "shadow-amber-950/50",
    borderActive: "border-amber-500/60",
  },
  {
    id: "binaural-gamma",
    icon: "⚡",
    name: "Binaural Focus (40Hz)",
    description: "Binaural Gamma waves (40Hz) with pink noise to stimulate working memory.",
    genre: "40Hz Gamma Beat",
    volumes: {
      brownNoise: 0,
      pinkNoise: 0.5,
      whiteNoise: 0,
      gammaBeat: 0.5,
      alphaBeat: 0,
      thetaBeat: 0,
      focusTone: 0,
    },
    gradient: "from-blue-950/60 via-cyan-900/30 to-slate-900/60",
    glowColor: "shadow-cyan-950/50",
    borderActive: "border-cyan-400/60",
  },
  {
    id: "alpha-flow",
    icon: "🌊",
    name: "Flow State (12Hz)",
    description: "Binaural Alpha waves (12Hz) with deep brown noise for sustained flow.",
    genre: "12Hz Alpha Beat",
    volumes: {
      brownNoise: 0.6,
      pinkNoise: 0,
      whiteNoise: 0,
      gammaBeat: 0,
      alphaBeat: 0.5,
      thetaBeat: 0,
      focusTone: 0,
    },
    gradient: "from-teal-950/60 via-emerald-950/40 to-stone-900/60",
    glowColor: "shadow-teal-950/50",
    borderActive: "border-teal-400/60",
  },
  {
    id: "adhd-calm",
    icon: "🐣",
    name: "ADHD Calm (4Hz)",
    description: "Theta waves (4Hz) combined with pink noise for an ultra-calm working space.",
    genre: "4Hz Theta Beat",
    volumes: {
      brownNoise: 0,
      pinkNoise: 0.6,
      whiteNoise: 0,
      gammaBeat: 0,
      alphaBeat: 0,
      thetaBeat: 0.5,
      focusTone: 0.05,
    },
    gradient: "from-indigo-950/60 via-violet-950/40 to-purple-900/60",
    glowColor: "shadow-indigo-950/50",
    borderActive: "border-indigo-400/60",
  },
  {
    id: "brown-focus",
    icon: "🟫",
    name: "Pure Brown",
    description: "Deep rumble to block out chatty environments.",
    genre: "Brown Noise",
    volumes: {
      brownNoise: 0.8,
      pinkNoise: 0,
      whiteNoise: 0,
      gammaBeat: 0,
      alphaBeat: 0,
      thetaBeat: 0,
      focusTone: 0,
    },
    gradient: "from-stone-900 via-neutral-900 to-amber-950/40",
    glowColor: "shadow-stone-900",
    borderActive: "border-orange-500/40",
  },
  {
    id: "white-focus",
    icon: "⬜",
    name: "Pure White",
    description: "Consistent static hum to mask sudden office or household sounds.",
    genre: "White Noise",
    volumes: {
      brownNoise: 0,
      pinkNoise: 0,
      whiteNoise: 0.6,
      gammaBeat: 0,
      alphaBeat: 0,
      thetaBeat: 0,
      focusTone: 0,
    },
    gradient: "from-slate-900 via-zinc-900 to-slate-950",
    glowColor: "shadow-zinc-900",
    borderActive: "border-zinc-500/40",
  },
];

const LOCAL_STORE_KEY = "focura.custom_mixes.v1";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentPlayingId: string | null = null;

  // Track active nodes
  private activeNodes: {
    noiseBrown?: { source: AudioBufferSourceNode; gain: GainNode };
    noisePink?: { source: AudioBufferSourceNode; gain: GainNode };
    noiseWhite?: { source: AudioBufferSourceNode; gain: GainNode };
    gammaLeft?: { osc: OscillatorNode; gain: GainNode };
    gammaRight?: { osc: OscillatorNode; gain: GainNode };
    alphaLeft?: { osc: OscillatorNode; gain: GainNode };
    alphaRight?: { osc: OscillatorNode; gain: GainNode };
    thetaLeft?: { osc: OscillatorNode; gain: GainNode };
    thetaRight?: { osc: OscillatorNode; gain: GainNode };
    focusTone?: { osc: OscillatorNode; gain: GainNode };
  } = {};

  private globalVolume = 0.6;
  private activeVolumes: MixerVolumes = {
    brownNoise: 0,
    pinkNoise: 0,
    whiteNoise: 0,
    gammaBeat: 0,
    alphaBeat: 0,
    thetaBeat: 0,
    focusTone: 0,
  };

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffer(color: "white" | "brown" | "pink"): AudioBuffer {
    const ctx = this.ensureContext()!;
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (color === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (color === "brown") {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // Set up noise node
  private setupNoiseNode(color: "brown" | "pink" | "white", volume: number) {
    const ctx = this.ctx!;
    const key = color === "brown" ? "noiseBrown" : color === "pink" ? "noisePink" : "noiseWhite";

    if (this.activeNodes[key]) {
      this.activeNodes[key]!.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      return;
    }

    if (volume <= 0) return;

    const buffer = this.createNoiseBuffer(color);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);

    source.connect(gain).connect(this.masterGain!);
    source.start();

    this.activeNodes[key] = { source, gain };
  }

  // Set up a binaural beat channel (creates a left and right oscillator panned fully)
  private setupBinauralNode(type: "gamma" | "alpha" | "theta", volume: number) {
    const ctx = this.ctx!;
    const leftKey = type === "gamma" ? "gammaLeft" : type === "alpha" ? "alphaLeft" : "thetaLeft";
    const rightKey = type === "gamma" ? "gammaRight" : type === "alpha" ? "alphaRight" : "thetaRight";

    if (this.activeNodes[leftKey] && this.activeNodes[rightKey]) {
      this.activeNodes[leftKey]!.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      this.activeNodes[rightKey]!.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      return;
    }

    if (volume <= 0) return;

    // Carrier frequency
    const f0 = 200;
    // Beat difference
    const beat = type === "gamma" ? 40 : type === "alpha" ? 12 : 4;

    // Left Channel Osc
    const oscLeft = ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.value = f0;
    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0, ctx.currentTime);
    gainLeft.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);
    const pannerLeft = ctx.createStereoPanner();
    pannerLeft.pan.value = -1;

    oscLeft.connect(gainLeft).connect(pannerLeft).connect(this.masterGain!);
    oscLeft.start();
    this.activeNodes[leftKey] = { osc: oscLeft, gain: gainLeft };

    // Right Channel Osc
    const oscRight = ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.value = f0 + beat;
    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0, ctx.currentTime);
    gainRight.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);
    const pannerRight = ctx.createStereoPanner();
    pannerRight.pan.value = 1;

    oscRight.connect(gainRight).connect(pannerRight).connect(this.masterGain!);
    oscRight.start();
    this.activeNodes[rightKey] = { osc: oscRight, gain: gainRight };
  }

  // Set up Solfeggio focus tone
  private setupFocusToneNode(volume: number) {
    const ctx = this.ctx!;
    if (this.activeNodes.focusTone) {
      this.activeNodes.focusTone.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      return;
    }

    if (volume <= 0) return;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 528; // 528Hz Solfeggio

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);

    osc.connect(gain).connect(this.masterGain!);
    osc.start();

    this.activeNodes.focusTone = { osc, gain };
  }

  // Play a mix configuration
  playMix(volumes: MixerVolumes, id: string = "custom-mixer") {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // If different mix is playing, stop first
    if (this.currentPlayingId !== id && this.currentPlayingId !== null) {
      this.stopNodes();
    }

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.globalVolume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }

    this.activeVolumes = { ...volumes };
    this.currentPlayingId = id;

    // Initialize or adjust all channels
    this.setupNoiseNode("brown", volumes.brownNoise);
    this.setupNoiseNode("pink", volumes.pinkNoise);
    this.setupNoiseNode("white", volumes.whiteNoise);
    this.setupBinauralNode("gamma", volumes.gammaBeat);
    this.setupBinauralNode("alpha", volumes.alphaBeat);
    this.setupBinauralNode("theta", volumes.thetaBeat);
    this.setupFocusToneNode(volumes.focusTone);
  }

  // Adjust volume of a specific channel in real-time
  updateChannelVolume(channel: keyof MixerVolumes, val: number) {
    this.activeVolumes[channel] = val;
    if (!this.ctx || this.currentPlayingId === null) return;

    switch (channel) {
      case "brownNoise":
        this.setupNoiseNode("brown", val);
        break;
      case "pinkNoise":
        this.setupNoiseNode("pink", val);
        break;
      case "whiteNoise":
        this.setupNoiseNode("white", val);
        break;
      case "gammaBeat":
        this.setupBinauralNode("gamma", val);
        break;
      case "alphaBeat":
        this.setupBinauralNode("alpha", val);
        break;
      case "thetaBeat":
        this.setupBinauralNode("theta", val);
        break;
      case "focusTone":
        this.setupFocusToneNode(val);
        break;
    }
  }

  setMasterVolume(val: number) {
    this.globalVolume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  getMasterVolume() {
    return this.globalVolume;
  }

  getPlayingId() {
    return this.currentPlayingId;
  }

  getActiveVolumes() {
    return this.activeVolumes;
  }

  private stopNodes() {
    // Stop all noise buffers
    Object.keys(this.activeNodes).forEach((k) => {
      const node = (this.activeNodes as any)[k];
      if (node) {
        try {
          if (node.source) node.source.stop();
          if (node.osc) node.osc.stop();
        } catch { /* ignored */ }
      }
    });
    this.activeNodes = {};
    this.currentPlayingId = null;
  }

  stop() {
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        this.stopNodes();
        try {
          this.ctx?.close();
        } catch { /* ignored */ }
        this.ctx = null;
        this.masterGain = null;
      }, 300);
    }
  }

  /* ============================================================
     HYBRID STORAGE SYNC (LocalStorage & Supabase)
     ============================================================ */

  // Load custom mixes
  async loadCustomMixes(): Promise<CustomMix[]> {
    let localMixes: CustomMix[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORE_KEY);
        localMixes = raw ? (JSON.parse(raw) as CustomMix[]) : [];
      } catch (e) {
        console.error("Failed loading local mixes", e);
      }
    }

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return localMixes;
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return localMixes;

      const { data: dbData, error } = await supabase
        .from("custom_mixes")
        .select("*");

      if (error) throw error;
      if (dbData) {
        // Map database schema to frontend CustomMix
        const dbMixes: CustomMix[] = dbData.map((row) => ({
          id: row.id,
          name: row.name,
          icon: row.icon,
          volumes: row.volumes as MixerVolumes,
          created_at: row.created_at,
        }));

        // Merge keeping DB as truth, appending unique local ones
        const merged = [...dbMixes];
        localMixes.forEach((lm) => {
          if (!merged.some((mm) => mm.id === lm.id)) {
            merged.push(lm);
          }
        });
        return merged;
      }
    } catch (e) {
      console.warn("Supabase load error, using offline local mixes:", e);
    }

    return localMixes;
  }

  // Save custom mix
  async saveCustomMix(mix: CustomMix): Promise<void> {
    // Save to LocalStorage first
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORE_KEY);
        const list = raw ? (JSON.parse(raw) as CustomMix[]) : [];
        const index = list.findIndex((m) => m.id === mix.id);
        if (index > -1) {
          list[index] = mix;
        } else {
          list.push(mix);
        }
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error("Local save failed", e);
      }
    }

    // Save to Supabase
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { error } = await supabase.from("custom_mixes").upsert({
        id: mix.id,
        user_id: authData.user.id,
        name: mix.name,
        icon: mix.icon,
        volumes: mix.volumes,
      });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase save offline fallback active:", e);
    }
  }

  // Delete custom mix
  async deleteCustomMix(id: string): Promise<void> {
    // Delete from LocalStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORE_KEY);
        const list = raw ? (JSON.parse(raw) as CustomMix[]) : [];
        const filtered = list.filter((m) => m.id !== id);
        localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error("Local delete failed", e);
      }
    }

    // Delete from Supabase
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { error } = await supabase
        .from("custom_mixes")
        .delete()
        .eq("id", id)
        .eq("user_id", authData.user.id);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase delete offline fallback active:", e);
    }
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
