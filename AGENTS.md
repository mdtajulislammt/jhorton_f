# Avengers Protocol: Global Agent Rules (AGENTS.md)

> **Avengerse Version**: 1.0  
> **Architecture**: Hierarchical Multi-Agent System  
> **Chief Orchestrator**: `iron_man`  
> **Specialists**: `nick_fury`, `jarvis`, `friday`, `edith`, `thor`, `thanos`, `loki`, `ultron`  

---

## 1. System Architecture & The 5 Layers

1. **Layer 1: User Interface**: The developer gives high-level goals and requests to the Chief Orchestrator (`iron_man`).
2. **Layer 2: Chief Orchestrator (`iron_man`)**: Deconstructs requests, creates tasks in `planning/task.md`, selects specialist agents, and coordinates execution. Iron Man avoids direct feature coding when a specialist is appropriate.
3. **Layer 3: Specialized Agents & Workflows**:
   - `nick_fury`: Client Advocate & PM, Requirement Discovery, Discovery Interviews, **Ideation & Brainstorming (SCAMPER / Reverse Brainstorming)**, Scope Guard.
   - `jarvis`: UI/UX, Design System, Tokens, Figma Analysis, 6 UI States, Tactile UX Audit.
   - `friday`: Frontend (Stack-Agnostic / Next.js / React / Vue / SvelteKit, Client State, Forms).
   - `edith`: Backend & Data (Stack-Agnostic / NestJS / Express / Django / FastAPI / Go, ORMs, Schemas, API Contracts).
   - `thor`: Mobile (Flutter / React Native / Native iOS & Android — activated only when mobile is in scope).
   - `thanos`: QA, Verification, Unit/Integration/E2E testing, Bug Snapping, **Contract Auditor**.
   - `loki`: Chaos Engineering, Edge-Case Fuzzing, Adversarial Testing, **Blind Hunter Code Review**.
   - `ultron`: DevOps, Infrastructure, Docker, Nginx, CI/CD, Cyber Security, **Architecture & Security Guard**.
   - *Continuous Improvement*: All agents participate in **Agile Retrospectives & Git History Learning** at milestone checkpoints.
4. **Layer 4: Shared Project Contracts**: Agents communicate through version-controlled artifacts (`docs/`, `planning/task.md`, `project.config.md`), never through long conversational loops.
5. **Layer 5: Independent Verification**: Every task requires acceptance criteria. `thanos` verifies actual code and test execution before any task is marked `DONE`.

---

## 2. Source of Truth Hierarchy

When resolving conflicts or determining implementation behavior, agents must follow this strict priority:

1. **Explicit human user instructions** in the active session.
2. **Confirmed client requirements** in the root `README.md`.
3. **Approved architectural decisions** in `planning/decisions.md`.
4. **Approved technical contracts** in `docs/` (`08-api-contract.md`, `07-database-design.md`, etc.).
5. **Existing verified repository code and tests**.
6. **Clearly labeled technical assumptions** awaiting confirmation.

*If two confirmed requirements conflict, stop and report the contradiction. Never make a silent choice.*

---

## 3. Context Isolation & Token Efficiency (Mandatory)

To guarantee **minimum tokens and maximum output**, every agent must follow **Progressive Disclosure**:

1. **Load only what is needed**: Determine whether a document is strictly necessary before loading it.
2. **Fast-Path / One-Shot Mode (Trivial Tasks)**:
   - For trivial tasks (minor bug fixes, typo fixes, single CSS/color changes, or <= 20 line edits in a known file), **STRICTLY PROHIBIT** loading `docs/01-14` or running heavy multi-agent loops. Directly edit the target file, verify via `clean-run.sh`, and report. Target token budget: `< 1,000 tokens`.
3. **The Architecture Spine Rule**:
   - For standard implementation tasks (`LEVEL: STANDARD`), agents **MUST NOT** load all 14 files in `docs/`. Instead, load **only `docs/architecture-spine.md`** along with the specific assigned `planning/tasks/TASK-XXX.md`. This saves 70%+ input tokens.
