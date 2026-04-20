import type { Domain, Level } from "../types";

export interface UserVocabCard {
  id: number;
  word: string;
  definition: string;
  definition_vi: string;
  level: Level;
  domain: Domain;
  example_usage: string;
  next_review: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  learned_at: string;
  is_due: boolean;
}

export type ReviewRating = "again" | "hard" | "good" | "easy";

export function pickDefinition(
  card: Pick<UserVocabCard, "definition" | "definition_vi">,
  lang: "vi" | "en"
): string {
  if (lang === "vi" && card.definition_vi) return card.definition_vi;
  return card.definition;
}
