"use client";

import { motion } from "framer-motion";

interface HintButtonProps {
  remaining: number;
  onUseHint: () => void;
  disabled?: boolean;
}

export default function HintButton({
  remaining,
  onUseHint,
  disabled,
}: HintButtonProps) {
  const isAvailable = remaining > 0 && !disabled;

  return (
    <motion.button
      type="button"
      onClick={onUseHint}
      disabled={!isAvailable}
      animate={isAvailable ? { scale: [1, 1.05, 1] } : {}}
      transition={
        isAvailable ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}
      }
      whileTap={isAvailable ? { scale: 0.9 } : {}}
      className="relative flex items-center justify-center rounded-full bg-white/10 p-2.5 text-yellow-400 transition-colors disabled:text-white/30 disabled:opacity-50"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>

      {remaining > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
          {remaining}
        </span>
      )}
    </motion.button>
  );
}
