"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateNonogramHints } from "@/utils/grid";
import { generatePuzzle } from "@/utils/nonogramGenerator";
import { NONOGRAM_PUZZLES } from "@/data/nonogram-puzzles";
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

// Use expanded puzzle database + legacy inline puzzles
const LEGACY_PUZZLES: PuzzleData[] = [
  // 5x5 Puzzles
  {
    id: "heart",
    name: "Heart",
    emoji: "\u2764\uFE0F",
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
    emoji: "\u2B50",
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
    emoji: "\u27A1\uFE0F",
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
    emoji: "\uD83C\uDFE0",
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
    emoji: "\uD83C\uDF32",
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
    emoji: "\uD83D\uDC1F",
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
    emoji: "\u2602\uFE0F",
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
    emoji: "\u26F5",
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
    emoji: "\uD83D\uDD11",
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
    emoji: "\uD83C\uDFB5",
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
    emoji: "\uD83D\uDC8E",
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
    emoji: "\u2615",
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
    emoji: "\u26A1",
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
    emoji: "\u271A",
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
    emoji: "\uD83C\uDF19",
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
    emoji: "\uD83D\uDC31",
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
    emoji: "\uD83D\uDC36",
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
    emoji: "\uD83E\uDD16",
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
    emoji: "\u2708\uFE0F",
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
    emoji: "\uD83D\uDE97",
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
    emoji: "\uD83C\uDF38",
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
    emoji: "\uD83E\uDD8B",
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
    emoji: "\uD83C\uDF44",
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
    emoji: "\uD83D\uDC80",
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
    emoji: "\uD83D\uDC51",
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
    emoji: "\uD83D\uDC27",
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
    emoji: "\u2693",
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
    emoji: "\uD83D\uDC7B",
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
    emoji: "\uD83D\uDE80",
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
    emoji: "\uD83C\uDF35",
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
    emoji: "\uD83D\uDE80",
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
    emoji: "\uD83C\uDFF0",
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
    emoji: "\uD83D\uDC09",
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
    emoji: "\uD83C\uDFB9",
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
    emoji: "\uD83C\uDFAE",
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
    emoji: "\uD83D\uDDFC",
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
    emoji: "\uD83D\uDCF7",
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
    emoji: "\uD83C\uDFC6",
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
    emoji: "\u2620\uFE0F",
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
    emoji: "\uD83D\uDC7E",
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

// Merge legacy puzzles with expanded database (deduplicate by id)
const PUZZLES: PuzzleData[] = (() => {
  const allPuzzles = [
    ...NONOGRAM_PUZZLES.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      size: p.size,
      grid: p.grid,
    })),
    ...LEGACY_PUZZLES,
  ];
  const seen = new Set<string>();
  return allPuzzles.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
})();

const SIZE_GROUPS = [
  { label: "5x5 (쉬움)", size: 5 },
  { label: "7x7 (보통)", size: 7 },
  { label: "10x10 (어려움)", size: 10 },
  { label: "12x12 (전문가)", size: 12 },
  { label: "15x15 (극한)", size: 15 },
];

// ---- Best time helpers ----
function getBestTime(puzzleId: string): number | null {
  try {
    const raw = localStorage.getItem(`nonogram_best_${puzzleId}`);
    if (raw) return parseInt(raw, 10);
  } catch {}
  return null;
}

function saveBestTime(puzzleId: string, time: number) {
  try {
    const prev = getBestTime(puzzleId);
    if (prev === null || time < prev) {
      localStorage.setItem(`nonogram_best_${puzzleId}`, String(time));
    }
  } catch {}
}

function formatBestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

