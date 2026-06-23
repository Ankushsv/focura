"use client";

import { useCallback, useEffect, useState } from "react";
import { bus } from "@/lib/events";
import {
  audioEngine,
  BUILT_IN_PRESETS,
  type Preset,
  type CustomMix,
  type MixerVolumes,
} from "@/lib/music/audioEngine";
import { 
  IconVolume, 
  IconVolumeOff, 
  IconDisc, 
  IconMusic, 
  IconDeviceFloppy, 
  IconTrash, 
  IconInfoCircle,
  IconFlame,
  IconClock,
  IconHeart,
  IconBrain,
  IconSparkles,
  IconInfinity
} from "@tabler/icons-react";

// Mappings of standard preset keys to modern names and copy
const PRESET_MAPPING: Record<string, { name: string; description: string; icon: string; genre: string }> = {
  "deep-work": {
    name: "Deep Study Hums",
    description: "Deep focus brown noise and solfeggio frequencies to anchor your attention.",
    icon: "🧘",
    genre: "Solfeggio & Brown Noise",
  },
  "binaural-gamma": {
    name: "Binaural Focus Waves",
    description: "40Hz binaural beats with gentle pink rain for problem-solving and coding.",
    icon: "⚡",
    genre: "40Hz Gamma Beats",
  },
  "alpha-flow": {
    name: "Flow State Rain",
    description: "12Hz alpha waves blended with forest rain for sustained cognitive flow.",
    icon: "🌧️",
    genre: "12Hz Alpha Beats",
  },
  "adhd-calm": {
    name: "Calming Waves",
    description: "4Hz theta waves combined with low-frequency white noise for total peace of mind.",
    icon: "🌊",
    genre: "4Hz Theta Beats",
  },
};

