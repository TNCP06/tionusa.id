"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

// Kept literal, not imported from lib/blog: that module opens a Payload client
// at import time and this is a client component.
const tabs = [
  { label: "Semua", href: "/" },
  { label: "Hiburan", href: "/kategori/hiburan" },
  { label: "K-Pop", href: "/kategori/kpop" },
  { label: "Film", href: "/kategori/film" },
  { label: "Tech", href: "/kategori/tech" },
  { label: "Tips", href: "/kategori/tips" },
];

export function BlogNav() {
  const pathname = usePathname();

  return (
    <nav className="k-nav">
      <div className="k-wrap k-nav-inner">
        <Link className="k-brand" href="/">
          KANAL<span className="k-brand-dot">.</span>
        </Link>
        <div className="k-nav-links">
          <div className="k-tabs">
            {tabs.map((t) => (
              <Link
                key={t.href}
                className={`k-tab${t.href === pathname ? " k-tab--active" : ""}`}
                href={t.href}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
