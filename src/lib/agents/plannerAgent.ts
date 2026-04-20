import { getDb, getUserLevel, getTopErrors, setUserLevel } from "../db";
import type { Domain, Level } from "../types";
import { DOMAINS, LEVELS } from "../types";

export interface NextExercisePlan {
  domain: Domain;
  level: Level;
  weakAreas: string[];
  reason: string;
}

const LEVEL_ORDER: Level[] = ["intern", "junior", "mid", "senior", "staff"];

function nextLevel(level: Level): Level {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
}

async function recentAvgScore(userId: number, limit = 5): Promise<number | null> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT AVG(ws.score) as avg_score
          FROM (
            SELECT ws.score
            FROM writing_submissions ws
            JOIN sessions s ON s.id = ws.session_id
            WHERE s.user_id = ?
            ORDER BY ws.created_at DESC
            LIMIT ?
          ) ws`,
    args: [userId, limit],
  });
  const avg = res.rows[0]?.avg_score;
  return avg == null ? null : Number(avg);
}

async function leastPracticedDomain(userId: number, preferred?: Domain): Promise<Domain> {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT domain, COUNT(*) as c FROM sessions WHERE user_id = ? GROUP BY domain",
    args: [userId],
  });
  const counts = new Map<string, number>();
  for (const r of res.rows) counts.set(String(r.domain), Number(r.c));

  if (preferred && (counts.get(preferred) ?? 0) < 10) return preferred;

  let best: Domain = "backend";
  let min = Infinity;
  for (const d of DOMAINS) {
    const c = counts.get(d.id) ?? 0;
    if (c < min) {
      min = c;
      best = d.id;
    }
  }
  return best;
}

export async function planNextExercise(
  userId: number,
  preferredDomain?: Domain,
  preferredLevel?: Level
): Promise<NextExercisePlan> {
  const currentLevel = preferredLevel ?? (await getUserLevel(userId));
  const topErrors = await getTopErrors(userId, 5);
  const weakAreas = topErrors.filter((e) => e.frequency >= 2).map((e) => e.error_type);

  const avg = await recentAvgScore(userId, 5);

  let level: Level = currentLevel;
  let reason = "Continuing at your current level.";

  if (weakAreas.length >= 3 && !preferredLevel) {
    level = currentLevel;
    reason = `You have ${weakAreas.length} recurring weak areas — staying at ${currentLevel} until these are steady.`;
  } else if (avg != null && avg >= 8 && !preferredLevel && currentLevel !== "staff") {
    level = nextLevel(currentLevel);
    reason = `Recent scores averaged ${avg.toFixed(1)}/10 — moving you up to ${level}.`;
    await setUserLevel(userId, level);
  } else if (avg != null && avg < 5 && !preferredLevel) {
    const idx = LEVEL_ORDER.indexOf(currentLevel);
    level = LEVEL_ORDER[Math.max(0, idx - 1)];
    reason = `Recent scores averaged ${avg.toFixed(1)}/10 — easing to ${level} to rebuild.`;
    if (level !== currentLevel) await setUserLevel(userId, level);
  }

  const domain = await leastPracticedDomain(userId, preferredDomain);

  const domainLabel = DOMAINS.find((d) => d.id === domain)?.label ?? domain;
  const levelLabel = LEVELS.find((l) => l.id === level)?.label ?? level;

  return {
    domain,
    level,
    weakAreas,
    reason: `${reason} Practicing ${domainLabel} at ${levelLabel}.`,
  };
}
