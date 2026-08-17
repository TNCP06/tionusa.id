import { getArticles } from "@/lib/blog";

// `||` not `??`: .env sets NEXT_PUBLIC_BLOG_URL="" (empty, not unset) until filled in.
const base = process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tionusa.id";

// Rendered on demand (DB is a runtime volume).
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const { docs } = await getArticles({ limit: 20 });

  const items = docs
    .filter((a) => a.slug)
    .map((a) => {
      const link = `${base}/${a.slug}`;
      const pubDate = a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString();
      return `<item>
<title>${esc(a.title)}</title>
<link>${link}</link>
<guid>${link}</guid>
<pubDate>${pubDate}</pubDate>
<description>${esc(a.excerpt || "")}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>KANAL</title>
<link>${base}</link>
<description>Berita dan artikel terbaru dari KANAL</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml" },
  });
}
