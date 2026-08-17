import type { Metadata } from "next";

export const SITE_URL = process.env.SITE_URL || "https://tionusa.id";
// `||` not `??`: .env sets NEXT_PUBLIC_BLOG_URL="" (empty, not unset) until filled in.
export const BLOG_URL =
  process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tionusa.id";

export const SITE_NAME = "Tionusa Catur Pamungkas";
export const SITE_TITLE =
  "Tionusa Catur Pamungkas — Fullstack Developer, Node.js & Docker";
export const SITE_DESCRIPTION =
  "Fullstack developer in Malang, Indonesia — Node.js, Express, MySQL, Docker, and AWS EC2, with Next.js and TypeScript on the frontend.";

export const BLOG_NAME = "KANAL";
export const BLOG_TITLE = "KANAL — Hiburan, Tech, dan Tips";
export const BLOG_DESCRIPTION =
  "KANAL membahas hiburan, K-Pop, film, tech, dan tips harian dengan bahasa santai — ditulis singkat, tetap padat.";

type PageMetaInput = {
  /** Segment title. The root layout's template appends the site name. */
  title: string;
  description: string;
  /** Canonical path, resolved against the route group's `metadataBase`. */
  path: string;
  images?: string[];
  type?: "website" | "article";
  siteName?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Canonical + OG + Twitter for one route.
 *
 * Without an explicit `openGraph` per page, Next inherits the root layout's
 * block, so every subpage would advertise the homepage's OG title. This keeps
 * the three in sync from a single input.
 */
export function pageMeta({
  title,
  description,
  path,
  images,
  type = "website",
  siteName = SITE_NAME,
  publishedTime,
  modifiedTime,
}: PageMetaInput): Metadata {
  const hasImages = Boolean(images?.length);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName,
      url: path,
      title,
      description,
      ...(hasImages ? { images } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(hasImages ? { images } : {}),
    },
  };
}
