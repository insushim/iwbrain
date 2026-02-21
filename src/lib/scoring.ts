export function calculateScore(params: {
  difficultyLevel: number;
  timeLimit: number;
  timeTaken: number;
  combo: number;
  hintsUsed: number;
  errors: number;
}): number {
  const { difficultyLevel, timeLimit, timeTaken, combo, hintsUsed, errors } =
    params;

  const baseScore = difficultyLevel * 100;
  const timeBonus = Math.max(0, ((timeLimit - timeTaken) / timeLimit) * 200);
  const comboBonus = combo * 10;
  const hintPenalty = hintsUsed * 50;
  const errorPenalty = errors * 20;

  return Math.max(
    0,
    Math.round(baseScore + timeBonus + comboBonus - hintPenalty - errorPenalty),
  );
}

export function calculateBrainScore(scores: {
  logic: number;
  memory: number;
  attention: number;
  language: number;
  math: number;
  spatial: number;
}): number {
  const weights = {
    logic: 1.0,
    memory: 1.0,
    attention: 1.0,
    language: 1.0,
    math: 1.0,
    spatial: 1.0,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const weighted = Object.entries(scores).reduce((sum, [key, val]) => {
    return sum + val * (weights[key as keyof typeof weights] || 1);
  }, 0);

  return Math.round(Math.min(999, weighted / totalWeight));
}

export function calculateCognitiveScore(
  sessions: { score: number; accuracy: number }[],
): number {
  if (sessions.length === 0) return 0;
  const recent = sessions.slice(-20);
  const avgScore = recent.reduce((s, r) => s + r.score, 0) / recent.length;
  const avgAccuracy =
    recent.reduce((s, r) => s + r.accuracy, 0) / recent.length;
  const normalized = Math.min(100, (avgScore / 5) * avgAccuracy);
  return Math.round(normalized);
}
