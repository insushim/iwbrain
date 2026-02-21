"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ReactNode,
  useState,
  useCallback,
  MouseEvent,
  TouchEvent,
} from "react";

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

let rippleCounter = 0;

export default function Ripple({
  children,
  className = "",
  color = "rgba(255,255,255,0.4)",
}: RippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const addRipple = useCallback(
    (clientX: number, clientY: number, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = clientX - rect.left - size / 2;
      const y = clientY - rect.top - size / 2;

      const ripple: RippleItem = { id: ++rippleCounter, x, y, size };
      setRipples((prev) => [...prev, ripple]);
    },
    [],
  );

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      addRipple(e.clientX, e.clientY, e.currentTarget);
    },
    [addRipple],
  );

  const handleTouch = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (touch) {
        addRipple(touch.clientX, touch.clientY, e.currentTarget);
      }
    },
    [addRipple],
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      onTouchStart={handleTouch}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => removeRipple(ripple.id)}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
