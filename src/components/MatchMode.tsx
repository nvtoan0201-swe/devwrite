"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { UserVocabCard } from "@/lib/agents/vocabTypes";
import { pickDefinition } from "@/lib/agents/vocabTypes";
import { useLang } from "@/lib/i18n";

interface MatchModeProps {
  cards: UserVocabCard[];
}

interface Tile {
  key: string;
  pairId: number;
  kind: "word" | "def";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTiles(cards: UserVocabCard[]): Tile[] {
  const tiles: Tile[] = [];
  for (const c of cards) {
    tiles.push({ key: `w-${c.id}`, pairId: c.id, kind: "word" });
    tiles.push({ key: `d-${c.id}`, pairId: c.id, kind: "def" });
  }
  return shuffle(tiles);
}

const MAX_PAIRS = 6;

export default function MatchMode({ cards }: MatchModeProps) {
  const { t, lang } = useLang();
  const pickPool = useMemo(() => shuffle(cards).slice(0, MAX_PAIRS), [cards]);
  const cardById = useMemo(() => {
    const m = new Map<number, UserVocabCard>();
    for (const c of pickPool) m.set(c.id, c);
    return m;
  }, [pickPool]);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(pickPool));
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const allMatched = matched.size === pickPool.length;

  useEffect(() => {
    if (allMatched) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [allMatched, startedAt]);

  const onPick = useCallback(
    (tile: Tile) => {
      if (matched.has(tile.pairId)) return;
      if (selected.includes(tile.key)) return;
      if (selected.length >= 2) return;

      const next = [...selected, tile.key];
      setSelected(next);

      if (next.length === 2) {
        const [aKey, bKey] = next;
        const a = tiles.find((tt) => tt.key === aKey)!;
        const b = tiles.find((tt) => tt.key === bKey)!;
        if (a.pairId === b.pairId && a.kind !== b.kind) {
          setTimeout(() => {
            setMatched((prev) => new Set(prev).add(a.pairId));
            setSelected([]);
          }, 250);
        } else {
          setWrongFlash(next);
          setTimeout(() => {
            setWrongFlash([]);
            setSelected([]);
          }, 650);
        }
      }
    },
    [matched, selected, tiles]
  );

  const restart = useCallback(() => {
    const fresh = buildTiles(pickPool);
    setTiles(fresh);
    setSelected([]);
    setMatched(new Set());
    setWrongFlash([]);
    setStartedAt(Date.now());
    setElapsed(0);
  }, [pickPool]);

  if (pickPool.length < 2) {
    return (
      <div className="dw-card p-8 text-center text-[14px] text-[rgba(4,14,32,0.69)]">
        {t("study_mode_needs_cards").replace("{n}", "2")}
      </div>
    );
  }

  if (allMatched) {
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    return (
      <div className="dw-card p-8 text-center">
        <h2 className="text-[20px] font-medium tracking-[0.08px] text-[#181d26]">
          {t("match_done")}
        </h2>
        <p className="mt-2 text-[14px] text-[rgba(4,14,32,0.69)]">
          {t("match_time")}: <span className="font-medium text-[#181d26]">{mm}:{ss}</span>
        </p>
        <button
          type="button"
          onClick={restart}
          className="dw-btn-primary mt-4 inline-flex items-center gap-2"
        >
          <RotateCcw size={14} />
          {t("match_restart")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[rgba(4,14,32,0.55)]">{t("match_prompt")}</span>
        <span className="text-[13px] text-[rgba(4,14,32,0.69)]">
          {matched.size} / {pickPool.length} · {elapsed}s
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.pairId);
          const isSelected = selected.includes(tile.key);
          const isWrong = wrongFlash.includes(tile.key);
          const card = cardById.get(tile.pairId);
          if (!card) return null;
          const text = tile.kind === "word" ? card.word : pickDefinition(card, lang);

          let cls = "border-[#e0e2e6] bg-white text-[#181d26] hover:border-[#1b61c9]";
          if (isMatched) cls = "border-[#006400] bg-[rgba(0,100,0,0.06)] text-[#006400]";
          else if (isWrong) cls = "border-[#b3261e] bg-[rgba(179,38,30,0.06)] text-[#b3261e]";
          else if (isSelected) cls = "border-[#1b61c9] bg-[rgba(27,97,201,0.06)] text-[#1b61c9]";

          return (
            <button
              type="button"
              key={tile.key}
              onClick={() => onPick(tile)}
              disabled={isMatched}
              className={`min-h-[96px] rounded-[12px] border-2 p-3 text-left text-[13px] leading-[1.4] font-medium tracking-[0.08px] transition-colors ${cls}`}
            >
              {tile.kind === "word" ? (
                <span className="text-[16px]">{text}</span>
              ) : (
                <span className="text-[12px] font-normal">{text}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
