"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import { useGameSession } from "@/hooks/useGameSession";
import { useSound } from "@/hooks/useSound";

const MathRushGame = dynamic(() => import("@/components/games/MathRushGame"), {
  ssr: false,
});

export default function MathRushPage() {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const { endSession } = useGameSession("math-rush");
  const { gameStart } = useSound();

  const handleStart = () => {
    setPlaying(true);
    setGameKey((k) => k + 1);
    gameStart();
  };

  const handleComplete = async (
    score: number,
    details: Record<string, unknown>,
  ) => {
    await endSession(
      score,
      (details.accuracy as number) || 0,
      (details.maxCombo as number) || 0,
      0,
      details,
    );
    setPlaying(false);
  };

  if (!playing) {
    return (
      <div>
        <Header title="매스러시" showBack onBack={() => router.push("/play")} />
        <main className="px-4 py-8 flex flex-col items-center">
          <span className="text-6xl mb-4">&#9889;</span>
          <h2 className="text-xl font-bold mb-2">빠른 암산</h2>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
            60초 동안 최대한 많은 문제를 풀어보세요!
            <br />
            연속 정답으로 콤보 보너스를 받으세요
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: "#FDCB6E", color: "#2D3436" }}
          >
            시작하기
          </button>
        </main>
      </div>
    );
  }

  return (
    <MathRushGame
      key={gameKey}
      onComplete={handleComplete}
      onBack={() => setPlaying(false)}
    />
  );
}
