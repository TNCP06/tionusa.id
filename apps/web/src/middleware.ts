import { NextRequest, NextResponse } from "next/server";

// Serve the KANAL blog from the `blog.` subdomain by rewriting its paths onto
// the (blog) route group's `_blog/*` segment. Portfolio host (tncp.web.id) is
// untouched — the rewrite only fires when Host starts with `blog.`.
// Files in public/ (favicon, OG image…) are served from the root on every host,
// so they must never be rewritten onto /_blog. Extensions of blog *routes*
// (rss.xml, sitemap.xml, robots.txt) are deliberately absent from this list.
const PUBLIC_ASSET = /\.(svg|png|jpe?g|webp|gif|ico|woff2?|css|js|map)$/i;

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isBlog = host.startsWith("blog.");
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const { pathname } = req.nextUrl;

  // Allow localhost preview via /blog or /_blog
  if (isLocal && (pathname === "/blog" || pathname.startsWith("/blog/"))) {
    const url = req.nextUrl.clone();
    const blogPath = pathname.replace(/^\/blog/, "") || "/";
    url.pathname = `/_blog${blogPath === "/" ? "" : blogPath}`;
    return trackVisit(req, NextResponse.rewrite(url));
  }

  // /_blog/* is an internal path — block direct access in production on main host
  if (!isBlog && !isLocal && pathname.startsWith("/_blog")) {
    return new NextResponse(null, { status: 404 });
  }

  if (
    isBlog &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_blog") &&
    !PUBLIC_ASSET.test(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/_blog${pathname}`;
    return trackVisit(req, NextResponse.rewrite(url));
  }
  return trackVisit(req, NextResponse.next());
}

const BOT_UA = /bot|crawl|spider|slurp|preview|scan|fetch|monitor|probe|curl|wget|python|go-http|headless|lighthouse|facebookexternal|meta-external/i;

// Crawlers/scanners that browse with a real-browser UA, so the UA filter
// misses them — but they come from known datacenter IP space. ponytail: prefix
// strings, not a full ASN list; extend when another crawler shows up in logs.
const BOT_IP_PREFIXES = [
  "2a03:288", // Meta link-preview
  "173.252.", // Meta
  "69.171.", // Meta
  "66.220.", // Meta
  "192.36.109.", // urlscan.io scan cluster (Internetbolaget, SE)
  "158.173.", // IBM Cloud / SoftLayer (Frankfurt scanner seen in logs)
  "34.", // Google Cloud + AWS block (34.0.0.0/8 is all cloud, no humans)
];

// Visitor → Telegram notification. Middleware only decides "is this a real
// page view by someone who isn't the owner"; persistence + per-IP dedup live
// in /api/visit (Node runtime — middleware can't touch Payload/SQLite).
function trackVisit(req: NextRequest, res: NextResponse): NextResponse {
  const ua = req.headers.get("user-agent") ?? "";
  const accept = req.headers.get("accept") ?? "";
  const { pathname } = req.nextUrl;
  if (
    req.method !== "GET" ||
    !accept.includes("text/html") || // excludes RSC/prefetch/data requests
    !ua ||
    BOT_UA.test(ua) ||
    // real WebKit/Blink browsers always carry "(KHTML, like Gecko)"; an
    // AppleWebKit UA without it is a hand-typed fake (scraper signature)
    (ua.includes("AppleWebKit") && !ua.includes("KHTML, like Gecko")) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    /\.\w+$/.test(pathname) // files: sitemap.xml, robots.txt, images…
  ) {
    return res;
  }

  // Owner filter: after one /admin login the `payload-token` cookie appears;
  // convert it into a 1-year `tncp_owner` cookie scoped to .tncp.web.id so it
  // also covers blog. — the owner's visits are never counted again.
  const host = req.headers.get("host") ?? "";
  if (req.cookies.has("payload-token") || req.cookies.has("tncp_owner")) {
    if (req.cookies.has("payload-token")) {
      res.cookies.set("tncp_owner", "1", {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
        ...(host.endsWith("tncp.web.id") ? { domain: ".tncp.web.id" } : {}),
      });
    }
    return res;
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (BOT_IP_PREFIXES.some((p) => ip.startsWith(p))) return res;

  // Fire-and-forget to our own port — never block or fail the page.
  void fetch(`http://127.0.0.1:${process.env.PORT || "3000"}/api/visit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.INGEST_SECRET ?? ""}`,
    },
    body: JSON.stringify({
      path: pathname,
      host: host.startsWith("blog.") ? "blog" : "site",
      ip,
      country: req.headers.get("cf-ipcountry") ?? "",
      userAgent: ua,
      referer: req.headers.get("referer") ?? "",
    }),
  }).catch(() => {});
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
