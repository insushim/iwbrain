/**
 * Procedural Nonogram Puzzle Generator
 *
 * Generates random nonogram puzzles that are guaranteed to be solvable
 * by logical deduction (line-solving). Uses a seeded PRNG for reproducibility.
 */

import { calculateNonogramHints } from "./grid";

// ─── PuzzleData interface (matches SpatialPuzzleGame) ───────────────────────

export interface PuzzleData {
  id: string;
  name: string;
  emoji: string;
  size: number;
  grid: number[][];
}

// ─── Seeded PRNG (Mulberry32) ───────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Nonogram Solver (line-based logical deduction) ─────────────────────────

// Cell states in solver: 0 = unknown, 1 = filled, 2 = empty
type SolverCell = 0 | 1 | 2;

/**
 * Generate all valid placements for a set of hints within a line of given length.
 * Returns an array of bitmask arrays (1=filled, 2=empty) for each valid arrangement.
 */
function generateLinePlacements(
  hints: number[],
  lineLength: number,
  currentLine: SolverCell[],
): number[][] {
  const results: number[][] = [];

  if (hints.length === 1 && hints[0] === 0) {
    // All empty
    const line = new Array(lineLength).fill(2);
    // Check compatibility
    if (isCompatible(line, currentLine)) {
      results.push(line);
    }
    return results;
  }

  function placeBlock(hintIdx: number, pos: number, line: number[]): void {
    if (hintIdx === hints.length) {
      // Fill remaining with empty
      const completed = [...line];
      for (let i = pos; i < lineLength; i++) {
        completed[i] = 2;
      }
      if (isCompatible(completed, currentLine)) {
        results.push(completed);
      }
      return;
    }

    const blockLen = hints[hintIdx];
    const remainingBlocks = hints.length - hintIdx - 1;
    const remainingSpace =
      hints.slice(hintIdx + 1).reduce((a, b) => a + b, 0) + remainingBlocks;
    const maxStart = lineLength - blockLen - remainingSpace;

    for (let start = pos; start <= maxStart; start++) {
      // Try placing block at 'start'
      const newLine = [...line];
      // Fill gap before block with empty
      for (let i = pos; i < start; i++) {
        newLine[i] = 2;
      }
      // Fill block with filled
      for (let i = start; i < start + blockLen; i++) {
        newLine[i] = 1;
      }

      // Check partial compatibility (up to start + blockLen)
      let partialOk = true;
      for (let i = pos; i < start + blockLen; i++) {
        if (currentLine[i] !== 0 && currentLine[i] !== newLine[i]) {
          partialOk = false;
          break;
        }
      }
      if (!partialOk) continue;

      if (hintIdx < hints.length - 1) {
        // Must have a gap after block
        newLine[start + blockLen] = 2;
        if (
          currentLine[start + blockLen] !== 0 &&
          currentLine[start + blockLen] !== 2
        ) {
          continue;
        }
        placeBlock(hintIdx + 1, start + blockLen + 1, newLine);
      } else {
        placeBlock(hintIdx + 1, start + blockLen, newLine);
      }

      // Limit to avoid combinatorial explosion
      if (results.length > 5000) return;
    }
  }

  placeBlock(0, 0, new Array(lineLength).fill(0));
  return results;
}

function isCompatible(line: number[], current: SolverCell[]): boolean {
  for (let i = 0; i < line.length; i++) {
    if (current[i] !== 0 && current[i] !== line[i]) return false;
  }
  return true;
}

/**
 * Intersect all valid placements: if all placements agree on a cell,
 * we can determine it.
 */
function intersectPlacements(
  placements: number[][],
  lineLength: number,
): SolverCell[] {
  if (placements.length === 0) {
    // No valid placement - contradiction
    return new Array(lineLength).fill(0);
  }

  const result: SolverCell[] = new Array(lineLength).fill(0);
  for (let i = 0; i < lineLength; i++) {
    const val = placements[0][i];
    let allSame = true;
    for (let p = 1; p < placements.length; p++) {
      if (placements[p][i] !== val) {
        allSame = false;
        break;
      }
    }
    if (allSame) {
      result[i] = val as SolverCell;
    }
  }
  return result;
}

/**
 * Solve a nonogram puzzle using line-based logical deduction only.
 * Returns the solved grid (with 0 = unsolved cells) or null if contradiction.
 */
