"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface MathRushGameProps {
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

interface Problem {
  expression: string;
  answer: number;
  problemType?: string;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
  x: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Roman numeral helpers for level 18
const ROMAN_VALUES: [string, number][] = [
  ["M", 1000],
  ["CM", 900],
  ["D", 500],
  ["CD", 400],
  ["C", 100],
  ["XC", 90],
  ["L", 50],
  ["XL", 40],
  ["X", 10],
  ["IX", 9],
  ["V", 5],
  ["IV", 4],
  ["I", 1],
];
function toRoman(num: number): string {
  let result = "";
  for (const [symbol, value] of ROMAN_VALUES) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

function generateProblem(level: number): Problem {
  let a: number, b: number, c: number, expression: string, answer: number;
  let problemType: string;
  switch (level) {
    case 1: // single digit +/-
      problemType = "기초 덧뺄셈";
      a = randomInt(1, 9);
      b = randomInt(1, 9);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
    case 2: // two digit +/-
      problemType = "두자리 덧뺄셈";
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
    case 3: // single digit ×
      problemType = "기초 곱셈";
      a = randomInt(2, 9);
      b = randomInt(2, 9);
      expression = `${a} × ${b}`;
      answer = a * b;
      break;
    case 4: // two×single digit
      problemType = "큰 곱셈";
      a = randomInt(11, 56);
      b = randomInt(2, 9);
      expression = `${a} × ${b}`;
      answer = a * b;
      break;
    case 5: // mixed ops
      problemType = "복합 연산";
      a = randomInt(5, 30);
      b = randomInt(5, 30);
      c = randomInt(1, 9);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b} - ${c}`;
        answer = a + b - c;
      } else {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        c = randomInt(1, 20);
        expression = `${a} × ${b} + ${c}`;
        answer = a * b + c;
      }
      break;
    case 6: {
      // division
      problemType = "나눗셈";
      b = randomInt(2, 12);
      const quotient6 = randomInt(2, 12);
      a = b * quotient6;
      expression = `${a} ÷ ${b}`;
      answer = quotient6;
      break;
    }
    case 7: // three digit +/-
      problemType = "큰 수 계산";
      a = randomInt(100, 999);
      b = randomInt(100, 999);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b}`;
        answer = a + b;
      } else {
        if (a < b) [a, b] = [b, a];
        expression = `${a} - ${b}`;
        answer = a - b;
      }
      break;
    case 8: // three number operations
      problemType = "세 수 연산";
      a = randomInt(10, 50);
      b = randomInt(2, 9);
      c = randomInt(10, 50);
      if (Math.random() < 0.5) {
        expression = `${a} + ${b} × ${c}`;
        answer = a + b * c;
      } else {
        expression = `${a} × ${b} + ${c}`;
        answer = a * b + c;
      }
      break;
    case 9: {
      // Squares and square roots
      problemType = "제곱 & 제곱근";
      if (Math.random() < 0.5) {
        a = randomInt(2, 15);
        expression = `${a}² = ?`;
        answer = a * a;
      } else {
        a = randomInt(2, 12);
        const sq = a * a;
        expression = `√${sq} = ?`;
        answer = a;
      }
      break;
    }
    case 10: {
      // Percentage calculations
      problemType = "백분율 계산";
      const percents = [10, 20, 25, 30, 40, 50, 60, 75, 80, 90];
      const pct = percents[randomInt(0, percents.length - 1)];
      // Pick base so result is whole number
      const bases = [20, 40, 50, 60, 80, 100, 120, 200, 400, 500];
      b = bases[randomInt(0, bases.length - 1)];
      expression = `${pct}% of ${b} = ?`;
      answer = (pct * b) / 100;
      break;
    }
    case 11: {
      // Fraction comparisons - "which is bigger" as a numerical answer
      problemType = "분수 비교";
      // Generate two fractions, ask for the bigger one as decimal×denominator product
      // Simpler approach: convert fraction to number
      const pairs: [number, number, number, number][] = [
        [3, 4, 2, 3],
        [1, 2, 2, 5],
        [5, 8, 3, 5],
        [7, 10, 2, 3],
        [4, 5, 3, 4],
        [5, 6, 7, 9],
        [1, 3, 2, 7],
        [3, 8, 1, 3],
        [2, 3, 5, 8],
        [4, 7, 3, 5],
      ];
      const pair = pairs[randomInt(0, pairs.length - 1)];
      const [n1, d1, n2, d2] = pair;
      const v1 = n1 / d1;
      const v2 = n2 / d2;
      if (Math.random() < 0.5) {
        // Ask: n1/d1 + n2/d2 (find common denominator, give integer answer)
        // Instead, simpler: "Which is bigger? Answer the numerator of the bigger one"
        expression = `${n1}/${d1} vs ${n2}/${d2} 큰 쪽 분자?`;
        answer = v1 >= v2 ? n1 : n2;
      } else {
        // Fraction to decimal: what is n/d × d (trivial) - let's do fraction addition
        // Simple fraction question: what is n/d of X?
        a = randomInt(2, 5) * d1; // ensure whole number result
        expression = `${n1}/${d1} × ${a} = ?`;
        answer = (n1 * a) / d1;
      }
      break;
    }
    case 12: {
      // Order of operations
      problemType = "연산 순서";
      const variant = randomInt(0, 2);
      if (variant === 0) {
        a = randomInt(2, 10);
        b = randomInt(2, 8);
        c = randomInt(1, 5);
        expression = `${a} + ${b} × ${c} = ?`;
        answer = a + b * c;
      } else if (variant === 1) {
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        c = randomInt(1, 10);
        expression = `${a} × ${b} - ${c} = ?`;
        answer = a * b - c;
      } else {
        a = randomInt(1, 8);
        b = randomInt(1, 8);
        c = randomInt(2, 6);
        expression = `(${a} + ${b}) × ${c} = ?`;
        answer = (a + b) * c;
      }
      break;
    }
    case 13: {
      // Powers of 2
      problemType = "거듭제곱";
      if (Math.random() < 0.6) {
        a = randomInt(2, 10);
        expression = `2^${a} = ?`;
        answer = Math.pow(2, a);
      } else {
        a = randomInt(2, 5);
        b = randomInt(2, 4);
        expression = `${a}^${b} = ?`;
        answer = Math.pow(a, b);
      }
      break;
    }
    case 14: {
      // Negative number arithmetic
      problemType = "음수 연산";
      const variant14 = randomInt(0, 2);
      if (variant14 === 0) {
        a = -randomInt(1, 15);
        b = randomInt(1, 20);
        expression = `(${a}) + ${b} = ?`;
        answer = a + b;
      } else if (variant14 === 1) {
        a = -randomInt(1, 9);
        b = randomInt(2, 9);
        expression = `(${a}) × ${b} = ?`;
        answer = a * b;
      } else {
        a = -randomInt(1, 10);
        b = -randomInt(1, 10);
        expression = `(${a}) + (${b}) = ?`;
        answer = a + b;
      }
      break;
    }
    case 15: {
      // Missing number puzzles
      problemType = "빈칸 채우기";
      const variant15 = randomInt(0, 2);
      if (variant15 === 0) {
        a = randomInt(3, 20);
        b = randomInt(1, 15);
        answer = a - b;
        expression = `? + ${b} = ${a}`;
      } else if (variant15 === 1) {
        a = randomInt(2, 12);
        b = randomInt(2, 9);
        answer = a;
        expression = `? × ${b} = ${a * b}`;
      } else {
        a = randomInt(10, 50);
        b = randomInt(1, a - 1);
        answer = a - b;
        expression = `${a} - ? = ${b}`;
      }
      break;
    }
    case 16: {
      // Modular arithmetic
      problemType = "나머지 연산";
      b = randomInt(2, 10);
      a = randomInt(b + 1, b * 10 + randomInt(1, b - 1));
      answer = a % b;
      expression = `${a} mod ${b} = ?`;
      break;
    }
    case 17: {
      // Number sequences
      problemType = "수열 추론";
      const seqType = randomInt(0, 3);
      if (seqType === 0) {
        // Geometric: multiply by 2 or 3
        const ratio = randomInt(2, 3);
        a = randomInt(1, 5);
        const seq = [a, a * ratio, a * ratio ** 2, a * ratio ** 3];
        answer = a * ratio ** 4;
        expression = `${seq.join(", ")}, ? = ?`;
      } else if (seqType === 1) {
        // Arithmetic: add constant
        const diff = randomInt(2, 7);
        a = randomInt(1, 10);
        const seq = [a, a + diff, a + diff * 2, a + diff * 3];
        answer = a + diff * 4;
        expression = `${seq.join(", ")}, ? = ?`;
      } else if (seqType === 2) {
        // Squares: 1, 4, 9, 16, ?
        a = randomInt(1, 4);
        const seq = [a ** 2, (a + 1) ** 2, (a + 2) ** 2, (a + 3) ** 2];
        answer = (a + 4) ** 2;
        expression = `${seq.join(", ")}, ? = ?`;
      } else {
        // Fibonacci-like
        a = randomInt(1, 5);
        b = randomInt(1, 5);
        const s3 = a + b,
          s4 = b + s3,
          s5 = s3 + s4;
        expression = `${a}, ${b}, ${s3}, ${s4}, ? = ?`;
        answer = s5;
      }
      break;
    }
    case 18: {
      // Roman numeral conversion
      problemType = "로마 숫자";
      if (Math.random() < 0.5) {
        a = randomInt(1, 50);
        expression = `${toRoman(a)} = ?`;
        answer = a;
      } else {
        a = randomInt(1, 39);
        b = randomInt(1, 39);
        const sum = a + b;
        expression = `${toRoman(a)} + ${toRoman(b)} = ?`;
        answer = sum;
      }
      break;
    }
    case 19: {
      // Base conversion (binary/other to decimal)
      problemType = "진법 변환";
      if (Math.random() < 0.6) {
        // Binary to decimal
        a = randomInt(2, 31);
        expression = `이진수 ${a.toString(2)} = ?`;
        answer = a;
      } else {
        // Octal to decimal
        a = randomInt(8, 63);
        expression = `8진수 ${a.toString(8)} = ?`;
        answer = a;
      }
      break;
    }
    case 20:
    default: {
      // Complex multi-step
      problemType = "복합 사고";
      const variant20 = randomInt(0, 3);
      if (variant20 === 0) {
        // a² + b²
        a = randomInt(2, 9);
        b = randomInt(2, 9);
        expression = `${a}² + ${b}² = ?`;
        answer = a * a + b * b;
      } else if (variant20 === 1) {
        // a × (b + c) - d
        a = randomInt(2, 6);
        b = randomInt(2, 8);
        c = randomInt(1, 8);
        const d = randomInt(1, 10);
        expression = `${a} × (${b} + ${c}) - ${d} = ?`;
        answer = a * (b + c) - d;
      } else if (variant20 === 2) {
        // (a + b)²
        a = randomInt(1, 7);
        b = randomInt(1, 7);
        expression = `(${a} + ${b})² = ?`;
        answer = (a + b) * (a + b);
      } else {
        // a³ - b
        a = randomInt(2, 5);
        b = randomInt(1, 20);
        expression = `${a}³ - ${b} = ?`;
        answer = a * a * a - b;
      }
      break;
    }
  }
  return { expression, answer, problemType };
}

