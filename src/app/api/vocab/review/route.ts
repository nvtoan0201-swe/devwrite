import { NextResponse } from "next/server";
import {
  getDefaultUserId,
  initDb,
  reviewVocabCard,
  type ReviewRating,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: ReviewRating[] = ["again", "hard", "good", "easy"];

interface ReviewBody {
  vocab_id: number;
  rating: ReviewRating;
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = (await req.json()) as ReviewBody;
    const vocabId = Number(body.vocab_id);
    if (!Number.isFinite(vocabId) || vocabId <= 0) {
      return NextResponse.json({ error: "Invalid vocab_id." }, { status: 400 });
    }
    if (!VALID.includes(body.rating)) {
      return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
    }
    const userId = await getDefaultUserId();
    const result = await reviewVocabCard(userId, vocabId, body.rating);
    if (!result) {
      return NextResponse.json({ error: "Card not in deck." }, { status: 404 });
    }
    return NextResponse.json({ ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
