import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { trackVisitorVisit } from "@/lib/notify";

// Target of client-side VisitorBeacon component.
// Tracks visitor and bot pageviews, reporting to Telegram with rolling edit aggregation.

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
  const ip =
    req.headers.get("cf-connecting-ip") ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const botMatch = ua ? ua.match(BOT_UA) : null;
  const isDatacenterIp = !!ip && BOT_IP_PREFIXES.some((p) => ip.startsWith(p));
  const isBot = !ua || !!botMatch || isDatacenterIp;
  const botName = botMatch
    ? botMatch[0]
    : isDatacenterIp
      ? "Datacenter IP"
      : !ua
        ? "Unknown UA"
        : undefined;

  const body = await req.json().catch(() => null);
  if (!body?.path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const key: string = ip || ua || "unknown";
  const payload = await getPayload({ config });

  const visit = {
    key,
    path: String(body.path).slice(0, 500),
    host: body.host === "blog" ? ("blog" as const) : ("site" as const),
    country: req.headers.get("cf-ipcountry") || undefined,
    ip: ip || undefined,
    userAgent: ua ? ua.slice(0, 500) : undefined,
    referer: body.referer ? String(body.referer).slice(0, 500) : undefined,
    isBot,
    botName,
  };

  const { isFirst, count } = trackVisitorVisit(payload, visit);

  if (!isFirst) {
    return NextResponse.json({ deduped: true, count });
  }

  const doc = await payload.create({
    collection: "visitor-logs",
    data: {
      path: visit.path,
      host: visit.host,
      country: visit.country,
      ip: visit.ip,
      userAgent: visit.userAgent,
      referer: visit.referer,
    },
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
