import type { Domain, Exercise, Level } from "../types";
import { askClaudeCode } from "./claudeCode";

const EXERCISE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
      description: "The writing prompt shown to the user. Should require 80-200 words of response.",
    },
    exercise_type: {
      type: "string",
      description: "Short label, e.g. 'incident-writeup', 'code-review-comment', 'api-doc', 'prompt-design', 'architecture-pitch'.",
    },
    context: {
      type: "string",
      description: "Optional supporting scenario the user needs to complete the task.",
    },
  },
  required: ["prompt", "exercise_type"],
};

const DOMAIN_HINTS: Record<Domain, string> = {
  backend: "Ask the user to write something a backend engineer writes: API docs, a postmortem paragraph, an endpoint change announcement, or a code-review comment.",
  frontend: "Ask the user to write something a frontend engineer writes: a component PR description, a bug report with repro steps, a UX decision rationale, or release notes.",
  "system-design": "Ask the user to pitch or compare an architecture: trade-offs between two designs, a capacity estimate, or a short RFC-style proposal.",
  "ai-ml": "Ask the user to write something an ML engineer writes: an eval report summary, a model-card paragraph, a data-quality incident write-up, or an experiment proposal.",
  agentic: "Ask the user to write something an agent-platform engineer writes: a tool description for an LLM, a failure-mode analysis, or a policy for when the agent should escalate to a human.",
  "prompt-forge": "Ask the user to write a complete coding-agent prompt (for Claude Code or Cursor) that would produce a specific outcome. Include the user goal and constraints they must encode.",
};

const LEVEL_HINTS: Record<Level, string> = {
  intern: "Use everyday words. Single-feature scope. Reward correct basic structure.",
  junior: "Conversational technical English with accurate idioms (middleware, idempotent, caching).",
  mid: "Precise trade-off language (backpressure, eventual consistency, blast radius).",
  senior: "Writing that frames trade-offs and stakes, not just facts (SLA, graceful degradation, observability).",
  staff: "Writing that names leverage, second-order effects, and organizational implications.",
};

function systemPrompt(): string {
  return `You are DevWrite's exercise generator. You create short, realistic writing prompts that technical English learners (working developers) complete in 80-200 words.

The prompt must:
- Be concrete and scenario-based, not abstract.
- Require specific vocabulary the user is learning.
- Give just enough scenario for the user to write fluently.
- Avoid asking for code — ask for WRITING about code or systems.

Respond with ONLY the JSON object matching the schema. No prose, no code fences.`;
}

function userPrompt(domain: Domain, level: Level, weakAreas: string[]): string {
  const weak = weakAreas.length > 0
    ? `\nRecent recurring weaknesses: ${weakAreas.join(", ")}. Design the exercise so the user has a natural chance to practice these.`
    : "";
  return `Generate ONE writing exercise.

Domain: ${domain}
Target level: ${level}
Domain guidance: ${DOMAIN_HINTS[domain]}
Level guidance: ${LEVEL_HINTS[level]}${weak}

Return JSON matching the schema now.`;
}

export async function generateExercise(
  domain: Domain,
  level: Level,
  weakAreas: string[] = []
): Promise<Exercise> {
  const raw = await askClaudeCode<{ prompt: string; exercise_type: string; context?: string }>({
    system: systemPrompt(),
    user: userPrompt(domain, level, weakAreas),
    schema: EXERCISE_SCHEMA,
  });

  return {
    prompt: raw.prompt,
    exercise_type: raw.exercise_type,
    context: raw.context,
    domain,
    level,
  };
}
