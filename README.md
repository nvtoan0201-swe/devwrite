# DevWrite

**You already pay for Claude Code. Stop renting a generic language app — practice the English that actually moves your engineering career, right on your laptop.**

## The story

You're a developer. Your day is English — PRs, Slack threads, design docs, incident write-ups, code comments. Your English is "good enough" for code to ship, but every review cycle costs you an extra day of "can you clarify?" comments.

So you try Duolingo. It teaches you to order coffee in Paris.

You try Grammarly. It fixes commas. It has no idea what an *idempotent retry* is, why your API changelog reads like a ransom note, or that "deploy" is a verb your reviewer expects in the active voice.

Meanwhile, you already have the best English tutor ever built sitting in your terminal — **Claude Code** — with a senior-engineer brain, context on your domain, and zero monthly fee on top of what you're already paying. It's just not wired up for writing practice.

**DevWrite is that wiring.** It's a local Next.js app that turns Claude Code into a domain-specific writing coach for developers: real exercises, real feedback, a real vocabulary system, all in your own repo, no extra API key, no SaaS, no data leaving your machine.

If you have Claude Code, you don't need another app with vague "English for professionals" marketing. You need one built for your actual job.

---

## Feature highlights

### Real writing exercises for your domain, your level

- Six domains: **Backend**, **Frontend**, **System Design**, **AI / ML**, **Agentic Systems**, **Prompt Forge** (prompt engineering for coding agents).
- Five levels: Intern → Junior → Mid → Senior → Staff+.
- A planner agent looks at your recent errors and picks the next exercise to stretch you — not a random drill.
- "New exercise" button when the current one doesn't suit you.

### Senior-engineer grade feedback, not red squiggles

Every submission comes back with:

- **Grammar** — each issue named by rule, original vs. correction, side-by-side.
- **Word choice** — which words a senior engineer would have used instead, with the context why.
- **Three targeted writing tips** — clarity, structure, style — specific to your sample.
- **Top-error trends** — your three most frequent mistakes across sessions, so you can see the pattern.
- **Clarity score** out of 10.
- **A 10/10 model answer** — the same prompt, rewritten the way a staff engineer would do it. Side-by-side with yours.

### Click any word → add it to your deck

- Click a word in the **exercise prompt**, your **own writing**, or the **model answer**.
- A popover fetches a domain-aware definition from Claude Code, detects the correct CEFR-style level, and produces an example sentence.
- One click saves it to your personal deck. Words too common to be worth learning (*the*, *is*, *to*) are auto-skipped.
- **Bilingual by choice, not by default.** Each saved card stores both English and Vietnamese definitions. The UI shows only the language you picked — toggle in the header and every card switches instantly.

### A full Quizlet-style vocab deck, built in

Four study modes, all driven by the same SM-2 spaced-repetition schedule:

| Mode | What it trains |
|------|----------------|
| **Flashcards** | Active recall. Flip freely as many times as you want, then rate *Again / Hard / Good / Easy*. Keyboard: Space to flip, 1–4 to rate. |
| **Learn** | Multiple-choice with three domain-relevant distractors. Keyboard 1–4 to pick. |
| **Type** | Given the definition, type the word. Punctuation and case forgiven. |
| **Match** | Quizlet-style grid of words ↔ definitions. Beat your time. |

Filter by domain, level, or "due today". Delete cards you've outgrown.

### Writing history, permanently on disk

Every session is saved — prompt, your draft, the full feedback, the model answer, the score, the date. Scroll back, re-read, see yourself improving. Stored locally in SQLite (`devwrite.db`). No cloud. No account.

### Speaks your language when it helps

Toggle **Tiếng Việt ↔ English** in the header. Grammar explanations, writing tips, definitions, and chat arrive in your chosen language — **errors, corrections, and vocabulary stay in English**, because that's the material you're here to learn.

For learners who find fully-English apps intimidating, this is the difference between "I'll come back later" and "I get it, I can keep going."

### Floating chat, always there

A corner widget lets you ask anything mid-session: "What's the difference between *idempotent* and *deterministic*?" "Is this sentence passive voice?" "Rewrite this in one line." It uses the same Claude Code session — so it already knows your domain and level.

### Runs 100% on Claude Code

- No Anthropic API key to manage, no per-token billing on top of your existing Claude Code subscription.
- All agent calls go through a single wrapper (`src/lib/agents/claudeCode.ts`) with JSON-schema validation on every response — the model's output is structurally guaranteed before it hits your UI.
- All state (sessions, submissions, vocab, errors, review schedule) lives in a local SQLite file. No account, no login, no telemetry.

---

## Why a dev-specific app, and not a general one

