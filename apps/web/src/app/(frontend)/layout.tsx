import type { Metadata } from "next";
import { Playfair_Display, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { SiteNav } from "./components/SiteNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Set theme before paint to avoid a flash of the wrong palette (defaults to the light gallery theme).
const themeScript = `(function(){try{var t=localStorage.getItem('tionusa-theme')||localStorage.getItem('tncp-theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: { icon: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ponytail: static lang="id" until Phase-2 i18n routing exists
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
