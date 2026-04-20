import { NextResponse } from "next/server";
import { addVocabForUser, getDefaultUserId, initDb } from "@/lib/db";
import type { Domain, Level } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AddBody {
  word: string;
  definition: string;
  definition_vi?: string;
  level: Level;
  domain: Domain;
  example?: string;
}

const VALID_LEVELS: Level[] = ["intern", "junior", "mid", "senior", "staff"];
const VALID_DOMAINS: Domain[] = [
  "backend",
  "frontend",
  "system-design",
  "ai-ml",
  "agentic",
  "prompt-forge",
];

export async function POST(req: Request) {
  try {
    await initDb();
    const body = (await req.json()) as AddBody;

    const word = (body.word || "").trim();
    const definition = (body.definition || "").trim();
    const definitionVi = (body.definition_vi || "").trim();

    if (!word || word.length > 80) {
      return NextResponse.json(
        { error: "Word is required (max 80 chars)." },
        { status: 400 }
      );
    }
    if (!definition) {
      return NextResponse.json(
        { error: "Definition is required." },
        { status: 400 }
      );
    }
    if (!VALID_LEVELS.includes(body.level)) {
      return NextResponse.json({ error: "Invalid level." }, { status: 400 });
    }
    if (!VALID_DOMAINS.includes(body.domain)) {
      return NextResponse.json({ error: "Invalid domain." }, { status: 400 });
    }

    const userId = await getDefaultUserId();
    await addVocabForUser(
      userId,
      word,
      definition,
      definitionVi,
      body.level,
      body.domain,
      body.example ?? ""
    );

    return NextResponse.json({ saved: true, word });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
