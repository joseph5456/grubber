import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  ChallengeState,
  DEFAULT_PROFILE,
  DEFAULT_STREAK,
  HistoryEntry,
  StreakState,
  UserProfile,
  loadChallenge,
  loadHistory,
  loadProfile,
  loadStreak,
  saveChallenge,
  saveHistory,
  saveProfile,
  saveStreak,
} from '../storage';
import { Product } from '../types';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayKey(): string {
  return dateKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export interface RecordScanResult {
  streakUpdated: boolean;
  challengeCompleted: boolean;
}

interface AppDataValue {
  loaded: boolean;
  history: HistoryEntry[];
  streak: StreakState;
  challenge: ChallengeState | null;
  profile: UserProfile;
  recordScan: (product: Product) => Promise<RecordScanResult>;
  setProfile: (partial: Partial<UserProfile>) => Promise<void>;
  startChallenge: (target: number) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    (async () => {
      const [h, s, c, p] = await Promise.all([
        loadHistory(),
        loadStreak(),
        loadChallenge(),
        loadProfile(),
      ]);
      setHistory(h);
      setStreak(s);
      setChallenge(c);
      setProfileState(p);
      setLoaded(true);
    })();
  }, []);

  const recordScan = async (product: Product): Promise<RecordScanResult> => {
    const entry: HistoryEntry = { product, scannedAt: new Date().toISOString() };
    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    saveHistory(nextHistory);

    const today = todayKey();
    const streakUpdated = streak.lastScanDate !== today;
    let nextStreak = streak;
    if (streakUpdated) {
      const current = streak.lastScanDate === yesterdayKey() ? streak.current + 1 : 1;
      nextStreak = {
        current,
        longest: Math.max(streak.longest, current),
        lastScanDate: today,
      };
      setStreak(nextStreak);
      saveStreak(nextStreak);
    }

    let challengeCompleted = false;
    if (challenge && !challenge.completedAt && (product.grade === 'excellent' || product.grade === 'good')) {
      const progress = challenge.progress + 1;
      challengeCompleted = progress >= challenge.target;
      const nextChallenge: ChallengeState = {
        ...challenge,
        progress,
        completedAt: challengeCompleted ? new Date().toISOString() : null,
      };
      setChallenge(nextChallenge);
      saveChallenge(nextChallenge);
    }

    return { streakUpdated, challengeCompleted };
  };

  const setProfile = async (partial: Partial<UserProfile>) => {
    const next = { ...profile, ...partial };
    setProfileState(next);
    await saveProfile(next);
  };

  const startChallenge = async (target: number) => {
    const next: ChallengeState = {
      target,
      progress: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    setChallenge(next);
    await saveChallenge(next);
  };

  const value = useMemo(
    () => ({ loaded, history, streak, challenge, profile, recordScan, setProfile, startChallenge }),
    [loaded, history, streak, challenge, profile],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
