"use client";

import { motion } from "framer-motion";
import { getDifficultyLabel, getDifficultyColor } from "@/lib/difficulty";

interface DifficultyBadgeProps {
  level: number;
}

export default function DifficultyBadge({ level }: DifficultyBadgeProps) {
  const label = getDifficultyLabel(level);
  const color = getDifficultyColor(level);

  return (
    <motion.div
      key={label}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-white/80">{label}</span>
    </motion.div>
  );
}
