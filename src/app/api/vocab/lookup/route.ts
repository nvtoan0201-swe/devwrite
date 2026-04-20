import { NextResponse } from "next/server";
import { lookupVocab } from "@/lib/agents/vocabLookupAgent";
import { initDb } from "@/lib/db";
import type { Domain } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LookupBody {
  word: string;
  context: string;
  domain: Domain;
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = (await req.json()) as LookupBody;

    const word = (body.word || "").trim();
    if (!word) {
      return NextResponse.json({ error: "Missing word." }, { status: 400 });
    }
    if (word.length > 80) {
      return NextResponse.json({ error: "Word too long." }, { status: 400 });
    }

    const result = await lookupVocab(
      word,
      body.context ?? "",
      body.domain ?? "backend"
    );

    return NextResponse.json({ lookup: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
