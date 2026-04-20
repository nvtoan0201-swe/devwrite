"use client";

import { Sparkles, Send, Loader2, BookmarkPlus } from "lucide-react";
import type { Domain, Exercise } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import ClickableText from "./ClickableText";

interface WritingEditorProps {
  exercise: Exercise | null;
  planReason: string | null;
  content: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onNewExercise: () => void;
  isSubmitting: boolean;
  isGenerating: boolean;
  error: string | null;
  submittedText: string;
  domain: Domain;
}

export default function WritingEditor({
  exercise,
  planReason,
  content,
  onChange,
  onSubmit,
  onNewExercise,
  isSubmitting,
  isGenerating,
  error,
  submittedText,
  domain,
}: WritingEditorProps) {
  const { t } = useLang();
  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const canSubmit = !isSubmitting && !isGenerating && wordCount >= 5 && !!exercise;

  return (
    <section className="flex-1 flex flex-col gap-4 min-w-0">
      <div className="dw-card p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#1b61c9]" aria-hidden />
            <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
              {t("exercise_title")}
            </h2>
            {exercise && (
              <span className="dw-chip">{exercise.exercise_type}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onNewExercise}
            disabled={isGenerating}
            className="dw-btn-ghost inline-flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("generating")}
              </>
            ) : (
              t("new_exercise")
            )}
          </button>
        </div>

        {planReason && (
          <p className="mb-3 text-[13px] leading-[1.45] tracking-[0.08px] text-[rgba(4,14,32,0.69)]">
            {planReason}
          </p>
        )}

        {exercise ? (
          <>
            <ClickableText
              text={exercise.prompt}
              domain={domain}
              className="text-[17px] leading-[1.45] tracking-[0.08px] text-[#181d26]"
            />
            {exercise.context && (
              <ClickableText
                text={exercise.context}
                domain={domain}
                className="mt-3 rounded-[12px] border border-[#e0e2e6] bg-[#f8fafc] p-3 text-[14px] leading-[1.5] tracking-[0.08px] text-[rgba(4,14,32,0.82)]"
              />
            )}
          </>
        ) : isGenerating ? (
          <p className="text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("exercise_preparing")}
          </p>
        ) : (
          <p className="text-[14px] text-[rgba(4,14,32,0.69)]">
            {t("exercise_click_prefix")}{" "}
            <strong>{t("new_exercise")}</strong>{" "}
            {t("exercise_click_suffix")}
          </p>
        )}
      </div>

      <div className="dw-card p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
            {t("your_writing")}
          </h2>
          <span className="text-[12px] tracking-[0.07px] text-[rgba(4,14,32,0.55)] tabular-nums">
            {wordCount} {wordCount === 1 ? t("word_singular") : t("word_plural")}
            {wordCount < 5 && t("min_5_suffix")}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("editor_placeholder")}
          className="dw-monospace flex-1 min-h-[280px] w-full resize-y rounded-[12px] border border-[#e0e2e6] bg-white p-4 text-[14px] leading-[1.6] text-[#181d26] focus:outline-none focus:border-[#1b61c9] focus:shadow-[0_0_0_3px_rgba(27,97,201,0.12)]"
          spellCheck
        />

        {error && (
          <div className="mt-3 rounded-[12px] border border-[rgba(179,38,30,0.3)] bg-[rgba(179,38,30,0.06)] px-3 py-2 text-[13px] text-[#b3261e]">
            {error}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="dw-btn-primary inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("grading")}
              </>
            ) : (
              <>
                <Send size={16} />
                {t("submit")}
              </>
            )}
          </button>
        </div>
      </div>

      {submittedText && (
        <div className="dw-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookmarkPlus size={14} className="text-[#1b61c9]" aria-hidden />
            <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
              {t("submitted_writing_title")}
            </h2>
          </div>
          <p className="text-[12px] text-[rgba(4,14,32,0.55)] mb-3">
            {t("submitted_writing_hint")}
          </p>
          <ClickableText
            text={submittedText}
            domain={domain}
            className="dw-monospace rounded-[12px] border border-[#e0e2e6] bg-[#f8fafc] p-4 text-[14px] leading-[1.6] text-[#181d26]"
          />
        </div>
      )}
    </section>
  );
}