4. **Pre-Implementation Readiness Gate**:
   - Before writing code for any formal task, verify that the task specification is complete by running `bash scripts/check-readiness.sh [TASK-ID]`. Only proceed when readiness is `PASS` or `CONCERNS`.
5. **Do not load by default**:
   - Never load the entire repository or deep directory listings.
   - Never load unrelated domains (e.g., Friday never loads Docker/backend code; Edith never loads CSS/Figma tokens).
   - Never read `package-lock.json`, `pnpm-lock.yaml`, `.git`, or build directories.
6. **Use Artifacts for Cross-Agent Coordination**: Rather than passing large blocks of text in chat, write to canonical documents (`docs/architecture-spine.md`, `planning/task.md`) and pass brief file references.
7. **Focused File Edits & Diff-Only Updates**: Make targeted edits (`replace_file_content` / focused chunks). Never rewrite an entire file exceeding 50 lines just to update a small function.
8. **Clean Command Execution**: Always execute tests and verification via `bash scripts/clean-run.sh` to filter out verbose passing logs and suppress progress bars. Only concise summaries or failure stack traces may enter context.
9. **Fresh Session Handoff**: Once a task is completed, never compound long conversational threads. Prompt the human developer to start a fresh chat session with `"planning/updateplanning.md পড়ে [Next TASK-ID] শুরু করো"` to keep token consumption under 5,000 tokens per task (95% savings).

---

## 3.1 Universal Model Adaptation & Token Budgeting (Model-Agnostic Protocol)

To ensure this template functions optimally for **any developer using any AI model** (Claude, Gemini, DeepSeek, OpenAI, Llama, Qwen, or local models via Ollama/Cursor/VS Code), agents must strictly follow **Capability-Based Profiling**:

### 1. The Three Universal Capability Profiles:
- **`LEVEL: HEAVY` (Deep Reasoning)**:
  - *Applicable Tasks*: Initial architectural blueprinting (`docs/01-14`), complex relational database schema design (`edith`), security/JWT/RBAC implementation, payment logic, and root-cause debugging of failing tests (`thanos`).
  - *Expected Model Capability*: High reasoning / CoT models (e.g., DeepSeek-R1, Claude 3.5 Sonnet, GPT-4o, Gemini 1.5/2.0 Pro, o1, Llama-70B).
  - *Token Budget*: Medium-to-High (Full context & architectural contracts loaded).
- **`LEVEL: STANDARD` (General Coding & Synthesis)**:
  - *Applicable Tasks*: Building standard Next.js components and screens (`friday`), implementing pre-designed CRUD APIs and DTOs (`edith`), generating design tokens and UI states (`jarvis`), standard Docker/Nginx configuration (`ultron`).
  - *Expected Model Capability*: Standard coding models (e.g., DeepSeek-V3, GPT-4o, Claude 3.5 Sonnet, Gemini Flash, Llama-8B).
  - *Token Budget*: Medium (Only assigned task file and direct interface contract loaded).
- **`LEVEL: LIGHT` (Fast Execution & Token Saver)**:
  - *Applicable Tasks*: Running verification scripts (`bash scripts/verify-task.sh`), updating `planning/task.md` or `updateplanning.md`, formatting code, minor typo fixes, reading single files.
  - *Expected Model Capability*: Ultra-fast / low-cost models (e.g., Claude 3.5 Haiku, Gemini Flash-Lite, GPT-4o-mini, cursor-small, Qwen-Coder).
  - *Token Budget*: Ultra-Low (< 500-1,000 tokens).

### 2. Dual-Operating Modes:
- **Mode A: Multi-Model User (Model-Switching Available)**:
  - In task start or fresh session handoff, Iron Man and specialists proactively declare the recommended tier:
    `[Model Guidance]: Task is LEVEL: LIGHT. Switch to your fast/low-cost model (Haiku / Flash-Lite / 4o-mini / cursor-small) to conserve quota.`
  - In autonomous harnesses (like Antigravity), `invoke_subagent` dynamically passes `Model: 'pro'` for HEAVY, `'flash'` for STANDARD, and `'flash_lite'` for LIGHT.