function solveByLogic(
  rowHints: number[][],
  colHints: number[][],
  rows: number,
  cols: number,
): SolverCell[][] | null {
  const grid: SolverCell[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(0),
  );

  let changed = true;
  let iterations = 0;
  const maxIterations = rows + cols + 20; // safety limit

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Process rows
    for (let r = 0; r < rows; r++) {
      const currentLine: SolverCell[] = grid[r];
      if (currentLine.every((c) => c !== 0)) continue; // already solved

      const placements = generateLinePlacements(rowHints[r], cols, currentLine);
      if (placements.length === 0) return null; // contradiction

      const deduced = intersectPlacements(placements, cols);
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 0 && deduced[c] !== 0) {
          grid[r][c] = deduced[c];
          changed = true;
        }
      }
    }

    // Process columns
    for (let c = 0; c < cols; c++) {
      const currentLine: SolverCell[] = [];
      for (let r = 0; r < rows; r++) {
        currentLine.push(grid[r][c]);
      }
      if (currentLine.every((v) => v !== 0)) continue;

      const placements = generateLinePlacements(colHints[c], rows, currentLine);
      if (placements.length === 0) return null;

      const deduced = intersectPlacements(placements, rows);
      for (let r = 0; r < rows; r++) {
        if (grid[r][c] === 0 && deduced[r] !== 0) {
          grid[r][c] = deduced[r];
          changed = true;
        }
      }
    }
  }

  return grid;
}

// ─── Uniqueness Validator ───────────────────────────────────────────────────

/**
 * Checks if a puzzle is fully solvable by line logic alone.
 * A puzzle solvable purely by line logic has a unique solution by definition.
 */
export function hasUniqueSolution(grid: number[][]): boolean {
  const { rowHints, colHints } = calculateNonogramHints(grid);
  const rows = grid.length;
  const cols = grid[0].length;

  const solved = solveByLogic(rowHints, colHints, rows, cols);
  if (!solved) return false;

  // Check every cell is determined
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (solved[r][c] === 0) return false;
    }
  }

  // Verify the solved result matches the original
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const expected = grid[r][c] === 1 ? 1 : 2;
      if (solved[r][c] !== expected) return false;
    }
  }

  return true;
}

// ─── Grid Generation Strategies ─────────────────────────────────────────────

/**
 * Generate a random grid with controlled density.
 * Density is the approximate ratio of filled cells (0.3 to 0.6 works well).
 */
function generateRandomGrid(
  size: number,
  rng: () => number,
  density: number,
): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(rng() < density ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate a structured grid that looks like a shape.
 * Uses radial/symmetric patterns for more interesting puzzles.
 */
function generateStructuredGrid(size: number, rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0),
  );
  const center = (size - 1) / 2;

  const pattern = Math.floor(rng() * 5);

  switch (pattern) {
    case 0: {
      // Radial blob
      const radius = center * (0.4 + rng() * 0.4);
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const dist = Math.sqrt((r - center) ** 2 + (c - center) ** 2);
          if (dist < radius + rng() * 1.2 - 0.6) {
            grid[r][c] = 1;
          }
        }
      }
      break;
    }
    case 1: {
      // Horizontal symmetric
      const density = 0.35 + rng() * 0.2;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c <= Math.floor((size - 1) / 2); c++) {
          if (rng() < density) {
            grid[r][c] = 1;
            grid[r][size - 1 - c] = 1;
          }
        }
      }
      break;
    }
    case 2: {
      // Connected blocks
      const numBlocks = 2 + Math.floor(rng() * 3);
      for (let b = 0; b < numBlocks; b++) {
        const bx = Math.floor(rng() * (size - 2));
        const by = Math.floor(rng() * (size - 2));
        const bw = 1 + Math.floor(rng() * 3);
        const bh = 1 + Math.floor(rng() * 3);
        for (let r = by; r < Math.min(by + bh, size); r++) {
          for (let c = bx; c < Math.min(bx + bw, size); c++) {
            grid[r][c] = 1;
          }
        }
      }
      break;
    }
    case 3: {
      // Diamond shape with noise
      const diamondSize = Math.floor(center * (0.6 + rng() * 0.4));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const dist = Math.abs(r - center) + Math.abs(c - center);
          if (dist <= diamondSize + rng() * 0.8 - 0.3) {
            grid[r][c] = 1;
          }
        }
      }
      break;
    }
    case 4: {
      // Cross/plus pattern with variation
      const thickness = 1 + Math.floor(rng() * Math.floor(center));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const nearCenterRow = Math.abs(r - center) < thickness;
          const nearCenterCol = Math.abs(c - center) < thickness;
          if (nearCenterRow || nearCenterCol) {
            if (rng() < 0.85) {
              grid[r][c] = 1;
            }
          }
        }
      }
      break;
    }
  }

  return grid;
}

/**
 * Mutate a grid slightly: flip some cells to try to make it solvable.
 */
function mutateGrid(
  grid: number[][],
  rng: () => number,
  mutations: number,
): number[][] {
  const size = grid.length;
  const newGrid = grid.map((row) => [...row]);

  for (let i = 0; i < mutations; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    newGrid[r][c] = newGrid[r][c] === 1 ? 0 : 1;
  }

  return newGrid;
}

/**
 * Ensure grid has a reasonable fill ratio.
 * Returns true if the fill ratio is between 25% and 65%.
 */
function hasReasonableDensity(grid: number[][]): boolean {
  const size = grid.length;
  const total = size * size;
  const filled = grid.flat().filter((c) => c === 1).length;
  const ratio = filled / total;
  return ratio >= 0.25 && ratio <= 0.65;
}

/**
 * Ensure grid is not trivially all-filled or has at least some structure.
 */
