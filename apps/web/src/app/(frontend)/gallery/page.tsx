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

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (currentPage > 3) {
    pages.push("...");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }
  if (currentPage < totalPages - 2) {
    pages.push("...");
  }
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }
  return pages;
}

export default async function GalleryPage({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page || "1");
  const itemsPerPage = 24;

  const [entries, profile] = await Promise.all([
    getPublishedEntries(),
    getProfile(),
  ]);

  const images = galleryImages(entries);

  const totalPages = Math.ceil(images.length / itemsPerPage);
  const visibleImages = images.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
              <p className="headline" style={{ maxWidth: "60ch", marginTop: "1rem" }}>
                Visual showcase of user interfaces, system dashboards, and architecture specs. Looking for full technical breakdowns?{" "}
                <Link href="/portfolio" style={{ textDecoration: "underline", color: "var(--ink)" }}>
                  View full portfolio →
                </Link>
              </p>
            </div>

            {images.length > 0 ? (
              <>
                <GalleryGrid images={visibleImages} allImages={images} className="gallery-showcase" />
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
                    {pageNumbers.map((page, i) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`ellipsis-${i}`}
                            className="mono"
                            style={{
                              padding: "0 0.4rem",
                              color: "var(--ink-muted)",
                              userSelect: "none",
                            }}
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <Link
                          key={page}
                          href={`/gallery?page=${page}`}
                          className={`btn-show-more${currentPage === page ? " filter-tab--active" : ""}`}
                          style={{
                            minWidth: "2.75rem",
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
                      );
                    })}
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