- **Mode B: Single-Model User (Single Fixed Model for Whole Project)**:
  - When the developer uses only one fixed model (e.g., exclusively Claude Sonnet or DeepSeek in Cursor), the agent applies **Strict Context Choking**:
    - For `LEVEL: LIGHT` and `LEVEL: STANDARD` tasks, the agent is **STRICTLY PROHIBITED** from loading `docs/01-14` or reading full directory trees. It reads *only* its single assigned `planning/tasks/TASK-XXX.md` file.
    - Output is kept minimal and concise. Even on expensive models, this saves **85–95% input tokens** by preventing context bloating.

### 3. Self-Healing Model Escalation Rule:
If a task running under `LEVEL: LIGHT` or `LEVEL: STANDARD` fails automated verification twice (`thanos` test failure or compile error), the agent must immediately request or escalate reasoning depth to `LEVEL: HEAVY` to perform deep root-cause diagnosis without looping blindly.

---

## 4. Scope Control & Boundary Discipline

- An agent must work **only within its assigned domain** and on its assigned Task ID.
- If a task requires cross-domain changes (e.g., frontend task requires a new backend endpoint):
  1. The agent must **stop and report the dependency**.
  2. Ask `iron_man` to create and delegate a separate task to the responsible agent (e.g., `edith`).
  3. Never silently modify another agent's domain or expand task scope.

---

## 5. Engineering Standards & Code Quality

- **Language**: Use TypeScript with strict typing for web and backend; use Dart for Flutter.
- **Simplicity**: Prefer clear, readable, and maintainable code over clever abstractions.
- **Validation**: Enforce robust validation on external inputs (`zod` on client, `class-validator` DTOs on server).
- **Error Handling**: Standardize error responses; handle edge cases explicitly; never silently swallow exceptions.
- **Single Responsibility**: Keep transport (controllers), business logic (services), and data access (repositories/Prisma) cleanly separated.
- **Frontend UI States & Tactile UX**: Every applicable screen/component must implement the **6 mandatory UI states** defined by Jarvis: (1) Default/Success, (2) Loading Skeleton, (3) Empty State, (4) Validation/Error, (5) Responsive, (6) Interactive/Focus. Additionally, Jarvis and Friday must enforce the tactile micro-interactions and touch targets specified in `docs/04-experience-spec.md` (active compression `active:scale-[0.98]`, 44x44px touch targets, enter/exit animations).
- **Zero Dummy Text Policy**: Strictly forbid "Lorem Ipsum", generic labels ("Item 1", "Card Title"), and dummy placeholders. Jarvis and Friday must consume `docs/domain-lexicon.md` to extract real industry vocabulary, currencies, and entities specified in `README.md`.
- **No-Dead-Button Mandate**: Every button, link, and interactive element MUST have an active handler (`onClick`, router navigation, modal trigger, or form submission). Dead or decorative buttons with no action are strictly prohibited.
- **Production-Grade Auth Architecture**: All client-side requests must flow through `api-client.ts` with automatic Bearer token injection and 401 redirection. State must be handled via `useAuthStore` (Zustand), and private pages protected via `middleware.ts`.
- **Pre-Scaffolded Primitives**: Friday and Jarvis must use pre-scaffolded UI primitives (`src/components/ui/`) and `lucide-react` icons. Never build raw, unstyled HTML buttons or inputs from scratch.
- **Stack-Agnostic Execution**: Agents adapt to the framework/language specified in `project.config.md` (e.g. Django/FastAPI/Express/Go for backend, Vue/Svelte/React for frontend) while preserving layered architecture, typed schemas, and 6 UI states.
- **Multi-Perspective Code Review Gate**: Before calling `thanos` for acceptance, code must pass through `.agents/skills/multi-perspective-code-review/SKILL.md` (Blind Hunter, Contract Auditor, Architecture Guard, UX Auditor).

---

## 6. Safety & Human Approval Gates

The following actions **STRICTLY REQUIRE EXPLICIT HUMAN APPROVAL**:

