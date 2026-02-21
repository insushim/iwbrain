"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { GAME_CONFIGS, type GameType } from "@/types";

interface Mission {
  gameType: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

interface DailyChallengeProps {
  missions: Mission[];
  date: string;
  allComplete: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function DailyChallenge({
  missions,
  date,
  allComplete,
}: DailyChallengeProps) {
  const router = useRouter();

  useEffect(() => {
    if (allComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [allComplete]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">오늘의 도전</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {formatDate(date)}
        </h2>
      </div>

      {/* Mission Cards */}
      <div className="space-y-3">
        {missions.map((mission, index) => {
          const config = GAME_CONFIGS[mission.gameType as GameType];
          const progress =
            mission.target > 0
              ? Math.min((mission.current / mission.target) * 100, 100)
              : 0;

          return (
            <motion.div
              key={mission.gameType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              onClick={() => router.push(`/play/${mission.gameType}`)}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-shadow hover:shadow-md
                ${
                  mission.completed
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Game Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    backgroundColor: config ? `${config.color}20` : "#f3f4f6",
                  }}
                >
                  {config?.icon ?? "🎮"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {mission.description}
                    </span>
                    {mission.completed && (
                      <span className="text-green-500 text-lg flex-shrink-0 ml-2">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: mission.completed
                            ? "#22c55e"
                            : (config?.color ?? "#6366f1"),
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {mission.current}/{mission.target}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* All Complete Celebration */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            완벽한 하루!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            오늘의 모든 미션을 완료했습니다
          </p>
        </motion.div>
      )}
    </div>
  );
}
