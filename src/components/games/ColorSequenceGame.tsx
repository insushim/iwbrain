"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STROOP_COLORS } from "@/utils/color";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface ColorSequenceGameProps {
  difficulty: "easy" | "medium" | "hard" | "extreme";
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

type InstructionMode = "meaning" | "color";

interface Question {
  text: string;
  textColor: string;
  correctAnswer: string;
}

const DIFFICULTY_CONFIG = {
  easy: { colorCount: 4, instructionChangeEvery: Infinity, perQuestionTime: 3 },
  medium: { colorCount: 5, instructionChangeEvery: 5, perQuestionTime: 2 },
  hard: { colorCount: 6, instructionChangeEvery: 3, perQuestionTime: 1.5 },
  extreme: { colorCount: 6, instructionChangeEvery: 2, perQuestionTime: 1 },
} as const;

function generateQuestion(
  colorCount: number,
  instruction: InstructionMode,
): Question {
  const pool = STROOP_COLORS.slice(0, colorCount);
  const textIdx = Math.floor(Math.random() * pool.length);
  let colorIdx = Math.floor(Math.random() * pool.length);
  while (colorIdx === textIdx) {
    colorIdx = Math.floor(Math.random() * pool.length);
  }
  const text = pool[textIdx].name;
  const textColor = pool[colorIdx].hex;
  const correctAnswer =
    instruction === "meaning" ? pool[textIdx].name : pool[colorIdx].name;
  return { text, textColor, correctAnswer };
}

