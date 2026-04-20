import type { Domain, Level } from "../types";
import { askClaudeCode } from "./claudeCode";

const LOOKUP_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    word: {
      type: "string",
      description: "The base/lemma form of the word. Strip punctuation, normalize case. Keep hyphenated compounds like 'back-end' intact.",
    },
    definition: {
      type: "string",
      description: "A short, precise English definition (1 sentence, under 25 words) that a developer would find useful.",
    },
    definition_vi: {
      type: "string",
      description: "The same definition written in Vietnamese (1 sentence, under 25 words). Keep technical English terms (API, cache, async, etc.) in English inside the Vietnamese sentence.",
    },
    level: {
      type: "string",
      enum: ["intern", "junior", "mid", "senior", "staff"],
      description: "How advanced this word is in a tech-English context.",
    },
    example: {
      type: "string",
      description: "A short example sentence using the word in a technical/developer context. Under 20 words. English.",
    },
    search_query: {
      type: "string",
      description: "A concise Google query that surfaces authoritative resources about this word in the given domain.",
    },
    skip: {
      type: "boolean",
      description: "Set true if the word is too trivial (common English like 'the', 'is', 'and', 'to') to be worth saving as vocab. If true, all other fields can be empty.",
    },
  },
  required: ["word", "definition", "definition_vi", "level", "example", "search_query", "skip"],
};

export interface VocabLookupResult {
  word: string;
  definition: string;
  definition_vi: string;
  level: Level;
  example: string;
  search_query: string;
  skip: boolean;
}

function systemPrompt(domain: Domain): string {
  const domainHint: Record<Domain, string> = {
    backend: "backend engineering (APIs, databases, distributed services)",
    frontend: "frontend engineering (UI frameworks, UX, performance)",
    "system-design": "system design (architecture, scale, trade-offs)",
    "ai-ml": "AI and machine learning",
    agentic: "agentic systems (autonomous agents, tools)",
    "prompt-forge": "prompt engineering for coding agents",
  };

  return `You are DevWrite's vocabulary tutor.

A developer studying ${domainHint[domain]} clicked a word in their writing and wants to save it. Return structured JSON for the vocab card.

- Always produce BOTH definitions: \`definition\` in English and \`definition_vi\` in Vietnamese. They should convey the same meaning.
- In the Vietnamese definition, keep technical English terms (API, cache, async, deploy, etc.) in English inside the Vietnamese sentence.
- \`example\` stays in English — it's learning material.
- If the word is too common to be worth saving (basic English: articles, pronouns, common verbs like "is/has/do", prepositions), set skip: true.
- If it's a meaningful word — technical term, domain verb, collocation, or useful adjective — build a useful card with both definitions + example.
- Normalize the word: strip trailing punctuation, lowercase unless it's a proper noun or acronym (e.g. "API", "GraphQL").
- Base form: "running" → "run" only if clearly a verb; keep "-ing" if it's the lemma ("debugging" as a noun concept stays).

Respond with ONLY the JSON. No prose.`;
}

function userPrompt(word: string, sentence: string, domain: Domain): string {
  return `DOMAIN: ${domain}

CLICKED WORD: ${word}

SURROUNDING CONTEXT:
"""
${sentence}
"""

Build a vocab card for this word as it's used in the context. Return JSON matching the schema.`;
}

export async function lookupVocab(
  word: string,
  context: string,
  domain: Domain
): Promise<VocabLookupResult> {
  const raw = await askClaudeCode<Partial<VocabLookupResult>>({
    system: systemPrompt(domain),
    user: userPrompt(word, context, domain),
    schema: LOOKUP_SCHEMA,
  });

  return {
    word: (raw.word || word).trim(),
    definition: (raw.definition ?? "").trim(),
    definition_vi: (raw.definition_vi ?? "").trim(),
    level: (raw.level as Level) ?? "junior",
    example: (raw.example ?? "").trim(),
    search_query: (raw.search_query ?? `${word} ${domain}`).trim(),
    skip: Boolean(raw.skip),
  };
}
