import type { MetadataRoute } from "next";
import { getPublishedEntries } from "@/lib/payload";
import { SITE_URL as base } from "@/lib/seo";

// Queried at request time (DB is a runtime volume).
export const dynamic = "force-dynamic";

// Hand-maintained: every static route in the main nav belongs here. Portfolio
// entries below are the only generated part.
const STATIC_PATHS = ["/", "/portfolio", "/gallery", "/stack"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublishedEntries();
  return [
    // Trailing slash on the root: that is what the server resolves to, so the
    // sitemap URL has to match the canonical form exactly.
    ...STATIC_PATHS.map((p) => ({
      url: p === "/" ? `${base}/` : `${base}${p}`,
      lastModified: new Date(),
    })),
    ...entries
      .filter((e) => e.slug)
      .map((e) => ({
        url: `${base}/portfolio/${e.slug}`,
        lastModified: e.updatedAt ? new Date(e.updatedAt) : new Date(),
      })),
  ];
}
