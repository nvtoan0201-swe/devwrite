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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  )`,
  `CREATE TABLE IF NOT EXISTS vocab_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
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

export async function initDb(): Promise<void> {
  if (_initialized) return;
  const db = getDb();
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execute(stmt);
  }
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
  score: number
): Promise<number> {
  const db = getDb();
  const res = await db.execute({
    sql: "INSERT INTO writing_submissions (session_id, content, feedback_json, score) VALUES (?, ?, ?, ?)",
    args: [sessionId, content, feedbackJson, score],
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
  level: Level,
  domain: Domain,
  exampleUsage: string
): Promise<void> {
  const db = getDb();
  let vocabId: number;
  const existing = await db.execute({
    sql: "SELECT id FROM vocab_entries WHERE word = ? AND domain = ? LIMIT 1",
    args: [word, domain],
  });
  if (existing.rows.length > 0) {
    vocabId = Number(existing.rows[0].id);
  } else {
    const ins = await db.execute({
      sql: "INSERT INTO vocab_entries (word, definition, level, domain, example_usage) VALUES (?, ?, ?, ?, ?)",
      args: [word, definition, level, domain, exampleUsage],
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
    sql: `SELECT v.id, v.word, v.definition, v.level, v.domain, v.example_usage, uv.next_review
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
