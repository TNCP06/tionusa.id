import Link from "next/link";
import { EntryRow } from "./EntryRow";
import type { PortfolioEntry } from "@/payload-types";

const PER_PAGE = 6;

/** `value` doubles as the `?category=` value and the `entryType` it matches. */
const FILTERS = [
  { label: "All", value: "all" },
  { label: "Projects", value: "project" },
  { label: "Work", value: "work_experience" },
  { label: "Education", value: "education" },
  { label: "Other", value: "other" },
] as const;

export const CATEGORIES = FILTERS.map((f) => f.value);

interface ProjectLedgerProps {
  entries: PortfolioEntry[];
  /** 1-based, already clamped by the page. */
  page: number;
  /** One of CATEGORIES; "all" means unfiltered. */
  category: string;
  showFilters?: boolean;
}

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

/**
 * Filtering and paging are URL state, not component state: every tab and page
 * number is a real crawlable href, and the whole ledger stays server-rendered.
 */
export function ProjectLedger({
  entries,
  page,
  category,
  showFilters = false,
}: ProjectLedgerProps) {
  if (entries.length === 0) {
    return <p className="empty">No published works yet.</p>;
  }

  const href = (opts: { category?: string; page?: number }) => {
    const cat = opts.category ?? category;
    const p = opts.page ?? 1;
    const q = new URLSearchParams();
    if (cat !== "all") q.set("category", cat);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/portfolio${qs ? `?${qs}` : ""}#projects`;
  };

  // Filter by active tab, floating featured entries to the top.
  const filteredEntries = entries
    .filter((e) => category === "all" || e.entryType === category)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  // Offset so entry numbering keeps counting across pages (07, 08 … not 01 again).
  const pageOffset = (currentPage - 1) * PER_PAGE;
  const visibleEntries = filteredEntries.slice(pageOffset, pageOffset + PER_PAGE);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="project-ledger-container">
      {showFilters && (
        <div className="filter-tabs">
          <span className="mono" style={{ marginRight: "0.5rem" }}>Filter</span>
          {FILTERS.map((tab) => (
            <Link
              key={tab.value}
              className={`filter-tab${category === tab.value ? " filter-tab--active" : ""}`}
              href={href({ category: tab.value })}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      <div className="ledger">
        {visibleEntries.map((e, i) => (
          <EntryRow
            key={e.id}
            entry={e}
            num={String(pageOffset + i + 1).padStart(2, "0")}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="ledger-actions">
          <Link
            className="btn-show-more"
            href={href({ page: currentPage - 1 })}
            aria-disabled={currentPage === 1}
            rel="prev"
            style={{
              opacity: currentPage === 1 ? 0.4 : 1,
              pointerEvents: currentPage === 1 ? "none" : "auto",
            }}
          >
            ← Prev
          </Link>

          {pageNumbers.map((p, i) => {
            if (p === "...") {
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
                key={p}
                className="btn-show-more"
                href={href({ page: p })}
                aria-current={currentPage === p ? "page" : undefined}
                style={{
                  minWidth: "2.75rem",
                  background: currentPage === p ? "var(--ink)" : "transparent",
                  color: currentPage === p ? "var(--paper)" : "var(--ink)",
                }}
              >
                {String(p).padStart(2, "0")}
              </Link>
            );
          })}

          <Link
            className="btn-show-more"
            href={href({ page: currentPage + 1 })}
            aria-disabled={currentPage === totalPages}
            rel="next"
            style={{
              opacity: currentPage === totalPages ? 0.4 : 1,
              pointerEvents: currentPage === totalPages ? "none" : "auto",
            }}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
