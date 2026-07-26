/**
 * Push the backend-first hero and About copy into the Profile global.
 *
 * The homepage only falls back to the strings in page.tsx when these fields are
 * empty, and on production they are not: the live hero headline and the whole
 * About body (including the "GraphqL" typo) come from here, so editing the page
 * component alone changes nothing that visitors see.
 *
 * Dry run (default, prints what would change and writes nothing):
 *   pnpm --filter web update-profile-copy
 * Apply:
 *   pnpm --filter web update-profile-copy --apply
 *
 * Writes the `id` locale by default, because that is what the site reads:
 * lib/payload.ts calls findGlobal without a locale, so Payload serves the
 * default locale (`id`) — which is where the current English copy is stored.
 * Pass `--locale en` to fill the English locale as well.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";

const APPLY = process.argv.includes("--apply");
const localeArg = process.argv[process.argv.indexOf("--locale") + 1];
const LOCALE = localeArg === "en" ? "en" : "id";

const FULL_NAME = "Tionusa Catur Pamungkas";

const HEADLINE =
  "I build the backend that carries the product — Node.js and Express APIs on MySQL, containerised with Docker and running on AWS EC2 — and I own the path from schema to deploy, so nothing gets lost in translation.";

const BIO = [
  "I am Tionusa Catur Pamungkas, and most projects lose weeks at the seams — API contract to frontend, frontend to whoever ends up managing the server. I start at the backend, where those seams actually cost money, and own the whole path from schema to deploy: fewer mismatched assumptions, and what you approve is what runs in production.",
  "Node.js and Express on the server, with MySQL and PostgreSQL schemas designed before the first endpoint — indexed queries, real migrations, and REST or GraphQL contracts that stay stable as the product grows.",
  "Then the part most quotes leave out: Docker images, CI pipelines, AWS EC2 and self-hosted boxes, and monitoring that flags problems before your users do. React, Next.js, and TypeScript sit on top, so the interface is not an afterthought either. “It runs on my machine” is not a deliverable — a running product is.",
];

/** Minimal Lexical document: one paragraph per string. */
const lex = (paragraphs: string[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: paragraphs.map((text) => ({
      type: "paragraph",
      version: 1,
      format: "",
      indent: 0,
      direction: "ltr" as const,
      textFormat: 0,
      textStyle: "",
      children: [
        {
          type: "text",
          text,
          format: 0,
          style: "",
          mode: "normal",
          detail: 0,
          version: 1,
        },
      ],
    })),
  },
});

async function main() {
  const payload = await getPayload({ config });
  const current = await payload.findGlobal({ slug: "profile", locale: LOCALE });

  console.log(`locale: ${LOCALE}\n`);
  console.log(`fullName\n  from: ${current.fullName}\n    to: ${FULL_NAME}\n`);
  console.log(`headline\n  from: ${current.headline}\n    to: ${HEADLINE}\n`);
  console.log(`bio: replaced with ${BIO.length} paragraphs (fixes "GraphqL")\n`);

  if (!APPLY) {
    console.log("Dry run. Re-run with --apply to write.");
    process.exit(0);
  }

  await payload.updateGlobal({
    slug: "profile",
    locale: LOCALE,
    overrideAccess: true,
    data: {
      fullName: FULL_NAME,
      headline: HEADLINE,
      bio: lex(BIO),
    },
  });

  console.log("Profile copy updated.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
