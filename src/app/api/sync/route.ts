import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;
    const { deviceId, profile, sessions } = await request.json();

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // Upsert device
    await db
      .prepare(
        `INSERT INTO devices (id) VALUES (?)
         ON CONFLICT(id) DO UPDATE SET last_sync_at = datetime('now')`,
      )
      .bind(deviceId)
      .run();

    // Upsert profile
    if (profile) {
      const profileJson = JSON.stringify(profile);
      await db
        .prepare(
          `INSERT INTO profiles (device_id, data, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(device_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
        )
        .bind(deviceId, profileJson)
        .run();
    }

    // Insert sessions (ignore duplicates)
    if (sessions?.length) {
      const stmt = db.prepare(
        `INSERT OR IGNORE INTO sessions
         (id, device_id, game_type, score, level, duration, accuracy, max_combo, hints_used, completed_at, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );

      const batch = sessions.map((s: Record<string, unknown>) =>
        stmt.bind(
          s.id,
          deviceId,
          s.gameType,
          s.score,
          s.level,
          s.duration,
          s.accuracy,
          s.maxCombo,
          s.hintsUsed,
          s.completedAt,
          JSON.stringify(s.details || {}),
        ),
      );

      await db.batch(batch);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
