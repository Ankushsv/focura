/**
 * Web Audio engine for the Focus Timer.
 * Everything is synthesized — no audio assets needed.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambient: { osc: OscillatorNode; gain: GainNode } | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private note(freq: number, at: number, dur = 0.35, vol = 0.12) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.05);
  }

  /** 3-note chime on phase transitions. */
  chime() {
    [523.25, 659.25, 783.99].forEach((f, i) => this.note(f, i * 0.12));
  }

  /** Ascending fanfare on session completion. */
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.note(f, i * 0.15, 0.5, 0.14));
  }

  startAmbient(freq: number) {
    const ctx = this.ensure();
    if (!ctx || this.ambient) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    this.ambient = { osc, gain };
  }

  setAmbient(freq: number) {
    if (!this.ambient || !this.ctx) return;
    this.ambient.osc.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 1.5);
  }

  stopAmbient() {
    if (!this.ambient || !this.ctx) return;
    const a = this.ambient;
    a.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    setTimeout(() => {
      try {
        a.osc.stop();
      } catch {
        /* already stopped */
      }
    }, 800);
    this.ambient = null;
  }
}

export const sound = new SoundEngine();
