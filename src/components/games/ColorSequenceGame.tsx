"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
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

interface FloatingText {
  id: number;
  text: string;
  color: string;
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

// Animated gradient background component
function AnimatedBackground({
  phase,
}: {
  phase: "ready" | "playing" | "over";
}) {
  const gradients = {
    ready: "from-slate-950 via-indigo-950 to-slate-950",
    playing: "from-slate-950 via-slate-900 to-indigo-950",
    over: "from-slate-950 via-red-950/30 to-slate-950",
  };
  return (
    <>
      <div
        className={`fixed inset-0 bg-gradient-to-br ${gradients[phase]} transition-all duration-1000`}
      />
      {/* Animated mesh orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/8 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/8 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl"
        />
      </div>
    </>
  );
}

// Circular timer component
function CircularTimer({
  fraction,
  size = 200,
  strokeWidth = 5,
}: {
  fraction: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const color =
    fraction > 0.5 ? "#22C55E" : fraction > 0.25 ? "#F59E0B" : "#EF4444";
  const glowColor =
    fraction > 0.5
      ? "rgba(34,197,94,0.3)"
      : fraction > 0.25
        ? "rgba(245,158,11,0.3)"
        : "rgba(239,68,68,0.4)";

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Glow layer */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={glowColor}
        strokeWidth={strokeWidth + 6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 0.1s linear",
          filter: "blur(4px)",
        }}
      />
      {/* Main ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </svg>
  );
}

// Combo fire effect
function ComboIndicator({ streak }: { streak: number }) {
  if (streak <= 2) return null;
  return (
    <motion.div
      initial={{ scale: 0, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className="flex items-center gap-2"
    >
      <motion.div
        animate={{ rotate: [-5, 5, -5], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-2xl"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8 8 4 10 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 10 16 8 12 2Z"
            fill="url(#fire-gradient)"
          />
          <path
            d="M12 9C10 12 8 13 8 15.5C8 17.7 9.8 19.5 12 19.5C14.2 19.5 16 17.7 16 15.5C16 13 14 12 12 9Z"
            fill="url(#fire-inner)"
          />
          <defs>
            <linearGradient id="fire-gradient" x1="12" y1="2" x2="12" y2="22">
              <stop stopColor="#FF6B35" />
              <stop offset="1" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="fire-inner" x1="12" y1="9" x2="12" y2="19.5">
              <stop stopColor="#FFD700" />
              <stop offset="1" stopColor="#FF8C00" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      <motion.span
        key={streak}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent text-lg font-black tracking-tight"
      >
        COMBO x{streak}!
      </motion.span>
      <motion.div
        animate={{ rotate: [5, -5, 5], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
        className="text-2xl"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8 8 4 10 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 10 16 8 12 2Z"
            fill="url(#fire-gradient2)"
          />
          <path
            d="M12 9C10 12 8 13 8 15.5C8 17.7 9.8 19.5 12 19.5C14.2 19.5 16 17.7 16 15.5C16 13 14 12 12 9Z"
            fill="url(#fire-inner2)"
          />
          <defs>
            <linearGradient id="fire-gradient2" x1="12" y1="2" x2="12" y2="22">
              <stop stopColor="#FF6B35" />
              <stop offset="1" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="fire-inner2" x1="12" y1="9" x2="12" y2="19.5">
              <stop stopColor="#FFD700" />
              <stop offset="1" stopColor="#FF8C00" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Floating bonus text component
function FloatingBonus({ texts }: { texts: FloatingText[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {texts.map((ft) => (
          <motion.div
            key={ft.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute text-lg font-black tracking-wide"
            style={{ color: ft.color, textShadow: `0 0 20px ${ft.color}40` }}
          >
            {ft.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
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
  const [prevScore, setPrevScore] = useState(0);
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [perfectRound, setPerfectRound] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [bestScore, setBestScore] = useState<number>(0);
  const [revealStep, setRevealStep] = useState(0);

  const floatingIdRef = useRef(0);
  const scoreAnimCtrl = useAnimation();
  const questionStartTimeRef = useRef<number>(Date.now());

  // Load best score
  useEffect(() => {
    const key = `neuroflex_colorseq_best_${difficulty}`;
    const saved = localStorage.getItem(key);
    if (saved) setBestScore(Number(saved));
  }, [difficulty]);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_colorseq_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

  const gameTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const qTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addFloatingText = useCallback((text: string, color: string) => {
    const id = floatingIdRef.current++;
    setFloatingTexts((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
    }, 1300);
  }, []);

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
      questionStartTimeRef.current = Date.now();
    },
    [config],
  );

  // Start game
  const startGame = useCallback(() => {
    setPhase("playing");
    setScore(0);
    setPrevScore(0);
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
    setPerfectRound(false);
    setFloatingTexts([]);
    setRevealStep(0);
    questionStartTimeRef.current = Date.now();
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

      // Speed bonus calculation
      const responseTime = Date.now() - questionStartTimeRef.current;
      const speedThreshold = config.perQuestionTime * 300; // 30% of time

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak((m) => Math.max(m, newStreak));
        const newCorrect = correctCount + 1;
        setCorrectCount(newCorrect);
        const points = Math.round(10 * (1 + newStreak / 10));

        // Speed bonus
        let speedBonus = 0;
        if (responseTime < speedThreshold) {
          speedBonus = 50;
          addFloatingText("+50 SPEED BONUS", "#38BDF8");
        }

        const totalPoints = points + speedBonus;
        setPrevScore(score);
        setScore((s) => s + totalPoints);
        setScorePopup(totalPoints);
        scoreAnimCtrl.start({
          scale: [1, 1.25, 1],
          transition: { duration: 0.3 },
        });

        if (newStreak > 2) {
          SoundEffects.combo(newStreak);
          Haptic.combo();
        } else {
          SoundEffects.correct();
          Haptic.correct();
        }

        // Perfect round check (every 5 questions)
        if (newCorrect > 0 && newCorrect % 5 === 0 && newCorrect === newTotal) {
          setPerfectRound(true);
          addFloatingText("PERFECT ROUND!", "#FFD700");
          const perfectBonus = 100;
          setScore((s) => s + perfectBonus);
          setTimeout(() => setPerfectRound(false), 1500);
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
      score,
      instruction,
      config,
      endGame,
      nextQuestion,
      addFloatingText,
      scoreAnimCtrl,
    ],
  );

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      const accuracy =
        totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;

      // Save best score
      if (score > bestScore) {
        const key = `neuroflex_colorseq_best_${difficulty}`;
        localStorage.setItem(key, String(score));
        setBestScore(score);
      }

      onComplete(score, {
        accuracy,
        correctCount,
        totalAnswered,
        maxStreak,
        difficulty,
      });

      // Staggered reveal animation
      const steps = [1, 2, 3, 4];
      steps.forEach((step, i) => {
        setTimeout(() => setRevealStep(step), 300 + i * 200);
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
    bestScore,
  ]);

  const isNewBest = phase === "over" && score >= bestScore && score > 0;

  // Sequence step indicator
  const sequenceStep = useMemo(() => {
    if (config.instructionChangeEvery === Infinity) return null;
    const posInCycle = totalAnswered % config.instructionChangeEvery;
    return { current: posInCycle + 1, total: config.instructionChangeEvery };
  }, [totalAnswered, config.instructionChangeEvery]);

  // Question timer fraction
  const qFraction = questionTime / config.perQuestionTime;

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <AnimatedBackground phase="ready" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-7"
        >
          {/* Title with gradient */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-400 bg-clip-text text-3xl font-black text-transparent"
          >
            Color Stroop
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-white/50 leading-relaxed"
          >
            {difficulty === "easy"
              ? "Match the meaning of the word"
              : "Watch the instruction - it changes!"}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.4 + i * 0.1,
                  type: "spring",
                  stiffness: 300,
                }}
                className="text-2xl"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#EF4444">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </motion.span>
            ))}
          </motion.div>

          {/* Difficulty badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/40"
          >
            {difficulty}
          </motion.div>

          {bestScore > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs text-white/30"
            >
              Best: {bestScore.toLocaleString()}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={startGame}
            className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-4 text-lg font-bold text-white shadow-lg shadow-teal-500/25 transition-shadow hover:shadow-xl hover:shadow-teal-500/30"
          >
            Start Game
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            type="button"
            onClick={onBack}
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Game over screen
  if (phase === "over") {
    const accuracy =
      totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <AnimatedBackground phase="over" />
        {/* Blur overlay */}
        <div className="fixed inset-0 z-10 backdrop-blur-sm bg-black/30" />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-20 flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
        >
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl font-bold text-white/80"
          >
            Game Over
          </motion.h2>

          {/* Score with gradient */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center"
          >
            <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-6xl font-black tabular-nums text-transparent">
              {score.toLocaleString()}
            </span>
            {/* NEW BEST badge */}
            <AnimatePresence>
              {isNewBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                  className="mt-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-yellow-500/30"
                >
                  NEW BEST!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Stats with staggered reveal */}
          <div className="flex w-full gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={revealStep >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ type: "spring" }}
              className="flex flex-1 flex-col items-center rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Accuracy
              </span>
              <span className="mt-1 bg-gradient-to-b from-white to-white/70 bg-clip-text text-xl font-bold text-transparent">
                {accuracy}%
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={revealStep >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ type: "spring" }}
              className="flex flex-1 flex-col items-center rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Max Streak
              </span>
              <span className="mt-1 bg-gradient-to-b from-white to-white/70 bg-clip-text text-xl font-bold text-transparent">
                {maxStreak}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={revealStep >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ type: "spring" }}
              className="flex flex-1 flex-col items-center rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Correct
              </span>
              <span className="mt-1 bg-gradient-to-b from-white to-white/70 bg-clip-text text-xl font-bold text-transparent">
                {correctCount}/{totalAnswered}
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={revealStep >= 4 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring" }}
            className="flex w-full flex-col gap-3"
          >
            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-xl hover:shadow-teal-500/30"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-base font-semibold text-white/70 transition-all hover:bg-white/10"
            >
              Exit
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Playing screen
  const gameTimeFraction = gameTime / 60;
  const gameBarColor =
    gameTime > 20 ? "#22C55E" : gameTime > 10 ? "#F59E0B" : "#EF4444";

  return (
    <motion.div
      animate={shaking ? { x: [-8, 8, -5, 5, -2, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-screen flex-col"
    >
      <AnimatedBackground phase="playing" />

      {/* Floating bonus texts */}
      <FloatingBonus texts={floatingTexts} />

      {/* Full-screen correct flash */}
      <AnimatePresence>
        {feedback === "correct" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none z-30 bg-green-500/10"
          />
        )}
        {feedback === "wrong" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none z-30 bg-red-500/15"
          />
        )}
      </AnimatePresence>

      {/* Perfect round flash */}
      <AnimatePresence>
        {perfectRound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 pointer-events-none z-30 bg-yellow-400/20"
          />
        )}
      </AnimatePresence>

      {/* Top bar - glass morphism */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
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
        <div className="flex items-center gap-4">
          {/* Lives */}
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={i}
                animate={
                  i >= lives
                    ? { scale: 0.7, opacity: 0.15 }
                    : { scale: 1, opacity: 1 }
                }
                transition={{ type: "spring", stiffness: 300 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={i < lives ? "#EF4444" : "#666"}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </motion.span>
            ))}
          </div>

          {/* Score with gradient and animation */}
          <div className="relative">
            <motion.div
              animate={scoreAnimCtrl}
              className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-2xl font-black tabular-nums text-transparent"
            >
              {score}
            </motion.div>
            <AnimatePresence>
              {scorePopup !== null && (
                <motion.span
                  key={`${score}-${scorePopup}`}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -28, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute -right-12 -top-1 whitespace-nowrap text-sm font-black text-green-400"
                  style={{ textShadow: "0 0 10px rgba(74,222,128,0.5)" }}
                >
                  +{scorePopup}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Help button */}
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Game timer bar - gradient with glow */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${gameTimeFraction * 100}%`,
              backgroundColor: gameBarColor,
              boxShadow: `0 0 12px ${gameBarColor}60`,
              transition: "width 0.1s linear, background-color 0.3s",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-20 pb-8">
        {/* Instruction pill with glass effect */}
        <motion.div
          key={instruction}
          initial={{ opacity: 0, y: -15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white/80 backdrop-blur-md"
        >
          {instruction === "meaning" ? "Match the MEANING" : "Match the COLOR"}
        </motion.div>

        {/* Sequence step indicator */}
        {sequenceStep && (
          <motion.div
            key={sequenceStep.current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            {Array.from({ length: sequenceStep.total }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  backgroundColor:
                    i < sequenceStep.current
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.1)",
                  scale: i === sequenceStep.current - 1 ? 1.3 : 1,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className="h-1.5 w-1.5 rounded-full"
              />
            ))}
            <span className="ml-2 text-[11px] font-medium tabular-nums text-white/30">
              {sequenceStep.current}/{sequenceStep.total}
            </span>
          </motion.div>
        )}

        {/* Combo indicator */}
        <AnimatePresence>
          <ComboIndicator streak={streak} />
        </AnimatePresence>

        {/* Question area with circular timer */}
        <div className="relative flex items-center justify-center">
          <CircularTimer fraction={qFraction} size={220} strokeWidth={5} />
          <motion.div
            key={`${currentQ.text}-${currentQ.textColor}`}
            initial={{ scale: 0.7, opacity: 0, rotateX: 20 }}
            animate={
              feedback === "correct"
                ? { scale: 1.15, opacity: 1, rotateX: 0 }
                : { scale: 1, opacity: 1, rotateX: 0 }
            }
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute text-5xl font-black sm:text-6xl"
            style={{
              color: currentQ.textColor,
              textShadow: `0 0 30px ${currentQ.textColor}40`,
            }}
          >
            {currentQ.text}
          </motion.div>
        </div>

        {/* Color buttons - glass morphism grid */}
        <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {colorsInPlay.map((color) => (
            <motion.button
              key={color.name}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleAnswer(color.name)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative overflow-hidden rounded-2xl border border-white/15 py-5 text-lg font-bold text-white shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl sm:py-6 sm:text-xl"
              style={{
                background: `linear-gradient(135deg, ${color.hex}CC, ${color.hex}90)`,
                boxShadow: `0 4px 20px ${color.hex}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              {/* Glass highlight */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
                }}
              />
              <span className="relative z-10 drop-shadow-md">{color.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-800 p-5 shadow-2xl"
            >
              <h2 className="mb-4 text-center text-lg font-bold text-white">
                스트룹 색상 게임 방법
              </h2>

              <div className="space-y-4 text-sm text-white/80">
                <div>
                  <p className="mb-2 font-semibold text-indigo-300">목표</p>
                  <p>
                    화면에 표시되는 색깔 순서를 기억하고 올바른 순서대로
                    선택하세요
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-indigo-300">
                    플레이 방법
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>색깔들이 순서대로 깜빡입니다</li>
                    <li>깜빡이는 순서를 기억하세요</li>
                    <li>같은 순서대로 색깔 버튼을 탭하세요</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-1 font-semibold text-indigo-300">팁</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/60">
                    <li>레벨이 올라갈수록 기억할 색깔이 늘어납니다</li>
                    <li>연속 정답 시 콤보 보너스!</li>
                    <li>제한 시간 안에 답해야 합니다</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="mt-5 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
              >
                알겠어요!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
