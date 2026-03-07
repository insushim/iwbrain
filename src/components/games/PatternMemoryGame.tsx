"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface PatternMemoryGameProps {
  difficulty: "easy" | "medium" | "hard" | "extreme";
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

type Phase = "ready" | "showing" | "input" | "feedback" | "gameover";
type Mode =
  | "normal"
  | "reverse"
  | "color"
  | "double"
  | "spiral"
  | "mirror"
  | "speed"
  | "decay"
  | "chain"
  | "blind"
  | "math"
  | "rotation";

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
  spiral: 1.6,
  mirror: 2.0,
  speed: 1.8,
  decay: 2.2,
  chain: 1.7,
  blind: 2.5,
  math: 2.3,
  rotation: 2.0,
};

const MODE_COLORS: Record<Mode, string> = {
  normal: "#6C5CE7",
  reverse: "#E84393",
  color: "#00CEC9",
  double: "#FDCB6E",
  spiral: "#A29BFE",
  mirror: "#74B9FF",
  speed: "#FF7675",
  decay: "#636E72",
  chain: "#55EFC4",
  blind: "#2D3436",
  math: "#FAB1A0",
  rotation: "#81ECEC",
};

const MODE_LABELS: Record<Mode, string> = {
  normal: "기본",
  reverse: "역순",
  color: "컬러",
  double: "더블",
  spiral: "나선",
  mirror: "거울",
  speed: "속도",
  decay: "소멸",
  chain: "연쇄",
  blind: "블라인드",
  math: "수학",
  rotation: "회전",
};