export default function ColorSequenceGame({
  difficulty,
  onComplete,
  onBack,
}: ColorSequenceGameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colorsInPlay = STROOP_COLORS.slice(0, config.colorCount);
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [instruction, setInstruction] = useState<InstructionMode>(
    difficulty === "easy" ? "meaning" : "meaning",
  );
  const [currentQ, setCurrentQ] = useState<Question>(() =>
    generateQuestion(config.colorCount, "meaning"),
  );
  const [gameTime, setGameTime] = useState(60);
  const [questionTime, setQuestionTime] = useState<number>(
    config.perQuestionTime,
  );
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [scorePopup, setScorePopup] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);

  const gameTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const qTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const endGame = useCallback(() => {
    setPhase("over");
    clearInterval(gameTimerRef.current);
    clearInterval(qTimerRef.current);
    SoundEffects.gameOver();
    Haptic.wrong();
  }, []);

  const nextQuestion = useCallback(
    (answered: number, currentInstruction: InstructionMode) => {
      let inst = currentInstruction;
      if (
        config.instructionChangeEvery !== Infinity &&
        answered % config.instructionChangeEvery === 0 &&
        answered > 0
      ) {
        inst = inst === "meaning" ? "color" : "meaning";
        setInstruction(inst);
      }
      setCurrentQ(generateQuestion(config.colorCount, inst));
      setQuestionTime(config.perQuestionTime);
    },
    [config],
  );

  // Start game
  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(3);
    setTotalAnswered(0);
    setCorrectCount(0);
    setGameTime(60);
    setInstruction("meaning");
    setQuestionTime(config.perQuestionTime);
    setCurrentQ(generateQuestion(config.colorCount, "meaning"));
    setFeedback(null);
    setScorePopup(null);
  }, [config]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    gameTimerRef.current = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 0.1) {
          endGame();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(gameTimerRef.current);
  }, [phase, endGame]);

  // Per-question timer
  useEffect(() => {
    if (phase !== "playing") return;
    qTimerRef.current = setInterval(() => {
      setQuestionTime((prev) => {
        // Tick sound on each whole second
        const prevSec = Math.ceil(prev);
        const nextVal = Math.max(0, prev - 0.1);
        const nextSec = Math.ceil(nextVal);
        if (prevSec !== nextSec && nextSec > 0 && nextSec <= 3) {
          SoundEffects.tick();
          Haptic.tick();
        }
        if (prev <= 0.1) {
          // Time up for this question = wrong
          SoundEffects.wrong();
          Haptic.wrong();
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) endGame();
            return newLives;
          });
          setStreak(0);
          setTotalAnswered((a) => a + 1);
          setShaking(true);
          setTimeout(() => setShaking(false), 400);
          setFeedback("wrong");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => setFeedback(null), 600);
          // Next question
          setTotalAnswered((a) => {
            nextQuestion(a, instruction);
            return a;
          });
          return config.perQuestionTime;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(qTimerRef.current);
  }, [phase, endGame, instruction, config, nextQuestion]);

  const handleAnswer = useCallback(
    (colorName: string) => {
      if (phase !== "playing" || feedback) return;

      const isCorrect = colorName === currentQ.correctAnswer;
      const newTotal = totalAnswered + 1;
      setTotalAnswered(newTotal);

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak((m) => Math.max(m, newStreak));
        const newCorrect = correctCount + 1;
        setCorrectCount(newCorrect);
        const points = Math.round(10 * (1 + newStreak / 10));
        setScore((s) => s + points);
        setScorePopup(points);
        if (newStreak > 2) {
          SoundEffects.combo(newStreak);
          Haptic.combo();
        } else {
          SoundEffects.correct();
          Haptic.correct();
        }
        setFeedback("correct");
        clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = setTimeout(() => {
          setFeedback(null);
          setScorePopup(null);
        }, 500);
        nextQuestion(newTotal, instruction);
      } else {
        setStreak(0);
        SoundEffects.wrong();
        Haptic.wrong();
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) endGame();
          return newLives;
        });
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setFeedback("wrong");
        clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = setTimeout(() => {
          setFeedback(null);
        }, 600);
        nextQuestion(newTotal, instruction);
      }
      setQuestionTime(config.perQuestionTime);
    },
    [
      phase,
      feedback,
      currentQ,
      totalAnswered,
      streak,
      correctCount,
      instruction,
      config,
      endGame,
      nextQuestion,
    ],
  );

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      const accuracy =
        totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
      onComplete(score, {
        accuracy,
        correctCount,
        totalAnswered,
        maxStreak,
        difficulty,
      });
    }
  }, [
    phase,
    score,
    correctCount,
    totalAnswered,
    maxStreak,
    difficulty,
    onComplete,
  ]);

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-sm flex-col items-center gap-6"
        >
          <h1 className="text-2xl font-bold text-white">스트룹 색상 게임</h1>
          <p className="text-center text-sm text-white/60">
            글자의 의미와 색상을 구분하세요!
            <br />
            {difficulty === "easy"
              ? "글자의 의미를 고르세요"
              : "지시가 바뀌니 주의하세요"}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="text-2xl">
                ❤️
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-teal-500 py-3 text-lg font-bold text-white transition-colors hover:bg-teal-400"
          >
            시작하기
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/50 transition-colors hover:text-white/80"
          >
            돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  // Game over screen
  if (phase === "over") {
    const accuracy =
      totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl bg-slate-800 p-8"
        >
          <h2 className="text-2xl font-bold text-white">게임 종료</h2>
          <div className="text-5xl font-black tabular-nums text-white">
            {score.toLocaleString()}
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">정확도</span>
              <span className="text-lg font-bold text-white">{accuracy}%</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">최대 연속</span>
              <span className="text-lg font-bold text-white">{maxStreak}</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">정답</span>
              <span className="text-lg font-bold text-white">
                {correctCount}/{totalAnswered}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-teal-500 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-400"
          >
            다시 하기
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl bg-white/10 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20"
          >
            나가기
          </button>
        </motion.div>
      </div>
    );
  }

  // Playing screen
  const qFraction = questionTime / config.perQuestionTime;
  const qCircumference = 2 * Math.PI * 40;
  const qOffset = qCircumference * (1 - qFraction);
  const qColor =
    qFraction > 0.5 ? "#22C55E" : qFraction > 0.25 ? "#F59E0B" : "#EF4444";

  return (
    <motion.div
      animate={shaking ? { x: [-6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col bg-slate-900"
    >
      {/* Top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < lives ? "" : "opacity-20"}`}
              >
                ❤️
              </span>
            ))}
          </div>
          <div className="relative text-2xl font-bold tabular-nums text-white">
            {score}
            <AnimatePresence>
              {scorePopup !== null && (
                <motion.span
                  key={`${score}-${scorePopup}`}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -24 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute -right-10 -top-2 text-sm font-bold text-green-400"
                >
                  +{scorePopup}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Game timer bar */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${(gameTime / 60) * 100}%`,
              backgroundColor:
                gameTime > 20
                  ? "#22C55E"
                  : gameTime > 10
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-20 pb-8">
        {/* Instruction */}
        <motion.div
          key={instruction}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white"
        >
          {instruction === "meaning"
            ? "글자의 의미를 고르세요"
            : "글자의 색상을 고르세요"}
        </motion.div>

        {/* Streak indicator */}
        {streak > 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-sm font-bold text-orange-400"
          >
            🔥 {streak}연속!
          </motion.div>
        )}

        {/* Question area with circular timer */}
        <div className="relative flex items-center justify-center">
          <svg width="200" height="200" className="-rotate-90">
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke={qColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={qCircumference}
              strokeDashoffset={qOffset}
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
          </svg>
          <motion.div
            key={`${currentQ.text}-${currentQ.textColor}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
              feedback === "correct"
                ? { scale: 1.2, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute text-5xl font-black"
            style={{ color: currentQ.textColor }}
          >
            {currentQ.text}
          </motion.div>
        </div>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback === "correct" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-30 bg-green-500/10"
            />
          )}
        </AnimatePresence>

        {/* Color buttons */}
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {colorsInPlay.map((color) => (
            <motion.button
              key={color.name}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(color.name)}
              className="rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-transform"
              style={{ backgroundColor: color.hex }}
            >
              {color.name}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
