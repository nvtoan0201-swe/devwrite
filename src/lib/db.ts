import { createClient, type Client } from "@libsql/client";
import type { Domain, Level } from "./types";

let _client: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({ url: "file:devwrite.db" });
  }
  return _client;
}

const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    current_level TEXT NOT NULL DEFAULT 'intern'
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    exercise_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS writing_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    feedback_json TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    exercise_prompt TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  )`,
  `CREATE TABLE IF NOT EXISTS vocab_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    definition_vi TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL,
    domain TEXT NOT NULL,
    example_usage TEXT NOT NULL,
    UNIQUE(word, domain)
  )`,
  `CREATE TABLE IF NOT EXISTS user_vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vocab_id INTEGER NOT NULL,
    learned_at TEXT NOT NULL DEFAULT (datetime('now')),
    next_review TEXT NOT NULL DEFAULT (datetime('now', '+1 day')),
    ease_factor REAL NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, vocab_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vocab_id) REFERENCES vocab_entries(id)
  )`,
  `CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    error_type TEXT NOT NULL,
    example TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 1,
    last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
];

async function addColumnIfMissing(
  table: string,
  column: string,
  ddl: string
): Promise<void> {
  const db = getDb();
  const info = await db.execute(`PRAGMA table_info(${table})`);
  const exists = info.rows.some((r) => String(r.name) === column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export async function initDb(): Promise<void> {
  if (_initialized) return;
  const db = getDb();
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execute(stmt);
  }
  await addColumnIfMissing(
    "writing_submissions",
    "exercise_prompt",
    "exercise_prompt TEXT NOT NULL DEFAULT ''"
  );
  await addColumnIfMissing(
    "user_vocab",
    "repetitions",
    "repetitions INTEGER NOT NULL DEFAULT 0"
  );
  await addColumnIfMissing(
    "user_vocab",
    "interval_days",
    "interval_days INTEGER NOT NULL DEFAULT 1"
  );
  await addColumnIfMissing(
    "vocab_entries",
    "definition_vi",
    "definition_vi TEXT NOT NULL DEFAULT ''"
  );
  const users = await db.execute("SELECT id FROM users LIMIT 1");
  if (users.rows.length === 0) {
    await db.execute("INSERT INTO users (current_level) VALUES ('intern')");
  }
  const vocab = await db.execute("SELECT id FROM vocab_entries LIMIT 1");
  if (vocab.rows.length === 0) {
    const { seedVocab } = await import("./seed");
    await seedVocab();
  }
  _initialized = true;
}

export async function getDefaultUserId(): Promise<number> {
  await initDb();
  const db = getDb();
  const res = await db.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1");
  if (res.rows.length === 0) {
    const ins = await db.execute("INSERT INTO users (current_level) VALUES ('intern')");
    return Number(ins.lastInsertRowid);
  }
  return Number(res.rows[0].id);
}

export async function getUserLevel(userId: number): Promise<Level> {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT current_level FROM users WHERE id = ?",
    args: [userId],
  });
  return (res.rows[0]?.current_level as Level) ?? "intern";
}

export async function setUserLevel(userId: number, level: Level): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "UPDATE users SET current_level = ? WHERE id = ?",
    args: [level, userId],
  });
}

export async function createSession(
  userId: number,
  domain: Domain,
  exerciseType: string
): Promise<number> {
  const db = getDb();
  const res = await db.execute({
    sql: "INSERT INTO sessions (user_id, domain, exercise_type) VALUES (?, ?, ?)",
    args: [userId, domain, exerciseType],
  });
  return Number(res.lastInsertRowid);
}

export async function saveSubmission(
  sessionId: number,
  content: string,
  feedbackJson: string,
  score: number,
  exercisePrompt: string
): Promise<number> {
  const db = getDb();
  const res = await db.execute({
    sql: "INSERT INTO writing_submissions (session_id, content, feedback_json, score, exercise_prompt) VALUES (?, ?, ?, ?, ?)",
    args: [sessionId, content, feedbackJson, score, exercisePrompt],
  });
  return Number(res.lastInsertRowid);
}

export async function logError(
  userId: number,
  errorType: string,
  example: string
): Promise<void> {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id, frequency FROM error_log WHERE user_id = ? AND error_type = ? LIMIT 1",
    args: [userId, errorType],
  });
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    await db.execute({
      sql: "UPDATE error_log SET frequency = ?, example = ?, last_seen = datetime('now') WHERE id = ?",
      args: [Number(row.frequency) + 1, example, Number(row.id)],
    });
  } else {
    await db.execute({
      sql: "INSERT INTO error_log (user_id, error_type, example) VALUES (?, ?, ?)",
      args: [userId, errorType, example],
    });
  }
}

