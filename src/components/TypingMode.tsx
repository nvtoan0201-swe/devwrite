"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { UserVocabCard, ReviewRating } from "@/lib/agents/vocabTypes";
import { pickDefinition } from "@/lib/agents/vocabTypes";
import { useLang } from "@/lib/i18n";

interface TypingModeProps {
  cards: UserVocabCard[];
  onCardReviewed?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"`]/g, "")
    .replace(/\s+/g, " ");
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

export default function TypingMode({ cards, onCardReviewed }: TypingModeProps) {
  const { t, lang } = useLang();
  const [queue] = useState(() => shuffle(cards));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[idx];
  const done = idx >= queue.length;

  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [idx, done]);

  const check = useCallback(async () => {
    if (!current || result) return;
    const correct = normalize(input) === normalize(current.word);
    setResult(correct ? "correct" : "wrong");
    if (correct) setCorrectCount((n) => n + 1);
    await postReview(current.id, correct ? "good" : "again");
    onCardReviewed?.();
  }, [current, input, result, onCardReviewed]);

  const next = useCallback(() => {
    setInput("");
    setResult(null);
    setIdx((n) => n + 1);
  }, []);

  const dontKnow = useCallback(async () => {
    if (!current || result) return;
    setResult("wrong");
    await postReview(current.id, "again");
    onCardReviewed?.();
  }, [current, result, onCardReviewed]);

  const progress = useMemo(
    () => `${idx + (done ? 0 : 1)} / ${queue.length}`,
    [idx, done, queue.length]
  );

  if (!queue.length) {
    return (
      <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
        {t("study_empty")}
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
          {correctCount} / {queue.length}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[rgba(4,14,32,0.69)]">{progress}</span>
        <span className="text-[12px] text-[rgba(4,14,32,0.55)]">{t("type_prompt")}</span>
      </div>

      <div className="dw-card p-6">
        <p className="text-[18px] leading-[1.5] text-[#181d26]">
          {pickDefinition(current, lang)}
        </p>
        {current.example_usage && (
          <p className="mt-2 text-[13px] italic leading-[1.5] text-[rgba(4,14,32,0.69)]">
            &ldquo;{current.example_usage.replace(
              new RegExp(current.word, "gi"),
              "____"
            )}&rdquo;
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (result) next();
          else check();
        }}
        className="flex flex-col gap-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!result}
          placeholder={t("type_placeholder")}
          className="dw-input text-[18px] font-medium tracking-[0.08px]"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {result === "correct" && (
          <div className="dw-card px-4 py-3 flex items-center gap-2 text-[#006400]">
            <Check size={16} />
            <span className="font-medium">{t("type_correct")}</span>
            <span className="text-[rgba(4,14,32,0.69)] ml-auto">{current.word}</span>
          </div>
        )}
        {result === "wrong" && (
          <div className="dw-card px-4 py-3 flex items-center gap-2 text-[#b3261e]">
            <X size={16} />
            <span className="font-medium">{t("type_wrong")}</span>
            <span className="text-[#181d26] ml-auto font-medium">{current.word}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!result ? (
            <>
              <button type="submit" className="dw-btn-primary flex-1">
                {t("type_check")}
              </button>
              <button
                type="button"
                onClick={dontKnow}
                className="dw-btn-ghost"
              >
                {t("type_dont_know")}
              </button>
            </>
          ) : (
            <button type="submit" className="dw-btn-primary flex-1">
              {t("learn_continue")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
