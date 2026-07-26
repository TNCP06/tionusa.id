import type { Metadata } from "next";
import type { Article } from "@/payload-types";
import { getFeaturedArticles, getArticles } from "@/lib/blog";
import { Hero } from "../components/Hero";
import { ArticleList } from "../components/ArticleList";

// Rendered on demand (DB is a runtime volume); data is cached via tags (see lib/blog.ts).
export const dynamic = "force-dynamic";

type Params = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Math.max(1, Number(page) || 1);
  return { alternates: { canonical: n > 1 ? `/?page=${n}` : "/" } };
}

export default async function BlogHome({ searchParams }: Params) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [featured, list] = await Promise.all([
    getFeaturedArticles(),
    getArticles({ limit: 12, page }),
  ]);
  // Hero (Task 8) requires non-null slugs on its slides.
  const slides = featured.filter((a): a is Article & { slug: string } => Boolean(a.slug));

  return (
    <main className="k-wrap">
      {page === 1 && slides.length > 0 ? <Hero slides={slides} /> : null}
      <ArticleList docs={list.docs} page={page} hasMore={list.hasMore} basePath="/" />
    </main>
  );
}
