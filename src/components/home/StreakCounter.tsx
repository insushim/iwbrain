"use client";

import { motion } from "framer-motion";
import { STREAK_FRAMES } from "@/types";

interface StreakCounterProps {
  days: number;
}

export default function StreakCounter({ days }: StreakCounterProps) {
  const frame = [...STREAK_FRAMES].reverse().find((f) => days >= f.days);
  const frameColor =
    frame?.color === "rainbow"
      ? "linear-gradient(135deg, #FF6B6B, #FDCB6E, #00B894, #6C5CE7, #E84393)"
      : frame?.color || "#B2BEC3";

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]"
    >
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: days >= 3 ? frameColor : "var(--border)",
          padding: "3px",
        }}
      >
        <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center">
          <span className="text-xl">&#128293;</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold font-tabular">
          {days}
          <span className="text-sm font-normal text-[var(--text-secondary)] ml-1">
            일
          </span>
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {days === 0 ? "오늘 시작해 보세요!" : "연속 접속 중"}
          {frame && (
            <span
              className="ml-1 font-medium"
              style={{
                color: frame.color === "rainbow" ? "#6C5CE7" : frame.color,
              }}
            >
              {frame.label}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}
