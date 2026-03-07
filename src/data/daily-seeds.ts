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
      // Original 4
      "넘버로직 4x4를 3분 안에 클리어",
      "넘버로직을 힌트 없이 클리어",
      "넘버로직 2회 클리어",
      "넘버로직 5x5를 클리어",
      // Score-based
      "넘버로직에서 에러 0으로 클리어",
      "넘버로직 3회 클리어",
      // Speed-based
      "넘버로직 4x4를 45초 안에 클리어",
      "넘버로직 4x4를 90초 안에 클리어",
      "넘버로직 5x5를 3분 안에 클리어",
      "넘버로직 5x5를 150초 안에 클리어",
      // Challenge
      "넘버로직 6x6를 클리어",
      "넘버로직 6x6를 힌트 1개 이하로 클리어",
      "넘버로직을 힌트 2개 이하로 클리어",
      "넘버로직을 되돌리기 5회 미만으로 클리어",
      // Count-based
      "넘버로직 1회 클리어",
      "넘버로직을 연속 2회 에러 없이 클리어",
      // Variety
      "넘버로직에서 다른 크기 2종류 클리어",
      "넘버로직 4x4 2회 클리어",
      "넘버로직 5x5 2회 클리어",
      "넘버로직에서 메모 모드 사용하여 클리어",
    ],
    targets: [1, 1, 2, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1],
  },
  {
    gameType: "pattern-memory",
    descriptions: [
      // Original 4
      "패턴메모리에서 라운드 7 도달",
      "패턴메모리에서 실수 없이 라운드 5 도달",
      "패턴메모리 2회 플레이",
      "패턴메모리에서 라운드 10 도달",
      // Level-based
      "패턴메모리에서 라운드 3 도달",
      "패턴메모리에서 라운드 5 도달",
      "패턴메모리에서 라운드 8 도달",
      "패턴메모리에서 라운드 12 도달",
      "패턴메모리에서 라운드 15 도달",
      // Mode challenges
      "리버스 모드에서 라운드 3 도달",
      "리버스 모드에서 라운드 5 도달",
      "컬러 모드에서 라운드 3 도달",
      "컬러 모드에서 라운드 5 도달",
      "더블 모드에서 라운드 2 도달",
      // Accuracy
      "패턴메모리에서 실수 없이 라운드 3 도달",
      "패턴메모리에서 실수 없이 라운드 7 도달",
      // Count
      "패턴메모리 1회 플레이",
      "패턴메모리 3회 플레이",
      // Endurance
      "패턴메모리에서 총 20라운드 이상 플레이",
      "패턴메모리에서 총 30라운드 이상 플레이",
    ],
    targets: [7, 5, 2, 10, 3, 5, 8, 12, 15, 3, 5, 3, 5, 2, 3, 7, 1, 3, 20, 30],
  },
  {
    gameType: "color-sequence",
    descriptions: [
      // Original 4
      "컬러시퀀스에서 15문제 맞추기",
      "컬러시퀀스에서 10연속 정답 달성",
      "컬러시퀀스 2회 플레이",
      "컬러시퀀스에서 30점 달성",
      // Score-based
      "컬러시퀀스에서 10점 달성",
      "컬러시퀀스에서 20점 달성",
      "컬러시퀀스에서 50점 달성",
      "컬러시퀀스에서 100점 달성",
      "컬러시퀀스에서 40점 달성",
      // Combo-based
      "컬러시퀀스에서 5연속 정답 달성",
      "컬러시퀀스에서 15연속 정답 달성",
      "컬러시퀀스에서 20연속 정답 달성",
      "컬러시퀀스에서 25연속 정답 달성",
      // Accuracy
      "컬러시퀀스에서 정확도 90% 이상 달성",
      "컬러시퀀스에서 정확도 95% 이상 달성",
      "컬러시퀀스에서 실수 없이 10문제 맞추기",
      // Speed
      "컬러시퀀스에서 평균 반응속도 1초 이하 달성",
      "컬러시퀀스에서 평균 반응속도 800ms 이하 달성",
      // Count
      "컬러시퀀스 1회 플레이",
      "컬러시퀀스 3회 플레이",
    ],
    targets: [
      15, 10, 2, 30, 10, 20, 50, 100, 40, 5, 15, 20, 25, 90, 95, 10, 1, 1, 1, 3,
    ],
  },
  {
    gameType: "word-chain",
    descriptions: [
      // Original 4
      "워드체인에서 단어 15개 잇기",
      "워드체인에서 4글자 이상 단어 5개 사용",
      "워드체인 2회 플레이",
      "워드체인에서 20점 달성",
      // Score/count
      "워드체인에서 단어 10개 잇기",
      "워드체인에서 단어 25개 잇기",
      "워드체인에서 단어 30개 잇기",
      "워드체인에서 30점 달성",
      "워드체인에서 40점 달성",
      "워드체인에서 50점 달성",
      // Long words
      "워드체인에서 5글자 이상 단어 3개 사용",
      "워드체인에서 5글자 이상 단어 7개 사용",
      "워드체인에서 6글자 이상 단어 사용",
      "워드체인에서 7글자 이상 단어 사용",
      // Speed
      "워드체인에서 단어당 평균 4초 이하 달성",
      "워드체인에서 단어당 평균 3초 이하 달성",
      // Count
      "워드체인 1회 플레이",
      "워드체인 3회 플레이",
      // Variety
      "워드체인에서 다른 시작 글자 7개 이상 사용",
      "워드체인에서 다른 시작 글자 10개 이상 사용",
    ],
    targets: [
      15, 5, 2, 20, 10, 25, 30, 30, 40, 50, 3, 7, 1, 1, 1, 1, 1, 3, 7, 10,
    ],
  },
  {
    gameType: "math-rush",
    descriptions: [
      // Original 4
      "매스러시에서 15문제 맞추기",
      "매스러시에서 5콤보 달성",
      "매스러시 2회 플레이",
      "매스러시에서 레벨 5 도달",
      // Score-based
      "매스러시에서 10문제 맞추기",
      "매스러시에서 20문제 맞추기",
      "매스러시에서 30문제 맞추기",
      "매스러시에서 50점 달성",
      "매스러시에서 100점 달성",
      // Combo-based
      "매스러시에서 8콤보 달성",
      "매스러시에서 10콤보 달성",
      "매스러시에서 15콤보 달성",
      "매스러시에서 20콤보 달성",
      // Level-based
      "매스러시에서 레벨 3 도달",
      "매스러시에서 레벨 7 도달",
      "매스러시에서 레벨 10 도달",
      // Accuracy
      "매스러시에서 정확도 90% 이상으로 15문제 풀기",
      "매스러시에서 정확도 100%로 10문제 풀기",
      // Count
      "매스러시 1회 플레이",
      "매스러시 3회 플레이",
    ],
    targets: [
      15, 5, 2, 5, 10, 20, 30, 50, 100, 8, 10, 15, 20, 3, 7, 10, 15, 10, 1, 3,
    ],
  },
  {
    gameType: "spatial-puzzle",
    descriptions: [
      // Original 4
      "공간퍼즐 1개 완성",
      "공간퍼즐 5x5를 2분 안에 완성",
      "공간퍼즐 2개 완성",
      "공간퍼즐을 힌트 없이 완성",
      // Count
      "공간퍼즐 3개 완성",
      "공간퍼즐 1개 완성하기",
      // Size-specific
      "공간퍼즐 5x5 1개 완성",
      "공간퍼즐 5x5 2개 완성",
      "공간퍼즐 7x7 1개 완성",
      "공간퍼즐 7x7 2개 완성",
      "공간퍼즐 10x10 1개 완성",
      // Speed
      "공간퍼즐 5x5를 90초 안에 완성",
      "공간퍼즐 5x5를 60초 안에 완성",
      "공간퍼즐 7x7를 3분 안에 완성",
      "공간퍼즐 7x7를 90초 안에 완성",
      // Accuracy
      "공간퍼즐을 에러 없이 완성",
      "공간퍼즐을 에러 2개 이하로 완성",
      // Challenge
      "공간퍼즐을 힌트 1개 이하로 완성",
      "공간퍼즐에서 다른 크기 2종류 완성",
      "공간퍼즐에서 다른 카테고리 2종류 완성",
    ],
    targets: [1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
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
