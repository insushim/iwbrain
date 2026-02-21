import { create } from "zustand";
import type { GameType } from "@/types";

interface GameState {
  currentGame: GameType | null;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  level: number;
  startTime: number | null;
  errors: number;
  hintsUsed: number;
}

interface GameActions {
  startGame: (gameType: GameType) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  loseLife: () => void;
  useHint: () => void;
  incrementErrors: () => void;
  setLevel: (level: number) => void;
  reset: () => void;
}

const initialState: GameState = {
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  level: 1,
  startTime: null,
  errors: 0,
  hintsUsed: 0,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  startGame: (gameType) =>
    set({
      ...initialState,
      currentGame: gameType,
      isPlaying: true,
      startTime: Date.now(),
    }),

  pauseGame: () => set({ isPaused: true }),

  resumeGame: () => set({ isPaused: false }),

  endGame: () => set({ isPlaying: false, isGameOver: true }),

  addScore: (points) => set((s) => ({ score: s.score + points })),

  incrementCombo: () =>
    set((s) => {
      const newCombo = s.combo + 1;
      return {
        combo: newCombo,
        maxCombo: Math.max(s.maxCombo, newCombo),
      };
    }),

  resetCombo: () => set({ combo: 0 }),

  loseLife: () =>
    set((s) => {
      const newLives = s.lives - 1;
      return {
        lives: newLives,
        ...(newLives <= 0 ? { isPlaying: false, isGameOver: true } : {}),
      };
    }),

  useHint: () => set((s) => ({ hintsUsed: s.hintsUsed + 1 })),

  incrementErrors: () => set((s) => ({ errors: s.errors + 1 })),

  setLevel: (level) => set({ level }),

  reset: () => set(initialState),
}));
