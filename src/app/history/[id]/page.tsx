"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import Nav from "@/components/Nav";
import ClickableText from "@/components/ClickableText";
import GrammarPanel from "@/components/GrammarPanel";
import VocabPanel from "@/components/VocabPanel";
import WritingTipsPanel from "@/components/WritingTipsPanel";
import { useLang } from "@/lib/i18n";
import type { Domain, FeedbackResult } from "@/lib/types";

interface SubmissionDetail {
  id: number;
  content: string;
  score: number;
  created_at: string;
  domain: Domain;
  exercise_prompt: string;
  feedback_json: string;
}

const DOMAIN_LABEL: Record<Domain, string> = {
  backend: "Backend",
  frontend: "Frontend",
  "system-design": "System Design",
  "ai-ml": "AI/ML",
  agentic: "Agentic",
  "prompt-forge": "Prompt Forge",
};

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLang();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"grammar" | "vocab" | "tips">("grammar");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/history/${params.id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fetch failed");
        const sub = data.submission as SubmissionDetail;
        setSubmission(sub);
        try {
          setFeedback(JSON.parse(sub.feedback_json) as FeedbackResult);
        } catch {
          setFeedback(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const dateLabel = submission
    ? (() => {
        const d = new Date(submission.created_at + "Z");
        return isNaN(d.getTime())
          ? submission.created_at
          : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      })()
    : "";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Nav />
      <main className="max-w-[1200px] mx-auto px-6 py-6">
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-[13px] text-[rgba(4,14,32,0.69)] hover:text-[#181d26] mb-4"
        >
          <ArrowLeft size={14} />
          {t("history_back")}
        </Link>

        {loading ? (
          <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("history_loading")}
          </div>
        ) : error || !submission ? (
          <div className="dw-card p-8 text-center text-[14px] text-[#b3261e]">
            {error ?? "Not found"}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            <div className="flex flex-col gap-4">
              <div className="dw-card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="dw-chip">{DOMAIN_LABEL[submission.domain]}</span>
                      <span className="text-[11px] uppercase tracking-[0.28px] text-[rgba(4,14,32,0.55)]">
                        {dateLabel}
                      </span>
                    </div>
                    <h1 className="mt-2 flex items-center gap-2 text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
                      <Target size={14} className="text-[#1b61c9]" aria-hidden />
                      {t("history_prompt")}
                    </h1>
                    <p className="mt-1 text-[14px] leading-[1.5] text-[#181d26] whitespace-pre-wrap">
                      {submission.exercise_prompt || "—"}
                    </p>
                  </div>
                  <ScoreBadge score={submission.score} />
                </div>
              </div>

              <div className="dw-card p-5">
                <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-2">
                  {t("history_your_writing")}
                </h2>
                <ClickableText
                  text={submission.content}
                  domain={submission.domain}
                  className="dw-monospace rounded-[12px] border border-[#e0e2e6] bg-[#f8fafc] p-4 text-[14px] leading-[1.6] text-[#181d26]"
                />
              </div>

              {feedback?.model_answer && (
                <div className="dw-card p-5">
                  <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-2">
                    {t("history_model_answer")}
                  </h2>
                  <ClickableText
                    text={feedback.model_answer}
                    domain={submission.domain}
                    tone="model"
                    className="rounded-[12px] border border-[rgba(27,97,201,0.25)] bg-[rgba(27,97,201,0.04)] p-3 text-[14px] leading-[1.6] text-[#181d26]"
                  />
                </div>
              )}
            </div>

            {feedback && (
              <div className="dw-card p-4 flex flex-col gap-3 h-fit">
                <p className="text-[13px] leading-[1.5] text-[#181d26]">
                  {feedback.overall_feedback}
                </p>
                <div className="flex gap-1 border-b border-[#e0e2e6]">
                  <TabButton active={tab === "grammar"} onClick={() => setTab("grammar")}>
                    {t("tab_grammar")} ({feedback.grammar.length})
                  </TabButton>
                  <TabButton active={tab === "vocab"} onClick={() => setTab("vocab")}>
                    {t("tab_vocab")}
                  </TabButton>
                  <TabButton active={tab === "tips"} onClick={() => setTab("tips")}>
                    {t("tab_tips")}
                  </TabButton>
                </div>
                <div className="max-h-[70vh] overflow-y-auto pr-1">
                  {tab === "grammar" && (
                    <GrammarPanel
                      issues={feedback.grammar}
                      originalText={submission.content}
                    />
                  )}
                  {tab === "vocab" && (
                    <VocabPanel
                      suggestions={feedback.vocabulary}
                      newVocab={feedback.new_vocab}
                      dueVocab={[]}
                    />
                  )}
                  {tab === "tips" && (
                    <WritingTipsPanel
                      tips={feedback.writing_tips}
                      overallFeedback={feedback.overall_feedback}
                      topErrors={[]}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-[13px] font-medium tracking-[0.08px] border-b-2 transition-colors ${
        active
          ? "border-[#1b61c9] text-[#1b61c9]"
          : "border-transparent text-[rgba(4,14,32,0.69)] hover:text-[#181d26]"
      }`}
    >
      {children}
    </button>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "#006400"
      : score >= 75
      ? "#1b61c9"
      : score >= 60
      ? "#b5610a"
      : "#b3261e";
  return (
    <span
      className="inline-flex items-center justify-center rounded-[10px] px-4 py-2 text-[22px] font-medium tracking-[0.08px] shrink-0"
      style={{ backgroundColor: `${color}14`, color }}
    >
      {score}
    </span>
  );
}
