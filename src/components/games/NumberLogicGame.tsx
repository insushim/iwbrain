"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

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

const CAGE_COLORS = [
  "#FFE0E0",
  "#E0F0FF",
  "#E0FFE0",
  "#FFF0E0",
  "#F0E0FF",
  "#E0FFF0",
  "#FFE0F0",
  "#F0FFE0",
  "#E0E0FF",
];

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
        // 3+ cells: use + or ×
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
        color: CAGE_COLORS[colorIdx % CAGE_COLORS.length],
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
    // All filled — check all cage constraints
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
    return true; // Can't partially validate - and ÷
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

// --- Component ---

export default function NumberLogicGame({
  difficulty,
  onComplete,
  onBack,
}: NumberLogicGameProps) {
  const n = GRID_SIZES[difficulty];

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

  const completedRef = useRef(false);

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
        }, idx * 100);
      });

      // Call onComplete after animation
      const totalDelay = allCells.length * 100 + 500;
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
    if (puzzle && puzzle.revealed[r][c] !== 0) return; // Can't select revealed cells
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

  const handleHint = () => {
    if (!puzzle || !selectedCell || hintsUsed >= 3 || completed) return;
    const [r, c] = selectedCell;
    if (puzzle.revealed[r][c] !== 0) return;
    if (userGrid[r][c] === puzzle.solution[r][c]) return;

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
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white"
        />
      </div>
    );
  }

  const cageMap = buildCageMap(n, puzzle.cages);
  const selectedValue = selectedCell
    ? userGrid[selectedCell[0]][selectedCell[1]]
    : 0;
  const cellSize = n <= 4 ? 64 : n <= 5 ? 56 : 48;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-900 px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
        >
          Back
        </button>
        <div className="text-lg font-bold text-white">
          {formatTime(elapsed)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ({n}x{n})
          </span>
        </div>
      </div>

      {/* Error / Hint counters */}
      <div className="mb-3 flex w-full max-w-md items-center justify-center gap-6 text-sm text-white/70">
        <span>
          Errors:{" "}
          <span className={errorCount > 0 ? "text-red-400" : ""}>
            {errorCount}
          </span>
        </span>
        <span>Hints: {hintsUsed}/3</span>
      </div>

      {/* Grid */}
      <div
        className="relative mb-6 rounded-lg bg-white p-0.5"
        style={{ width: cellSize * n + 1, height: cellSize * n + 1 }}
      >
        {/* Cage backgrounds */}
        {puzzle.cages.map((cage, ci) =>
          cage.cells.map(([r, c], idx) => (
            <div
              key={`cage-bg-${ci}-${idx}`}
              className="absolute"
              style={{
                top: r * cellSize + 0.5,
                left: c * cellSize + 0.5,
                width: cellSize,
                height: cellSize,
                backgroundColor: completedCells.has(`${r},${c}`)
                  ? "#86EFAC"
                  : errors.has(`${r},${c}`)
                    ? "#FECACA"
                    : selectedValue > 0 && userGrid[r][c] === selectedValue
                      ? "#BFDBFE"
                      : cage.color,
                transition: "background-color 0.2s",
              }}
            />
          )),
        )}

        {/* Cage borders */}
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => {
            const ci = cageMap[r][c];
            const borderStyle: React.CSSProperties = {
              position: "absolute",
              top: r * cellSize + 0.5,
              left: c * cellSize + 0.5,
              width: cellSize,
              height: cellSize,
              boxSizing: "border-box",
              borderTop:
                r === 0 || cageMap[r - 1][c] !== ci
                  ? "2px solid #374151"
                  : "1px solid #D1D5DB",
              borderBottom:
                r === n - 1 || cageMap[r + 1]?.[c] !== ci
                  ? "2px solid #374151"
                  : "1px solid #D1D5DB",
              borderLeft:
                c === 0 || cageMap[r][c - 1] !== ci
                  ? "2px solid #374151"
                  : "1px solid #D1D5DB",
              borderRight:
                c === n - 1 || cageMap[r][c + 1] !== ci
                  ? "2px solid #374151"
                  : "1px solid #D1D5DB",
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
              className="absolute z-10 text-[10px] font-bold leading-none text-gray-700"
              style={{
                top: r * cellSize + 3,
                left: c * cellSize + 3,
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
            const cellMemos = memos[r]?.[c] || new Set<number>();

            return (
              <motion.div
                key={`cell-${r}-${c}`}
                className="absolute flex cursor-pointer items-center justify-center"
                style={{
                  top: r * cellSize + 0.5,
                  left: c * cellSize + 0.5,
                  width: cellSize,
                  height: cellSize,
                  zIndex: isSelected ? 20 : 10,
                }}
                onClick={() => handleCellTap(r, c)}
                whileTap={isRevealed ? {} : { scale: 0.95 }}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <motion.div
                    layoutId="cell-selection"
                    className="absolute inset-0 rounded-sm"
                    style={{
                      border: "3px solid #3B82F6",
                      zIndex: 5,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Value */}
                {value > 0 ? (
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={value}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`text-center font-bold ${
                        isRevealed
                          ? "text-gray-800"
                          : isError
                            ? "text-red-600"
                            : "text-blue-600"
                      }`}
                      style={{ fontSize: cellSize * 0.45 }}
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
                        className="text-center text-[9px] leading-tight text-gray-500"
                      >
                        {cellMemos.has(num) ? num : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            );
          }),
        )}
      </div>

      {/* Controls */}
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        {/* Number keypad */}
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: n }, (_, i) => i + 1).map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberInput(num)}
              className={`flex items-center justify-center rounded-lg font-bold text-white ${
                selectedCell &&
                userGrid[selectedCell[0]][selectedCell[1]] === num
                  ? "bg-blue-500"
                  : "bg-white/15 hover:bg-white/25"
              }`}
              style={{ width: 48, height: 48, fontSize: 20 }}
            >
              {num}
            </motion.button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Erase */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleErase}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
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
              <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
            Erase
          </motion.button>

          {/* Memo toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMemoMode(!memoMode)}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium ${
              memoMode
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Memo {memoMode ? "ON" : "OFF"}
          </motion.button>

          {/* Hint */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleHint}
            disabled={hintsUsed >= 3 || !selectedCell}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm ${
              hintsUsed >= 3 || !selectedCell
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
            }`}
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
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
            </svg>
            {3 - hintsUsed}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
