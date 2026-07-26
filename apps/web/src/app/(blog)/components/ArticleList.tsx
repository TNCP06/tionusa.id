import type { Article } from "@/payload-types";
import { ArticleCard } from "./ArticleCard";

interface ArticleListProps {
  docs: Article[];
  page: number;
  hasMore: boolean;
  /** Path this listing lives at — "/", "/kategori/tech", "/tag/kimi-k3". */
  basePath: string;
}

/** Grid + pager shared by the blog index, category pages, and tag pages. */
export function ArticleList({ docs, page, hasMore, basePath }: ArticleListProps) {
  const pageHref = (n: number) => (n > 1 ? `${basePath}?page=${n}` : basePath);

  return (
    <>
      <div className="k-grid">
        {docs.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      {docs.length === 0 ? <p className="k-empty">Belum ada artikel.</p> : null}

      {page > 1 || hasMore ? (
        <nav className="k-pager" aria-label="Halaman">
          {page > 1 ? (
            <a className="k-pager__btn" href={pageHref(page - 1)} rel="prev">
              ← Sebelumnya
            </a>
          ) : null}
          <span className="k-pager__at">Halaman {page}</span>
          {hasMore ? (
            <a className="k-pager__btn" href={pageHref(page + 1)} rel="next">
              Berikutnya →
            </a>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
