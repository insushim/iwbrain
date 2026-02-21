"use client";
import { useCallback, useRef } from "react";
import type { GameType, GameSession } from "@/types";
import { generateUUID } from "@/utils/random";
import { useGameStore } from "@/stores/gameStore";
import { useUserStore } from "@/stores/userStore";
import { syncToCloud } from "@/lib/sync";

export function useGameSession(gameType: GameType) {
  const startTimeRef = useRef<number>(0);
  const startGame = useGameStore((s) => s.startGame);
  const addSession = useUserStore((s) => s.addSession);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const startSession = useCallback(() => {
    startTimeRef.current = Date.now();
    startGame(gameType);
  }, [gameType, startGame]);

  const endSession = useCallback(
    async (
      score: number,
      accuracy: number,
      maxCombo: number,
      hintsUsed: number,
      details?: Record<string, unknown>,
    ): Promise<void> => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const session: GameSession = {
        id: generateUUID(),
        gameType,
        score,
        level: useUserStore.getState().profile.difficultyLevels[gameType] ?? 1,
        duration,
        accuracy,
        maxCombo,
        hintsUsed,
        completedAt: new Date().toISOString(),
        details: details ?? {},
      };

      addSession(session);

      const profile = useUserStore.getState().profile;
      const today = new Date().toISOString().split("T")[0];
      const isNewDay = profile.lastPlayDate !== today;

      updateProfile({
        totalGames: profile.totalGames + 1,
        totalPlayTime: profile.totalPlayTime + duration,
        lastPlayDate: today,
        streakDays: isNewDay
          ? isConsecutiveDay(profile.lastPlayDate, today)
            ? profile.streakDays + 1
            : 1
          : profile.streakDays,
      });

      // Fire-and-forget cloud sync
      const updatedProfile = useUserStore.getState().profile;
      const allSessions = useUserStore.getState().sessions;
      syncToCloud(updatedProfile, [...allSessions, session]);
    },
    [gameType, addSession, updateProfile],
  );

  return { startSession, endSession };
}

function isConsecutiveDay(lastDate: string, today: string): boolean {
  if (!lastDate) return false;
  const last = new Date(lastDate);
  const current = new Date(today);
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}
