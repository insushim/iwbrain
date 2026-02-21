import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = env.DB;
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const profileRow = await db
      .prepare("SELECT data FROM profiles WHERE device_id = ?")
      .bind(deviceId)
      .first<{ data: string }>();

    const sessionsResult = await db
      .prepare(
        "SELECT * FROM sessions WHERE device_id = ? ORDER BY completed_at DESC",
      )
      .bind(deviceId)
      .all();

    return NextResponse.json({
      profile: profileRow ? JSON.parse(profileRow.data) : null,
      sessions: (sessionsResult.results || []).map(
        (s: Record<string, unknown>) => ({
          id: s.id,
          gameType: s.game_type,
          score: s.score,
          level: s.level,
          duration: s.duration,
          accuracy: s.accuracy,
          maxCombo: s.max_combo,
          hintsUsed: s.hints_used,
          completedAt: s.completed_at,
          details: JSON.parse((s.details as string) || "{}"),
        }),
      ),
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
