import type { Article } from "@/payload-types";
import { getFeaturedArticles, getArticles } from "@/lib/blog";
import { Hero } from "../components/Hero";
import { ArticleCard } from "../components/ArticleCard";

// Rendered on demand (DB is a runtime volume); data is cached via tags (see lib/blog.ts).
export const dynamic = "force-dynamic";

export default async function BlogHome({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; tag?: string; page?: string }>;
}) {
  const { cat, tag, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const filtered = Boolean(cat || tag);

  const showHero = !filtered && page === 1;
  const [featured, list] = await Promise.all([
    getFeaturedArticles(),
    getArticles({ category: cat, tag, limit: 12, page }),
  ]);
  // Hero (Task 8) requires non-null slugs on its slides.
  const slides = featured.filter((a): a is Article & { slug: string } => Boolean(a.slug));

  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    if (cat) q.set("cat", cat);
    if (tag) q.set("tag", tag);
    if (n > 1) q.set("page", String(n));
    const qs = q.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <main className="k-wrap">
      {showHero && slides.length > 0 ? <Hero slides={slides} /> : null}

      {tag ? (
        <p className="k-filter">
          Tag: <strong>#{tag}</strong>{" "}
          <a href={cat ? `/?cat=${cat}` : "/"}>hapus filter ✕</a>
        </p>
      ) : null}

      <div className="k-grid">
        {list.docs.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      {list.docs.length === 0 ? <p className="k-empty">Belum ada artikel.</p> : null}

      {page > 1 || list.hasMore ? (
        <nav className="k-pager" aria-label="Halaman">
          {page > 1 ? (
            <a className="k-pager__btn" href={pageHref(page - 1)}>
              ← Sebelumnya
            </a>
          ) : null}
          <span className="k-pager__at">Halaman {page}</span>
          {list.hasMore ? (
            <a className="k-pager__btn" href={pageHref(page + 1)}>
              Berikutnya →
            </a>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
