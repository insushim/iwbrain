export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function shuffleArray<T>(arr: T[], rng?: () => number): T[] {
  const result = [...arr];
  const random = rng || Math.random;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomInt(
  min: number,
  max: number,
  rng?: () => number,
): number {
  const random = rng || Math.random;
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randomPick<T>(arr: T[], rng?: () => number): T {
  const random = rng || Math.random;
  return arr[Math.floor(random() * arr.length)];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
