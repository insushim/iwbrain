"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ScoreDisplayProps {
  score: number;
  change: number | null;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 300;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + diff * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

export default function ScoreDisplay({ score, change }: ScoreDisplayProps) {
  return (
    <div className="relative flex items-center gap-1">
      <span className="text-2xl font-bold text-white tabular-nums">
        <AnimatedNumber value={score} />
      </span>

      <AnimatePresence>
        {change !== null && change !== 0 && (
          <motion.span
            key={`${score}-${change}`}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -24 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute -right-8 -top-2 text-sm font-bold text-green-400"
          >
            +{change}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
