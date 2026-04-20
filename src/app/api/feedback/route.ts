import { NextResponse } from "next/server";
import { generateFeedback } from "@/lib/agents/feedbackAgent";
import {
  addVocabForUser,
  getDefaultUserId,
  initDb,
  logError,
  saveSubmission,
} from "@/lib/db";
import type { Domain } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeedbackRequestBody {
  session_id: number;
  domain: Domain;
  exercise_prompt: string;
  content: string;
  language?: "vi" | "en";
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = (await req.json()) as FeedbackRequestBody;

    if (!body.content || body.content.trim().length < 5) {
      return NextResponse.json(
        { error: "Writing sample must be at least 5 characters." },
        { status: 400 }
      );
    }
    if (!body.session_id) {
      return NextResponse.json(
        { error: "Missing session_id — call /api/exercise first." },
        { status: 400 }
      );
    }

    const feedback = await generateFeedback(
      body.content,
      body.domain,
      body.exercise_prompt ?? "",
      body.language === "vi" ? "vi" : "en"
    );

    const userId = await getDefaultUserId();
    const score = Math.round(feedback.clarity_score * 10);
    await saveSubmission(
      body.session_id,
      body.content,
      JSON.stringify(feedback),
      score
    );

    for (const g of feedback.grammar) {
      await logError(userId, g.type, g.error);
    }

    for (const v of feedback.new_vocab) {
      await addVocabForUser(
        userId,
        v.word,
        v.definition,
        v.level,
        v.domain,
        v.search_query
      );
    }

    return NextResponse.json({ feedback, score });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
