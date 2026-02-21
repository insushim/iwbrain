import type { Achievement, GameSession, UserProfile, GameType } from "@/types";

const ALL_GAME_TYPES: GameType[] = [
  "number-logic",
  "pattern-memory",
  "color-sequence",
  "word-chain",
  "math-rush",
  "spatial-puzzle",
];

function sessionsOf(sessions: GameSession[], type: GameType): GameSession[] {
  return sessions.filter((s) => s.gameType === type);
}

export const ACHIEVEMENTS: Achievement[] = [
  // ===== General (10) =====
  {
    id: "first-step",
    title: "첫 걸음",
    description: "첫 번째 게임을 완료하세요",
    icon: "👣",
    category: "general",
    condition: (profile) => profile.totalGames >= 1,
    reward: "두뇌 점수 +5",
  },
  {
    id: "steady-challenge",
    title: "꾸준한 도전",
    description: "게임을 10회 완료하세요",
    icon: "🎯",
    category: "general",
    condition: (profile) => profile.totalGames >= 10,
    reward: "두뇌 점수 +10",
  },
  {
    id: "practice-bug",
    title: "연습벌레",
    description: "게임을 50회 완료하세요",
    icon: "🐛",
    category: "general",
    condition: (profile) => profile.totalGames >= 50,
    reward: "두뇌 점수 +20",
  },
  {
    id: "brain-marathon",
    title: "두뇌 마라톤",
    description: "게임을 100회 완료하세요",
    icon: "🏃",
    category: "general",
    condition: (profile) => profile.totalGames >= 100,
    reward: "두뇌 점수 +30",
  },
  {
    id: "thousand-challenges",
    title: "천 번의 도전",
    description: "게임을 1000회 완료하세요",
    icon: "🏅",
    category: "general",
    condition: (profile) => profile.totalGames >= 1000,
    reward: "두뇌 점수 +100",
  },
  {
    id: "first-perfect",
    title: "완벽한 순간",
    description: "어떤 게임이든 정확도 100%로 클리어하세요",
    icon: "💯",
    category: "general",
    condition: (_profile, sessions) => sessions.some((s) => s.accuracy === 100),
    reward: "두뇌 점수 +15",
  },
  {
    id: "all-rounder",
    title: "올라운더",
    description: "6가지 게임을 모두 플레이하세요",
    icon: "🌈",
    category: "general",
    condition: (_profile, sessions) => {
      const played = new Set(sessions.map((s) => s.gameType));
      return ALL_GAME_TYPES.every((t) => played.has(t));
    },
    reward: "두뇌 점수 +25",
  },
  {
    id: "daily-challenger",
    title: "일일 도전자",
    description: "첫 데일리 챌린지를 완료하세요",
    icon: "📅",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => s.details.daily === true),
    reward: "두뇌 점수 +10",
  },
  {
    id: "weekly-champion",
    title: "주간 챔피언",
    description: "7일 연속으로 플레이하세요",
    icon: "🗓️",
    category: "general",
    condition: (profile) => profile.streakDays >= 7,
    reward: "두뇌 점수 +20",
  },
  {
    id: "monthly-devotion",
    title: "한 달의 헌신",
    description: "30일 연속으로 플레이하세요",
    icon: "🔥",
    category: "general",
    condition: (profile) => profile.streakDays >= 30,
    reward: "두뇌 점수 +50",
  },

  // ===== Number Logic (7) =====
  {
    id: "nl-start",
    title: "넘버로직 입문",
    description: "넘버로직을 1회 클리어하세요",
    icon: "🔢",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").length >= 1,
    reward: "두뇌 점수 +5",
  },
  {
    id: "nl-speed",
    title: "빠른 계산",
    description: "4x4 넘버로직을 60초 안에 클리어하세요",
    icon: "⏱️",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.gridSize as number) === 4 && s.duration < 60,
      ),
    reward: "두뇌 점수 +10",
  },
  {
    id: "nl-master",
    title: "넘버로직 마스터",
    description: "6x6 넘버로직을 힌트 없이 클리어하세요",
    icon: "🧮",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.gridSize as number) === 6 && s.hintsUsed === 0,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "nl-flawless",
    title: "완벽한 논리",
    description: "넘버로직을 에러 0으로 클리어하세요",
    icon: "✨",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.errors as number) === 0,
      ),
    reward: "두뇌 점수 +10",
  },
  {
    id: "nl-lightning",
    title: "번개 계산",
    description: "5x5 넘버로직을 120초 안에 클리어하세요",
    icon: "⚡",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.gridSize as number) === 5 && s.duration < 120,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "nl-streak",
    title: "연속 클리어",
    description: "넘버로직을 5회 연속 클리어하세요",
    icon: "🔗",
    category: "number-logic",
    condition: (_profile, sessions) => {
      const nlSessions = sessionsOf(sessions, "number-logic");
      if (nlSessions.length < 5) return false;
      let consecutive = 0;
      for (const s of nlSessions) {
        if (s.accuracy > 0) {
          consecutive++;
          if (consecutive >= 5) return true;
        } else {
          consecutive = 0;
        }
      }
      return false;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "nl-conqueror",
    title: "넘버로직 정복자",
    description: "다양한 크기의 넘버로직을 30회 이상 클리어하세요",
    icon: "👑",
    category: "number-logic",
    condition: (_profile, sessions) => {
      const nlSessions = sessionsOf(sessions, "number-logic");
      if (nlSessions.length < 30) return false;
      const sizes = new Set(
        nlSessions.map((s) => s.details.gridSize as number),
      );
      return sizes.size >= 2;
    },
    reward: "두뇌 점수 +25",
  },

  // ===== Pattern Memory (7) =====
  {
    id: "pm-start",
    title: "패턴 입문",
    description: "패턴메모리에서 라운드 5에 도달하세요",
    icon: "🧩",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 5),
    reward: "두뇌 점수 +5",
  },
  {
    id: "pm-great",
    title: "뛰어난 기억력",
    description: "패턴메모리에서 라운드 10에 도달하세요",
    icon: "🧠",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 10),
    reward: "두뇌 점수 +15",
  },
  {
    id: "pm-photo",
    title: "사진 기억력",
    description: "패턴메모리에서 라운드 15에 도달하세요",
    icon: "📸",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 15),
    reward: "두뇌 점수 +25",
  },
  {
    id: "pm-superhuman",
    title: "초인적 기억력",
    description: "패턴메모리에서 라운드 20에 도달하세요",
    icon: "🦸",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 20),
    reward: "두뇌 점수 +40",
  },
  {
    id: "pm-reverse",
    title: "역순 도전",
    description: "리버스 모드에서 5라운드에 도달하세요",
    icon: "🔄",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => s.details.mode === "reverse" && s.level >= 5,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "pm-multi",
    title: "더블 패턴",
    description: "더블 모드에서 3라운드에 도달하세요",
    icon: "👀",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => s.details.mode === "double" && s.level >= 3,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "pm-perfect",
    title: "완벽한 기억",
    description: "패턴메모리에서 실수 없이 라운드 10에 도달하세요",
    icon: "💎",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => s.level >= 10 && (s.details.mistakes as number) === 0,
      ),
    reward: "두뇌 점수 +30",
  },

  // ===== Color Sequence (6) =====
  {
    id: "cs-start",
    title: "컬러 입문",
    description: "컬러시퀀스에서 10문제를 맞추세요",
    icon: "🎨",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.score >= 10),
    reward: "두뇌 점수 +5",
  },
  {
    id: "cs-20streak",
    title: "20 연속 정답",
    description: "컬러시퀀스에서 20문제 연속 정답을 기록하세요",
    icon: "🔥",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.maxCombo >= 20),
    reward: "두뇌 점수 +15",
  },
  {
    id: "cs-50streak",
    title: "50 연속 정답",
    description: "컬러시퀀스에서 50문제 연속 정답을 기록하세요",
    icon: "💥",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.maxCombo >= 50),
    reward: "두뇌 점수 +30",
  },
  {
    id: "cs-lightning",
    title: "번개 반응",
    description: "20문제 이상에서 평균 반응속도 800ms 이하를 기록하세요",
    icon: "⚡",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some(
        (s) => s.score >= 20 && (s.details.avgResponseTime as number) < 800,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "cs-extreme",
    title: "극한 집중",
    description: "익스트림 모드에서 10문제를 맞추세요",
    icon: "🌀",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some(
        (s) => s.details.mode === "extreme" && s.score >= 10,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "cs-master",
    title: "컬러 마스터",
    description: "컬러시퀀스에서 100점 이상을 기록하세요",
    icon: "🏆",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.score >= 100),
    reward: "두뇌 점수 +30",
  },

  // ===== Word Chain (6) =====
  {
    id: "wc-start",
    title: "워드체인 입문",
    description: "한 게임에서 10개 이상의 단어를 이으세요",
    icon: "📝",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 10),
    reward: "두뇌 점수 +5",
  },
  {
    id: "wc-vocab",
    title: "어휘력 대장",
    description: "한 게임에서 20개 이상의 단어를 이으세요",
    icon: "📖",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 20),
    reward: "두뇌 점수 +15",
  },
  {
    id: "wc-author",
    title: "작가의 자질",
    description: "한 게임에서 5글자 이상 단어를 10개 이상 사용하세요",
    icon: "✍️",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some(
        (s) => (s.details.longWords as number) >= 10,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "wc-master",
    title: "워드체인 마스터",
    description: "워드체인에서 50점 이상을 기록하세요",
    icon: "🏆",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 50),
    reward: "두뇌 점수 +25",
  },
  {
    id: "wc-dictionary",
    title: "살아있는 사전",
    description: "워드체인에서 총 500개의 고유 단어를 사용하세요",
    icon: "📚",
    category: "word-chain",
    condition: (_profile, sessions) => {
      const wcSessions = sessionsOf(sessions, "word-chain");
      const allWords = new Set<string>();
      for (const s of wcSessions) {
        const words = s.details.words as string[] | undefined;
        if (words) {
          for (const w of words) allWords.add(w);
        }
      }
      return allWords.size >= 500;
    },
    reward: "두뇌 점수 +40",
  },
  {
    id: "wc-fast",
    title: "빠른 어휘",
    description: "단어당 평균 입력 시간 3초 이하를 기록하세요",
    icon: "💨",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some(
        (s) => (s.details.avgWordTime as number) < 3,
      ),
    reward: "두뇌 점수 +15",
  },

  // ===== Math Rush (7) =====
  {
    id: "mr-start",
    title: "매스러시 입문",
    description: "매스러시에서 10문제를 맞추세요",
    icon: "➕",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 10),
    reward: "두뇌 점수 +5",
  },
  {
    id: "mr-calculator",
    title: "인간 계산기",
    description: "매스러시에서 30문제를 맞추세요",
    icon: "🔢",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 30),
    reward: "두뇌 점수 +15",
  },
  {
    id: "mr-computer",
    title: "인간 컴퓨터",
    description: "매스러시에서 50문제를 맞추세요",
    icon: "💻",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 50),
    reward: "두뇌 점수 +30",
  },
  {
    id: "mr-combo10",
    title: "10 콤보",
    description: "매스러시에서 10 콤보를 달성하세요",
    icon: "🔥",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.maxCombo >= 10),
    reward: "두뇌 점수 +10",
  },
  {
    id: "mr-combo20",
    title: "20 콤보",
    description: "매스러시에서 20 콤보를 달성하세요",
    icon: "💥",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.maxCombo >= 20),
    reward: "두뇌 점수 +20",
  },
  {
    id: "mr-level7",
    title: "고난도 돌파",
    description: "매스러시에서 레벨 7에 도달하세요",
    icon: "🚀",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.level >= 7),
    reward: "두뇌 점수 +20",
  },
  {
    id: "mr-perfect",
    title: "완벽한 계산",
    description: "매스러시에서 20문제 이상 맞추고 오답 0을 기록하세요",
    icon: "💯",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some(
        (s) => s.score >= 20 && s.accuracy === 100,
      ),
    reward: "두뇌 점수 +25",
  },

  // ===== Spatial Puzzle (7) =====
  {
    id: "sp-start",
    title: "공간퍼즐 입문",
    description: "논그램 퍼즐을 1개 완성하세요",
    icon: "🏗️",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").length >= 1,
    reward: "두뇌 점수 +5",
  },
  {
    id: "sp-pixel5",
    title: "5x5 정복",
    description: "5x5 퍼즐을 5개 완성하세요",
    icon: "🟩",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").filter(
        (s) => (s.details.puzzleSize as number) === 5,
      ).length >= 5,
    reward: "두뇌 점수 +10",
  },
  {
    id: "sp-pixel7",
    title: "7x7 정복",
    description: "7x7 퍼즐을 5개 완성하세요",
    icon: "🟦",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").filter(
        (s) => (s.details.puzzleSize as number) === 7,
      ).length >= 5,
    reward: "두뇌 점수 +15",
  },
  {
    id: "sp-pixel10",
    title: "10x10 정복",
    description: "10x10 퍼즐을 3개 완성하세요",
    icon: "🟪",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").filter(
        (s) => (s.details.puzzleSize as number) === 10,
      ).length >= 3,
    reward: "두뇌 점수 +20",
  },
  {
    id: "sp-speed",
    title: "빠른 퍼즐",
    description: "5x5 퍼즐을 60초 안에 완성하세요",
    icon: "⏱️",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").some(
        (s) => (s.details.puzzleSize as number) === 5 && s.duration < 60,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "sp-half",
    title: "절반 달성",
    description: "전체 퍼즐의 50% 이상을 완성하세요",
    icon: "📊",
    category: "spatial-puzzle",
    condition: (_profile, sessions) => {
      const spSessions = sessionsOf(sessions, "spatial-puzzle");
      const totalPuzzles =
        spSessions.length > 0
          ? (spSessions[0].details.totalPuzzles as number) || 0
          : 0;
      if (totalPuzzles === 0) return false;
      const completed = new Set(
        spSessions.map((s) => s.details.puzzleId as string),
      ).size;
      return completed >= totalPuzzles * 0.5;
    },
    reward: "두뇌 점수 +25",
  },
  {
    id: "sp-conqueror",
    title: "공간퍼즐 정복자",
    description: "모든 퍼즐을 완성하세요",
    icon: "👑",
    category: "spatial-puzzle",
    condition: (_profile, sessions) => {
      const spSessions = sessionsOf(sessions, "spatial-puzzle");
      const totalPuzzles =
        spSessions.length > 0
          ? (spSessions[0].details.totalPuzzles as number) || 0
          : 0;
      if (totalPuzzles === 0) return false;
      const completed = new Set(
        spSessions.map((s) => s.details.puzzleId as string),
      ).size;
      return completed >= totalPuzzles;
    },
    reward: "두뇌 점수 +50",
  },
];

export function checkAchievements(
  profile: UserProfile,
  sessions: GameSession[],
): string[] {
  const unlocked = profile.achievements;
  const newlyUnlocked: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;
    try {
      if (achievement.condition(profile, sessions)) {
        newlyUnlocked.push(achievement.id);
      }
    } catch {
      // Skip achievements whose condition throws (e.g. missing data)
    }
  }

  return newlyUnlocked;
}
