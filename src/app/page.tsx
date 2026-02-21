"use client";

import { useEffect } from "react";
import BrainScoreCard from "@/components/home/BrainScoreCard";
import DailyMission from "@/components/home/DailyMission";
import QuickPlay from "@/components/home/QuickPlay";
import StreakCounter from "@/components/home/StreakCounter";
import { useUserStore } from "@/stores/userStore";
import { useDailyStore } from "@/stores/dailyStore";
import { syncToCloud } from "@/lib/sync";

export default function HomePage() {
  const { profile, sessions, init: initUser } = useUserStore();
  const { todayChallenge, init: initDaily } = useDailyStore();

  useEffect(() => {
    initUser();
    initDaily();
  }, [initUser, initDaily]);

  // Sync on page load (fire-and-forget)
  useEffect(() => {
    if (profile.totalGames > 0) {
      syncToCloud(profile, sessions);
    }
  }, [profile, sessions]);

  return (
    <main className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">NeuroFlex</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            두뇌를 깨울 시간이에요
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#a855f7] flex items-center justify-center text-white text-lg">
          &#129504;
        </div>
      </div>

      <BrainScoreCard score={profile.brainScore} />
      <StreakCounter days={profile.streakDays} />
      <DailyMission
        missions={todayChallenge?.missions || []}
        allComplete={todayChallenge?.completed || false}
      />
      <QuickPlay />
    </main>
  );
}
