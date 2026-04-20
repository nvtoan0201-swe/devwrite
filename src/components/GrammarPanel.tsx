"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { GrammarIssue } from "@/lib/types";
import { useLang, type I18nKey } from "@/lib/i18n";

interface GrammarPanelProps {
  issues: GrammarIssue[];
  originalText: string;
}

const TYPE_KEY: Record<string, I18nKey> = {
  "subject-verb-agreement": "type_sva",
  tense: "type_tense",
  article: "type_article",
  preposition: "type_preposition",
  "word-order": "type_word_order",
  pluralization: "type_pluralization",
  capitalization: "type_capitalization",
  other: "type_other",
};

export default function GrammarPanel({ issues, originalText }: GrammarPanelProps) {
  const { t } = useLang();

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 size={24} className="text-[#006400]" />
        <p className="text-[15px] font-medium text-[#181d26] tracking-[0.08px]">
          {t("no_grammar_issues")}
        </p>
        <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px] max-w-xs">
          {t("no_grammar_sub")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <HighlightedText text={originalText} issues={issues} />
      <div className="flex flex-col gap-3">
        {issues.map((issue, i) => (
          <IssueCard key={i} issue={issue} />
        ))}
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: GrammarIssue }) {
  const { t } = useLang();
  const typeKey = TYPE_KEY[issue.type];
  const typeLabel = typeKey ? t(typeKey) : issue.type;
  return (
    <div className="rounded-[12px] border border-[rgba(179,38,30,0.25)] bg-[rgba(179,38,30,0.04)] p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 text-[#b3261e]" aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-[0.28px] font-medium text-[#b3261e]">
              {typeLabel}
            </span>
          </div>
          <div className="mt-1.5 text-[14px] leading-[1.5] text-[#181d26]">
            <span className="line-through text-[rgba(179,38,30,0.9)]">
              {issue.error}
            </span>
            <span className="mx-1.5 text-[rgba(4,14,32,0.55)]">→</span>
            <span className="font-medium text-[#006400]">{issue.correction}</span>
          </div>
          <p className="mt-2 text-[13px] leading-[1.45] tracking-[0.08px] text-[rgba(4,14,32,0.82)]">
            {issue.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

function HighlightedText({
  text,
  issues,
}: {
  text: string;
  issues: GrammarIssue[];
}) {
  const segments: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;

  type Match = { start: number; end: number };
  const matches: Match[] = [];
  for (const issue of issues) {
    if (!issue.error) continue;
    const idx = text.toLowerCase().indexOf(issue.error.toLowerCase(), cursor);
    if (idx >= 0) {
      matches.push({ start: idx, end: idx + issue.error.length });
      cursor = idx + issue.error.length;
    }
  }
  matches.sort((a, b) => a.start - b.start);

  let pos = 0;
  for (const m of matches) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start), highlight: false });
    segments.push({ text: text.slice(m.start, m.end), highlight: true });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), highlight: false });

  if (segments.length === 0) return null;

  return (
    <div className="dw-monospace rounded-[12px] border border-[#e0e2e6] bg-[#f8fafc] p-3 text-[13px] leading-[1.6] text-[#181d26] whitespace-pre-wrap">
      {segments.map((s, i) =>
        s.highlight ? (
          <mark
            key={i}
            className="rounded-[4px] px-0.5"
            style={{
              background: "rgba(179,38,30,0.18)",
              color: "#b3261e",
            }}
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </div>
  );
}
