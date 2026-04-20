export type Domain =
  | "backend"
  | "frontend"
  | "system-design"
  | "ai-ml"
  | "agentic"
  | "prompt-forge";

export type Level = "intern" | "junior" | "mid" | "senior" | "staff";

export const DOMAINS: { id: Domain; label: string; description: string }[] = [
  { id: "backend", label: "Backend", description: "APIs, databases, services" },
  { id: "frontend", label: "Frontend", description: "UI, components, UX" },
  { id: "system-design", label: "System Design", description: "Architecture, scale, trade-offs" },
  { id: "ai-ml", label: "AI/ML", description: "Models, training, inference" },
  { id: "agentic", label: "Agentic", description: "Autonomous agents, tools, workflows" },
  { id: "prompt-forge", label: "Prompt Forge", description: "Claude Code / Cursor prompts" },
];

export const LEVELS: { id: Level; label: string; order: number }[] = [
  { id: "intern", label: "Intern", order: 0 },
  { id: "junior", label: "Junior", order: 1 },
  { id: "mid", label: "Mid", order: 2 },
  { id: "senior", label: "Senior", order: 3 },
  { id: "staff", label: "Staff+", order: 4 },
];

export type GrammarErrorType =
  | "subject-verb-agreement"
  | "tense"
  | "article"
  | "preposition"
  | "word-order"
  | "pluralization"
  | "capitalization"
  | "other";

export interface GrammarIssue {
  error: string;
  correction: string;
  explanation: string;
  type: GrammarErrorType;
  position?: { start: number; end: number };
}

export interface VocabSuggestion {
  original: string;
  suggestion: string;
  example: string;
  level: Level;
}

export interface NewVocab {
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  search_query: string;
}

export type TipType = "clarity" | "structure" | "style";

export interface WritingTip {
  type: TipType;
  tip: string;
  example: string;
  resource_url?: string;
}

export interface FeedbackResult {
  grammar: GrammarIssue[];
  vocabulary: VocabSuggestion[];
  new_vocab: NewVocab[];
  writing_tips: WritingTip[];
  clarity_score: number;
  overall_feedback: string;
  model_answer: string;
  mermaid_diagram?: string;
}

export interface Exercise {
  prompt: string;
  domain: Domain;
  level: Level;
  exercise_type: string;
  context?: string;
}

export interface VocabEntry {
  id: number;
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

export interface UserVocab {
  id: number;
  user_id: number;
  vocab_id: number;
  learned_at: string;
  next_review: string;
  ease_factor: number;
}

export interface ErrorLogEntry {
  id: number;
  user_id: number;
  error_type: string;
  example: string;
  frequency: number;
  last_seen: string;
}

export interface WritingSubmission {
  id: number;
  session_id: number;
  content: string;
  feedback_json: string;
  score: number;
  created_at: string;
}
