"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export default function PauseModal({
  isOpen,
  onResume,
  onRestart,
  onQuit,
}: PauseModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onResume();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onResume]);

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
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mx-4 flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-slate-800 p-6"
          >
            <h2 className="text-center text-xl font-bold text-white">
              일시정지
            </h2>

            <button
              type="button"
              onClick={onResume}
              className="rounded-xl bg-indigo-500 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              계속하기
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl bg-white/10 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20"
            >
              다시 시작
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-xl bg-white/5 py-3 text-base font-semibold text-white/60 transition-colors hover:bg-white/10"
            >
              나가기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
