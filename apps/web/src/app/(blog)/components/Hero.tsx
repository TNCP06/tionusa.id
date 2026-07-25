"use client";

import { useEffect, useRef, useState } from "react";
import type { Article } from "@/payload-types";

// Structural subset — Hero only needs what it renders, not the full Article shape.
type Slide = {
  slug: string;
  title: string;
  category: Article["category"];
  publishedAt?: string | null;
  coverImage?: Article["coverImage"];
};

const AUTOPLAY_MS = 6000;
const DWELL_MS = 400;
const SWIPE_THRESHOLD = 40;

const CAT: Record<string, string> = {
  hiburan: "HIBURAN",
  kpop: "K-POP",
  film: "FILM",
  tech: "TECH",
  tips: "TIPS",
};

const media = (v: Article["coverImage"]) => (typeof v === "object" && v ? v : null);

const fmtDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d
    .toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
};

export function Hero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX = useRef<number | null>(null);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduce, slides.length]);

  // Clear any pending dot-hover dwell timer on unmount so it never fires setI post-unmount.
  useEffect(() => () => {
    if (dwell.current) clearTimeout(dwell.current);
  }, []);

  const hoverDot = (n: number) => {
    if (dwell.current) clearTimeout(dwell.current);
    dwell.current = setTimeout(() => setI(n), DWELL_MS);
  };
  const leaveDot = () => {
    if (dwell.current) clearTimeout(dwell.current);
  };

  const go = (delta: number) =>
    setI((n) => (n + delta + slides.length) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    go(dx < 0 ? 1 : -1);
  };

  if (!slides.length) return null;
  const s = slides[i];
  const cover = media(s.coverImage);
  const date = fmtDate(s.publishedAt);
  const multi = slides.length > 1;

  return (
    <section
      className="k-carousel"
      aria-roledescription="carousel"
      aria-label="Artikel pilihan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <a className="k-carousel__link" href={`/${s.slug}`} aria-label={s.title}>
        {cover?.url ? (
          // Above the fold on every visit — this is the LCP element.
          <img
            className="k-carousel__img"
            src={cover.url}
            alt=""
            width={cover.width ?? undefined}
            height={cover.height ?? undefined}
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="k-carousel__img k-carousel__img--ph" />
        )}
        <div className="k-carousel__scrim" />
        <div className="k-carousel__text">
          <h2 className="k-carousel__title">{s.title}</h2>
          <div className="k-carousel__meta">
            {date && <span className="k-carousel__meta-date">{date}</span>}
            {date && <span className="k-carousel__meta-sep"> · </span>}
            <span className="k-carousel__meta-cat">{CAT[s.category] ?? s.category}</span>
          </div>
        </div>
      </a>

      {multi && (
        <>
          <button
            type="button"
            className="k-carousel__arrow k-carousel__arrow--prev"
            aria-label="Sebelumnya"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="k-carousel__arrow k-carousel__arrow--next"
            aria-label="Berikutnya"
            onClick={() => go(1)}
          >
            ›
          </button>

          <div className="k-carousel__dots" role="tablist" aria-label="Pilih slide">
            {slides.map((_, n) => (
              <button
                key={n}
                type="button"
                role="tab"
                className={`k-carousel__dot${n === i ? " k-carousel__dot--on" : ""}`}
                aria-label={`Slide ${n + 1}`}
                aria-selected={n === i}
                onMouseEnter={() => hoverDot(n)}
                onMouseLeave={leaveDot}
                onFocus={() => setI(n)}
                onClick={() => setI(n)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
