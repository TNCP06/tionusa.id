/**
 * Self-check for the derived /stack page. Run: pnpm --filter web check-stack
 * Pure functions, no DB — the entries below are hand-written fixtures.
 */
import assert from "node:assert/strict";
import type { PortfolioEntry } from "../src/payload-types";
import { stackCount, stackGroups, normalizeTag, shortTitle } from "../src/lib/stack";

const entry = (title: string, techStack: string[]) =>
  ({ title, techStack }) as PortfolioEntry;

// Aliases fold together.
assert.equal(normalizeTag("CSS3"), "CSS");
assert.equal(normalizeTag(" nextjs "), "Next.js");
assert.equal(normalizeTag("Payload CMS"), "Payload CMS");

// Titles lose their subtitle, but a bare title survives intact.
assert.equal(shortTitle("subx — Video Subtitle Extraction & OCR Toolkit"), "subx");
assert.equal(shortTitle("Toll-Gate Monitoring & Traffic Analytics"), "Toll-Gate Monitoring & Traffic Analytics");
assert.equal(shortTitle("Telegram Cloud Drive"), "Telegram Cloud Drive");

// CSS3/CSS and HTML5/HTML each collapse to one tool, so 5 raw tags -> 3.
const aliased = [
  entry("A", ["CSS3", "HTML5", "Python"]),
  entry("B", ["CSS", "HTML"]),
];
assert.equal(stackCount(aliased), 3);

// A tag repeated inside one entry must not count that entry twice.
assert.equal(stackCount([entry("A", ["Docker", "Docker Compose"])]), 1);

const groups = stackGroups([
  entry("Alpha", ["Python", "FastAPI", "Docker"]),
  entry("Beta", ["Python", "Next.js"]),
  entry("Gamma", ["Wolfram Language"]),
]);
const find = (label: string) => groups.find((g) => g.label === label);

// Known tags land in their editorial group; empty groups are dropped.
assert.ok(find("Backend & APIs"), "Backend group missing");
assert.ok(!find("Mobile"), "empty group should be dropped");

// Most-used tool leads its group, and carries the projects that prove it.
const backend = find("Backend & APIs")!;
assert.equal(backend.items[0].name, "Python");
assert.deepEqual(backend.items[0].projects, ["Alpha", "Beta"]);

// An unknown tag surfaces in the catch-all instead of vanishing.
const rest = find("Also in the toolbox");
assert.deepEqual(rest?.items.map((i) => i.name), ["Wolfram Language"]);

// Every tool in must be a tool out.
const total = groups.reduce((n, g) => n + g.items.length, 0);
assert.equal(total, 5, "tools were lost between input and grouping");

console.log("check-stack: all assertions passed");
