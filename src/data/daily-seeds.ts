import { format } from "date-fns";
import type { GameType, DailyChallengeMission } from "@/types";
import { seededRandom, randomPick } from "@/utils/random";
import { dateSeed } from "@/utils/random";

const ALL_GAME_TYPES: GameType[] = [
  "number-logic",
  "pattern-memory",
  "color-sequence",
  "word-chain",
  "math-rush",
  "spatial-puzzle",
];

interface MissionTemplate {
  gameType: GameType;
  descriptions: string[];
  targets: number[];
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    gameType: "number-logic",
    descriptions: [
      "넘버로직 4x4를 3분 안에 클리어",
      "넘버로직을 힌트 없이 클리어",
      "넘버로직 2회 클리어",
      "넘버로직 5x5를 클리어",
    ],
    targets: [1, 1, 2, 1],
  },
  {
    gameType: "pattern-memory",
    descriptions: [
      "패턴메모리에서 라운드 7 도달",
      "패턴메모리에서 실수 없이 라운드 5 도달",
      "패턴메모리 2회 플레이",
      "패턴메모리에서 라운드 10 도달",
    ],
    targets: [7, 5, 2, 10],
  },
  {
    gameType: "color-sequence",
    descriptions: [
      "컬러시퀀스에서 15문제 맞추기",
      "컬러시퀀스에서 10연속 정답 달성",
      "컬러시퀀스 2회 플레이",
      "컬러시퀀스에서 30점 달성",
    ],
    targets: [15, 10, 2, 30],
  },
  {
    gameType: "word-chain",
    descriptions: [
      "워드체인에서 단어 15개 잇기",
      "워드체인에서 4글자 이상 단어 5개 사용",
      "워드체인 2회 플레이",
      "워드체인에서 20점 달성",
    ],
    targets: [15, 5, 2, 20],
  },
  {
    gameType: "math-rush",
    descriptions: [
      "매스러시에서 15문제 맞추기",
      "매스러시에서 5콤보 달성",
      "매스러시 2회 플레이",
      "매스러시에서 레벨 5 도달",
    ],
    targets: [15, 5, 2, 5],
  },
  {
    gameType: "spatial-puzzle",
    descriptions: [
      "공간퍼즐 1개 완성",
      "공간퍼즐 5x5를 2분 안에 완성",
      "공간퍼즐 2개 완성",
      "공간퍼즐을 힌트 없이 완성",
    ],
    targets: [1, 1, 2, 1],
  },
];

export function generateDailyChallenge(date: Date): {
  date: string;
  missions: DailyChallengeMission[];
} {
  const dateStr = format(date, "yyyy-MM-dd");
  const seed = dateSeed(dateStr);
  const rng = seededRandom(seed);

  // Pick 3 distinct game types
  const available = [...ALL_GAME_TYPES];
  const picked: GameType[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * available.length);
    picked.push(available[idx]);
    available.splice(idx, 1);
  }

  const missions: DailyChallengeMission[] = picked.map((gameType) => {
    const template = MISSION_TEMPLATES.find((t) => t.gameType === gameType)!;
    const missionIdx = Math.floor(rng() * template.descriptions.length);
    return {
      gameType,
      description: template.descriptions[missionIdx],
      target: template.targets[missionIdx],
      current: 0,
      completed: false,
    };
  });

  return { date: dateStr, missions };
}
