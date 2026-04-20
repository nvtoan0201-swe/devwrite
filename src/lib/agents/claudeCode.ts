import { query } from "@anthropic-ai/claude-agent-sdk";

interface AskParams<T> {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTurns?: number;
  abortSignal?: AbortSignal;
  _shape?: T;
}

export async function askClaudeCode<T>({
  system,
  user,
  schema,
  maxTurns = 4,
  abortSignal,
}: AskParams<T>): Promise<T> {
  const abortController = new AbortController();
  if (abortSignal) {
    if (abortSignal.aborted) abortController.abort();
    else abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
  }

  const generator = query({
    prompt: user,
    options: {
      systemPrompt: system,
      tools: [],
      permissionMode: "dontAsk",
      maxTurns,
      outputFormat: { type: "json_schema", schema },
      abortController,
      persistSession: false,
      env: { ...process.env, CLAUDE_AGENT_SDK_CLIENT_APP: "devwrite/0.1.0" },
    },
  });

  let lastAssistantText = "";

  for await (const msg of generator) {
    if (msg.type === "assistant" && "message" in msg) {
      const content = (msg as { message: { content: Array<{ type: string; text?: string }> } })
        .message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && typeof block.text === "string") {
            lastAssistantText = block.text;
          }
        }
      }
    }

    if (msg.type === "result") {
      if (msg.subtype !== "success") {
        throw new Error(
          `Claude Code returned ${msg.subtype}. Make sure the claude CLI is installed and you are logged in.`
        );
      }
      if (msg.structured_output !== undefined && msg.structured_output !== null) {
        return msg.structured_output as T;
      }
      const text = (msg as { result?: string }).result ?? lastAssistantText;
      return parseJsonFromText<T>(text);
    }
  }

  if (lastAssistantText) return parseJsonFromText<T>(lastAssistantText);
  throw new Error("Claude Code query ended without a result message");
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatParams {
  system: string;
  history: ChatTurn[];
  message: string;
  maxTurns?: number;
  abortSignal?: AbortSignal;
}

export async function chatClaudeCode({
  system,
  history,
  message,
  maxTurns = 3,
  abortSignal,
}: ChatParams): Promise<string> {
  const abortController = new AbortController();
  if (abortSignal) {
    if (abortSignal.aborted) abortController.abort();
    else abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
  }

  const transcript = history
    .slice(-8)
    .map((t) => `${t.role === "user" ? "USER" : "YOU (ASSISTANT)"}: ${t.content}`)
    .join("\n\n");

  const prompt = transcript.length > 0
    ? `Conversation so far:\n\n${transcript}\n\nUSER: ${message}\n\nReply to the latest USER message.`
    : message;

  const generator = query({
    prompt,
    options: {
      systemPrompt: system,
      tools: [],
      permissionMode: "dontAsk",
      maxTurns,
      abortController,
      persistSession: false,
      env: { ...process.env, CLAUDE_AGENT_SDK_CLIENT_APP: "devwrite-chat/0.1.0" },
    },
  });

  let lastAssistantText = "";

  for await (const msg of generator) {
    if (msg.type === "assistant" && "message" in msg) {
      const content = (msg as { message: { content: Array<{ type: string; text?: string }> } })
        .message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && typeof block.text === "string") {
            lastAssistantText = block.text;
          }
        }
      }
    }
    if (msg.type === "result") {
      if (msg.subtype !== "success") {
        if (lastAssistantText) return lastAssistantText;
        throw new Error(
          `Claude Code chat returned ${msg.subtype}. Make sure the claude CLI is installed and you are logged in.`
        );
      }
      const text = (msg as { result?: string }).result ?? lastAssistantText;
      return text || lastAssistantText;
    }
  }

  if (lastAssistantText) return lastAssistantText;
  throw new Error("Claude Code chat ended without a result message");
}

function parseJsonFromText<T>(text: string): T {
  if (!text) throw new Error("Claude Code returned an empty response");
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch {
        // fall through
      }
    }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // fall through
      }
    }
    throw new Error(
      `Claude Code did not return valid JSON. First 200 chars: ${text.slice(0, 200)}`
    );
  }
}
