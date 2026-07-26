import type { PortfolioEntry } from "../payload-types";

export type GalleryImage = {
  url: string;
  srcSet?: string;
  alt: string;
  caption: string;
  slug?: string;
};

export const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

/** Owner-written alt text from the Media collection, if it was filled in. */
export const mediaAlt = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "alt" in v
    ? ((v as { alt?: string | null }).alt || null)
    : null;

type ImageSize = { url?: string | null; width?: number | null };

/**
 * `srcset` from the WebP derivatives Payload generates (see collections/Media).
 * Returns undefined for uploads that predate those sizes, so the plain `src`
 * stays the only source.
 */
export function mediaSrcSet(v: unknown): string | undefined {
  if (typeof v !== "object" || v === null || !("sizes" in v)) return undefined;
  const sizes = (v as { sizes?: Record<string, ImageSize | null> }).sizes ?? {};
  const set = Object.values(sizes)
    .filter((s): s is ImageSize => Boolean(s?.url && s?.width))
    .map((s) => `${s.url} ${s.width}w`);
  return set.length ? set.join(", ") : undefined;
}

/**
 * Flat, owner-controlled image list for the Gallery page and the homepage
 * Visual Showcase. Order = entry `galleryOrder` (1 first, empty last), then the
 * drag order of each entry's `gallery` field. Sort is stable, so entries without
 * a galleryOrder keep the incoming portfolio order.
 */
export function galleryImages(entries: PortfolioEntry[]): GalleryImage[] {
  const result: GalleryImage[] = [];
  const sorted = [...entries].sort(
    (a, b) => (a.galleryOrder || Infinity) - (b.galleryOrder || Infinity),
  );
  for (const e of sorted) {
    for (const g of e.gallery ?? []) {
      const url = mediaUrl(g);
      if (url) {
        result.push({
          url,
          srcSet: mediaSrcSet(g),
          // The caption already names the project, so repeating the title in
          // `alt` tells a screen reader (or an image crawler) nothing new.
          alt: mediaAlt(g) || `Screenshot from ${e.title}`,
          caption: e.title,
          slug: e.slug || undefined,
        });
      }
    }
  }
  return result;
}

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  project: "Project",
  work_experience: "Work",
  education: "Education",
  other: "Entry",
};

const year = (d?: string | null): string | null =>
  d ? String(new Date(d).getFullYear()) : null;

/** "2024 — Present" / "2023 — 2024" / "2025" / "Ongoing" / null. */
export function periodOf(
  e: Pick<PortfolioEntry, "startDate" | "endDate" | "isOngoing">,
): string | null {
  const start = year(e.startDate);
  if (!start) return e.isOngoing ? "Ongoing" : null;
  const end = e.isOngoing ? "Present" : year(e.endDate);
  return end ? `${start} — ${end}` : start;
}

/** Meta field labels adapt to the entry type. */
export function metaLabels(entryType: string): {
  role: string;
  org: string;
  stack: string;
} {
  switch (entryType) {
    case "work_experience":
      return { role: "Role", org: "Company", stack: "Stack" };
    case "education":
      return { role: "Program", org: "Institution", stack: "Focus" };
    default:
      return { role: "Role", org: "Organization", stack: "Stack" };
  }
}
