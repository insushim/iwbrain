import { create } from "zustand";
import type { GameSession, GameType, UserProfile } from "@/types";
import {
  getUserProfile,
  saveUserProfile,
  saveSession,
  getSessions,
} from "@/lib/storage";

interface UserState {
  profile: UserProfile;
  sessions: GameSession[];
  initialized: boolean;
}

interface UserActions {
  init: () => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addSession: (session: GameSession) => Promise<void>;
  updateStreak: () => void;
  addAchievement: (id: string) => void;
  updateDifficultyLevel: (gameType: GameType, level: number) => void;
  updateBrainScore: (score: number) => void;
}

const defaultProfile: UserProfile = {
  totalGames: 0,
  totalPlayTime: 0,
  brainScore: 0,
  streakDays: 0,
  lastPlayDate: "",
  achievements: [],
  difficultyLevels: {
    "number-logic": 1,
    "pattern-memory": 1,
    "color-sequence": 1,
    "word-chain": 1,
    "math-rush": 1,
    "spatial-puzzle": 1,
  },
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  profile: defaultProfile,
  sessions: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const profile = getUserProfile();
    const sessions = await getSessions();
    set({ profile, sessions, initialized: true });
  },

  updateProfile: (partial) => {
    const profile = { ...get().profile, ...partial };
    saveUserProfile(profile);
    set({ profile });
  },

  addSession: async (session) => {
    await saveSession(session);
    const profile = {
      ...get().profile,
      totalGames: get().profile.totalGames + 1,
      totalPlayTime: get().profile.totalPlayTime + session.duration,
    };
    saveUserProfile(profile);
    set((s) => ({
      sessions: [...s.sessions, session],
      profile,
    }));
  },

  updateStreak: () => {
    const { profile } = get();
    const today = getToday();

    if (profile.lastPlayDate === today) return;

    const yesterday = getYesterday();
    const newStreak =
      profile.lastPlayDate === yesterday ? profile.streakDays + 1 : 1;

    const updated = {
      ...profile,
      streakDays: newStreak,
      lastPlayDate: today,
    };
    saveUserProfile(updated);
    set({ profile: updated });
  },

  addAchievement: (id) => {
    const { profile } = get();
    if (profile.achievements.includes(id)) return;
    const updated = {
      ...profile,
      achievements: [...profile.achievements, id],
    };
    saveUserProfile(updated);
    set({ profile: updated });
  },

  updateDifficultyLevel: (gameType, level) => {
    const { profile } = get();
    const updated = {
      ...profile,
      difficultyLevels: {
        ...profile.difficultyLevels,
        [gameType]: level,
      },
    };
    saveUserProfile(updated);
    set({ profile: updated });
  },

  updateBrainScore: (score) => {
    const { profile } = get();
    const updated = { ...profile, brainScore: score };
    saveUserProfile(updated);
    set({ profile: updated });
  },
}));
