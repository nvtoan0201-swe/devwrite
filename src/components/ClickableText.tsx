"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import type { Domain, Level } from "@/lib/types";
import { useLang } from "@/lib/i18n";

interface ClickableTextProps {
  text: string;
  domain: Domain;
  className?: string;
  tone?: "default" | "model";
}

interface LookupData {
  word: string;
  definition: string;
  definition_vi: string;
  level: Level;
  example: string;
  search_query: string;
  skip: boolean;
}

type PopoverState =
  | { kind: "hidden" }
  | { kind: "loading"; word: string; anchorKey: string }
  | { kind: "ready"; data: LookupData; anchorKey: string }
  | { kind: "saving"; data: LookupData; anchorKey: string }
  | { kind: "saved"; data: LookupData; anchorKey: string }
  | { kind: "error"; message: string; anchorKey: string };

const LEVEL_LABEL: Record<Level, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff+",
};

const WORD_PATTERN = /([A-Za-z][A-Za-z0-9'’\-]*)/g;

interface Token {
  kind: "word" | "sep";
  value: string;
  key: string;
  sentence: string;
}

function tokenize(text: string): Token[] {
  const sentences = splitSentences(text);
  const tokens: Token[] = [];
  let idx = 0;
  for (const sentence of sentences) {
    WORD_PATTERN.lastIndex = 0;
    let lastEnd = 0;
    let m: RegExpExecArray | null;
    while ((m = WORD_PATTERN.exec(sentence)) !== null) {
      if (m.index > lastEnd) {
        tokens.push({
          kind: "sep",
          value: sentence.slice(lastEnd, m.index),
          key: `s${idx++}`,
          sentence,
        });
      }
      tokens.push({ kind: "word", value: m[0], key: `w${idx++}`, sentence });
      lastEnd = m.index + m[0].length;
    }
    if (lastEnd < sentence.length) {
      tokens.push({
        kind: "sep",
        value: sentence.slice(lastEnd),
        key: `s${idx++}`,
        sentence,
      });
    }
  }
  return tokens;
}

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const ch of text) {
    buf += ch;
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      out.push(buf);
      buf = "";
    }
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

export default function ClickableText({
  text,
  domain,
  className,
  tone = "default",
}: ClickableTextProps) {
  const { lang, t } = useLang();
  const [popover, setPopover] = useState<PopoverState>({ kind: "hidden" });
  const abortRef = useRef<AbortController | null>(null);

  const tokens = useMemo(() => tokenize(text), [text]);

  const closePopover = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPopover({ kind: "hidden" });
  }, []);

  const handleWordClick = useCallback(
    async (token: Token) => {
      const anchorKey = token.key;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPopover({ kind: "loading", word: token.value, anchorKey });
      try {
        const res = await fetch("/api/vocab/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            word: token.value,
            context: token.sentence.trim(),
            domain,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lookup failed");
        const lookup = data.lookup as LookupData;
        if (lookup.skip) {
          setPopover({
            kind: "error",
            message: t("click_too_common"),
            anchorKey,
          });
          return;
        }
        setPopover({ kind: "ready", data: lookup, anchorKey });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setPopover({
          kind: "error",
          message: (e as Error).message || "Lookup failed",
          anchorKey,
        });
      }
    },
    [domain, t]
  );

  const handleSave = useCallback(
    async (data: LookupData) => {
      setPopover((prev) =>
        prev.kind === "ready"
          ? { kind: "saving", data, anchorKey: prev.anchorKey }
          : prev
      );
      try {
        const res = await fetch("/api/vocab/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: data.word,
            definition: data.definition,
            definition_vi: data.definition_vi,
            level: data.level,
            domain,
            example: data.example,
          }),
        });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error || "Save failed");
        setPopover((prev) =>
          prev.kind === "saving"
            ? { kind: "saved", data, anchorKey: prev.anchorKey }
            : prev
        );
        setTimeout(() => {
          setPopover((p) => (p.kind === "saved" ? { kind: "hidden" } : p));
        }, 1200);
      } catch (e) {
        setPopover((prev) => ({
          kind: "error",
          message: (e as Error).message || "Save failed",
          anchorKey: "anchorKey" in prev ? prev.anchorKey : "",
        }));
      }
    },
    [domain]
  );

  const wordClass =
    tone === "model"
      ? "cursor-pointer rounded-[3px] transition-colors hover:bg-[rgba(27,97,201,0.14)] hover:text-[#1b61c9]"
      : "cursor-pointer rounded-[3px] transition-colors hover:bg-[rgba(27,97,201,0.10)] hover:text-[#1b61c9]";

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="whitespace-pre-wrap">
        {tokens.map((tok) =>
          tok.kind === "sep" ? (
            <span key={tok.key}>{tok.value}</span>
          ) : (
            <span key={tok.key} className="relative inline">
              <span
                role="button"
                tabIndex={0}
                className={wordClass}
                onClick={() => handleWordClick(tok)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleWordClick(tok);
                  }
                }}
              >
                {tok.value}
              </span>
              {popover.kind !== "hidden" &&
                "anchorKey" in popover &&
                popover.anchorKey === tok.key && (
                  <WordPopover
                    state={popover}
                    lang={lang}
                    onClose={closePopover}
                    onSave={handleSave}
                  />
                )}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function WordPopover({
  state,
  lang,
  onClose,
  onSave,
}: {
  state: PopoverState;
  lang: "vi" | "en";
  onClose: () => void;
  onSave: (data: LookupData) => void;
}) {
  const { t } = useLang();
  const pickDef = (d: LookupData) =>
    lang === "vi" && d.definition_vi ? d.definition_vi : d.definition;

  return (
    <span
      className="absolute left-0 top-full z-30 mt-1 block w-[280px] rounded-[12px] border border-[#e0e2e6] bg-white p-3 shadow-[0_8px_24px_rgba(4,14,32,0.12)]"
      role="dialog"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 text-[rgba(4,14,32,0.55)] hover:text-[#181d26]"
        aria-label="Close"
      >
        <X size={12} />
      </button>

      {state.kind === "loading" && (
        <div className="flex items-center gap-2 text-[13px] text-[rgba(4,14,32,0.69)]">
          <Loader2 size={14} className="animate-spin" />
          {t("click_looking_up")} &ldquo;{state.word}&rdquo;…
        </div>
      )}

      {(state.kind === "ready" ||
        state.kind === "saving" ||
        state.kind === "saved") && (
        <div>
          <div className="flex items-baseline gap-2 flex-wrap pr-5">
            <span className="text-[15px] font-medium text-[#181d26]">
              {state.data.word}
            </span>
            <span className="dw-chip">{LEVEL_LABEL[state.data.level]}</span>
          </div>
          <p className="mt-2 text-[13px] leading-[1.45] text-[#181d26]">
            {pickDef(state.data)}
          </p>
          {state.data.example && (
            <p className="mt-1 text-[12px] leading-[1.45] italic text-[rgba(4,14,32,0.69)]">
              &ldquo;{state.data.example}&rdquo;
            </p>
          )}
          <div className="mt-3">
            {state.kind === "saved" ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(27,97,201,0.12)] px-2 py-1 text-[12px] font-medium text-[#1b61c9]">
                <Check size={12} />
                {t("click_saved")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSave(state.data)}
                disabled={state.kind === "saving"}
                className="dw-btn-primary inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5"
              >
                {state.kind === "saving" ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    {t("click_saving")}
                  </>
                ) : (
                  <>
                    <Plus size={12} />
                    {t("click_save_to_deck")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="text-[13px] text-[rgba(4,14,32,0.82)] pr-5">
          {state.message}
        </div>
      )}
    </span>
  );
}