export async function getTopErrors(userId: number, limit = 5) {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT error_type, example, frequency, last_seen FROM error_log WHERE user_id = ? ORDER BY frequency DESC, last_seen DESC LIMIT ?",
    args: [userId, limit],
  });
  return res.rows.map((r) => ({
    error_type: String(r.error_type),
    example: String(r.example),
    frequency: Number(r.frequency),
    last_seen: String(r.last_seen),
  }));
}

export async function addVocabForUser(
  userId: number,
  word: string,
  definition: string,
  definitionVi: string,
  level: Level,
  domain: Domain,
  exampleUsage: string
): Promise<void> {
  const db = getDb();
  let vocabId: number;
  const existing = await db.execute({
    sql: "SELECT id, definition_vi FROM vocab_entries WHERE word = ? AND domain = ? LIMIT 1",
    args: [word, domain],
  });
  if (existing.rows.length > 0) {
    vocabId = Number(existing.rows[0].id);
    const existingVi = String(existing.rows[0].definition_vi ?? "");
    if (!existingVi && definitionVi) {
      await db.execute({
        sql: "UPDATE vocab_entries SET definition_vi = ? WHERE id = ?",
        args: [definitionVi, vocabId],
      });
    }
  } else {
    const ins = await db.execute({
      sql: "INSERT INTO vocab_entries (word, definition, definition_vi, level, domain, example_usage) VALUES (?, ?, ?, ?, ?, ?)",
      args: [word, definition, definitionVi, level, domain, exampleUsage],
    });
    vocabId = Number(ins.lastInsertRowid);
  }
  await db.execute({
    sql: "INSERT OR IGNORE INTO user_vocab (user_id, vocab_id) VALUES (?, ?)",
    args: [userId, vocabId],
  });
}

export async function getVocabDueForReview(userId: number, limit = 10) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT v.id, v.word, v.definition, v.definition_vi, v.level, v.domain, v.example_usage, uv.next_review
          FROM user_vocab uv
          JOIN vocab_entries v ON v.id = uv.vocab_id
          WHERE uv.user_id = ? AND uv.next_review <= datetime('now')
          ORDER BY uv.next_review ASC
          LIMIT ?`,
    args: [userId, limit],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    word: String(r.word),
    definition: String(r.definition),
    definition_vi: String(r.definition_vi ?? ""),
    level: String(r.level) as Level,
    domain: String(r.domain) as Domain,
    example_usage: String(r.example_usage),
    next_review: String(r.next_review),
  }));
}

export async function getProgressStats(userId: number) {
  const db = getDb();
  const sessions = await db.execute({
    sql: "SELECT COUNT(*) as c FROM sessions WHERE user_id = ?",
    args: [userId],
  });
  const submissions = await db.execute({
    sql: `SELECT COUNT(*) as c, AVG(score) as avg_score
          FROM writing_submissions ws
          JOIN sessions s ON s.id = ws.session_id
          WHERE s.user_id = ?`,
    args: [userId],
  });
  const vocab = await db.execute({
    sql: "SELECT COUNT(*) as c FROM user_vocab WHERE user_id = ?",
    args: [userId],
  });
  const level = await getUserLevel(userId);
  return {
    sessions: Number(sessions.rows[0]?.c ?? 0),
    submissions: Number(submissions.rows[0]?.c ?? 0),
    avg_score: Number(submissions.rows[0]?.avg_score ?? 0),
    vocab_learned: Number(vocab.rows[0]?.c ?? 0),
    current_level: level,
  };
}

export async function getRecentSubmissions(userId: number, limit = 5) {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT ws.id, ws.content, ws.score, ws.created_at, s.domain
          FROM writing_submissions ws
          JOIN sessions s ON s.id = ws.session_id
          WHERE s.user_id = ?
          ORDER BY ws.created_at DESC
          LIMIT ?`,
    args: [userId, limit],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    content: String(r.content),
    score: Number(r.score),
    created_at: String(r.created_at),
    domain: String(r.domain) as Domain,
  }));
}

export interface SubmissionSummary {
  id: number;
  content: string;
  score: number;
  created_at: string;
  domain: Domain;
  exercise_prompt: string;
}

