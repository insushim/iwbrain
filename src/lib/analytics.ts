import type { GameSession, CognitiveScores, GameType } from "@/types";
import { calculateCognitiveScore } from "./scoring";

const COGNITIVE_MAP: Record<GameType, keyof CognitiveScores> = {
  "number-logic": "logic",
  "pattern-memory": "memory",
  "color-sequence": "attention",
  "word-chain": "language",
  "math-rush": "math",
  "spatial-puzzle": "spatial",
};

export function calculateCognitiveScores(
  sessions: GameSession[],
): CognitiveScores {
  const scores: CognitiveScores = {
    logic: 0,
    memory: 0,
    attention: 0,
    language: 0,
    math: 0,
    spatial: 0,
  };

  const gameTypes: GameType[] = [
    "number-logic",
    "pattern-memory",
    "color-sequence",
    "word-chain",
    "math-rush",
    "spatial-puzzle",
  ];

  for (const gameType of gameTypes) {
    const gameSessions = sessions
      .filter((s) => s.gameType === gameType)
      .map((s) => ({ score: s.score, accuracy: s.accuracy }));

    const area = COGNITIVE_MAP[gameType];
    scores[area] = calculateCognitiveScore(gameSessions);
  }

  return scores;
}

export function getWeeklyProgress(
  sessions: GameSession[],
  weeks: number = 4,
): { week: string; scores: CognitiveScores }[] {
  const now = new Date();
  const result: { week: string; scores: CognitiveScores }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.completedAt);
      return d >= weekStart && d < weekEnd;
    });

    result.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      scores: calculateCognitiveScores(weekSessions),
    });
  }

  return result;
}

export function getGameStats(sessions: GameSession[], gameType: GameType) {
  const gameSessions = sessions.filter((s) => s.gameType === gameType);
  if (gameSessions.length === 0) {
    return {
      totalGames: 0,
      avgScore: 0,
      bestScore: 0,
      avgAccuracy: 0,
      totalTime: 0,
    };
  }

  return {
    totalGames: gameSessions.length,
    avgScore: Math.round(
      gameSessions.reduce((s, g) => s + g.score, 0) / gameSessions.length,
    ),
    bestScore: Math.max(...gameSessions.map((g) => g.score)),
    avgAccuracy: Math.round(
      (gameSessions.reduce((s, g) => s + g.accuracy, 0) / gameSessions.length) *
        100,
    ),
    totalTime: gameSessions.reduce((s, g) => s + g.duration, 0),
  };
}

export function getStrongestArea(scores: CognitiveScores): string {
  const entries = Object.entries(scores) as [keyof CognitiveScores, number][];
  const best = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const labels: Record<keyof CognitiveScores, string> = {
    logic: "논리력",
    memory: "기억력",
    attention: "주의력",
    language: "언어력",
    math: "연산력",
    spatial: "공간력",
  };
  return labels[best[0]];
}

export function getWeakestArea(scores: CognitiveScores): string {
  const entries = Object.entries(scores) as [keyof CognitiveScores, number][];
  const nonZero = entries.filter(([, v]) => v > 0);
  if (nonZero.length === 0) return "아직 데이터 없음";
  const worst = nonZero.reduce((a, b) => (b[1] < a[1] ? b : a));
  const labels: Record<keyof CognitiveScores, string> = {
    logic: "논리력",
    memory: "기억력",
    attention: "주의력",
    language: "언어력",
    math: "연산력",
    spatial: "공간력",
  };
  return labels[worst[0]];
}
