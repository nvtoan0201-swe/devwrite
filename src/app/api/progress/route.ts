import { NextResponse } from "next/server";
import {
  getDefaultUserId,
  getProgressStats,
  getRecentSubmissions,
  getTopErrors,
  getVocabDueForReview,
  initDb,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const userId = await getDefaultUserId();
    const [stats, dueVocab, recent, topErrors] = await Promise.all([
      getProgressStats(userId),
      getVocabDueForReview(userId, 10),
      getRecentSubmissions(userId, 5),
      getTopErrors(userId, 5),
    ]);
    return NextResponse.json({
      stats,
      due_vocab: dueVocab,
      recent_submissions: recent,
      top_errors: topErrors,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
