import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, CATEGORY_LABEL, getArticles } from "@/lib/blog";
import { ArticleList } from "../../../components/ArticleList";
import { BLOG_NAME, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

const describe = (label: string) =>
  `Semua artikel KANAL di kategori ${label} — ditulis singkat, tetap padat.`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABEL[category];
  if (!label) return { title: "Tak ditemukan" };
  return pageMeta({
    title: label,
    description: describe(label),
    path: `/kategori/${category}`,
    siteName: BLOG_NAME,
  });
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const { category } = await params;
  if (!CATEGORIES.includes(category)) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const list = await getArticles({ category, limit: 12, page });

  return (
    <main className="k-wrap">
      <h1 className="k-listing-title">Kategori: {CATEGORY_LABEL[category]}</h1>
      <ArticleList
        docs={list.docs}
        page={page}
        hasMore={list.hasMore}
        basePath={`/kategori/${category}`}
      />
    </main>
  );
}
