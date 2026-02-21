"use client";

import { useRef, useEffect } from "react";

interface Scores {
  logic: number;
  memory: number;
  attention: number;
  language: number;
  math: number;
  spatial: number;
}

interface BrainRadarChartProps {
  scores: Scores;
  previousScores?: Scores;
}

const LABELS = ["논리력", "기억력", "주의력", "언어력", "연산력", "공간력"];
const KEYS: (keyof Scores)[] = [
  "logic",
  "memory",
  "attention",
  "language",
  "math",
  "spatial",
];
const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LEVELS = [20, 40, 60, 80, 100];

function getVertex(index: number, scale: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return [
    CENTER + Math.cos(angle) * RADIUS * (scale / 100),
    CENTER + Math.sin(angle) * RADIUS * (scale / 100),
  ];
}

export default function BrainRadarChart({
  scores,
  previousScores,
}: BrainRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw background hexagon grid lines
    for (const level of LEVELS) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const [x, y] = getVertex(i % 6, level);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < 6; i++) {
      const [x, y] = getVertex(i, 100);
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw previous scores polygon (if provided)
    if (previousScores) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const key = KEYS[i % 6];
        const val = Math.min(100, Math.max(0, previousScores[key]));
        const [x, y] = getVertex(i % 6, val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(160, 160, 160, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "rgba(160, 160, 160, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current scores polygon
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const key = KEYS[i % 6];
      const val = Math.min(100, Math.max(0, scores[key]));
      const [x, y] = getVertex(i % 6, val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(108, 92, 231, 0.3)";
    ctx.fill();
    ctx.strokeStyle = "#6C5CE7";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw labels and score values
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 6; i++) {
      const [lx, ly] = getVertex(i, 120);
      const key = KEYS[i];
      const val = Math.min(100, Math.max(0, scores[key]));

      // Label
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#333";
      ctx.fillText(LABELS[i], lx, ly);

      // Score value
      const [sx, sy] = getVertex(i, val);
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#6C5CE7";
      ctx.fillText(String(Math.round(val)), sx, sy - 12);
    }
  }, [scores, previousScores]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
