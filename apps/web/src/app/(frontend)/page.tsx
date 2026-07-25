import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { EntryRow } from "./components/EntryRow";
import { ContactForm } from "./components/ContactForm";
import { SiteFooter } from "./components/SiteFooter";
import { GalleryGrid } from "./components/GalleryGrid";
import { galleryImages, mediaUrl } from "@/lib/format";
import { stackCount } from "@/lib/stack";

// Rendered on demand (DB is a runtime volume); data is cached via tags.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: profile.fullName || "Tionusa Catur Pamungkas",
    description:
      profile.headline ||
      "Fullstack Developer — React, Next.js, Node, and the data layers behind them.",
  };
}

export default async function Home() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || "/blog";
  const cvUrl = mediaUrl(profile.cvFile);
  const photoUrl = mediaUrl(profile.photo) || "/profile.jpg";

  // Homepage teaser: featured first, capped at 4.
  const homeEntries = [...entries]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  // Same normalization as /stack, so the two figures never disagree.
  const techCount = stackCount(entries);

  const images = galleryImages(entries);

  return (
    <>
      <div className="bands">
      {/* ── Hero: oversized display type, full margin-to-margin ── */}
      <header className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-info">
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
                {profile.headline ||
                  "Ship production apps without the usual handoff mess — I own the frontend, the backend, and the deploy, so nothing gets lost in translation."}
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

      <section className="section band-dark" id="about" aria-label="About">
        <div className="wrap">
          <div className="section-head">
            <h2>About Me</h2>
            <span className="mono">Philosophy</span>
          </div>
          <div className="about-grid">
            {photoUrl ? (
              <figure className="about-figure" style={{ margin: 0 }}>
                <img src={photoUrl} alt={profile.fullName || "Portrait"} loading="lazy" />
                <figcaption>Portrait / {new Date().getFullYear()}</figcaption>
              </figure>
            ) : null}
            <div className="about-body">
              <div className="prose">
                {profile.bio ? (
                  <RichText data={profile.bio} />
                ) : (
                  <>
                    <p>
                      Most projects lose weeks to handoffs — design to frontend,
                      frontend to backend, backend to whoever manages the server. I
                      close that gap by owning the whole path myself: fewer
                      mismatched assumptions, and what you approve in the mockup is
                      what ships to production.
                    </p>
                    <p>
                      React, Next.js, and TypeScript on the frontend — component
                      systems built to be reused, not rebuilt per page, tuned for
                      Core Web Vitals. Node and relational schemas on the backend,
                      with REST or GraphQL contracts that stay stable as the product
                      grows.
                    </p>
                    <p>
                      It does not stop at code: Docker images, CI pipelines,
                      self-hosted infrastructure, and monitoring that flags problems
                      before your users do. &ldquo;It runs on my machine&rdquo; is
                      not a deliverable — a running product is.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Facts band ────────────────────────────────────────── */}
      <section className="section" aria-label="At a glance">
        <div className="wrap">
          <dl className="facts">
            {profile.location ? (
              <div>
                <dt className="mono">Based in</dt>
                <dd>{profile.location}</dd>
              </div>
            ) : null}
            <div>
              <dt className="mono">Projects</dt>
              <dd>{String(entries.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt className="mono">Technologies</dt>
              <dd>{techCount}</dd>
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

          {/* Rows straight from the server: the teaser has no filters or paging. */}
          <div className="ledger">
            {homeEntries.map((e, i) => (
              <EntryRow
                key={e.id}
                entry={e}
                num={String(i + 1).padStart(2, "0")}
              />
            ))}
          </div>

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
      {images.length > 0 ? (
        <section className="section" id="gallery" aria-label="Visual Gallery">
          <div className="wrap">
            <div className="section-head">
              <h2>
                <Link href="/gallery">
                  Visual Showcase <span className="arrow">→</span>
                </Link>
              </h2>
              <span className="mono">Gallery · {String(images.length).padStart(2, "0")}</span>
            </div>

            <GalleryGrid images={images.slice(0, 6)} />

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
                Open for freelance work — web applications, frontend
                architecture, design systems, responsive UI. Tell me what
                you&rsquo;re building and I&rsquo;ll tell you how fast I can
                ship it.
              </p>

              <div className="contact-actions">
                {profile.email ? (
                  <a className="contact-email-btn" href={`mailto:${profile.email}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    Email me
                  </a>
                ) : null}
                {(profile.socials ?? []).map((s, i) => {
                  let icon = null;
                  if (s.kind === "github") {
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "0.45rem" }}>
                        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.8.55A10.99 10.99 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
                      </svg>
                    );
                  } else if (s.kind === "linkedin") {
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "0.45rem" }}>
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    );
                  } else {
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.45rem" }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    );
                  }
                  return (
                    <a
                      key={i}
                      className="btn"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      {icon}
                      {s.label}
                    </a>
                  );
                })}
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
