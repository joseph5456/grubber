import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Grade } from './types';

let chimePlayer: AudioPlayer | null = null;

function getChimePlayer(): AudioPlayer {
  if (!chimePlayer) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    chimePlayer = createAudioPlayer(require('../assets/sounds/chime.wav'));
  }
  return chimePlayer;
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
    const feedbackType =
      grade === 'excellent' || grade === 'good'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning;
    await Haptics.notificationAsync(feedbackType);
  } catch {
    // Haptics aren't available on web.
  }
}
