import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, getPublishedEntries } from "@/lib/payload";
import { ProjectLedger } from "../components/ProjectLedger";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: `Portfolio · ${profile.fullName || "Tionusa Catur Pamungkas"}`,
    description: "Selected web applications, frontend design systems, and fullstack projects.",
  };
}

export default async function PortfolioPage() {
  const [profile, entries] = await Promise.all([
    getProfile(),
    getPublishedEntries(),
  ]);

  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <div className="bands">
      <header className="hero" aria-label="Portfolio intro">
        <div className="wrap">
          <p className="mono" style={{ marginBottom: "1.5rem" }}>
            Portfolio · All Projects
          </p>
          <h1 className="name subpage-title">Selected Work</h1>
          <p className="headline" style={{ maxWidth: "60ch" }}>
            Web applications, interactive interfaces, and fullstack systems I&rsquo;ve designed and shipped. Filter by category, open any entry, or{" "}
            <Link href="/gallery" style={{ textDecoration: "underline", color: "var(--ink)" }}>
              explore the Visual Archive →
            </Link>
          </p>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Projects">
        <div className="wrap">
          <ProjectLedger entries={entries} showFilters={true} showAllLink={false} />
        </div>
      </section>
      </div>

      <SiteFooter profile={profile} blogUrl={blogUrl} />
    </>
  );
}
