import { soundService } from '../services/soundService';

/**
 * Plays a realistic card shuffle / riffle audio sound effect via soundService (Howler).
 */
export const playCardShuffleSound = () => {
  try {
    soundService.playCardShuffle();
  } catch (err) {
    console.warn("Card shuffle sound playback failed:", err);
  }
};
