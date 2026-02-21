"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  hoverable,
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      onClick={onClick}
      className={`bg-white dark:bg-[#16213E] rounded-2xl shadow p-4 ${
        hoverable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
