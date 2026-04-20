"use client";

import { useState } from "react";
import { SpellCheck, BookOpen, Lightbulb, Trophy, Check, Copy } from "lucide-react";
import type { Domain, FeedbackResult, Level } from "@/lib/types";
import { useLang, type I18nKey } from "@/lib/i18n";
import GrammarPanel from "./GrammarPanel";
import VocabPanel from "./VocabPanel";
import WritingTipsPanel from "./WritingTipsPanel";
import ProgressBar from "./ProgressBar";
import ClickableText from "./ClickableText";

type TabId = "grammar" | "vocab" | "tips";

interface TopError {
  error_type: string;
  example: string;
  frequency: number;
  last_seen: string;
}

interface DueVocabItem {
  id: number;
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

interface FeedbackPanelProps {
  feedback: FeedbackResult | null;
  submittedText: string;
  dueVocab: DueVocabItem[];
  topErrors: TopError[];
  isSubmitting: boolean;
  domain: Domain;
}

export default function FeedbackPanel({
  feedback,
  submittedText,
  dueVocab,
  topErrors,
  isSubmitting,
  domain,
}: FeedbackPanelProps) {
  const { t } = useLang();
  const [active, setActive] = useState<TabId>("grammar");

  return (
    <aside className="w-full lg:w-[400px] lg:min-w-[400px] lg:max-w-[400px] flex flex-col gap-4">
      <div className="dw-card p-4">
        <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-3">
          {t("clarity_score")}
        </h2>
        {feedback ? (
          <ProgressBar
            value={feedback.clarity_score}
            max={10}
            label={t(scoreLabelKey(feedback.clarity_score))}
          />
        ) : (
          <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px]">
            {isSubmitting ? t("clarity_grading") : t("clarity_empty")}
          </p>
        )}
      </div>

      {feedback?.model_answer && (
        <ModelAnswerCard text={feedback.model_answer} domain={domain} />
      )}

      <div className="dw-card flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-[#e0e2e6]">
          <TabButton
            id="grammar"
            active={active === "grammar"}
            onClick={() => setActive("grammar")}
            icon={<SpellCheck size={14} />}
            label={t("tab_grammar")}
            badge={feedback?.grammar.length}
          />
          <TabButton
            id="vocab"
            active={active === "vocab"}
            onClick={() => setActive("vocab")}
            icon={<BookOpen size={14} />}
            label={t("tab_vocab")}
            badge={
              feedback
                ? feedback.vocabulary.length + feedback.new_vocab.length
                : undefined
            }
          />
          <TabButton
            id="tips"
            active={active === "tips"}
            onClick={() => setActive("tips")}
            icon={<Lightbulb size={14} />}
            label={t("tab_tips")}
            badge={feedback?.writing_tips.length}
          />
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {!feedback ? (
            <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px]">
              {t("feedback_empty")}
            </p>
          ) : active === "grammar" ? (
            <GrammarPanel
              issues={feedback.grammar}
              originalText={submittedText}
            />
          ) : active === "vocab" ? (
            <VocabPanel
              suggestions={feedback.vocabulary}
              newVocab={feedback.new_vocab}
              dueVocab={dueVocab}
            />
          ) : (
            <WritingTipsPanel
              tips={feedback.writing_tips}
              overallFeedback={feedback.overall_feedback}
              topErrors={topErrors}
            />
          )}
        </div>
      </div>

      {feedback?.mermaid_diagram && (
        <div className="dw-card p-4">
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-3">
            {t("diagram_title")}
          </h2>
          <pre className="dw-monospace overflow-x-auto text-[12px] leading-[1.5] text-[#181d26] bg-[#f8fafc] border border-[#e0e2e6] rounded-[12px] p-3">
            {feedback.mermaid_diagram}
          </pre>
          <p className="mt-2 text-[12px] text-[rgba(4,14,32,0.55)]">
            {t("diagram_hint")}
          </p>
        </div>
      )}
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  id: TabId;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[13px] font-medium tracking-[0.08px] border-b-2 transition-colors ${
        active
          ? "border-[#1b61c9] text-[#1b61c9]"
          : "border-transparent text-[rgba(4,14,32,0.69)] hover:text-[#181d26]"
      }`}
    >
      {icon}
      {label}
      {typeof badge === "number" && badge > 0 && (
        <span
          className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
          style={{
            background: active ? "rgba(27,97,201,0.12)" : "rgba(4,14,32,0.08)",
            color: active ? "#1b61c9" : "rgba(4,14,32,0.69)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function scoreLabelKey(score: number): I18nKey {
  if (score >= 9) return "score_exceptional";
  if (score >= 7.5) return "score_strong";
  if (score >= 6) return "score_decent";
  if (score >= 4) return "score_unclear";
  return "score_rewrite";
}

function ModelAnswerCard({ text, domain }: { text: string; domain: Domain }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="dw-card p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: "#1b61c9", color: "white" }}
            aria-hidden
          >
            <Trophy size={12} />
          </span>
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
            {t("model_answer_title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md border border-[#e0e2e6] bg-white px-2 py-1 text-[12px] font-medium text-[rgba(4,14,32,0.69)] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
          aria-label="Copy model answer"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? t("model_answer_copied") : t("model_answer_copy")}
        </button>
      </div>
      <p className="text-[11px] text-[rgba(4,14,32,0.55)] tracking-[0.07px] mb-3">
        {t("model_answer_hint")}
      </p>
      <ClickableText
        text={text}
        domain={domain}
        tone="model"
        className="rounded-[12px] border border-[rgba(27,97,201,0.25)] bg-[rgba(27,97,201,0.04)] p-3 text-[14px] leading-[1.6] text-[#181d26]"
      />
    </div>
  );
}
