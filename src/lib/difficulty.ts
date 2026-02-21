import type { DifficultyState } from "@/types";

export function createDifficultyState(): DifficultyState {
  return {
    level: 1,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    recentAccuracy: [],
    avgResponseTime: 0,
  };
}

export function updateDifficulty(
  state: DifficultyState,
  correct: boolean,
  responseTime: number,
): DifficultyState {
  const newState = { ...state };

  if (correct) {
    newState.consecutiveCorrect++;
    newState.consecutiveWrong = 0;
  } else {
    newState.consecutiveWrong++;
    newState.consecutiveCorrect = 0;
  }

  newState.recentAccuracy = [
    ...state.recentAccuracy.slice(-9),
    correct ? 1 : 0,
  ];

  const totalResponses = state.recentAccuracy.length + 1;
  newState.avgResponseTime =
    (state.avgResponseTime * (totalResponses - 1) + responseTime) /
    totalResponses;

  if (newState.consecutiveCorrect >= 3) {
    newState.level = Math.min(10, newState.level + 0.5);
    newState.consecutiveCorrect = 0;
  }

  if (newState.consecutiveWrong >= 3) {
    newState.level = Math.max(1, newState.level - 1);
    newState.consecutiveWrong = 0;
  }

  if (newState.recentAccuracy.length >= 10) {
    const accuracy =
      newState.recentAccuracy.reduce((a, b) => a + b, 0) /
      newState.recentAccuracy.length;

    const timeThreshold = getLevelTimeThreshold(newState.level);

    if (accuracy >= 0.8 && newState.avgResponseTime <= timeThreshold) {
      newState.level = Math.min(10, newState.level + 1);
      newState.recentAccuracy = [];
    } else if (accuracy <= 0.4) {
      newState.level = Math.max(1, newState.level - 1);
      newState.recentAccuracy = [];
    }
  }

  newState.level = Math.round(newState.level * 10) / 10;

  return newState;
}

function getLevelTimeThreshold(level: number): number {
  return Math.max(1000, 5000 - level * 400);
}

export function getDifficultyLabel(level: number): string {
  if (level <= 3) return "쉬움";
  if (level <= 5) return "보통";
  if (level <= 7) return "어려움";
  return "극한";
}

export function getDifficultyColor(level: number): string {
  if (level <= 3) return "#00B894";
  if (level <= 5) return "#FDCB6E";
  if (level <= 7) return "#E17055";
  return "#D63031";
}