// ---- Particle / confetti component ----
function ConfettiParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 1.5,
      size: 4 + Math.random() * 6,
      color: [
        "#FFD700",
        "#FF6B6B",
        "#4ECDC4",
        "#A78BFA",
        "#34D399",
        "#F472B6",
        "#60A5FA",
      ][i % 7],
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: p.size > 7 ? "50%" : "1px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ---- Ripple animation on cell tap ----
function CellRipple({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0.7 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-sm bg-white/30"
        />
      )}
    </AnimatePresence>
  );
}

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [rippleCell, setRippleCell] = useState<string | null>(null);
  const [flashRows, setFlashRows] = useState<Set<number>>(new Set());
  const [flashCols, setFlashCols] = useState<Set<number>>(new Set());
  const [completedRows, setCompletedRows] = useState<Set<number>>(new Set());
  const [completedCols, setCompletedCols] = useState<Set<number>>(new Set());
  const elapsedRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Show tutorial on first visit
  useEffect(() => {
    const key = "neuroflex_nonogram_tutorial_seen";
    if (!localStorage.getItem(key)) {
      setShowTutorial(true);
      localStorage.setItem(key, "1");
    }
  }, []);

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

  // Count player filled cells (including wrong ones)
  const playerFilledCount = useMemo(() => {
    let count = 0;
    for (const row of playerGrid) {
      for (const cell of row) {
        if (cell === 1) count++;
      }
    }
    return count;
  }, [playerGrid]);

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

  // Detect row/col completion for flash feedback
  useEffect(() => {
    if (!selectedPuzzle || completed) return;
    const size = selectedPuzzle.size;
    const newCompletedRows = new Set<number>();
    const newCompletedCols = new Set<number>();
    for (let r = 0; r < size; r++) {
      if (isRowComplete(r)) newCompletedRows.add(r);
    }
    for (let c = 0; c < size; c++) {
      if (isColComplete(c)) newCompletedCols.add(c);
    }
    // Detect newly completed rows
    for (const r of newCompletedRows) {
      if (!completedRows.has(r)) {
        setFlashRows((prev) => new Set(prev).add(r));
        setTimeout(() => {
          setFlashRows((prev) => {
            const next = new Set(prev);
            next.delete(r);
            return next;
          });
        }, 600);
      }
    }
    // Detect newly completed cols
    for (const c of newCompletedCols) {
      if (!completedCols.has(c)) {
        setFlashCols((prev) => new Set(prev).add(c));
        setTimeout(() => {
          setFlashCols((prev) => {
            const next = new Set(prev);
            next.delete(c);
            return next;
          });
        }, 600);
      }
    }
    setCompletedRows(newCompletedRows);
    setCompletedCols(newCompletedCols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerGrid, selectedPuzzle, completed]);

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
    setCompletedRows(new Set());
    setCompletedCols(new Set());
    setFlashRows(new Set());
    setFlashCols(new Set());
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

    // Save best time
    saveBestTime(selectedPuzzle.id, timeTaken);

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
        // Cycle: 0 -> 1 -> 2 -> 0
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
      setRippleCell(`${row}-${col}`);
      setTimeout(() => setRippleCell(null), 500);
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
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950">
        {/* Blueprint grid pattern overlay */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top bar with glass morphism */}
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
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
          <h1 className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-base font-bold tracking-tight text-transparent">
            {"\uB178\uB178\uADF8\uB7A8 \uD37C\uC990"}
          </h1>
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>

        <div className="relative flex flex-1 flex-col gap-8 px-4 pt-18 pb-8">
          {SIZE_GROUPS.map((group) => (
            <div key={group.size}>
              {/* Group header with gradient underline */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold tracking-wide text-white/60">
                    {group.label}
                  </h2>
                  <div className="mt-1.5 h-[2px] w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRandomPuzzle(group.size)}
                  className="relative flex items-center gap-1.5 overflow-hidden rounded-lg border border-indigo-400/20 bg-indigo-500/15 px-3.5 py-1.5 text-xs font-bold text-indigo-300 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/25"
                  style={{
                    boxShadow:
                      "0 0 20px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.05)",
                  }}
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
                  {"\uB79C\uB364"}
                </motion.button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {PUZZLES.filter((p) => p.size === group.size).map((puzzle) => {
                  const best = getBestTime(puzzle.id);
                  return (
                    <motion.button
                      key={puzzle.id}
                      type="button"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => startPuzzle(puzzle)}
                      className="group relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-sm transition-all hover:border-white/[0.15] hover:bg-white/[0.07]"
                    >
                      <span className="text-2xl drop-shadow-lg transition-transform group-hover:scale-110">
                        {puzzle.emoji}
                      </span>
                      <span className="text-[10px] font-medium text-white/40 transition-colors group-hover:text-white/60">
                        {puzzle.name}
                      </span>
                      {best !== null && (
                        <span className="text-[9px] font-mono text-emerald-400/60">
                          {formatBestTime(best)}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tutorial Modal */}
        <TutorialModal
          show={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
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
  const overfilled = playerFilledCount > totalFilled;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Blueprint grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top bar with glass morphism */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-slate-950/60 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setSelectedPuzzle(null)}
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
        <div className="flex items-center gap-2.5">
          <span className="text-lg drop-shadow-lg">{selectedPuzzle.emoji}</span>
          <span className="text-sm font-bold tracking-tight text-white">
            {selectedPuzzle.name}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10"
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
          {/* Timer with pulsing dot */}
          <div className="flex items-center gap-1.5">
            {!completed && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 6px rgba(52,211,153,0.5)" }}
              />
            )}
            <span
              className="text-sm tabular-nums text-white/60"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar + cell count */}
      <div className="fixed left-0 right-0 top-[52px] z-40 px-4 py-1.5">
        <div className="flex items-center gap-3">
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #6366f1, #34d399)",
                boxShadow:
                  "0 0 12px rgba(99,102,241,0.4), 0 0 24px rgba(52,211,153,0.2)",
              }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span
            className="min-w-[3rem] text-right text-[11px] font-bold tabular-nums text-white/40"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        {/* Cell count + warning */}
        <div className="mt-1 flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold tabular-nums ${
              overfilled ? "text-amber-400" : "text-white/30"
            }`}
          >
            {playerFilledCount}/{totalFilled} {"\uCC44\uC6C0"}
          </span>
          <AnimatePresence>
            {overfilled && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {"\uCD08\uACFC"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-2 pt-24 pb-8">
        {/* Completion overlay + confetti */}
        <AnimatePresence>
          {completed && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pointer-events-none fixed inset-0 z-30"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(251,191,36,0.08) 0%, transparent 70%)",
                }}
              />
              <ConfettiParticles />
            </>
          )}
        </AnimatePresence>

        {/* Grid with hints */}
        <div className="select-none" style={{ touchAction: "none" }}>
          {/* Column hints row */}
          <div className="flex" style={{ marginLeft: hintMaxWidth }}>
            {hints.colHints.map((hintArr, ci) => {
              const colDone = isColComplete(ci);
              const flashing = flashCols.has(ci);
              return (
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
                      className={`text-xs font-bold leading-tight transition-all duration-300 ${
                        colDone ? "text-emerald-400" : "text-white/50"
                      }`}
                      style={
                        colDone
                          ? {
                              textShadow: flashing
                                ? "0 0 12px rgba(52,211,153,0.9), 0 0 24px rgba(52,211,153,0.5)"
                                : "0 0 8px rgba(52,211,153,0.4)",
                            }
                          : undefined
                      }
                    >
                      {h}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {Array.from({ length: size }).map((_, ri) => {
            const rowDone = isRowComplete(ri);
            const rowFlashing = flashRows.has(ri);
            return (
              <div key={ri} className="flex">
                {/* Row hints */}
                <div
                  className="flex items-center justify-end gap-1 pr-2"
                  style={{ width: hintMaxWidth }}
                >
                  {hints.rowHints[ri].map((h, hi) => (
                    <span
                      key={hi}
                      className={`text-xs font-bold transition-all duration-300 ${
                        rowDone ? "text-emerald-400" : "text-white/50"
                      }`}
                      style={
                        rowDone
                          ? {
                              textShadow: rowFlashing
                                ? "0 0 12px rgba(52,211,153,0.9), 0 0 24px rgba(52,211,153,0.5)"
                                : "0 0 8px rgba(52,211,153,0.4)",
                            }
                          : undefined
                      }
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
                  const cellKey = `${ri}-${ci}`;
                  const isFlashingRow = flashRows.has(ri);
                  const isFlashingCol = flashCols.has(ci);
                  const isFlashing = isFlashingRow || isFlashingCol;

                  // Thicker borders at 5-cell intervals
                  const thickRight = (ci + 1) % 5 === 0 && ci < size - 1;
                  const thickBottom = (ri + 1) % 5 === 0 && ri < size - 1;

                  return (
                    <motion.div
                      key={cellKey}
                      animate={
                        isRevealing && isSolutionFilled
                          ? {
                              scale: [1, 1.15, 1],
                            }
                          : {}
                      }
                      transition={{ duration: 0.3 }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleCellPointerDown(ri, ci);
                      }}
                      onPointerEnter={() => handleCellPointerEnter(ri, ci)}
                      className="relative flex items-center justify-center transition-all duration-150"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderWidth: "1px",
                        borderColor:
                          isRevealing && isSolutionFilled
                            ? "rgba(251,191,36,0.5)"
                            : isFlashing
                              ? "rgba(52,211,153,0.3)"
                              : thickRight || thickBottom
                                ? "rgba(255,255,255,0.15)"
                                : "rgba(255,255,255,0.07)",
                        borderRightWidth: thickRight ? 2.5 : 1,
                        borderBottomWidth: thickBottom ? 2.5 : 1,
                        borderRightColor: thickRight
                          ? "rgba(99,102,241,0.3)"
                          : undefined,
                        borderBottomColor: thickBottom
                          ? "rgba(99,102,241,0.3)"
                          : undefined,
                        background:
                          isRevealing && isSolutionFilled
                            ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                            : cellVal === 1
                              ? "rgba(255,255,255,0.92)"
                              : cellVal === 2
                                ? "rgba(255,255,255,0.02)"
                                : "rgba(255,255,255,0.03)",
                        boxShadow:
                          isRevealing && isSolutionFilled
                            ? "0 0 16px rgba(251,191,36,0.6), inset 0 0 8px rgba(251,191,36,0.3)"
                            : cellVal === 1
                              ? "0 0 8px rgba(255,255,255,0.15), inset 0 1px 2px rgba(255,255,255,0.1)"
                              : isFlashing
                                ? "inset 0 0 12px rgba(52,211,153,0.15)"
                                : "none",
                      }}
                    >
                      {cellVal === 2 && (
                        <svg
                          width={cellSize * 0.35}
                          height={cellSize * 0.35}
                          viewBox="0 0 12 12"
                          className="text-white/25"
                        >
                          <line
                            x1="2"
                            y1="2"
                            x2="10"
                            y2="10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <line
                            x1="10"
                            y1="2"
                            x2="2"
                            y2="10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <CellRipple active={rippleCell === cellKey} />
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-5 text-xs text-white/35">
          <div className="flex items-center gap-1.5">
            <div
              className="h-4 w-4 rounded-[3px]"
              style={{
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 0 6px rgba(255,255,255,0.15)",
              }}
            />
            <span className="font-medium">{"\uCC44\uC6B0\uAE30"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.03]">
              <svg
                width="8"
                height="8"
                viewBox="0 0 12 12"
                className="text-white/25"
              >
                <line
                  x1="2"
                  y1="2"
                  x2="10"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="10"
                  y1="2"
                  x2="2"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-medium">{"\uBE48\uCE78 \uD45C\uC2DC"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-[3px] border border-white/10 bg-white/[0.03]" />
            <span className="font-medium">{"\uBE44\uC6B0\uAE30"}</span>
          </div>
        </div>

        {/* Reset button */}
        {!completed && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPlayerGrid(
                Array.from({ length: size }, () => Array(size).fill(0)),
              );
              setCompletedRows(new Set());
              setCompletedCols(new Set());
            }}
            className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-5 py-2 text-sm font-semibold text-white/40 backdrop-blur-sm transition-all hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/60"
          >
            {"\uCD08\uAE30\uD654"}
          </motion.button>
        )}

        {/* Completed message */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
                className="text-2xl font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg, #fbbf24, #f59e0b, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
                }}
              >
                {"\uD37C\uC990 \uC644\uC131!"}
              </motion.span>
              <span
                className="text-sm font-medium text-white/40"
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
                }}
              >
                {minutes}
                {"\uBD84"} {seconds}
                {"\uCD08 \uC18C\uC694"}
              </span>
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPuzzle(null)}
                  className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #34d399)",
                    boxShadow:
                      "0 0 20px rgba(99,102,241,0.3), 0 4px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  {"\uB2E4\uB978 \uD37C\uC990"}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-6 py-2.5 text-sm font-bold text-white/70 backdrop-blur-sm transition-all hover:bg-white/[0.1]"
                >
                  {"\uB098\uAC00\uAE30"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        show={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}

// Extracted tutorial modal to keep it unchanged in content but consistent rendering
function TutorialModal({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
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
              노노그램 플레이 방법
            </h2>

            <div className="space-y-4 text-sm text-white/80">
              <div>
                <p className="mb-2 font-semibold text-indigo-300">목표</p>
                <p>숫자 힌트를 보고 칸을 채워서 숨겨진 그림을 완성하세요!</p>
              </div>

              <div>
                <p className="mb-2 font-semibold text-indigo-300">
                  숫자 힌트 읽는 법
                </p>
                <p className="mb-1">
                  각 행/열 옆의 숫자는{" "}
                  <span className="font-bold text-white">
                    연속으로 채워야 할 칸의 수
                  </span>
                  를 의미합니다.
                </p>
                <div className="mt-2 rounded-lg bg-slate-700/60 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="shrink-0 text-xs font-bold text-yellow-300 w-8 text-right">
                      3
                    </span>
                    <div className="flex gap-0.5">
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                    </div>
                    <span className="text-xs text-white/40">= 3칸 연속</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="shrink-0 text-xs font-bold text-yellow-300 w-8 text-right">
                      1 2
                    </span>
                    <div className="flex gap-0.5">
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm bg-white/90" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                    </div>
                    <span className="text-xs text-white/40">
                      = 1칸 + 빈칸 + 2칸
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-bold text-green-400 w-8 text-right">
                      0
                    </span>
                    <div className="flex gap-0.5">
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                      <div className="h-5 w-5 rounded-sm border border-white/20 bg-white/5" />
                    </div>
                    <span className="text-xs text-white/40">= 전부 빈칸</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 font-semibold text-indigo-300">조작법</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">1번 탭:</span>
                    <div className="h-4 w-4 rounded-sm bg-white/90" />
                    <span>채우기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">2번 탭:</span>
                    <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-white/20 bg-white/5 text-[8px] font-bold text-white/40">
                      X
                    </div>
                    <span>빈칸 확정 (메모용)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">3번 탭:</span>
                    <div className="h-4 w-4 rounded-sm border border-white/20 bg-white/5" />
                    <span>원래대로</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1 font-semibold text-indigo-300">팁</p>
                <ul className="list-disc pl-4 space-y-1 text-white/60">
                  <li>
                    <span className="text-green-400">초록색</span> 숫자 = 해당
                    줄 완성!
                  </li>
                  <li>드래그해서 여러 칸을 한번에 채울 수 있어요</li>
                  <li>먼저 5x5 쉬운 퍼즐부터 시작해보세요</li>
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
      )}
    </AnimatePresence>
  );
}
