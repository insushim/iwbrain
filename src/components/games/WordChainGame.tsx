"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KOREAN_WORDS,
  applyDueum,
  getWordsStartingWith,
  isValidWord,
} from "@/data/words-ko";

interface WordChainGameProps {
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

function getRandomStartWord(): string {
  const twoCharWords: string[] = [];
  for (const word of KOREAN_WORDS) {
    if (word.length === 2) twoCharWords.push(word);
  }
  return twoCharWords[Math.floor(Math.random() * twoCharWords.length)];
}

function getLastChar(word: string): string {
  return word[word.length - 1];
}

function getComputerWord(
  lastChar: string,
  usedWords: Set<string>,
): string | null {
  const candidates = getWordsStartingWith(lastChar).filter(
    (w) => !usedWords.has(w),
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function wordScore(word: string): number {
  const len = word.length;
  if (len <= 3) return 1;
  if (len === 4) return 3;
  return 5 + (len - 5) * 2;
}

export default function WordChainGame({
  onComplete,
  onBack,
}: WordChainGameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [currentWord, setCurrentWord] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [wordHistory, setWordHistory] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [passes, setPasses] = useState(3);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [shaking, setShaking] = useState(false);
  const [bonusMsg, setBonusMsg] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const errorTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bonusTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const endGame = useCallback(() => {
    setPhase("over");
    clearInterval(timerRef.current);
  }, []);

  const startGame = useCallback(() => {
    const startWord = getRandomStartWord();
    const used = new Set<string>([startWord]);
    setPhase("playing");
    setCurrentWord(startWord);
    setInputValue("");
    setUsedWords(used);
    setWordHistory([startWord]);
    setScore(0);
    setWordCount(0);
    setPasses(3);
    setLives(3);
    setTimeLeft(10);
    setStreak(0);
    setMaxStreak(0);
    setErrorMsg("");
    setBonusMsg("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              endGame();
              return 0;
            }
            return newLives;
          });
          setStreak(0);
          setErrorMsg("시간 초과!");
          clearTimeout(errorTimeout.current);
          errorTimeout.current = setTimeout(() => setErrorMsg(""), 1500);
          return 10;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, endGame]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (phase !== "playing") return;
      const word = inputValue.trim();
      if (!word) return;

      const requiredChar = getLastChar(currentWord);
      const dueumChar = applyDueum(requiredChar);
      const firstChar = word[0];

      // Validate starts with correct char
      if (firstChar !== requiredChar && firstChar !== dueumChar) {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg(`'${requiredChar}'(으)로 시작해야 해요`);
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 1500);
        return;
      }

      // Validate word exists
      if (!isValidWord(word)) {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg("없는 단어예요");
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 1500);
        return;
      }

