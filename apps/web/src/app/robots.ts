import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // `Allow` is listed first so it wins the longest-match rule: uploads are
      // served from /api/media/file/*, so a blanket /api/ block would hide
      // every image on the site.
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
