import type { Field } from "payload";

/** Lowercase, ASCII-word, dash-separated. Also used for tag URLs and upload filenames. */
export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

/** Unique URL slug, auto-derived from `sourceField` when left blank. */
export const slugField = (sourceField = "title"): Field => ({
  name: "slug",
  type: "text",
  unique: true,
  index: true,
  admin: { position: "sidebar" },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === "string" && value.length > 0) return formatSlug(value);
        const src = data?.[sourceField];
        if (typeof src === "string") return formatSlug(src);
        return value;
      },
    ],
  },
});
