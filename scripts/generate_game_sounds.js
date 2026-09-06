// scripts/generate_game_sounds.js
// Procedurally synthesizes 44.1kHz 16-bit PCM WAV sound effects for Classic and Modern modes
import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavBuffer(samples, channels = 1) {
  const byteRate = SAMPLE_RATE * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, samples[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(int16), 44 + i * 2);
  }

  return buffer;
}

const OUT_DIR = './public/assets/audio/sounds';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. CARD SHUFFLE (0.65s flutter riffle)
function generateCardShuffle() {
  const duration = 0.65;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);
  const flickCount = 16;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const flickIdx = Math.floor((t / duration) * flickCount);
    const flickProgress = (t % (duration / flickCount)) / (duration / flickCount);
    const flickEnv = Math.exp(-flickProgress * 12);

    // Filtered noise with fluttering frequency
    const noise = Math.random() * 2 - 1;
    const baseFreq = 800 + (t / duration) * 1600;
    const tone = Math.sin(2 * Math.PI * baseFreq * t);

    // Combine textured noise and tone
    const sample = (noise * 0.7 + tone * 0.3) * flickEnv * 0.8;
    samples[i] = sample * (1 - t / duration * 0.2);
  }
  return samples;
}

// 2. CARD FLIP (0.15s crisp card snap)
function generateCardFlip() {
  const duration = 0.16;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 28);
    const freq = 650 * Math.exp(-t * 15);
    const snapNoise = (Math.random() * 2 - 1) * Math.exp(-t * 45);
    const body = Math.sin(2 * Math.PI * freq * t);
    samples[i] = (snapNoise * 0.6 + body * 0.4) * env;
  }
  return samples;
}

// 3. POLICE SIREN (1.2s wailing siren)
function generatePoliceSiren() {
  const duration = 1.2;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Two cycle wail: 750Hz to 1250Hz
    const wail = Math.sin(2 * Math.PI * 1.8 * t);
    const freq = 900 + wail * 280;
    const env = t < 0.05 ? t / 0.05 : (t > duration - 0.1 ? (duration - t) / 0.1 : 1);

    // Fundamental + 2nd harmonic + 3rd harmonic
    const s1 = Math.sin(2 * Math.PI * freq * t);
    const s2 = 0.4 * Math.sin(2 * Math.PI * freq * 2 * t);
    const s3 = 0.2 * Math.sin(2 * Math.PI * freq * 3 * t);

    samples[i] = (s1 + s2 + s3) * 0.4 * env;
  }
  return samples;
}

// 4. CORRECT CATCH FANFARE (1.1s triumphant brass fanfare)
function generateCorrectCatch() {
  const duration = 1.1;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Chords: G4 -> C5 -> E5 -> G5 (C major fanfare)
  const notes = [
    { freq: 392.00, start: 0.0, dur: 0.2 },   // G4
    { freq: 523.25, start: 0.15, dur: 0.2 },  // C5
    { freq: 659.25, start: 0.30, dur: 0.25 }, // E5
    { freq: 783.99, start: 0.50, dur: 0.6 },  // G5
    { freq: 1046.50, start: 0.50, dur: 0.6 }, // C6 (octave)
  ];

  for (const n of notes) {
    const startIdx = Math.floor(n.start * SAMPLE_RATE);
    const endIdx = Math.min(numSamples, Math.floor((n.start + n.dur) * SAMPLE_RATE));

    for (let i = startIdx; i < endIdx; i++) {
      const t = (i - startIdx) / SAMPLE_RATE;
      const env = Math.sin(Math.min(1, t / 0.02) * Math.PI / 2) * Math.exp(-t * (3.5 / n.dur));
      const s1 = Math.sin(2 * Math.PI * n.freq * t);
      const s2 = 0.35 * Math.sin(2 * Math.PI * n.freq * 2 * t);
      const s3 = 0.15 * Math.sin(2 * Math.PI * n.freq * 3 * t);
      samples[i] += (s1 + s2 + s3) * 0.3 * env;
    }
  }
  return samples;
}

// 5. WRONG GUESS BUZZER (0.65s dramatic game show buzzer)
function generateWrongBuzzer() {
  const duration = 0.65;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  const freq1 = 138.59; // C#3
  const freq2 = 146.83; // D3 (discordant minor 2nd clash)

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 3.5);
    // Sawtooth / rich buzz
    let s = 0;
    for (let h = 1; h <= 6; h++) {
      s += (1 / h) * Math.sin(2 * Math.PI * freq1 * h * t);
      s += (1 / h) * Math.sin(2 * Math.PI * freq2 * h * t);
    }
    samples[i] = s * 0.25 * env;
  }
  return samples;
}

// 6. THIEF ESCAPE (0.8s sneaky whoosh + mischievous chime)
function generateThiefEscape() {
  const duration = 0.85;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Part 1: Fast descending whistle / slide (0 - 0.35s)
    let slide = 0;
    if (t < 0.4) {
      const f = 1200 * Math.exp(-t * 6);
      const env = Math.exp(-t * 5);
      slide = Math.sin(2 * Math.PI * f * t) * env * 0.4;
    }

    // Part 2: Sly staccato tip-toe steps (0.35s - 0.85s)
    let steps = 0;
    const stepTimes = [0.35, 0.50, 0.65];
    const stepNotes = [440, 415.3, 392]; // chromatic descent A -> G# -> G
    for (let j = 0; j < stepTimes.length; j++) {
      const st = stepTimes[j];
      if (t >= st && t < st + 0.12) {
        const dt = t - st;
        const env = Math.exp(-dt * 30);
        steps += Math.sin(2 * Math.PI * stepNotes[j] * dt) * env * 0.35;
      }
    }

    samples[i] = slide + steps;
  }
  return samples;
}

