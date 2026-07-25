import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { PortfolioEntries } from "./collections/PortfolioEntries";
import { Articles } from "./collections/Articles";
import { Messages } from "./collections/Messages";
import { VisitorLogs } from "./collections/VisitorLogs";
import { Profile } from "./globals/Profile";
import { migrations } from "./migrations";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  editor: lexicalEditor(),
  // SMTP is optional: without SMTP_HOST, Payload falls back to a console mock
  // (fine for local dev). Telegram delivery is independent (see lib/notify.ts).
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromName: "tncp.web.id",
        defaultFromAddress:
          process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@tncp.web.id",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  collections: [Users, Media, PortfolioEntries, Articles, Messages, VisitorLogs],
  globals: [Profile],
  localization: {
    locales: [
      { label: "Bahasa Indonesia", code: "id" },
      { label: "English", code: "en" },
    ],
    defaultLocale: "id",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "",
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || "file:./data/tncp.db" },
    // Dev auto-syncs schema via push (drizzle-kit). In production push is
    // disabled by Payload, so prod runs committed migrations on connect —
    // this is what creates tables for new collections on the VPS. After any
    // schema change: `pnpm --filter web payload migrate:create <name>`, commit.
    push: process.env.NODE_ENV !== "production",
    prodMigrations: migrations,
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
