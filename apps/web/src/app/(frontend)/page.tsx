import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ProjectLedger } from "./components/ProjectLedger";
import { ContactForm } from "./components/ContactForm";
import { SiteFooter } from "./components/SiteFooter";
import { GalleryGrid } from "./components/GalleryGrid";

// Rendered on demand (DB is a runtime volume); data is cached via tags.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: profile.fullName || "Tionusa Catur Pamungkas",
    description: profile.headline || "Fullstack developer — systems, data, and cloud.",
  };
}

const mediaUrl = (v: unknown): string | null =>
  typeof v === "object" && v !== null && "url" in v
    ? ((v as { url?: string }).url ?? null)
    : null;

export default async function Home() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;
  const cvUrl = mediaUrl(profile.cvFile);
  const photoUrl = mediaUrl(profile.photo);

  // Homepage teaser: featured first, capped at 4.
  const homeEntries = [...entries]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  const stackCount = new Set(
    entries.flatMap((e) => (e.techStack ?? []).filter(Boolean) as string[]),
  ).size;

  const dbGalleryImages = entries.flatMap((e) =>
    (e.gallery ?? []).map((g) => ({
      url: mediaUrl(g),
      alt: e.title,
      caption: e.title,
    })),
  ).filter(
    (g): g is { url: string; alt: string; caption: string } => g.url !== null,
  );

  const galleryImages = [
    {
      url: "/editorial_web_mockup.jpg",
      alt: "Test Mockup Image",
      caption: "Test Mockup Project",
    },
    ...dbGalleryImages,
  ];

  return (
    <>
      <div className="bands">
      {/* ── Hero: editorial split ─────────────────────────────── */}
      <header className="hero">
        <div className="wrap">
          <div className="hero-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="hero-info" style={{ maxWidth: "60ch" }}>
              <p className="eyebrow">
                <span
                  className={`status-dot${profile.availableForWork ? " status-dot--ok" : ""}`}
                  aria-hidden="true"
                />
                <span className="mono">
                  Fullstack Developer
                  {profile.availableForWork ? " · Open to freelance" : " · Currently booked"}
                </span>
              </p>
              <h1 className="name">Tionusa</h1>

              <p className="headline">
                I build dependable backends — data pipelines, cloud
                infrastructure, and systems that scale quietly.
              </p>

              <div className="actions">
                <Link className="btn btn-primary" href="/#contact">
                  Hire me
                </Link>
                <Link className="btn" href="/portfolio">
                  View portfolio
                </Link>
                {cvUrl ? (
                  <a className="btn" href={cvUrl} target="_blank" rel="noreferrer">
                    Download CV
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Philosophy / About ────────────────────────────────── */}
      {profile.bio ? (
        <section className="section band-dark" id="about" aria-label="About">
          <div className="wrap">
            <div className="section-head">
              <h2>About Me</h2>
              <span className="mono">Philosophy</span>
            </div>
            <div className="about-grid">
              <div className="prose">
                <RichText data={profile.bio} />
              </div>
              {photoUrl ? (
                <figure className="about-figure" style={{ margin: 0 }}>
                  <img src={photoUrl} alt={profile.fullName || "Portrait"} loading="lazy" />
                  <figcaption>Portrait / {new Date().getFullYear()}</figcaption>
                </figure>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Stats band ────────────────────────────────────────── */}
      <section className="section" aria-label="At a glance">
        <div className="wrap">
          <dl className="stats">
            <div className="stat">
              <dt>Availability</dt>
              <dd>{profile.availableForWork ? "Open" : "Booked"}</dd>
            </div>
            <div className="stat">
              <dt>Focus</dt>
              <dd className="stat-word">Backend &amp; Cloud</dd>
            </div>
            <div className="stat">
              <dt>Projects Shipped</dt>
              <dd>
                {entries.length}
                <span className="unit">+</span>
              </dd>
            </div>
            <div className="stat">
              <dt>Technologies</dt>
              <dd>
                {stackCount}
                <span className="unit">+</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Curated Works ─────────────────────────────────────── */}
      <section className="section" id="work" aria-label="Featured Projects">
        <div className="wrap">
          <div className="section-head">
            <h2>
              <Link href="/portfolio">
                Featured Projects <span className="arrow">→</span>
              </Link>
            </h2>
            <Link className="mono" href="/portfolio" style={{ textDecoration: "none" }}>
              Projects · {String(entries.length).padStart(2, "0")}
            </Link>
          </div>

          <ProjectLedger
            entries={homeEntries}
            showFilters={false}
            showAllLink={false}
          />

          <div className="ledger-actions">
            <Link className="btn btn-primary" href="/portfolio">
              See all projects →
            </Link>
            <Link className="btn" href="/stack">
              View tech stack →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Curated Gallery Showcase ────────────────────────────────── */}
      {galleryImages.length > 0 ? (
        <section className="section" id="gallery" aria-label="Visual Gallery">
          <div className="wrap">
            <div className="section-head">
              <h2>
                <Link href="/gallery">
                  Visual Showcase <span className="arrow">→</span>
                </Link>
              </h2>
              <span className="mono">Gallery · {String(galleryImages.length).padStart(2, "0")}</span>
            </div>

            <GalleryGrid images={galleryImages.slice(0, 6)} />

            <div className="ledger-actions" style={{ marginTop: "3rem" }}>
              <Link className="btn" href="/gallery">
                View full visual archive →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Start a Dialogue ──────────────────────────────────── */}
      <section className="section" id="contact" aria-label="Contact">
        <div className="wrap">
          <div className="section-head">
            <h2>Get in Touch</h2>
            <span className="mono">Contact</span>
          </div>
          <div className="contact-card">
            <div className="contact-info">
              <h3 className="contact-title">Let&rsquo;s build something great together.</h3>
              <p className="contact-desc">
                Available for freelance work — backend architecture, systems
                engineering, database design, and cloud deployment. Send a
                message and I&rsquo;ll reply.
              </p>

              <div className="contact-actions">
                {profile.email ? (
                  <a className="contact-email-btn" href={`mailto:${profile.email}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    Email me
                  </a>
                ) : null}
                {(profile.socials ?? []).map((s, i) => (
                  <a
                    key={i}
                    className="btn"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
      </div>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
