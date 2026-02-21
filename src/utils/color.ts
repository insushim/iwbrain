export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (v: number) =>
    Math.min(255, Math.max(0, Math.round(v + (255 * percent) / 100)));
  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const GAME_COLORS = {
  "number-logic": "#0984E3",
  "pattern-memory": "#E84393",
  "color-sequence": "#00CEC9",
  "word-chain": "#6C5CE7",
  "math-rush": "#FDCB6E",
  "spatial-puzzle": "#00B894",
} as const;

export const STROOP_COLORS = [
  { name: "빨강", hex: "#FF6B6B", en: "red" },
  { name: "파랑", hex: "#4ECDC4", en: "blue" },
  { name: "노랑", hex: "#FFE66D", en: "yellow" },
  { name: "초록", hex: "#51CF66", en: "green" },
  { name: "보라", hex: "#845EF7", en: "purple" },
  { name: "주황", hex: "#FF922B", en: "orange" },
] as const;

export const PASTEL_COLORS = [
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#E8BAFF",
  "#FFB3E6",
  "#B3FFD9",
  "#FFE4B3",
  "#B3D9FF",
  "#D9B3FF",
  "#FFB3B3",
  "#B3FFB3",
  "#B3B3FF",
  "#FFE0B3",
];

export const CAGE_COLORS = [
  "#FFE0E0",
  "#E0F0FF",
  "#E0FFE0",
  "#FFF0E0",
  "#F0E0FF",
  "#E0FFF0",
  "#FFE0F0",
  "#F0FFE0",
  "#E0E0FF",
  "#FFF5E0",
  "#FFE5F0",
  "#E5FFE0",
  "#E0F5FF",
  "#F5E0FF",
  "#FFF0F0",
];
