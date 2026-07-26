import { getPayload } from "payload";
import config from "@payload-config";
import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import type { Article } from "../payload-types";
import { formatSlug } from "../fields/slug";

const payloadPromise = getPayload({ config });
const PUBLISHED = { _status: { equals: "published" } };

/** Mirrors the `category` enum in collections/Articles.ts. */
export const CATEGORY_LABEL: Record<string, string> = {
  hiburan: "Hiburan",
  kpop: "K-Pop",
  film: "Film",
  tech: "Tech",
  tips: "Tips",
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL);

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

/**
 * Tags are free-form text (`tags` is a hasMany text field), so a slug cannot be
 * matched in SQL. Build slug → original-tag from the published set instead; the
 * result is cached and busted by the same `articles` tag as every other query.
 */
export const getTagMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const payload = await payloadPromise;
    const { docs } = await payload.find({
      collection: "articles", locale: "id", depth: 0, limit: 1000,
      where: PUBLISHED,
    });
    const map: Record<string, string> = {};
    for (const doc of docs) {
      for (const tag of doc.tags ?? []) {
        if (tag) map[formatSlug(tag)] = tag;
      }
    }
    return map;
  },
  ["blog-tag-map"], { tags: ["articles"] },
);

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
