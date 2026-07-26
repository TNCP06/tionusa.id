import type { Article, PortfolioEntry, Profile } from "../payload-types";
import { BLOG_NAME, BLOG_URL, SITE_NAME, SITE_URL } from "./seo";
import { stackGroups } from "./stack";

export type JsonLd = Record<string, unknown>;

/**
 * Serialize for a <script> body. CMS text is server-controlled but not
 * escape-aware, so `<` is escaped: a literal "</script>" in a title or excerpt
 * would otherwise close the tag early.
 */
export const jsonLdScript = (data: JsonLd | JsonLd[]): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");

/**
 * Stable @id for the owner, so BlogPosting.author and the homepage Person are
 * the same node to a consumer instead of two people with the same name.
 */
export const PERSON_ID = `${SITE_URL}/#person`;

const abs = (url: string, base = SITE_URL) => new URL(url, base).toString();

const socialUrls = (profile: Pick<Profile, "socials">) =>
  (profile.socials ?? []).map((s) => s.url).filter(Boolean);

/** "Malang, Indonesia" -> locality + country. Single-part values become the locality. */
function postalAddress(location?: string | null): JsonLd | null {
  if (!location) return null;
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return {
    "@type": "PostalAddress",
    addressLocality: parts[0],
    ...(parts.length > 1 ? { addressCountry: parts[parts.length - 1] } : {}),
  };
}

export function personSchema(
  profile: Pick<Profile, "fullName" | "headline" | "location" | "socials">,
  entries: PortfolioEntry[],
): JsonLd {
  const sameAs = socialUrls(profile);
  const address = postalAddress(profile.location);
  // Derived from shipped work rather than a wishlist — same source as /stack.
  const knowsAbout = stackGroups(entries).flatMap((g) => g.items.map((i) => i.name));

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.fullName || SITE_NAME,
    jobTitle: "Fullstack Developer",
    url: `${SITE_URL}/`,
    ...(profile.headline ? { description: profile.headline } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(address ? { address } : {}),
    ...(knowsAbout.length ? { knowsAbout } : {}),
  };
}

export function blogPostingSchema(
  article: Pick<
    Article,
    "title" | "slug" | "excerpt" | "publishedAt" | "updatedAt" | "readingTime" | "tags"
  >,
  opts: { coverUrl?: string | null; articleSection?: string },
): JsonLd {
  const url = `${BLOG_URL}/${article.slug}`;
  const tags = (article.tags ?? []).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: url,
    url,
    headline: article.title,
    ...(article.excerpt ? { description: article.excerpt } : {}),
    ...(opts.coverUrl ? { image: abs(opts.coverUrl, BLOG_URL) } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    ...(opts.articleSection ? { articleSection: opts.articleSection } : {}),
    ...(article.readingTime ? { timeRequired: `PT${article.readingTime}M` } : {}),
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    // Same @id as the homepage Person node, but self-describing: the blog is a
    // different host, so a bare @id reference would not resolve for a consumer.
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
    publisher: {
      "@type": "Organization",
      name: BLOG_NAME,
      url: `${BLOG_URL}/`,
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  base = SITE_URL,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path, base),
    })),
  };
}