| | Generic English apps | DevWrite |
|---|---|---|
| Exercises | "Describe your weekend" | "Write a post-mortem for a cache stampede" |
| Vocabulary | Airport, restaurant, weather | `idempotent`, `back-pressure`, `eventual consistency` |
| Grader | Rule-based checker | Claude Code as a senior engineer |
| Runs | SaaS, cloud, paid monthly | Local Next.js + your existing Claude Code |
| Data | Their servers | Your `devwrite.db`, nowhere else |
| Knows your domain | No | Six dev-specific domains + level-aware prompts |

You already have the intelligence. DevWrite just points it at the writing you actually have to do.

---

## Setup

### Prerequisites

You need these three on your machine before cloning:

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | ≥ 20 (LTS) | `node -v` |
| **npm** | ≥ 10 (bundled with Node 20) | `npm -v` |
| **Git** | any recent | `git --version` |
| **Claude Code CLI** | any | `claude --version` |

No database server, no `.env` file, no Anthropic API key to manage — DevWrite uses your existing Claude Code login and a local SQLite file that gets created the first time you run it.

### Step 1 — Install Claude Code (if you don't have it yet)

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

`claude login` opens a browser window. Sign in with the account that has your Claude subscription. You only do this once per machine.

Verify:

```bash
claude --version
```

### Step 2 — Clone the repo

Pick one:

```bash
# HTTPS
git clone https://github.com/nvtoan0201-swe/devwrite.git

# SSH (if you have keys set up)
git clone git@github.com:nvtoan0201-swe/devwrite.git
```

Then:

```bash
cd devwrite
```

### Step 3 — Install dependencies

```bash
npm install
```

This pulls everything listed in `package.json` (Next.js 16, React 19, Tailwind v4, `@libsql/client`, the Claude Code SDK). No post-install hooks, no native builds — a clean `npm install` is all you need.

### Step 4 — Run the dev server

```bash
npm run dev
```

On first run:

- A local SQLite database is created at `./devwrite.db`.
- The schema is applied and a seed of starter vocabulary is inserted.
- A default user is created for you (no sign-up flow).

Open **http://localhost:3000** in your browser.

### Step 5 — Use it

1. Pick a **domain** and **level** on the home screen.
2. Click **New exercise** — Claude Code generates one targeted at you.
3. Write your answer. Hit **Submit**.
4. Read the feedback. Click any interesting word in the prompt, your writing, or the 10/10 model answer to save it to your deck.
5. Visit **/vocab** to study your deck in Flashcards / Learn / Type / Match mode.
6. Visit **/history** to re-read past sessions.

Toggle **VI ↔ EN** in the top bar anytime — explanations and definitions switch languages instantly; the English material you're learning stays in English.

### Production build (optional)

```bash
npm run build
npm run start
```

Serves the optimized build on port 3000.

---

## Troubleshooting

**`claude: command not found`** — Claude Code CLI isn't on your `PATH`. Re-run `npm install -g @anthropic-ai/claude-code` and make sure npm's global bin directory is on your `PATH` (`npm config get prefix` will show you where it installs to).

**The first exercise takes a few seconds** — that's Claude Code starting up and planning your first exercise. Subsequent calls are faster.

**"Unauthorized" or similar when generating an exercise** — your Claude Code session expired. Run `claude login` again.

**Want a clean slate?** Delete `devwrite.db` and restart the dev server. A fresh database will be created and re-seeded.

**Windows / PowerShell users** — all commands above work in PowerShell, Git Bash, or WSL. If you hit a path issue, prefer forward slashes.

---

## What gets committed vs. stays local

The repo ships only what another developer needs to clone and run:

- ✅ Source code (`src/`), public assets, configs (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`), this README.
- ❌ `node_modules/`, `.next/`, `*.db` (local SQLite), `*.tsbuildinfo`, `.env*`, editor/tooling folders (`.claude/`, `.omc/`, `.vscode/`, `.idea/`), OS cruft (`.DS_Store`, `Thumbs.db`), any `*.md` except this README, and the contributor's own `.gitignore`.

If you fork and want a `.gitignore` of your own, create one locally — it's kept out of the repo on purpose so each contributor can tune it to their own toolchain.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4**
- **@libsql/client** — local SQLite at `file:devwrite.db`
- **Claude Code SDK** — all AI goes through a typed, schema-validated wrapper
- **Lucide** icons

Project conventions live in `CLAUDE.md`.

---

## A closing note

Writing in a second language isn't a skill you drill into shape. It's a habit you build, one small piece of feedback at a time — on the kind of writing you actually do at work.

If you're a developer with Claude Code already running on your machine, you don't need another subscription. You need the right interface on the intelligence you already have.

DevWrite is that interface.

---

MIT License.
