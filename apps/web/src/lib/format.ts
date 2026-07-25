import type { PortfolioEntry } from "../payload-types";

export type GalleryImage = { url: string; alt: string; caption: string };

export const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

/**
 * Flat, owner-controlled image list for the Gallery page and the homepage
 * Visual Showcase. Order = entry `galleryOrder` (1 first, empty last), then the
 * drag order of each entry's `gallery` field. Sort is stable, so entries without
 * a galleryOrder keep the incoming portfolio order.
 */
export function galleryImages(entries: PortfolioEntry[]): GalleryImage[] {
  return [...entries]
    .sort((a, b) => (a.galleryOrder || Infinity) - (b.galleryOrder || Infinity))
    .flatMap((e) =>
      (e.gallery ?? []).map((g) => ({
        url: mediaUrl(g),
        alt: e.title,
        caption: e.title,
      })),
    )
    .filter((g): g is GalleryImage => g.url !== null);
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
