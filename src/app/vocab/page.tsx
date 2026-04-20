"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Keyboard,
  Layers,
  Puzzle,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Nav from "@/components/Nav";
import FlashcardStudy from "@/components/FlashcardStudy";
import LearnMode from "@/components/LearnMode";
import TypingMode from "@/components/TypingMode";
import MatchMode from "@/components/MatchMode";
import { useLang } from "@/lib/i18n";
import type { I18nKey } from "@/lib/i18n";
import type { Domain, Level } from "@/lib/types";
import { DOMAINS, LEVELS } from "@/lib/types";
import type { UserVocabCard } from "@/lib/agents/vocabTypes";
import { pickDefinition } from "@/lib/agents/vocabTypes";

type StudyMode = "flashcards" | "learn" | "type" | "match";

const STUDY_MODES: { id: StudyMode; label: I18nKey; icon: LucideIcon }[] = [
  { id: "flashcards", label: "study_mode_flashcards", icon: Layers },
  { id: "learn", label: "study_mode_learn", icon: GraduationCap },
  { id: "type", label: "study_mode_type", icon: Keyboard },
  { id: "match", label: "study_mode_match", icon: Puzzle },
];

type DomainFilter = Domain | "all";
type LevelFilter = Level | "all";
type DueFilter = "all" | "due";

const LEVEL_LABEL: Record<Level, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff+",
};

const DOMAIN_LABEL: Record<Domain, string> = {
  backend: "Backend",
  frontend: "Frontend",
  "system-design": "System Design",
  "ai-ml": "AI/ML",
  agentic: "Agentic",
  "prompt-forge": "Prompt Forge",
};

