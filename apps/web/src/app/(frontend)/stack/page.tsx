import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { stackGroups } from "@/lib/stack";
import { SiteFooter } from "../components/SiteFooter";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Tech Stack",
  description:
    "The languages, runtimes, databases, and infrastructure I have shipped production work with — Node.js, Express, MySQL, Docker, AWS EC2, Next.js.",
  path: "/stack",
});

export default async function StackPage() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  // Derived from the portfolio, so the page can only list what shipped work
  // actually proves. Grouping lives in lib/stack.ts.
  const groups = stackGroups(entries);

  return (
    <>
      <main className="bands">
        <header className="hero">
          <div className="wrap">
            <p className="mono" style={{ marginBottom: "1.5rem" }}>
              Tech Stack &amp; Tooling
            </p>
            <h1 className="name subpage-title">
              The tools I build with.
            </h1>
            <p className="headline" style={{ maxWidth: "60ch" }}>
              Every tool below is one I have shipped with — pulled straight from
              the projects in my portfolio, not a wishlist. Each entry names the
              work it came from.
            </p>
          </div>
        </header>

        {/* One band: stack list + FULLSTACK share a colour */}
        <div>
        <section className="section" aria-label="Tech stack" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            {groups.map((group) => (
              <div className="instruments-group" key={group.label}>
                <div className="instruments-grid">
                  <div>
                    <p className="mono">{group.label}</p>
                    <p
                      style={{
                        color: "var(--ink-muted)",
                        fontSize: "0.92rem",
                        marginTop: "0.75rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {group.caption}
                    </p>
                  </div>
                  <div className="instruments-list">
                    {group.items.map((item) => (
                      <div className="instrument" key={item.name}>
                        <div className="instrument-name">
                          <h3>{item.name}</h3>
                          {/* Badge only for repeat use — when 7 of 10 tools sit
                              at one project, "1 PROJECT" on every card is noise
                              that buries the ones that earned a number. */}
                          {item.projects.length > 1 ? (
                            <span className="instrument-tag">
                              {item.projects.length} projects
                            </span>
                          ) : null}
                        </div>
                        <p>
                          {item.projects.slice(0, 3).join(" · ")}
                          {item.projects.length > 3
                            ? ` +${item.projects.length - 3} more`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Confident Adaptability Callout */}
        <section className="section" aria-label="Client Adaptability">
          <div className="wrap">
            <div className="panel adaptability-panel">
              <p className="mono adaptability-tag">ADAPTABILITY // EVIDENCE, NOT CLAIMS</p>
              <h2 className="adaptability-title">Working in a stack that is not on this list?</h2>
              {/* Names languages instead of counting them: a count goes stale
                  the moment a new one ships, and this page is derived
                  everywhere else. */}
              <p className="adaptability-desc">
                That list is a record, not a boundary. It already runs from
                TypeScript and Python to PHP, Dart, and C++, across web apps,
                mobile, browser extensions, embedded IoT, and data pipelines —
                because I pick what the problem needs, not what I am
                comfortable with. A new framework, an unfamiliar database, or
                someone else&rsquo;s legacy codebase is a ramp-up, not a risk:
                the fundamentals carry over, and an AI-assisted workflow keeps
                the ramp short. The architecture calls, the review, and the
                production hardening stay mine — so if you are already
                committed to a stack, name it and I will build in it.
              </p>
            </div>
          </div>
        </section>

          <section
            className="section"
            aria-hidden="true"
            style={{ paddingBlock: "clamp(3rem, 8vw, 6rem)" }}
          >
            <div className="wrap">
              <p
                className="mono"
                style={{ textAlign: "center", marginBottom: "1.5rem" }}
              >
                End to end
              </p>
              <p className="megaword">FULLSTACK</p>
            </div>
          </section>
        </div>

        <section className="section" aria-label="Work with me">
            <div className="wrap">
              <div className="cta-band">
                <p className="mono">Work with me</p>
                <h2>Have a project in mind?</h2>
                <Link className="btn btn-primary" href="/#contact">
                  Get in touch →
                </Link>
              </div>
            </div>
          </section>
      </main>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
