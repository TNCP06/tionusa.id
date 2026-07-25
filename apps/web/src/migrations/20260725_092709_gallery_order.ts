import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`portfolio_entries\` ADD \`gallery_order\` numeric;`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` ADD \`version_gallery_order\` numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`portfolio_entries\` DROP COLUMN \`gallery_order\`;`)
  await db.run(sql`ALTER TABLE \`_portfolio_entries_v\` DROP COLUMN \`version_gallery_order\`;`)
}
