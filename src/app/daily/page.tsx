"use client";

import { useEffect } from "react";
import Header from "@/components/layout/Header";
import DailyChallenge from "@/components/daily/DailyChallenge";
import CalendarStreak from "@/components/daily/CalendarStreak";
import { useDailyStore } from "@/stores/dailyStore";
import { useUserStore } from "@/stores/userStore";

export default function DailyPage() {
  const { todayChallenge, history, init } = useDailyStore();
  const { profile, init: initUser } = useUserStore();

  useEffect(() => {
    init();
    initUser();
  }, [init, initUser]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <Header title="일일 챌린지" />
      <main className="px-4 py-4 space-y-5">
        <DailyChallenge
          missions={todayChallenge?.missions || []}
          date={today}
          allComplete={todayChallenge?.completed || false}
        />
        <CalendarStreak history={history} streakDays={profile.streakDays} />
      </main>
    </div>
  );
}
