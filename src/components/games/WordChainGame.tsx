"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KOREAN_WORDS,
  applyDueum,
  getWordsStartingWith,
  isValidWord,
} from "@/data/words-ko";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface WordChainGameProps {
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

// --- Rare character bonus logic ---
const RARE_CHARS = new Set([
  "ㅎ",
  "ㅊ",
  "ㅋ",
  "ㅍ",
  "ㅌ",
  "ㄲ",
  "ㄸ",
  "ㅃ",
  "ㅆ",
  "ㅉ",
]);

// Korean character decomposition to get the initial consonant (초성)
function getInitialConsonant(char: string): string {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return char;
  const initialIndex = Math.floor(code / 588);
  const initials = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];
  return initials[initialIndex];
}

function isRareStartChar(word: string): boolean {
  if (!word) return false;
  return RARE_CHARS.has(getInitialConsonant(word[0]));
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

// --- Floating score pop component ---
function ScorePop({
  text,
  color = "text-yellow-300",
}: {
  text: string;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.3 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`pointer-events-none absolute text-lg font-black ${color}`}
      style={{ textShadow: "0 0 12px rgba(255,255,255,0.4)" }}
    >
      {text}
    </motion.div>
  );
}

// --- Circular timer ring ---
function CircularTimer({
  fraction,
  size = 56,
  stroke = 4,
}: {
  fraction: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const color =
    fraction > 0.5
      ? "stroke-emerald-400"
      : fraction > 0.25
        ? "stroke-yellow-400"
        : "stroke-red-500";
  const isPulsing = fraction <= 0.5 && fraction > 0; // pulse when < 5s

  return (
    <motion.svg
      width={size}
      height={size}
      className={`-rotate-90 ${isPulsing && fraction <= 0.25 ? "" : ""}`}
      animate={
        fraction <= 0.25 && fraction > 0
          ? { scale: [1, 1.08, 1] }
          : { scale: 1 }
      }
      transition={
        fraction <= 0.25 && fraction > 0
          ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-white/10"
        strokeWidth={stroke}
      />
      {/* Active ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={`${color} transition-colors duration-300`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </motion.svg>
  );
}

export default function WordChainGame({
  onComplete,
  onBack,
}: WordChainGameProps) {
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [currentWord, setCurrentWord] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [wordHistory, setWordHistory] = useState<
    { word: string; isPlayer: boolean }[]
  >([]);
  const [score, setScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [passes, setPasses] = useState(3);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [longestWord, setLongestWord] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  // Floating score pops
  const [scorePops, setScorePops] = useState<
    { id: number; text: string; color: string }[]
  >([]);
  const popIdRef = useRef(0);

  // Best score from localStorage
  const [bestScore, setBestScore] = useState(0);
  useEffect(() => {
    const saved = localStorage.getItem("neuroflex_wordchain_best");
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_wordchain_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const errorTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wordListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll word list to bottom
  useEffect(() => {
    if (wordListRef.current) {
      wordListRef.current.scrollTop = wordListRef.current.scrollHeight;
    }
  }, [wordHistory]);

  const addScorePop = useCallback((text: string, color = "text-yellow-300") => {
    const id = ++popIdRef.current;
    setScorePops((prev) => [...prev, { id, text, color }]);
    setTimeout(() => {
      setScorePops((prev) => prev.filter((p) => p.id !== id));
    }, 1100);
  }, []);

  const endGame = useCallback(() => {
    setPhase("over");
    clearInterval(timerRef.current);
    SoundEffects.gameOver();
    Haptic.wrong();
  }, []);

  const startGame = useCallback(() => {
    const startWord = getRandomStartWord();
    const used = new Set<string>([startWord]);
    setPhase("playing");
    setCurrentWord(startWord);
    setInputValue("");
    setUsedWords(used);
    setWordHistory([{ word: startWord, isPlayer: false }]);
    setScore(0);
    setWordCount(0);
    setPasses(3);
    setLives(3);
    setTimeLeft(10);
    setStreak(0);
    setMaxStreak(0);
    setErrorMsg("");
    setLongestWord(startWord);
    setScorePops([]);
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
          errorTimeout.current = setTimeout(() => setErrorMsg(""), 2000);
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
        SoundEffects.wrong();
        Haptic.wrong();
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg(`'${requiredChar}'(으)로 시작해야 해요`);
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 2000);
        return;
      }

      // Validate word exists
      if (!isValidWord(word)) {
        SoundEffects.wrong();
        Haptic.wrong();
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg("없는 단어예요");
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 2000);
        return;
      }

      // Validate not used
      if (usedWords.has(word)) {
        SoundEffects.wrong();
        Haptic.wrong();
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setErrorMsg("이미 사용한 단어예요");
        clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setErrorMsg(""), 2000);
        return;
      }

      // Valid word
      const newUsed = new Set(usedWords);
      newUsed.add(word);
      setUsedWords(newUsed);
      setWordHistory((h) => [...h, { word, isPlayer: true }]);
      let points = wordScore(word);
      const newStreak = streak + 1;
      let totalBonus = 0;

      // Word length bonus
      if (word.length >= 4) {
        const lengthBonus = word.length >= 5 ? 5 : 2;
        totalBonus += lengthBonus;
        addScorePop(`+길이 보너스! +${lengthBonus}`, "text-cyan-300");
      }

      // Rare character bonus
      if (isRareStartChar(word)) {
        const rareBonus = 3;
        totalBonus += rareBonus;
        setTimeout(() => {
          addScorePop(`+희귀 글자 보너스! +${rareBonus}`, "text-purple-300");
        }, 300);
      }

      // Combo bonus
      if (newStreak > 2) {
        const comboBonus = newStreak;
        totalBonus += comboBonus;
      }

      points += totalBonus;
      setScore((s) => s + points);
      addScorePop(`+${points}`, "text-yellow-300");
      setWordCount((c) => c + 1);
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
      setInputValue("");

      // Track longest word
      if (word.length > longestWord.length) {
        setLongestWord(word);
      }

      // Time extension: +2 seconds for each correct word
      setTimeLeft((t) => Math.min(t + 2, 15));

      if (newStreak > 2) {
        SoundEffects.combo(newStreak);
        Haptic.combo();
      } else {
        SoundEffects.correct();
        Haptic.correct();
      }

      // Bonus time for 5 consecutive
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeLeft((t) => Math.min(t + 5, 20));
        addScorePop("+5초 보너스!", "text-green-300");
      }

      // Computer responds
      const computerWord = getComputerWord(getLastChar(word), newUsed);
      if (!computerWord) {
        // Computer can't answer, player wins bonus
        setScore((s) => s + 10);
        addScorePop("+10 승리 보너스!", "text-amber-300");
        setCurrentWord(word);
        setTimeLeft(10);
        return;
      }

      newUsed.add(computerWord);
      setUsedWords(newUsed);
      setWordHistory((h) => [...h, { word: computerWord, isPlayer: false }]);
      setCurrentWord(computerWord);
      setTimeLeft(10);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [
      phase,
      inputValue,
      currentWord,
      usedWords,
      streak,
      longestWord,
      addScorePop,
    ],
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
    setWordHistory((h) => [
      ...h,
      { word: `(패스) ${newWord}`, isPlayer: false },
    ]);
    setCurrentWord(newWord);
    setTimeLeft(10);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [passes, phase, currentWord, usedWords, endGame]);

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      // Save best score
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem("neuroflex_wordchain_best", String(score));
      }
      onComplete(score, { wordCount, maxStreak, passes: 3 - passes });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // --- READY SCREEN ---
  if (phase === "ready") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        {/* Subtle animated pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orbs */}
        <motion.div
          className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full bg-indigo-500/20 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8"
        >
          {/* Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <h1
                className="bg-gradient-to-r from-violet-300 via-indigo-300 to-purple-300 bg-clip-text text-4xl font-black tracking-tight text-transparent"
                style={{
                  textShadow: "0 0 40px rgba(139,92,246,0.3)",
                }}
              >
                끝말잇기
              </h1>
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </div>
            <p className="text-center text-sm leading-relaxed text-white/50">
              컴퓨터와 끝말잇기 대결!
              <br />
              마지막 글자로 시작하는 단어를 입력하세요
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex gap-3 text-sm">
            {[
              { icon: "⏱", label: "10초" },
              { icon: "❤️", label: "3목숨" },
              { icon: "⏭", label: "3패스" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/50 backdrop-blur-sm"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Best score */}
          {bestScore > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xs tracking-wider text-white/30 uppercase">
                최고 기록
              </span>
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-2xl font-black tabular-nums text-transparent">
                {bestScore.toLocaleString()}
              </span>
            </motion.div>
          )}

          {/* Start button */}
          <motion.button
            type="button"
            onClick={startGame}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-xl hover:shadow-violet-500/30"
          >
            {/* Glow pulse on button */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-indigo-400/20"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative">시작하기</span>
          </motion.button>

          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            돌아가기
          </button>
        </motion.div>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <TutorialModal onClose={() => setShowTutorial(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- GAME OVER SCREEN ---
  if (phase === "over") {
    const allWords = wordHistory
      .filter((w) => !w.word.startsWith("(패스)"))
      .map((w) => w.word);
    const playerWords = wordHistory.filter((w) => w.isPlayer);
    const longest =
      longestWord ||
      (allWords.length > 0
        ? allWords.reduce((a, b) => (a.length > b.length ? a : b))
        : "-");

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-white/90"
          >
            게임 종료
          </motion.h2>

          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex flex-col items-center gap-1"
          >
            <span
              className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-6xl font-black tabular-nums text-transparent"
              style={{
                textShadow: "0 0 40px rgba(251,191,36,0.3)",
              }}
            >
              {score.toLocaleString()}
            </span>
            {score > bestScore && score > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs font-bold tracking-wider text-amber-400 uppercase"
              >
                NEW BEST!
              </motion.span>
            )}
          </motion.div>

          {/* Stats grid - staggered reveal */}
          <div className="grid w-full grid-cols-2 gap-3">
            {[
              {
                label: "단어 수",
                value: `${playerWords.length}개`,
                delay: 0.3,
              },
              { label: "최대 콤보", value: `${maxStreak}x`, delay: 0.4 },
              { label: "최장 단어", value: longest, delay: 0.5 },
              {
                label: "사용 패스",
                value: `${3 - passes}회`,
                delay: 0.6,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay }}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/5 bg-white/5 p-3"
              >
                <span className="text-[10px] tracking-wider text-white/40 uppercase">
                  {stat.label}
                </span>
                <span className="text-lg font-bold text-white/90">
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Word history */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="max-h-36 w-full overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-3"
          >
            <div className="flex flex-wrap gap-1.5">
              {wordHistory.map((entry, i) => (
                <span
                  key={i}
                  className={`rounded-lg px-2 py-0.5 text-xs ${
                    entry.isPlayer
                      ? "bg-indigo-500/20 text-indigo-300"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {entry.word}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex w-full flex-col gap-3"
          >
            <motion.button
              type="button"
              onClick={startGame}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-base font-bold text-white shadow-lg shadow-violet-500/20"
            >
              다시 하기
            </motion.button>
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-base font-semibold text-white/70 transition-colors hover:bg-white/10"
            >
              나가기
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // --- PLAYING SCREEN ---
  const lastChar = getLastChar(currentWord);
  const timerFraction = timeLeft / 10;
  const timerSeconds = Math.ceil(timeLeft);

  return (
    <motion.div
      animate={shaking ? { x: [-8, 8, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-screen flex-col"
    >
      {/* Dark gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900" />
      {/* Subtle dot pattern */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10"
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

          {/* Center: Timer ring + seconds */}
          <div className="relative flex items-center justify-center">
            <CircularTimer fraction={timerFraction} size={48} stroke={3} />
            <span
              className={`absolute text-sm font-bold tabular-nums ${
                timerFraction > 0.5
                  ? "text-emerald-400"
                  : timerFraction > 0.25
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {timerSeconds}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Lives */}
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={
                    i === lives - 1 && lives <= 1 ? { scale: [1, 1.2, 1] } : {}
                  }
                  transition={
                    i === lives - 1 && lives <= 1
                      ? { duration: 0.8, repeat: Infinity }
                      : {}
                  }
                  className={`text-base ${i < lives ? "" : "opacity-20"}`}
                >
                  ❤️
                </motion.span>
              ))}
            </div>
            {/* Score */}
            <div className="relative">
              <motion.span
                key={score}
                initial={{ scale: 1.3, color: "#fbbf24" }}
                animate={{ scale: 1, color: "#ffffff" }}
                transition={{ duration: 0.4 }}
                className="text-xl font-black tabular-nums text-white"
              >
                {score}
              </motion.span>
              {/* Score pops */}
              <AnimatePresence>
                {scorePops.map((pop) => (
                  <ScorePop key={pop.id} text={pop.text} color={pop.color} />
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timer bar */}
        <div className="px-4 pb-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${timerFraction * 100}%`,
                backgroundColor:
                  timerFraction > 0.5
                    ? "#34D399"
                    : timerFraction > 0.25
                      ? "#FBBF24"
                      : "#EF4444",
                boxShadow:
                  timerFraction <= 0.25
                    ? "0 0 12px rgba(239,68,68,0.5)"
                    : "none",
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col px-4 pt-24 pb-4">
        {/* Word count + combo area */}
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs font-medium text-white/30">
            {wordCount > 0
              ? `${wordCount}번째 단어`
              : "첫 번째 단어를 입력하세요"}
          </span>

          {/* Combo meter */}
          <AnimatePresence>
            {streak >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-1.5"
              >
                {/* Streak bar */}
                <div className="relative h-2 w-20 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((streak / 10) * 100, 100)}%`,
                    }}
                    style={{
                      boxShadow: "0 0 8px rgba(249,115,22,0.6)",
                    }}
                  />
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1.3, 1] }}
                  className="whitespace-nowrap text-xs font-black text-orange-400"
                  style={{
                    textShadow:
                      streak >= 5 ? "0 0 8px rgba(249,115,22,0.5)" : "none",
                  }}
                >
                  COMBO x{streak}!
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat bubble word history */}
        <div
          ref={wordListRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto pb-4"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          <AnimatePresence initial={false}>
            {wordHistory.map((entry, i) => {
              const isPlayer = entry.isPlayer;
              const prevWord = i > 0 ? wordHistory[i - 1].word : null;
              const connectChar = prevWord
                ? getLastChar(
                    prevWord.startsWith("(패스)")
                      ? prevWord.replace("(패스) ", "")
                      : prevWord,
                  )
                : null;

              return (
                <motion.div
                  key={`${entry.word}-${i}`}
                  initial={{
                    opacity: 0,
                    x: isPlayer ? 40 : -40,
                    y: 10,
                  }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                  className={`flex ${isPlayer ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-0.5">
                    {/* Connecting character indicator */}
                    {connectChar && i > 0 && (
                      <span
                        className={`text-[10px] text-white/30 ${isPlayer ? "text-right pr-2" : "text-left pl-2"}`}
                      >
                        <span className="font-bold text-violet-400/60">
                          {connectChar}
                        </span>
                        {" ->"}
                      </span>
                    )}
                    {/* Bubble */}
                    <div
                      className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isPlayer
                          ? "rounded-br-md bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                          : "rounded-bl-md border border-white/10 bg-slate-800/80 text-white/90 shadow-lg shadow-black/20"
                      }`}
                    >
                      <span className="text-base font-bold tracking-wide">
                        {entry.word
                          .replace("(패스) ", "")
                          .split("")
                          .map((char, ci, arr) => (
                            <span
                              key={ci}
                              className={
                                ci === arr.length - 1 ? "text-amber-300" : ""
                              }
                            >
                              {char}
                            </span>
                          ))}
                      </span>
                      {entry.word.startsWith("(패스)") && (
                        <span className="ml-1.5 text-[10px] text-white/40">
                          패스
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[10px] text-white/25 ${isPlayer ? "text-right pr-1" : "pl-1"}`}
                    >
                      {isPlayer ? "나" : "AI"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Current word prompt */}
        <div className="flex flex-col items-center gap-1 pb-2">
          <span className="text-xs text-white/30">
            &apos;
            <span className="font-bold text-amber-400">{lastChar}</span>
            &apos;(으)로 시작하는 단어
          </span>
        </div>

        {/* Input area - glassmorphism */}
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full gap-2 pb-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={`'${lastChar}'(으)로 시작하는 단어`}
              className={`w-full rounded-2xl border bg-white/5 px-5 py-3.5 text-lg font-medium text-white placeholder-white/20 outline-none backdrop-blur-xl transition-all duration-300 ${
                inputFocused
                  ? "border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                  : "border-white/10"
              } ${shaking ? "border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : ""}`}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-xl hover:shadow-violet-500/35"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </form>

        {/* Error toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -10, x: "-50%" }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-24 left-1/2 z-50 rounded-2xl border border-red-500/20 bg-red-950/80 px-5 py-2.5 shadow-lg shadow-red-500/10 backdrop-blur-xl"
            >
              <span className="text-sm font-semibold text-red-300">
                {errorMsg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pass button */}
        <div className="flex justify-center pt-1 pb-2">
          <button
            type="button"
            onClick={handlePass}
            disabled={passes <= 0}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 disabled:opacity-30"
          >
            패스 ({passes}회 남음)
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Tutorial Modal Component (content unchanged) ---
function TutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-slate-800 p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-center text-lg font-bold text-white">
          끝말잇기 플레이 방법
        </h2>

        <div className="space-y-4 text-sm text-white/80">
          <div>
            <p className="mb-2 font-semibold text-indigo-300">목표</p>
            <p>상대방(AI)과 끝말잇기를 해서 최대한 오래 버티세요!</p>
          </div>

          <div>
            <p className="mb-2 font-semibold text-indigo-300">규칙</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>상대 단어의 마지막 글자로 시작하는 단어를 입력하세요</li>
              <li>
                예: &quot;사과&quot; → &quot;과일&quot; → &quot;일기&quot; → ...
              </li>
              <li>이미 사용한 단어는 다시 사용할 수 없습니다</li>
              <li>두음법칙이 적용됩니다 (례→예, 녀→여 등)</li>
            </ul>
          </div>

          <div>
            <p className="mb-2 font-semibold text-indigo-300">조작법</p>
            <p>입력창에 단어를 입력하고 전송 버튼을 누르세요</p>
          </div>

          <div>
            <p className="mb-1 font-semibold text-indigo-300">팁</p>
            <ul className="list-disc pl-4 space-y-1 text-white/60">
              <li>제한 시간 안에 답해야 합니다</li>
              <li>연속 정답 시 콤보 보너스!</li>
              <li>긴 단어일수록 높은 점수</li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
        >
          알겠어요!
        </button>
      </motion.div>
    </motion.div>
  );
}