export async function getSubmissionHistory(
  userId: number
): Promise<SubmissionSummary[]> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT ws.id, ws.content, ws.score, ws.created_at, ws.exercise_prompt, s.domain
          FROM writing_submissions ws
          JOIN sessions s ON s.id = ws.session_id
          WHERE s.user_id = ?
          ORDER BY ws.created_at DESC`,
    args: [userId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    content: String(r.content),
    score: Number(r.score),
    created_at: String(r.created_at),
    domain: String(r.domain) as Domain,
    exercise_prompt: String(r.exercise_prompt ?? ""),
  }));
}

export interface SubmissionDetail extends SubmissionSummary {
  feedback_json: string;
}

export async function getSubmissionById(
  userId: number,
  id: number
): Promise<SubmissionDetail | null> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT ws.id, ws.content, ws.score, ws.created_at, ws.exercise_prompt,
                 ws.feedback_json, s.domain
          FROM writing_submissions ws
          JOIN sessions s ON s.id = ws.session_id
          WHERE s.user_id = ? AND ws.id = ?
          LIMIT 1`,
    args: [userId, id],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: Number(r.id),
    content: String(r.content),
    score: Number(r.score),
    created_at: String(r.created_at),
    domain: String(r.domain) as Domain,
    exercise_prompt: String(r.exercise_prompt ?? ""),
    feedback_json: String(r.feedback_json),
  };
}

export interface UserVocabCard {
  id: number;
  word: string;
  definition: string;
  definition_vi: string;
  level: Level;
  domain: Domain;
  example_usage: string;
  next_review: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  learned_at: string;
  is_due: boolean;
}

export async function getAllUserVocab(
  userId: number
): Promise<UserVocabCard[]> {
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT v.id, v.word, v.definition, v.definition_vi, v.level, v.domain, v.example_usage,
                 uv.next_review, uv.ease_factor, uv.repetitions, uv.interval_days,
                 uv.learned_at,
                 CASE WHEN uv.next_review <= datetime('now') THEN 1 ELSE 0 END AS is_due
          FROM user_vocab uv
          JOIN vocab_entries v ON v.id = uv.vocab_id
          WHERE uv.user_id = ?
          ORDER BY uv.next_review ASC`,
    args: [userId],
  });
  return res.rows.map((r) => ({
    id: Number(r.id),
    word: String(r.word),
    definition: String(r.definition),
    definition_vi: String(r.definition_vi ?? ""),
    level: String(r.level) as Level,
    domain: String(r.domain) as Domain,
    example_usage: String(r.example_usage),
    next_review: String(r.next_review),
    ease_factor: Number(r.ease_factor),
    repetitions: Number(r.repetitions),
    interval_days: Number(r.interval_days),
    learned_at: String(r.learned_at),
    is_due: Number(r.is_due) === 1,
  }));
}

export type ReviewRating = "again" | "hard" | "good" | "easy";

function computeNextSchedule(
  rating: ReviewRating,
  prevEase: number,
  prevReps: number,
  prevInterval: number
): { ease: number; repetitions: number; intervalDays: number } {
  let ease = prevEase;
  let reps = prevReps;
  let interval = prevInterval;

  if (rating === "again") {
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, prevEase - 0.2);
  } else if (rating === "hard") {
    reps = prevReps + 1;
    interval = Math.max(1, Math.round(prevInterval * 1.2));
    ease = Math.max(1.3, prevEase - 0.15);
  } else if (rating === "good") {
    reps = prevReps + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(prevInterval * prevEase);
  } else {
    reps = prevReps + 1;
    if (reps === 1) interval = 2;
    else if (reps === 2) interval = 8;
    else interval = Math.round(prevInterval * prevEase * 1.3);
    ease = prevEase + 0.15;
  }
  return { ease, repetitions: reps, intervalDays: Math.max(1, interval) };
}

export async function reviewVocabCard(
  userId: number,
  vocabId: number,
  rating: ReviewRating
): Promise<{ next_review: string; interval_days: number } | null> {
  const db = getDb();
  const cur = await db.execute({
    sql: `SELECT ease_factor, repetitions, interval_days
          FROM user_vocab WHERE user_id = ? AND vocab_id = ? LIMIT 1`,
    args: [userId, vocabId],
  });
  if (cur.rows.length === 0) return null;
  const row = cur.rows[0];
  const next = computeNextSchedule(
    rating,
    Number(row.ease_factor),
    Number(row.repetitions),
    Number(row.interval_days)
  );
  await db.execute({
    sql: `UPDATE user_vocab
          SET ease_factor = ?, repetitions = ?, interval_days = ?,
              next_review = datetime('now', ?)
          WHERE user_id = ? AND vocab_id = ?`,
    args: [
      next.ease,
      next.repetitions,
      next.intervalDays,
      `+${next.intervalDays} day`,
      userId,
      vocabId,
    ],
  });
  const refreshed = await db.execute({
    sql: `SELECT next_review, interval_days FROM user_vocab
          WHERE user_id = ? AND vocab_id = ? LIMIT 1`,
    args: [userId, vocabId],
  });
  const r = refreshed.rows[0];
  return {
    next_review: String(r.next_review),
    interval_days: Number(r.interval_days),
  };
}

export async function removeVocabFromUser(
  userId: number,
  vocabId: number
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM user_vocab WHERE user_id = ? AND vocab_id = ?",
    args: [userId, vocabId],
  });
}
