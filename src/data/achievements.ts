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

function uniqueDays(sessions: GameSession[]): Set<string> {
  return new Set(sessions.map((s) => s.completedAt.slice(0, 10)));
}

function totalScore(sessions: GameSession[]): number {
  return sessions.reduce((sum, s) => sum + s.score, 0);
}

export const ACHIEVEMENTS: Achievement[] = [
  // ===== General (30) =====
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

  // --- General: Score milestones ---
  {
    id: "score-1000",
    title: "천 점 돌파",
    description: "총 점수 1,000점을 달성하세요",
    icon: "📊",
    category: "general",
    condition: (_profile, sessions) => totalScore(sessions) >= 1000,
    reward: "두뇌 점수 +10",
  },
  {
    id: "score-5000",
    title: "오천 점 돌파",
    description: "총 점수 5,000점을 달성하세요",
    icon: "📈",
    category: "general",
    condition: (_profile, sessions) => totalScore(sessions) >= 5000,
    reward: "두뇌 점수 +20",
  },
  {
    id: "score-10000",
    title: "만 점 클럽",
    description: "총 점수 10,000점을 달성하세요",
    icon: "🎖️",
    category: "general",
    condition: (_profile, sessions) => totalScore(sessions) >= 10000,
    reward: "두뇌 점수 +30",
  },
  {
    id: "score-50000",
    title: "스코어 거장",
    description: "총 점수 50,000점을 달성하세요",
    icon: "🏛️",
    category: "general",
    condition: (_profile, sessions) => totalScore(sessions) >= 50000,
    reward: "두뇌 점수 +50",
  },
  {
    id: "score-100000",
    title: "전설의 점수",
    description: "총 점수 100,000점을 달성하세요",
    icon: "🌟",
    category: "general",
    condition: (_profile, sessions) => totalScore(sessions) >= 100000,
    reward: "두뇌 점수 +100",
  },

  // --- General: Time milestones ---
  {
    id: "playtime-1h",
    title: "1시간 두뇌 운동",
    description: "총 플레이 시간 1시간을 달성하세요",
    icon: "⏰",
    category: "general",
    condition: (profile) => profile.totalPlayTime >= 3600,
    reward: "두뇌 점수 +10",
  },
  {
    id: "playtime-5h",
    title: "5시간 몰입",
    description: "총 플레이 시간 5시간을 달성하세요",
    icon: "⏳",
    category: "general",
    condition: (profile) => profile.totalPlayTime >= 18000,
    reward: "두뇌 점수 +20",
  },
  {
    id: "playtime-10h",
    title: "10시간의 집중",
    description: "총 플레이 시간 10시간을 달성하세요",
    icon: "🕐",
    category: "general",
    condition: (profile) => profile.totalPlayTime >= 36000,
    reward: "두뇌 점수 +30",
  },
  {
    id: "playtime-24h",
    title: "하루를 바친 두뇌",
    description: "총 플레이 시간 24시간을 달성하세요",
    icon: "🕛",
    category: "general",
    condition: (profile) => profile.totalPlayTime >= 86400,
    reward: "두뇌 점수 +50",
  },

  // --- General: Streak milestones ---
  {
    id: "streak-3",
    title: "3일 연속",
    description: "3일 연속으로 플레이하세요",
    icon: "🔗",
    category: "general",
    condition: (profile) => profile.streakDays >= 3,
    reward: "두뇌 점수 +5",
  },
  {
    id: "streak-14",
    title: "2주 연속",
    description: "14일 연속으로 플레이하세요",
    icon: "📆",
    category: "general",
    condition: (profile) => profile.streakDays >= 14,
    reward: "두뇌 점수 +25",
  },
  {
    id: "streak-60",
    title: "60일의 의지",
    description: "60일 연속으로 플레이하세요",
    icon: "💪",
    category: "general",
    condition: (profile) => profile.streakDays >= 60,
    reward: "두뇌 점수 +60",
  },
  {
    id: "streak-90",
    title: "분기의 왕",
    description: "90일 연속으로 플레이하세요",
    icon: "🏰",
    category: "general",
    condition: (profile) => profile.streakDays >= 90,
    reward: "두뇌 점수 +80",
  },
  {
    id: "streak-365",
    title: "1년의 전설",
    description: "365일 연속으로 플레이하세요",
    icon: "🎆",
    category: "general",
    condition: (profile) => profile.streakDays >= 365,
    reward: "두뇌 점수 +200",
  },

  // --- General: Variety ---
  {
    id: "variety-daily",
    title: "하루의 올라운더",
    description: "하루에 6가지 게임을 모두 플레이하세요",
    icon: "🎪",
    category: "general",
    condition: (_profile, sessions) => {
      const byDay = new Map<string, Set<GameType>>();
      for (const s of sessions) {
        const day = s.completedAt.slice(0, 10);
        if (!byDay.has(day)) byDay.set(day, new Set());
        byDay.get(day)!.add(s.gameType);
      }
      return [...byDay.values()].some((types) => types.size >= 6);
    },
    reward: "두뇌 점수 +30",
  },
  {
    id: "variety-weekly",
    title: "주간 다양성",
    description: "일주일 동안 5가지 이상의 게임을 플레이하세요",
    icon: "🎭",
    category: "general",
    condition: (_profile, sessions) => {
      const types = new Set(sessions.map((s) => s.gameType));
      return types.size >= 5;
    },
    reward: "두뇌 점수 +15",
  },

  // --- General: Time-of-day ---
  {
    id: "night-owl",
    title: "올빼미 두뇌",
    description: "자정~새벽 6시 사이에 게임을 플레이하세요",
    icon: "🦉",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const hour = new Date(s.completedAt).getHours();
        return hour >= 0 && hour < 6;
      }),
    reward: "두뇌 점수 +10",
  },
  {
    id: "early-bird",
    title: "얼리버드 두뇌",
    description: "오전 7시 이전에 게임을 플레이하세요",
    icon: "🐦",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const hour = new Date(s.completedAt).getHours();
        return hour < 7;
      }),
    reward: "두뇌 점수 +10",
  },
  {
    id: "weekend-warrior",
    title: "주말 전사",
    description: "토요일과 일요일 모두 플레이하세요",
    icon: "⚔️",
    category: "general",
    condition: (_profile, sessions) => {
      let hasSat = false;
      let hasSun = false;
      for (const s of sessions) {
        const day = new Date(s.completedAt).getDay();
        if (day === 6) hasSat = true;
        if (day === 0) hasSun = true;
      }
      return hasSat && hasSun;
    },
    reward: "두뇌 점수 +10",
  },
  {
    id: "improvement-week",
    title: "성장하는 두뇌",
    description: "일주일 동안 모든 게임의 최고점을 갱신하세요",
    icon: "📈",
    category: "general",
    condition: (_profile, sessions) => {
      if (sessions.length < 6) return false;
      const played = new Set(sessions.map((s) => s.gameType));
      return ALL_GAME_TYPES.every((t) => played.has(t));
    },
    reward: "두뇌 점수 +30",
  },

  // ===== Number Logic (17) =====
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
  {
    id: "nl-7x7",
    title: "7x7 도전자",
    description: "7x7 넘버로직 퍼즐을 클리어하세요",
    icon: "🏗️",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.gridSize as number) === 7,
      ),
    reward: "두뇌 점수 +25",
  },
  {
    id: "nl-speed-nohint",
    title: "순수한 속도",
    description: "넘버로직을 힌트 0, 2분 이내에 클리어하세요",
    icon: "🚀",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => s.hintsUsed === 0 && s.duration < 120,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "nl-streak10",
    title: "10연속 클리어",
    description: "넘버로직을 10회 연속 클리어하세요",
    icon: "🔥",
    category: "number-logic",
    condition: (_profile, sessions) => {
      const nlSessions = sessionsOf(sessions, "number-logic");
      if (nlSessions.length < 10) return false;
      let consecutive = 0;
      for (const s of nlSessions) {
        if (s.accuracy > 0) {
          consecutive++;
          if (consecutive >= 10) return true;
        } else {
          consecutive = 0;
        }
      }
      return false;
    },
    reward: "두뇌 점수 +25",
  },
  {
    id: "nl-all-sizes",
    title: "모든 크기 정복",
    description: "4x4, 5x5, 6x6, 7x7 넘버로직을 모두 클리어하세요",
    icon: "🎯",
    category: "number-logic",
    condition: (_profile, sessions) => {
      const sizes = new Set(
        sessionsOf(sessions, "number-logic").map(
          (s) => s.details.gridSize as number,
        ),
      );
      return [4, 5, 6, 7].every((sz) => sizes.has(sz));
    },
    reward: "두뇌 점수 +30",
  },
  {
    id: "nl-cells-1000",
    title: "천 개의 셀",
    description: "넘버로직에서 총 1,000개의 셀을 채우세요",
    icon: "📊",
    category: "number-logic",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "number-logic").reduce(
        (sum, s) => sum + ((s.details.cellsFilled as number) || 0),
        0,
      );
      return total >= 1000;
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "nl-low-undo",
    title: "확신의 논리",
    description: "6x6 넘버로직을 되돌리기 3회 미만으로 클리어하세요",
    icon: "💎",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) =>
          (s.details.gridSize as number) === 6 &&
          ((s.details.undoCount as number) || 0) < 3,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "nl-memo-first",
    title: "메모의 달인",
    description: "메모 모드만으로 퍼즐을 먼저 분석한 후 클리어하세요",
    icon: "📝",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.memoFirst as boolean) === true,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "nl-speedrun-4x4",
    title: "스피드런 4x4",
    description: "4x4 넘버로직을 30초 안에 클리어하세요",
    icon: "💨",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").some(
        (s) => (s.details.gridSize as number) === 4 && s.duration < 30,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "nl-50-games",
    title: "넘버로직 50회",
    description: "넘버로직을 50회 클리어하세요",
    icon: "🎮",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").length >= 50,
    reward: "두뇌 점수 +30",
  },
  {
    id: "nl-100-games",
    title: "넘버로직 백전노장",
    description: "넘버로직을 100회 클리어하세요",
    icon: "🏆",
    category: "number-logic",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "number-logic").length >= 100,
    reward: "두뇌 점수 +50",
  },

  // ===== Pattern Memory (17) =====
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
  {
    id: "pm-round25",
    title: "기억의 달인",
    description: "패턴메모리에서 라운드 25에 도달하세요",
    icon: "🎓",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 25),
    reward: "두뇌 점수 +50",
  },
  {
    id: "pm-round30",
    title: "서번트 레벨",
    description: "패턴메모리에서 라운드 30에 도달하세요",
    icon: "🌟",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some((s) => s.level >= 30),
    reward: "두뇌 점수 +80",
  },
  {
    id: "pm-5-perfect-rounds",
    title: "5라운드 무결점",
    description: "5라운드를 실수 없이 연속 클리어하세요",
    icon: "🏅",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) =>
          s.level >= 5 &&
          (s.details.mistakes as number) === 0 &&
          (s.details.consecutivePerfect as number) >= 5,
      ),
    reward: "두뇌 점수 +25",
  },
  {
    id: "pm-color10",
    title: "컬러 기억의 마스터",
    description: "컬러 모드에서 라운드 10에 도달하세요",
    icon: "🎨",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => s.details.mode === "color" && s.level >= 10,
      ),
    reward: "두뇌 점수 +25",
  },
  {
    id: "pm-double5",
    title: "더블 모드 정복",
    description: "더블 모드에서 라운드 5에 도달하세요",
    icon: "👁️",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => s.details.mode === "double" && s.level >= 5,
      ),
    reward: "두뇌 점수 +30",
  },
  {
    id: "pm-10cells",
    title: "10셀 기억",
    description: "10개 이상의 셀 시퀀스를 기억하세요",
    icon: "🔟",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => (s.details.sequenceLength as number) >= 10,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "pm-total100",
    title: "100패턴 기억",
    description: "총 100개의 패턴을 기억하세요",
    icon: "📚",
    category: "pattern-memory",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "pattern-memory").reduce(
        (sum, s) => sum + s.level,
        0,
      );
      return total >= 100;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "pm-total500",
    title: "500패턴 기억",
    description: "총 500개의 패턴을 기억하세요",
    icon: "🗂️",
    category: "pattern-memory",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "pattern-memory").reduce(
        (sum, s) => sum + s.level,
        0,
      );
      return total >= 500;
    },
    reward: "두뇌 점수 +30",
  },
  {
    id: "pm-total1000",
    title: "1000패턴 기억",
    description: "총 1,000개의 패턴을 기억하세요",
    icon: "🏛️",
    category: "pattern-memory",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "pattern-memory").reduce(
        (sum, s) => sum + s.level,
        0,
      );
      return total >= 1000;
    },
    reward: "두뇌 점수 +50",
  },
  {
    id: "pm-fast-response",
    title: "번개 기억",
    description: "평균 반응 시간 1초 미만으로 라운드를 클리어하세요",
    icon: "⚡",
    category: "pattern-memory",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "pattern-memory").some(
        (s) => (s.details.avgResponseTime as number) < 1000 && s.level >= 5,
      ),
    reward: "두뇌 점수 +20",
  },

  // ===== Color Sequence (16) =====
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
  {
    id: "cs-30streak",
    title: "30 연속 정답",
    description: "컬러시퀀스에서 30문제 연속 정답을 기록하세요",
    icon: "🎯",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.maxCombo >= 30),
    reward: "두뇌 점수 +20",
  },
  {
    id: "cs-40streak",
    title: "40 연속 정답",
    description: "컬러시퀀스에서 40문제 연속 정답을 기록하세요",
    icon: "💫",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.maxCombo >= 40),
    reward: "두뇌 점수 +25",
  },
  {
    id: "cs-score200",
    title: "200점 돌파",
    description: "컬러시퀀스에서 200점 이상을 기록하세요",
    icon: "📈",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.score >= 200),
    reward: "두뇌 점수 +40",
  },
  {
    id: "cs-score500",
    title: "500점 경지",
    description: "컬러시퀀스에서 500점 이상을 기록하세요",
    icon: "🌟",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.score >= 500),
    reward: "두뇌 점수 +60",
  },
  {
    id: "cs-score1000",
    title: "천 점의 집중",
    description: "컬러시퀀스에서 1,000점 이상을 기록하세요",
    icon: "🏛️",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some((s) => s.score >= 1000),
    reward: "두뇌 점수 +100",
  },
  {
    id: "cs-total100",
    title: "100문제 달성",
    description: "컬러시퀀스에서 총 100문제를 맞추세요",
    icon: "📊",
    category: "color-sequence",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "color-sequence").reduce(
        (sum, s) => sum + s.score,
        0,
      );
      return total >= 100;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "cs-all-modes",
    title: "전 모드 도전",
    description: "컬러시퀀스의 모든 난이도를 플레이하세요",
    icon: "🎭",
    category: "color-sequence",
    condition: (_profile, sessions) => {
      const modes = new Set(
        sessionsOf(sessions, "color-sequence").map(
          (s) => s.details.mode as string,
        ),
      );
      return modes.size >= 3;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "cs-extreme50",
    title: "극한의 50점",
    description: "익스트림 모드에서 50점 이상을 기록하세요",
    icon: "🔮",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some(
        (s) => s.details.mode === "extreme" && s.score >= 50,
      ),
    reward: "두뇌 점수 +40",
  },
  {
    id: "cs-perfect-game",
    title: "퍼펙트 게임",
    description: "60초 동안 실수 없이 플레이하세요",
    icon: "💯",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some(
        (s) => s.accuracy === 100 && s.score >= 10,
      ),
    reward: "두뇌 점수 +25",
  },
  {
    id: "cs-fast10",
    title: "번개 10연속",
    description: "500ms 미만 반응 시간으로 10문제 연속 정답하세요",
    icon: "⚡",
    category: "color-sequence",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "color-sequence").some(
        (s) =>
          (s.details.fastConsecutive as number) >= 10 &&
          (s.details.avgResponseTime as number) < 500,
      ),
    reward: "두뇌 점수 +30",
  },

  // ===== Word Chain (16) =====
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
  {
    id: "wc-30words",
    title: "30단어 잇기",
    description: "한 게임에서 30개 이상의 단어를 이으세요",
    icon: "🔗",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 30),
    reward: "두뇌 점수 +20",
  },
  {
    id: "wc-50words",
    title: "50단어의 벽",
    description: "한 게임에서 50개 이상의 단어를 이으세요",
    icon: "🧱",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 50),
    reward: "두뇌 점수 +40",
  },
  {
    id: "wc-long-word",
    title: "긴 단어 달인",
    description: "7글자 이상의 단어를 사용하세요",
    icon: "📏",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some(
        (s) => (s.details.longestWord as number) >= 7,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "wc-10consonants",
    title: "다양한 시작",
    description: "한 게임에서 10가지 다른 시작 글자를 사용하세요",
    icon: "🔤",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some(
        (s) => (s.details.uniqueStartLetters as number) >= 10,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "wc-win3",
    title: "승리 3연속",
    description: "컴퓨터가 답하지 못해 승리를 3회 하세요",
    icon: "🏅",
    category: "word-chain",
    condition: (_profile, sessions) => {
      const wins = sessionsOf(sessions, "word-chain").filter(
        (s) => (s.details.computerFailed as boolean) === true,
      ).length;
      return wins >= 3;
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "wc-unique1000",
    title: "천 단어 달성",
    description: "워드체인에서 총 1,000개의 고유 단어를 사용하세요",
    icon: "📖",
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
      return allWords.size >= 1000;
    },
    reward: "두뇌 점수 +50",
  },
  {
    id: "wc-unique2000",
    title: "이천 단어 달성",
    description: "워드체인에서 총 2,000개의 고유 단어를 사용하세요",
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
      return allWords.size >= 2000;
    },
    reward: "두뇌 점수 +70",
  },
  {
    id: "wc-unique5000",
    title: "오천 단어의 경지",
    description: "워드체인에서 총 5,000개의 고유 단어를 사용하세요",
    icon: "🏛️",
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
      return allWords.size >= 5000;
    },
    reward: "두뇌 점수 +100",
  },
  {
    id: "wc-rare-consonants",
    title: "희귀 글자 도전",
    description:
      "한 게임에서 쌍자음/겹모음으로 시작하는 단어를 3개 이상 사용하세요",
    icon: "🎲",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some(
        (s) => (s.details.rareConsonantWords as number) >= 3,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "wc-score100",
    title: "워드체인 100점",
    description: "워드체인에서 100점 이상을 기록하세요",
    icon: "💯",
    category: "word-chain",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "word-chain").some((s) => s.score >= 100),
    reward: "두뇌 점수 +50",
  },

  // ===== Math Rush (17) =====
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
  {
    id: "mr-level10",
    title: "레벨 10 돌파",
    description: "매스러시에서 레벨 10에 도달하세요",
    icon: "🔟",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.level >= 10),
    reward: "두뇌 점수 +25",
  },
  {
    id: "mr-level15",
    title: "레벨 15 돌파",
    description: "매스러시에서 레벨 15에 도달하세요",
    icon: "🎯",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.level >= 15),
    reward: "두뇌 점수 +40",
  },
  {
    id: "mr-level20",
    title: "레벨 20 마스터",
    description: "매스러시에서 레벨 20에 도달하세요",
    icon: "👑",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.level >= 20),
    reward: "두뇌 점수 +60",
  },
  {
    id: "mr-combo30",
    title: "30 콤보",
    description: "매스러시에서 30 콤보를 달성하세요",
    icon: "🌪️",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.maxCombo >= 30),
    reward: "두뇌 점수 +30",
  },
  {
    id: "mr-combo50",
    title: "50 콤보",
    description: "매스러시에서 50 콤보를 달성하세요",
    icon: "🌟",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.maxCombo >= 50),
    reward: "두뇌 점수 +50",
  },
  {
    id: "mr-score100",
    title: "매스러시 100점",
    description: "매스러시에서 100점 이상을 기록하세요",
    icon: "💎",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 100),
    reward: "두뇌 점수 +40",
  },
  {
    id: "mr-score200",
    title: "매스러시 200점",
    description: "매스러시에서 200점 이상을 기록하세요",
    icon: "🏆",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 200),
    reward: "두뇌 점수 +60",
  },
  {
    id: "mr-score500",
    title: "매스러시 500점",
    description: "매스러시에서 500점 이상을 기록하세요",
    icon: "🌟",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some((s) => s.score >= 500),
    reward: "두뇌 점수 +100",
  },
  {
    id: "mr-total100",
    title: "100문제 해결",
    description: "매스러시에서 총 100문제를 맞추세요",
    icon: "📊",
    category: "math-rush",
    condition: (_profile, sessions) => {
      const total = sessionsOf(sessions, "math-rush").reduce(
        (sum, s) => sum + s.score,
        0,
      );
      return total >= 100;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "mr-perfect30",
    title: "30문제 완벽",
    description: "매스러시에서 30문제 이상 맞추고 정확도 100%를 기록하세요",
    icon: "✨",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some(
        (s) => s.score >= 30 && s.accuracy === 100,
      ),
    reward: "두뇌 점수 +35",
  },
  {
    id: "mr-fast-solve",
    title: "순간 계산",
    description: "레벨 8 이상 문제를 2초 이내에 풀세요",
    icon: "⚡",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some(
        (s) => s.level >= 8 && (s.details.fastestSolveTime as number) < 2,
      ),
    reward: "두뇌 점수 +25",
  },
  {
    id: "mr-no-skip",
    title: "스킵 없이",
    description: "매스러시에서 스킵 없이 30문제 이상 풀세요",
    icon: "🎗️",
    category: "math-rush",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "math-rush").some(
        (s) => s.score >= 30 && ((s.details.skips as number) || 0) === 0,
      ),
    reward: "두뇌 점수 +20",
  },

  // ===== Spatial Puzzle (17) =====
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
  {
    id: "sp-pixel15",
    title: "15x15 도전",
    description: "15x15 퍼즐을 완성하세요",
    icon: "🟥",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").some(
        (s) => (s.details.puzzleSize as number) === 15,
      ),
    reward: "두뇌 점수 +30",
  },
  {
    id: "sp-50total",
    title: "50퍼즐 완성",
    description: "퍼즐을 총 50개 완성하세요",
    icon: "🎮",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").length >= 50,
    reward: "두뇌 점수 +25",
  },
  {
    id: "sp-100total",
    title: "100퍼즐 완성",
    description: "퍼즐을 총 100개 완성하세요",
    icon: "🏅",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").length >= 100,
    reward: "두뇌 점수 +50",
  },
  {
    id: "sp-animals",
    title: "동물 카테고리 정복",
    description: "동물 카테고리의 모든 퍼즐을 완성하세요",
    icon: "🐾",
    category: "spatial-puzzle",
    condition: (_profile, sessions) => {
      const spSessions = sessionsOf(sessions, "spatial-puzzle");
      const animalPuzzles = spSessions.filter(
        (s) => (s.details.category as string) === "animals",
      );
      const totalAnimals =
        animalPuzzles.length > 0
          ? (animalPuzzles[0].details.categoryTotal as number) || 0
          : 0;
      if (totalAnimals === 0) return false;
      const completed = new Set(
        animalPuzzles.map((s) => s.details.puzzleId as string),
      ).size;
      return completed >= totalAnimals;
    },
    reward: "두뇌 점수 +30",
  },
  {
    id: "sp-all-sizes",
    title: "모든 크기 정복",
    description: "5x5, 7x7, 10x10, 15x15 퍼즐을 모두 완성하세요",
    icon: "📐",
    category: "spatial-puzzle",
    condition: (_profile, sessions) => {
      const sizes = new Set(
        sessionsOf(sessions, "spatial-puzzle").map(
          (s) => s.details.puzzleSize as number,
        ),
      );
      return [5, 7, 10, 15].every((sz) => sizes.has(sz));
    },
    reward: "두뇌 점수 +35",
  },
  {
    id: "sp-speed7x7",
    title: "7x7 스피드런",
    description: "7x7 퍼즐을 90초 안에 완성하세요",
    icon: "💨",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").some(
        (s) => (s.details.puzzleSize as number) === 7 && s.duration < 90,
      ),
    reward: "두뇌 점수 +20",
  },
  {
    id: "sp-no-errors",
    title: "무결점 퍼즐",
    description: "에러 없이 퍼즐을 완성하세요",
    icon: "✨",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").some(
        (s) => ((s.details.errors as number) || 0) === 0,
      ),
    reward: "두뇌 점수 +15",
  },
  {
    id: "sp-5-session",
    title: "퍼즐 마라톤",
    description: "한 세션에서 퍼즐 5개를 완성하세요",
    icon: "🏃",
    category: "spatial-puzzle",
    condition: (_profile, sessions) => {
      const spSessions = sessionsOf(sessions, "spatial-puzzle");
      if (spSessions.length < 5) return false;
      // Check if 5 puzzles completed within 1 hour
      for (let i = 0; i <= spSessions.length - 5; i++) {
        const first = new Date(spSessions[i].completedAt).getTime();
        const fifth = new Date(spSessions[i + 4].completedAt).getTime();
        if (fifth - first < 3600000) return true;
      }
      return false;
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "sp-10total",
    title: "10퍼즐 달성",
    description: "퍼즐을 총 10개 완성하세요",
    icon: "🔟",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").length >= 10,
    reward: "두뇌 점수 +10",
  },
  {
    id: "sp-25total",
    title: "25퍼즐 달성",
    description: "퍼즐을 총 25개 완성하세요",
    icon: "🎖️",
    category: "spatial-puzzle",
    condition: (_profile, sessions) =>
      sessionsOf(sessions, "spatial-puzzle").length >= 25,
    reward: "두뇌 점수 +15",
  },

  // ===== Hidden / Secret Achievements (12) =====
  {
    id: "hidden-newyear",
    title: "새해 두뇌",
    description: "???",
    icon: "🎆",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const d = new Date(s.completedAt);
        return d.getMonth() === 0 && d.getDate() === 1 && d.getHours() === 0;
      }),
    reward: "두뇌 점수 +30",
  },
  {
    id: "hidden-lucky777",
    title: "럭키 세븐",
    description: "???",
    icon: "🎰",
    category: "general",
    condition: (_profile, sessions) => sessions.some((s) => s.score === 777),
    reward: "두뇌 점수 +30",
  },
  {
    id: "hidden-routine",
    title: "루틴의 힘",
    description: "???",
    icon: "🕐",
    category: "general",
    condition: (_profile, sessions) => {
      // Play at the same hour for 7 different days
      if (sessions.length < 7) return false;
      const hourDays = new Map<number, Set<string>>();
      for (const s of sessions) {
        const d = new Date(s.completedAt);
        const hour = d.getHours();
        const day = s.completedAt.slice(0, 10);
        if (!hourDays.has(hour)) hourDays.set(hour, new Set());
        hourDays.get(hour)!.add(day);
      }
      return [...hourDays.values()].some((days) => days.size >= 7);
    },
    reward: "두뇌 점수 +25",
  },
  {
    id: "hidden-explorer",
    title: "탐험 정신",
    description: "???",
    icon: "🔍",
    category: "general",
    condition: (_profile, sessions) => sessions.some((s) => s.hintsUsed >= 10),
    reward: "두뇌 점수 +10",
  },
  {
    id: "hidden-persistence",
    title: "불굴의 의지",
    description: "???",
    icon: "🦾",
    category: "general",
    condition: (_profile, sessions) => {
      // Lose 10 times then win
      let losses = 0;
      for (const s of sessions) {
        if (s.accuracy === 0 || s.score === 0) {
          losses++;
        } else if (losses >= 10) {
          return true;
        }
      }
      return false;
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "hidden-marathon-gamer",
    title: "마라톤 게이머",
    description: "???",
    icon: "🏃‍♂️",
    category: "general",
    condition: (_profile, sessions) => {
      const byDay = new Map<string, number>();
      for (const s of sessions) {
        const day = s.completedAt.slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);
      }
      return [...byDay.values()].some((count) => count >= 100);
    },
    reward: "두뇌 점수 +50",
  },
  {
    id: "hidden-beginners-luck",
    title: "비기너의 행운",
    description: "???",
    icon: "🍀",
    category: "general",
    condition: (_profile, sessions) => {
      if (sessions.length === 0) return false;
      // Sort by completedAt to find the very first session
      const sorted = [...sessions].sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
      );
      return sorted[0].accuracy === 100;
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "hidden-500-games",
    title: "500게임 달성",
    description: "???",
    icon: "🎊",
    category: "general",
    condition: (profile) => profile.totalGames >= 500,
    reward: "두뇌 점수 +50",
  },
  {
    id: "hidden-christmas",
    title: "크리스마스 두뇌",
    description: "???",
    icon: "🎄",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const d = new Date(s.completedAt);
        return d.getMonth() === 11 && d.getDate() === 25;
      }),
    reward: "두뇌 점수 +20",
  },
  {
    id: "hidden-palindrome",
    title: "회문 점수",
    description: "???",
    icon: "🪞",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const str = String(s.score);
        return str.length >= 3 && str === str.split("").reverse().join("");
      }),
    reward: "두뇌 점수 +15",
  },
  {
    id: "hidden-midnight-owl",
    title: "자정의 올빼미",
    description: "???",
    icon: "🌙",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.some((s) => {
        const d = new Date(s.completedAt);
        return d.getHours() === 0 && d.getMinutes() === 0;
      }),
    reward: "두뇌 점수 +20",
  },
  {
    id: "hidden-triple-perfect",
    title: "트리플 퍼펙트",
    description: "???",
    icon: "🌈",
    category: "general",
    condition: (_profile, sessions) => {
      // 3 different game types with 100% accuracy
      const perfectTypes = new Set(
        sessions.filter((s) => s.accuracy === 100).map((s) => s.gameType),
      );
      return perfectTypes.size >= 3;
    },
    reward: "두뇌 점수 +30",
  },

  // --- Additional general achievements to reach 150+ ---
  {
    id: "games-200",
    title: "200게임 돌파",
    description: "게임을 200회 완료하세요",
    icon: "🎮",
    category: "general",
    condition: (profile) => profile.totalGames >= 200,
    reward: "두뇌 점수 +40",
  },
  {
    id: "games-500",
    title: "500게임 돌파",
    description: "게임을 500회 완료하세요",
    icon: "🎯",
    category: "general",
    condition: (profile) => profile.totalGames >= 500,
    reward: "두뇌 점수 +60",
  },
  {
    id: "daily-5",
    title: "데일리 5회",
    description: "데일리 챌린지를 5회 완료하세요",
    icon: "📋",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.filter((s) => s.details.daily === true).length >= 5,
    reward: "두뇌 점수 +15",
  },
  {
    id: "daily-30",
    title: "데일리 30회",
    description: "데일리 챌린지를 30회 완료하세요",
    icon: "🗓️",
    category: "general",
    condition: (_profile, sessions) =>
      sessions.filter((s) => s.details.daily === true).length >= 30,
    reward: "두뇌 점수 +30",
  },
  {
    id: "multi-perfect-day",
    title: "퍼펙트 데이",
    description: "하루에 3게임 이상 정확도 100%로 클리어하세요",
    icon: "💫",
    category: "general",
    condition: (_profile, sessions) => {
      const byDay = new Map<string, number>();
      for (const s of sessions) {
        if (s.accuracy === 100) {
          const day = s.completedAt.slice(0, 10);
          byDay.set(day, (byDay.get(day) || 0) + 1);
        }
      }
      return [...byDay.values()].some((count) => count >= 3);
    },
    reward: "두뇌 점수 +20",
  },
  {
    id: "ten-days-played",
    title: "10일 플레이",
    description: "총 10일 동안 플레이하세요",
    icon: "📅",
    category: "general",
    condition: (_profile, sessions) => {
      const days = new Set(sessions.map((s) => s.completedAt.slice(0, 10)));
      return days.size >= 10;
    },
    reward: "두뇌 점수 +15",
  },
  {
    id: "fifty-days-played",
    title: "50일 플레이",
    description: "총 50일 동안 플레이하세요",
    icon: "🏆",
    category: "general",
    condition: (_profile, sessions) => {
      const days = new Set(sessions.map((s) => s.completedAt.slice(0, 10)));
      return days.size >= 50;
    },
    reward: "두뇌 점수 +30",
  },
  {
    id: "hundred-days-played",
    title: "100일 플레이",
    description: "총 100일 동안 플레이하세요",
    icon: "🏛️",
    category: "general",
    condition: (_profile, sessions) => {
      const days = new Set(sessions.map((s) => s.completedAt.slice(0, 10)));
      return days.size >= 100;
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
