"use client";

import { ExternalLink } from "lucide-react";
import type { Domain, Level } from "@/lib/types";
import { useLang } from "@/lib/i18n";

interface VocabCardProps {
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example?: string;
  searchQuery?: string;
}

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

export default function VocabCard({
  word,
  definition,
  level,
  domain,
  example,
  searchQuery,
}: VocabCardProps) {
  const { t } = useLang();
  const searchHref = searchQuery
    ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    : `https://www.google.com/search?q=${encodeURIComponent(`${word} ${DOMAIN_LABEL[domain]}`)}`;

  return (
    <div className="dw-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[17px] font-medium tracking-[0.08px] text-[#181d26]">
            {word}
          </span>
          <span className="dw-chip">{LEVEL_LABEL[level]}</span>
          <span
            className="text-[11px] uppercase tracking-[0.28px] font-medium"
            style={{ color: "rgba(4,14,32,0.55)" }}
          >
            {DOMAIN_LABEL[domain]}
          </span>
        </div>
      </div>
      <p className="mt-2 text-[14px] leading-[1.45] tracking-[0.08px] text-[#181d26]">
        {definition}
      </p>
      {example && (
        <p className="mt-2 text-[13px] leading-[1.45] italic text-[rgba(4,14,32,0.69)]">
          &ldquo;{example}&rdquo;
        </p>
      )}
      <a
        href={searchHref}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[13px] dw-link"
      >
        {t("vocab_search_more")}
        <ExternalLink size={12} aria-hidden />
      </a>
    </div>
  );
}