function getMode(round: number): Mode {
  if (round >= 26) return "double";
  if (round >= 24) return "rotation";
  if (round >= 22) return "math";
  if (round >= 20) return "blind";
  if (round >= 18) return "decay";
  if (round >= 16) return "spiral";
  if (round >= 14) return "mirror";
  if (round >= 12) return "chain";
  if (round >= 10) return "speed";
  if (round >= 8) return "color";
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
    case "spiral":
      return "나선 모드!";
    case "mirror":
      return "거울 모드!";
    case "speed":
      return "속도 모드!";
    case "decay":
      return "소멸 모드!";
    case "chain":
      return "연쇄 모드!";
    case "blind":
      return "블라인드 모드!";
    case "math":
      return "수학 모드!";
    case "rotation":
      return "회전 모드!";
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: generate spiral order for a grid                           */
/* ------------------------------------------------------------------ */
function generateSpiralOrder(size: number): number[] {
  const result: number[] = [];
  let top = 0,
    bottom = size - 1,
    left = 0,
    right = size - 1;
  while (top <= bottom && left <= right) {
    for (let i = left; i <= right; i++) result.push(top * size + i);
    top++;
    for (let i = top; i <= bottom; i++) result.push(i * size + right);
    right--;
    if (top <= bottom) {
      for (let i = right; i >= left; i--) result.push(bottom * size + i);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) result.push(i * size + left);
      left++;
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Helper: mirror a cell index horizontally                           */
/* ------------------------------------------------------------------ */
function mirrorCell(cellIndex: number, gridSize: number): number {
  const row = Math.floor(cellIndex / gridSize);
  const col = cellIndex % gridSize;
  const mirroredCol = gridSize - 1 - col;
  return row * gridSize + mirroredCol;
}

/* ------------------------------------------------------------------ */
/*  Helper: rotate cell position 90 degrees clockwise                  */
/* ------------------------------------------------------------------ */
function rotateCell90(
  cellIndex: number,
  gridSize: number,
  times: number,
): number {
  let row = Math.floor(cellIndex / gridSize);
  let col = cellIndex % gridSize;
  for (let t = 0; t < times; t++) {
    const newRow = col;
    const newCol = gridSize - 1 - row;
    row = newRow;
    col = newCol;
  }
  return row * gridSize + col;
}

/* ------------------------------------------------------------------ */
/*  Animated particle background (CSS-only via pseudo-elements)       */
/* ------------------------------------------------------------------ */
const particleKeyframes = `
@keyframes pmg-float {
  0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(40px); opacity: 0; }
}
@keyframes pmg-twinkle {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.6; }
}
@keyframes pmg-pulse-border {
  0%, 100% { border-color: rgba(108,92,231,0.3); }
  50% { border-color: rgba(108,92,231,0.7); }
}
@keyframes pmg-heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.25); }
  30% { transform: scale(1); }
}
@keyframes pmg-heart-break {
  0% { transform: scale(1); opacity: 1; }
  30% { transform: scale(1.3); }
  60% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(0.6); opacity: 0.2; }
}
@keyframes pmg-ripple {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes pmg-score-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
@keyframes pmg-green-wave {
  0% { box-shadow: 0 0 0px rgba(0,184,148,0); }
  50% { box-shadow: 0 0 20px rgba(0,184,148,0.6); }
  100% { box-shadow: 0 0 0px rgba(0,184,148,0); }
}
`;

/* ------------------------------------------------------------------ */
/*  Particle field component                                          */
/* ------------------------------------------------------------------ */
function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 8,
      twinkleDuration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(108,92,231,0.8), rgba(232,67,147,0.4))`,
            animation: `pmg-float ${p.duration}s ${p.delay}s linear infinite, pmg-twinkle ${p.twinkleDuration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ripple effect on cell flash                                       */
/* ------------------------------------------------------------------ */
function CellRipple({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      initial={{ scale: 0.5, opacity: 0.8 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
      }}
    />
  );
}

export default function PatternMemoryGame({
  difficulty,
  onComplete,
  onBack,
}: PatternMemoryGameProps) {
  const gridSize = GRID_SIZES[difficulty];
  const totalCells = gridSize * gridSize;
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [sequence, setSequence] = useState<number[]>([]);
  const [colorSequence, setColorSequence] = useState<number[]>([]);
  const [inputSequence, setInputSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [prevLives, setPrevLives] = useState(3);
  const [mode, setMode] = useState<Mode>("normal");
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [flashingCell, setFlashingCell] = useState<number | null>(null);
  const [flashingColor, setFlashingColor] = useState<string>("#6C5CE7");
  const [modeAnnouncement, setModeAnnouncement] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [maxSequence, setMaxSequence] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [flashIndex, setFlashIndex] = useState(-1);

  // New mode states
  const [chainSequence, setChainSequence] = useState<number[]>([]);
  const [mathNumbers, setMathNumbers] = useState<number[]>([]);
  const [mathTarget, setMathTarget] = useState(0);
  const [rotationTimes, setRotationTimes] = useState(1);
  const [decayHidden, setDecayHidden] = useState<number[]>([]);
  const [blindGrid, setBlindGrid] = useState(false);
  const [speedFlashDuration, setSpeedFlashDuration] = useState(FLASH_DURATION);

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Animate score counter
  useEffect(() => {
    if (score === displayScore) return;
    setScoreAnimating(true);
    const diff = score - displayScore;
    const step = Math.max(1, Math.floor(Math.abs(diff) / 10));
    const timer = setTimeout(() => {
      if (displayScore < score) {
        setDisplayScore(Math.min(displayScore + step, score));
      } else {
        setDisplayScore(score);
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [score, displayScore]);

  useEffect(() => {
    if (displayScore === score) {
      setScoreAnimating(false);
    }
  }, [displayScore, score]);

  // Track life loss for break animation
  useEffect(() => {
    if (lives < prevLives) {
      const timer = setTimeout(() => setPrevLives(lives), 600);
      return () => clearTimeout(timer);
    }
    setPrevLives(lives);
  }, [lives, prevLives]);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_patternmemory_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

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
      } else if (currentMode === "spiral") {
        // Pick cells along the spiral path (outside-in)
        const spiralOrder = generateSpiralOrder(gridSize);
        const startIdx = Math.floor(
          Math.random() * Math.max(1, spiralOrder.length - length),
        );
        for (let i = 0; i < length; i++) {
          seq.push(spiralOrder[(startIdx + i) % spiralOrder.length]);
          colors.push(0);
        }
      } else if (currentMode === "mirror") {
        // Generate cells only on the left half, player reproduces mirrored on right
        const halfCols = Math.floor(gridSize / 2);
        for (let i = 0; i < length; i++) {
          const row = Math.floor(Math.random() * gridSize);
          const col = Math.floor(Math.random() * Math.max(1, halfCols));
          seq.push(row * gridSize + col);
          colors.push(0);
        }
      } else if (currentMode === "math") {
        // Generate numbers for all cells; pick a subset whose sum = target
        const nums: number[] = [];
        for (let i = 0; i < totalCells; i++) {
          nums.push(Math.floor(Math.random() * 9) + 1);
        }
        setMathNumbers(nums);
        // Pick `length` random cells as the answer
        const indices = Array.from({ length: totalCells }, (_, i) => i);
        const answerCount = Math.min(length, Math.floor(totalCells / 2));
        const shuffled = indices.sort(() => Math.random() - 0.5);
        const answerCells = shuffled.slice(0, answerCount);
        const target = answerCells.reduce((sum, idx) => sum + nums[idx], 0);
        setMathTarget(target);
        for (const cell of answerCells) {
          seq.push(cell);
          colors.push(0);
        }
      } else if (currentMode === "rotation") {
        // Generate normal sequence; set rotation amount
        const times = Math.random() < 0.5 ? 1 : 2; // 90 or 180 degrees
        setRotationTimes(times);
        for (let i = 0; i < length; i++) {
          seq.push(Math.floor(Math.random() * totalCells));
          colors.push(0);
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
    [totalCells, gridSize],
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
    if (mode === "mirror") {
      // Player must tap the mirrored positions in order
      return sequence.map((cell) => mirrorCell(cell, gridSize));
    }
    if (mode === "chain") {
      return [...chainSequence];
    }
    if (mode === "decay") {
      // Player must remember the full original sequence (including decayed cells)
      return [...sequence];
    }
    if (mode === "math") {
      // Player can tap in any order; we sort for comparison later
      // But we use set-based comparison in handleCellTap instead
      return [...sequence];
    }
    if (mode === "rotation") {
      return sequence.map((cell) =>
        rotateCell90(cell, gridSize, rotationTimes),
      );
    }
    // normal, speed, spiral, blind all use sequence as-is
    return [...sequence];
  }, [mode, sequence, colorSequence, gridSize, chainSequence, rotationTimes]);

  const playSequence = useCallback(
    (seq: number[], colors: number[], currentMode: Mode) => {
      setPhase("showing");
      setFlashingCell(null);
      setFlashIndex(-1);
      setBlindGrid(false);
      setDecayHidden([]);

      // Slightly slower at higher levels (round > 8)
      const levelSlowdown = Math.min(150, Math.max(0, (seq.length - 5) * 20));
      let adjustedFlashDuration = FLASH_DURATION + levelSlowdown;

      // Speed mode: use decreasing flash duration
      if (currentMode === "speed") {
        adjustedFlashDuration = speedFlashDuration;
      }

      // Math mode: show all numbers briefly, then go to input
      if (currentMode === "math") {
        // Flash the answer cells to hint, then go to input
        let i = 0;
        const showNext = () => {
          if (i >= seq.length) {
            setFlashingCell(null);
            setFlashIndex(-1);
            setPhase("input");
            return;
          }
          setFlashingCell(seq[i]);
          setFlashingColor(CELL_COLORS[0]);
          setFlashIndex(i);
          showTimerRef.current = setTimeout(() => {
            setFlashingCell(null);
            setFlashIndex(-1);
            i++;
            showTimerRef.current = setTimeout(showNext, FLASH_GAP);
          }, adjustedFlashDuration);
        };
        showTimerRef.current = setTimeout(showNext, 500);
        return;
      }

      if (currentMode === "double") {
        let step = 0;
        const totalSteps = seq.length / 2;

        const showNext = () => {
          if (step >= totalSteps) {
            setFlashingCell(null);
            setFlashIndex(-1);
            setPhase("input");
            return;
          }

          const idx = step * 2;
          setFlashingCell(seq[idx]);
          setFlashingColor(CELL_COLORS[0]);
          setFlashIndex(idx);

          showTimerRef.current = setTimeout(() => {
            setFlashingCell(seq[idx + 1]);
            setFlashIndex(idx + 1);

            showTimerRef.current = setTimeout(() => {
              setFlashingCell(null);
              setFlashIndex(-1);
              step++;

              showTimerRef.current = setTimeout(showNext, FLASH_GAP);
            }, adjustedFlashDuration / 2);
          }, adjustedFlashDuration / 2);
        };

        showTimerRef.current = setTimeout(showNext, 500);
      } else {
        let i = 0;
        const showNext = () => {
          if (i >= seq.length) {
            setFlashingCell(null);
            setFlashIndex(-1);

            // Decay mode: after showing, hide some cells randomly
            if (currentMode === "decay") {
              const decayCount = Math.max(1, Math.floor(seq.length * 0.4));
              const indices = Array.from(
                { length: seq.length },
                (_, idx) => idx,
              );
              const shuffled = indices.sort(() => Math.random() - 0.5);
              const hidden = shuffled
                .slice(0, decayCount)
                .map((idx) => seq[idx]);
              setDecayHidden(hidden);
              // Brief pause showing partial pattern, then input
              showTimerRef.current = setTimeout(() => {
                setPhase("input");
              }, 800);
              return;
            }

            // Blind mode: briefly show grid, then hide it
            if (currentMode === "blind") {
              showTimerRef.current = setTimeout(() => {
                setBlindGrid(true);
                setPhase("input");
              }, 300);
              return;
            }

            setPhase("input");
            return;
          }

          setFlashingCell(seq[i]);
          setFlashingColor(CELL_COLORS[colors[i]] || CELL_COLORS[0]);
          setFlashIndex(i);

          showTimerRef.current = setTimeout(() => {
            setFlashingCell(null);
            setFlashIndex(-1);
            i++;
            showTimerRef.current = setTimeout(showNext, FLASH_GAP);
          }, adjustedFlashDuration);
        };

        showTimerRef.current = setTimeout(showNext, 500);
      }
    },
    [speedFlashDuration],
  );

  const startRound = useCallback(
    (roundNum: number) => {
      const newMode = getMode(roundNum);
      const prevMode = getMode(roundNum - 1);
      const seqLength = roundNum + 2;

      // Speed mode: decrease flash duration each round (min 100ms)
      if (newMode === "speed") {
        setSpeedFlashDuration((prev) => Math.max(100, prev - 50));
      } else {
        setSpeedFlashDuration(FLASH_DURATION);
      }

      // Chain mode: add one cell to previous chain
      if (newMode === "chain") {
        const newCell = Math.floor(Math.random() * totalCells);
        const newChain = [...chainSequence, newCell];
        setChainSequence(newChain);
        const colors = newChain.map(() => 0);
        setSequence(newChain);
        setColorSequence(colors);
        setInputSequence([]);
        setRound(roundNum);
        setMode(newMode);
        setFeedbackType(null);
        setWrongCell(null);
        setBlindGrid(false);
        setDecayHidden([]);

        if (newMode !== prevMode && roundNum > 1) {
          const announcement = getModeAnnouncement(newMode);
          setModeAnnouncement(announcement);
          SoundEffects.levelUp();
          Haptic.achievement();
          announcementTimerRef.current = setTimeout(() => {
            setModeAnnouncement(null);
            playSequence(newChain, colors, newMode);
          }, 2000);
        } else {
          playSequence(newChain, colors, newMode);
        }
        return;
      }

      // Reset chain when leaving chain mode
      if (prevMode === "chain") {
        setChainSequence([]);
      }

      const { seq, colors } = generateSequence(seqLength, newMode);
      setSequence(seq);
      setColorSequence(colors);
      setInputSequence([]);
      setRound(roundNum);
      setMode(newMode);
      setFeedbackType(null);
      setWrongCell(null);
      setBlindGrid(false);
      setDecayHidden([]);

      if (newMode !== prevMode && roundNum > 1) {
        const announcement = getModeAnnouncement(newMode);
        setModeAnnouncement(announcement);
        SoundEffects.levelUp();
        Haptic.achievement();
        announcementTimerRef.current = setTimeout(() => {
          setModeAnnouncement(null);
          playSequence(seq, colors, newMode);
        }, 2000);
      } else {
        playSequence(seq, colors, newMode);
      }
    },
    [generateSequence, playSequence, totalCells, chainSequence],
  );

  const startGame = useCallback(() => {
    setScore(0);
    setDisplayScore(0);
    setLives(3);
    setPrevLives(3);
    setMaxSequence(0);
    setConsecutiveCorrect(0);
    setWrongCell(null);
    setChainSequence([]);
    setMathNumbers([]);
    setMathTarget(0);
    setRotationTimes(1);
    setDecayHidden([]);
    setBlindGrid(false);
    setSpeedFlashDuration(FLASH_DURATION);
    startRound(1);
  }, [startRound]);

  const currentMultiplier = useMemo(() => {
    const streak = Math.floor(consecutiveCorrect / 3);
    return 1 + streak * 0.5;
  }, [consecutiveCorrect]);

  const handleCellTap = useCallback(
    (cellIndex: number) => {
      if (phase !== "input") return;

      SoundEffects.click();
      Haptic.button();

      const expected = getExpectedInput();
      const newInput = [...inputSequence, cellIndex];
      setInputSequence(newInput);

      const currentIndex = newInput.length - 1;

      // Math mode: unordered comparison (set-based)
      const isMathMode = mode === "math";
      let isWrongTap = false;

      if (isMathMode) {
        // In math mode, check if tapped cell is in the expected set and not already tapped
        const alreadyTapped = inputSequence.includes(cellIndex);
        const inExpected = expected.includes(cellIndex);
        isWrongTap = !inExpected || alreadyTapped;
      } else {
        isWrongTap = newInput[currentIndex] !== expected[currentIndex];
      }

      if (isWrongTap) {
        SoundEffects.wrong();
        Haptic.wrong();
        setFeedbackType("wrong");
        setWrongCell(cellIndex);
        setPhase("feedback");
        setConsecutiveCorrect(0);

        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          SoundEffects.gameOver();
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
            setWrongCell(null);
            playSequence(sequence, colorSequence, mode);
          }, 800);
        }
        return;
      }

      if (newInput.length === expected.length) {
        const seqLen =
          mode === "double" ? sequence.length / 2 : sequence.length;
        const roundScore = Math.round(
          round * seqLen * MODE_MULTIPLIERS[mode] * currentMultiplier,
        );
        const newScore = score + roundScore;
        setScore(newScore);
        setMaxSequence(Math.max(maxSequence, seqLen));
        setConsecutiveCorrect((prev) => prev + 1);
        SoundEffects.correct();
        Haptic.correct();
        setFeedbackType("correct");
        setPhase("feedback");

        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackType(null);
          setWrongCell(null);
          setBlindGrid(false);
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
      currentMultiplier,
    ],
  );

  const expectedInput = useMemo(() => {
    if (phase === "input") return getExpectedInput();
    return [];
  }, [phase, getExpectedInput]);

  const cellSize = Math.max(48, Math.min(72, Math.floor(280 / gridSize)));
  const modeColor = MODE_COLORS[mode];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: particleKeyframes }} />
      <div
        className="relative flex flex-col items-center min-h-screen text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #0a0614 0%, #0F0A1A 30%, #120d24 60%, #0d0820 100%)",
        }}
      >
        {/* Particle background */}
        <ParticleField />

        {/* Ambient glow */}
        <div
          className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle, ${modeColor}08, transparent 70%)`,
            transition: "background 1s ease",
          }}
        />

        {/* Content container */}
        <div className="relative z-10 flex flex-col items-center w-full p-4 max-w-lg mx-auto">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-5">
            <motion.button
              onClick={onBack}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              className="text-white/50 hover:text-white/90 transition-colors text-sm font-medium backdrop-blur-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              <span className="mr-1 inline-block" style={{ fontSize: "11px" }}>
                &#9664;
              </span>{" "}
              뒤로
            </motion.button>
            <div className="text-center">
              <div className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                패턴 기억
              </div>
              {phase !== "ready" && phase !== "gameover" && (
                <motion.div
                  key={round}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-white/40 tracking-wider"
                >
                  ROUND {round}
                </motion.div>
              )}
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/10 transition-all backdrop-blur-sm bg-white/5 border border-white/10"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>

          {/* Lives & Score bar */}
          <AnimatePresence>
            {phase !== "ready" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex items-center justify-between mb-4 px-1"
              >
                {/* Lives */}
                <div className="flex gap-1.5 items-center">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const isLost = i >= lives;
                    const justLost = i >= lives && i < prevLives;
                    return (
                      <motion.div
                        key={i}
                        className="relative"
                        style={{
                          animation: !isLost
                            ? "pmg-heartbeat 1.5s ease-in-out infinite"
                            : justLost
                              ? "pmg-heart-break 0.5s ease-out forwards"
                              : undefined,
                          animationDelay: !isLost ? `${i * 0.2}s` : undefined,
                        }}
                      >
                        <span
                          className="text-xl block"
                          style={{
                            filter: isLost
                              ? "grayscale(1) opacity(0.2)"
                              : `drop-shadow(0 0 6px rgba(255,80,80,0.5))`,
                            transition: "filter 0.3s ease",
                          }}
                        >
                          {isLost ? "\u{1F5A4}" : "\u{2764}\u{FE0F}"}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Score */}
                <div className="text-right">
                  <motion.div
                    className="text-2xl font-black tabular-nums"
                    style={{
                      background:
                        "linear-gradient(135deg, #E8D5FF 0%, #FFD5E5 50%, #D5F5FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: scoreAnimating
                        ? "pmg-score-pop 0.3s ease"
                        : undefined,
                    }}
                  >
                    {displayScore.toLocaleString()}
                  </motion.div>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    {phase !== "gameover" && (
                      <span className="text-[10px] text-white/30 font-medium tracking-wider">
                        SEQ{" "}
                        {mode === "double"
                          ? sequence.length / 2
                          : sequence.length}
                      </span>
                    )}
                    {currentMultiplier > 1 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${modeColor}40, ${modeColor}20)`,
                          color: modeColor,
                          border: `1px solid ${modeColor}30`,
                        }}
                      >
                        x{currentMultiplier.toFixed(1)}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode badge */}
          <AnimatePresence mode="wait">
            {phase !== "ready" && phase !== "gameover" && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.8, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="mb-3"
              >
                <div
                  className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${modeColor}30, ${modeColor}10)`,
                    border: `1px solid ${modeColor}50`,
                    color: modeColor,
                    boxShadow: `0 0 20px ${modeColor}15, inset 0 1px 0 ${modeColor}20`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: modeColor,
                      boxShadow: `0 0 6px ${modeColor}`,
                    }}
                  />
                  {MODE_LABELS[mode]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase indicator */}
          <AnimatePresence mode="wait">
            {phase === "showing" && (
              <motion.div
                key="showing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3 text-sm text-white/50 font-medium tracking-wide"
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  시퀀스를 기억하세요...
                </motion.span>
                {flashIndex >= 0 && (
                  <span className="ml-2 text-[10px] text-white/30 tabular-nums">
                    {flashIndex + 1}/
                    {mode === "double" ? sequence.length : sequence.length}
                  </span>
                )}
              </motion.div>
            )}
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3 flex flex-col items-center gap-1"
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: "#00B894" }}
                >
                  {mode === "reverse"
                    ? "역순으로 입력하세요!"
                    : mode === "color"
                      ? "보라색 셀만 순서대로!"
                      : mode === "mirror"
                        ? "거울처럼 반대쪽을 터치!"
                        : mode === "spiral"
                          ? "나선 순서대로 입력!"
                          : mode === "speed"
                            ? "빠르게! 순서대로 입력!"
                            : mode === "decay"
                              ? "사라진 셀 포함 전체 순서!"
                              : mode === "chain"
                                ? "전체 연쇄 순서를 입력!"
                                : mode === "blind"
                                  ? "기억만으로 입력하세요!"
                                  : mode === "math"
                                    ? `합이 ${mathTarget}이 되는 셀을 선택!`
                                    : mode === "rotation"
                                      ? `${rotationTimes === 1 ? "90" : "180"}도 회전 후 위치를 입력!`
                                      : "순서대로 입력하세요!"}
                </div>
                <div className="text-xs text-white/40 font-medium tabular-nums">
                  Step {inputSequence.length}/{expectedInput.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Math target display */}
          {mode === "math" && phase === "input" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-2 px-4 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #FAB1A030, #FAB1A010)",
                border: "1px solid #FAB1A050",
                color: "#FAB1A0",
              }}
            >
              Target: {mathTarget}
              {inputSequence.length > 0 && (
                <span className="ml-2 text-white/50">
                  (Current:{" "}
                  {inputSequence.reduce(
                    (sum, idx) => sum + (mathNumbers[idx] || 0),
                    0,
                  )}
                  )
                </span>
              )}
            </motion.div>
          )}

          {/* Rotation indicator */}
          {mode === "rotation" && phase === "input" && (
            <motion.div
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: rotationTimes * 90 }}
              transition={{ duration: 0.5 }}
              className="mb-2 text-2xl"
              style={{ color: "#81ECEC" }}
            >
              {rotationTimes === 1 ? "90" : "180"}
            </motion.div>
          )}

          {/* Grid */}
          <div className="relative mt-2">
            {/* Pulsing border around grid during input */}
            {phase === "input" && (
              <div
                className="absolute -inset-3 rounded-3xl pointer-events-none"
                style={{
                  border: "2px solid rgba(108,92,231,0.3)",
                  animation: "pmg-pulse-border 2s ease-in-out infinite",
                }}
              />
            )}

            <motion.div
              className="grid gap-2 sm:gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              }}
              animate={
                feedbackType === "wrong"
                  ? { x: [0, -10, 10, -10, 10, -5, 5, 0] }
                  : { x: 0 }
              }
              transition={
                feedbackType === "wrong"
                  ? { duration: 0.5, ease: "easeInOut" }
                  : { duration: 0.1 }
              }
            >
              {Array.from({ length: totalCells }).map((_, i) => {
                const isFlashing = flashingCell === i;
                const tapIndex = inputSequence.indexOf(i);
                const isTapped = tapIndex !== -1;
                const isWrong = wrongCell === i && feedbackType === "wrong";
                const isDecayed =
                  mode === "decay" &&
                  phase === "input" &&
                  decayHidden.includes(i);
                const isBlinded =
                  mode === "blind" && blindGrid && phase === "input";

                // Green wave animation delay based on position
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;
                const waveDelay = (row + col) * 0.05;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleCellTap(i)}
                    disabled={phase !== "input"}
                    className="relative flex items-center justify-center font-bold text-lg overflow-hidden"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: "16px",
                      cursor: phase === "input" ? "pointer" : "default",
                      // Blind mode: all cells look identical during input
                      opacity:
                        isBlinded && !isTapped && !isWrong
                          ? 0.15
                          : isDecayed && !isTapped
                            ? 0.3
                            : 1,
                      // Glassmorphism base
                      background: isFlashing
                        ? `radial-gradient(circle at center, ${flashingColor}DD, ${flashingColor}88)`
                        : feedbackType === "correct" && isTapped
                          ? `radial-gradient(circle at center, #00B894CC, #00B89466)`
                          : isWrong
                            ? `radial-gradient(circle at center, #E17055DD, #E1705588)`
                            : isDecayed && !isTapped
                              ? "rgba(100,100,100,0.1)"
                              : "rgba(255,255,255,0.04)",
                      border: isFlashing
                        ? `1px solid ${flashingColor}80`
                        : feedbackType === "correct" && isTapped
                          ? "1px solid rgba(0,184,148,0.4)"
                          : isWrong
                            ? "1px solid rgba(225,112,85,0.6)"
                            : "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: !isFlashing ? "blur(10px)" : undefined,
                      WebkitBackdropFilter: !isFlashing
                        ? "blur(10px)"
                        : undefined,
                      boxShadow: isFlashing
                        ? `0 0 30px ${flashingColor}60, 0 0 60px ${flashingColor}20, inset 0 1px 0 rgba(255,255,255,0.2)`
                        : feedbackType === "correct" && isTapped
                          ? `0 0 20px rgba(0,184,148,0.3)`
                          : isWrong
                            ? `0 0 25px rgba(225,112,85,0.5)`
                            : "inset 0 1px 0 rgba(255,255,255,0.05)",
                      transition:
                        "background 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
                      animation:
                        feedbackType === "correct" && isTapped
                          ? `pmg-green-wave 0.6s ${waveDelay}s ease-out`
                          : undefined,
                    }}
                    animate={isFlashing ? { scale: 1.08 } : { scale: 1 }}
                    transition={{
                      duration: 0.15,
                      type: "spring",
                      stiffness: 400,
                    }}
                    whileTap={phase === "input" ? { scale: 0.9 } : undefined}
                    whileHover={
                      phase === "input"
                        ? {
                            background: "rgba(255,255,255,0.08)",
                            borderColor: "rgba(255,255,255,0.15)",
                          }
                        : undefined
                    }
                  >
                    {/* Inner glass highlight */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        borderRadius: "16px",
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
                      }}
                    />

                    {/* Ripple effect on flash */}
                    <AnimatePresence>
                      {isFlashing && <CellRipple color={flashingColor} />}
                    </AnimatePresence>

                    {/* Math mode: show numbers on cells */}
                    {mode === "math" &&
                      phase === "input" &&
                      !isTapped &&
                      mathNumbers[i] !== undefined && (
                        <span
                          className="relative z-10 text-white/70 text-sm font-bold"
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                        >
                          {mathNumbers[i]}
                        </span>
                      )}

                    {/* Tap number indicator */}
                    {phase === "input" && isTapped && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 text-white/90 text-sm font-bold"
                        style={{
                          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      >
                        {mode === "math" ? mathNumbers[i] : tapIndex + 1}
                      </motion.span>
                    )}

                    {/* Wrong indicator X */}
                    {isWrong && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="relative z-10 text-white text-xl font-black"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                      >
                        X
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
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 20px ${modeColor}40`,
                        `0 0 60px ${modeColor}60`,
                        `0 0 20px ${modeColor}40`,
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl sm:text-3xl font-black px-6 py-3 rounded-2xl backdrop-blur-xl"
                    style={{
                      background: "rgba(10, 6, 20, 0.85)",
                      border: `2px solid ${modeColor}80`,
                      color: modeColor,
                      textShadow: `0 0 30px ${modeColor}`,
                    }}
                  >
                    {modeAnnouncement}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Correct feedback overlay */}
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
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(0,184,148,0.3), transparent 70%)",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#00B894"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 12l5 5L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wrong feedback: red flash overlay */}
            <AnimatePresence>
              {feedbackType === "wrong" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(225,112,85,0.4), transparent 70%)",
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Ready screen */}
          {phase === "ready" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 flex flex-col items-center gap-5"
            >
              <div className="text-center">
                <div
                  className="text-white/50 text-sm mb-2 font-medium"
                  style={{
                    background: "linear-gradient(135deg, #ffffff80, #ffffff40)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {gridSize} x {gridSize} 그리드
                </div>
                <div className="text-white/30 text-xs max-w-xs leading-relaxed">
                  깜빡이는 셀의 순서를 기억하고 따라 누르세요.
                  <br />
                  라운드가 올라갈수록 모드가 변합니다!
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={startGame}
                className="relative px-10 py-4 text-white rounded-2xl font-bold text-lg overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #6C5CE7, #E84393)",
                  boxShadow:
                    "0 4px 20px rgba(108,92,231,0.4), 0 0 40px rgba(108,92,231,0.1)",
                }}
              >
                <span className="relative z-10">시작하기</span>
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, transparent, rgba(255,255,255,0.1))",
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.button>
            </motion.div>
          )}

          {/* Game over screen */}
          <AnimatePresence>
            {phase === "gameover" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 flex items-center justify-center p-4"
                style={{
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  background: "rgba(10, 6, 20, 0.7)",
                }}
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="w-full max-w-sm rounded-3xl p-6 sm:p-8 text-center"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(30,20,50,0.95), rgba(15,10,30,0.95))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-black mb-1"
                    style={{
                      background: "linear-gradient(135deg, #E84393, #FD79A8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    게임 오버
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 mb-6"
                  >
                    <div className="text-white/40 text-xs mb-1 tracking-wider uppercase">
                      최종 점수
                    </div>
                    <div
                      className="text-4xl font-black tabular-nums"
                      style={{
                        background:
                          "linear-gradient(135deg, #E8D5FF 0%, #FFD5E5 50%, #D5F5FF 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {score.toLocaleString()}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-3 mb-6"
                  >
                    {[
                      { label: "라운드", value: round },
                      { label: "최대 시퀀스", value: maxSequence },
                      {
                        label: "최종 모드",
                        value: MODE_LABELS[mode],
                      },
                    ].map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + idx * 0.1 }}
                        className="rounded-xl p-3"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="text-[10px] text-white/30 mb-0.5 tracking-wider uppercase">
                          {stat.label}
                        </div>
                        <div className="text-lg font-bold text-white/90">
                          {stat.value}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={onBack}
                      className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm text-white/70 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      나가기
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={startGame}
                      className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white overflow-hidden relative"
                      style={{
                        background: "linear-gradient(135deg, #6C5CE7, #E84393)",
                        boxShadow: "0 4px 15px rgba(108,92,231,0.3)",
                      }}
                    >
                      다시 하기
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tutorial Modal */}
          <AnimatePresence>
            {showTutorial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
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
                    패턴 기억 플레이 방법
                  </h2>

                  <div className="space-y-4 text-sm text-white/80">
                    <div>
                      <p className="mb-2 font-semibold text-indigo-300">목표</p>
                      <p>화면에 표시되는 패턴을 기억하고 똑같이 재현하세요</p>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-indigo-300">
                        플레이 방법
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>격자에 패턴이 잠깐 표시됩니다</li>
                        <li>패턴을 기억하세요!</li>
                        <li>패턴이 사라지면 기억한 위치를 탭하세요</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-indigo-300">
                        모드 변화
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <span className="font-bold text-white">기본:</span>{" "}
                          패턴을 그대로 재현
                        </li>
                        <li>
                          <span className="font-bold text-white">역순:</span>{" "}
                          반대 순서로 입력
                        </li>
                        <li>
                          <span className="font-bold text-white">색상:</span>{" "}
                          색깔까지 기억해야 합니다
                        </li>
                        <li>
                          <span className="font-bold text-white">속도:</span>{" "}
                          점점 빨라지는 패턴!
                        </li>
                        <li>
                          <span className="font-bold text-white">연쇄:</span>{" "}
                          시퀀스가 계속 길어짐
                        </li>
                        <li>
                          <span className="font-bold text-white">거울:</span>{" "}
                          좌우 반전된 위치를 입력
                        </li>
                        <li>
                          <span className="font-bold text-white">나선:</span>{" "}
                          나선형 패턴을 기억
                        </li>
                        <li>
                          <span className="font-bold text-white">소멸:</span>{" "}
                          일부 셀이 사라진 후 전체 기억
                        </li>
                        <li>
                          <span className="font-bold text-white">
                            블라인드:
                          </span>{" "}
                          그리드가 숨겨진 채로 입력
                        </li>
                        <li>
                          <span className="font-bold text-white">수학:</span>{" "}
                          목표 합이 되는 숫자 셀 선택
                        </li>
                        <li>
                          <span className="font-bold text-white">회전:</span>{" "}
                          회전된 위치를 추론하여 입력
                        </li>
                        <li>
                          <span className="font-bold text-white">더블:</span> 두
                          개의 패턴을 동시에 기억
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 font-semibold text-indigo-300">팁</p>
                      <ul className="list-disc pl-4 space-y-1 text-white/60">
                        <li>레벨이 올라갈수록 패턴이 복잡해집니다</li>
                        <li>목숨이 3개! 틀리면 하나씩 줄어요</li>
                        <li>패턴의 모양을 이미지로 기억하면 도움돼요</li>
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
        </div>
      </div>
    </>
  );
}
