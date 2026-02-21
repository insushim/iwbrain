"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 500,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    if (from === to) return;

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(to);
      }
    }

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {Math.round(displayValue).toLocaleString()}
      {suffix}
    </span>
  );
}
