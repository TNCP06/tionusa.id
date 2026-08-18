import { NextRequest, NextResponse } from "next/server";

// Serve the KANAL blog from the `blog.` subdomain by rewriting its paths onto
// the (blog) route group's `_blog/*` segment. Portfolio host (tionusa.id) is
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
    return NextResponse.rewrite(url);
  }

  // /_blog/* is an internal path — block direct access in production on main host
  if (!isBlog && !isLocal && pathname.startsWith("/_blog")) {
    return new NextResponse(null, { status: 404 });
  }

  // Short links & typo tolerance for ref links (e.g. /r/linkedin, /ref=linkedin, /ref/linkedin)
  const refMatch =
    !isBlog &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !PUBLIC_ASSET.test(pathname)
      ? pathname.match(/^\/(?:r\/|ref[=/:]?)([^/]+)\/?$/i)
      : null;
  if (refMatch) {
    const source = refMatch[1];
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("ref", source);
    return NextResponse.redirect(url, 307);
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
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

