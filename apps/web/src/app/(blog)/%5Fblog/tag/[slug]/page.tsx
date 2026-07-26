import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles, getTagMap } from "@/lib/blog";
import { ArticleList } from "../../../components/ArticleList";
import { BLOG_NAME, pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const describe = (tag: string) => `Semua artikel KANAL yang menyinggung ${tag}.`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await getTagMap())[slug];
  if (!tag) return { title: "Tak ditemukan" };
  return pageMeta({
    title: `#${tag}`,
    description: describe(tag),
    path: `/tag/${slug}`,
    siteName: BLOG_NAME,
  });
}

export default async function TagPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const tag = (await getTagMap())[slug];
  if (!tag) notFound();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const list = await getArticles({ tag, limit: 12, page });

  return (
    <main className="k-wrap">
      <h1 className="k-listing-title">Tag: #{tag}</h1>
      <ArticleList
        docs={list.docs}
        page={page}
        hasMore={list.hasMore}
        basePath={`/tag/${slug}`}
      />
    </main>
  );
}
