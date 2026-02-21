import { create } from "zustand";
import type { DailyChallengeData, GameType } from "@/types";
import {
  getDailyChallenge,
  saveDailyChallenge,
  getDailyHistory,
  saveDailyHistory,
} from "@/lib/storage";
import { generateDailyChallenge } from "@/data/daily-seeds";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

interface DailyState {
  todayChallenge: DailyChallengeData | null;
  history: Record<string, boolean>;
  initialized: boolean;
}

interface DailyActions {
  init: () => void;
  generateToday: () => void;
  updateMissionProgress: (gameType: GameType, value: number) => void;
  completeMission: (index: number) => void;
  checkCompletion: () => void;
}

export const useDailyStore = create<DailyState & DailyActions>((set, get) => ({
  todayChallenge: null,
  history: {},
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const today = getToday();
    const challenge = getDailyChallenge(today);
    const history = getDailyHistory();

    if (challenge) {
      set({ todayChallenge: challenge, history, initialized: true });
    } else {
      set({ history, initialized: true });
      get().generateToday();
    }
  },

  generateToday: () => {
    const today = getToday();
    const generated = generateDailyChallenge(new Date(today));
    const challenge: DailyChallengeData = { ...generated, completed: false };
    saveDailyChallenge(challenge);
    set({ todayChallenge: challenge });
  },

  updateMissionProgress: (gameType, value) => {
    const { todayChallenge } = get();
    if (!todayChallenge) return;

    const missions = todayChallenge.missions.map((m) => {
      if (m.gameType !== gameType || m.completed) return m;
      const newCurrent = m.current + value;
      return {
        ...m,
        current: newCurrent,
        completed: newCurrent >= m.target,
      };
    });

    const updated = { ...todayChallenge, missions };
    saveDailyChallenge(updated);
    set({ todayChallenge: updated });
    get().checkCompletion();
  },

  completeMission: (index) => {
    const { todayChallenge } = get();
    if (!todayChallenge) return;

    const missions = todayChallenge.missions.map((m, i) =>
      i === index ? { ...m, completed: true, current: m.target } : m,
    );

    const updated = { ...todayChallenge, missions };
    saveDailyChallenge(updated);
    set({ todayChallenge: updated });
    get().checkCompletion();
  },

  checkCompletion: () => {
    const { todayChallenge, history } = get();
    if (!todayChallenge || todayChallenge.completed) return;

    const allDone = todayChallenge.missions.every((m) => m.completed);
    if (!allDone) return;

    const updated = { ...todayChallenge, completed: true };
    saveDailyChallenge(updated);

    const newHistory = { ...history, [todayChallenge.date]: true };
    saveDailyHistory(newHistory);

    set({ todayChallenge: updated, history: newHistory });
  },
}));
