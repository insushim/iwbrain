"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border)]"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}
    >
      <div className="flex items-center gap-2 min-w-[40px]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="뒤로가기"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>
      <h1 className="text-lg font-bold truncate">{title}</h1>
      <div className="min-w-[40px] flex justify-end">{rightAction}</div>
    </motion.header>
  );
}
