import Link from "next/link";
import { ENTRY_TYPE_LABEL } from "@/lib/format";
import type { PortfolioEntry } from "@/payload-types";

interface EntryRowProps {
  entry: PortfolioEntry;
  /** Already zero-padded, and continuous across pages. */
  num: string;
}

/** One ledger row. Server-renderable so pages without filters ship no JS for it. */
export function EntryRow({ entry: e, num }: EntryRowProps) {
  const stack = (e.techStack ?? []).filter(Boolean) as string[];
  const coverUrl =
    typeof e.coverImage === "object" && e.coverImage && "url" in e.coverImage
      ? (e.coverImage as { url: string }).url
      : null;

  return (
    <article className="entry">
      <div className="entry-figure">
        <Link
          href={`/portfolio/${e.slug ?? ""}`}
          className="entry-stretched-link"
          aria-label={`View details for ${e.title}`}
        />
        {coverUrl ? (
          <img
            className="entry-thumbnail"
            src={coverUrl}
            alt={e.title}
            loading="lazy"
          />
        ) : (
          <div className="blueprint-card">
            <div className="blueprint-grid-bg" aria-hidden="true" />
            <div className="blueprint-header">
              <span className="mono blueprint-tag">SPEC // {num}</span>
              <span className="mono blueprint-type">
                {ENTRY_TYPE_LABEL[e.entryType] ?? "SYSTEM"}
              </span>
            </div>

            <div className="blueprint-body">
              <span className="blueprint-monogram">
                {e.title
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .substring(0, 3)
                  .toUpperCase()}
              </span>
              <span className="blueprint-title-sub">{e.title}</span>
            </div>

            <div className="blueprint-footer mono">
              <span>{stack.slice(0, 3).join(" · ") || "CORE ARCHITECTURE"}</span>
              <span className="blueprint-symbol">⚙</span>
            </div>
          </div>
        )}
      </div>

      <div className="entry-body">
        <div className="entry-header">
          <span className="entry-index">{num}</span>
          <span className="entry-type">
            {ENTRY_TYPE_LABEL[e.entryType] ?? "Entry"}
          </span>
          {e.featured ? <span className="badge">Featured</span> : null}
        </div>

        <h3 className="entry-title">
          <Link href={`/portfolio/${e.slug ?? ""}`}>{e.title}</Link>
        </h3>

        {e.summary ? <p className="entry-summary">{e.summary}</p> : null}

        {stack.length > 0 ? (
          <p className="fingerprint">
            {stack.map((t, k) => (
              <span key={k}>{t}</span>
            ))}
          </p>
        ) : null}

        {e.links && e.links.length > 0 ? (
          <p className="entry-links">
            {e.links.map((l, k) => (
              <a key={k} href={l.url} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
