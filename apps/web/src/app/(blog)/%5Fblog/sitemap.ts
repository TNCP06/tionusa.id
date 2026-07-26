import type { MetadataRoute } from "next";
import { CATEGORIES, getArticles } from "@/lib/blog";
import { BLOG_URL as base } from "@/lib/seo";

// Queried at request time (DB is a runtime volume).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { docs } = await getArticles({ limit: 1000 });
  return [
    { url: `${base}/`, lastModified: new Date() },
    ...CATEGORIES.map((c) => ({
      url: `${base}/kategori/${c}`,
      lastModified: new Date(),
    })),
    ...docs
      .filter((a) => a.slug)
      .map((a) => ({
        url: `${base}/${a.slug}`,
        lastModified: new Date(a.updatedAt || a.publishedAt || Date.now()),
      })),
  ];
}
