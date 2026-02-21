"use client";
import { useState, useCallback } from "react";
import type { GameType, DifficultyState } from "@/types";
import { createDifficultyState, updateDifficulty } from "@/lib/difficulty";
import { useUserStore } from "@/stores/userStore";

export function useAdaptiveDifficulty(gameType: GameType) {
  const storedLevel = useUserStore(
    (s) => s.profile.difficultyLevels[gameType] ?? 1,
  );

  const [difficulty, setDifficulty] = useState<DifficultyState>(() => {
    const state = createDifficultyState();
    state.level = storedLevel;
    return state;
  });

  const recordAnswer = useCallback((correct: boolean, responseTime: number) => {
    setDifficulty((prev) => updateDifficulty(prev, correct, responseTime));
  }, []);

  const getLevel = useCallback((): number => {
    return Math.floor(difficulty.level);
  }, [difficulty.level]);

  return { difficulty, recordAnswer, getLevel };
}
