import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Grade } from './types';

let chimePlayer: AudioPlayer | null = null;
let fanfarePlayer: AudioPlayer | null = null;

function getChimePlayer(): AudioPlayer {
  if (!chimePlayer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    chimePlayer = createAudioPlayer(require('../assets/sounds/chime.wav'));
  }
  return chimePlayer;
}

function getFanfarePlayer(): AudioPlayer {
  if (!fanfarePlayer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fanfarePlayer = createAudioPlayer(require('../assets/sounds/fanfare.wav'));
  }
  return fanfarePlayer;
}

/** Fires on every scan — the reward is for the act of scanning, not for a good score. */
export async function playScanFeedback(grade: Grade): Promise<void> {
  try {
    const player = getChimePlayer();
    player.seekTo(0);
    player.play();
  } catch {
    // Audio isn't available on every platform/browser — the reward loop still works without it.
  }

  try {
    if (grade === 'excellent' || grade === 'good') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (grade === 'bad') {
      await playRapidShake();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch {
    // Haptics aren't available on web.
  }
}

/** A quick burst of impacts to read as a "shake" for a bad score. */
async function playRapidShake(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 90));
  }
}

/** A bigger, distinct reward for finishing a challenge — separate from the per-scan chime. */
export async function playChallengeFanfare(): Promise<void> {
  try {
    const player = getFanfarePlayer();
    player.seekTo(0);
    player.play();
  } catch {
    // Audio isn't available on every platform/browser.
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 180);
  } catch {
    // Haptics aren't available on web.
  }
}
