"use client";
import { useCallback } from "react";
import { SoundEffects, initAudio } from "@/lib/sound";
import { useSettingsStore } from "@/stores/settingsStore";

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.settings.soundEnabled);

  const correct = useCallback(() => {
    if (soundEnabled) SoundEffects.correct();
  }, [soundEnabled]);

  const wrong = useCallback(() => {
    if (soundEnabled) SoundEffects.wrong();
  }, [soundEnabled]);

  const combo = useCallback(
    (level: number) => {
      if (soundEnabled) SoundEffects.combo(level);
    },
    [soundEnabled],
  );

  const click = useCallback(() => {
    if (soundEnabled) SoundEffects.click();
  }, [soundEnabled]);

  const gameStart = useCallback(() => {
    if (soundEnabled) SoundEffects.gameStart();
  }, [soundEnabled]);

  const gameOver = useCallback(() => {
    if (soundEnabled) SoundEffects.gameOver();
  }, [soundEnabled]);

  const levelUp = useCallback(() => {
    if (soundEnabled) SoundEffects.levelUp();
  }, [soundEnabled]);

  const tick = useCallback(() => {
    if (soundEnabled) SoundEffects.tick();
  }, [soundEnabled]);

  const achievement = useCallback(() => {
    if (soundEnabled) SoundEffects.achievement();
  }, [soundEnabled]);

  const hint = useCallback(() => {
    if (soundEnabled) SoundEffects.hint();
  }, [soundEnabled]);

  const dailyComplete = useCallback(() => {
    if (soundEnabled) SoundEffects.dailyComplete();
  }, [soundEnabled]);

  return {
    correct,
    wrong,
    combo,
    click,
    gameStart,
    gameOver,
    levelUp,
    tick,
    achievement,
    hint,
    dailyComplete,
    initAudio,
  };
}