export default function MusicPage() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [customMixes, setCustomMixes] = useState<CustomMix[]>([]);
  const [syncWithBattle, setSyncWithBattle] = useState(false);

  // Mixer custom volumes state
  const [mixerVolumes, setMixerVolumes] = useState<MixerVolumes>({
    brownNoise: 0.5,
    pinkNoise: 0,
    whiteNoise: 0,
    gammaBeat: 0.3,
    alphaBeat: 0,
    thetaBeat: 0,
    focusTone: 0.1,
  });

  // Modal dialog states for saving custom mixes
  const [isSaving, setIsSaving] = useState(false);
  const [newMixName, setNewMixName] = useState("");
  const [newMixIcon, setNewMixIcon] = useState("🧠");

  // Load custom mixes on mount
  useEffect(() => {
    async function load() {
      const list = await audioEngine.loadCustomMixes();
      setCustomMixes(list);
    }
    load();
    setVolume(audioEngine.getMasterVolume());
    setPlaying(audioEngine.getPlayingId());
  }, []);

  const stopAudio = useCallback(() => {
    audioEngine.stop();
    setPlaying(null);
  }, []);

  // Listen to focus timer state simulation when sync is enabled
  useEffect(() => {
    if (syncWithBattle) {
      const unsubStart = bus.on("timer:start", () => {
        audioEngine.playMix(BUILT_IN_PRESETS[0].volumes, "deep-work");
        setPlaying("deep-work");
      });
      const unsubStop = bus.on("timer:stop", () => {
        stopAudio();
      });
      return () => {
        unsubStart();
        unsubStop();
      };
    }
  }, [syncWithBattle, stopAudio]);

  const handleTileClick = useCallback(
    (preset: Preset) => {
      if (playing === preset.id) {
        stopAudio();
      } else {
        audioEngine.playMix(preset.volumes, preset.id);
        setPlaying(preset.id);
      }
    },
    [playing, stopAudio]
  );

  const handleCustomMixClick = useCallback(
    (mix: CustomMix) => {
      if (playing === mix.id) {
        stopAudio();
      } else {
        audioEngine.playMix(mix.volumes, mix.id);
        setPlaying(mix.id);
      }
    },
    [playing, stopAudio]
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audioEngine.setMasterVolume(v);
  };

  const handleChannelVolumeChange = (channel: keyof MixerVolumes, val: number) => {
    setMixerVolumes((prev) => {
      const next = { ...prev, [channel]: val };
      // If currently playing the custom mixer, update in real-time
      if (playing === "custom-mixer") {
        audioEngine.updateChannelVolume(channel, val);
      } else {
        // Automatically start playing the custom mixer preview
        audioEngine.playMix(next, "custom-mixer");
        setPlaying("custom-mixer");
      }
      return next;
    });
  };

  const handleToggleCustomMixer = () => {
    if (playing === "custom-mixer") {
      stopAudio();
    } else {
      audioEngine.playMix(mixerVolumes, "custom-mixer");
      setPlaying("custom-mixer");
    }
  };

  const handleSaveMix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMixName.trim()) return;

    const newMix: CustomMix = {
      id: `custom-${Date.now()}`,
      name: newMixName.trim(),
      icon: newMixIcon,
      volumes: { ...mixerVolumes },
    };

    await audioEngine.saveCustomMix(newMix);
    setCustomMixes(await audioEngine.loadCustomMixes());
    setIsSaving(false);
    setNewMixName("");
    setNewMixIcon("🧠");

    // Automatically transition playback to the saved custom mix
    audioEngine.playMix(newMix.volumes, newMix.id);
    setPlaying(newMix.id);
  };

  const handleDeleteMix = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent playing on click
    if (playing === id) {
      stopAudio();
    }
    await audioEngine.deleteCustomMix(id);
    setCustomMixes(await audioEngine.loadCustomMixes());
  };

  const activePreset = BUILT_IN_PRESETS.find((p) => p.id === playing);
  const activeCustomMix = customMixes.find((m) => m.id === playing);

  const isAnyPlaying = playing !== null;
  const currentPresetMapped = activePreset ? PRESET_MAPPING[activePreset.id] : null;

  const currentSoundTitle = currentPresetMapped?.name || activeCustomMix?.name || (playing === "custom-mixer" ? "Custom Mix" : "");
  const currentSoundIcon = currentPresetMapped?.icon || activeCustomMix?.icon || (playing === "custom-mixer" ? "🎛️" : "");
  const currentSoundGenre = currentPresetMapped?.genre || (activeCustomMix ? "Saved Custom Mixes" : playing === "custom-mixer" ? "Live Synthesis" : "");

  return (
    <div className="min-h-screen bg-warm-bg text-warm-text px-4 py-8 md:px-8 pb-36 font-quick">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-warm-purple/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-warm-teal/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-warm-amber/5 blur-3xl" />
        {playing && (
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-purple/5 blur-[120px] animate-pulse pointer-events-none" />
        )}
      </div>

      <div className="relative mx-auto max-w-[1400px] w-full space-y-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-warm-border bg-gradient-to-br from-warm-purple/10 via-warm-surface to-warm-teal/5 p-8 shadow-md">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-warm-purple/5 blur-3xl" />
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warm-teal/30 bg-warm-teal/5 px-4 py-1.5 font-space">
            <IconSparkles size={14} className="text-warm-teal animate-spin" />
            <span className="text-xs font-bold text-warm-teal">
              Binaural frequencies entrain brainwaves to optimize your productivity flow.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-warm-purple/20 blur-2xl scale-150" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-warm-surface border border-warm-purple/30 shadow-2xl">
                <IconMusic size={40} className="text-warm-purple animate-pulse" />
              </div>
            </div>

            <div>
              <h1 className="font-space font-bold text-4xl text-warm-cream leading-tight">
                Focus Music
              </h1>
              <p className="mt-1.5 text-sm text-warm-textMuted font-quick italic">
                Optimize your mental state for deep work using curated binaural soundscapes.
              </p>
              {playing && (
                <div className="mt-2.5 flex items-center gap-2 font-space">
                  <span className="inline-block h-2 w-2 rounded-full bg-warm-teal animate-pulse" />
                  <span className="text-xs font-bold text-warm-teal">
                    Currently Active: {currentSoundIcon} {currentSoundTitle}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOCUS TIMER MUSIC SYNC TOGGLE */}
        <div className="rounded-2xl border border-warm-border bg-warm-surface p-5 flex items-center justify-between shadow-md">
          <div className="flex items-start gap-3">
            <IconFlame className="text-warm-amber mt-0.5 shrink-0" size={22} />
            <div>
              <h3 className="text-sm font-bold text-warm-cream font-space">Sync Music with Timer</h3>
              <p className="text-xs text-warm-textMuted font-quick italic mt-0.5">
                Automatically transitions soundscapes as you progress through focus phases.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSyncWithBattle(!syncWithBattle)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              syncWithBattle ? "bg-warm-teal" : "bg-warm-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-warm-cream shadow ring-0 transition duration-200 ease-in-out ${
                syncWithBattle ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* CUSTOM MIXER STUDIO (THE SOUND FORGE) */}
        <div className="rounded-3xl border border-warm-border bg-warm-surface/40 p-6 md:p-8 relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-warm-purple/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-border pb-6 mb-6">
            <div>
              <h2 className="font-space font-bold text-lg text-warm-cream flex items-center gap-2">
                <IconMusic size={20} className="text-warm-amber" />
                Sound Customizer
              </h2>
              <p className="text-xs text-warm-textMuted mt-1 font-quick italic">Blend ambient hums and frequencies to suit your focus style.</p>
            </div>
            <div className="flex gap-2 font-space">
              <button
                onClick={handleToggleCustomMixer}
                className={`text-xs px-4 py-2.5 rounded-xl font-bold transition-all border ${
                  playing === "custom-mixer" 
                    ? "bg-warm-teal text-warm-bg border-warm-teal shadow-md" 
                    : "bg-warm-purple/10 border-warm-purple/30 text-warm-purple hover:bg-warm-purple/20"
                }`}
              >
                {playing === "custom-mixer" ? "⏹ Stop Preview" : "▶ Preview Mix"}
              </button>
              <button
                onClick={() => setIsSaving(true)}
                className="text-xs px-4 py-2.5 rounded-xl bg-gradient-to-r from-warm-amber to-orange-400 text-warm-bg font-bold shadow-md hover:scale-102 active:scale-95 transition-all"
              >
                💾 Save Custom Preset
              </button>
            </div>
          </div>

          {/* Mixer Sliders */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { key: "brownNoise", label: "Brown Noise (Hearth)", desc: "Deep warm hum, ideal for masking cluttering noise.", icon: "🔥", color: "text-warm-amber" },
              { key: "pinkNoise", label: "Pink Noise (Rain)", desc: "Steady rainfall frequency, highly soothing for thinking.", icon: "🌧️", color: "text-warm-purple" },
              { key: "whiteNoise", label: "White Noise (Ocean)", desc: "Gentle static hum, masks background chatter and sudden noises.", icon: "🌊", color: "text-warm-textMuted" },
              { key: "gammaBeat", label: "40Hz Gamma Beats (Focus)", desc: "Binaural focus pulses. Stimulates working memory.", icon: "🥁", color: "text-warm-teal" },
              { key: "alphaBeat", label: "12Hz Alpha Beats (Flow)", desc: "Binaural flow pulses. Promotes alert calmness.", icon: "🧘", color: "text-warm-purple" },
              { key: "thetaBeat", label: "4Hz Theta Beats (Calm)", desc: "Binaural meditation pulses. Promotes deep calm.", icon: "🔮", color: "text-warm-teal" },
              { key: "focusTone", label: "Solfeggio Focus Tone (528Hz)", desc: "Focus tone. Sine wave corresponding to deep work.", icon: "✨", color: "text-warm-amber" },
            ].map((slider) => {
              const val = mixerVolumes[slider.key as keyof MixerVolumes];
              const isChannelActive = val > 0 && playing === "custom-mixer";
              return (
                <div key={slider.key} className="rounded-xl border border-warm-border bg-warm-surface2/40 hover:border-warm-amber/20 p-4 flex flex-col justify-between transition duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-2xl">{slider.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-warm-cream font-space">{slider.label}</h4>
                        <p className="text-[10px] text-warm-textMuted leading-normal font-quick italic">{slider.desc}</p>
                      </div>
                    </div>
                    {isChannelActive && (
                      <div className="flex items-end gap-[1.5px] h-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-[2px] rounded-full bg-warm-teal animate-pulse"
                            style={{
                              height: `${6 + i * 3}px`,
                              animation: `eq-bounce ${0.3 + i * 0.08}s ease-in-out infinite alternate`,
                              animationDelay: `${i * 30}ms`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={val}
                      onChange={(e) => handleChannelVolumeChange(slider.key as keyof MixerVolumes, parseFloat(e.target.value))}
                      className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-warm-border accent-warm-teal"
                    />
                    <span className="w-8 text-right font-mono text-[10px] text-warm-textMuted tabular-nums">
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOM PRESETS SECTION */}
        {customMixes.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-space font-bold text-sm text-warm-cream flex items-center gap-2">
              <span>💾</span> Custom Mixes
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {customMixes.map((mix) => {
                const isActive = playing === mix.id;
                return (
                  <div
                    key={mix.id}
                    onClick={() => handleCustomMixClick(mix)}
                    className={`group relative min-h-[140px] overflow-hidden rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "border-warm-teal bg-gradient-to-br from-warm-purple/20 via-warm-surface to-warm-teal/10 shadow-lg"
                        : "border-warm-border bg-warm-surface hover:border-warm-amber/20"
                    }`}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteMix(mix.id, e)}
                      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-warm-surface2 border border-warm-border text-xs text-warm-textMuted hover:text-rose-400 hover:border-rose-500/30 transition-all"
                      title="Delete Mix"
                    >
                      ✕
                    </button>

                    <div className="relative flex h-full flex-col p-5 justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-3xl ${
                          isActive ? "bg-warm-teal/10 border border-warm-teal/20 text-warm-teal" : "bg-warm-surface2"
                        }`}>
                           {mix.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-warm-cream text-sm font-space">{mix.name}</h3>
                          <p className="text-[9px] text-warm-teal uppercase font-black tracking-wider font-space">Custom Mix</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[10px] text-warm-textMuted font-space">
                        <div className="flex gap-2">
                          {Object.keys(mix.volumes).map((k) => {
                            const v = mix.volumes[k as keyof MixerVolumes];
                            if (v <= 0) return null;
                            const labels: any = {
                              brownNoise: "Hearth",
                              pinkNoise: "Rain",
                              whiteNoise: "Ocean",
                              gammaBeat: "Gamma",
                              alphaBeat: "Alpha",
                              thetaBeat: "Theta",
                              focusTone: "Tone",
                            };
                            return (
                              <span key={k} className="rounded border border-warm-border bg-warm-surface2 px-1.5 py-0.5">
                                {labels[k]}
                              </span>
                            );
                          })}
                        </div>
                        {isActive && <span className="text-warm-teal font-bold animate-pulse">Playing</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUILT-IN PRESETS */}
        <div className="space-y-4">
          <h2 className="font-space font-bold text-sm text-warm-cream flex items-center gap-2">
            <span>✨</span> Curated Soundscapes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BUILT_IN_PRESETS.map((preset) => {
              const isActive = playing === preset.id;
              const mapped = PRESET_MAPPING[preset.id] || {
                name: preset.name,
                description: preset.description,
                icon: preset.icon,
                genre: preset.genre,
              };

              return (
                <button
                  key={preset.id}
                  onClick={() => handleTileClick(preset)}
                  className={`group relative min-h-[170px] overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                    isActive
                      ? "border-warm-amber bg-gradient-to-br from-warm-amber/10 via-warm-surface to-warm-surface2 shadow-lg scale-[1.01]"
                      : "border-warm-border bg-warm-surface hover:border-warm-amber/20 hover:scale-[1.01]"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-warm-amber/5 animate-pulse pointer-events-none" />
                  )}
                  <div className="relative flex h-full flex-col justify-between p-5">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl transition-all duration-300 ${
                          isActive ? "bg-warm-amber/10 border border-warm-amber/20 scale-110 shadow-lg" : "bg-warm-surface2"
                        }`}
                      >
                        {mapped.icon}
                      </div>
                      <span className="rounded-full border border-warm-border bg-warm-surface2/60 px-3 py-0.5 text-[9px] font-bold text-warm-textMuted font-space uppercase tracking-wider">
                        {mapped.genre}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-base font-bold text-warm-cream font-space">
                        {mapped.name}
                      </h3>
                      <p className="mt-1 text-xs leading-normal text-warm-textMuted font-quick italic">{mapped.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-[10px] font-space">
                      {isActive ? (
                        <>
                          <div className="flex items-end gap-[1.5px] h-4">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="w-[1.5px] rounded-full bg-warm-amber"
                                style={{
                                  height: `${8 + i * 2}px`,
                                  animation: `eq-bounce ${0.3 + i * 0.08}s ease-in-out infinite alternate`,
                                  animationDelay: `${i * 40}ms`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-warm-amber animate-pulse">Pause Soundscape</span>
                        </>
                      ) : (
                        <span className="text-warm-textMuted group-hover:text-warm-cream transition-all flex items-center gap-0.5">
                          Play Soundscape <IconInfinity size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ADHD SCIENCE TIP CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-warm-teal/20 bg-gradient-to-br from-warm-teal/10 via-warm-surface to-warm-surface2 p-6 shadow-sm">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-warm-teal/5 blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warm-surface2 border border-warm-teal/20 text-2xl">
              🧠
            </div>
            <div>
              <p className="text-sm font-bold text-warm-teal font-space">Entrainment & Binaural Beats</p>
              <p className="mt-1.5 text-xs leading-relaxed text-warm-textMuted font-quick italic">
                Binaural beats play slightly different tones in each ear. The brain resolves the difference by creating a third internal tone (the binaural beat). A **40Hz Gamma beat** entrains waves corresponding to high focus, while **12Hz Alpha** stimulates alert relaxation. Mixing these with low brown noise filters distracting sounds, keeping ADHD brains engaged and calm.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE PRESET MODAL */}
      {isSaving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-warm-border bg-warm-surface shadow-2xl relative">
            <h3 className="font-space font-bold text-lg text-warm-cream mb-4">Save Custom Mix</h3>
            <form onSubmit={handleSaveMix} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-warm-textMuted mb-1.5 font-space">
                  Mix Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coding Focus"
                  value={newMixName}
                  onChange={(e) => setNewMixName(e.target.value)}
                  className="w-full rounded-xl border border-warm-border bg-warm-surface2 px-4 py-2.5 text-sm outline-none transition focus:border-warm-amber text-warm-cream font-space"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-warm-textMuted mb-1.5 font-space">
                  Choose Icon
                </label>
                <div className="flex gap-2">
                  {["🧠", "💻", "🌊", "🔥", "🪐", "🌧️", "⚡", "🔮"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMixIcon(emoji)}
                      className={`flex-1 py-2 rounded-xl text-lg border transition-all ${
                        newMixIcon === emoji
                          ? "border-warm-amber bg-warm-amber/10 text-warm-amber"
                          : "border-warm-border bg-warm-surface2 hover:bg-warm-border"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 font-space">
                <button
                  type="button"
                  onClick={() => setIsSaving(false)}
                  className="flex-1 py-2.5 rounded-xl border border-warm-border hover:bg-warm-surface2 text-sm font-bold text-warm-textMuted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-warm-amber to-orange-400 text-warm-bg text-sm font-bold shadow-md"
                >
                  Save Mix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOW PLAYING BAR */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
          playing ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="border-t border-warm-border bg-warm-surface/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] w-full items-center gap-4 px-4 py-3">
            {/* Spinning vinyl disc */}
            <div
              className="relative shrink-0 h-11 w-11 rounded-full border border-warm-amber/40 bg-gradient-to-br from-stone-700 to-stone-900 shadow-md overflow-hidden"
              style={{ animation: playing ? "vinyl-rotate 3s linear infinite" : "none" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-warm-bg border border-warm-amber/40" />
              </div>
              <div className="absolute inset-1 rounded-full border border-warm-border/20" />
              <div className="absolute inset-2.5 rounded-full border border-warm-border/20" />
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-warm-cream font-space">
                {currentSoundIcon} {currentSoundTitle}
              </p>
              <p className="text-xs text-warm-textMuted font-space">{currentSoundGenre} · Playback active</p>
            </div>

            {/* Center EQ waves */}
            <div className="hidden sm:flex items-end gap-[2px] h-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-[2.5px] rounded-full bg-warm-amber"
                  style={{
                    height: `${8 + i * 3}px`,
                    animation: `eq-bounce ${0.35 + i * 0.08}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2 shrink-0 font-space">
              <IconVolume size={16} className="text-warm-textMuted" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-warm-border accent-warm-teal"
              />
              <span className="w-6 text-right text-[10px] font-mono text-warm-textMuted tabular-nums">
                {Math.round(volume * 100)}
              </span>
            </div>

            {/* Stop button */}
            <button
              onClick={stopAudio}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all shadow-sm"
              title="Stop Playback"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes eq-bounce {
          from { transform: scaleY(0.35); opacity: 0.6; }
          to   { transform: scaleY(1.1); opacity: 1; }
        }
        @keyframes vinyl-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
