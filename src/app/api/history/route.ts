import { NextResponse } from "next/server";
import { getDefaultUserId, getSubmissionHistory, initDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const userId = await getDefaultUserId();
    const submissions = await getSubmissionHistory(userId);
    return NextResponse.json({ submissions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
