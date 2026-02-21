"use client";

import { motion, AnimatePresence } from "framer-motion";
import Timer from "./Timer";
import ScoreDisplay from "./ScoreDisplay";

interface GameWrapperProps {
  children: React.ReactNode;
  gameType: string;
  title: string;
  onBack: () => void;
  showTimer?: boolean;
  timeLimit?: number;
  onTimeUp?: () => void;
  showScore?: boolean;
  score?: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

export default function GameWrapper({
  children,
  title,
  onBack,
  showTimer,
  timeLimit = 60,
  showScore,
  score = 0,
  isPaused,
  onPause,
  onResume,
}: GameWrapperProps) {
  return (
    <div className="relative flex h-full min-h-screen flex-col bg-slate-900">
      {/* Top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10"
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-base font-semibold text-white">{title}</h1>

        <div className="flex items-center gap-2">
          {showScore && <ScoreDisplay score={score} change={null} />}

          {onPause && (
            <button
              type="button"
              onClick={onPause}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Timer bar below top bar */}
      {showTimer && (
        <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1">
          <Timer
            timeLeft={0}
            totalTime={timeLimit}
            warning={false}
            variant="bar"
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col pt-16">{children}</div>

      {/* Pause overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onResume}
          >
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-white/80"
            >
              탭하여 계속하기
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
