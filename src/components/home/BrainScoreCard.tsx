"use client";

import { motion } from "framer-motion";
import { BRAIN_RANKS } from "@/types";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface BrainScoreCardProps {
  score: number;
}

export default function BrainScoreCard({ score }: BrainScoreCardProps) {
  const rank =
    BRAIN_RANKS.find((r) => score >= r.min && score < r.max) || BRAIN_RANKS[0];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{
        background: "linear-gradient(135deg, #6C5CE7 0%, #a855f7 100%)",
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      <div className="relative z-10">
        <p className="text-sm text-white/70 mb-1">종합 뇌 점수</p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold font-tabular">
            <AnimatedNumber value={score} className="text-5xl font-bold" />
          </span>
          <span className="text-2xl mb-1">{rank.icon}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
            {rank.label}
          </span>
          <span className="text-xs text-white/60">/ 999</span>
        </div>
      </div>
    </motion.div>
  );
}
