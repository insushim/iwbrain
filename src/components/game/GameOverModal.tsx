"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  accuracy: number;
  maxCombo: number;
  onPlayAgain: () => void;
  onExit: () => void;
  isHighScore?: boolean;
}

export default function GameOverModal({
  isOpen,
  score,
  accuracy,
  maxCombo,
  onPlayAgain,
  onExit,
  isHighScore,
}: GameOverModalProps) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!isOpen || !isHighScore || confettiFired.current) return;
    confettiFired.current = true;

    import("canvas-confetti").then((mod) => {
      const fire = mod.default;
      fire({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    });
  }, [isOpen, isHighScore]);

  useEffect(() => {
    if (!isOpen) confettiFired.current = false;
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="mx-4 flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl bg-slate-800 p-8"
          >
            <h2 className="text-2xl font-bold text-white">게임 종료</h2>

            {isHighScore && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="rounded-full bg-yellow-500/20 px-4 py-1 text-sm font-bold text-yellow-400"
              >
                최고 기록!
              </motion.span>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
              className="text-5xl font-black tabular-nums text-white"
            >
              {score.toLocaleString()}
            </motion.div>

            <div className="flex w-full gap-4">
              <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
                <span className="text-xs text-white/50">정확도</span>
                <span className="text-lg font-bold text-white">
                  {Math.round(accuracy)}%
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
                <span className="text-xs text-white/50">최대 콤보</span>
                <span className="text-lg font-bold text-white">{maxCombo}</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5">
              <button
                type="button"
                onClick={onPlayAgain}
                className="rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-400"
              >
                다시 하기
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-xl bg-white/10 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20"
              >
                나가기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
