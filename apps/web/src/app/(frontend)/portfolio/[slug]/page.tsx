import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getEntryBySlug, getProfile } from "@/lib/payload";
import { ENTRY_TYPE_LABEL, metaLabels, periodOf } from "@/lib/format";
import { SiteFooter } from "../../components/SiteFooter";
import { GalleryGrid } from "../../components/GalleryGrid";

type Params = { params: Promise<{ slug: string }> };

// Rendered on demand (DB is a runtime volume); data is cached via tags.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);
  if (!entry) return { title: "Not found" };
  return {
    title: entry.title,
    description: entry.summary || undefined,
  };
}

const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

export default async function PortfolioDetail({ params }: Params) {
  const { slug } = await params;
  const [entry, profile] = await Promise.all([getEntryBySlug(slug), getProfile()]);
  if (!entry) notFound();

  const labels = metaLabels(entry.entryType);
  const period = periodOf(entry);
  const stack = (entry.techStack ?? []).filter(Boolean) as string[];
  const cover = mediaUrl(entry.coverImage);
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <div className="bands">
      <main className="band-light" style={{ paddingBottom: "clamp(3rem, 7vw, 5rem)" }}>
        <div className="wrap">
        <Link className="back" href="/portfolio">
          ← Back to archive
        </Link>

        <div className="detail-head">
          <span className="mono">{ENTRY_TYPE_LABEL[entry.entryType] ?? "Entry"}</span>
          <h1 className="detail-title">{entry.title}</h1>

          <dl className="meta-grid">
            {entry.role ? (
              <div className="meta-item">
                <dt>{labels.role}</dt>
                <dd>{entry.role}</dd>
              </div>
            ) : null}
            {entry.organization ? (
              <div className="meta-item">
                <dt>{labels.org}</dt>
                <dd>{entry.organization}</dd>
              </div>
            ) : null}
            {period ? (
              <div className="meta-item">
                <dt>Period</dt>
                <dd>{period}</dd>
              </div>
            ) : null}
            {stack.length > 0 ? (
              <div className="meta-item meta-item--wide">
                <dt>{labels.stack}</dt>
                <dd>{stack.join(" · ")}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {cover ? (
          <img className="cover" src={cover} alt={entry.title} loading="lazy" />
        ) : null}

        {entry.body ? (
          <div className="prose" style={{ marginTop: "clamp(2.5rem, 5vw, 4rem)", maxWidth: "68ch" }}>
            <RichText data={entry.body} />
          </div>
        ) : null}

        {Array.isArray(entry.gallery) && entry.gallery.length > 0 ? (
          <div style={{ marginTop: "3rem" }}>
            <span className="mono">Gallery</span>
            <GalleryGrid
              images={(entry.gallery ?? []).map((g) => ({
                url: mediaUrl(g) || "",
                alt: entry.title,
              })).filter((img) => img.url !== "")}
            />
          </div>
        ) : null}

        {entry.links && entry.links.length > 0 ? (
          <p className="entry-links" style={{ marginTop: "3rem" }}>
            {entry.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </p>
        ) : null}
        </div>
      </main>
      </div>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
