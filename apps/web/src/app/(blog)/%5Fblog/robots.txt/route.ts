import { BLOG_URL } from "@/lib/seo";

export function GET() {
  // `Allow: /api/media/` is listed before the `/api/` block so it wins the
  // longest-match rule — cover images live under /api/media/file/*.
  const body = `User-agent: *
Allow: /
Allow: /api/media/
Disallow: /admin
Disallow: /api/

Sitemap: ${BLOG_URL}/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
