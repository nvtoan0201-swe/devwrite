"use client";

import { useCallback, useEffect, useState } from "react";
import { PenLine, Languages } from "lucide-react";
import DomainSelector from "@/components/DomainSelector";
import WritingEditor from "@/components/WritingEditor";
import FeedbackPanel from "@/components/FeedbackPanel";
import ChatWidget from "@/components/ChatWidget";
import { useLang } from "@/lib/i18n";
import type {
  Domain,
  Exercise,
  FeedbackResult,
  Level,
} from "@/lib/types";

interface Stats {
  sessions: number;
  submissions: number;
  avg_score: number;
  vocab_learned: number;
  current_level: Level;
}

interface DueVocabItem {
  id: number;
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

interface TopError {
  error_type: string;
  example: string;
  frequency: number;
  last_seen: string;
}

interface ProgressResponse {
  stats: Stats;
  due_vocab: DueVocabItem[];
  recent_submissions: Array<{
    id: number;
    content: string;
    score: number;
    created_at: string;
    domain: Domain;
  }>;
  top_errors: TopError[];
}

interface ExerciseResponse {
  session_id: number;
  exercise: Exercise;
  plan: { domain: Domain; level: Level; weakAreas: string[]; reason: string };
}

export default function Home() {
  const { lang, toggle, t } = useLang();
  const [domain, setDomain] = useState<Domain>("backend");
  const [level, setLevel] = useState<Level>("intern");

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [planReason, setPlanReason] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [submittedText, setSubmittedText] = useState("");

  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dueVocab, setDueVocab] = useState<DueVocabItem[]>([]);
  const [topErrors, setTopErrors] = useState<TopError[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) throw new Error(`Progress request failed (${res.status})`);
      const data = (await res.json()) as ProgressResponse;
      setStats(data.stats);
      setDueVocab(data.due_vocab ?? []);
      setTopErrors(data.top_errors ?? []);
      if (data.stats?.current_level) setLevel(data.stats.current_level);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const generateExercise = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate exercise");
      const payload = data as ExerciseResponse;
      setSessionId(payload.session_id);
      setExercise(payload.exercise);
      setPlanReason(payload.plan.reason);
      setContent("");
      setSubmittedText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate exercise");
    } finally {
      setIsGenerating(false);
    }
  }, [domain, level]);

  const submitWriting = useCallback(async () => {
    if (!exercise || !sessionId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          domain: exercise.domain,
          exercise_prompt: exercise.prompt,
          content,
          language: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit writing");
      setFeedback(data.feedback as FeedbackResult);
      setSubmittedText(content);
      fetchProgress();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit writing");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, exercise, sessionId, fetchProgress, lang]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b border-[#e0e2e6] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px]"
              style={{ background: "#1b61c9", color: "white" }}
              aria-hidden
            >
              <PenLine size={18} />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[16px] font-medium tracking-[0.08px] text-[#181d26]">
                DevWrite
              </span>
              <span className="text-[12px] tracking-[0.07px] text-[rgba(4,14,32,0.55)]">
                {t("header_tagline")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e2e6] bg-white px-3 py-1.5 text-[12px] font-medium tracking-[0.08px] text-[#181d26] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
              aria-label="Toggle language"
              title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            >
              <Languages size={12} aria-hidden />
              {lang === "vi" ? "VI" : "EN"}
            </button>
            <span className="hidden sm:inline-flex dw-chip">
              {t("header_chip")}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <DomainSelector
            domain={domain}
            level={level}
            onDomain={setDomain}
            onLevel={setLevel}
            stats={stats}
            dueVocab={dueVocab}
            onRefresh={fetchProgress}
            isLoading={isRefreshing}
          />

          <WritingEditor
            exercise={exercise}
            planReason={planReason}
            content={content}
            onChange={setContent}
            onSubmit={submitWriting}
            onNewExercise={generateExercise}
            isSubmitting={isSubmitting}
            isGenerating={isGenerating}
            error={error}
          />

          <FeedbackPanel
            feedback={feedback}
            submittedText={submittedText}
            dueVocab={dueVocab}
            topErrors={topErrors}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>

      <ChatWidget
        context={{
          domain,
          level,
          exercise_prompt: exercise?.prompt,
          last_submission: submittedText || undefined,
        }}
      />
    </div>
  );
}
