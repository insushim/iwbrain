"use client";

import { motion } from "framer-motion";

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  warning: boolean;
  variant: "bar" | "circle";
}

export default function Timer({
  timeLeft,
  totalTime,
  warning,
  variant,
}: TimerProps) {
  const fraction = totalTime > 0 ? timeLeft / totalTime : 0;

  const color = warning ? "#EF4444" : fraction > 0.5 ? "#22C55E" : "#F59E0B";

  if (variant === "circle") {
    const size = 48;
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - fraction);

    return (
      <motion.div
        animate={warning ? { scale: [1, 1.08, 1] } : {}}
        transition={warning ? { repeat: Infinity, duration: 0.6 } : {}}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s" }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-white">
          {Math.ceil(timeLeft)}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
      <motion.div
        animate={warning ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
        transition={warning ? { repeat: Infinity, duration: 0.5 } : {}}
        className="h-full rounded-full"
        style={{
          width: `${fraction * 100}%`,
          backgroundColor: color,
          transition: "width 0.3s linear, background-color 0.3s",
        }}
      />
    </div>
  );
}
