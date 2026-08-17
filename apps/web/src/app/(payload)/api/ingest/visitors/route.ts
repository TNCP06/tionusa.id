import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

// Read-only visitor stats for the PAI Telegram bot (👀 Pengunjung menu).
// Counts are rolling windows (24h / 7d / 30d), not calendar days.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 10, 30);

  const payload = await getPayload({ config });
  const since = (days: number) =>
    new Date(Date.now() - days * 86_400_000).toISOString();
  const count = (days: number) =>
    payload.count({
      collection: "visitor-logs",
      where: { createdAt: { greater_than: since(days) } },
    });

  const [today, week, month, recent, lastWeek] = await Promise.all([
    count(1),
    count(7),
    count(30),
    payload.find({ collection: "visitor-logs", sort: "-createdAt", limit }),
    payload.find({
      collection: "visitor-logs",
      where: { createdAt: { greater_than: since(7) } },
      limit: 1000,
      sort: "-createdAt",
    }),
  ]);

  const byPath = new Map<string, number>();
  for (const d of lastWeek.docs) {
    byPath.set(d.path, (byPath.get(d.path) ?? 0) + 1);
  }
  const topPaths = [...byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, n]) => ({ path, count: n }));

  return NextResponse.json({
    today: today.totalDocs,
    week: week.totalDocs,
    month: month.totalDocs,
    topPaths,
    recent: recent.docs.map((d) => ({
      path: d.path,
      host: d.host,
      country: d.country ?? "",
      ip: d.ip ?? "",
      referer: d.referer ?? "",
      userAgent: d.userAgent ?? "",
      at: d.createdAt,
    })),
  });
}
