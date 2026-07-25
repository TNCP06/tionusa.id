import Link from "next/link";
import type { Profile } from "@/payload-types";

interface SiteFooterProps {
  profile: Pick<
    Profile,
    "fullName" | "availableForWork" | "socials" | "email" | "location"
  >;
  blogUrl?: string;
}

export function SiteFooter({ profile, blogUrl }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const fullName = profile.fullName || "Tionusa Catur Pamungkas";

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand-block">
            <span className="footer-brand">Tionusa</span>
            <p className="footer-tagline">
              Fullstack developer
              {profile.availableForWork ? " — open to freelance work." : "."}
            </p>
            {profile.email ? (
              <a className="footer-email" href={`mailto:${profile.email}`}>
                {profile.email} →
              </a>
            ) : null}
          </div>

          <nav className="footer-col" aria-label="Navigate">
            <span className="footer-col-title mono">Navigate</span>
            <Link href="/">Home</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/stack">Tech Stack</Link>
            <Link href="/#contact">Contact</Link>
          </nav>

          <nav className="footer-col" aria-label="Connect">
            <span className="footer-col-title mono">Connect</span>
            {(profile.socials ?? []).map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
            ))}
            {blogUrl ? <a href={blogUrl}>Blog ↗</a> : null}
          </nav>
        </div>

        <div className="footer-base">
          <span>
            © {year} {fullName}
          </span>
          <span>
            {profile.location ? `${profile.location} · ` : ""}Built with Next.js
            + Payload
          </span>
        </div>
      </div>
    </footer>
  );
}
