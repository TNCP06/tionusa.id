/**
 * Slugify the filenames of media uploaded before the Media collection gained
 * its filename hook. "Screenshot 2026-07-25 191340.png" becomes
 * "screenshot-2026-07-25-191340.png", so the URL stops carrying encoded spaces.
 *
 * Renames the file on disk and updates the `filename` Payload holds for it;
 * derivative sizes (thumbnail/card/wide) move alongside the original.
 *
 * Dry run (default, prints the plan and changes nothing):
 *   pnpm --filter web rename-media
 * Apply:
 *   pnpm --filter web rename-media --apply
 *
 * Run it where the media directory actually lives — on the VPS that means
 * inside the container, where MEDIA_DIR points at the Docker volume.
 */
import fs from "fs/promises";
import path from "path";
import { getPayload } from "payload";
import config from "../src/payload.config";
import { formatSlug } from "../src/fields/slug";

const APPLY = process.argv.includes("--apply");
const MEDIA_DIR = process.env.MEDIA_DIR || "./data/media";

/** Slugify the stem, keep the extension. */
function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  return `${formatSlug(stem) || "file"}${ext}`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Append -2, -3 … until the target name is free on disk. */
async function freeName(candidate: string): Promise<string> {
  const dot = candidate.lastIndexOf(".");
  const stem = dot > 0 ? candidate.slice(0, dot) : candidate;
  const ext = dot > 0 ? candidate.slice(dot) : "";
  let name = candidate;
  let n = 2;
  while (await exists(path.join(MEDIA_DIR, name))) {
    name = `${stem}-${n}${ext}`;
    n += 1;
  }
  return name;
}

async function main() {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "media", limit: 1000, depth: 0 });

  let planned = 0;

  for (const doc of docs) {
    const current = doc.filename;
    if (!current) continue;

    const slugified = slugifyFilename(current);
    if (slugified === current) continue;

    const target = APPLY ? await freeName(slugified) : slugified;
    planned += 1;
    console.log(`${current}\n  -> ${target}`);

    if (!APPLY) continue;

    await fs.rename(path.join(MEDIA_DIR, current), path.join(MEDIA_DIR, target));

    const sizes = (doc.sizes ?? {}) as Record<string, { filename?: string | null }>;
    const nextSizes: Record<string, { filename: string }> = {};
    for (const [key, size] of Object.entries(sizes)) {
      if (!size?.filename) continue;
      const renamed = slugifyFilename(size.filename);
      if (renamed === size.filename) continue;
      if (await exists(path.join(MEDIA_DIR, size.filename))) {
        await fs.rename(
          path.join(MEDIA_DIR, size.filename),
          path.join(MEDIA_DIR, renamed),
        );
      }
      nextSizes[key] = { filename: renamed };
    }

    // The file is already on disk under its new name, so this is a
    // metadata-only update — Payload does not reprocess the image.
    await payload.update({
      collection: "media",
      id: doc.id,
      overrideAccess: true,
      data: {
        filename: target,
        ...(Object.keys(nextSizes).length ? { sizes: nextSizes } : {}),
      },
    });
  }

  console.log(
    planned === 0
      ? "Nothing to rename."
      : APPLY
        ? `Renamed ${planned} file(s).`
        : `${planned} file(s) would be renamed. Re-run with --apply.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
