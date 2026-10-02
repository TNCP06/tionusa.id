import type { CollectionConfig } from "payload";
import { isAdmin } from "../access";
// One row per notified visit (deduped per IP per hour by /api/visit).
// Created only via the local API in /api/visit — REST create
// is closed so nobody can forge visits.
export const VisitorLogs: CollectionConfig = {
  slug: "visitor-logs",
  admin: {
    useAsTitle: "path",
    defaultColumns: ["path", "host", "country", "referer", "createdAt"],
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    { name: "path", type: "text", required: true },
    { name: "host", type: "select", options: ["site", "blog"], defaultValue: "site" },
    { name: "country", type: "text" },
    { name: "ip", type: "text" },
    { name: "userAgent", type: "text" },
    { name: "referer", type: "text" },
  ],
};
