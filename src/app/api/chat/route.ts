import { NextResponse } from "next/server";
import { chatClaudeCode } from "@/lib/agents/claudeCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  context?: {
    domain?: string;
    level?: string;
    exercise_prompt?: string;
    last_submission?: string;
  };
}

const SYSTEM_PROMPT = `You are the in-app assistant for DevWrite, a coach that helps developers practice technical English.

Rules:
- Answer in the SAME language the user writes in. If they write Vietnamese, reply in Vietnamese. If they mix, reply in the dominant language.
- Be concise: 2–6 sentences unless the user asks for more detail.
- If the user asks about English grammar, word choice, or technical writing, answer with a concrete example.
- If the user asks about a technical concept (backend, frontend, system design, AI/ML, agentic, prompt engineering), explain clearly and keep it practical.
- Do NOT try to edit files, run commands, or use tools — you are a read-only chat.
- If the user pastes writing and asks for a quick take, give a short evaluation + one or two concrete fixes. For a full review they can use the Submit button in the app.
- Tone: friendly senior engineer helping a teammate. Direct, no fluff.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Request must include at least one message." },
        { status: 400 }
      );
    }

    const latest = body.messages[body.messages.length - 1];
    if (latest.role !== "user" || !latest.content?.trim()) {
      return NextResponse.json(
        { error: "Latest message must be a non-empty user message." },
        { status: 400 }
      );
    }

    const history = body.messages.slice(0, -1);

    let contextBlock = "";
    if (body.context) {
      const parts: string[] = [];
      if (body.context.domain) parts.push(`domain: ${body.context.domain}`);
      if (body.context.level) parts.push(`level: ${body.context.level}`);
      if (body.context.exercise_prompt) parts.push(`current exercise: ${body.context.exercise_prompt}`);
      if (body.context.last_submission) {
        const preview = body.context.last_submission.slice(0, 400);
        parts.push(`user's latest draft: """${preview}"""`);
      }
      if (parts.length > 0) {
        contextBlock = `\n\nApp context (for your reference only, do not recite back):\n- ${parts.join("\n- ")}`;
      }
    }

    const reply = await chatClaudeCode({
      system: SYSTEM_PROMPT + contextBlock,
      history,
      message: latest.content,
    });

    return NextResponse.json({ reply });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
