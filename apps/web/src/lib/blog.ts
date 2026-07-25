import { getPayload } from "payload";
import config from "@payload-config";
import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import type { Article } from "../payload-types";

const payloadPromise = getPayload({ config });
const PUBLISHED = { _status: { equals: "published" } };

export const getFeaturedArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "articles", locale: "id", depth: 1, limit: 5,
      where: { and: [PUBLISHED, { featured: { equals: true } }] },
      sort: ["-featuredScore", "-publishedAt"],
    });
    if (docs.length) return docs;
    const latest = await payload.find({ collection: "articles", locale: "id", depth: 1, limit: 5, where: PUBLISHED, sort: "-publishedAt" });
    return latest.docs;
  },
  ["blog-featured"], { tags: ["blog-featured"] },
);

export async function getArticles(opts: { category?: string; tag?: string; limit?: number; page?: number } = {}) {
  const { category, tag, limit = 12, page = 1 } = opts;
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const filters: Where[] = [
        PUBLISHED,
        ...(category ? [{ category: { equals: category } }] : []),
        // `tags` is hasMany — `in` matches a doc when any of its values matches.
        ...(tag ? [{ tags: { in: [tag] } }] : []),
      ];
      const res = await payload.find({
        collection: "articles", locale: "id", depth: 1, limit, page,
        where: filters.length > 1 ? { and: filters } : PUBLISHED,
        sort: "-publishedAt",
      });
      return { docs: res.docs as Article[], hasMore: res.hasNextPage ?? false };
    },
    ["blog-list", category ?? "all", tag ?? "all", String(page), String(limit)], { tags: ["articles"] },
  )();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const { docs } = await payload.find({ collection: "articles", locale: "id", depth: 2, limit: 1, where: { and: [PUBLISHED, { slug: { equals: slug } }] } });
      return (docs[0] as Article) ?? null;
    },
    ["blog-article", slug], { tags: ["articles", `article:${slug}`] },
  )();
}

export async function getRelated(category: string, excludeSlug: string): Promise<Article[]> {
  return unstable_cache(
    async () => {
      const payload = await payloadPromise;
      const { docs } = await payload.find({
        collection: "articles", locale: "id", depth: 1, limit: 3,
        where: { and: [PUBLISHED, { category: { equals: category } }, { slug: { not_equals: excludeSlug } }] },
        sort: "-publishedAt",
      });
      return docs as Article[];
    },
    ["blog-related", category, excludeSlug], { tags: ["articles"] },
  )();
}
