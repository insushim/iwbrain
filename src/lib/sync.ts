import type { UserProfile, GameSession } from "@/types";

const DEVICE_ID_KEY = "neuroflex:device-id";
const SYNC_ENDPOINT = "/api/sync";
const RESTORE_ENDPOINT = "/api/sync/restore";

function generateDeviceUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function syncToCloud(
  profile: UserProfile,
  sessions: GameSession[],
): void {
  const deviceId = getDeviceId();
  if (!deviceId) return;

  fetch(SYNC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, profile, sessions }),
  }).catch(() => {
    // Fire-and-forget: silently fail
  });
}

export async function restoreFromCloud(): Promise<{
  profile: UserProfile | null;
  sessions: GameSession[];
} | null> {
  const deviceId = getDeviceId();
  if (!deviceId) return null;

  try {
    const res = await fetch(`${RESTORE_ENDPOINT}?deviceId=${deviceId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
