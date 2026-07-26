import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getArticleBySlug, getRelated } from "@/lib/blog";
import { ArticleCard } from "../../components/ArticleCard";
import { ShareBar } from "../../components/ShareBar";
import { BLOG_DESCRIPTION, BLOG_NAME, BLOG_URL, pageMeta } from "@/lib/seo";
import { formatSlug } from "@/fields/slug";
import { blogPostingSchema, jsonLdScript } from "@/lib/schema";

type Params = { params: Promise<{ slug: string }> };

// Rendered on demand (DB is a runtime volume); data is cached via tags (see lib/blog.ts).
export const dynamic = "force-dynamic";

type Media = { url?: string | null; width?: number | null; height?: number | null };
const media = (v: unknown): Media | null =>
  typeof v === "object" && v !== null && "url" in v ? (v as Media) : null;

const CAT: Record<string, string> = {
  hiburan: "HIBURAN",
  kpop: "K-POP",
  film: "FILM",
  tech: "TECH",
  tips: "TIPS",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Tak ditemukan" };

  const cover = media(article.coverImage)?.url;

  return pageMeta({
    title: article.title,
    description: article.excerpt || BLOG_DESCRIPTION,
    path: `/${slug}`,
    type: "article",
    siteName: BLOG_NAME,
    ...(cover ? { images: [cover] } : {}),
    ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
    ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
  });
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const cover = media(article.coverImage);
  const related = await getRelated(article.category, slug);
  const tags = (article.tags ?? []).filter(Boolean);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const ld = blogPostingSchema(article, {
    coverUrl: cover?.url,
    articleSection: CAT[article.category] ?? article.category,
  });

  return (
    <main className="k-wrap k-article">
      <a className="k-back" href="/">
        ← Semua
      </a>

      {cover?.url ? (
        // Above the fold — this is the LCP element on an article page.
        <img
          className="k-article__cover"
          src={cover.url}
          alt={article.title}
          width={cover.width ?? undefined}
          height={cover.height ?? undefined}
          fetchPriority="high"
          decoding="async"
        />
      ) : null}

      <span className="k-chip">{CAT[article.category] ?? article.category}</span>
      <h1 className="k-article__title">{article.title}</h1>
      <p className="k-article__meta">
        {date}
        {date && article.readingTime ? " · " : null}
        {article.readingTime ? `${article.readingTime} menit baca` : null}
      </p>

      <ShareBar url={`${BLOG_URL}/${slug}`} title={article.title} />

      {article.body ? (
        <div className="k-prose">
          <RichText data={article.body} />
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="k-tags">
          {tags.map((t) => (
            <a key={t} className="k-tag" href={`/tag/${formatSlug(t)}`}>
              #{t}
            </a>
          ))}
        </div>
      ) : null}

      {Array.isArray(article.sources) && article.sources.length > 0 ? (
        <div className="k-sources">
          <h3>Sumber</h3>
          <ul>
            {article.sources.map((s, i) => (
              <li key={s.id ?? i}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label || s.url} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div className="k-related">
          <h3>Terkait</h3>
          <div className="k-grid">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
      />
    </main>
  );
}
