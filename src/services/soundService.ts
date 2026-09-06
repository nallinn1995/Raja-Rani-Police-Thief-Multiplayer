import { Howl, Howler } from 'howler';

/**
 * Game Sound Effects Service powered by Howler.js
 * Supports Classic Mode and Modern Mode audio cues, volume control, and persistence.
 */

export type SoundEffectName =
  | 'cardShuffle'
  | 'cardFlip'
  | 'policeSiren'
  | 'correctCatch'
  | 'wrongBuzzer'
  | 'thiefEscape'
  | 'shieldCast'
  | 'coinLoot'
  | 'royalFanfare'
  | 'gavelStrike'
  | 'selectClick'
  | 'timerTick';

const SOUND_FILES: Record<SoundEffectName, { src: string; volume: number; loop?: boolean }> = {
  cardShuffle: { src: '/assets/audio/sounds/card_shuffle.wav', volume: 0.75 },
  cardFlip: { src: '/assets/audio/sounds/card_flip.wav', volume: 0.8 },
  policeSiren: { src: '/assets/audio/sounds/police_siren.wav', volume: 0.65 },
  correctCatch: { src: '/assets/audio/sounds/correct_catch.wav', volume: 0.85 },
  wrongBuzzer: { src: '/assets/audio/sounds/wrong_buzzer.wav', volume: 0.7 },
  thiefEscape: { src: '/assets/audio/sounds/thief_escape.wav', volume: 0.75 },
  shieldCast: { src: '/assets/audio/sounds/shield_cast.wav', volume: 0.8 },
  coinLoot: { src: '/assets/audio/sounds/coin_loot.wav', volume: 0.8 },
  royalFanfare: { src: '/assets/audio/sounds/royal_fanfare.wav', volume: 0.85 },
  gavelStrike: { src: '/assets/audio/sounds/gavel_strike.wav', volume: 0.75 },
  selectClick: { src: '/assets/audio/sounds/select_click.wav', volume: 0.6 },
  timerTick: { src: '/assets/audio/sounds/timer_tick.wav', volume: 0.5 },
};

class SoundService {
  private sounds: Map<SoundEffectName, Howl> = new Map();
  private muted: boolean = false;
  private masterVolume: number = 0.8;
  private listeners: Set<(muted: boolean) => void> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.loadPreferences();
    this.initSounds();
  }

  private loadPreferences() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedMute = localStorage.getItem('rajarani_sfx_muted');
        if (storedMute !== null) {
          this.muted = storedMute === 'true';
        }
        const storedVol = localStorage.getItem('rajarani_sfx_volume');
        if (storedVol !== null) {
          const parsed = parseFloat(storedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.masterVolume = parsed;
          }
        }
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }

  private savePreferences() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('rajarani_sfx_muted', String(this.muted));
        localStorage.setItem('rajarani_sfx_volume', String(this.masterVolume));
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }

  private initSounds() {
    if (this.initialized) return;

    // Apply global mute & volume to Howler
    Howler.mute(this.muted);
    Howler.volume(this.masterVolume);

    // Preload audio instances
    (Object.keys(SOUND_FILES) as SoundEffectName[]).forEach((key) => {
      const config = SOUND_FILES[key];
      try {
        const howl = new Howl({
          src: [config.src],
          volume: config.volume,
          loop: !!config.loop,
          preload: true,
          html5: false, // Use Web Audio API for fast response & polyphony
        });
        this.sounds.set(key, howl);
      } catch (err) {
        console.warn(`Failed to initialize sound [${key}]:`, err);
      }
    });

    this.initialized = true;
  }

  public play(name: SoundEffectName, customVolume?: number): number | undefined {
    if (this.muted) return undefined;

    let sound = this.sounds.get(name);
    if (!sound) {
      const config = SOUND_FILES[name];
      if (!config) return undefined;
      sound = new Howl({
        src: [config.src],
        volume: customVolume ?? config.volume,
        preload: true,
        html5: false,
      });
      this.sounds.set(name, sound);
    }

    try {
      if (customVolume !== undefined) {
        sound.volume(customVolume);
      } else {
        sound.volume(SOUND_FILES[name].volume);
      }
      return sound.play();
    } catch (err) {
      console.warn(`Sound playback error for [${name}]:`, err);
      return undefined;
    }
  }

  public stop(name: SoundEffectName, id?: number) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.stop(id);
    }
  }

  // --- Classic Mode Audio Triggers ---

  public playCardShuffle() {
    this.play('cardShuffle');
  }

  public playCardFlip() {
    this.play('cardFlip');
  }

  public playRoleReveal(roleName?: string) {
    const roleLower = (roleName || '').toLowerCase();
    if (roleLower.includes('raja') || roleLower.includes('rani')) {
      this.play('royalFanfare');
    } else if (roleLower.includes('police')) {
      this.play('policeSiren');
    } else if (roleLower.includes('thief') || roleLower.includes('chor')) {
      this.play('thiefEscape');
    } else {
      this.play('cardFlip');
    }
  }

  public playPoliceSiren() {
    this.play('policeSiren');
  }

  public playCorrectCatch() {
    this.play('correctCatch');
  }

  public playWrongBuzzer() {
    this.play('wrongBuzzer');
  }

  public playThiefEscape() {
    this.play('thiefEscape');
  }

  public playTimerTick() {
    this.play('timerTick');
  }

  public playSelectClick() {
    this.play('selectClick');
  }

  // --- Modern Mode Audio Triggers ---

  public playShieldCast() {
    this.play('shieldCast');
  }

  public playCoinLoot() {
    this.play('coinLoot');
  }

  public playRoyalFanfare() {
    this.play('royalFanfare');
  }

  public playGavelStrike() {
    this.play('gavelStrike');
  }

  // --- Volume & Mute Controls ---

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    Howler.mute(mute);
    this.savePreferences();
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterVolume = clamped;
    Howler.volume(clamped);
    this.savePreferences();
  }

  public subscribe(callback: (muted: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.muted);
      } catch (e) {
        console.error('SFX listener error:', e);
      }
    });
  }
}

export const soundService = new SoundService();
