"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface MathRushGameProps {
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

interface Problem {
  expression: string;
  answer: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(level: number): Problem {
  let a: number, b: number, c: number, expression: string, answer: number;
  switch (level) {
    case 1: // single digit +/-
      a = randomInt(1, 9);
      b = randomInt(1, 9);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
    case 2: // two digit +/-
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
    case 3: // single digit ×
      a = randomInt(2, 9);
      b = randomInt(2, 9);
      expression = `${a} × ${b}`;
      answer = a * b;
      break;
    case 4: // two×single digit
      a = randomInt(11, 56);
      b = randomInt(2, 9);
      expression = `${a} × ${b}`;
      answer = a * b;
      break;
    case 5: // mixed ops
      a = randomInt(5, 30);
      b = randomInt(5, 30);
      c = randomInt(1, 9);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b} - ${c}`;
        answer = a + b - c;
      } else {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        c = randomInt(1, 20);
        expression = `${a} × ${b} + ${c}`;
        answer = a * b + c;
      }
      break;
    case 6: {
      // division
      b = randomInt(2, 12);
      const quotient = randomInt(2, 12);
      a = b * quotient;
      expression = `${a} ÷ ${b}`;
      answer = quotient;
      break;
    }
    case 7: // three digit +/-
    default:
      a = randomInt(100, 999);
      b = randomInt(100, 999);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
  }
  return { expression, answer };
}

function generateChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  let attempts = 0;
  while (choices.size < 3 && attempts < 50) {
    attempts++;
    const offset = randomInt(
      1,
      Math.max(3, Math.abs(Math.floor(correct * 0.1))),
    );
    const wrong = Math.random() < 0.5 ? correct + offset : correct - offset;
    if (wrong !== correct) choices.add(wrong);
  }
  // Fallback
  while (choices.size < 3) {
    choices.add(correct + choices.size * 7);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

const LEVEL_NAMES = [
  "",
  "Lv.1 기초",
  "Lv.2 덧뺄셈",
  "Lv.3 곱셈",
  "Lv.4 큰곱셈",
  "Lv.5 복합",
  "Lv.6 나눗셈",
  "Lv.7 큰수",
];

export default function MathRushGame({
  onComplete,
  onBack,
}: MathRushGameProps) {
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentProblem, setCurrentProblem] = useState<Problem>({
    expression: "",
    answer: 0,
  });
  const [choices, setChoices] = useState<number[]>([]);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [levelMsg, setLevelMsg] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<number | null>(
    null,
  );

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const levelTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadNewProblem = useCallback((lvl: number) => {
    const problem = generateProblem(lvl);
    setCurrentProblem(problem);
    setChoices(generateChoices(problem.answer));
  }, []);

  const endGame = useCallback(() => {
    setPhase("over");
    clearInterval(timerRef.current);
    SoundEffects.gameOver();
    Haptic.wrong();
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLevel(1);
    setLives(3);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    setFeedback(null);
    setLevelMsg("");
    setShowCorrectAnswer(null);
    loadNewProblem(1);
  }, [loadNewProblem]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          endGame();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, endGame]);

  const handleAnswer = useCallback(
    (chosenAnswer: number) => {
      if (phase !== "playing" || feedback) return;

      const isCorrect = chosenAnswer === currentProblem.answer;

      if (isCorrect) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        const comboMultiplier = 1 + (newCombo - 1) * 0.1;
        const points = Math.round(level * 10 * comboMultiplier);
        setScore((s) => s + points);
        setTotalCorrect((c) => c + 1);
        setConsecutiveWrong(0);

        const newConsCorrect = consecutiveCorrect + 1;
        setConsecutiveCorrect(newConsCorrect);

        // Level up check
        if (newConsCorrect >= 3 && level < 7) {
          const newLevel = level + 1;
          setLevel(newLevel);
          setConsecutiveCorrect(0);
          setLevelMsg("Level Up!");
          SoundEffects.levelUp();
          Haptic.achievement();
          clearTimeout(levelTimeout.current);
          levelTimeout.current = setTimeout(() => setLevelMsg(""), 1200);
          setFeedback("correct");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            loadNewProblem(newLevel);
          }, 400);
        } else {
          if (newCombo > 2) {
            SoundEffects.combo(newCombo);
            Haptic.combo();
          } else {
            SoundEffects.correct();
            Haptic.correct();
          }
          setFeedback("correct");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            loadNewProblem(level);
          }, 300);
        }
      } else {
        setCombo(0);
        SoundEffects.wrong();
        Haptic.wrong();
        setTotalWrong((w) => w + 1);
        setConsecutiveCorrect(0);
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setShowCorrectAnswer(currentProblem.answer);

        const newConsWrong = consecutiveWrong + 1;
        setConsecutiveWrong(newConsWrong);

        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            endGame();
            return 0;
          }
          return newLives;
        });

        // Level down check
        if (newConsWrong >= 2 && level > 1) {
          const newLevel = level - 1;
          setLevel(newLevel);
          setConsecutiveWrong(0);
          setLevelMsg("Level Down");
          clearTimeout(levelTimeout.current);
          levelTimeout.current = setTimeout(() => setLevelMsg(""), 1200);
          setFeedback("wrong");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowCorrectAnswer(null);
            loadNewProblem(newLevel);
          }, 800);
        } else {
          setFeedback("wrong");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowCorrectAnswer(null);
            loadNewProblem(level);
          }, 800);
        }
      }
    },
    [
      phase,
      feedback,
      currentProblem,
      combo,
      level,
      consecutiveCorrect,
      consecutiveWrong,
      endGame,
      loadNewProblem,
    ],
  );

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;
      onComplete(score, {
        accuracy,
        totalCorrect,
        totalWrong,
        maxCombo,
        maxLevel: level,
      });
    }
  }, [phase, score, totalCorrect, totalWrong, maxCombo, level, onComplete]);

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-sm flex-col items-center gap-6"
        >
          <h1 className="text-2xl font-bold text-white">수학 러시</h1>
          <p className="text-center text-sm text-white/60">
            빠르게 수학 문제를 풀어보세요!
            <br />
            연속 정답으로 레벨이 올라갑니다
          </p>
          <div className="flex gap-4 text-sm text-white/40">
            <span>⏱ 60초</span>
            <span>❤️ 3목숨</span>
            <span>📈 자동 레벨</span>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-amber-500 py-3 text-lg font-bold text-white transition-colors hover:bg-amber-400"
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
    const total = totalCorrect + totalWrong;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
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
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">정확도</span>
              <span className="text-lg font-bold text-white">{accuracy}%</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">최대 콤보</span>
              <span className="text-lg font-bold text-white">{maxCombo}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">최고 레벨</span>
              <span className="text-lg font-bold text-white">
                {LEVEL_NAMES[level]}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">정답</span>
              <span className="text-lg font-bold text-white">
                {totalCorrect}/{total}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-amber-500 py-3 text-base font-semibold text-white transition-colors hover:bg-amber-400"
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
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
            {LEVEL_NAMES[level]}
          </span>
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
          <span className="text-2xl font-bold tabular-nums text-white">
            {score}
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${(timeLeft / 60) * 100}%`,
              backgroundColor:
                timeLeft > 20
                  ? "#22C55E"
                  : timeLeft > 10
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-20 pb-8">
        {/* Combo display */}
        <AnimatePresence>
          {combo > 2 && (
            <motion.div
              key={combo}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-1"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-xl"
              >
                🔥
              </motion.span>
              <span
                className="text-lg font-black"
                style={{
                  background:
                    combo > 8
                      ? "linear-gradient(135deg, #FF4500, #FF0000)"
                      : "linear-gradient(135deg, #FF8C00, #FFA500)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                x{combo}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level change announcement */}
        <AnimatePresence>
          {levelMsg && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                levelMsg === "Level Up!"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {levelMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Problem */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProblem.expression}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center"
          >
            <div className="text-5xl font-black tabular-nums text-white">
              {currentProblem.expression}
            </div>
            {showCorrectAnswer !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-lg font-bold text-red-400"
              >
                정답: {showCorrectAnswer}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Feedback flash */}
        <AnimatePresence>
          {feedback === "correct" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-30 bg-green-500/10"
            />
          )}
        </AnimatePresence>

        {/* Answer choices */}
        <div className="flex w-full max-w-sm justify-center gap-4">
          {choices.map((choice) => (
            <motion.button
              key={`${currentProblem.expression}-${choice}`}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleAnswer(choice)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-bold tabular-nums text-white shadow-lg transition-colors hover:bg-white/20"
            >
              {choice}
            </motion.button>
          ))}
        </div>

        {/* Time display */}
        <span className="text-lg font-bold tabular-nums text-white/50">
          {Math.ceil(timeLeft)}s
        </span>
      </div>
    </motion.div>
  );
}
