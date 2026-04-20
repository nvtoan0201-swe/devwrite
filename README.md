# DevWrite

An AI writing coach that helps developers practice **technical English** across six domains: backend, frontend, system design, AI/ML, agentic systems, and prompt engineering.

Powered by [Claude Code](https://claude.com/claude-code) via the Claude Agent SDK — no API key required. The app spawns the local `claude` CLI as a subprocess for every LLM call, so anyone already signed into Claude Code can run it.

## Features

- **Adaptive exercises.** A planner agent reads your error history and picks the next domain, level, and weak areas to drill.
- **Structured feedback.** Each submission is graded for grammar, word choice, clarity, structure, and style. Responses are JSON via the SDK's `json_schema` output format.
- **Spaced-repetition vocabulary.** New technical words are added to your deck after each session and resurface for review.
- **Bilingual UI (EN / VI).** Toggle the interface language in the header. Grammar explanations, tips, and overall feedback are returned in your chosen language while the learning material (errors, corrections, new vocab) stays in English.
- **Floating chat widget.** Quick questions in Vietnamese or English without leaving the page.
- **Mermaid diagrams** for system-design exercises when you describe an architecture.

## Stack

- Next.js 16 (App Router, Turbopack) · TypeScript strict mode
- Tailwind CSS 4
- [@anthropic-ai/claude-agent-sdk](https://github.com/anthropics/claude-agent-sdk) — runs the Claude Code CLI as a subprocess
- [@libsql/client](https://github.com/tursodatabase/libsql-client-ts) — local SQLite file (`devwrite.db`)
- lucide-react icons

## Prerequisites

1. Node.js 20+
2. [Claude Code CLI](https://claude.com/claude-code) installed and logged in:
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude login
   ```
   Verify with `claude --version`. The app spawns `claude` for every LLM call, so this must work in your shell.

## Getting started

```bash
git clone git@github.com:nvtoan0201-swe/devwrite.git
cd devwrite
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database (`devwrite.db`) and 120 seed vocabulary entries are created on first request.

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         # floating chat widget endpoint
│   │   ├── exercise/route.ts     # generate exercise + session
│   │   ├── feedback/route.ts     # grade a submission
│   │   └── progress/route.ts     # stats, due vocab, top errors
│   ├── layout.tsx                # wraps app in LangProvider
│   └── page.tsx                  # 3-column UI
├── components/
│   ├── ChatWidget.tsx            # floating "Ask Claude" chat
│   ├── DomainSelector.tsx        # left rail
│   ├── WritingEditor.tsx         # center panel
│   ├── FeedbackPanel.tsx         # right rail with tabs
│   ├── GrammarPanel.tsx
│   ├── VocabPanel.tsx
│   ├── VocabCard.tsx
│   ├── WritingTipsPanel.tsx
│   └── ProgressBar.tsx
└── lib/
    ├── agents/
    │   ├── claudeCode.ts         # askClaudeCode (JSON) + chatClaudeCode
    │   ├── exerciseAgent.ts
    │   ├── feedbackAgent.ts
    │   └── plannerAgent.ts       # deterministic, no LLM
    ├── db.ts                     # libsql client + helpers
    ├── i18n.tsx                  # VI/EN dictionary + LangProvider
    ├── seed.ts                   # 120 vocab entries
    └── types.ts
```

## How the AI layer works

All LLM calls route through `src/lib/agents/claudeCode.ts`:

- `askClaudeCode<T>()` — structured JSON output via `outputFormat: { type: "json_schema", schema }`. Used by the feedback and exercise agents.
- `chatClaudeCode()` — free-form conversation for the floating chat widget. Takes the last 8 turns for context.

The SDK runs with `tools: []` and `permissionMode: "dontAsk"`, so the agents cannot edit files or run shell commands — they only respond to the prompt.

## Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start dev server (Turbopack)     |
| `npm run build`   | Production build                 |
| `npm run start`   | Run the production build         |
| `npm run lint`    | Next.js lint                     |
| `npx tsc --noEmit`| Type-check without emitting      |

## Data

A local SQLite file `devwrite.db` is created in the project root on first request. Tables cover users, sessions, submissions, vocabulary, error history, and a user-vocab review queue. The file is gitignored.

## License

MIT
