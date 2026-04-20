"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { UserVocabCard, ReviewRating } from "@/lib/agents/vocabTypes";
import { pickDefinition } from "@/lib/agents/vocabTypes";
import { useLang } from "@/lib/i18n";

interface FlashcardStudyProps {
  cards: UserVocabCard[];
  onCardReviewed?: () => void;
}

const DOMAIN_LABEL: Record<string, string> = {
  backend: "Backend",
  frontend: "Frontend",
  "system-design": "System Design",
  "ai-ml": "AI/ML",
  agentic: "Agentic",
  "prompt-forge": "Prompt Forge",
};

const LEVEL_LABEL: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff+",
};

function intervalForPreview(
  rating: ReviewRating,
  ease: number,
  reps: number,
  interval: number
): number {
  if (rating === "again") return 1;
  if (rating === "hard") return Math.max(1, Math.round(interval * 1.2));
  if (rating === "good") {
    const r = reps + 1;
    if (r === 1) return 1;
    if (r === 2) return 6;
    return Math.round(interval * ease);
  }
  const r = reps + 1;
  if (r === 1) return 2;
  if (r === 2) return 8;
  return Math.round(interval * ease * 1.3);
}

export default function FlashcardStudy({
  cards,
  onCardReviewed,
}: FlashcardStudyProps) {
  const { t, lang } = useLang();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const current = cards[idx];
  const done = idx >= cards.length;

  const previews = useMemo(() => {
    if (!current) return null;
    return {
      again: 1,
      hard: intervalForPreview("hard", current.ease_factor, current.repetitions, current.interval_days),
      good: intervalForPreview("good", current.ease_factor, current.repetitions, current.interval_days),
      easy: intervalForPreview("easy", current.ease_factor, current.repetitions, current.interval_days),
    };
  }, [current]);

  const toggleFlip = useCallback(() => {
    setFlipped((f) => {
      const next = !f;
      if (next) setHasRevealed(true);
      return next;
    });
  }, []);

  const rate = useCallback(
    async (rating: ReviewRating) => {
      if (!current || reviewing) return;
      setReviewing(true);
      try {
        const res = await fetch("/api/vocab/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vocab_id: current.id, rating }),
        });
        if (!res.ok) throw new Error("Review failed");
        setReviewedCount((n) => n + 1);
        setIdx((n) => n + 1);
        setFlipped(false);
        setHasRevealed(false);
        onCardReviewed?.();
      } catch (e) {
        console.error(e);
      } finally {
        setReviewing(false);
      }
    },
    [current, reviewing, onCardReviewed]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleFlip();
        return;
      }
      if (!hasRevealed) return;
      if (e.key === "1") rate("again");
      else if (e.key === "2") rate("hard");
      else if (e.key === "3") rate("good");
      else if (e.key === "4") rate("easy");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasRevealed, rate, toggleFlip, done]);

  if (!cards.length) {
    return (
      <div className="dw-card p-8 text-center">
        <p className="text-[14px] text-[rgba(4,14,32,0.69)]">{t("study_empty")}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="dw-card p-8 text-center">
        <h2 className="text-[20px] font-medium tracking-[0.08px] text-[#181d26]">
          {t("study_done_title")}
        </h2>
        <p className="mt-2 text-[14px] text-[rgba(4,14,32,0.69)]">
          {t("study_done_subtitle").replace("{n}", String(reviewedCount))}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[rgba(4,14,32,0.69)]">
          {t("study_progress")
            .replace("{n}", String(idx + 1))
            .replace("{total}", String(cards.length))}
        </span>
        <button
          type="button"
          onClick={toggleFlip}
          className="inline-flex items-center gap-1 text-[13px] text-[#1b61c9] hover:underline"
        >
          <RotateCcw size={14} />
          {flipped ? t("study_flip_back") : t("study_flip")}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleFlip}
        className="dw-card relative flex min-h-[340px] w-full flex-col items-center justify-center gap-3 p-10 text-center transition-transform hover:scale-[1.005]"
      >
        <div className="flex items-center gap-2">
          <span className="dw-chip">{LEVEL_LABEL[current.level]}</span>
          <span className="text-[11px] uppercase tracking-[0.28px] text-[rgba(4,14,32,0.55)]">
            {DOMAIN_LABEL[current.domain]}
          </span>
        </div>
        {!flipped ? (
          <>
            <div className="text-[36px] font-medium tracking-[0.08px] text-[#181d26]">
              {current.word}
            </div>
            <div className="mt-2 text-[12px] text-[rgba(4,14,32,0.55)]">
              {t("study_flip_hint")}
            </div>
          </>
        ) : (
          <>
            <p className="text-[20px] leading-[1.4] text-[#181d26]">
              {pickDefinition(current, lang)}
            </p>
            {current.example_usage && (
              <p className="mt-2 text-[14px] italic leading-[1.5] text-[rgba(4,14,32,0.69)]">
                &ldquo;{current.example_usage}&rdquo;
              </p>
            )}
            <div className="mt-2 text-[12px] text-[rgba(4,14,32,0.55)]">
              {t("study_flip_hint")}
            </div>
          </>
        )}
      </button>

      {hasRevealed && previews ? (
        <div className="grid grid-cols-4 gap-2">
          <RatingButton
            label={t("study_rating_again")}
            hint={t("study_rating_again_hint")}
            color="#b3261e"
            onClick={() => rate("again")}
            disabled={reviewing}
            shortcut="1"
          />
          <RatingButton
            label={t("study_rating_hard")}
            hint={t("study_rating_hard_hint").replace("{d}", String(previews.hard))}
            color="#b5610a"
            onClick={() => rate("hard")}
            disabled={reviewing}
            shortcut="2"
          />
          <RatingButton
            label={t("study_rating_good")}
            hint={t("study_rating_good_hint").replace("{d}", String(previews.good))}
            color="#1b61c9"
            onClick={() => rate("good")}
            disabled={reviewing}
            shortcut="3"
          />
          <RatingButton
            label={t("study_rating_easy")}
            hint={t("study_rating_easy_hint").replace("{d}", String(previews.easy))}
            color="#006400"
            onClick={() => rate("easy")}
            disabled={reviewing}
            shortcut="4"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleFlip}
          className="dw-btn-primary w-full"
        >
          {t("study_show_answer")}
        </button>
      )}
    </div>
  );
}

function RatingButton({
  label,
  hint,
  color,
  onClick,
  disabled,
  shortcut,
}: {
  label: string;
  hint: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
  shortcut: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-[12px] border border-[#e0e2e6] bg-white px-3 py-3 text-[14px] font-medium tracking-[0.08px] transition-colors hover:border-current disabled:opacity-50"
      style={{ color }}
    >
      <span>{label}</span>
      <span className="text-[11px] font-normal text-[rgba(4,14,32,0.55)]">
        {hint} · {shortcut}
      </span>
    </button>
  );
}
