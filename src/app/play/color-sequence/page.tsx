"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import { useGameSession } from "@/hooks/useGameSession";
import { useSound } from "@/hooks/useSound";

type ColorDifficulty = "easy" | "medium" | "hard";

const ColorSequenceGame = dynamic(
  () => import("@/components/games/ColorSequenceGame"),
  { ssr: false },
);

export default function ColorSequencePage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<ColorDifficulty | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const { endSession } = useGameSession("color-sequence");
  const { gameStart } = useSound();

  const handleStart = (d: ColorDifficulty) => {
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
      (details.accuracy as number) || 0,
      (details.maxCombo as number) || 0,
      0,
      details,
    );
  };

  if (!difficulty) {
    return (
      <div>
        <Header
          title="컬러시퀀스"
          showBack
          onBack={() => router.push("/play")}
        />
        <main className="px-4 py-8 space-y-4">
          <p className="text-center text-[var(--text-secondary)] mb-6">
            난이도를 선택하세요
          </p>
          {[
            {
              d: "easy" as ColorDifficulty,
              label: "쉬움",
              desc: "4색, 3초",
              color: "#00B894",
            },
            {
              d: "medium" as ColorDifficulty,
              label: "보통",
              desc: "5색, 2초",
              color: "#FDCB6E",
            },
            {
              d: "hard" as ColorDifficulty,
              label: "어려움",
              desc: "6색, 1.5초",
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
    <ColorSequenceGame
      key={gameKey}
      difficulty={difficulty}
      onComplete={handleComplete}
      onBack={() => setDifficulty(null)}
    />
  );
}
