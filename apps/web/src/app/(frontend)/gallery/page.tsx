import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEntries, getProfile } from "@/lib/payload";
import { galleryImages } from "@/lib/format";
import { GalleryGrid } from "../components/GalleryGrid";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Visual showcase of projects and work.",
};

type Params = { searchParams: Promise<{ page?: string }> };

export default async function GalleryPage({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page || "1");
  const itemsPerPage = 9;

  const [entries, profile] = await Promise.all([
    getPublishedEntries(),
    getProfile(),
  ]);

  const images = galleryImages(entries);

  const totalPages = Math.ceil(images.length / itemsPerPage);
  const visibleImages = images.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
              <>
                <GalleryGrid images={visibleImages} className="gallery-showcase" />
                {totalPages > 1 && (
                  <div className="ledger-actions" style={{ marginTop: "3rem" }}>
                    <Link
                      href={`/gallery?page=${Math.max(1, currentPage - 1)}`}
                      className="btn-show-more"
                      style={{
                        opacity: currentPage === 1 ? 0.4 : 1,
                        pointerEvents: currentPage === 1 ? "none" : "auto",
                        textDecoration: "none"
                      }}
                    >
                      ← Prev
                    </Link>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`/gallery?page=${page}`}
                        className={`btn-show-more${currentPage === page ? " filter-tab--active" : ""}`}
                        style={{
                          minWidth: "3.5rem",
                          background: currentPage === page ? "var(--ink)" : "transparent",
                          color: currentPage === page ? "var(--paper)" : "var(--ink)",
                          textDecoration: "none",
                          textAlign: "center",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {String(page).padStart(2, "0")}
                      </Link>
                    ))}
                    <Link
                      href={`/gallery?page=${Math.min(totalPages, currentPage + 1)}`}
                      className="btn-show-more"
                      style={{
                        opacity: currentPage === totalPages ? 0.4 : 1,
                        pointerEvents: currentPage === totalPages ? "none" : "auto",
                        textDecoration: "none"
                      }}
                    >
                      Next →
                    </Link>
                  </div>
                )}
              </>
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
