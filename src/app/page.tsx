"use client";

import { useCallback, useEffect, useState } from "react";
import DomainSelector from "@/components/DomainSelector";
import WritingEditor from "@/components/WritingEditor";
import FeedbackPanel from "@/components/FeedbackPanel";
import ChatWidget from "@/components/ChatWidget";
import Nav from "@/components/Nav";
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
  const { lang } = useLang();
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
      <Nav />

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
            submittedText={submittedText}
            domain={domain}
          />

          <FeedbackPanel
            feedback={feedback}
            submittedText={submittedText}
            dueVocab={dueVocab}
            topErrors={topErrors}
            isSubmitting={isSubmitting}
            domain={domain}
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
