"use client";

import { useState, useEffect, useCallback } from "react";

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  /** CSS class for the grid container. Defaults to "gallery". */
  className?: string;
}

export function GalleryGrid({ images, className }: GalleryGridProps) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(
    () => setActive((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length],
  );
  const next = useCallback(
    () => setActive((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      <div className={className || "gallery"}>
        {images.map((img, i) => (
          <button
            key={i}
            className="gallery-item"
            onClick={() => setActive(i)}
            type="button"
            aria-label={`View ${img.alt || "image"}`}
          >
            <img src={img.url} alt={img.alt || ""} loading="lazy" />
            {img.caption ? (
              <span className="gallery-item-caption mono">{img.caption}</span>
            ) : null}
          </button>
        ))}
      </div>

      {active !== null ? (
        <div
          className="lightbox"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            className="lightbox-close"
            onClick={close}
            type="button"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          {images.length > 1 ? (
            <>
              <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                type="button"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => { e.stopPropagation(); next(); }}
                type="button"
                aria-label="Next image"
              >
                →
              </button>
            </>
          ) : null}
          <img
            className="lightbox-img"
            src={images[active].url}
            alt={images[active].alt || ""}
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 ? (
            <span className="lightbox-counter mono">
              {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