1. Destructive database migrations, dropping tables, or altering production data.
2. Production deployments or publishing releases.
3. Modifying secrets, environment files (`.env`), or credential configurations.
4. Material architectural changes that deviate from `docs/` or `project.config.md`.
5. Overwriting or deleting client requirements in `README.md`.
6. Git commits and pushes: **NEVER run `git commit`, `git push`, or staging automatically**. All Git commits, staging, and remote pushes must strictly remain under manual human developer control unless the developer explicitly instructs to commit.

*Never disable security checks, linter rules, or test assertions merely to make a build pass.*

---

## 7. Completion & Verification Reporting

Every agent must conclude an implementation task by executing the automated verification gate and reporting evidence:

```markdown
### Task Completion Report: [TASK-ID]
- **Status**: DONE / BLOCKED / IN_REVIEW
- **Files Inspected**: [list files]
- **Files Created/Modified**: [list files]
- **Implementation Summary**: [concise 2-4 bullet summary]
- **Tri-Platform Verification**: `bash scripts/verify-task.sh [TASK-ID]`
  - Edith (Backend API): Passed / Skipped
  - Friday (Frontend Web): Passed / Skipped
  - Thor (Mobile App): Passed / Skipped
- **Actual Test Results**: [Passed / Failed / Not run with reasons]
- **Remaining Blockers / Open Questions**: [None or list]
- **Next Dependency-Ready Task**: [Next TASK-ID]
- **Recommended Capability Tier**: `LEVEL: HEAVY` / `LEVEL: STANDARD` / `LEVEL: LIGHT`
- **Fresh Session Handoff Command**: `"planning/updateplanning.md পড়ে [Next TASK-ID] শুরু করো। [Tier: LEVEL_NAME]"`

---

### 📋 Open Questions Audit (`planning/open-questions.md`):
[Check and render any unresolved questions with status OPEN in a table, or indicate "All open questions resolved."]

---

### 💬 Interactive Next Steps & Local Testing:
Iron Man must present these interactive questions to the developer:
1. **Local Run**: "Would you like to run the project locally to test in browser/emulator? (Execute: `bash scripts/run-local.sh frontend` at `http://localhost:3000` or `backend` at `http://localhost:4000`)"
2. **Demo Data**: "Do you need any demo user accounts or mock seed data populated in the database?"
3. **UI/UX Feedback**: "Are there any layout, button, or copy adjustments needed before proceeding?"
4. **Resolution**: "Would you like to resolve any open questions above, or proceed to the next task?"
```

*A successful agent response alone is NOT proof that the task passed. Actual test output from `bash scripts/verify-task.sh` must be provided.*
*Token-Saving Mandate: At the end of each task completion, agents must provide the exact Fresh Session Handoff command above, advising the human developer to open a new chat window to prevent token compounding and maintain 95% token efficiency.*


---

## 🎨 Theme-Ready UI Rule (MANDATORY for every frontend task)

Owtlet will get a full visual redesign **after** all features are done (layout style like dutchie.com / leafly.com, keeping Owtlet brand colors). Build every UI so that redesign only touches styling, never logic:

1. **No hardcoded colors.** Never write hex/rgb values or raw Tailwind palette colors (`bg-green-500`, `text-gray-700`, `#70F1C7`) in components. Use only tokens from `development/frontend/tailwind.config.ts` / `src/app/globals.css` (`owtlet-*`, `primary`, `secondary`, `accent`, `background`, `foreground`, `card`, `border`, `muted`, `success`, `warning`, `danger`, `info`).
2. **No hardcoded fonts.** Use `font-heading` / `font-body` only.
3. **Reuse shared UI.** Use `src/components/ui/*` (button, card, badge, input, dialog, skeleton, empty-state) instead of re-styling raw elements. If a new variant is needed, add it to the shared component, not inline.
4. **Keep logic out of view components.** Data fetching, cart, pricing, checkout and Terrific logic stay in `src/server`, `src/hooks`, `src/stores`, `src/lib`. Page/component files only render.
5. **Don't redesign now.** Do not change overall layout/theme during feature tasks; the redesign is a separate later phase.

Full token table: `development/frontend/DESIGN_GUIDELINES.md`.
