"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";
import confetti from "canvas-confetti";

interface NumberLogicGameProps {
  difficulty: "easy" | "medium" | "hard" | "extreme";
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

interface Cage {
  cells: [number, number][];
  operation: "+" | "-" | "\u00d7" | "\u00f7" | "";
  target: number;
  color: string;
}

interface UndoEntry {
  r: number;
  c: number;
  prevValue: number;
  prevMemos: Set<number>;
  wasMemoMode: boolean;
}

const GRID_SIZES: Record<string, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
  extreme: 7,
};
const REVEAL_RATES: Record<string, number> = {
  easy: 0.4,
  medium: 0.25,
  hard: 0.15,
  extreme: 0.1,
};

const CAGE_COLORS_DARK = [
  "rgba(239,68,68,0.08)",
  "rgba(59,130,246,0.08)",
  "rgba(34,197,94,0.08)",
  "rgba(251,191,36,0.08)",
  "rgba(168,85,247,0.08)",
  "rgba(20,184,166,0.08)",
  "rgba(244,114,182,0.08)",
  "rgba(132,204,22,0.08)",
  "rgba(99,102,241,0.08)",
];

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
  extreme: "극한",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "from-emerald-500 to-emerald-600",
  medium: "from-blue-500 to-blue-600",
  hard: "from-orange-500 to-orange-600",
  extreme: "from-red-500 to-red-600",
};

// --- Puzzle Generation ---

function generateLatinSquare(n: number): number[][] {
  const grid: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(((i + j) % n) + 1);
    }
    grid.push(row);
  }
  // Shuffle rows
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  // Shuffle columns
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    for (let r = 0; r < n; r++) {
      [grid[r][i], grid[r][j]] = [grid[r][j], grid[r][i]];
    }
  }
  return grid;
}

function getAdjacentCells(r: number, c: number, n: number): [number, number][] {
  const adj: [number, number][] = [];
  if (r > 0) adj.push([r - 1, c]);
  if (r < n - 1) adj.push([r + 1, c]);
  if (c > 0) adj.push([r, c - 1]);
  if (c < n - 1) adj.push([r, c + 1]);
  return adj;
}

function generateCages(solution: number[][]): Cage[] {
  const n = solution.length;
  const visited = Array.from({ length: n }, () => Array(n).fill(false));
  const cages: Cage[] = [];
  let colorIdx = 0;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (visited[r][c]) continue;

      const cageCells: [number, number][] = [[r, c]];
      visited[r][c] = true;

      const maxSize = Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 3 : 4;

      while (cageCells.length < maxSize) {
        const candidates: [number, number][] = [];
        for (const [cr, cc] of cageCells) {
          for (const [ar, ac] of getAdjacentCells(cr, cc, n)) {
            if (
              !visited[ar][ac] &&
              !candidates.some(([x, y]) => x === ar && y === ac)
            ) {
              candidates.push([ar, ac]);
            }
          }
        }
        if (candidates.length === 0) break;
        const [nr, nc] =
          candidates[Math.floor(Math.random() * candidates.length)];
        cageCells.push([nr, nc]);
        visited[nr][nc] = true;
      }

      const values = cageCells.map(([cr, cc]) => solution[cr][cc]);
      let operation: Cage["operation"] = "";
      let target = 0;

      if (cageCells.length === 1) {
        operation = "";
        target = values[0];
      } else if (cageCells.length === 2) {
        const ops: Cage["operation"][] = ["+", "-", "\u00d7", "\u00f7"];
        const [a, b] = [Math.max(...values), Math.min(...values)];
        const opChoice = ops[Math.floor(Math.random() * ops.length)];
        if (opChoice === "+") {
          operation = "+";
          target = a + b;
        } else if (opChoice === "-") {
          operation = "-";
          target = a - b;
        } else if (opChoice === "\u00d7") {
          operation = "\u00d7";
          target = a * b;
        } else {
          if (a % b === 0) {
            operation = "\u00f7";
            target = a / b;
          } else {
            operation = "-";
            target = a - b;
          }
        }
      } else {
        // 3+ cells: use + or x
        if (Math.random() < 0.5) {
          operation = "+";
          target = values.reduce((s, v) => s + v, 0);
        } else {
          operation = "\u00d7";
          target = values.reduce((p, v) => p * v, 1);
        }
      }

      cages.push({
        cells: cageCells,
        operation,
        target,
        color: CAGE_COLORS_DARK[colorIdx % CAGE_COLORS_DARK.length],
      });
      colorIdx++;
    }
  }

  return cages;
}

