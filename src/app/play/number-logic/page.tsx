"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import { useGameSession } from "@/hooks/useGameSession";
import { useSound } from "@/hooks/useSound";

type Diff = "easy" | "medium" | "hard";

const NumberLogicGame = dynamic(
  () => import("@/components/games/NumberLogicGame"),
  { ssr: false },
);

export default function NumberLogicPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Diff | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const { endSession } = useGameSession("number-logic");
  const { gameStart } = useSound();

  const handleStart = (d: Diff) => {
    setDifficulty(d);
    setGameKey((k) => k + 1);
    gameStart();
  };

  const handleComplete = async (
    score: number,
    details: Record<string, unknown>,
  ) => {
    await endSession(
      score,
      (details.accuracy as number) || 1,
      0,
      (details.hintsUsed as number) || 0,
      details,
    );
  };

  if (!difficulty) {
    return (
      <div>
        <Header title="넘버로직" showBack onBack={() => router.push("/play")} />
        <main className="px-4 py-8 space-y-4">
          <p className="text-center text-[var(--text-secondary)] mb-6">
            난이도를 선택하세요
          </p>
          {[
            {
              d: "easy" as Diff,
              label: "쉬움",
              desc: "4x4 그리드",
              color: "#00B894",
            },
            {
              d: "medium" as Diff,
              label: "보통",
              desc: "5x5 그리드",
              color: "#FDCB6E",
            },
            {
              d: "hard" as Diff,
              label: "어려움",
              desc: "6x6 그리드",
              color: "#E17055",
            },
          ].map(({ d, label, desc, color }) => (
            <button
              key={d}
              onClick={() => handleStart(d)}
              className="w-full p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-left flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div>
                <p className="font-bold">{label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
              </div>
            </button>
          ))}
        </main>
      </div>
    );
  }

  return (
    <NumberLogicGame
      key={gameKey}
      difficulty={difficulty}
      onComplete={handleComplete}
      onBack={() => setDifficulty(null)}
    />
  );
}
