import { SITE_NAME, SITE_URL } from "@/lib/seo";

export function BlogFooter() {
  return (
    <footer className="k-footer">
      <div className="k-wrap k-footer-inner">
        <span>© {new Date().getFullYear()} KANAL</span>
        <span>
          Ditulis oleh{" "}
          <a href={`${SITE_URL}/`}>{SITE_NAME}</a> — lihat{" "}
          <a href={`${SITE_URL}/portfolio`}>portofolionya</a>.
        </span>
      </div>
    </footer>
  );
}
