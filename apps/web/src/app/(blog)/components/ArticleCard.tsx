import type { Article } from "@/payload-types";

const ENTERTAINMENT = new Set(["hiburan", "kpop", "film"]);

const CAT_LABEL: Record<string, string> = {
  hiburan: "HIBURAN",
  kpop: "K-POP",
  film: "FILM",
  tech: "TECH",
  tips: "TIPS",
};

const media = (v: Article["coverImage"]) => (typeof v === "object" && v ? v : null);

export function ArticleCard({ article }: { article: Article }) {
  const isEntertainment = ENTERTAINMENT.has(article.category);
  const cover = media(article.coverImage);
  const label = CAT_LABEL[article.category] ?? article.category;
  const href = article.slug ? `/${article.slug}` : "#";

  return (
    <a className={`k-card${isEntertainment ? "" : " k-card--tech"}`} href={href}>
      {isEntertainment ? (
        cover?.url ? (
          <img
            className="k-card-cover k-card-cover--img"
            src={cover.url}
            alt={article.title}
            width={cover.width ?? undefined}
            height={cover.height ?? undefined}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div className="k-card-cover" aria-hidden="true" />
        )
      ) : null}
      <div className="k-card-body">
        <span className={`k-chip${isEntertainment ? "" : " k-chip--out"}`}>{label}</span>
        <h3 className="k-card-title">{article.title}</h3>
        {!isEntertainment && article.excerpt ? (
          <p className="k-card-excerpt">{article.excerpt}</p>
        ) : null}
        {article.publishedAt || article.readingTime ? (
          <span className="k-card-meta">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null}
            {article.publishedAt && article.readingTime ? " · " : null}
            {article.readingTime ? `${article.readingTime} MNT BACA` : null}
          </span>
        ) : null}
      </div>
    </a>
  );
}
