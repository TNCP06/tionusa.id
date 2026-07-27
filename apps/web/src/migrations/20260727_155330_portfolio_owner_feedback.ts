import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`portfolio_curation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`style_notes\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`portfolio_entries\` ADD \`curation_owner_feedback\` text;`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` ADD \`version_curation_owner_feedback\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`portfolio_curation\`;`)
  await db.run(sql`ALTER TABLE \`portfolio_entries\` DROP COLUMN \`curation_owner_feedback\`;`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` DROP COLUMN \`version_curation_owner_feedback\`;`)
}
