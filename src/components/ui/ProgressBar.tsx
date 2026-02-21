"use client";

import { motion } from "framer-motion";

type ProgressHeight = "sm" | "md" | "lg";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: ProgressHeight;
  animated?: boolean;
  className?: string;
}

const heightStyles: Record<ProgressHeight, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  color = "#6C5CE7",
  height = "md",
  animated = true,
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${heightStyles[height]} ${className}`}
    >
      <motion.div
        className={`${heightStyles[height]} rounded-full`}
        style={{ backgroundColor: color }}
        initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
        animate={{ width: `${clampedValue}%` }}
        transition={
          animated ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }
        }
        layout
      />
    </div>
  );
}
