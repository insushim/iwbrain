"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ComboIndicatorProps {
  combo: number;
}

export default function ComboIndicator({ combo }: ComboIndicatorProps) {
  const isHigh = combo > 5;
  const isExtreme = combo > 10;

  const gradient = isExtreme
    ? "linear-gradient(135deg, #FF4500, #FF0000, #FF6347)"
    : isHigh
      ? "linear-gradient(135deg, #FF8C00, #FFA500)"
      : undefined;

  return (
    <AnimatePresence mode="wait">
      {combo > 1 && (
        <motion.div
          key={combo}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex items-center gap-0.5"
        >
          <motion.span
            animate={isExtreme ? { scale: [1, 1.1, 1] } : {}}
            transition={isExtreme ? { repeat: Infinity, duration: 0.4 } : {}}
            className="text-lg font-black"
            style={
              gradient
                ? {
                    background: gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }
                : { color: "#FBBF24" }
            }
          >
            x{combo}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
