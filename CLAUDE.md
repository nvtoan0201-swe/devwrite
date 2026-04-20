\# DevWrite Project Rules



\## Tech Stack

\- Next.js 14 App Router, TypeScript strict mode

\- Tailwind CSS only, no inline styles, dark theme

\- Database: @libsql/client, local file `file:devwrite.db`

\- AI: @anthropic-ai/sdk, model claude-sonnet-4-6

\- Icons: lucide-react



\## Conventions

\- Server components by default, client only when using hooks

\- All AI calls go through src/lib/agents/

\- Database access only through src/lib/db.ts

\- All API routes in src/app/api/



\## OS

Windows — use Windows-compatible commands only

