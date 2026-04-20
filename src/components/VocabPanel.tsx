"use client";

import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { Domain, Level, NewVocab, VocabSuggestion } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import VocabCard from "./VocabCard";

interface DueVocabItem {
  id: number;
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

interface VocabPanelProps {
  suggestions: VocabSuggestion[];
  newVocab: NewVocab[];
  dueVocab: DueVocabItem[];
}

export default function VocabPanel({
  suggestions,
  newVocab,
  dueVocab,
}: VocabPanelProps) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-4">
      <Section title={t("vocab_better")} icon={<ArrowRight size={14} />}>
        {suggestions.length === 0 ? (
          <Empty text={t("vocab_better_empty")} />
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("vocab_new")} icon={<Sparkles size={14} />}>
        {newVocab.length === 0 ? (
          <Empty text={t("vocab_new_empty")} />
        ) : (
          <div className="flex flex-col gap-3">
            {newVocab.map((v, i) => (
              <VocabCard
                key={i}
                word={v.word}
                definition={v.definition}
                level={v.level}
                domain={v.domain}
                searchQuery={v.search_query}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("vocab_srs")} icon={<BookOpen size={14} />}>
        {dueVocab.length === 0 ? (
          <Empty text={t("vocab_srs_empty")} />
        ) : (
          <div className="flex flex-col gap-3">
            {dueVocab.slice(0, 5).map((v) => (
              <VocabCard
                key={v.id}
                word={v.word}
                definition={v.definition}
                level={v.level}
                domain={v.domain}
                example={v.example_usage}
              />
            ))}
            {dueVocab.length > 5 && (
              <p className="text-[12px] text-[rgba(4,14,32,0.55)]">
                + {dueVocab.length - 5} {t("vocab_srs_more_suffix")}
              </p>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[rgba(4,14,32,0.55)]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.28px] font-medium">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px]">
      {text}
    </p>
  );
}

function SuggestionCard({ suggestion }: { suggestion: VocabSuggestion }) {
  return (
    <div className="rounded-[12px] border border-[#e0e2e6] bg-white p-3">
      <div className="flex items-center gap-2 flex-wrap text-[14px] leading-[1.5]">
        <span className="dw-monospace px-1.5 py-0.5 rounded bg-[#f8fafc] text-[rgba(4,14,32,0.82)]">
          {suggestion.original}
        </span>
        <ArrowRight size={14} className="text-[rgba(4,14,32,0.55)]" />
        <span className="dw-monospace px-1.5 py-0.5 rounded bg-[rgba(27,97,201,0.1)] font-medium text-[#1b61c9]">
          {suggestion.suggestion}
        </span>
        <span className="dw-chip ml-auto">{suggestion.level}</span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.45] italic text-[rgba(4,14,32,0.69)]">
        &ldquo;{suggestion.example}&rdquo;
      </p>
    </div>
  );
}
