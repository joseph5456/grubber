import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlagTag, Product } from './types';

export interface HistoryEntry {
  product: Product;
  scannedAt: string;
}

export interface StreakState {
  current: number;
  longest: number;
  lastScanDate: string | null;
}

export interface ChallengeState {
  target: number;
  progress: number;
  startedAt: string;
  completedAt: string | null;
}

export interface UserProfile {
  avoidedTags: FlagTag[];
  reminderEnabled: boolean;
  reminderHour: number;
}

const KEYS = {
  history: '@foodscanner/history',
  streak: '@foodscanner/streak',
  challenge: '@foodscanner/challenge',
  profile: '@foodscanner/profile',
};

export const DEFAULT_STREAK: StreakState = { current: 0, longest: 0, lastScanDate: null };
export const DEFAULT_PROFILE: UserProfile = {
  avoidedTags: [],
  reminderEnabled: false,
  reminderHour: 9,
};

const MAX_HISTORY = 200;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export function loadHistory(): Promise<HistoryEntry[]> {
  return readJSON(KEYS.history, []);
}

export function saveHistory(history: HistoryEntry[]): Promise<void> {
  return writeJSON(KEYS.history, history.slice(0, MAX_HISTORY));
}

export function loadStreak(): Promise<StreakState> {
  return readJSON(KEYS.streak, DEFAULT_STREAK);
}

export function saveStreak(streak: StreakState): Promise<void> {
  return writeJSON(KEYS.streak, streak);
}

export function loadChallenge(): Promise<ChallengeState | null> {
  return readJSON<ChallengeState | null>(KEYS.challenge, null);
}

export function saveChallenge(challenge: ChallengeState | null): Promise<void> {
  return writeJSON(KEYS.challenge, challenge);
}

export function loadProfile(): Promise<UserProfile> {
  return readJSON(KEYS.profile, DEFAULT_PROFILE);
}

export function saveProfile(profile: UserProfile): Promise<void> {
  return writeJSON(KEYS.profile, profile);
}
