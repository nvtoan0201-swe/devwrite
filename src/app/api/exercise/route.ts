import { NextResponse } from "next/server";
import { planNextExercise } from "@/lib/agents/plannerAgent";
import { generateExercise } from "@/lib/agents/exerciseAgent";
import { createSession, getDefaultUserId, initDb } from "@/lib/db";
import type { Domain, Level } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = (await req.json().catch(() => ({}))) as {
      domain?: Domain;
      level?: Level;
    };

    const userId = await getDefaultUserId();
    const plan = await planNextExercise(userId, body.domain, body.level);
    const exercise = await generateExercise(plan.domain, plan.level, plan.weakAreas);
    const sessionId = await createSession(userId, plan.domain, exercise.exercise_type);

    return NextResponse.json({
      session_id: sessionId,
      exercise,
      plan,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
