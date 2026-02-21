"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_CONFIGS, type GameType } from "@/types";
import Header from "@/components/layout/Header";

const gameList: GameType[] = [
  "number-logic",
  "pattern-memory",
  "color-sequence",
  "word-chain",
  "math-rush",
  "spatial-puzzle",
];

export default function PlayPage() {
  const router = useRouter();

  return (
    <div>
      <Header title="게임 선택" />
      <main className="px-4 py-4 space-y-3">
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          6가지 게임으로 다양한 두뇌 영역을 훈련하세요
        </p>
        {gameList.map((gameType, i) => {
          const config = GAME_CONFIGS[gameType];
          return (
            <motion.button
              key={gameType}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/play/${gameType}`)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-left transition-shadow hover:shadow-lg"
            >
              <span
                className="text-3xl w-14 h-14 flex items-center justify-center rounded-xl shrink-0"
                style={{ backgroundColor: config.color + "15" }}
              >
                {config.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{config.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {config.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.cognitiveArea === "logic" && "논리력"}
                    {config.cognitiveArea === "memory" && "기억력"}
                    {config.cognitiveArea === "attention" && "주의력"}
                    {config.cognitiveArea === "language" && "언어력"}
                    {config.cognitiveArea === "math" && "연산력"}
                    {config.cognitiveArea === "spatial" && "공간력"}
                  </span>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-[var(--text-muted)] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          );
        })}
      </main>
    </div>
  );
}