      // Validate not used
      if (usedWords.has(word)) {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg("이미 사용한 단어예요");
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 1500);
        return;
      }

      // Valid word
      const newUsed = new Set(usedWords);
      newUsed.add(word);
      setUsedWords(newUsed);
      setWordHistory((h) => [...h, word]);
      const points = wordScore(word);
      setScore((s) => s + points);
      setWordCount((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
      setInputValue("");

      // Bonus time for 5 consecutive
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeLeft((t) => t + 5);
        setBonusMsg("+5초 보너스!");
        clearTimeout(bonusTimeout.current);
        bonusTimeout.current = setTimeout(() => setBonusMsg(""), 1500);
      }

      // Computer responds
      const computerWord = getComputerWord(getLastChar(word), newUsed);
      if (!computerWord) {
        // Computer can't answer, player wins bonus
        setScore((s) => s + 10);
        setCurrentWord(word);
        setTimeLeft(10);
        return;
      }

      newUsed.add(computerWord);
      setUsedWords(newUsed);
      setWordHistory((h) => [...h, computerWord]);
      setCurrentWord(computerWord);
      setTimeLeft(10);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [phase, inputValue, currentWord, usedWords, streak],
  );

  const handlePass = useCallback(() => {
    if (passes <= 0 || phase !== "playing") return;
    setPasses((p) => p - 1);
    setStreak(0);

    // Generate a new word for the player
    const lastChar = getLastChar(currentWord);
    const available = getWordsStartingWith(lastChar).filter(
      (w) => !usedWords.has(w),
    );
    if (available.length === 0) {
      endGame();
      return;
    }
    const newWord = available[Math.floor(Math.random() * available.length)];
    const newUsed = new Set(usedWords);
    newUsed.add(newWord);
    setUsedWords(newUsed);
    setWordHistory((h) => [...h, `(패스) ${newWord}`]);
    setCurrentWord(newWord);
    setTimeLeft(10);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [passes, phase, currentWord, usedWords, endGame]);

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      onComplete(score, { wordCount, maxStreak, passes: 3 - passes });
    }
  }, [phase, score, wordCount, maxStreak, passes, onComplete]);

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-sm flex-col items-center gap-6"
        >
          <h1 className="text-2xl font-bold text-white">끝말잇기</h1>
          <p className="text-center text-sm text-white/60">
            컴퓨터와 끝말잇기 대결!
            <br />
            마지막 글자로 시작하는 단어를 입력하세요
          </p>
          <div className="flex gap-4 text-sm text-white/40">
            <span>⏱ 10초/단어</span>
            <span>❤️ 3목숨</span>
            <span>⏭ 3패스</span>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-violet-500 py-3 text-lg font-bold text-white transition-colors hover:bg-violet-400"
          >
            시작하기
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/50 transition-colors hover:text-white/80"
          >
            돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  // Game over screen
  if (phase === "over") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl bg-slate-800 p-8"
        >
          <h2 className="text-2xl font-bold text-white">게임 종료</h2>
          <div className="text-5xl font-black tabular-nums text-white">
            {score.toLocaleString()}
          </div>
          <div className="flex w-full gap-3">
            <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">단어 수</span>
              <span className="text-lg font-bold text-white">{wordCount}</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-xl bg-white/5 p-3">
              <span className="text-xs text-white/50">최대 연속</span>
              <span className="text-lg font-bold text-white">{maxStreak}</span>
            </div>
          </div>
          {/* Word history */}
          <div className="max-h-32 w-full overflow-y-auto rounded-xl bg-white/5 p-3">
            <div className="flex flex-wrap gap-1.5">
              {wordHistory.map((w, i) => (
                <span
                  key={i}
                  className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-violet-500 py-3 text-base font-semibold text-white transition-colors hover:bg-violet-400"
          >
            다시 하기
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl bg-white/10 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20"
          >
            나가기
          </button>
        </motion.div>
      </div>
    );
  }

  // Playing screen
  const lastChar = getLastChar(currentWord);
  const timerFraction = timeLeft / 10;

  return (
    <motion.div
      animate={shaking ? { x: [-6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col bg-slate-900"
    >
      {/* Top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
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
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < lives ? "" : "opacity-20"}`}
              >
                ❤️
              </span>
            ))}
          </div>
          <span className="text-2xl font-bold tabular-nums text-white">
            {score}
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${timerFraction * 100}%`,
              backgroundColor:
                timerFraction > 0.5
                  ? "#22C55E"
                  : timerFraction > 0.25
                    ? "#F59E0B"
                    : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center gap-6 px-4 pt-20 pb-8">
        {/* Current word display */}
        <div className="flex flex-col items-center gap-2 pt-6">
          <span className="text-sm text-white/40">현재 단어</span>
          <motion.div
            key={currentWord}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-white"
          >
            {currentWord.split("").map((char, i) => (
              <span
                key={i}
                className={i === currentWord.length - 1 ? "text-red-400" : ""}
              >
                {char}
              </span>
            ))}
          </motion.div>
          <span className="text-sm text-white/50">
            &apos;<span className="font-bold text-red-400">{lastChar}</span>
            &apos;(으)로 시작하는 단어를 입력하세요
          </span>
        </div>

        {/* Streak */}
        {streak >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-sm font-bold text-orange-400"
          >
            🔥 {streak}연속!
          </motion.div>
        )}

        {/* Bonus message */}
        <AnimatePresence>
          {bonusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-green-400"
            >
              {bonusMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`'${lastChar}'(으)로 시작하는 단어`}
            className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-lg text-white placeholder-white/30 outline-none ring-2 ring-transparent focus:ring-violet-500"
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="rounded-xl bg-violet-500 px-5 py-3 font-bold text-white transition-colors hover:bg-violet-400"
          >
            입력
          </button>
        </form>

        {/* Error message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold text-red-400"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pass button */}
        <button
          type="button"
          onClick={handlePass}
          disabled={passes <= 0}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          패스 ({passes}회 남음)
        </button>

        {/* Used words (last 5) */}
        <div className="w-full max-w-sm">
          <span className="text-xs text-white/30">사용한 단어</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {wordHistory.slice(-8).map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60"
              >
                {w}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
