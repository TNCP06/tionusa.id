import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

// Mirror of publish: take an entry back off /portfolio when it no longer earns its
// place. PAI only calls this after the owner approved the demotion in Telegram —
// nothing here decides that on its own. The draft stays in /admin, so demoting is
// reversible: publish again and it returns unchanged.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const payload = await getPayload({ config });
  const cur = (await payload.findByID({ collection: "portfolio-entries", id }).catch(() => null)) as any;
  if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (cur.curation?.source === "manual") return NextResponse.json({ error: "manual entry" }, { status: 409 });

  const doc = await payload.update({
    collection: "portfolio-entries",
    id,
    // Spread the existing curation group: ownerFeedback and the audit fields must
    // survive, same as in publish.
    data: { _status: "draft", curation: { ...cur.curation, status: "rejected" } } as never,
    locale: "id",
  });
  return NextResponse.json({ id: doc.id, slug: doc.slug, status: "draft" }, { status: 200 });
}
