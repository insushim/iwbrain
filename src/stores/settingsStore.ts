import { create } from "zustand";
import type { Settings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getSettings, saveSettings } from "@/lib/storage";

function applyDarkMode(mode: boolean | "system"): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;

  if (mode === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    el.classList.toggle("dark", prefersDark);
  } else {
    el.classList.toggle("dark", mode);
  }
}

interface SettingsState {
  settings: Settings;
  initialized: boolean;
}

interface SettingsActions {
  init: () => void;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  setVolume: (volume: number) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set, get) => ({
    settings: DEFAULT_SETTINGS,
    initialized: false,

    init: () => {
      if (get().initialized) return;
      const settings = getSettings();
      applyDarkMode(settings.darkMode);
      set({ settings, initialized: true });
    },

    updateSettings: (partial) => {
      const settings = { ...get().settings, ...partial };
      saveSettings(settings);
      if ("darkMode" in partial) {
        applyDarkMode(settings.darkMode);
      }
      set({ settings });
    },

    toggleDarkMode: () => {
      const current = get().settings.darkMode;
      // Cycle: system -> true -> false -> system
      let next: boolean | "system";
      if (current === "system") {
        next = true;
      } else if (current === true) {
        next = false;
      } else {
        next = "system";
      }
      get().updateSettings({ darkMode: next });
    },

    toggleSound: () => {
      get().updateSettings({ soundEnabled: !get().settings.soundEnabled });
    },

    toggleVibration: () => {
      get().updateSettings({
        vibrationEnabled: !get().settings.vibrationEnabled,
      });
    },

    setVolume: (volume) => {
      get().updateSettings({ soundVolume: Math.max(0, Math.min(100, volume)) });
    },
  }),
);
