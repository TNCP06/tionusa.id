/**
 * Rename portfolio entry slugs that read badly outside their original context.
 *
 * PRECONDITION — verify before running with --apply:
 *   These renames ship WITHOUT 301 redirects, which is only safe while no
 *   portfolio URL is indexed. Confirm that first:
 *     1. Search `site:tncp.web.id` on Google.
 *     2. Check the Search Console coverage report for indexed /portfolio/* URLs.
 *   If any of the old slugs below is indexed, do not run this — add redirects
 *   for those paths first (next.config.ts `redirects()`), then rename.
 *
 * Dry run (default, prints the plan and changes nothing):
 *   pnpm --filter web rename-slugs
 * Apply:
 *   pnpm --filter web rename-slugs --apply
 *
 * Entries are matched by their current slug, so re-running after a successful
 * apply is a no-op.
 */
import { getPayload } from "payload";
import config from "../src/payload.config";

const APPLY = process.argv.includes("--apply");

const RENAMES: { from: string; to: string; why: string }[] = [
  {
    from: "pwl-2024-web-application",
    to: "course-management-web-application",
    why: "PWL is an internal course code and means nothing outside the campus",
  },
  {
    from: "profile-switcher-sessioncookie-manager-untuk-chrome-brave",
    to: "profile-switcher-session-cookie-manager-for-chrome",
    why: "Indonesian 'untuk' in an otherwise English site; Brave is Chromium anyway",
  },
  {
    from: "tncpwebid-personal-site-portfolio-nextjs-payload-cms-self-hosted",
    to: "personal-site-nextjs-payload-cms",
    why: "'tncpwebid' is a mangled domain, and the slug ran past 60 characters",
  },
  {
    from: "jawara-mobile-flutter-mobile-application",
    to: "jawara-flutter-mobile-application",
    why: "'mobile' appeared twice",
  },
];

async function main() {
  const payload = await getPayload({ config });
  let planned = 0;

  for (const { from, to, why } of RENAMES) {
    const { docs } = await payload.find({
      collection: "portfolio-entries",
      where: { slug: { equals: from } },
      limit: 1,
      depth: 0,
      // Drafts have their own slugs too; match whatever is stored.
      draft: true,
      overrideAccess: true,
    });

    const entry = docs[0];
    if (!entry) {
      console.log(`skip  ${from}\n      (no entry with this slug)`);
      continue;
    }

    const clash = await payload.find({
      collection: "portfolio-entries",
      where: { slug: { equals: to } },
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });
    if (clash.docs.length > 0) {
      console.log(`skip  ${from}\n      ("${to}" is already taken)`);
      continue;
    }

    planned += 1;
    console.log(`${from}\n  -> ${to}\n     ${why}`);

    if (!APPLY) continue;

    await payload.update({
      collection: "portfolio-entries",
      id: entry.id,
      data: { slug: to },
      overrideAccess: true,
      // Keep the published version published: updating a draft-enabled
      // collection without this would park the change in a draft.
      draft: false,
    });
  }

  console.log(
    planned === 0
      ? "Nothing to rename."
      : APPLY
        ? `Renamed ${planned} slug(s).`
        : `${planned} slug(s) would be renamed. Re-run with --apply.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
