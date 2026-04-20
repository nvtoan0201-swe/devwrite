import type { Domain, FeedbackResult } from "../types";
import { askClaudeCode } from "./claudeCode";

const FEEDBACK_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    grammar: {
      type: "array",
      description: "Grammar issues found in the text. Empty array if no issues.",
      items: {
        type: "object",
        properties: {
          error: { type: "string", description: "The exact incorrect phrase copied from the user's text." },
          correction: { type: "string", description: "The corrected version of that phrase." },
          explanation: { type: "string", description: "Why it was wrong. Name the rule, not just the fix." },
          type: {
            type: "string",
            enum: [
              "subject-verb-agreement",
              "tense",
              "article",
              "preposition",
              "word-order",
              "pluralization",
              "capitalization",
              "other",
            ],
          },
        },
        required: ["error", "correction", "explanation", "type"],
      },
    },
    vocabulary: {
      type: "array",
      description: "Word-choice suggestions. Flag weak or unnatural words and propose precise technical alternatives.",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          suggestion: { type: "string" },
          example: { type: "string" },
          level: { type: "string", enum: ["intern", "junior", "mid", "senior", "staff"] },
        },
        required: ["original", "suggestion", "example", "level"],
      },
    },
    new_vocab: {
      type: "array",
      description: "1-4 new vocabulary cards from the exercise domain, slightly above the user's level.",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          definition: { type: "string" },
          level: { type: "string", enum: ["intern", "junior", "mid", "senior", "staff"] },
          domain: {
            type: "string",
            enum: ["backend", "frontend", "system-design", "ai-ml", "agentic", "prompt-forge"],
          },
          search_query: { type: "string" },
        },
        required: ["word", "definition", "level", "domain", "search_query"],
      },
    },
    writing_tips: {
      type: "array",
      description: "Exactly 3 tips: one clarity, one structure, one style.",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["clarity", "structure", "style"] },
          tip: { type: "string" },
          example: { type: "string" },
          resource_url: { type: "string" },
        },
        required: ["type", "tip", "example"],
      },
    },
    clarity_score: { type: "number", description: "Clarity score from 1 (unclear) to 10 (crystal clear)." },
    overall_feedback: { type: "string" },
    mermaid_diagram: {
      type: "string",
      description: "Optional Mermaid diagram source. Include only for system-design when the user described an architecture. Empty string otherwise.",
    },
  },
  required: ["grammar", "vocabulary", "new_vocab", "writing_tips", "clarity_score", "overall_feedback"],
};

function systemPrompt(domain: Domain, language: "vi" | "en"): string {
  const domainHint: Record<Domain, string> = {
    backend: "backend engineering (APIs, databases, distributed services)",
    frontend: "frontend engineering (UI frameworks, UX, performance)",
    "system-design": "system design (architecture, scale, trade-offs). If the user described an architecture, produce a Mermaid diagram.",
    "ai-ml": "AI and machine learning (models, training, inference, evaluation)",
    agentic: "agentic systems (autonomous agents, tools, orchestration)",
    "prompt-forge": "prompt engineering for coding agents like Claude Code and Cursor",
  };

  const languageBlock =
    language === "vi"
      ? `
OUTPUT LANGUAGE — IMPORTANT:
- Write these fields in **Vietnamese** (the user is a Vietnamese developer learning English):
  - grammar[].explanation
  - vocabulary[].example (keep it short and natural in Vietnamese)
  - new_vocab[].definition
  - writing_tips[].tip
  - writing_tips[].example
  - overall_feedback
- Keep these fields in **English** (they are the learning material — don't translate them):
  - grammar[].error, grammar[].correction
  - vocabulary[].original, vocabulary[].suggestion
  - new_vocab[].word, new_vocab[].search_query
- Mix English technical terms naturally into Vietnamese sentences when needed (e.g. "dùng thì present perfect", "ở đây cần article 'a'").`
      : `
OUTPUT LANGUAGE:
- Write all explanations, tips, and feedback in English.`;

  return `You are DevWrite, a senior engineer who coaches developers learning technical English.

Your job: grade a short writing sample in the ${domainHint[domain]} domain. Return structured JSON that matches the schema.

Rules:
- Be concrete. Quote the user's exact words in grammar.error and vocabulary.original.
- Explain WHY, not just what. Name the rule.
- Never invent errors. If the writing is clean, return an empty grammar array.
- Suggest vocabulary one level above where the user appears to be writing.
- Tips must be actionable, under 30 words, and applicable to this exact sample.
- Be encouraging but honest. Developers respect direct feedback.
${languageBlock}

Respond with ONLY the JSON object. No prose, no code fences.`;
}

function userPrompt(text: string, exercisePrompt: string): string {
  return `EXERCISE PROMPT:
${exercisePrompt}

USER'S WRITING:
"""
${text}
"""

Grade this sample. Return JSON matching the schema.`;
}

export async function generateFeedback(
  text: string,
  domain: Domain,
  exercisePrompt: string,
  language: "vi" | "en" = "en"
): Promise<FeedbackResult> {
  const raw = await askClaudeCode<Partial<FeedbackResult>>({
    system: systemPrompt(domain, language),
    user: userPrompt(text, exercisePrompt),
    schema: FEEDBACK_SCHEMA,
  });

  return {
    grammar: raw.grammar ?? [],
    vocabulary: raw.vocabulary ?? [],
    new_vocab: raw.new_vocab ?? [],
    writing_tips: raw.writing_tips ?? [],
    clarity_score: Math.max(1, Math.min(10, Number(raw.clarity_score) || 5)),
    overall_feedback: raw.overall_feedback ?? "",
    mermaid_diagram:
      raw.mermaid_diagram && raw.mermaid_diagram.trim().length > 0
        ? raw.mermaid_diagram
        : undefined,
  };
}
