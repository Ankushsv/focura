/**
 * sounds.ts — Web Audio API synthesizer for custom pet sound profiles.
 * Safe for SSR (checks if window is defined).
 */

export type SoundProfile = "fire" | "water" | "electric" | "ghost" | "animal-chick" | "animal-wolf" | "animal-dragon" | "cosmic" | "chirp" | "jingle" | "dramatic" | "cat-meow" | "cat-scream" | "cat-cry" | "cat-jump";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a synthesized sound pattern.
 * @param profile Sound type to generate
 * @param volume Master volume (0.0 to 1.0)
 */
export function playPetSound(profile: SoundProfile, volume: number = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.3, now); // scale down max volume
  masterGain.connect(ctx.destination);

  switch (profile) {
    case "fire": {
      // Warm mid-tones (three ascending notes with triangle wave + lowpass filter)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      osc.type = "triangle";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);

      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(277.18, now + 0.1); // C#4
      osc.frequency.setValueAtTime(329.63, now + 0.2); // E4

      masterGain.gain.setValueAtTime(volume * 0.3, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(filter);
      filter.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }
    case "water": {
      // Cool high sweeps (sine wave sliding up)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);

      masterGain.gain.setValueAtTime(volume * 0.2, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
    case "electric": {
      // Sparky biquad-filtered noise/square wave pulses
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(200, now + 0.05);
      osc.frequency.setValueAtTime(1500, now + 0.1);

      // Lowpass sweeps
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2000, now);
      filter.Q.setValueAtTime(10, now);

      masterGain.gain.setValueAtTime(volume * 0.4, now);
      masterGain.gain.setValueAtTime(0.0, now + 0.04);
      masterGain.gain.setValueAtTime(volume * 0.4, now + 0.05);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(filter);
      filter.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }
    case "ghost": {
      // Eerie low pitch rumble/frequency modulation
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();

      carrier.type = "sawtooth";
      carrier.frequency.setValueAtTime(90, now);

      modulator.type = "sine";
      modulator.frequency.setValueAtTime(35, now);
      modGain.gain.setValueAtTime(50, now);

      // Eerie lowpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(150, now);

      masterGain.gain.setValueAtTime(volume * 0.3, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(filter);
      filter.connect(masterGain);

      modulator.start(now);
      carrier.start(now);
      modulator.stop(now + 0.6);
      carrier.stop(now + 0.6);
      break;
    }
    case "animal-chick": {
      // Simple high beep sequence
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(980, now + 0.1);

      masterGain.gain.setValueAtTime(volume * 0.2, now);
      masterGain.gain.setValueAtTime(0.0, now + 0.08);
      masterGain.gain.setValueAtTime(volume * 0.2, now + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }
    case "animal-wolf": {
      // Low howl shape (ascending then descending sine)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.7);

      masterGain.gain.setValueAtTime(volume * 0.25, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.8);
      break;
    }
    case "animal-dragon": {
      // Ascending roar shape (low pass filtered sawtooth + ramp)
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.4);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.4);

      masterGain.gain.setValueAtTime(volume * 0.35, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(filter);
      filter.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
      break;
    }
    case "cosmic": {
      // Ascending chime sounds (ring modulator feel)
      const frequencies = [880, 1046.5, 1318.51, 1567.98]; // A5, C6, E6, G6
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        chimeGain.gain.setValueAtTime(volume * 0.15, now + idx * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.4);

        osc.connect(chimeGain);
        chimeGain.connect(masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
      break;
    }
    case "chirp": {
      // Short happy task-complete chirp
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);

      masterGain.gain.setValueAtTime(volume * 0.25, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
      break;
    }
    case "jingle": {
      // 3-second celebratory focus-completed jingle
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5]; // C4, E4, G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        noteGain.gain.setValueAtTime(volume * 0.2, now + idx * 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.6);
      });
      break;
    }
    case "dramatic": {
      // Evolution dramatic sweep
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 1.2);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 1.2);

      masterGain.gain.setValueAtTime(volume * 0.35, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      osc.connect(filter);
      filter.connect(masterGain);

      osc.start(now);
      osc.stop(now + 1.6);
      break;
    }
    case "cat-meow": {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc1.type = "triangle";
      osc2.type = "sine";

      const startFreq = 520;
      const peakFreq = 740;
      const endFreq = 480;

      osc1.frequency.setValueAtTime(startFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.35);

      osc2.frequency.setValueAtTime(startFreq * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(peakFreq * 1.5, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + 0.35);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(850, now + 0.35);
      filter.Q.setValueAtTime(1.5, now);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.25, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      break;
    }
    case "cat-scream": {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "square";
      osc2.detune.setValueAtTime(20, now);

      const startFreq = 750;
      const peakFreq = 1550;
      const endFreq = 650;

      osc1.frequency.setValueAtTime(startFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.45);

      osc2.frequency.setValueAtTime(startFreq * 1.03, now);
      osc2.frequency.exponentialRampToValueAtTime(peakFreq * 1.03, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.03, now + 0.45);

      filter.type = "peaking";
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.45);
      filter.Q.setValueAtTime(2, now);
      filter.gain.setValueAtTime(12, now);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + 0.06);
      gainNode.gain.linearRampToValueAtTime(volume * 0.32, now + 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
      break;
    }
    case "cat-cry": {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(7.5, now);

      lfoGain.gain.setValueAtTime(volume * 0.08, now);

      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(550, now + 0.45);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.18, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 0.5);
      osc.stop(now + 0.5);
      break;
    }
    case "cat-jump": {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.14);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);

      masterGain.gain.setValueAtTime(volume * 0.16, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(filter);
      filter.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
      break;
    }
  }
}