function solvePuzzle(
  n: number,
  cages: Cage[],
  grid: number[][],
  cageMap: number[][],
  countOnly: { count: number },
  maxCount: number,
): boolean {
  // Find first empty cell
  let emptyR = -1,
    emptyC = -1;
  outer: for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 0) {
        emptyR = r;
        emptyC = c;
        break outer;
      }
    }
  }

  if (emptyR === -1) {
    // All filled -- check all cage constraints
    for (const cage of cages) {
      if (!checkCageComplete(cage, grid)) return false;
    }
    countOnly.count++;
    return countOnly.count >= maxCount;
  }

  for (let num = 1; num <= n; num++) {
    // Check row/col constraints
    let valid = true;
    for (let i = 0; i < n; i++) {
      if (grid[emptyR][i] === num || grid[i][emptyC] === num) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;

    grid[emptyR][emptyC] = num;

    // Check partial cage constraint
    const cageIdx = cageMap[emptyR][emptyC];
    const cage = cages[cageIdx];
    if (isCagePartiallyValid(cage, grid)) {
      if (solvePuzzle(n, cages, grid, cageMap, countOnly, maxCount)) {
        grid[emptyR][emptyC] = 0;
        return true;
      }
    }

    grid[emptyR][emptyC] = 0;
    if (countOnly.count >= maxCount) return true;
  }

  return false;
}

function checkCageComplete(cage: Cage, grid: number[][]): boolean {
  const values = cage.cells.map(([r, c]) => grid[r][c]);
  if (values.some((v) => v === 0)) return false;

  if (cage.operation === "") return values[0] === cage.target;

  if (cage.operation === "+")
    return values.reduce((s, v) => s + v, 0) === cage.target;
  if (cage.operation === "\u00d7")
    return values.reduce((p, v) => p * v, 1) === cage.target;

  if (cage.operation === "-") {
    const max = Math.max(...values);
    const min = Math.min(...values);
    return max - min === cage.target;
  }
  if (cage.operation === "\u00f7") {
    const max = Math.max(...values);
    const min = Math.min(...values);
    return min !== 0 && max / min === cage.target;
  }
  return false;
}

function isCagePartiallyValid(cage: Cage, grid: number[][]): boolean {
  const values = cage.cells.map(([r, c]) => grid[r][c]);
  const filled = values.filter((v) => v !== 0);
  if (filled.length === 0) return true;
  if (filled.length < values.length) {
    // Partial check
    if (cage.operation === "+") {
      return filled.reduce((s, v) => s + v, 0) <= cage.target;
    }
    if (cage.operation === "\u00d7") {
      return filled.reduce((p, v) => p * v, 1) <= cage.target;
    }
    return true; // Can't partially validate - and /
  }
  return checkCageComplete(cage, grid);
}

function buildCageMap(n: number, cages: Cage[]): number[][] {
  const map = Array.from({ length: n }, () => Array(n).fill(-1));
  cages.forEach((cage, idx) => {
    for (const [r, c] of cage.cells) {
      map[r][c] = idx;
    }
  });
  return map;
}

function verifyUniqueSolution(
  n: number,
  cages: Cage[],
  revealed: number[][],
): boolean {
  const grid = revealed.map((r) => [...r]);
  const cageMap = buildCageMap(n, cages);
  const counter = { count: 0 };
  solvePuzzle(n, cages, grid, cageMap, counter, 2);
  return counter.count === 1;
}

