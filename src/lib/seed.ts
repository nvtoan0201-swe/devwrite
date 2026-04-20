import { getDb } from "./db";
import type { Domain, Level } from "./types";

interface VocabSeed {
  word: string;
  definition: string;
  level: Level;
  domain: Domain;
  example_usage: string;
}

const VOCAB: VocabSeed[] = [
  // ---------- BACKEND (20) ----------
  { word: "endpoint", definition: "A specific URL where an API can be accessed by a client.", level: "intern", domain: "backend", example_usage: "The /users endpoint returns a list of registered users." },
  { word: "request", definition: "A message sent from a client asking the server to do something.", level: "intern", domain: "backend", example_usage: "The request failed because the auth token had expired." },
  { word: "response", definition: "The server's reply to a client request, usually containing data or a status code.", level: "intern", domain: "backend", example_usage: "The response body contained the list of orders in JSON." },
  { word: "deploy", definition: "To release code to a running environment so that users can access it.", level: "intern", domain: "backend", example_usage: "We deploy to staging every night at midnight." },
  { word: "middleware", definition: "A function that runs between the request and the final handler, often for auth or logging.", level: "junior", domain: "backend", example_usage: "Add an auth middleware before the protected routes." },
  { word: "idempotent", definition: "An operation that produces the same result whether called once or many times.", level: "junior", domain: "backend", example_usage: "Make the payment endpoint idempotent so retries don't double-charge." },
  { word: "pagination", definition: "Splitting a large result set into smaller, fetchable pages.", level: "junior", domain: "backend", example_usage: "Use cursor-based pagination to stay stable as the list changes." },
  { word: "caching", definition: "Storing expensive results in fast storage to avoid recomputing them.", level: "junior", domain: "backend", example_usage: "Add caching in front of the pricing service to reduce load." },
  { word: "webhook", definition: "An HTTP callback that a service sends when an event occurs.", level: "junior", domain: "backend", example_usage: "Stripe sends a webhook to our server when a payment succeeds." },
  { word: "circuit breaker", definition: "A pattern that stops calling a failing dependency to prevent cascading failure.", level: "mid", domain: "backend", example_usage: "The circuit breaker opened after 50% of calls to the search service timed out." },
  { word: "backpressure", definition: "A signal from a slow consumer telling a producer to slow down.", level: "mid", domain: "backend", example_usage: "Without backpressure, the queue grew unbounded and crashed the worker." },
  { word: "eventual consistency", definition: "A model where replicas converge to the same state given enough time, not immediately.", level: "mid", domain: "backend", example_usage: "The dashboard uses an eventually consistent read replica for lower latency." },
  { word: "sharding", definition: "Splitting a dataset across multiple databases by a partition key.", level: "mid", domain: "backend", example_usage: "We shard the orders table by customer_id to keep each shard small." },
  { word: "blast radius", definition: "The scope of impact if a change or failure goes wrong.", level: "senior", domain: "backend", example_usage: "Shipping this behind a feature flag keeps the blast radius to one tenant." },
  { word: "graceful degradation", definition: "Keeping core features working when dependencies fail.", level: "senior", domain: "backend", example_usage: "When search is down, gracefully degrade by showing the cached homepage." },
  { word: "SLA", definition: "Service Level Agreement: a contractual uptime or latency promise to customers.", level: "senior", domain: "backend", example_usage: "Our SLA is 99.9% availability measured monthly." },
  { word: "observability", definition: "The ability to understand a system's internal state from its outputs (logs, metrics, traces).", level: "senior", domain: "backend", example_usage: "Invest in observability before you need it — debugging blind is expensive." },
  { word: "service mesh", definition: "Infrastructure layer that handles service-to-service traffic, retries, and auth.", level: "staff", domain: "backend", example_usage: "We adopted a service mesh to standardize mTLS across every service." },
  { word: "SLO burn rate", definition: "How fast you're consuming your error budget against a service level objective.", level: "staff", domain: "backend", example_usage: "The fast-burn alert fires when the SLO burn rate exceeds 14x." },
  { word: "chaos engineering", definition: "Deliberately injecting failures in production to discover weaknesses.", level: "staff", domain: "backend", example_usage: "We run chaos engineering drills monthly to validate failover." },

  // ---------- FRONTEND (20) ----------
  { word: "component", definition: "A reusable, self-contained piece of UI.", level: "intern", domain: "frontend", example_usage: "Extract the header into a Header component so we can reuse it." },
  { word: "props", definition: "Inputs passed from a parent component to a child.", level: "intern", domain: "frontend", example_usage: "Pass the user's name as a prop to the Avatar component." },
  { word: "state", definition: "Data owned by a component that can change over time.", level: "intern", domain: "frontend", example_usage: "Store the form's open/closed status in component state." },
  { word: "render", definition: "To compute and display the UI based on current props and state.", level: "intern", domain: "frontend", example_usage: "The list re-renders whenever the search query changes." },
  { word: "hooks", definition: "Functions that let you use state and lifecycle features in function components.", level: "junior", domain: "frontend", example_usage: "Use the useEffect hook to fetch data when the component mounts." },
  { word: "memoization", definition: "Caching a computed value so it isn't recalculated on every render.", level: "junior", domain: "frontend", example_usage: "Memoize the filtered list with useMemo to avoid re-sorting on every keystroke." },
  { word: "hydration", definition: "Attaching client-side behavior to server-rendered HTML.", level: "junior", domain: "frontend", example_usage: "Hydration mismatch warnings usually mean the server and client disagreed on the initial render." },
  { word: "routing", definition: "Mapping URLs to the components that should render for them.", level: "junior", domain: "frontend", example_usage: "Set up nested routing so the sidebar persists across child pages." },
  { word: "reactive", definition: "A style where the UI automatically updates when underlying data changes.", level: "junior", domain: "frontend", example_usage: "Signals give you reactive updates without re-rendering the whole component." },
  { word: "virtual DOM", definition: "An in-memory tree of UI nodes diffed against the real DOM to minimize updates.", level: "mid", domain: "frontend", example_usage: "React's virtual DOM lets you write declarative UI without manual DOM surgery." },
  { word: "bundle splitting", definition: "Breaking JavaScript into chunks loaded on demand instead of all upfront.", level: "mid", domain: "frontend", example_usage: "Bundle splitting dropped our initial load from 800KB to 180KB." },
  { word: "server component", definition: "A component rendered only on the server, sending HTML (not JS) to the client.", level: "mid", domain: "frontend", example_usage: "Turn the dashboard into a server component so we don't ship the query client to users." },
  { word: "suspense", definition: "A mechanism to declaratively show fallback UI while async data loads.", level: "mid", domain: "frontend", example_usage: "Wrap the dashboard in a Suspense boundary with a skeleton fallback." },
  { word: "render cycle", definition: "The sequence of work the framework does to compute and commit a UI update.", level: "senior", domain: "frontend", example_usage: "That input lag comes from blocking the render cycle with a synchronous layout read." },
  { word: "accessibility", definition: "Designing UI so people with disabilities can use it effectively.", level: "senior", domain: "frontend", example_usage: "Accessibility is not optional — every interactive element needs a keyboard path." },
  { word: "critical rendering path", definition: "The sequence of steps the browser takes to paint the first frame.", level: "senior", domain: "frontend", example_usage: "Inlining critical CSS shortened the critical rendering path by 200ms." },
  { word: "perceived performance", definition: "How fast users feel the app is, independent of raw metrics.", level: "senior", domain: "frontend", example_usage: "Skeleton screens improved perceived performance even without real speedups." },
  { word: "design system governance", definition: "The process of deciding who can change shared UI primitives and how.", level: "staff", domain: "frontend", example_usage: "Without design system governance, every team forks the Button component." },
  { word: "bundle budget", definition: "A hard cap on JS payload size enforced in CI.", level: "staff", domain: "frontend", example_usage: "The bundle budget failed the build when someone imported all of lodash." },
  { word: "web vitals", definition: "Google's user-centric metrics for page experience: LCP, CLS, INP.", level: "staff", domain: "frontend", example_usage: "We track web vitals per route so we can catch regressions per deploy." },

  // ---------- SYSTEM DESIGN (20) ----------
  { word: "load balancer", definition: "A component that distributes incoming traffic across multiple servers.", level: "intern", domain: "system-design", example_usage: "The load balancer routes requests to the healthiest backend." },
  { word: "database", definition: "A system that stores, retrieves, and manages structured data.", level: "intern", domain: "system-design", example_usage: "Start with a single SQL database before reaching for anything fancier." },
  { word: "cache", definition: "Fast, temporary storage for frequently accessed data.", level: "intern", domain: "system-design", example_usage: "Put a cache in front of the product catalog to cut read load." },
  { word: "queue", definition: "A buffer that decouples producers from consumers and absorbs bursts.", level: "intern", domain: "system-design", example_usage: "Push jobs onto a queue so the web tier can return immediately." },
  { word: "horizontal scaling", definition: "Adding more machines to handle load, not making each one bigger.", level: "junior", domain: "system-design", example_usage: "Stateless services let us scale horizontally by just adding replicas." },
  { word: "replication", definition: "Keeping copies of data on multiple nodes for durability and read scale.", level: "junior", domain: "system-design", example_usage: "Set up replication to a read replica in another region." },
  { word: "partitioning", definition: "Splitting data across nodes by a key so no single node holds it all.", level: "junior", domain: "system-design", example_usage: "Partition by tenant_id so one noisy tenant can't slow everyone else down." },
  { word: "consistency", definition: "Guarantees about whether all readers see the same data at the same time.", level: "junior", domain: "system-design", example_usage: "We need strong consistency on the wallet balance but not on the activity feed." },
  { word: "fan-out", definition: "A pattern where one event triggers many downstream workers.", level: "junior", domain: "system-design", example_usage: "A new post fan-outs to every follower's timeline cache." },
  { word: "CAP theorem", definition: "You can pick at most two of Consistency, Availability, and Partition-tolerance.", level: "mid", domain: "system-design", example_usage: "Under a network partition, CAP forces a choice between availability and consistency." },
  { word: "quorum", definition: "The minimum number of nodes that must agree for a read or write to be considered valid.", level: "mid", domain: "system-design", example_usage: "With 5 replicas and a quorum of 3, we tolerate 2 failures." },
  { word: "consensus", definition: "A protocol that lets a group of nodes agree on a value despite failures.", level: "mid", domain: "system-design", example_usage: "Raft is a consensus protocol that's easier to understand than Paxos." },
  { word: "leader election", definition: "Choosing a single node to coordinate writes or a job.", level: "mid", domain: "system-design", example_usage: "The scheduler uses ZooKeeper for leader election so only one instance runs cron." },
  { word: "multi-region failover", definition: "Automatically shifting traffic to another region when one goes down.", level: "senior", domain: "system-design", example_usage: "Our multi-region failover target is under 60 seconds of user-visible impact." },
  { word: "cell-based architecture", definition: "Isolating tenants into independent cells so failures don't spread.", level: "senior", domain: "system-design", example_usage: "Cell-based architecture lets us contain a bad deploy to 1/20th of users." },
  { word: "capacity planning", definition: "Forecasting resource needs to stay ahead of growth and spikes.", level: "senior", domain: "system-design", example_usage: "Capacity planning caught that we'd exhaust DB IOPS before Black Friday." },
  { word: "hot spot", definition: "A partition or key that receives disproportionately high traffic.", level: "senior", domain: "system-design", example_usage: "That celebrity account is a hot spot — we need to shard their timeline further." },
  { word: "north star architecture", definition: "The long-term target design the team is migrating toward.", level: "staff", domain: "system-design", example_usage: "Every roadmap item should move us closer to the north star architecture, not sideways." },
  { word: "platform leverage", definition: "Building shared primitives so product teams ship faster.", level: "staff", domain: "system-design", example_usage: "Investing in platform leverage pays off once you have more than five product teams." },
  { word: "organizational coupling", definition: "When system boundaries mirror (or misalign with) team boundaries.", level: "staff", domain: "system-design", example_usage: "The monolith's hottest file keeps conflicting because of organizational coupling across four teams." },

  // ---------- AI/ML (20) ----------
  { word: "model", definition: "A learned function mapping inputs to outputs.", level: "intern", domain: "ai-ml", example_usage: "Train a classification model to tag support tickets by category." },
  { word: "training", definition: "Adjusting model parameters so outputs match labeled examples.", level: "intern", domain: "ai-ml", example_usage: "Training ran for 3 hours and the loss plateaued around epoch 12." },
  { word: "inference", definition: "Running a trained model on new inputs to get predictions.", level: "intern", domain: "ai-ml", example_usage: "Inference latency is what users feel — keep it under 200ms." },
  { word: "dataset", definition: "A collection of examples used to train or evaluate a model.", level: "intern", domain: "ai-ml", example_usage: "Split the dataset into train, validation, and test sets." },
  { word: "overfitting", definition: "When a model memorizes training data and fails to generalize.", level: "junior", domain: "ai-ml", example_usage: "The gap between train and eval accuracy suggests overfitting." },
  { word: "regularization", definition: "Techniques that discourage the model from memorizing noise.", level: "junior", domain: "ai-ml", example_usage: "Add weight decay for regularization and the eval score climbed." },
  { word: "embedding", definition: "A dense vector representation of a token, word, or document.", level: "junior", domain: "ai-ml", example_usage: "Compute embeddings for every doc and store them in a vector index." },
  { word: "fine-tuning", definition: "Continuing training of a pretrained model on a task-specific dataset.", level: "junior", domain: "ai-ml", example_usage: "Fine-tune the base model on our support transcripts before deploying." },
  { word: "batch size", definition: "The number of examples processed together in one training step.", level: "junior", domain: "ai-ml", example_usage: "Bigger batch size stabilized gradients but ate more GPU memory." },
  { word: "attention mechanism", definition: "A component that weights parts of the input when computing each output token.", level: "mid", domain: "ai-ml", example_usage: "The attention mechanism lets the model focus on the relevant tokens for each prediction." },
  { word: "gradient descent", definition: "An optimization algorithm that nudges parameters in the direction that reduces loss.", level: "mid", domain: "ai-ml", example_usage: "Gradient descent diverged because the learning rate was too high." },
  { word: "hyperparameter", definition: "A knob set before training that controls how training proceeds.", level: "mid", domain: "ai-ml", example_usage: "Learning rate is the most important hyperparameter to tune." },
  { word: "vector database", definition: "A store optimized for nearest-neighbor search over embeddings.", level: "mid", domain: "ai-ml", example_usage: "We use a vector database to retrieve the 10 most similar docs per query." },
  { word: "RLHF", definition: "Reinforcement Learning from Human Feedback — aligning models using human preference data.", level: "senior", domain: "ai-ml", example_usage: "RLHF made the assistant refuse unsafe prompts more reliably." },
  { word: "retrieval augmented generation", definition: "Grounding a generative model's output in retrieved documents at inference time.", level: "senior", domain: "ai-ml", example_usage: "Retrieval augmented generation cut hallucination rates on long-tail questions." },
  { word: "distillation", definition: "Training a small model to imitate a larger one for cheaper inference.", level: "senior", domain: "ai-ml", example_usage: "Distillation got us 85% of teacher quality at 10% of the cost." },
  { word: "evaluation harness", definition: "A repeatable test suite that scores a model across tasks.", level: "senior", domain: "ai-ml", example_usage: "Every release gates on the evaluation harness before shipping." },
  { word: "model governance", definition: "Policies around who can train, deploy, and modify models in production.", level: "staff", domain: "ai-ml", example_usage: "Model governance requires a sign-off for any customer-facing model change." },
  { word: "data flywheel", definition: "A loop where product usage generates data that improves the model.", level: "staff", domain: "ai-ml", example_usage: "The data flywheel is what makes incumbents hard to displace in ML products." },
  { word: "responsible AI", definition: "Practices ensuring models are safe, fair, and privacy-respecting.", level: "staff", domain: "ai-ml", example_usage: "Responsible AI reviews are required before any public launch." },

  // ---------- AGENTIC (20) ----------
  { word: "agent", definition: "A system that uses an LLM to plan and take actions via tools.", level: "intern", domain: "agentic", example_usage: "The agent read the ticket and opened a PR with the fix." },
  { word: "tool", definition: "A function the agent can call to do something in the world.", level: "intern", domain: "agentic", example_usage: "Give the agent a search tool and a file-read tool." },
  { word: "task", definition: "The unit of work the agent is asked to accomplish.", level: "intern", domain: "agentic", example_usage: "Break the task into steps before handing it to the agent." },
  { word: "prompt", definition: "The instructions and context you give the model for a task.", level: "intern", domain: "agentic", example_usage: "Tighten the prompt so the agent stops asking clarifying questions." },
  { word: "context window", definition: "The maximum number of tokens the model can see at once.", level: "junior", domain: "agentic", example_usage: "Long transcripts blow the context window — summarize older turns." },
  { word: "tool calling", definition: "The model's ability to emit a structured request to invoke a tool.", level: "junior", domain: "agentic", example_usage: "Tool calling returns JSON that your runtime dispatches to real functions." },
  { word: "memory", definition: "Persistent state the agent carries across turns or sessions.", level: "junior", domain: "agentic", example_usage: "Store user preferences in memory so the agent doesn't re-ask every session." },
  { word: "planner", definition: "A component that decides the next step before executing.", level: "junior", domain: "agentic", example_usage: "The planner breaks the goal into a checklist the executor works through." },
  { word: "state machine", definition: "A model where the agent transitions through defined states per step.", level: "junior", domain: "agentic", example_usage: "A state machine keeps the agent from looping on the same failed action." },
  { word: "orchestration", definition: "Coordinating multiple agents or tools to accomplish a larger goal.", level: "mid", domain: "agentic", example_usage: "Orchestration routes the research agent's output into the writer agent." },
  { word: "delegation", definition: "Handing a sub-task to a specialized sub-agent.", level: "mid", domain: "agentic", example_usage: "Delegate code review to a dedicated sub-agent so the main loop stays focused." },
  { word: "error recovery", definition: "Detecting and responding to tool failures mid-task.", level: "mid", domain: "agentic", example_usage: "Add error recovery so a flaky API doesn't abort the whole run." },
  { word: "parallel execution", definition: "Running independent sub-tasks at the same time instead of one after another.", level: "mid", domain: "agentic", example_usage: "Use parallel execution for the three independent searches." },
  { word: "agent architecture", definition: "The high-level design: planner, executor, memory, tools.", level: "senior", domain: "agentic", example_usage: "Pick an agent architecture that matches the task's horizon and risk." },
  { word: "tool catalog", definition: "A curated, documented set of tools agents can choose from.", level: "senior", domain: "agentic", example_usage: "Keep the tool catalog small — too many tools confuses the model." },
  { word: "guardrails", definition: "Constraints that prevent an agent from taking harmful or unintended actions.", level: "senior", domain: "agentic", example_usage: "Guardrails reject destructive SQL before the agent ever runs it." },
  { word: "agent observability", definition: "Tracing, metrics, and replay for agent runs — what it did and why.", level: "senior", domain: "agentic", example_usage: "Without agent observability, post-incident reviews are guesses." },
  { word: "agent platform", definition: "Shared infrastructure: sandboxing, auth, memory, evals — reused across agent products.", level: "staff", domain: "agentic", example_usage: "Standing up an agent platform pays for itself once three teams build agents." },
  { word: "capability governance", definition: "Policies over which tools and data agents can access.", level: "staff", domain: "agentic", example_usage: "Capability governance is what lets Finance trust an agent with read access to ledger data." },
  { word: "autonomous operation", definition: "Running an agent without a human in the loop for each step.", level: "staff", domain: "agentic", example_usage: "We only trust autonomous operation after the eval suite clears 95%." },

  // ---------- PROMPT FORGE (20) ----------
  { word: "prompt", definition: "The full text input you send to a model to get a response.", level: "intern", domain: "prompt-forge", example_usage: "Keep the prompt short and lead with the goal." },
  { word: "context", definition: "Background info the model needs beyond the immediate instruction.", level: "intern", domain: "prompt-forge", example_usage: "Paste the file path and line numbers as context." },
  { word: "instruction", definition: "The explicit thing you're asking the model to do.", level: "intern", domain: "prompt-forge", example_usage: "Put the instruction at the top: 'Refactor this function to use async/await.'" },
  { word: "example", definition: "A sample input/output pair that shows the model what you want.", level: "intern", domain: "prompt-forge", example_usage: "Add one example of the desired output format before asking the real question." },
  { word: "few-shot", definition: "Giving the model a small number of examples before the real task.", level: "junior", domain: "prompt-forge", example_usage: "Few-shot with three examples was enough to fix the formatting issue." },
  { word: "zero-shot", definition: "Asking the model to do a task with no examples.", level: "junior", domain: "prompt-forge", example_usage: "Zero-shot works fine for summarization but not for weird schema extraction." },
  { word: "system prompt", definition: "A message that sets the model's persona and global rules for the conversation.", level: "junior", domain: "prompt-forge", example_usage: "The system prompt tells the model it's a senior code reviewer, not a teacher." },
  { word: "chain of thought", definition: "Prompting the model to reason step by step before answering.", level: "junior", domain: "prompt-forge", example_usage: "Ask for chain of thought on math word problems to cut the error rate." },
  { word: "role prompt", definition: "Framing the model as a specific expert so it adopts that voice.", level: "junior", domain: "prompt-forge", example_usage: "A role prompt of 'staff SRE with 10 years on Kubernetes' shaped the answer." },
  { word: "prompt template", definition: "A reusable prompt with placeholders filled in per request.", level: "mid", domain: "prompt-forge", example_usage: "Every support reply goes through the same prompt template." },
  { word: "constraint", definition: "A rule the output must follow — length, format, forbidden content.", level: "mid", domain: "prompt-forge", example_usage: "Add a constraint: 'Respond in under 100 words, no markdown.'" },
  { word: "output format", definition: "The shape the model's response must take (JSON, table, markdown).", level: "mid", domain: "prompt-forge", example_usage: "Specify JSON as the output format and provide a schema example." },
  { word: "meta prompt", definition: "A prompt that generates or improves other prompts.", level: "mid", domain: "prompt-forge", example_usage: "Use a meta prompt to rewrite the user's vague request into a precise one." },
  { word: "prompt engineering", definition: "The craft of designing prompts that reliably produce good outputs.", level: "senior", domain: "prompt-forge", example_usage: "Prompt engineering is 80% writing crisp instructions, 20% clever tricks." },
  { word: "ReAct pattern", definition: "Interleaving reasoning traces with tool-use actions.", level: "senior", domain: "prompt-forge", example_usage: "The ReAct pattern lets the agent think, act, observe, and repeat." },
  { word: "self-critique", definition: "Asking the model to review and revise its own draft.", level: "senior", domain: "prompt-forge", example_usage: "Self-critique caught the off-by-one bug the first draft missed." },
  { word: "prompt compression", definition: "Shortening a prompt while preserving the information the model needs.", level: "senior", domain: "prompt-forge", example_usage: "Prompt compression cut our token bill by 40% with no quality drop." },
  { word: "prompt library", definition: "A shared, versioned collection of prompts used across a team.", level: "staff", domain: "prompt-forge", example_usage: "Move team-wide prompts into a prompt library so fixes propagate." },
  { word: "prompt evaluation", definition: "Measuring prompt quality against a test set of inputs and expected outputs.", level: "staff", domain: "prompt-forge", example_usage: "Prompt evaluation lets us change the prompt without regressing production." },
  { word: "prompt governance", definition: "Ownership, review, and rollback policy for prompts in production.", level: "staff", domain: "prompt-forge", example_usage: "Prompt governance means every production prompt has an owner and a changelog." },
];

export async function seedVocab(): Promise<void> {
  const db = getDb();
  const tx = await db.transaction("write");
  try {
    for (const v of VOCAB) {
      await tx.execute({
        sql: "INSERT OR IGNORE INTO vocab_entries (word, definition, level, domain, example_usage) VALUES (?, ?, ?, ?, ?)",
        args: [v.word, v.definition, v.level, v.domain, v.example_usage],
      });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
