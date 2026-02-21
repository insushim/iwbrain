"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { DailyChallengeMission } from "@/types";
import { GAME_CONFIGS } from "@/types";

interface DailyMissionProps {
  missions: DailyChallengeMission[];
  allComplete: boolean;
}

export default function DailyMission({
  missions,
  allComplete,
}: DailyMissionProps) {
  const router = useRouter();

  if (missions.length === 0) {
    return (
      <div className="rounded-2xl p-4 bg-[var(--bg-card)] border border-[var(--border)]">
        <p className="text-center text-[var(--text-secondary)] text-sm">
          오늘의 챌린지를 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">오늘의 미션</h2>
        {allComplete && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00B894] text-white">
            완료!
          </span>
        )}
      </div>
      <div className="space-y-2">
        {missions.map((mission, i) => {
          const config = GAME_CONFIGS[mission.gameType];
          const progress = Math.min(
            100,
            (mission.current / mission.target) * 100,
          );
          return (
            <button
              key={i}
              onClick={() => router.push("/daily")}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-left transition-all hover:shadow-md"
            >
              <span
                className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: config.color + "20" }}
              >
                {config.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {mission.description}
                </p>
                <div className="mt-1 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: mission.completed
                        ? "#00B894"
                        : config.color,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  />
                </div>
              </div>
              {mission.completed ? (
                <span className="text-lg">&#10003;</span>
              ) : (
                <span className="text-xs text-[var(--text-muted)] font-tabular">
                  {mission.current}/{mission.target}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