function generatePuzzle(difficulty: "easy" | "medium" | "hard" | "extreme"): {
  solution: number[][];
  cages: Cage[];
  revealed: number[][];
} {
  const n = GRID_SIZES[difficulty];
  const revealRate = REVEAL_RATES[difficulty];

  for (let attempt = 0; attempt < 50; attempt++) {
    const solution = generateLatinSquare(n);
    const cages = generateCages(solution);
    const totalCells = n * n;
    const revealCount = Math.round(totalCells * revealRate);

    // Create revealed grid
    const revealed = Array.from({ length: n }, () => Array(n).fill(0));
    const allCells: [number, number][] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        allCells.push([r, c]);
      }
    }

    // Shuffle and pick cells to reveal
    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    for (let i = 0; i < revealCount; i++) {
      const [r, c] = allCells[i];
      revealed[r][c] = solution[r][c];
    }

    if (verifyUniqueSolution(n, cages, revealed)) {
      return { solution, cages, revealed };
    }
  }

  // Fallback: reveal more cells to guarantee uniqueness
  const solution = generateLatinSquare(n);
  const cages = generateCages(solution);
  const revealed = Array.from({ length: n }, () => Array(n).fill(0));
  const revealCount = Math.round(n * n * 0.5);
  const allCells: [number, number][] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      allCells.push([r, c]);
    }
  }
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }
  for (let i = 0; i < revealCount; i++) {
    const [r, c] = allCells[i];
    revealed[r][c] = solution[r][c];
  }
  return { solution, cages, revealed };
}

// --- Ripple Component ---
function RippleButton({
  children,
  onClick,
  className,
  style,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [ripples, setRipples] = useState<
    { x: number; y: number; id: number }[]
  >([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    onClick?.(e);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      className={`relative overflow-hidden ${className || ""}`}
      style={style}
      disabled={disabled}
      {...(props as Record<string, unknown>)}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            animation: "ripple-expand 0.6s ease-out forwards",
          }}
        />
      ))}
      {children}
    </motion.button>
  );
}

// --- Component ---

