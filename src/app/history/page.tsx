"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import Nav from "@/components/Nav";
import { useLang } from "@/lib/i18n";
import type { Domain } from "@/lib/types";

interface SubmissionSummary {
  id: number;
  content: string;
  score: number;
  created_at: string;
  domain: Domain;
  exercise_prompt: string;
}

const DOMAIN_LABEL: Record<Domain, string> = {
  backend: "Backend",
  frontend: "Frontend",
  "system-design": "System Design",
  "ai-ml": "AI/ML",
  agentic: "Agentic",
  "prompt-forge": "Prompt Forge",
};

export default function HistoryPage() {
  const { t } = useLang();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fetch failed");
        setSubmissions(data.submissions as SubmissionSummary[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Nav />
      <main className="max-w-[1000px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-[26px] font-medium tracking-[0.08px] text-[#181d26]">
            {t("history_title")}
          </h1>
          <p className="mt-1 text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("history_subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("history_loading")}
          </div>
        ) : submissions.length === 0 ? (
          <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("history_empty")}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((s) => (
              <SubmissionRow key={s.id} submission={s} viewLabel={t("history_view")} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SubmissionRow({
  submission,
  viewLabel,
}: {
  submission: SubmissionSummary;
  viewLabel: string;
}) {
  const { t } = useLang();
  const date = new Date(submission.created_at + "Z");
  const dateLabel = isNaN(date.getTime())
    ? submission.created_at
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
  const wordCount = submission.content.trim().split(/\s+/).length;
  const preview =
    submission.exercise_prompt.length > 0
      ? submission.exercise_prompt
      : submission.content;
  const truncated = preview.length > 160 ? preview.slice(0, 160) + "…" : preview;

  return (
    <Link
      href={`/history/${submission.id}`}
      className="dw-card p-4 block hover:border-[#1b61c9] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="dw-chip">{DOMAIN_LABEL[submission.domain]}</span>
            <span className="text-[11px] uppercase tracking-[0.28px] text-[rgba(4,14,32,0.55)]">
              {dateLabel}
            </span>
            <span className="text-[11px] text-[rgba(4,14,32,0.55)]">
              · {wordCount} {t("history_words")}
            </span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-[14px] leading-[1.45] text-[#181d26]">
            <FileText
              size={14}
              className="mt-0.5 shrink-0 text-[rgba(4,14,32,0.55)]"
              aria-hidden
            />
            <span className="line-clamp-2">{truncated}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ScoreBadge score={submission.score} />
          <span className="inline-flex items-center gap-1 text-[12px] dw-link">
            {viewLabel}
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
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
      className="inline-flex items-center justify-center rounded-[10px] px-3 py-1 text-[16px] font-medium tracking-[0.08px]"
      style={{ backgroundColor: `${color}14`, color }}
    >
      {score}
    </span>
  );
}
