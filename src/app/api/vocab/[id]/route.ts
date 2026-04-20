import { NextResponse } from "next/server";
import { getDefaultUserId, initDb, removeVocabFromUser } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    const userId = await getDefaultUserId();
    await removeVocabFromUser(userId, id);
    return NextResponse.json({ removed: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
