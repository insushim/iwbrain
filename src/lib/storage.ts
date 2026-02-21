import type {
  GameSession,
  UserProfile,
  Settings,
  DailyChallengeData,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

const DB_NAME = "neuroflex-db";
const DB_VERSION = 1;
const SESSIONS_STORE = "sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const store = db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
        store.createIndex("gameType", "gameType", { unique: false });
        store.createIndex("completedAt", "completedAt", { unique: false });
      }
    };
  });
}

export async function saveSession(session: GameSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSessions(gameType?: string): Promise<GameSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const store = tx.objectStore(SESSIONS_STORE);
    let request: IDBRequest;

    if (gameType) {
      const index = store.index("gameType");
      request = index.getAll(gameType);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecentSessions(
  limit: number = 50,
): Promise<GameSession[]> {
  const sessions = await getSessions();
  return sessions
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )
    .slice(0, limit);
}

export async function clearAllSessions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// LocalStorage helpers
function getLS<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(`neuroflex:${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLS<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`neuroflex:${key}`, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

export function getUserProfile(): UserProfile {
  return getLS<UserProfile>("profile", {
    totalGames: 0,
    totalPlayTime: 0,
    brainScore: 0,
    streakDays: 0,
    lastPlayDate: "",
    achievements: [],
    difficultyLevels: {
      "number-logic": 1,
      "pattern-memory": 1,
      "color-sequence": 1,
      "word-chain": 1,
      "math-rush": 1,
      "spatial-puzzle": 1,
    },
  });
}

export function saveUserProfile(profile: UserProfile): void {
  setLS("profile", profile);
}

export function getSettings(): Settings {
  return getLS<Settings>("settings", DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  setLS("settings", settings);
}

export function getDailyChallenge(date: string): DailyChallengeData | null {
  return getLS<DailyChallengeData | null>(`daily:${date}`, null);
}

export function saveDailyChallenge(data: DailyChallengeData): void {
  setLS(`daily:${data.date}`, data);
}

export function getDailyHistory(): Record<string, boolean> {
  return getLS<Record<string, boolean>>("daily-history", {});
}

export function saveDailyHistory(history: Record<string, boolean>): void {
  setLS("daily-history", history);
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith("neuroflex:"),
  );
  keys.forEach((k) => localStorage.removeItem(k));
  indexedDB.deleteDatabase(DB_NAME);
}
