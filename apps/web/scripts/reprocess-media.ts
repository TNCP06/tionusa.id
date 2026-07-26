/**
 * Generate the WebP derivatives for media uploaded before the Media collection
 * declared `imageSizes`. Payload only builds sizes at upload time, so existing
 * files have none and `srcset` stays empty for them.
 *
 * Why this does not just re-upload through Payload: `payload.update` with a
 * `filePath` runs the dedupe that guarantees unique filenames, and the media
 * row's own filename counts as the collision — the original comes back as
 * "…-191325.png" instead of "…-191324.png", breaking every reference to it.
 * So the derivatives are produced with sharp directly, mirroring the widths and
 * format in collections/Media.ts, and only the `sizes` metadata is written.
 * The original file is never touched.
 *
 * Dry run (default, lists what would be processed and writes nothing):
 *   pnpm --filter web reprocess-media
 * Apply:
 *   pnpm --filter web reprocess-media --apply
 *
 * Non-images (PDF) and images narrower than a given width are skipped for that
 * width — Payload never upscales, and neither does this.
 *
 * Run it where the media directory lives. MEDIA_DIR must point at it.
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getPayload } from "payload";
import config from "../src/payload.config";
import { Media } from "../src/collections/Media";

const APPLY = process.argv.includes("--apply");
const MEDIA_DIR = process.env.MEDIA_DIR || "./data/media";

type SizeSpec = {
  name: string;
  width: number;
  formatOptions?: { format: string; options?: { quality?: number } };
};

// Single source of truth: whatever the collection declares is what gets built.
const SIZES = (
  typeof Media.upload === "object" ? (Media.upload.imageSizes ?? []) : []
) as SizeSpec[];

const kb = (n: number) => `${Math.round(n / 1024)} KB`;

async function main() {
  if (SIZES.length === 0) throw new Error("Media.upload.imageSizes is empty");

  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: "media", limit: 1000, depth: 0 });

  let done = 0;
  let skipped = 0;
  let originalBytes = 0;
  let cardBytes = 0;

  for (const doc of docs) {
    if (!doc.filename) continue;

    if (!doc.mimeType?.startsWith("image/")) {
      skipped += 1;
      continue;
    }

    const already = Object.values(
      (doc.sizes ?? {}) as Record<string, { filename?: string | null }>,
    ).filter((s) => s?.filename);
    if (already.length > 0) {
      skipped += 1;
      continue;
    }

    const original = path.join(MEDIA_DIR, doc.filename);
    try {
      await fs.access(original);
    } catch {
      console.log(`missing on disk, skipped: ${doc.filename}`);
      skipped += 1;
      continue;
    }

    if (!APPLY) {
      console.log(`would process: ${doc.filename} (${kb(doc.filesize ?? 0)})`);
      done += 1;
      continue;
    }

    const meta = await sharp(original).metadata();
    const dot = doc.filename.lastIndexOf(".");
    const stem = dot > 0 ? doc.filename.slice(0, dot) : doc.filename;

    const sizes: Record<string, unknown> = {};
    const built: string[] = [];

    for (const spec of SIZES) {
      // Payload does not upscale, so a source narrower than the target has no
      // derivative at that width — leave the entry unset, not a broken URL.
      if ((meta.width ?? 0) <= spec.width) continue;

      const quality = spec.formatOptions?.options?.quality ?? 80;
      const buf = await sharp(original).resize({ width: spec.width }).webp({ quality }).toBuffer({
        resolveWithObject: true,
      });
      const filename = `${stem}-${buf.info.width}x${buf.info.height}.webp`;
      await fs.writeFile(path.join(MEDIA_DIR, filename), buf.data);

      sizes[spec.name] = {
        url: `/api/media/file/${filename}`,
        width: buf.info.width,
        height: buf.info.height,
        mimeType: "image/webp",
        filesize: buf.data.byteLength,
        filename,
      };
      built.push(`${spec.name} ${kb(buf.data.byteLength)}`);
      if (spec.name === "card") cardBytes += buf.data.byteLength;
    }

    if (built.length === 0) {
      console.log(`${doc.filename}: narrower than every size, nothing to build`);
      skipped += 1;
      continue;
    }

    // No `filePath` here — this is a metadata-only update, so Payload's upload
    // pipeline (and its renaming) never runs.
    const updated = await payload.update({
      collection: "media",
      id: doc.id,
      data: { sizes } as never,
      overrideAccess: true,
    });

    if (updated.filename !== doc.filename) {
      throw new Error(
        `filename changed unexpectedly: "${doc.filename}" -> "${updated.filename}"`,
      );
    }

    originalBytes += doc.filesize ?? 0;
    console.log(`${doc.filename} (${kb(doc.filesize ?? 0)}) -> ${built.join(", ")}`);
    done += 1;
  }

  if (APPLY && cardBytes > 0) {
    const pct = Math.round((1 - cardBytes / originalBytes) * 100);
    console.log(
      `\nTotal: originals ${kb(originalBytes)} -> card derivatives ${kb(cardBytes)} (${pct}% smaller).`,
    );
  }
  console.log(
    APPLY
      ? `Processed ${done}, skipped ${skipped}.`
      : `${done} file(s) would be processed, ${skipped} skipped. Re-run with --apply.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
