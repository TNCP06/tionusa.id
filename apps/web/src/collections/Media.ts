import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";
import { formatSlug } from "../fields/slug";

const webp = { format: "webp", options: { quality: 80 } } as const;

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true, // public assets
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    // Uploads arrive with whatever name the OS gave them ("Screenshot 2026-07-25
    // 191340.png"), which becomes a URL full of encoded spaces.
    beforeOperation: [
      ({ args, operation, req }) => {
        if (operation !== "create" && operation !== "update") return args;
        const name = req.file?.name;
        if (!name) return args;
        const dot = name.lastIndexOf(".");
        const stem = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
        req.file!.name = `${formatSlug(stem) || "file"}${ext}`;
        return args;
      },
    ],
  },
  upload: {
    staticDir: process.env.MEDIA_DIR || "./data/media",
    mimeTypes: ["image/*", "application/pdf"],
    // WebP derivatives only — the original is kept untouched so nothing that
    // already links to it breaks. Widths match the layouts that consume them:
    // ledger thumbnail, gallery tile, full-width cover.
    imageSizes: [
      { name: "thumbnail", width: 480, formatOptions: webp },
      { name: "card", width: 960, formatOptions: webp },
      { name: "wide", width: 1600, formatOptions: webp },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      localized: true,
      admin: {
        description:
          "Describe what the image shows, not what project it belongs to — this is the alt text search engines and screen readers read.",
      },
    },
  ],
};
