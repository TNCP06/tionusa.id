import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// Target of client-side VisitorBeacon component.
// Scrapers/bots do not execute React/JS, so only real human browsers ping this endpoint.

const seen = new Map<string, number>();
const WINDOW_MS = 60 * 60 * 1000; // 1 notification per visitor per hour

const BOT_UA =
  /bot|googleother|gptbot|chatgpt|claudebot|anthropic|perplexity|cohere|bytespider|amazonbot|applebot|bingbot|yandexbot|duckduckbot|semrushbot|ahrefsbot|dotbot|petalbot|crawl|spider|slurp|preview|scan|fetch|monitor|probe|curl|wget|python|go-http|headless|lighthouse|selenium|puppeteer|playwright|postman|insomnia|facebookexternal|meta-external|censys|shodan|urlscan/i;

const BOT_IP_PREFIXES = [
  "66.249.", // Google crawler pool
  "2a03:288",
  "173.252.",
  "69.171.",
  "66.220.",
  "34.",
  "3.",
  "15.",
  "44.",
  "13.",
  "18.",
  "52.",
  "54.",
  "143.198.",
  "138.197.",
  "137.184.",
  "159.223.",
  "147.182.",
  "141.94.",
  "151.80.",
  "51.254.",
  "57.129.",
  "158.173.",
  "93.158.",
  "185.13.",
  "192.71.",
  "5.198.",
  "194.132.",
  "192.36.",
  "149.57.",
  "23.27.",
  "162.216.",
  "103.168.",
  "104.165.",
  "104.164.",
  "103.4.",
  "103.196.",
  "154.28.",
  "173.46.",
  "171.22.",
  "205.169.",
  "192.30.",
  "2001:bc8:",
  "2605:6400:",
  "2a09:2dc2:",
  "77.243.",
  "149.50.",
  "202.78.",
  "172.234.",
  "45.56.",
  "45.39.",
  "157.143.",
  "45.153.",
  "167.86.",
];

export async function POST(req: NextRequest) {
  // Ignore owner visits
  if (
    req.cookies.has("payload-token") ||
    req.cookies.has("tionusa_owner") ||
    req.cookies.has("tncp_owner")
  ) {
    return NextResponse.json({ ignored: "owner" });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) {
    return NextResponse.json({ ignored: "bot_ua" });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();

  if (ip && BOT_IP_PREFIXES.some((p) => ip.startsWith(p))) {
    return NextResponse.json({ ignored: "bot_ip" });
  }

  const body = await req.json().catch(() => null);
  if (!body?.path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const now = Date.now();
  const key: string = ip || ua || "unknown";
  if (now - (seen.get(key) ?? 0) < WINDOW_MS) {
    return NextResponse.json({ deduped: true });
  }
  seen.set(key, now);
  if (seen.size > 5000) {
    for (const [k, t] of seen) if (now - t > WINDOW_MS) seen.delete(k);
  }

  const payload = await getPayload({ config });
  const doc = await payload.create({
    collection: "visitor-logs",
    data: {
      path: String(body.path).slice(0, 500),
      host: body.host === "blog" ? "blog" : "site",
      country: req.headers.get("cf-ipcountry") || undefined,
      ip: ip || undefined,
      userAgent: ua ? ua.slice(0, 500) : undefined,
      referer: body.referer ? String(body.referer).slice(0, 500) : undefined,
    },
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