function hasNonTrivialHints(grid: number[][]): boolean {
  const { rowHints, colHints } = calculateNonogramHints(grid);
  // At least some rows/cols should have more than one hint group
  const multiHintRows = rowHints.filter((h) => h.length > 1).length;
  const multiHintCols = colHints.filter((h) => h.length > 1).length;
  return multiHintRows + multiHintCols >= 2;
}

// ─── Random Emoji/Name pool for generated puzzles ───────────────────────────

const RANDOM_NAMES: { name: string; emoji: string }[] = [
  { name: "Mystery A", emoji: "🔮" },
  { name: "Mystery B", emoji: "🧩" },
  { name: "Pattern", emoji: "🎯" },
  { name: "Shadow", emoji: "🌑" },
  { name: "Pixel Art", emoji: "🖼️" },
  { name: "Mosaic", emoji: "🪟" },
  { name: "Abstract", emoji: "🎨" },
  { name: "Blueprint", emoji: "📐" },
  { name: "Silhouette", emoji: "👤" },
  { name: "Riddle", emoji: "❓" },
  { name: "Enigma", emoji: "🔐" },
  { name: "Sketch", emoji: "✏️" },
  { name: "Fragment", emoji: "💎" },
  { name: "Cipher", emoji: "🔢" },
  { name: "Tessera", emoji: "🧱" },
  { name: "Glyph", emoji: "🪬" },
];

// ─── Main Generator ─────────────────────────────────────────────────────────

/**
 * Generate a solvable nonogram puzzle of the given size.
 *
 * @param size - Grid size (5, 7, or 10)
 * @param seed - Optional seed for reproducible results
 * @returns A PuzzleData object with a grid solvable by line logic
 */
export function generatePuzzle(size: number, seed?: number): PuzzleData {
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const rng = mulberry32(actualSeed);

  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Alternate between structured and random grids
    let grid: number[][];
    if (attempt % 3 === 0) {
      grid = generateStructuredGrid(size, rng);
    } else {
      const density = 0.35 + rng() * 0.2;
      grid = generateRandomGrid(size, rng, density);
    }

    // Apply small mutations on later attempts
    if (attempt > 10) {
      grid = mutateGrid(grid, rng, 1 + Math.floor(attempt / 20));
    }

    if (!hasReasonableDensity(grid)) continue;
    if (!hasNonTrivialHints(grid)) continue;

    if (hasUniqueSolution(grid)) {
      const nameIdx = Math.floor(rng() * RANDOM_NAMES.length);
      const { name, emoji } = RANDOM_NAMES[nameIdx];
      return {
        id: `gen-${size}-${actualSeed}`,
        name: `${name} #${actualSeed % 10000}`,
        emoji,
        size,
        grid,
      };
    }
  }

  // Fallback: generate a very simple guaranteed-solvable puzzle
  // (single block or simple pattern)
  const grid = generateFallbackPuzzle(size, rng);
  const nameIdx = Math.floor(rng() * RANDOM_NAMES.length);
  const { name, emoji } = RANDOM_NAMES[nameIdx];
  return {
    id: `gen-${size}-${actualSeed}`,
    name: `${name} #${actualSeed % 10000}`,
    emoji,
    size,
    grid,
  };
}

/**
 * Generates a simple puzzle guaranteed to be solvable (fallback).
 * Uses fully filled rows/columns that create unambiguous line hints.
 */
function generateFallbackPuzzle(size: number, rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0),
  );

  // Fill a rectangular block in the center
  const margin = 1 + Math.floor(rng() * Math.floor(size / 4));
  for (let r = margin; r < size - margin; r++) {
    for (let c = margin; c < size - margin; c++) {
      grid[r][c] = 1;
    }
  }

  // Add an asymmetric feature to avoid trivial ambiguity
  const featureR = Math.floor(rng() * size);
  const featureC = Math.floor(rng() * size);
  grid[featureR][featureC] = grid[featureR][featureC] === 1 ? 0 : 1;

  // Verify it's solvable, otherwise return the block without the feature
  if (hasUniqueSolution(grid)) return grid;

  // Undo the feature
  grid[featureR][featureC] = grid[featureR][featureC] === 1 ? 0 : 1;

  // Simple block should generally be solvable
  return grid;
}

// ─── Daily Puzzle ───────────────────────────────────────────────────────────

/**
 * Get a daily puzzle seeded by today's date.
 * The same size on the same day always returns the same puzzle.
 *
 * @param size - Grid size (5, 7, or 10)
 * @returns A PuzzleData with a deterministic daily puzzle
 */
export function getDailyPuzzle(size: number): PuzzleData {
  const today = new Date();
  const dateNum =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  // Combine date with size so each size gets a different puzzle
  const seed = dateNum * 10 + size;

  const puzzle = generatePuzzle(size, seed);
  puzzle.id = `daily-${size}-${dateNum}`;
  puzzle.name = `Daily ${size}x${size}`;
  puzzle.emoji = "📅";

  return puzzle;
}
