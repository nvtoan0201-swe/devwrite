"use client";

import { Eye, Layers, Feather, ExternalLink, Target } from "lucide-react";
import type { TipType, WritingTip } from "@/lib/types";
import { useLang, type I18nKey } from "@/lib/i18n";

interface TopError {
  error_type: string;
  example: string;
  frequency: number;
  last_seen: string;
}

interface WritingTipsPanelProps {
  tips: WritingTip[];
  overallFeedback: string;
  topErrors: TopError[];
}

const TIP_ICON: Record<TipType, React.ComponentType<{ size?: number }>> = {
  clarity: Eye,
  structure: Layers,
  style: Feather,
};

const TIP_LABEL_KEY: Record<TipType, I18nKey> = {
  clarity: "tip_clarity",
  structure: "tip_structure",
  style: "tip_style",
};

export default function WritingTipsPanel({
  tips,
  overallFeedback,
  topErrors,
}: WritingTipsPanelProps) {
  const { t, lang } = useLang();
  const recurring = topErrors.filter((e) => e.frequency >= 2);
  const sessionTip = recurring[0];

  return (
    <div className="flex flex-col gap-4">
      {overallFeedback && (
        <div className="rounded-[12px] border border-[rgba(27,97,201,0.25)] bg-[rgba(27,97,201,0.05)] p-3">
          <div className="flex items-start gap-2">
            <Target size={14} className="mt-0.5 text-[#1b61c9]" aria-hidden />
            <p className="text-[14px] leading-[1.5] tracking-[0.08px] text-[#181d26]">
              {overallFeedback}
            </p>
          </div>
        </div>
      )}

      {sessionTip && (
        <div className="rounded-[12px] border border-[#e0e2e6] bg-white p-3">
          <div className="flex items-center gap-1.5 text-[rgba(4,14,32,0.55)] mb-1">
            <Target size={12} />
            <span className="text-[11px] uppercase tracking-[0.28px] font-medium">
              {t("tip_of_session")}
            </span>
          </div>
          <p className="text-[14px] leading-[1.5] text-[#181d26]">
            {lang === "vi" ? (
              <>
                Bạn đã lặp lỗi{" "}
                <span className="font-medium text-[#b3261e]">
                  {sessionTip.error_type.replace(/-/g, " ")}
                </span>{" "}
                {sessionTip.frequency} lần. Chậm lại ở chỗ này — đang thành
                thói quen.
              </>
            ) : (
              <>
                You&apos;ve repeated{" "}
                <span className="font-medium text-[#b3261e]">
                  {sessionTip.error_type.replace(/-/g, " ")}
                </span>{" "}
                errors {sessionTip.frequency} times. Slow down on this one —
                it&apos;s becoming a pattern.
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tips.length === 0 ? (
          <p className="text-[13px] text-[rgba(4,14,32,0.69)] tracking-[0.08px]">
            {t("tip_none")}
          </p>
        ) : (
          tips.map((tp, i) => <TipCard key={i} tip={tp} />)
        )}
      </div>
    </div>
  );
}

function TipCard({ tip }: { tip: WritingTip }) {
  const { t } = useLang();
  const Icon = TIP_ICON[tip.type] ?? Eye;
  return (
    <div className="rounded-[12px] border border-[#e0e2e6] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[rgba(4,14,32,0.55)] mb-1">
        <Icon size={12} />
        <span className="text-[11px] uppercase tracking-[0.28px] font-medium">
          {t(TIP_LABEL_KEY[tip.type])}
        </span>
      </div>
      <p className="text-[14px] leading-[1.5] tracking-[0.08px] text-[#181d26] font-medium">
        {tip.tip}
      </p>
      {tip.example && (
        <p className="mt-1.5 text-[13px] leading-[1.45] italic text-[rgba(4,14,32,0.69)]">
          &ldquo;{tip.example}&rdquo;
        </p>
      )}
      {tip.resource_url && (
        <a
          href={tip.resource_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[13px] dw-link"
        >
          {t("further_reading")}
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </div>
  );
}
