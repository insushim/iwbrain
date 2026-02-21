"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#6C5CE7] text-white hover:bg-[#5A4BD1]",
  secondary: "bg-[#00B894] text-white hover:bg-[#00A381]",
  danger: "bg-[#E17055] text-white hover:bg-[#D05A40]",
  ghost: "bg-transparent text-current",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-5 py-2.5",
  lg: "px-8 py-3.5 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  disabled,
  className = "",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.95 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={`rounded-xl font-semibold transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
