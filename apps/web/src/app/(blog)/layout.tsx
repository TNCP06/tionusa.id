import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { BlogNav } from "./components/BlogNav";
import { BlogFooter } from "./components/BlogFooter";
import { VisitorBeacon } from "@/components/VisitorBeacon";
import { BLOG_DESCRIPTION, BLOG_NAME, BLOG_TITLE, BLOG_URL } from "@/lib/seo";
import "./blog.css";

// Set the blog theme before paint to avoid a flash of the wrong palette.
const themeScript = `(function(){try{var t=localStorage.getItem('kanal-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.ktheme=t;}catch(e){}})();`;

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--k-display",
  weight: ["500", "600", "700"],
  display: "swap",
});
const bodyF = Inter({
  subsets: ["latin"],
  variable: "--k-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--k-mono",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BLOG_URL),
  title: { default: BLOG_TITLE, template: `%s · ${BLOG_NAME}` },
  description: BLOG_DESCRIPTION,
  icons: { icon: "/kanal-icon.svg" },
  openGraph: {
    type: "website",
    siteName: BLOG_NAME,
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: ["/kanal-logo.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${bodyF.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Suspense fallback={null}>
          <VisitorBeacon />
        </Suspense>
        <Suspense fallback={null}>
          <BlogNav />
        </Suspense>
        {children}
        <BlogFooter />
      </body>
    </html>
  );
}
