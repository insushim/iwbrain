export function createGrid<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill) as T[]);
}

export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

export function getAdjacentCells(
  row: number,
  col: number,
  rows: number,
  cols: number,
): [number, number][] {
  const adjacent: [number, number][] = [];
  if (row > 0) adjacent.push([row - 1, col]);
  if (row < rows - 1) adjacent.push([row + 1, col]);
  if (col > 0) adjacent.push([row, col - 1]);
  if (col < cols - 1) adjacent.push([row, col + 1]);
  return adjacent;
}

export function calculateNonogramHints(grid: number[][]): {
  rowHints: number[][];
  colHints: number[][];
} {
  const rows = grid.length;
  const cols = grid[0].length;

  const rowHints: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const hints: number[] = [];
    let count = 0;
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    rowHints.push(hints.length > 0 ? hints : [0]);
  }

  const colHints: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const hints: number[] = [];
    let count = 0;
    for (let r = 0; r < rows; r++) {
      if (grid[r][c] === 1) {
        count++;
      } else if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
    if (count > 0) hints.push(count);
    colHints.push(hints.length > 0 ? hints : [0]);
  }

  return { rowHints, colHints };
}
