// Web Audio API Sound Synthesizer Utilities for Game Audio Effects

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Plays a realistic synthesized card shuffle / riffle audio sound effect.
 * Uses Web Audio API noise buffer and sweeping bandpass filtering with rapid gain pulses
 * to mimic a deck of cards fast fluttering / shuffling.
 */
export const playCardShuffleSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.6; // Total duration in seconds
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to give realistic card texture
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + duration);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    // Gain node for fast card flutter envelope
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);

    // Simulate 12 fast card flicks in succession
    const flickCount = 12;
    const interval = duration / flickCount;

    for (let i = 0; i < flickCount; i++) {
      const t = now + i * interval;
      const vol = 0.25 + Math.random() * 0.15;
      gainNode.gain.setValueAtTime(0.02, t);
      gainNode.gain.linearRampToValueAtTime(vol, t + interval * 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + interval * 0.95);
    }

    // Final fade out
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch (err) {
    console.warn("Card shuffle sound playback failed:", err);
  }
};
