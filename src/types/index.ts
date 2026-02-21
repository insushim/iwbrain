export type GameType =
  | "number-logic"
  | "pattern-memory"
  | "color-sequence"
  | "word-chain"
  | "math-rush"
  | "spatial-puzzle";

export type Difficulty = "easy" | "medium" | "hard" | "extreme";

export type CognitiveArea =
  | "logic"
  | "memory"
  | "attention"
  | "language"
  | "math"
  | "spatial";

export interface GameConfig {
  id: GameType;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  cognitiveArea: CognitiveArea;
  minDuration: number;
  maxDuration: number;
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  "number-logic": {
    id: "number-logic",
    name: "넘버로직",
    nameEn: "Number Logic",
    description: "수학 연산과 논리로 그리드를 완성하세요",
    icon: "🔢",
    color: "#0984E3",
    cognitiveArea: "logic",
    minDuration: 60,
    maxDuration: 600,
  },
  "pattern-memory": {
    id: "pattern-memory",
    name: "패턴메모리",
    nameEn: "Pattern Memory",
    description: "빛나는 패턴의 순서를 기억하세요",
    icon: "🧩",
    color: "#E84393",
    cognitiveArea: "memory",
    minDuration: 30,
    maxDuration: 300,
  },
  "color-sequence": {
    id: "color-sequence",
    name: "컬러시퀀스",
    nameEn: "Color Sequence",
    description: "색상과 글자의 함정을 피하세요",
    icon: "🎨",
    color: "#00CEC9",
    cognitiveArea: "attention",
    minDuration: 30,
    maxDuration: 120,
  },
  "word-chain": {
    id: "word-chain",
    name: "워드체인",
    nameEn: "Word Chain",
    description: "끝말잇기로 어휘력을 키우세요",
    icon: "📝",
    color: "#6C5CE7",
    cognitiveArea: "language",
    minDuration: 30,
    maxDuration: 180,
  },
  "math-rush": {
    id: "math-rush",
    name: "매스러시",
    nameEn: "Math Rush",
    description: "빠른 암산으로 두뇌를 깨우세요",
    icon: "⚡",
    color: "#FDCB6E",
    cognitiveArea: "math",
    minDuration: 60,
    maxDuration: 60,
  },
  "spatial-puzzle": {
    id: "spatial-puzzle",
    name: "공간퍼즐",
    nameEn: "Spatial Puzzle",
    description: "논그램 퍼즐로 숨겨진 그림을 찾으세요",
    icon: "🏗️",
    color: "#00B894",
    cognitiveArea: "spatial",
    minDuration: 60,
    maxDuration: 600,
  },
};

export interface GameSession {
  id: string;
  gameType: GameType;
  score: number;
  level: number;
  duration: number;
  accuracy: number;
  maxCombo: number;
  hintsUsed: number;
  completedAt: string;
  details: Record<string, unknown>;
}

export interface UserProfile {
  totalGames: number;
  totalPlayTime: number;
  brainScore: number;
  streakDays: number;
  lastPlayDate: string;
  achievements: string[];
  difficultyLevels: Record<GameType, number>;
}

export interface DailyChallengeMission {
  gameType: GameType;
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface DailyChallengeData {
  date: string;
  missions: DailyChallengeMission[];
  completed: boolean;
  reward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "general" | GameType;
  condition: (profile: UserProfile, sessions: GameSession[]) => boolean;
  reward: string;
}

export interface DifficultyState {
  level: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  recentAccuracy: number[];
  avgResponseTime: number;
}

export interface CognitiveScores {
  logic: number;
  memory: number;
  attention: number;
  language: number;
  math: number;
  spatial: number;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundVolume: number;
  darkMode: boolean | "system";
  language: "ko" | "en";
}

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  soundVolume: 70,
  darkMode: "system",
  language: "ko",
};

export const BRAIN_RANKS = [
  { min: 0, max: 100, label: "새싹", icon: "🌱" },
  { min: 100, max: 200, label: "풀잎", icon: "🌿" },
  { min: 200, max: 300, label: "나무", icon: "🌳" },
  { min: 300, max: 400, label: "별", icon: "⭐" },
  { min: 400, max: 500, label: "빛나는 별", icon: "🌟" },
  { min: 500, max: 600, label: "다이아몬드", icon: "💎" },
  { min: 600, max: 700, label: "왕관", icon: "👑" },
  { min: 700, max: 800, label: "트로피", icon: "🏆" },
  { min: 800, max: 999, label: "천재", icon: "🧠" },
] as const;

export const STREAK_FRAMES = [
  { days: 3, label: "브론즈", color: "#CD7F32" },
  { days: 7, label: "실버", color: "#C0C0C0" },
  { days: 14, label: "골드", color: "#FFD700" },
  { days: 30, label: "다이아몬드", color: "#B9F2FF" },
  { days: 100, label: "레인보우", color: "rainbow" },
] as const;

export type PatternMemoryMode = "normal" | "reverse" | "color" | "double";

export interface NonogramPuzzle {
  id: string;
  name: string;
  emoji: string;
  size: number;
  grid: number[][];
}
