"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";

interface PatternMemoryGameProps {
  difficulty: "easy" | "medium" | "hard" | "extreme";
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

type Phase = "ready" | "showing" | "input" | "feedback" | "gameover";
type Mode = "normal" | "reverse" | "color" | "double";

const GRID_SIZES: Record<string, number> = {
  easy: 3,
  medium: 4,
  hard: 5,
  extreme: 6,
};
const FLASH_DURATION = 500;
const FLASH_GAP = 200;
const CELL_COLORS = ["#6C5CE7", "#E84393", "#00CEC9", "#FDCB6E"];
const MODE_MULTIPLIERS: Record<Mode, number> = {
  normal: 1,
  reverse: 1.5,
  color: 2,
  double: 2.5,
};

function getMode(round: number): Mode {
  if (round >= 15) return "double";
  if (round >= 10) return "color";
  if (round >= 5) return "reverse";
  return "normal";
}

function getModeAnnouncement(mode: Mode): string | null {
  switch (mode) {
    case "reverse":
      return "역순 모드!";
    case "color":
      return "컬러 모드!";
    case "double":
      return "더블 모드!";
    default:
      return null;
  }
}

export default function PatternMemoryGame({
  difficulty,
  onComplete,
  onBack,
}: PatternMemoryGameProps) {
  const gridSize = GRID_SIZES[difficulty];
  const totalCells = gridSize * gridSize;

  const [sequence, setSequence] = useState<number[]>([]);
  const [colorSequence, setColorSequence] = useState<number[]>([]);
  const [inputSequence, setInputSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [mode, setMode] = useState<Mode>("normal");
  const [score, setScore] = useState(0);
  const [flashingCell, setFlashingCell] = useState<number | null>(null);
  const [flashingColor, setFlashingColor] = useState<string>("#6C5CE7");
  const [modeAnnouncement, setModeAnnouncement] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [maxSequence, setMaxSequence] = useState(0);

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (announcementTimerRef.current)
        clearTimeout(announcementTimerRef.current);
    };
  }, []);

  const generateSequence = useCallback(
    (
      length: number,
      currentMode: Mode,
    ): { seq: number[]; colors: number[] } => {
      const seq: number[] = [];
      const colors: number[] = [];

      if (currentMode === "double") {
        for (let i = 0; i < length; i++) {
          const cell1 = Math.floor(Math.random() * totalCells);
          let cell2 = Math.floor(Math.random() * totalCells);
          while (cell2 === cell1) {
            cell2 = Math.floor(Math.random() * totalCells);
          }
          seq.push(cell1, cell2);
          colors.push(0, 0);
        }
      } else {
        for (let i = 0; i < length; i++) {
          seq.push(Math.floor(Math.random() * totalCells));
          if (currentMode === "color") {
            colors.push(Math.floor(Math.random() * CELL_COLORS.length));
          } else {
            colors.push(0);
          }
        }
        if (currentMode === "color") {
          const hasPurple = colors.some((c) => c === 0);
          if (!hasPurple) {
            colors[Math.floor(Math.random() * colors.length)] = 0;
          }
        }
      }

      return { seq, colors };
    },
    [totalCells],
  );

  const getExpectedInput = useCallback((): number[] => {
    if (mode === "reverse") {
      return [...sequence].reverse();
    }
    if (mode === "color") {
      return sequence.filter((_, i) => colorSequence[i] === 0);
    }
    if (mode === "double") {
      return [...sequence];
    }
    return [...sequence];
  }, [mode, sequence, colorSequence]);

  const playSequence = useCallback(
    (seq: number[], colors: number[], currentMode: Mode) => {
      setPhase("showing");
      setFlashingCell(null);

      if (currentMode === "double") {
        let step = 0;
        const totalSteps = seq.length / 2;

        const showNext = () => {
          if (step >= totalSteps) {
            setFlashingCell(null);
            setPhase("input");
            return;
          }

          const idx = step * 2;
          setFlashingCell(seq[idx]);
          setFlashingColor(CELL_COLORS[0]);

          showTimerRef.current = setTimeout(() => {
            setFlashingCell(seq[idx + 1]);

            showTimerRef.current = setTimeout(() => {
              setFlashingCell(null);
              step++;

              showTimerRef.current = setTimeout(showNext, FLASH_GAP);
            }, FLASH_DURATION / 2);
          }, FLASH_DURATION / 2);
        };

        showTimerRef.current = setTimeout(showNext, 500);
      } else {
        let i = 0;
        const showNext = () => {
          if (i >= seq.length) {
            setFlashingCell(null);
            setPhase("input");
            return;
          }

          setFlashingCell(seq[i]);
          setFlashingColor(CELL_COLORS[colors[i]] || CELL_COLORS[0]);

          showTimerRef.current = setTimeout(() => {
            setFlashingCell(null);
            i++;
            showTimerRef.current = setTimeout(showNext, FLASH_GAP);
          }, FLASH_DURATION);
        };

        showTimerRef.current = setTimeout(showNext, 500);
      }
    },
    [],
  );

  const startRound = useCallback(
    (roundNum: number) => {
      const newMode = getMode(roundNum);
      const prevMode = getMode(roundNum - 1);
      const seqLength = roundNum + 2;

      const { seq, colors } = generateSequence(seqLength, newMode);
      setSequence(seq);
      setColorSequence(colors);
      setInputSequence([]);
      setRound(roundNum);
      setMode(newMode);
      setFeedbackType(null);

      if (newMode !== prevMode && roundNum > 1) {
        const announcement = getModeAnnouncement(newMode);
        setModeAnnouncement(announcement);
        announcementTimerRef.current = setTimeout(() => {
          setModeAnnouncement(null);
          playSequence(seq, colors, newMode);
        }, 1500);
      } else {
        playSequence(seq, colors, newMode);
      }
    },
    [generateSequence, playSequence],
  );

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setMaxSequence(0);
    startRound(1);
  }, [startRound]);

  const handleCellTap = useCallback(
    (cellIndex: number) => {
      if (phase !== "input") return;

      const expected = getExpectedInput();
      const newInput = [...inputSequence, cellIndex];
      setInputSequence(newInput);

      const currentIndex = newInput.length - 1;

      if (newInput[currentIndex] !== expected[currentIndex]) {
        setFeedbackType("wrong");
        setPhase("feedback");

        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          feedbackTimerRef.current = setTimeout(() => {
            setPhase("gameover");
            onComplete(score, {
              rounds: round,
              maxSequence: maxSequence,
              mode,
            });
          }, 800);
        } else {
          feedbackTimerRef.current = setTimeout(() => {
            setInputSequence([]);
            setFeedbackType(null);
            playSequence(sequence, colorSequence, mode);
          }, 800);
        }
        return;
      }

      if (newInput.length === expected.length) {
        const seqLen =
          mode === "double" ? sequence.length / 2 : sequence.length;
        const roundScore = Math.round(round * seqLen * MODE_MULTIPLIERS[mode]);
        const newScore = score + roundScore;
        setScore(newScore);
        setMaxSequence(Math.max(maxSequence, seqLen));
        setFeedbackType("correct");
        setPhase("feedback");

        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackType(null);
          startRound(round + 1);
        }, 600);
      }
    },
    [
      phase,
      getExpectedInput,
      inputSequence,
      lives,
      score,
      round,
      mode,
      sequence,
      colorSequence,
      maxSequence,
      playSequence,
      startRound,
      onComplete,
    ],
  );

  const cellSize = Math.max(60, Math.floor(280 / gridSize));

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0F0A1A] text-white p-4">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white transition-colors text-sm"
        >
          ← 뒤로
        </button>
        <div className="text-center">
          <div className="text-lg font-bold">패턴 기억</div>
          {phase !== "ready" && phase !== "gameover" && (
            <div className="text-xs text-white/50">라운드 {round}</div>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Lives & Score */}
      {phase !== "ready" && (
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={i}
                animate={
                  i >= lives
                    ? { opacity: 0.2, scale: 0.8 }
                    : { opacity: 1, scale: 1 }
                }
                className="text-xl"
              >
                {i < lives ? "❤️" : "🖤"}
              </motion.span>
            ))}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {score.toLocaleString()}
            </div>
            {phase !== "gameover" && (
              <div className="text-xs text-white/40">
                시퀀스:{" "}
                {mode === "double" ? sequence.length / 2 : sequence.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode badge */}
      {phase !== "ready" && phase !== "gameover" && mode !== "normal" && (
        <div className="mb-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background:
                mode === "reverse"
                  ? "#E84393"
                  : mode === "color"
                    ? "#00CEC9"
                    : "#FDCB6E",
              color: mode === "double" ? "#000" : "#fff",
            }}
          >
            {mode === "reverse" ? "역순" : mode === "color" ? "컬러" : "더블"}
          </span>
        </div>
      )}

      {/* Phase indicator */}
      {phase === "showing" && (
        <div className="mb-3 text-sm text-white/60 animate-pulse">
          시퀀스를 기억하세요...
        </div>
      )}
      {phase === "input" && (
        <div className="mb-3 text-sm text-[#00B894]">
          {mode === "reverse"
            ? "역순으로 입력하세요!"
            : mode === "color"
              ? "보라색 셀만 순서대로!"
              : "순서대로 입력하세요!"}
        </div>
      )}

      {/* Grid */}
      <div className="relative">
        <motion.div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          }}
          animate={
            feedbackType === "wrong" ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }
          }
          transition={
            feedbackType === "wrong" ? { duration: 0.4 } : { duration: 0.1 }
          }
        >
          {Array.from({ length: totalCells }).map((_, i) => {
            const isFlashing = flashingCell === i;
            const tapIndex = inputSequence.indexOf(i);
            const isTapped = tapIndex !== -1;

            let bgColor = "rgba(255,255,255,0.06)";
            if (isFlashing) {
              bgColor = flashingColor;
            } else if (feedbackType === "correct" && isTapped) {
              bgColor = "#00B894";
            } else if (feedbackType === "wrong" && isTapped) {
              bgColor = "#E17055";
            }

            return (
              <motion.button
                key={i}
                onClick={() => handleCellTap(i)}
                disabled={phase !== "input"}
                className="rounded-xl relative flex items-center justify-center font-bold text-lg transition-colors"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: bgColor,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                animate={
                  isFlashing
                    ? { scale: 1.1, boxShadow: `0 0 24px ${flashingColor}` }
                    : { scale: 1, boxShadow: "0 0 0px transparent" }
                }
                transition={{ duration: 0.15 }}
                whileTap={phase === "input" ? { scale: 0.92 } : undefined}
              >
                {phase === "input" && isTapped && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white/80 text-sm font-bold"
                  >
                    {tapIndex + 1}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Mode announcement overlay */}
        <AnimatePresence>
          {modeAnnouncement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <div
                className="text-3xl font-black px-6 py-3 rounded-2xl"
                style={{
                  background: "rgba(15, 10, 26, 0.9)",
                  border: "2px solid #6C5CE7",
                  textShadow: "0 0 20px #6C5CE7",
                }}
              >
                {modeAnnouncement}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedbackType === "correct" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl"
              >
                ✓
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ready screen */}
      {phase === "ready" && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-center mb-4">
            <div className="text-white/60 text-sm mb-2">
              {gridSize}×{gridSize} 그리드
            </div>
            <div className="text-white/40 text-xs max-w-xs">
              깜빡이는 셀의 순서를 기억하고 따라 누르세요.
              <br />
              라운드가 올라갈수록 모드가 변합니다!
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={startGame}
            className="px-8 py-3.5 bg-[#6C5CE7] text-white rounded-xl font-semibold text-lg hover:bg-[#5A4BD1] transition-colors"
          >
            시작하기
          </motion.button>
        </div>
      )}

      {/* Game over screen */}
      {phase === "gameover" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="text-2xl font-bold text-[#E84393] mb-1">
            게임 오버
          </div>
          <div className="text-center space-y-1 text-white/60 text-sm">
            <div>
              최종 점수:{" "}
              <span className="text-white font-bold text-lg">
                {score.toLocaleString()}
              </span>
            </div>
            <div>라운드: {round}</div>
            <div>최대 시퀀스: {maxSequence}</div>
            <div>
              최종 모드:{" "}
              {mode === "normal"
                ? "일반"
                : mode === "reverse"
                  ? "역순"
                  : mode === "color"
                    ? "컬러"
                    : "더블"}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              나가기
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-6 py-2.5 bg-[#6C5CE7] text-white rounded-xl font-semibold hover:bg-[#5A4BD1] transition-colors"
            >
              다시 하기
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
