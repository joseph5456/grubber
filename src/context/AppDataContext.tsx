import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  ChallengeState,
  DEFAULT_PROFILE,
  DEFAULT_STREAK,
  HistoryEntry,
  StreakState,
  UserProfile,
  loadChallenge,
  loadChallengeHistory,
  loadHistory,
  loadOnboarded,
  loadProfile,
  loadStreak,
  saveChallenge,
  saveChallengeHistory,
  saveHistory,
  saveOnboarded,
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

function makeChallengeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface RecordScanResult {
  streakUpdated: boolean;
  challengeCompleted: boolean;
}

interface AppDataValue {
  loaded: boolean;
  onboarded: boolean;
  history: HistoryEntry[];
  streak: StreakState;
  challenge: ChallengeState | null;
  challengeHistory: ChallengeState[];
  profile: UserProfile;
  recordScan: (product: Product) => Promise<RecordScanResult>;
  deleteHistoryEntry: (scannedAt: string) => Promise<void>;
  setProfile: (partial: Partial<UserProfile>) => Promise<void>;
  startChallenge: (target: number, label?: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  devCompleteChallenge: () => Promise<void>;
  devAddChallengeProgress: (amount: number) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streak, setStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [challengeHistory, setChallengeHistory] = useState<ChallengeState[]>([]);
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    (async () => {
      const [h, s, c, ch, p, ob] = await Promise.all([
        loadHistory(),
        loadStreak(),
        loadChallenge(),
        loadChallengeHistory(),
        loadProfile(),
        loadOnboarded(),
      ]);
      setHistory(h);
      setStreak(s);
      setChallenge(c);
      setChallengeHistory(ch);
      setProfileState(p);
      setOnboarded(ob);
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
    if (streakUpdated) {
      const current = streak.lastScanDate === yesterdayKey() ? streak.current + 1 : 1;
      const nextStreak = {
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
      if (challengeCompleted) {
        const nextChallengeHistory = [nextChallenge, ...challengeHistory];
        setChallengeHistory(nextChallengeHistory);
        saveChallengeHistory(nextChallengeHistory);
      }
    }

    return { streakUpdated, challengeCompleted };
  };

  const deleteHistoryEntry = async (scannedAt: string) => {
    const next = history.filter((h) => h.scannedAt !== scannedAt);
    setHistory(next);
    await saveHistory(next);
  };

  const setProfile = async (partial: Partial<UserProfile>) => {
    const next = { ...profile, ...partial };
    setProfileState(next);
    await saveProfile(next);
  };

  const startChallenge = async (target: number, label?: string) => {
    const next: ChallengeState = {
      id: makeChallengeId(),
      label: label?.trim() || `Scan ${target} healthy foods`,
      target,
      progress: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    setChallenge(next);
    await saveChallenge(next);
  };

  const completeOnboarding = async () => {
    setOnboarded(true);
    await saveOnboarded(true);
  };

  const devCompleteChallenge = async () => {
    if (!challenge || challenge.completedAt) return;
    const completed: ChallengeState = {
      ...challenge,
      progress: challenge.target,
      completedAt: new Date().toISOString(),
    };
    setChallenge(completed);
    await saveChallenge(completed);
    const nextChallengeHistory = [completed, ...challengeHistory];
    setChallengeHistory(nextChallengeHistory);
    await saveChallengeHistory(nextChallengeHistory);
  };

  const devAddChallengeProgress = async (amount: number) => {
    if (!challenge || challenge.completedAt) return;
    const progress = Math.min(challenge.target, challenge.progress + amount);
    const completedAt = progress >= challenge.target ? new Date().toISOString() : null;
    const next: ChallengeState = { ...challenge, progress, completedAt };
    setChallenge(next);
    await saveChallenge(next);
    if (completedAt) {
      const nextChallengeHistory = [next, ...challengeHistory];
      setChallengeHistory(nextChallengeHistory);
      await saveChallengeHistory(nextChallengeHistory);
    }
  };

  const value = useMemo(
    () => ({
      loaded,
      onboarded,
      history,
      streak,
      challenge,
      challengeHistory,
      profile,
      recordScan,
      deleteHistoryEntry,
      setProfile,
      startChallenge,
      completeOnboarding,
      devCompleteChallenge,
      devAddChallengeProgress,
    }),
    [loaded, onboarded, history, streak, challenge, challengeHistory, profile],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
