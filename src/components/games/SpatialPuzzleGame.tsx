"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateNonogramHints } from "@/utils/grid";
import { generatePuzzle } from "@/utils/nonogramGenerator";
import { SoundEffects, setVolume, setMuted } from "@/lib/sound";
import { Haptic, setHapticEnabled } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

interface SpatialPuzzleGameProps {
  puzzleId?: string;
  onComplete: (score: number, details: Record<string, unknown>) => void;
  onBack: () => void;
}

interface PuzzleData {
  id: string;
  name: string;
  emoji: string;
  size: number;
  grid: number[][];
}

const PUZZLES: PuzzleData[] = [
  // 5x5 Puzzles
  {
    id: "heart",
    name: "Heart",
    emoji: "❤️",
    size: 5,
    grid: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: "star",
    name: "Star",
    emoji: "⭐",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 0],
    ],
  },
  {
    id: "arrow",
    name: "Arrow",
    emoji: "➡️",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: "house",
    name: "House",
    emoji: "🏠",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
    ],
  },
  {
    id: "tree",
    name: "Tree",
    emoji: "🌲",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    size: 5,
    grid: [
      [0, 1, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0],
    ],
  },
  {
    id: "umbrella",
    name: "Umbrella",
    emoji: "☂️",
    size: 5,
    grid: [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0],
    ],
  },
  {
    id: "boat",
    name: "Boat",
    emoji: "⛵",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: "key",
    name: "Key",
    emoji: "🔑",
    size: 5,
    grid: [
      [0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 1, 1],
      [0, 0, 0, 0, 1],
      [0, 0, 0, 0, 1],
    ],
  },
  {
    id: "note",
    name: "Note",
    emoji: "🎵",
    size: 5,
    grid: [
      [0, 0, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0],
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    size: 5,
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: "cup",
    name: "Cup",
    emoji: "☕",
    size: 5,
    grid: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
    ],
  },
  {
    id: "lightning",
    name: "Lightning",
    emoji: "⚡",
    size: 5,
    grid: [
      [0, 0, 1, 1, 0],
      [0, 1, 1, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 1, 1, 0],
      [0, 1, 1, 0, 0],
    ],
  },
  {
    id: "cross",
    name: "Cross",
    emoji: "✚",
    size: 5,
    grid: [
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
    ],
  },
  {
    id: "moon",
    name: "Moon",
    emoji: "🌙",
    size: 5,
    grid: [
      [0, 1, 1, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
    ],
  },
  // 7x7 Puzzles
  {
    id: "cat",
    name: "Cat",
    emoji: "🐱",
    size: 7,
    grid: [
      [0, 1, 0, 0, 0, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 1, 0, 0],
    ],
  },
  {
    id: "dog",
    name: "Dog",
    emoji: "🐶",
    size: 7,
    grid: [
      [0, 1, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
  },
  {
    id: "robot",
    name: "Robot",
    emoji: "🤖",
    size: 7,
    grid: [
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
    ],
  },
  {
    id: "plane",
    name: "Plane",
    emoji: "✈️",
    size: 7,
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
    ],
  },
  {
    id: "car",
    name: "Car",
    emoji: "🚗",
    size: 7,
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
    ],
  },
  {
    id: "flower",
    name: "Flower",
    emoji: "🌸",
    size: 7,
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
  },
  {
    id: "butterfly",
    name: "Butterfly",
    emoji: "🦋",
    size: 7,
    grid: [
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
    ],
  },
  {
    id: "mushroom",
    name: "Mushroom",
    emoji: "🍄",
    size: 7,
    grid: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
    ],
  },
  {
    id: "skull",
    name: "Skull",
    emoji: "💀",
    size: 7,
    grid: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 0, 1, 0, 1, 0, 0],
    ],
  },
  {
    id: "crown",
    name: "Crown",
    emoji: "👑",
    size: 7,
    grid: [
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: "penguin",
    name: "Penguin",
    emoji: "🐧",
    size: 7,
    grid: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
    ],
  },
  {
    id: "anchor",
    name: "Anchor",
    emoji: "⚓",
    size: 7,
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [1, 0, 0, 1, 0, 0, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    emoji: "👻",
    size: 7,
    grid: [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
    ],
  },
  {
    id: "rocket",
    name: "Rocket",
    emoji: "🚀",
    size: 7,
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
    ],
  },
  {
    id: "cactus",
    name: "Cactus",
    emoji: "🌵",
    size: 7,
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ],
  },
  // 10x10 Puzzles
  {
    id: "spaceship",
    name: "Spaceship",
    emoji: "🚀",
    size: 10,
    grid: [
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    ],
  },
  {
    id: "castle",
    name: "Castle",
    emoji: "🏰",
    size: 10,
    grid: [
      [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: "dragon",
    name: "Dragon",
    emoji: "🐉",
    size: 10,
    grid: [
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: "piano",
    name: "Piano",
    emoji: "🎹",
    size: 10,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: "gamepad",
    name: "Gamepad",
    emoji: "🎮",
    size: 10,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: "lighthouse",
    name: "Lighthouse",
    emoji: "🗼",
    size: 10,
    grid: [
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: "camera",
    name: "Camera",
    emoji: "📷",
    size: 10,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 0, 1, 0, 0, 1, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: "treasure",
    name: "Treasure",
    emoji: "🏆",
    size: 10,
    grid: [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    ],
  },
  {
    id: "skull10",
    name: "Pirate",
    emoji: "☠️",
    size: 10,
    grid: [
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    ],
  },
  {
    id: "alien",
    name: "Alien",
    emoji: "👾",
    size: 10,
    grid: [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

const SIZE_GROUPS = [
  { label: "5x5 (쉬움)", size: 5 },
  { label: "7x7 (보통)", size: 7 },
  { label: "10x10 (어려움)", size: 10 },
];

export default function SpatialPuzzleGame({
  puzzleId,
  onComplete,
  onBack,
}: SpatialPuzzleGameProps) {
  const { settings } = useSettingsStore();

  // Sync sound/haptic settings
  useEffect(() => {
    setVolume(settings.soundVolume / 100);
    setMuted(!settings.soundEnabled);
    setHapticEnabled(settings.vibrationEnabled);
  }, [settings.soundVolume, settings.soundEnabled, settings.vibrationEnabled]);

  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleData | null>(
    () => {
      if (puzzleId) {
        return PUZZLES.find((p) => p.id === puzzleId) ?? null;
      }
      return null;
    },
  );
  const [playerGrid, setPlayerGrid] = useState<number[][]>([]);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealIdx, setRevealIdx] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<number | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const hints = useMemo(() => {
    if (!selectedPuzzle) return { rowHints: [], colHints: [] };
    return calculateNonogramHints(selectedPuzzle.grid);
  }, [selectedPuzzle]);

  const totalFilled = useMemo(() => {
    if (!selectedPuzzle) return 0;
    return selectedPuzzle.grid.flat().filter((c) => c === 1).length;
  }, [selectedPuzzle]);

  const correctFilled = useMemo(() => {
    if (!selectedPuzzle) return 0;
    let count = 0;
    for (let r = 0; r < selectedPuzzle.size; r++) {
      for (let c = 0; c < selectedPuzzle.size; c++) {
        if (playerGrid[r]?.[c] === 1 && selectedPuzzle.grid[r][c] === 1) {
          count++;
        }
      }
    }
    return count;
  }, [selectedPuzzle, playerGrid]);

  const isRowComplete = useCallback(
    (rowIdx: number) => {
      if (!selectedPuzzle) return false;
      for (let c = 0; c < selectedPuzzle.size; c++) {
        const expected = selectedPuzzle.grid[rowIdx][c];
        const actual = playerGrid[rowIdx]?.[c] ?? 0;
        if (expected === 1 && actual !== 1) return false;
        if (expected === 0 && actual === 1) return false;
      }
      return true;
    },
    [selectedPuzzle, playerGrid],
  );

  const isColComplete = useCallback(
    (colIdx: number) => {
      if (!selectedPuzzle) return false;
      for (let r = 0; r < selectedPuzzle.size; r++) {
        const expected = selectedPuzzle.grid[r][colIdx];
        const actual = playerGrid[r]?.[colIdx] ?? 0;
        if (expected === 1 && actual !== 1) return false;
        if (expected === 0 && actual === 1) return false;
      }
      return true;
    },
    [selectedPuzzle, playerGrid],
  );

  // Start puzzle
  const startPuzzle = useCallback((puzzle: PuzzleData) => {
    setSelectedPuzzle(puzzle);
    setPlayerGrid(
      Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(0)),
    );
    setCompleted(false);
    setStartTime(Date.now());
    setElapsed(0);
    setRevealIdx(-1);
  }, []);

  // Timer
  useEffect(() => {
    if (!selectedPuzzle || completed) return;
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(elapsedRef.current);
  }, [selectedPuzzle, completed, startTime]);

  // Check completion
  useEffect(() => {
    if (!selectedPuzzle || completed) return;
    for (let r = 0; r < selectedPuzzle.size; r++) {
      for (let c = 0; c < selectedPuzzle.size; c++) {
        if (selectedPuzzle.grid[r][c] === 1 && playerGrid[r]?.[c] !== 1) return;
        if (selectedPuzzle.grid[r][c] === 0 && playerGrid[r]?.[c] === 1) return;
      }
    }
    // Completed!
    setCompleted(true);
    SoundEffects.achievement();
    Haptic.achievement();
    clearInterval(elapsedRef.current);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const sizeBonus = selectedPuzzle.size * 100;
    const timeBonus = Math.max(0, (selectedPuzzle.size * 60 - timeTaken) * 2);
    const finalScore = sizeBonus + timeBonus;

    // Reveal animation
    let idx = 0;
    const interval = setInterval(() => {
      setRevealIdx(idx);
      idx++;
      if (idx >= selectedPuzzle.size * selectedPuzzle.size) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete(finalScore, {
            puzzleId: selectedPuzzle.id,
            puzzleName: selectedPuzzle.name,
            size: selectedPuzzle.size,
            timeTaken,
            sizeBonus,
            timeBonus,
          });
        }, 800);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [playerGrid, selectedPuzzle, completed, startTime, onComplete]);

  const toggleCell = useCallback(
    (row: number, col: number) => {
      if (completed || !selectedPuzzle) return;
      setPlayerGrid((prev) => {
        const next = prev.map((r) => [...r]);
        // Cycle: 0 → 1 → 2 → 0
        next[row][col] = (next[row][col] + 1) % 3;
        return next;
      });
    },
    [completed, selectedPuzzle],
  );

  const handleCellPointerDown = useCallback(
    (row: number, col: number) => {
      if (completed || !selectedPuzzle) return;
      SoundEffects.click();
      Haptic.button();
      setIsDragging(true);
      const currentVal = playerGrid[row]?.[col] ?? 0;
      const nextVal = (currentVal + 1) % 3;
      setDragMode(nextVal);
      setPlayerGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = nextVal;
        return next;
      });
    },
    [completed, selectedPuzzle, playerGrid],
  );

  const handleCellPointerEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging || dragMode === null || completed) return;
      setPlayerGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = dragMode;
        return next;
      });
    },
    [isDragging, dragMode, completed],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
  }, []);

  const handleRandomPuzzle = useCallback(
    (size: number) => {
      const puzzle = generatePuzzle(size);
      startPuzzle(puzzle);
    },
    [startPuzzle],
  );

  // Puzzle selection screen
  if (!selectedPuzzle) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900">
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
          <h1 className="text-base font-semibold text-white">노노그램 퍼즐</h1>
          <div className="w-9" />
        </div>

        <div className="flex flex-1 flex-col gap-6 px-4 pt-16 pb-8">
          {SIZE_GROUPS.map((group) => (
            <div key={group.size}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/50">
                  {group.label}
                </h2>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRandomPuzzle(group.size)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/30"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  랜덤
                </motion.button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {PUZZLES.filter((p) => p.size === group.size).map((puzzle) => (
                  <motion.button
                    key={puzzle.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startPuzzle(puzzle)}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    <span className="text-2xl">{puzzle.emoji}</span>
                    <span className="text-[10px] text-white/50">
                      {puzzle.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Playing screen
  const size = selectedPuzzle.size;
  const cellSize = size <= 5 ? 48 : size <= 7 ? 38 : 32;
  const hintMaxWidth = size <= 5 ? 60 : size <= 7 ? 70 : 80;
  const hintMaxHeight = size <= 5 ? 50 : size <= 7 ? 60 : 70;
  const progress = totalFilled > 0 ? (correctFilled / totalFilled) * 100 : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className="flex min-h-screen flex-col bg-slate-900"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setSelectedPuzzle(null)}
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
          <span className="text-lg">{selectedPuzzle.emoji}</span>
          <span className="text-sm font-semibold text-white">
            {selectedPuzzle.name}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-white/60">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-2 pt-20 pb-8">
        {/* Completion overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none fixed inset-0 z-30 bg-green-500/5"
            />
          )}
        </AnimatePresence>

        {/* Grid with hints */}
        <div className="select-none" style={{ touchAction: "none" }}>
          {/* Column hints row */}
          <div className="flex" style={{ marginLeft: hintMaxWidth }}>
            {hints.colHints.map((hintArr, ci) => (
              <div
                key={ci}
                className="flex flex-col items-center justify-end"
                style={{
                  width: cellSize,
                  height: hintMaxHeight,
                }}
              >
                {hintArr.map((h, hi) => (
                  <span
                    key={hi}
                    className={`text-xs font-semibold leading-tight ${
                      isColComplete(ci) ? "text-green-400" : "text-white/60"
                    }`}
                  >
                    {h}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: size }).map((_, ri) => (
            <div key={ri} className="flex">
              {/* Row hints */}
              <div
                className="flex items-center justify-end gap-1 pr-2"
                style={{ width: hintMaxWidth }}
              >
                {hints.rowHints[ri].map((h, hi) => (
                  <span
                    key={hi}
                    className={`text-xs font-semibold ${
                      isRowComplete(ri) ? "text-green-400" : "text-white/60"
                    }`}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Cells */}
              {Array.from({ length: size }).map((_, ci) => {
                const cellVal = playerGrid[ri]?.[ci] ?? 0;
                const flatIdx = ri * size + ci;
                const isRevealing = completed && revealIdx >= flatIdx;
                const isSolutionFilled = selectedPuzzle.grid[ri][ci] === 1;

                return (
                  <motion.div
                    key={`${ri}-${ci}`}
                    animate={
                      isRevealing && isSolutionFilled
                        ? { backgroundColor: "#00B894", scale: [1, 1.1, 1] }
                        : {}
                    }
                    transition={{ duration: 0.2 }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleCellPointerDown(ri, ci);
                    }}
                    onPointerEnter={() => handleCellPointerEnter(ri, ci)}
                    className={`flex items-center justify-center border border-white/10 transition-colors ${
                      cellVal === 1
                        ? "bg-white/90"
                        : cellVal === 2
                          ? "bg-white/5"
                          : "bg-white/5 hover:bg-white/10"
                    }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRightWidth:
                        (ci + 1) % 5 === 0 && ci < size - 1 ? 2 : undefined,
                      borderBottomWidth:
                        (ri + 1) % 5 === 0 && ri < size - 1 ? 2 : undefined,
                    }}
                  >
                    {cellVal === 2 && (
                      <span className="text-xs font-bold text-white/40">X</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-white/20 bg-white/90" />
            <span>채우기</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded border border-white/20 bg-white/5 text-[8px] font-bold text-white/40">
              X
            </div>
            <span>빈칸 표시</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-white/20 bg-white/5" />
            <span>비우기</span>
          </div>
        </div>

        {/* Reset button */}
        {!completed && (
          <button
            type="button"
            onClick={() =>
              setPlayerGrid(
                Array.from({ length: size }, () => Array(size).fill(0)),
              )
            }
            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/20"
          >
            초기화
          </button>
        )}

        {/* Completed message */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col items-center gap-3"
            >
              <span className="text-lg font-bold text-green-400">
                퍼즐 완성!
              </span>
              <span className="text-sm text-white/50">
                {minutes}분 {seconds}초 소요
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPuzzle(null)}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
                >
                  다른 퍼즐
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  나가기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
