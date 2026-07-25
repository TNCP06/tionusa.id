import type { PortfolioEntry } from "../payload-types";

export type StackTool = { name: string; projects: string[] };
export type StackGroup = { label: string; caption: string; items: StackTool[] };

/**
 * The AI sends whatever a repo calls itself, so the same tool arrives under
 * several spellings. Fold them together (key = lowercased incoming tag) before
 * anything counts or renders them.
 */
const ALIAS: Record<string, string> = {
  css3: "CSS",
  html5: "HTML",
  "docker compose": "Docker",
  nextjs: "Next.js",
  "next js": "Next.js",
  node: "Node.js",
  nodejs: "Node.js",
  postgres: "PostgreSQL",
  ts: "TypeScript",
  js: "JavaScript",
};

export const normalizeTag = (tag: string): string =>
  ALIAS[tag.trim().toLowerCase()] ?? tag.trim();

/**
 * Editorial grouping — the only part maintained by hand. Tags are matched
 * case-insensitively against these lists; anything the AI sends that is not
 * claimed here lands in the trailing catch-all group, so a new technology
 * appears on the page by itself instead of silently vanishing.
 */
const GROUPS: { label: string; caption: string; tags: string[] }[] = [
  {
    label: "Frontend & UI",
    caption: "Interfaces built to stay fast and accessible as they grow.",
    tags: [
      "Next.js", "React", "TypeScript", "JavaScript", "HTML", "CSS",
      "Tailwind CSS", "Vite", "Chrome Extensions", "Manifest V3",
    ],
  },
  {
    label: "Mobile",
    caption: "Cross-platform apps from one codebase.",
    tags: ["Flutter", "Dart"],
  },
  {
    label: "Backend & APIs",
    caption: "Services and contracts that stay predictable under load.",
    tags: [
      "Python", "FastAPI", "Node.js", "Express", "Hono", "PHP", "Laravel",
      "Payload CMS", "Better Auth", "Telegram Bot API", "REST", "GraphQL",
    ],
  },
  {
    label: "Data & Storage",
    caption: "Relational schemas, migrations, and query paths that hold up.",
    tags: [
      "PostgreSQL", "SQLite", "MySQL", "Prisma", "Supabase", "Firebase",
      "DynamoDB", "Hadoop",
    ],
  },
  {
    label: "DevOps & Cloud",
    caption: "Containers, pipelines, and the hosting that keeps them running.",
    tags: [
      "Docker", "GitHub Actions", "AWS", "Cloudflare Tunnel", "Linux",
      "Turborepo", "pnpm", "Shell", "Beszel", "Git",
    ],
  },
  {
    label: "Systems, IoT & AI",
    caption: "Lower-level and specialised work outside the usual web stack.",
    tags: [
      "C++", "ESP32", "MQTT", "HiveMQ", "FFmpeg", "ONNX Runtime", "RapidOCR",
      "Claude Code CLI", "Vercel AI SDK",
    ],
  },
];

const CATCH_ALL = {
  label: "Also in the toolbox",
  caption: "Picked up where a project needed it.",
};

/**
 * Portfolio titles carry a subtitle after an em/en dash ("subx — Video Subtitle
 * Extraction & OCR Toolkit"). Only the head is useful as a credit line, and the
 * full titles push cards to wildly different heights in the grid.
 */
export const shortTitle = (title: string): string =>
  title.split(/\s[—–-]\s/)[0].trim() || title.trim();

/** tool name -> titles of the entries using it, normalized and deduped. */
function toolIndex(entries: PortfolioEntry[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const entry of entries) {
    const seen = new Set<string>();
    for (const raw of entry.techStack ?? []) {
      if (typeof raw !== "string" || !raw.trim()) continue;
      const name = normalizeTag(raw);
      if (seen.has(name)) continue; // one entry counts once per tool
      seen.add(name);
      index.set(name, [...(index.get(name) ?? []), shortTitle(entry.title)]);
    }
  }
  return index;
}

/** Unique technologies across the portfolio — the homepage "Technologies" figure. */
export const stackCount = (entries: PortfolioEntry[]): number =>
  toolIndex(entries).size;

/**
 * The /stack page content, derived from what the portfolio actually proves.
 * Most-used tools lead each group; empty groups drop out.
 */
export function stackGroups(entries: PortfolioEntry[]): StackGroup[] {
  const index = toolIndex(entries);
  const claimed = new Set<string>();

  const byUsage = (a: StackTool, b: StackTool) =>
    b.projects.length - a.projects.length || a.name.localeCompare(b.name);

  const groups: StackGroup[] = GROUPS.map(({ label, caption, tags }) => {
    const wanted = new Map(tags.map((t) => [t.toLowerCase(), t]));
    const items: StackTool[] = [];
    for (const [name, projects] of index) {
      if (!wanted.has(name.toLowerCase())) continue;
      claimed.add(name);
      items.push({ name, projects });
    }
    return { label, caption, items: items.sort(byUsage) };
  });

  const rest = [...index]
    .filter(([name]) => !claimed.has(name))
    .map(([name, projects]) => ({ name, projects }))
    .sort(byUsage);
  if (rest.length) groups.push({ ...CATCH_ALL, items: rest });

  return groups.filter((g) => g.items.length > 0);
}
