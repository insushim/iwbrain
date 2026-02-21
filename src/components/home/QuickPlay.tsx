"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GAME_CONFIGS, type GameType } from "@/types";

const gameList: GameType[] = [
  "number-logic",
  "pattern-memory",
  "color-sequence",
  "word-chain",
  "math-rush",
  "spatial-puzzle",
];

export default function QuickPlay() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-lg font-bold mb-3">빠른 시작</h2>
      <div className="grid grid-cols-3 gap-2">
        {gameList.map((gameType, i) => {
          const config = GAME_CONFIGS[gameType];
          return (
            <motion.button
              key={gameType}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => router.push(`/play/${gameType}`)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] transition-shadow hover:shadow-md"
            >
              <span
                className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl"
                style={{ backgroundColor: config.color + "15" }}
              >
                {config.icon}
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)] truncate w-full text-center">
                {config.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
