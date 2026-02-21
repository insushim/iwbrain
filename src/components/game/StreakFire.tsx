"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StreakFireProps {
  streak: number;
  show: boolean;
}

export default function StreakFire({ streak, show }: StreakFireProps) {
  const intensity = Math.min(streak, 10);
  const scale = 1 + intensity * 0.1;

  return (
    <AnimatePresence>
      {show && streak > 0 && (
        <motion.div
          key={streak}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="flex items-center gap-1"
        >
          <motion.span
            animate={
              intensity > 5
                ? { y: [0, -3, 0], rotate: [-5, 5, -5] }
                : { y: [0, -2, 0] }
            }
            transition={{
              repeat: Infinity,
              duration: intensity > 5 ? 0.3 : 0.5,
            }}
            className="text-2xl"
            style={{ filter: intensity > 7 ? "brightness(1.3)" : undefined }}
          >
            {intensity > 7 ? "🔥🔥" : "🔥"}
          </motion.span>
          <span className="text-sm font-bold text-orange-400">
            {streak}연속!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
