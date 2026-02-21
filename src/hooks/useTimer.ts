"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimerOptions {
  countDown?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formatTime: () => string;
}

export function useTimer(
  initialTime: number,
  options: UseTimerOptions = {},
): UseTimerReturn {
  const { countDown = false, onComplete, onTick } = options;
  const [time, setTime] = useState(countDown ? initialTime : 0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setTime(countDown ? initialTime : 0);
    setIsRunning(true);
  }, [clearTimer, countDown, initialTime]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setTime(countDown ? initialTime : 0);
    setIsRunning(false);
  }, [clearTimer, countDown, initialTime]);

  const formatTime = useCallback((): string => {
    const totalSeconds = Math.max(0, Math.floor(time));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [time]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        const next = countDown ? prev - 1 : prev + 1;

        if (countDown && next <= 0) {
          clearTimer();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }

        onTickRef.current?.(countDown ? next : next);
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, countDown, clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { time, isRunning, start, pause, resume, reset, formatTime };
}
