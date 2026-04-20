"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { UserVocabCard, ReviewRating } from "@/lib/agents/vocabTypes";
import { pickDefinition } from "@/lib/agents/vocabTypes";
import { useLang } from "@/lib/i18n";

interface LearnModeProps {
  cards: UserVocabCard[];
  onCardReviewed?: () => void;
}

interface Question {
  correct: UserVocabCard;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards: UserVocabCard[]): Question[] {
  return cards.map((correct) => {
    const pool = cards.filter((c) => c.id !== correct.id);
    const distractors = shuffle(pool).slice(0, 3).map((c) => c.word);
    const options = shuffle([correct.word, ...distractors]);
    return { correct, options };
  });
}

async function postReview(vocabId: number, rating: ReviewRating) {
  try {
    await fetch("/api/vocab/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocab_id: vocabId, rating }),
    });
  } catch (e) {
    console.error(e);
  }
}

export default function LearnMode({ cards, onCardReviewed }: LearnModeProps) {
  const { t, lang } = useLang();
  const [questions] = useState<Question[]>(() => buildQuestions(shuffle(cards)));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[idx];
  const done = idx >= questions.length;
  const isCorrect = selected === q?.correct.word;

  const pick = useCallback(
    async (option: string) => {
      if (!q || selected) return;
      setSelected(option);
      const correct = option === q.correct.word;
      if (correct) setCorrectCount((n) => n + 1);
      await postReview(q.correct.id, correct ? "good" : "again");
      onCardReviewed?.();
    },
    [q, selected, onCardReviewed]
  );

  const next = useCallback(() => {
    setSelected(null);
    setIdx((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !q) return;
      if (selected) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          next();
        }
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) pick(q.options[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, selected, done, pick, next]);

  const progress = useMemo(
    () => `${idx + (done ? 0 : 1)} / ${questions.length}`,
    [idx, done, questions.length]
  );

  if (questions.length < 4) {
    return (
      <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
        {t("study_mode_needs_cards").replace("{n}", "4")}
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
          {correctCount} / {questions.length}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[rgba(4,14,32,0.69)]">{progress}</span>
        <span className="text-[12px] text-[rgba(4,14,32,0.55)]">
          {t("learn_prompt")}
        </span>
      </div>

      <div className="dw-card p-6">
        <p className="text-[18px] leading-[1.5] text-[#181d26]">
          {pickDefinition(q.correct, lang)}
        </p>
        {q.correct.example_usage && (
          <p className="mt-2 text-[13px] italic leading-[1.5] text-[rgba(4,14,32,0.69)]">
            &ldquo;{q.correct.example_usage.replace(
              new RegExp(q.correct.word, "gi"),
              "____"
            )}&rdquo;
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((opt, i) => {
          const isPick = selected === opt;
          const isAnswer = opt === q.correct.word;
          let border = "border-[#e0e2e6]";
          let color = "text-[#181d26]";
          let icon: React.ReactNode = null;
          if (selected) {
            if (isAnswer) {
              border = "border-[#006400]";
              color = "text-[#006400]";
              icon = <Check size={16} />;
            } else if (isPick) {
              border = "border-[#b3261e]";
              color = "text-[#b3261e]";
              icon = <X size={16} />;
            }
          }
          return (
            <button
              type="button"
              key={opt}
              onClick={() => pick(opt)}
              disabled={!!selected}
              className={`flex items-center justify-between rounded-[12px] border ${border} bg-white px-4 py-3 text-left text-[15px] font-medium tracking-[0.08px] ${color} transition-colors hover:border-[#1b61c9] disabled:hover:border-[#e0e2e6]`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f8fafc] text-[11px] text-[rgba(4,14,32,0.55)]">
                  {i + 1}
                </span>
                {opt}
              </span>
              {icon}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="dw-card p-4 flex items-center justify-between gap-3">
          <div className="text-[14px] text-[#181d26]">
            {isCorrect ? (
              <span className="text-[#006400] font-medium">{t("learn_correct")}</span>
            ) : (
              <>
                <span className="text-[#b3261e] font-medium">
                  {t("learn_wrong")}
                </span>{" "}
                <span className="font-medium">{q.correct.word}</span>
              </>
            )}
          </div>
          <button type="button" onClick={next} className="dw-btn-primary">
            {t("learn_continue")}
          </button>
        </div>
      )}
    </div>
  );
}
