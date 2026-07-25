"use client";

import { useState } from "react";
import Link from "next/link";
import { EntryRow } from "./EntryRow";
import type { PortfolioEntry } from "@/payload-types";

interface ProjectLedgerProps {
  entries: PortfolioEntry[];
  limit?: number;
  showFilters?: boolean;
  showAllLink?: boolean;
}

export function ProjectLedger({
  entries,
  limit,
  showFilters = false,
  showAllLink = false,
}: ProjectLedgerProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  if (entries.length === 0) {
    return <p className="empty">No published works yet.</p>;
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // Filter by active tab, floating featured entries to the top.
  const filteredEntries = entries
    .filter((e) => activeFilter === "all" || e.entryType === activeFilter)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Offset so entry numbering keeps counting across pages (07, 08 … not 01 again).
  const pageOffset = showAllLink ? 0 : (currentPage - 1) * itemsPerPage;

  const visibleEntries = showAllLink
    ? filteredEntries.slice(0, limit ?? 6)
    : filteredEntries.slice(pageOffset, pageOffset + itemsPerPage);

  return (
    <div className="project-ledger-container">
      {showFilters && (
        <div className="filter-tabs">
          <span className="mono" style={{ marginRight: "0.5rem" }}>Filter</span>
          {[
            { label: "All", value: "all" },
            { label: "Projects", value: "project" },
            { label: "Work", value: "work_experience" },
            { label: "Education", value: "education" },
            { label: "Other", value: "other" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`filter-tab${activeFilter === tab.value ? " filter-tab--active" : ""}`}
              onClick={() => handleFilterChange(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
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

      {showAllLink && filteredEntries.length > (limit ?? 6) && (
        <div className="ledger-actions">
          <Link href="/portfolio" className="btn">
            View full archive →
          </Link>
        </div>
      )}

      {!showAllLink && totalPages > 1 && (
        <div className="ledger-actions">
          <button
            className="btn-show-more"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            type="button"
            style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn-show-more${currentPage === page ? " filter-tab--active" : ""}`}
              onClick={() => setCurrentPage(page)}
              type="button"
              style={{
                minWidth: "3rem",
                background: currentPage === page ? "var(--ink)" : "transparent",
                color: currentPage === page ? "var(--paper)" : "var(--ink)",
              }}
            >
              {String(page).padStart(2, "0")}
            </button>
          ))}
          <button
            className="btn-show-more"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            type="button"
            style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
