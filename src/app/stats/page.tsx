"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import BrainRadarChart from "@/components/stats/BrainRadarChart";
import CognitiveProfile from "@/components/stats/CognitiveProfile";
import AchievementList from "@/components/stats/AchievementList";
import { useUserStore } from "@/stores/userStore";
import { calculateCognitiveScores } from "@/lib/analytics";
import { getSessions } from "@/lib/storage";
import { ACHIEVEMENTS } from "@/data/achievements";
import type { GameSession, CognitiveScores } from "@/types";

export default function StatsPage() {
  const { profile, init } = useUserStore();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [scores, setScores] = useState<CognitiveScores>({
    logic: 0,
    memory: 0,
    attention: 0,
    language: 0,
    math: 0,
    spatial: 0,
  });
  const [tab, setTab] = useState<"overview" | "achievements">("overview");

  useEffect(() => {
    init();
    getSessions().then((s) => {
      setSessions(s);
      setScores(calculateCognitiveScores(s));
    });
  }, [init]);

  return (
    <div>
      <Header title="통계" />
      <main className="px-4 py-4 space-y-5">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setTab("overview")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "overview"
                ? "bg-[#6C5CE7] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border)]"
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setTab("achievements")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "achievements"
                ? "bg-[#6C5CE7] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border)]"
            }`}
          >
            업적 ({profile.achievements.length}/{ACHIEVEMENTS.length})
          </button>
        </div>

        {tab === "overview" ? (
          <>
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <h3 className="font-bold mb-3 text-center">인지 능력 차트</h3>
              <div className="flex justify-center">
                <BrainRadarChart scores={scores} />
              </div>
            </div>

            <CognitiveProfile scores={scores} />

            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <h3 className="font-bold mb-3">플레이 통계</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">총 게임</p>
                  <p className="text-xl font-bold font-tabular">
                    {profile.totalGames}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    총 플레이 시간
                  </p>
                  <p className="text-xl font-bold font-tabular">
                    {Math.round(profile.totalPlayTime / 60)}분
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    최근 세션 수
                  </p>
                  <p className="text-xl font-bold font-tabular">
                    {sessions.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">연속 접속</p>
                  <p className="text-xl font-bold font-tabular">
                    {profile.streakDays}일
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <AchievementList
            achievements={ACHIEVEMENTS.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              icon: a.icon,
              category: a.category,
              reward: a.reward,
            }))}
            unlockedIds={profile.achievements}
          />
        )}
      </main>
    </div>
  );
}