export default function VocabDeckPage() {
  const { t } = useLang();
  const [cards, setCards] = useState<UserVocabCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [studying, setStudying] = useState(false);
  const [mode, setMode] = useState<StudyMode>("flashcards");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [due, setDue] = useState<DueFilter>("all");

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vocab", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setCards(data.cards as UserVocabCard[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filtered = useMemo(
    () =>
      cards.filter(
        (c) =>
          (domain === "all" || c.domain === domain) &&
          (level === "all" || c.level === level) &&
          (due === "all" || c.is_due)
      ),
    [cards, domain, level, due]
  );

  const studyQueue = useMemo(() => {
    const queue = filtered.filter((c) => c.is_due);
    return queue.length > 0 ? queue : filtered;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = cards.length;
    const dueCount = cards.filter((c) => c.is_due).length;
    const mastered = cards.filter((c) => c.repetitions >= 4).length;
    return { total, due: dueCount, mastered };
  }, [cards]);

  const handleDelete = useCallback(
    async (card: UserVocabCard) => {
      if (!confirm(t("deck_delete_confirm"))) return;
      try {
        const res = await fetch(`/api/vocab/${card.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setCards((prev) => prev.filter((c) => c.id !== card.id));
      } catch (e) {
        console.error(e);
      }
    },
    [t]
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Nav />
      <main className="max-w-[1200px] mx-auto px-6 py-6">
        {studying ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudying(false);
                  fetchCards();
                }}
                className="inline-flex items-center gap-1 text-[13px] text-[rgba(4,14,32,0.69)] hover:text-[#181d26]"
              >
                <ArrowLeft size={14} />
                {t("study_exit")}
              </button>
              <div className="flex gap-1 rounded-full border border-[#e0e2e6] bg-white p-1">
                {STUDY_MODES.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[0.08px] transition-colors ${
                        active
                          ? "bg-[#1b61c9] text-white"
                          : "text-[rgba(4,14,32,0.69)] hover:text-[#181d26]"
                      }`}
                    >
                      <Icon size={14} />
                      {t(m.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === "flashcards" && (
              <FlashcardStudy cards={studyQueue} onCardReviewed={fetchCards} />
            )}
            {mode === "learn" && (
              <LearnMode cards={studyQueue} onCardReviewed={fetchCards} />
            )}
            {mode === "type" && (
              <TypingMode cards={studyQueue} onCardReviewed={fetchCards} />
            )}
            {mode === "match" && <MatchMode cards={studyQueue} />}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-[26px] font-medium tracking-[0.08px] text-[#181d26]">
                  {t("deck_title")}
                </h1>
                <p className="mt-1 text-[14px] text-[rgba(4,14,32,0.69)]">
                  {t("deck_subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudying(true)}
                disabled={studyQueue.length === 0}
                className="dw-btn-primary inline-flex items-center gap-2"
              >
                <GraduationCap size={16} />
                {t("deck_study")} ({studyQueue.length})
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard
                icon={<BookOpen size={14} />}
                label={t("deck_stats_total")}
                value={stats.total}
              />
              <StatCard
                icon={<Sparkles size={14} />}
                label={t("deck_stats_due")}
                value={stats.due}
                accent
              />
              <StatCard
                icon={<GraduationCap size={14} />}
                label={t("deck_stats_mastered")}
                value={stats.mastered}
              />
            </div>

            <div className="dw-card p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FilterSelect
                  label={t("deck_filter_domain")}
                  value={domain}
                  onChange={(v) => setDomain(v as DomainFilter)}
                  options={[
                    { id: "all", label: t("deck_filter_any") },
                    ...DOMAINS.map((d) => ({ id: d.id, label: d.label })),
                  ]}
                />
                <FilterSelect
                  label={t("deck_filter_level")}
                  value={level}
                  onChange={(v) => setLevel(v as LevelFilter)}
                  options={[
                    { id: "all", label: t("deck_filter_any") },
                    ...LEVELS.map((l) => ({ id: l.id, label: l.label })),
                  ]}
                />
                <FilterSelect
                  label={t("deck_filter_all")}
                  value={due}
                  onChange={(v) => setDue(v as DueFilter)}
                  options={[
                    { id: "all", label: t("deck_filter_all") },
                    { id: "due", label: t("deck_filter_due") },
                  ]}
                />
              </div>
            </div>

            {loading ? (
              <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
                {t("deck_loading")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
                {t("deck_empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((c) => (
                  <DeckCard
                    key={c.id}
                    card={c}
                    onDelete={() => handleDelete(c)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="dw-card p-4">
      <div className="flex items-center gap-1.5 text-[rgba(4,14,32,0.55)]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.28px] font-medium">
          {label}
        </span>
      </div>
      <div
        className={`mt-2 text-[28px] font-medium tracking-[0.08px] ${
          accent ? "text-[#1b61c9]" : "text-[#181d26]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-[rgba(4,14,32,0.55)]">
      <span className="uppercase tracking-[0.28px] font-medium">{label}</span>
      <select
        className="dw-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DeckCard({
  card,
  onDelete,
}: {
  card: UserVocabCard;
  onDelete: () => void;
}) {
  const { lang } = useLang();
  const nextReview = new Date(card.next_review + "Z");
  const nextLabel = isNaN(nextReview.getTime())
    ? ""
    : nextReview.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="dw-card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[17px] font-medium tracking-[0.08px] text-[#181d26]">
            {card.word}
          </span>
          <span className="dw-chip">{LEVEL_LABEL[card.level]}</span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-[rgba(4,14,32,0.55)] hover:text-[#b3261e]"
          aria-label="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="text-[11px] uppercase tracking-[0.28px] text-[rgba(4,14,32,0.55)] mt-0.5">
        {DOMAIN_LABEL[card.domain]}
      </div>
      <p className="mt-2 text-[13px] leading-[1.45] text-[#181d26] flex-1">
        {pickDefinition(card, lang)}
      </p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[rgba(4,14,32,0.55)]">
        <span>
          {card.is_due ? (
            <span className="text-[#1b61c9] font-medium">Due now</span>
          ) : (
            `Next: ${nextLabel}`
          )}
        </span>
        <span>×{card.repetitions}</span>
      </div>
    </div>
  );
}
