import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEntries, getProfile } from "@/lib/payload";
import { GalleryGrid } from "../components/GalleryGrid";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Visual showcase of projects and work.",
};

const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

export default async function GalleryPage() {
  const [entries, profile] = await Promise.all([
    getPublishedEntries(),
    getProfile(),
  ]);

  const dbImages = entries.flatMap((e) =>
    (e.gallery ?? []).map((g) => ({
      url: mediaUrl(g),
      alt: e.title,
      caption: e.title,
    })),
  ).filter(
    (g): g is { url: string; alt: string; caption: string } => g.url !== null,
  );

  const images = [
    {
      url: "/editorial_web_mockup.jpg",
      alt: "Test Mockup Image",
      caption: "Test Mockup Project",
    },
    ...dbImages,
  ];

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <div className="bands">
        <main
          className="band-light"
          style={{ paddingBottom: "clamp(3rem, 7vw, 5rem)" }}
        >
          <div className="wrap">
            <Link className="back" href="/">
              ← Home
            </Link>
            <div className="detail-head">
              <span className="mono">Visual Archive</span>
              <h1 className="detail-title">Gallery</h1>
            </div>

            {images.length > 0 ? (
              <GalleryGrid images={images} className="gallery-showcase" />
            ) : (
              <p className="empty">No gallery images yet.</p>
            )}
          </div>
        </main>
      </div>
      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
