"use client";

import {
  Server,
  Monitor,
  Network,
  Brain,
  Bot,
  Wand2,
  BookOpen,
  Trophy,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { DOMAINS, LEVELS, type Domain, type Level } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import VocabCard from "./VocabCard";

const DOMAIN_ICON: Record<Domain, React.ComponentType<{ size?: number }>> = {
  backend: Server,
  frontend: Monitor,
  "system-design": Network,
  "ai-ml": Brain,
  agentic: Bot,
  "prompt-forge": Wand2,
};

interface Stats {
  sessions: number;
  submissions: number;
  avg_score: number;
  vocab_learned: number;
  current_level: Level;
}

interface DueVocab {
  id: number;
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

interface DomainSelectorProps {
  domain: Domain;
  level: Level;
  onDomain: (d: Domain) => void;
  onLevel: (l: Level) => void;
  stats: Stats | null;
  dueVocab: DueVocab[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function DomainSelector({
  domain,
  level,
  onDomain,
  onLevel,
  stats,
  dueVocab,
  onRefresh,
  isLoading,
}: DomainSelectorProps) {
  const { t } = useLang();
  return (
    <aside className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] flex flex-col gap-4">
      <div className="dw-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
            {t("domain_title")}
          </h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-[rgba(4,14,32,0.55)] hover:text-[#181d26] transition-colors"
            aria-label="Refresh progress"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICON[d.id];
            const active = d.id === domain;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDomain(d.id)}
                className={`flex items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-[rgba(27,97,201,0.08)]"
                    : "hover:bg-[#f8fafc]"
                }`}
              >
                <span
                  className={`mt-0.5 ${active ? "text-[#1b61c9]" : "text-[rgba(4,14,32,0.69)]"}`}
                  aria-hidden
                >
                  <Icon size={16} />
                </span>
                <span className="flex flex-col">
                  <span
                    className={`text-[14px] font-medium tracking-[0.08px] ${
                      active ? "text-[#1b61c9]" : "text-[#181d26]"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="text-[12px] text-[rgba(4,14,32,0.55)] tracking-[0.07px]">
                    {d.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dw-card p-4">
        <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-3">
          {t("level_title")}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => {
            const active = l.id === level;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onLevel(l.id)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[0.08px] border transition-colors ${
                  active
                    ? "bg-[#1b61c9] text-white border-[#1b61c9]"
                    : "bg-white text-[#181d26] border-[#e0e2e6] hover:border-[#1b61c9] hover:text-[#1b61c9]"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {stats && (
        <div className="dw-card p-4">
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase mb-3">
            {t("progress_title")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCell
              icon={<Trophy size={14} />}
              label={t("stat_sessions")}
              value={stats.sessions}
            />
            <StatCell
              icon={<BookOpen size={14} />}
              label={t("stat_vocab")}
              value={stats.vocab_learned}
            />
            <StatCell
              icon={<TrendingUp size={14} />}
              label={t("stat_avg_score")}
              value={stats.submissions > 0 ? stats.avg_score.toFixed(0) : "—"}
            />
            <StatCell
              icon={<Trophy size={14} />}
              label={t("stat_current")}
              value={capitalize(stats.current_level)}
            />
          </div>
        </div>
      )}

      <div className="dw-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-medium tracking-[0.08px] text-[#181d26] uppercase">
            {t("review_title")}
          </h2>
          <span className="dw-chip">{dueVocab.length}</span>
        </div>
        {dueVocab.length === 0 ? (
          <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px]">
            {t("review_empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {dueVocab.slice(0, 3).map((v) => (
              <VocabCard
                key={v.id}
                word={v.word}
                definition={v.definition}
                level={v.level}
                domain={v.domain}
                example={v.example_usage}
              />
            ))}
            {dueVocab.length > 3 && (
              <p className="text-[12px] text-[rgba(4,14,32,0.55)]">
                + {dueVocab.length - 3} {t("review_more_waiting")}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[12px] border border-[#e0e2e6] bg-[#f8fafc] px-3 py-2">
      <div className="flex items-center gap-1.5 text-[rgba(4,14,32,0.55)]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.28px] font-medium">
          {label}
        </span>
      </div>
      <span className="text-[18px] font-medium text-[#181d26] tabular-nums">
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
