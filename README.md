# DevWrite

**Your technical English coach — practice the writing that actually moves your career.**

Most English learning apps teach you how to order coffee. DevWrite teaches you how to write a system-design doc, explain a bug to a senior engineer, review a PR in clear prose, or document an API so the next person on-call doesn't page you at 3am.

## Who this is for

Developers whose day-to-day work runs on English but whose first language isn't.

If you've ever:

- rewritten the same Slack message five times before sending it,
- shipped a PR description that got "can you clarify?" comments,
- stared at a blank doc wondering how to explain your architecture in a way that lands,
- felt your ideas are sharper in your head than they come out on the page,

this is built for you.

## The mission

Give every developer the one thing that actually unlocks technical English: **concrete, personalized, senior-engineer-grade feedback on their own writing, every day.**

Not drills. Not flashcards out of context. Not "which preposition is correct." Real writing, in your real domain, graded on what actually matters at work: clarity, precision, structure.

## What it does for you

### Writes with you, not at you
You get an exercise suited to your level and domain. You write. You submit. You get back:
- What you got wrong, in your own words — with the rule named, not just the fix.
- Word choices a senior engineer would make instead.
- Three targeted writing tips — clarity, structure, style — specific to this exact sample.
- A clarity score, so you can see yourself climbing.

### Focused on the domains that actually pay
- **Backend** — APIs, databases, distributed services
- **Frontend** — UI frameworks, UX, performance
- **System design** — architecture, scale, trade-offs
- **AI / ML** — models, training, inference, evaluation
- **Agentic systems** — autonomous agents, tools, orchestration
- **Prompt engineering** — writing for Claude Code, Cursor, and coding agents

Pick where you want to grow. The app picks the exercise.

### Adapts to you
DevWrite remembers your mistakes and leans into them. Repeat subject–verb errors? You'll see them called out as a pattern. Struggling with articles? The planner will aim your next exercise there. Nail three sessions in a row? You move up a level. No XP grind — just honest, useful progression.

### Remembers vocabulary for you
Every session adds a small set of domain-specific words to your review deck. DevWrite schedules them back at spaced intervals so they stick — no separate flashcard app, no manual work.

### Speaks your language
Toggle between **Tiếng Việt** and **English** in the header. Grammar explanations, writing tips, and overall feedback arrive in your chosen language — but the actual errors, corrections, and new vocabulary stay in English, because that's the material you're here to learn.

For learners who find fully-English apps intimidating, this is the difference between "I'll come back later" and "I get it, I can keep going."

### Ask anything, any time
A floating chat sits in the corner. Stuck on a word? Want a quick second opinion on a sentence? Need someone to explain *idempotent* in Vietnamese one more time? Ask — in either language.

## Why it's different

- **Technical English, not general English.** You will never be asked to describe your favorite holiday.
- **Real feedback, not rubrics.** Every response is graded by a senior engineer's voice, not a scoring algorithm.
- **Your language, when you need it.** Explanations in Vietnamese when the concept is new; English when the material is the point.
- **No API key, no paywall, no subscription.** It runs locally on your machine using Claude Code.
- **No account.** Your data never leaves your laptop.

## Get started

```bash
git clone git@github.com:nvtoan0201-swe/devwrite.git
cd devwrite
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a domain.

You'll need the [Claude Code CLI](https://claude.com/claude-code) installed and logged in — that's what DevWrite uses to run the coach. One-time setup:

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

## A closing note

Writing in a second language isn't a skill you drill into shape. It's a habit you build, one small piece of feedback at a time. DevWrite is the version of that feedback loop we wished we'd had years ago — before every awkward email, every confusing PR, every meeting where we had the right idea and the wrong words for it.

We hope it helps you get there faster.

---

MIT License.
