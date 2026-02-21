"use client";
import { useCallback } from "react";
import { Haptic } from "@/lib/haptic";
import { useSettingsStore } from "@/stores/settingsStore";

export function useHaptic() {
  const vibrationEnabled = useSettingsStore((s) => s.settings.vibrationEnabled);

  const correct = useCallback(() => {
    if (vibrationEnabled) Haptic.correct();
  }, [vibrationEnabled]);

  const wrong = useCallback(() => {
    if (vibrationEnabled) Haptic.wrong();
  }, [vibrationEnabled]);

  const combo = useCallback(() => {
    if (vibrationEnabled) Haptic.combo();
  }, [vibrationEnabled]);

  const achievement = useCallback(() => {
    if (vibrationEnabled) Haptic.achievement();
  }, [vibrationEnabled]);

  const button = useCallback(() => {
    if (vibrationEnabled) Haptic.button();
  }, [vibrationEnabled]);

  const tick = useCallback(() => {
    if (vibrationEnabled) Haptic.tick();
  }, [vibrationEnabled]);

  return {
    correct,
    wrong,
    combo,
    achievement,
    button,
    tick,
  };
}
