"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import { useGameSession } from "@/hooks/useGameSession";
import { useSound } from "@/hooks/useSound";

const SpatialPuzzleGame = dynamic(
  () => import("@/components/games/SpatialPuzzleGame"),
  { ssr: false },
);

export default function SpatialPuzzlePage() {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const { endSession } = useGameSession("spatial-puzzle");
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
    await endSession(score, (details.accuracy as number) || 1, 0, 0, details);
    setPlaying(false);
  };

  if (!playing) {
    return (
      <div>
        <Header title="공간퍼즐" showBack onBack={() => router.push("/play")} />
        <main className="px-4 py-8 flex flex-col items-center">
          <span className="text-6xl mb-4">&#127959;</span>
          <h2 className="text-xl font-bold mb-2">논그램 퍼즐</h2>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
            힌트를 보고 셀을 칠해서
            <br />
            숨겨진 그림을 완성하세요!
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: "#00B894" }}
          >
            시작하기
          </button>
        </main>
      </div>
    );
  }

  return (
    <SpatialPuzzleGame
      key={gameKey}
      onComplete={handleComplete}
      onBack={() => setPlaying(false)}
    />
  );
}