function generateChoices(correct: number): number[] {
  const choices = new Set<number>([correct]);
  let attempts = 0;
  while (choices.size < 3 && attempts < 50) {
    attempts++;
    const offset = randomInt(
      1,
      Math.max(3, Math.abs(Math.floor(correct * 0.1))),
    );
    const wrong = Math.random() < 0.5 ? correct + offset : correct - offset;
    if (wrong !== correct) choices.add(wrong);
  }
  // Fallback
  while (choices.size < 3) {
    choices.add(correct + choices.size * 7);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}

const LEVEL_NAMES = [
  "",
  "Lv.1 기초",
  "Lv.2 덧뺄셈",
  "Lv.3 곱셈",
  "Lv.4 큰곱셈",
  "Lv.5 복합",
  "Lv.6 나눗셈",
  "Lv.7 큰수",
  "Lv.8 세수연산",
  "Lv.9 제곱근",
  "Lv.10 백분율",
  "Lv.11 분수",
  "Lv.12 연산순서",
  "Lv.13 거듭제곱",
  "Lv.14 음수",
  "Lv.15 빈칸",
  "Lv.16 나머지",
  "Lv.17 수열",
  "Lv.18 로마숫자",
  "Lv.19 진법",
  "Lv.20 복합사고",
];

const DIFFICULTY_LABELS = [
  "",
  "쉬움", // 1
  "쉬움", // 2
  "보통", // 3
  "보통", // 4
  "보통", // 5
  "어려움", // 6
  "어려움", // 7
  "어려움", // 8
  "고급", // 9
  "고급", // 10
  "고급", // 11
  "고급", // 12
  "전문가", // 13
  "전문가", // 14
  "전문가", // 15
  "전문가", // 16
  "극한", // 17
  "극한", // 18
  "극한", // 19
  "전설", // 20
];

const DIFFICULTY_COLORS = [
  "",
  "#22C55E", // 1
  "#22C55E", // 2
  "#F59E0B", // 3
  "#F59E0B", // 4
  "#F59E0B", // 5
  "#EF4444", // 6
  "#EF4444", // 7
  "#EF4444", // 8
  "#A855F7", // 9
  "#A855F7", // 10
  "#A855F7", // 11
  "#A855F7", // 12
  "#EC4899", // 13
  "#EC4899", // 14
  "#EC4899", // 15
  "#EC4899", // 16
  "#DC2626", // 17
  "#DC2626", // 18
  "#DC2626", // 19
  "#FFD700", // 20
];

// Background gradient presets per level
const LEVEL_GRADIENTS = [
  "",
  "from-slate-900 via-indigo-950 to-slate-900", // 1
  "from-slate-900 via-blue-950 to-slate-900", // 2
  "from-slate-900 via-violet-950 to-slate-900", // 3
  "from-slate-900 via-purple-950 to-slate-900", // 4
  "from-slate-900 via-fuchsia-950 to-slate-900", // 5
  "from-slate-900 via-rose-950 to-slate-900", // 6
  "from-slate-900 via-red-950 to-slate-900", // 7
  "from-slate-900 via-orange-950 to-slate-900", // 8
  "from-slate-900 via-amber-950 to-slate-900", // 9
  "from-slate-900 via-yellow-950 to-slate-900", // 10
  "from-slate-900 via-lime-950 to-slate-900", // 11
  "from-slate-900 via-emerald-950 to-slate-900", // 12
  "from-slate-900 via-teal-950 to-slate-900", // 13
  "from-slate-900 via-cyan-950 to-slate-900", // 14
  "from-slate-900 via-sky-950 to-slate-900", // 15
  "from-slate-900 via-blue-950 to-slate-900", // 16
  "from-slate-900 via-violet-950 to-slate-900", // 17
  "from-slate-900 via-purple-950 to-slate-900", // 18
  "from-slate-900 via-fuchsia-950 to-slate-900", // 19
  "from-gray-900 via-yellow-900 to-gray-900", // 20
];

// Animated score counter component
function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(value);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  useEffect(() => {
    targetRef.current = value;
    const animate = () => {
      setDisplay((prev) => {
        const diff = targetRef.current - prev;
        if (Math.abs(diff) < 1) return targetRef.current;
        const step = Math.ceil(Math.abs(diff) * 0.2);
        return prev + Math.sign(diff) * step;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

// Ripple effect component
function RippleButton({
  children,
  onClick,
  className,
  disabled,
  buttonKey,
  style,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  buttonKey: string;
  style?: React.CSSProperties;
}) {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      600,
    );
    onClick();
  };

  return (
    <motion.button
      key={buttonKey}
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </motion.button>
  );
}

// Streak dots component
function StreakDots({ count, max }: { count: number; max: number }) {
  const dots = Math.min(count, max);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          initial={i === dots - 1 && dots > 0 ? { scale: 0 } : false}
          animate={
            i < dots ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0.2 }
          }
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`h-2.5 w-2.5 rounded-full ${
            i < dots
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function MathRushGame({
  onComplete,
  onBack,
}: MathRushGameProps) {
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentProblem, setCurrentProblem] = useState<Problem>({
    expression: "",
    answer: 0,
  });
  const [choices, setChoices] = useState<number[]>([]);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [levelMsg, setLevelMsg] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<number | null>(
    null,
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const problemStartTime = useRef<number>(Date.now());
  const floatingIdRef = useRef(0);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_mathrush_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const levelTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const addFloatingText = useCallback((text: string, color: string) => {
    const id = ++floatingIdRef.current;
    const x = randomInt(20, 80);
    setFloatingTexts((prev) => [...prev, { id, text, color, x }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  }, []);

  const loadNewProblem = useCallback((lvl: number) => {
    const problem = generateProblem(lvl);
    setCurrentProblem(problem);
    setChoices(generateChoices(problem.answer));
    setSelectedAnswer(null);
    problemStartTime.current = Date.now();
  }, []);

  const endGame = useCallback(() => {
    setPhase("over");
    clearInterval(timerRef.current);
    SoundEffects.gameOver();
    Haptic.wrong();
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLevel(1);
    setLives(3);
    setConsecutiveCorrect(0);
    setConsecutiveWrong(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    setFeedback(null);
    setLevelMsg("");
    setShowCorrectAnswer(null);
    setFloatingTexts([]);
    setSelectedAnswer(null);
    loadNewProblem(1);
  }, [loadNewProblem]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          endGame();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, endGame]);

  const handleAnswer = useCallback(
    (chosenAnswer: number) => {
      if (phase !== "playing" || feedback) return;

      const isCorrect = chosenAnswer === currentProblem.answer;
      const answerTime = Date.now() - problemStartTime.current;
      setSelectedAnswer(chosenAnswer);

      if (isCorrect) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        const comboMultiplier = 1 + (newCombo - 1) * 0.1;
        const points = Math.round(level * 10 * comboMultiplier);
        setScore((s) => s + points);
        setTotalCorrect((c) => c + 1);
        setConsecutiveWrong(0);

        // Speed bonus - answered within 2 seconds
        if (answerTime < 2000) {
          addFloatingText("+FAST!", "#60A5FA");
        }

        // Time bonus for consecutive correct answers
        const newConsCorrect = consecutiveCorrect + 1;
        setConsecutiveCorrect(newConsCorrect);

        if (newConsCorrect >= 2) {
          const bonusTime = Math.min(newConsCorrect * 0.5, 3);
          setTimeLeft((t) => Math.min(60, t + bonusTime));
          addFloatingText(`+${bonusTime.toFixed(1)}s`, "#34D399");
        }

        // Combo floating text
        if (newCombo > 2) {
          addFloatingText(`+${newCombo} combo`, "#F97316");
        }

        // Level up check
        if (newConsCorrect >= 3 && level < 20) {
          const newLevel = level + 1;
          setLevel(newLevel);
          setConsecutiveCorrect(0);
          setLevelMsg("LEVEL UP!");
          SoundEffects.levelUp();
          Haptic.achievement();
          clearTimeout(levelTimeout.current);
          levelTimeout.current = setTimeout(() => setLevelMsg(""), 1500);
          setFeedback("correct");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            loadNewProblem(newLevel);
          }, 400);
        } else {
          if (newCombo > 2) {
            SoundEffects.combo(newCombo);
            Haptic.combo();
          } else {
            SoundEffects.correct();
            Haptic.correct();
          }
          setFeedback("correct");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            loadNewProblem(level);
          }, 300);
        }
      } else {
        setCombo(0);
        SoundEffects.wrong();
        Haptic.wrong();
        setTotalWrong((w) => w + 1);
        setConsecutiveCorrect(0);
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        setShowCorrectAnswer(currentProblem.answer);

        const newConsWrong = consecutiveWrong + 1;
        setConsecutiveWrong(newConsWrong);

        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            endGame();
            return 0;
          }
          return newLives;
        });

        // Level down check
        if (newConsWrong >= 2 && level > 1) {
          const newLevel = level - 1;
          setLevel(newLevel);
          setConsecutiveWrong(0);
          setLevelMsg("Level Down");
          clearTimeout(levelTimeout.current);
          levelTimeout.current = setTimeout(() => setLevelMsg(""), 1200);
          setFeedback("wrong");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowCorrectAnswer(null);
            loadNewProblem(newLevel);
          }, 800);
        } else {
          setFeedback("wrong");
          clearTimeout(feedbackTimeout.current);
          feedbackTimeout.current = setTimeout(() => {
            setFeedback(null);
            setShowCorrectAnswer(null);
            loadNewProblem(level);
          }, 800);
        }
      }
    },
    [
      phase,
      feedback,
      currentProblem,
      combo,
      level,
      consecutiveCorrect,
      consecutiveWrong,
      endGame,
      loadNewProblem,
      addFloatingText,
    ],
  );

  // Game over effect
  useEffect(() => {
    if (phase === "over") {
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;
      onComplete(score, {
        accuracy,
        totalCorrect,
        totalWrong,
        maxCombo,
        maxLevel: level,
      });
    }
  }, [phase, score, totalCorrect, totalWrong, maxCombo, level, onComplete]);

  // Computed values
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 100;
  const timerPercent = (timeLeft / 60) * 100;
  const timerColor =
    timeLeft > 20 ? "#22C55E" : timeLeft > 10 ? "#F59E0B" : "#EF4444";
  const isTimerCritical = timeLeft <= 5 && timeLeft > 0;
  const comboPercent = Math.min((combo / 10) * 100, 100);

  // Parse expression to highlight operator
  const expressionParts = currentProblem.expression.split(/(\s[+\-×÷]\s)/);

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
        {/* Animated background orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6"
        >
          {/* Title with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black"
            style={{
              background:
                "linear-gradient(135deg, #FDCB6E 0%, #F59E0B 50%, #F97316 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            수학 러시
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-white/60"
          >
            빠르게 수학 문제를 풀어보세요!
            <br />
            연속 정답으로 레벨이 올라갑니다
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 text-sm text-white/40"
          >
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              60초
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <span className="text-red-400">&#9829;</span> 3목숨
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 20h20" />
                <path d="M5 20V9l3-3 3 3 3-6 3 6 3-3v14" />
              </svg>
              자동 레벨
            </span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={startGame}
            className="w-full rounded-2xl py-4 text-lg font-bold text-white shadow-lg shadow-amber-500/25"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
            }}
          >
            시작하기
          </motion.button>
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
    const finalTotal = totalCorrect + totalWrong;
    const finalAccuracy =
      finalTotal > 0 ? Math.round((totalCorrect / finalTotal) * 100) : 0;
    const stats = [
      { label: "정확도", value: `${finalAccuracy}%`, icon: "🎯", delay: 0.2 },
      { label: "최대 콤보", value: `${maxCombo}`, icon: "🔥", delay: 0.35 },
      { label: "최고 레벨", value: LEVEL_NAMES[level], icon: "📈", delay: 0.5 },
      {
        label: "정답",
        value: `${totalCorrect}/${finalTotal}`,
        icon: "✅",
        delay: 0.65,
      },
    ];

    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Blurred background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-3xl border border-white/10 p-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,27,75,0.9), rgba(15,23,42,0.95))",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />

          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-black"
            style={{
              background: "linear-gradient(135deg, #F1F5F9, #CBD5E1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            게임 종료
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="text-5xl font-black tabular-nums"
            style={{
              background: "linear-gradient(135deg, #FDCB6E, #F97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {score.toLocaleString()}
          </motion.div>

          <div className="grid w-full grid-cols-2 gap-3">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay }}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/5 p-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-white/50">{stat.label}</span>
                <span className="text-lg font-bold text-white">
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={startGame}
            className="mt-2 w-full rounded-2xl py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/20"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
            }}
          >
            다시 하기
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onBack}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            나가기
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Playing screen
  return (
    <motion.div
      animate={shaking ? { x: [-6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`relative flex min-h-screen flex-col bg-gradient-to-br transition-all duration-1000 ${LEVEL_GRADIENTS[level]}`}
    >
      {/* Animated background particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute left-[10%] top-[20%] h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${DIFFICULTY_COLORS[level]}10` }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: `${DIFFICULTY_COLORS[level]}08` }}
        />
      </div>

      {/* Floating text effects */}
      <AnimatePresence>
        {floatingTexts.map((ft) => (
          <motion.div
            key={ft.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none fixed top-[45%] z-50 text-base font-black"
            style={{ left: `${ft.x}%`, color: ft.color }}
          >
            {ft.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top bar */}
      <div
        className="fixed left-0 right-0 top-0 z-40 border-b border-white/5 px-4 py-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 100%)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            {/* Level badge with glow */}
            <motion.span
              key={level}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{
                background: `${DIFFICULTY_COLORS[level]}20`,
                color: DIFFICULTY_COLORS[level],
                boxShadow: `0 0 12px ${DIFFICULTY_COLORS[level]}30`,
                border: `1px solid ${DIFFICULTY_COLORS[level]}30`,
              }}
            >
              {LEVEL_NAMES[level]}
            </motion.span>
            {/* Difficulty label */}
            <span
              className="text-xs font-semibold"
              style={{ color: DIFFICULTY_COLORS[level] }}
            >
              {DIFFICULTY_LABELS[level]}
            </span>
            {/* Lives */}
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.span
                  key={i}
                  animate={
                    i === lives && feedback === "wrong"
                      ? { scale: [1, 1.5, 0], opacity: [1, 1, 0] }
                      : {}
                  }
                  className={`text-lg ${i < lives ? "" : "opacity-15"}`}
                >
                  &#9829;
                </motion.span>
              ))}
            </div>
            {/* Animated score */}
            <motion.span
              key={score}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-black tabular-nums"
              style={{
                background: "linear-gradient(135deg, #FDCB6E, #F97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <AnimatedScore value={score} />
            </motion.span>
            {/* Help button */}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/60"
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
      </div>

      {/* Timer bar */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full"
            animate={
              isTimerCritical ? { opacity: [1, 0.5, 1] } : { opacity: 1 }
            }
            transition={
              isTimerCritical ? { repeat: Infinity, duration: 0.5 } : {}
            }
            style={{
              width: `${timerPercent}%`,
              background: `linear-gradient(90deg, ${timerColor}, ${
                timeLeft > 20
                  ? "#4ADE80"
                  : timeLeft > 10
                    ? "#FBBF24"
                    : "#F87171"
              })`,
              boxShadow: `0 0 10px ${timerColor}60, 0 0 20px ${timerColor}30`,
              transition: "width 100ms linear",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-24 pb-8">
        {/* Accuracy & streak row */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold tabular-nums text-white/40">
            정확도 {accuracy}%
          </span>
          <StreakDots count={consecutiveCorrect} max={3} />
        </div>

        {/* Combo display */}
        <div className="relative h-10">
          <AnimatePresence>
            {combo > 2 && (
              <motion.div
                key={`combo-${combo}`}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-2xl"
                  >
                    🔥
                  </motion.span>
                  <span
                    className="text-xl font-black"
                    style={{
                      background:
                        combo > 8
                          ? "linear-gradient(135deg, #FF4500, #FF0000)"
                          : combo > 5
                            ? "linear-gradient(135deg, #FF6B00, #FF4500)"
                            : "linear-gradient(135deg, #FF8C00, #FFA500)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter:
                        combo > 5
                          ? "drop-shadow(0 0 8px rgba(255,69,0,0.5))"
                          : "none",
                    }}
                  >
                    x{combo}
                  </span>
                </div>
                {/* Combo bar */}
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${comboPercent}%` }}
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #F97316, #EF4444)",
                      boxShadow:
                        combo > 5 ? "0 0 8px rgba(249,115,22,0.6)" : "none",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Level change announcement */}
        <AnimatePresence>
          {levelMsg && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute z-30"
            >
              {levelMsg === "LEVEL UP!" ? (
                <div
                  className="rounded-full px-6 py-2.5 text-lg font-black tracking-wider"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))",
                    color: "#4ADE80",
                    boxShadow:
                      "0 0 30px rgba(34,197,94,0.3), inset 0 0 20px rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                  }}
                >
                  LEVEL UP!
                </div>
              ) : (
                <div
                  className="rounded-full px-5 py-2 text-sm font-bold"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#F87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  Level Down
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Problem type indicator */}
        {currentProblem.problemType && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProblem.problemType}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-2 text-center"
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                style={{
                  background: `${DIFFICULTY_COLORS[level]}18`,
                  color: DIFFICULTY_COLORS[level],
                  border: `1px solid ${DIFFICULTY_COLORS[level]}30`,
                }}
              >
                {currentProblem.problemType}
              </span>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Problem */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProblem.expression}
            initial={{ x: 60, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -60, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center"
          >
            <div
              className={`font-black tabular-nums ${currentProblem.expression.length > 20 ? "text-2xl sm:text-3xl" : currentProblem.expression.length > 14 ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"}`}
            >
              {expressionParts.map((part, i) => {
                const isOperator = /^\s[+\-×÷]\s$/.test(part);
                if (isOperator) {
                  return (
                    <span
                      key={i}
                      style={{
                        background: "linear-gradient(135deg, #FDCB6E, #F97316)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 8px rgba(253,203,110,0.4))",
                      }}
                    >
                      {part}
                    </span>
                  );
                }
                return (
                  <span
                    key={i}
                    style={{
                      background:
                        "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {part}
                  </span>
                );
              })}
            </div>
            {showCorrectAnswer !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-lg font-bold text-red-400"
              >
                정답: {showCorrectAnswer}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Feedback flash overlay */}
        <AnimatePresence>
          {feedback === "correct" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-30"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(34,197,94,0.15) 0%, transparent 70%)",
              }}
            />
          )}
          {feedback === "wrong" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-30"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(239,68,68,0.12) 0%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Answer choices */}
        <div className="flex w-full max-w-md justify-center gap-4 sm:gap-6">
          {choices.map((choice) => {
            const isSelected = selectedAnswer === choice;
            const isCorrectChoice = choice === currentProblem.answer;
            const showCorrect = feedback === "correct" && isSelected;
            const showWrong = feedback === "wrong" && isSelected;

            return (
              <RippleButton
                key={`${currentProblem.expression}-${choice}`}
                buttonKey={`${currentProblem.expression}-${choice}`}
                onClick={() => handleAnswer(choice)}
                disabled={!!feedback}
                className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold tabular-nums text-white shadow-lg transition-all duration-200 sm:h-24 sm:w-24 sm:text-3xl ${
                  showCorrect
                    ? "scale-110 border-2 border-emerald-400 bg-emerald-500/30 shadow-emerald-500/30"
                    : showWrong
                      ? "scale-90 border-2 border-red-400 bg-red-500/30 shadow-red-500/30"
                      : feedback === "wrong" && isCorrectChoice
                        ? "border-2 border-emerald-400/50 bg-emerald-500/20"
                        : "border border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-white/5"
                }`}
                style={
                  {
                    background: showCorrect
                      ? "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(52,211,153,0.2))"
                      : showWrong
                        ? "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(248,113,113,0.2))"
                        : feedback === "wrong" && isCorrectChoice
                          ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.1))"
                          : "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    backdropFilter: "blur(12px)",
                    boxShadow: showCorrect
                      ? "0 0 25px rgba(52,211,153,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                      : showWrong
                        ? "0 0 25px rgba(248,113,113,0.3)"
                        : "0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                  } as React.CSSProperties
                }
              >
                <motion.span
                  animate={
                    showCorrect
                      ? { scale: [1, 1.15, 1] }
                      : showWrong
                        ? { x: [-3, 3, -3, 3, 0] }
                        : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  {choice}
                </motion.span>
              </RippleButton>
            );
          })}
        </div>

        {/* Time display */}
        <motion.span
          animate={
            isTimerCritical
              ? { scale: [1, 1.1, 1], color: ["#EF4444", "#FF6B6B", "#EF4444"] }
              : {}
          }
          transition={
            isTimerCritical ? { repeat: Infinity, duration: 0.8 } : {}
          }
          className="text-lg font-bold tabular-nums text-white/40"
        >
          {Math.ceil(timeLeft)}s
        </motion.span>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-800 p-5 shadow-2xl"
            >
              <h2 className="mb-4 text-center text-lg font-bold text-white">
                수학 러시 플레이 방법
              </h2>

              <div className="space-y-4 text-sm text-white/80">
                <div>
                  <p className="mb-2 font-semibold text-indigo-300">목표</p>
                  <p>제한 시간 안에 최대한 많은 수학 문제를 풀어보세요!</p>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-indigo-300">
                    플레이 방법
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-white/60">
                    <li>수학 문제가 화면에 표시됩니다</li>
                    <li>보기 중 올바른 답을 선택하세요</li>
                    <li>빠르게 맞출수록 높은 점수!</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-indigo-300">
                    레벨 시스템
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-white/60">
                    <li>연속 정답 시 레벨이 올라갑니다</li>
                    <li>레벨이 높을수록 어려운 문제가 나옵니다</li>
                    <li>틀리면 레벨이 내려갑니다</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-1 font-semibold text-indigo-300">팁</p>
                  <ul className="list-disc pl-4 space-y-1 text-white/60">
                    <li>콤보를 유지하면 보너스 점수!</li>
                    <li>시간이 다 되면 게임 종료</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                className="mt-5 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
              >
                알겠어요!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
