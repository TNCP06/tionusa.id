import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/payload";
import { SiteFooter } from "../components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tech Stack",
  description: "The tools, languages, and platforms I build with.",
};

// ponytail: static content, no collection. Edit here when the stack changes.
type Tool = { name: string; tag: string; note: string };
type Group = { label: string; caption: string; items: Tool[] };

const GROUPS: Group[] = [
  {
    label: "Frontend & UI",
    caption: "Designing fluid, accessible, and performant web interfaces.",
    items: [
      { name: "Next.js", tag: "Framework", note: "App Router, Server Components, and SSR for fast, SEO-optimized web apps." },
      { name: "React", tag: "Library", note: "Modular component architecture, custom hooks, and predictable UI state." },
      { name: "TypeScript", tag: "Language", note: "Strict type-safety catching contract errors before runtime execution." },
      { name: "Tailwind & Vanilla CSS", tag: "Styling", note: "Custom design systems, CSS variables, and fluid micro-animations." },
      { name: "HTML5 & Accessibility", tag: "Core", note: "Semantic structure, ARIA standards, and Core Web Vitals optimization." },
    ],
  },
  {
    label: "Backend & Data",
    caption: "Secure API architectures and dependable database storage.",
    items: [
      { name: "Node.js & Express", tag: "Runtime", note: "Scalable asynchronous RESTful services and API micro-architectures." },
      { name: "MySQL & SQLite", tag: "Database", note: "Structured relational databases, query optimization, and schema migrations." },
      { name: "Payload CMS", tag: "CMS", note: "Code-first headless CMS with fully typed data access layers." },
      { name: "REST & GraphQL", tag: "API", note: "Predictable API contracts for seamless client-server communication." },
    ],
  },
  {
    label: "DevOps & Cloud",
    caption: "Continuous integration, containerization, and hosting reliability.",
    items: [
      { name: "Docker", tag: "Container", note: "Isolated development environments and lightweight production containers." },
      { name: "AWS EC2 & Linux", tag: "Cloud", note: "Self-hosted virtual servers tuned for performance and memory constraints." },
      { name: "Cloudflare Edge", tag: "CDN / Security", note: "Zero-trust tunnels, global edge caching, and origin shield protection." },
      { name: "Git & CI/CD", tag: "Workflow", note: "Automated test suites, branch management, and GitHub Actions deployments." },
    ],
  },
  {
    label: "Adaptability & Tools",
    caption: "Flexible toolsets tailored to project-specific demands.",
    items: [
      { name: "Rapid Stack Adoption", tag: "Client-Driven", note: "Tools serve the product, not vice versa. If your project specifies Go, Python, PostgreSQL, GraphQL, or a custom stack, I learn and adopt it rapidly with production engineering standards." },
      { name: "Figma & Design", tag: "Design", note: "Prototyping, layout wireframes, and design token extraction." },
      { name: "Postman & Bruno", tag: "Testing", note: "API testing, endpoint validation, and automated collection suites." },
      { name: "AI & LLM Tooling", tag: "Workflow", note: "Leveraging agentic AI tools to accelerate development and refactoring." },
    ],
  },
];

export default async function StackPage() {
  const profile = await getProfile();
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL;

  return (
    <>
      <main className="bands">
        <header className="hero">
          <div className="wrap">
            <p className="mono" style={{ marginBottom: "1.5rem" }}>
              Tech Stack &amp; Tooling
            </p>
            <h1 className="name" style={{ maxWidth: "18ch" }}>
              The tools I build with.
            </h1>
            <p className="headline" style={{ maxWidth: "60ch" }}>
              A comprehensive breakdown of the frameworks, languages, and cloud infrastructure behind my work. My toolset is flexible—I quickly learn and adopt whatever technology best fits the project requirements.
            </p>
          </div>
        </header>

        {/* One band: stack list + FULLSTACK share a colour */}
        <div>
        <section className="section" aria-label="Tech stack" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            {GROUPS.map((group) => (
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
                          <span className="instrument-tag">{item.tag}</span>
                        </div>
                        <p>{item.note}</p>
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
              <p className="mono adaptability-tag">ADAPTABILITY GUARANTEE // CLIENT FIRST</p>
              <h2 className="adaptability-title">Need a specific tech stack for your project?</h2>
              <p className="adaptability-desc">
                The technologies listed above are simply my daily defaults—not my boundaries. I evaluate software tools based on fundamental engineering principles, allowing me to master new languages, frameworks, or databases in days. If your project demands a different architecture, I adopt it seamlessly without compromising code quality or delivery speed.
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
