import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { lexicalToMarkdown, markdownToLexical, safeLinks } from "@/lib/ingest";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

// What PAI needs before it re-scores a repo: the owner's own wording and links
// (so a regenerate preserves them instead of dropping them) plus the feedback
// the owner wrote for the AI. Manual entries are excluded — PAI may never touch
// them, so it has no reason to read them either.
// `locale: "id"` matches what POST writes; another locale would read back empty.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "portfolio-entries",
    where: { "curation.source": { equals: "ai" } },
    limit: 500,
    locale: "id",
    depth: 0,
  });
  const curation = (await payload.findGlobal({ slug: "portfolio-curation" })) as any;

  const items = await Promise.all(
    docs.map(async (d: any) => ({
      id: d.id,
      externalId: d.externalId ?? "",
      title: d.title ?? "",
      summary: d.summary ?? "",
      bodyMarkdown: await lexicalToMarkdown(d.body),
      techStack: d.techStack ?? [],
      links: safeLinks(d.links),
      ownerFeedback: d.curation?.ownerFeedback ?? "",
      curatedAt: d.curation?.curatedAt ?? null,
      updatedAt: d.updatedAt,
      published: d._status === "published",
    })),
  );
  return NextResponse.json({ styleNotes: curation?.styleNotes ?? "", items });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });

  const rawPayload = form.get("payload");
  const payloadText =
    rawPayload && typeof rawPayload === "object" && "text" in rawPayload
      ? await (rawPayload as File).text()
      : String(rawPayload ?? "");
  let body: Record<string, any>;
  try {
    body = JSON.parse(payloadText);
  } catch {
    return NextResponse.json({ error: "invalid payload json" }, { status: 400 });
  }

  const {
    externalId, title, entryType, summary, bodyMarkdown, techStack, links, startDate,
    endDate, isOngoing, featured, priorityScore, rationale, rubricScores, sourceRepo,
    updateOnly, acceptOwnerEdit,
  } = body;
  if (!externalId || !title) {
    return NextResponse.json({ error: "externalId, title required" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "portfolio-entries",
    where: { externalId: { equals: externalId } },
    limit: 1,
    locale: "id",
  });
  const prev = existing.docs[0] as any;
  if (prev && prev.curation?.source === "manual") {
    return NextResponse.json({ error: "manual entry — refusing to overwrite" }, { status: 409 });
  }
  // Preserve manual edits: if the owner changed this AI entry AFTER the AI last
  // wrote it (updatedAt clearly later than curatedAt), don't clobber it with a
  // fresh regenerate. (10s buffer covers the AI's own write cycle.)
  //
  // On its own this never unlocks: curatedAt only advances on a successful write,
  // and writes stay blocked — so an edited entry can never receive a later repo's
  // changes. `acceptOwnerEdit` is the one way out: PAI sets it only after the
  // owner approved a proposed rewrite in Telegram, having seen it. The 409 above
  // still stands — a hand-made entry is never writable by the AI.
  if (prev && !acceptOwnerEdit) {
    const curatedAt = Date.parse(prev.curation?.curatedAt ?? "") || 0;
    const updatedAt = Date.parse(prev.updatedAt ?? "") || 0;
    if (curatedAt && updatedAt > curatedAt + 10_000) {
      return NextResponse.json({ skipped: true, reason: "manually edited — preserved" }, { status: 200 });
    }
  }
  // refresh sends updateOnly: never re-create an entry the owner deleted.
  if (!prev && updateOnly) {
    return NextResponse.json({ skipped: true, reason: "not found (updateOnly)" }, { status: 200 });
  }

  const data: Record<string, unknown> = {
    title,
    entryType: entryType || "project",
    summary: summary ?? "",
    ...(bodyMarkdown ? { body: await markdownToLexical(String(bodyMarkdown)) } : {}),
    techStack: Array.isArray(techStack) ? techStack.filter((t) => typeof t === "string") : [],
    links: safeLinks(links),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    isOngoing: !!isOngoing,
    featured: !!featured,
    priorityScore: Number(priorityScore) || 0,
    externalId,
    curation: {
      source: "ai",
      status: "draft",
      sourceRepo: sourceRepo ?? externalId,
      aiRationale: rationale ?? "",
      rubricScores: rubricScores ?? {},
      curatedAt: new Date().toISOString(),
      // Owner-only, and the whole `curation` group is rewritten on every update —
      // so it has to be carried over explicitly or each AI write would erase it.
      ownerFeedback: prev?.curation?.ownerFeedback ?? "",
    },
  };

  const doc = prev
    ? await payload.update({ collection: "portfolio-entries", id: prev.id, data: data as never, locale: "id" })
    : await payload.create({ collection: "portfolio-entries", data: { ...data, _status: "draft" } as never, locale: "id" });

  const adminUrl = `${process.env.SITE_URL ?? ""}/admin/collections/portfolio-entries/${doc.id}`;
  return NextResponse.json({ id: doc.id, slug: doc.slug, status: "draft", adminUrl }, { status: 201 });
}