export default function NumberLogicGame({
  difficulty,
  onComplete,
  onBack,
}: NumberLogicGameProps) {
  const n = GRID_SIZES[difficulty];
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [puzzle, setPuzzle] = useState<{
    solution: number[][];
    cages: Cage[];
    revealed: number[][];
  } | null>(null);

  const [userGrid, setUserGrid] = useState<number[][]>([]);
  const [memos, setMemos] = useState<Set<number>[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [memoMode, setMemoMode] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());
  const [showTutorial, setShowTutorial] = useState(false);
  const [hintedCell, setHintedCell] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [conflictFlash, setConflictFlash] = useState<Set<string>>(new Set());

  const completedRef = useRef(false);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_numberlogic_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

  // Generate puzzle on mount
  useEffect(() => {
    const p = generatePuzzle(difficulty);
    setPuzzle(p);
    setUserGrid(p.revealed.map((r) => [...r]));
    setMemos(
      Array.from({ length: n }, () =>
        Array.from({ length: n }, () => new Set<number>()),
      ),
    );
  }, [difficulty, n]);

  // Timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, completed]);

  // Progress tracking
  const filledCount = useMemo(() => {
    if (!userGrid.length) return 0;
    let count = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (userGrid[r]?.[c] > 0) count++;
      }
    }
    return count;
  }, [userGrid, n]);

  const totalCells = n * n;
  const progressPercent = totalCells > 0 ? (filledCount / totalCells) * 100 : 0;

  // Validate row/col duplicates
  const validate = useCallback(
    (grid: number[][]) => {
      const errs = new Set<string>();
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 0) continue;
          // Check row
          for (let c2 = 0; c2 < n; c2++) {
            if (c2 !== c && grid[r][c2] === grid[r][c]) {
              errs.add(`${r},${c}`);
              errs.add(`${r},${c2}`);
            }
          }
          // Check col
          for (let r2 = 0; r2 < n; r2++) {
            if (r2 !== r && grid[r2][c] === grid[r][c]) {
              errs.add(`${r},${c}`);
              errs.add(`${r2},${c}`);
            }
          }
        }
      }
      setErrors(errs);
      return errs.size === 0;
    },
    [n],
  );

  // Flash conflicting cells when error is made
  const flashConflicts = useCallback(
    (r: number, c: number, num: number, grid: number[][]) => {
      const flashing = new Set<string>();
      for (let c2 = 0; c2 < n; c2++) {
        if (c2 !== c && grid[r][c2] === num) {
          flashing.add(`${r},${c2}`);
        }
      }
      for (let r2 = 0; r2 < n; r2++) {
        if (r2 !== r && grid[r2][c] === num) {
          flashing.add(`${r2},${c}`);
        }
      }
      if (flashing.size > 0) {
        flashing.add(`${r},${c}`);
        setConflictFlash(flashing);
        setTimeout(() => setConflictFlash(new Set()), 800);
      }
    },
    [n],
  );

  // Check completion
  const checkCompletion = useCallback(
    (grid: number[][]) => {
      if (!puzzle || completedRef.current) return;

      // All cells must be filled
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r][c] === 0) return;
        }
      }

      // No row/col errors
      if (!validate(grid)) return;

      // All cage constraints met
      for (const cage of puzzle.cages) {
        if (!checkCageComplete(cage, grid)) return;
      }

      // Completed!
      completedRef.current = true;
      setCompleted(true);
      SoundEffects.achievement();
      Haptic.achievement();

      // Confetti burst
      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#6C5CE7", "#00B894", "#FDCB6E", "#E17055", "#0984E3"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#6C5CE7", "#00B894", "#FDCB6E", "#E17055", "#0984E3"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Wave animation
      const allCells: string[] = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          allCells.push(`${r},${c}`);
        }
      }
      allCells.forEach((key, idx) => {
        setTimeout(() => {
          setCompletedCells((prev) => new Set(prev).add(key));
        }, idx * 80);
      });

      // Call onComplete after animation
      const totalDelay = allCells.length * 80 + 1500;
      setTimeout(() => {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const baseScore =
          difficulty === "easy" ? 200 : difficulty === "medium" ? 400 : 600;
        const timeBonus = Math.max(0, 300 - timeTaken * 2);
        const noErrors = errorCount === 0 ? 500 : 0;
        const noHints = hintsUsed === 0 ? 300 : 0;
        const score = baseScore + timeBonus + noErrors + noHints;

        onComplete(score, {
          difficulty,
          timeTaken,
          hintsUsed,
          errorCount,
          gridSize: n,
        });
      }, totalDelay);
    },
    [
      puzzle,
      n,
      validate,
      difficulty,
      startTime,
      errorCount,
      hintsUsed,
      onComplete,
    ],
  );

  const handleCellTap = (r: number, c: number) => {
    if (completed) return;
    if (puzzle && puzzle.revealed[r][c] !== 0) {
      // Allow selecting revealed cells to highlight same numbers
      setSelectedCell([r, c]);
      SoundEffects.click();
      Haptic.button();
      return;
    }
    SoundEffects.click();
    Haptic.button();
    if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
      setSelectedCell(null);
    } else {
      setSelectedCell([r, c]);
    }
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || !puzzle || completed) return;
    const [r, c] = selectedCell;
    if (puzzle.revealed[r][c] !== 0) return;

    if (memoMode) {
      // Save undo state for memos
      setUndoStack((prev) => [
        ...prev,
        {
          r,
          c,
          prevValue: userGrid[r][c],
          prevMemos: new Set(memos[r][c]),
          wasMemoMode: true,
        },
      ]);
      setMemos((prev) => {
        const next = prev.map((row) => row.map((s) => new Set(s)));
        if (next[r][c].has(num)) {
          next[r][c].delete(num);
        } else {
          next[r][c].add(num);
        }
        return next;
      });
    } else {
      // Save undo state
      setUndoStack((prev) => [
        ...prev,
        {
          r,
          c,
          prevValue: userGrid[r][c],
          prevMemos: new Set(memos[r][c]),
          wasMemoMode: false,
        },
      ]);
      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        if (next[r][c] === num) {
          next[r][c] = 0; // Clear if same number
        } else {
          next[r][c] = num;
          // Clear memos when placing number
          setMemos((mp) => {
            const nm = mp.map((row) => row.map((s) => new Set(s)));
            nm[r][c].clear();
            return nm;
          });
          // Track errors
          if (num !== puzzle.solution[r][c]) {
            setErrorCount((prev) => prev + 1);
            flashConflicts(r, c, num, next);
          }
        }
        // Defer validation/completion checks
        setTimeout(() => {
          validate(next);
          checkCompletion(next);
        }, 0);
        return next;
      });
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || completed) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (last.wasMemoMode) {
      setMemos((prev) => {
        const next = prev.map((row) => row.map((s) => new Set(s)));
        next[last.r][last.c] = new Set(last.prevMemos);
        return next;
      });
    } else {
      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[last.r][last.c] = last.prevValue;
        setTimeout(() => validate(next), 0);
        return next;
      });
      setMemos((prev) => {
        const next = prev.map((row) => row.map((s) => new Set(s)));
        next[last.r][last.c] = new Set(last.prevMemos);
        return next;
      });
    }
    SoundEffects.click();
    Haptic.button();
  };

  const handleHint = () => {
    if (!puzzle || !selectedCell || hintsUsed >= 3 || completed) return;
    const [r, c] = selectedCell;
    if (puzzle.revealed[r][c] !== 0) return;
    if (userGrid[r][c] === puzzle.solution[r][c]) return;

    SoundEffects.hint();
    Haptic.correct();

    // Show golden sparkle
    const cellKey = `${r},${c}`;
    setHintedCell(cellKey);
    setTimeout(() => setHintedCell(null), 1200);

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = puzzle.solution[r][c];
      setTimeout(() => {
        validate(next);
        checkCompletion(next);
      }, 0);
      return next;
    });
    setHintsUsed((prev) => prev + 1);
    setMemos((prev) => {
      const next = prev.map((row) => row.map((s) => new Set(s)));
      next[r][c].clear();
      return next;
    });
  };

  const handleErase = () => {
    if (!selectedCell || !puzzle || completed) return;
    const [r, c] = selectedCell;
    if (puzzle.revealed[r][c] !== 0) return;

    // Save undo
    setUndoStack((prev) => [
      ...prev,
      {
        r,
        c,
        prevValue: userGrid[r][c],
        prevMemos: new Set(memos[r][c]),
        wasMemoMode: false,
      },
    ]);

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = 0;
      setTimeout(() => validate(next), 0);
      return next;
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!puzzle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-white/20 border-t-blue-400"
        />
      </div>
    );
  }

  const cageMap = buildCageMap(n, puzzle.cages);
  const selectedValue = selectedCell
    ? userGrid[selectedCell[0]][selectedCell[1]]
    : 0;
  const cellSize = n <= 4 ? 68 : n <= 5 ? 58 : n <= 6 ? 50 : 44;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center px-4 py-6"
      style={{
        background:
          "linear-gradient(145deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)",
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 mb-3 flex w-full max-w-md items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </motion.button>

        {/* Timer */}
        <div
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-lg font-bold tracking-wider text-white backdrop-blur-sm"
          style={{
            textShadow: "0 0 12px rgba(59,130,246,0.5)",
          }}
        >
          {formatTime(elapsed)}
        </div>

        <div className="flex items-center gap-2">
          {/* Difficulty badge */}
          <span
            className={`rounded-lg bg-gradient-to-r ${DIFFICULTY_COLORS[difficulty]} px-2.5 py-1 text-xs font-bold text-white shadow-lg`}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
          <button
            onClick={() => setShowTutorial(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
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

      {/* Progress bar */}
      <div className="relative z-10 mb-2 w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="font-mono text-xs font-medium text-white/50">
            {filledCount}/{totalCells}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative z-10 mb-4 flex w-full max-w-md items-center justify-center gap-6 text-sm">
        <span className="flex items-center gap-1.5 text-white/50">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={errorCount > 0 ? "text-red-400" : ""}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className={errorCount > 0 ? "text-red-400 font-medium" : ""}>
            {errorCount}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-white/50">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-400/70"
          >
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
          </svg>
          {hintsUsed}/3
        </span>
      </div>

      {/* Grid */}
      <div
        className="relative z-10 mb-5 rounded-2xl border border-white/10 p-1"
        style={{
          width: cellSize * n + 10,
          height: cellSize * n + 10,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-xl"
          style={{ width: cellSize * n + 2, height: cellSize * n + 2 }}
        >
          {/* Cage backgrounds */}
          {puzzle.cages.map((cage, ci) =>
            cage.cells.map(([r, c], idx) => {
              const isCompleted = completedCells.has(`${r},${c}`);
              const isError = errors.has(`${r},${c}`);
              const isConflictFlash = conflictFlash.has(`${r},${c}`);
              const isSameNumber =
                selectedValue > 0 && userGrid[r][c] === selectedValue;
              const isSelectedRow = selectedCell?.[0] === r;
              const isSelectedCol = selectedCell?.[1] === c;
              const isHighlightedLine =
                (isSelectedRow || isSelectedCol) && !isCompleted;

              let bgColor = cage.color;
              if (isCompleted) bgColor = "rgba(34,197,94,0.15)";
              else if (isConflictFlash) bgColor = "rgba(239,68,68,0.25)";
              else if (isError) bgColor = "rgba(239,68,68,0.12)";
              else if (isSameNumber) bgColor = "rgba(99,102,241,0.15)";
              else if (isHighlightedLine) bgColor = "rgba(255,255,255,0.03)";

              return (
                <motion.div
                  key={`cage-bg-${ci}-${idx}`}
                  className="absolute"
                  style={{
                    top: r * cellSize + 1,
                    left: c * cellSize + 1,
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: bgColor,
                    transition: "background-color 0.25s ease",
                  }}
                  animate={
                    isConflictFlash
                      ? {
                          backgroundColor: [
                            "rgba(239,68,68,0.3)",
                            "rgba(239,68,68,0.08)",
                            "rgba(239,68,68,0.3)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    isConflictFlash
                      ? { duration: 0.4, repeat: 1, ease: "easeInOut" }
                      : {}
                  }
                />
              );
            }),
          )}

          {/* Cage borders */}
          {Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) => {
              const ci = cageMap[r][c];
              const borderStyle: React.CSSProperties = {
                position: "absolute",
                top: r * cellSize + 1,
                left: c * cellSize + 1,
                width: cellSize,
                height: cellSize,
                boxSizing: "border-box",
                borderTop:
                  r === 0 || cageMap[r - 1][c] !== ci
                    ? "2px solid rgba(148,163,184,0.4)"
                    : "1px solid rgba(148,163,184,0.1)",
                borderBottom:
                  r === n - 1 || cageMap[r + 1]?.[c] !== ci
                    ? "2px solid rgba(148,163,184,0.4)"
                    : "1px solid rgba(148,163,184,0.1)",
                borderLeft:
                  c === 0 || cageMap[r][c - 1] !== ci
                    ? "2px solid rgba(148,163,184,0.4)"
                    : "1px solid rgba(148,163,184,0.1)",
                borderRight:
                  c === n - 1 || cageMap[r][c + 1] !== ci
                    ? "2px solid rgba(148,163,184,0.4)"
                    : "1px solid rgba(148,163,184,0.1)",
                pointerEvents: "none",
              };
              return <div key={`border-${r}-${c}`} style={borderStyle} />;
            }),
          )}

          {/* Cage labels */}
          {puzzle.cages.map((cage, ci) => {
            const [r, c] = cage.cells[0];
            const label = cage.operation
              ? `${cage.target}${cage.operation}`
              : `${cage.target}`;
            return (
              <div
                key={`label-${ci}`}
                className="absolute z-10 font-bold leading-none"
                style={{
                  top: r * cellSize + 4,
                  left: c * cellSize + 4,
                  fontSize: cellSize <= 48 ? 8 : 10,
                  color: "rgba(167,139,250,0.7)",
                  textShadow: "0 0 4px rgba(167,139,250,0.2)",
                }}
              >
                {label}
              </div>
            );
          })}

          {/* Cells */}
          {Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) => {
              const value = userGrid[r][c];
              const isRevealed = puzzle.revealed[r][c] !== 0;
              const isSelected =
                selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isError = errors.has(`${r},${c}`);
              const isHinted = hintedCell === `${r},${c}`;
              const isWaved = completedCells.has(`${r},${c}`);
              const cellMemos = memos[r]?.[c] || new Set<number>();

              return (
                <motion.div
                  key={`cell-${r}-${c}`}
                  className="absolute flex cursor-pointer items-center justify-center"
                  style={{
                    top: r * cellSize + 1,
                    left: c * cellSize + 1,
                    width: cellSize,
                    height: cellSize,
                    zIndex: isSelected ? 20 : 10,
                  }}
                  onClick={() => handleCellTap(r, c)}
                  whileTap={isRevealed ? {} : { scale: 0.93 }}
                  animate={
                    isWaved
                      ? {
                          scale: [1, 1.15, 1],
                          transition: { duration: 0.4, ease: "easeOut" },
                        }
                      : {}
                  }
                >
                  {/* Selection glow ring */}
                  {isSelected && (
                    <motion.div
                      layoutId="cell-selection"
                      className="absolute inset-0.5 rounded-lg"
                      style={{
                        border: "2px solid rgba(99,102,241,0.8)",
                        boxShadow:
                          "0 0 12px rgba(99,102,241,0.4), inset 0 0 8px rgba(99,102,241,0.1)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Hint sparkle */}
                  <AnimatePresence>
                    {isHinted && (
                      <>
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={`sparkle-${i}`}
                            className="absolute"
                            initial={{
                              opacity: 1,
                              scale: 0,
                              x: 0,
                              y: 0,
                            }}
                            animate={{
                              opacity: 0,
                              scale: 1.5,
                              x: Math.cos((i * Math.PI * 2) / 6) * 20,
                              y: Math.sin((i * Math.PI * 2) / 6) * 20,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.05,
                              ease: "easeOut",
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8">
                              <path
                                d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2Z"
                                fill="#FBBF24"
                              />
                            </svg>
                          </motion.div>
                        ))}
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.4, 0] }}
                          transition={{ duration: 0.8 }}
                          style={{
                            background:
                              "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)",
                          }}
                        />
                      </>
                    )}
                  </AnimatePresence>

                  {/* Value */}
                  {value > 0 ? (
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={value}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="text-center font-bold"
                        style={{
                          fontSize: cellSize * 0.42,
                          color: isRevealed
                            ? "rgba(226,232,240,0.95)"
                            : isError
                              ? "#f87171"
                              : isHinted
                                ? "#fbbf24"
                                : "#818cf8",
                          textShadow: isRevealed
                            ? "none"
                            : isError
                              ? "0 0 8px rgba(248,113,113,0.4)"
                              : isHinted
                                ? "0 0 12px rgba(251,191,36,0.6)"
                                : "0 0 8px rgba(129,140,248,0.3)",
                          fontWeight: isRevealed ? 700 : 600,
                        }}
                      >
                        {value}
                      </motion.span>
                    </AnimatePresence>
                  ) : cellMemos.size > 0 ? (
                    <div
                      className="grid gap-0"
                      style={{
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(n))}, 1fr)`,
                        width: cellSize - 16,
                        height: cellSize - 16,
                        marginTop: 6,
                      }}
                    >
                      {Array.from({ length: n }, (_, i) => i + 1).map((num) => (
                        <span
                          key={num}
                          className="text-center leading-tight"
                          style={{
                            fontSize: cellSize <= 48 ? 7 : 9,
                            color: cellMemos.has(num)
                              ? "rgba(167,139,250,0.7)"
                              : "transparent",
                          }}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              );
            }),
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-3">
        {/* Number keypad */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: n }, (_, i) => i + 1).map((num) => {
            const isActive =
              selectedCell &&
              userGrid[selectedCell[0]][selectedCell[1]] === num;
            return (
              <RippleButton
                key={num}
                onClick={() => handleNumberInput(num)}
                className={`flex items-center justify-center rounded-xl font-bold transition-all ${
                  isActive
                    ? "border border-indigo-400/50 bg-indigo-500/30 text-indigo-300"
                    : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
                style={{
                  width: 50,
                  height: 50,
                  fontSize: 20,
                  backdropFilter: "blur(8px)",
                  boxShadow: isActive
                    ? "0 0 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {num}
              </RippleButton>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Undo */}
          <RippleButton
            onClick={handleUndo}
            disabled={undoStack.length === 0 || completed}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium backdrop-blur-sm ${
              undoStack.length === 0 || completed
                ? "border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            Undo
          </RippleButton>

          {/* Erase */}
          <RippleButton
            onClick={handleErase}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm hover:bg-white/10"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
            Erase
          </RippleButton>

          {/* Memo toggle */}
          <RippleButton
            onClick={() => setMemoMode(!memoMode)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium backdrop-blur-sm ${
              memoMode
                ? "border-blue-400/30 bg-blue-500/20 text-blue-300"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Memo
          </RippleButton>

          {/* Hint */}
          <RippleButton
            onClick={handleHint}
            disabled={hintsUsed >= 3 || !selectedCell}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium backdrop-blur-sm ${
              hintsUsed >= 3 || !selectedCell
                ? "border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed"
                : "border-amber-400/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
            {3 - hintsUsed}
          </RippleButton>
        </div>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                delay: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="mx-4 w-full max-w-sm rounded-3xl border border-white/10 p-6 text-center"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))",
                boxShadow:
                  "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 300 }}
                className="mb-4 text-5xl"
              >
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  className="mx-auto"
                  fill="none"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    stroke="url(#grad)"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 28L25 35L38 22"
                    stroke="#34d399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="56" y2="56">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="mb-6 text-2xl font-bold text-white"
              >
                퍼즐 완성!
              </motion.h2>

              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/50">소요 시간</span>
                  <span className="font-mono font-bold text-white">
                    {formatTime(elapsed)}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/50">힌트 사용</span>
                  <span className="font-bold text-amber-300">
                    {hintsUsed}회
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.7 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/50">오류 횟수</span>
                  <span
                    className={`font-bold ${errorCount === 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {errorCount}회
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.9 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/50">난이도</span>
                  <span
                    className={`rounded-lg bg-gradient-to-r ${DIFFICULTY_COLORS[difficulty]} px-2 py-0.5 text-xs font-bold text-white`}
                  >
                    {DIFFICULTY_LABELS[difficulty]} ({n}x{n})
                  </span>
                </motion.div>
              </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
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
                넘버 로직 플레이 방법
              </h2>

              <div className="space-y-4 text-sm text-white/80">
                <div>
                  <p className="mb-2 font-semibold text-indigo-300">목표</p>
                  <p>빈 칸에 숫자를 채워서 퍼즐을 완성하세요</p>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-indigo-300">규칙</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>같은 행(가로줄)에 같은 숫자가 올 수 없습니다</li>
                    <li>같은 열(세로줄)에 같은 숫자가 올 수 없습니다</li>
                    <li>같은 블록(굵은 선) 안에 같은 숫자가 올 수 없습니다</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-indigo-300">조작법</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>빈 칸을 탭하여 선택하세요</li>
                    <li>아래 숫자 버튼으로 숫자를 입력하세요</li>
                    <li>힌트 버튼을 누르면 정답을 알려줍니다</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-1 font-semibold text-indigo-300">팁</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/60">
                    <li>확실한 칸부터 채우세요</li>
                    <li>힌트를 적게 사용할수록 높은 점수!</li>
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

      {/* Inline style for ripple animation */}
      <style>{`
        @keyframes ripple-expand {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