// 7. MANTRI SHIELD CAST (0.9s celestial energy barrier)
function generateShieldCast() {
  const duration = 0.95;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 3);

    // Rising ethereal chime
    const freq = 440 + Math.sin(t * 8) * 40 + t * 400;
    const shimmer = Math.sin(2 * Math.PI * 14 * t);

    const s1 = Math.sin(2 * Math.PI * freq * t);
    const s2 = 0.4 * Math.sin(2 * Math.PI * (freq * 1.5) * t);
    const s3 = 0.25 * Math.sin(2 * Math.PI * (freq * 2) * t);

    samples[i] = (s1 + s2 + s3) * (0.35 + 0.1 * shimmer) * env;
  }
  return samples;
}

// 8. COIN LOOT (0.75s clinking treasure coins)
function generateCoinLoot() {
  const duration = 0.75;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  const coinHits = [0.0, 0.08, 0.18, 0.30, 0.42];
  const freqs = [2093.0, 2637.0, 3135.9, 2349.3, 2793.8]; // High metallic ring

  for (let k = 0; k < coinHits.length; k++) {
    const hitTime = coinHits[k];
    const hitFreq = freqs[k];
    const startIdx = Math.floor(hitTime * SAMPLE_RATE);

    for (let i = startIdx; i < numSamples; i++) {
      const dt = (i - startIdx) / SAMPLE_RATE;
      if (dt > 0.25) break;
      const env = Math.exp(-dt * 20);
      const tone = Math.sin(2 * Math.PI * hitFreq * dt);
      const overtone = 0.5 * Math.sin(2 * Math.PI * (hitFreq * 2.76) * dt);
      samples[i] += (tone + overtone) * 0.25 * env;
    }
  }
  return samples;
}

// 9. ROYAL FANFARE (1.3s majestic herald trumpets)
function generateRoyalFanfare() {
  const duration = 1.35;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  // Regal motif: D4 -> F#4 -> A4 -> D5 -> A4 -> D5 (triad fanfare)
  const motif = [
    { freq: 293.66, start: 0.0, dur: 0.18 },  // D4
    { freq: 369.99, start: 0.18, dur: 0.18 }, // F#4
    { freq: 440.00, start: 0.36, dur: 0.22 }, // A4
    { freq: 587.33, start: 0.58, dur: 0.75 }, // D5 sustained
    { freq: 440.00, start: 0.58, dur: 0.75 }, // A4 harmony
    { freq: 293.66, start: 0.58, dur: 0.75 }, // D4 bass
  ];

  for (const n of motif) {
    const startIdx = Math.floor(n.start * SAMPLE_RATE);
    const endIdx = Math.min(numSamples, Math.floor((n.start + n.dur) * SAMPLE_RATE));

    for (let i = startIdx; i < endIdx; i++) {
      const t = (i - startIdx) / SAMPLE_RATE;
      const attack = t < 0.03 ? t / 0.03 : 1;
      const decay = Math.exp(-t * (2.8 / n.dur));
      const env = attack * decay;

      const s1 = Math.sin(2 * Math.PI * n.freq * t);
      const s2 = 0.5 * Math.sin(2 * Math.PI * n.freq * 2 * t);
      const s3 = 0.25 * Math.sin(2 * Math.PI * n.freq * 3 * t);

      samples[i] += (s1 + s2 + s3) * 0.22 * env;
    }
  }
  return samples;
}

// 10. GAVEL STRIKE (0.45s courtroom wooden gavel rap)
function generateGavelStrike() {
  const duration = 0.45;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Initial sharp impulse
    const knock = Math.sin(2 * Math.PI * 180 * Math.exp(-t * 30) * t) * Math.exp(-t * 25);
    const woodBody = Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 12);
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 60);

    samples[i] = (knock * 0.5 + woodBody * 0.35 + click * 0.25) * 0.8;
  }
  return samples;
}

// 11. SELECT CLICK (0.08s tactile wooden/modern button tick)
function generateSelectClick() {
  const duration = 0.08;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 65);
    const freq = 1200 * Math.exp(-t * 40);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  }
  return samples;
}

// 12. TIMER TICK (0.07s clean mechanical clock tick)
function generateTimerTick() {
  const duration = 0.07;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 80);
    const tone = Math.sin(2 * Math.PI * 980 * t);
    const click = (Math.random() * 2 - 1) * 0.4;
    samples[i] = (tone * 0.7 + click * 0.3) * env * 0.45;
  }
  return samples;
}

// Generate all sound files
const soundGenerators = {
  'card_shuffle.wav': generateCardShuffle,
  'card_flip.wav': generateCardFlip,
  'police_siren.wav': generatePoliceSiren,
  'correct_catch.wav': generateCorrectCatch,
  'wrong_buzzer.wav': generateWrongBuzzer,
  'thief_escape.wav': generateThiefEscape,
  'shield_cast.wav': generateShieldCast,
  'coin_loot.wav': generateCoinLoot,
  'royal_fanfare.wav': generateRoyalFanfare,
  'gavel_strike.wav': generateGavelStrike,
  'select_click.wav': generateSelectClick,
  'timer_tick.wav': generateTimerTick,
};

console.log('Generating game sound effects...');
for (const [filename, generator] of Object.entries(soundGenerators)) {
  const samples = generator();
  const wavBuffer = createWavBuffer(samples);
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`Generated: ${filePath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
}
console.log('All sound effects generated successfully!');
