# Avengers Protocol — Claude Code System Rules (CLAUDE.md)

> **Architecture**: Hierarchical Multi-Agent Full-Stack System  
> **Chief Orchestrator**: `iron_man`  
> **Specialists**: `nick_fury` (Client PM), `jarvis` (UI/UX), `friday` (Web), `edith` (Backend), `thor` (Mobile), `thanos` (QA), `loki` (Chaos), `ultron` (DevOps)  

---

## 1. Universal Model & Token Budgeting Protocol

When operating in Claude Code, strictly adhere to **Capability-Based Profiling**:

1. **Check Complexity Tier**: Inspect `planning/tasks/TASK-XXX.md` for `Complexity Level`.
   - **`LEVEL: LIGHT`** (Verification scripts, status updates in `planning/`, minor text/CSS fixes):
     - **Context Choking**: Do NOT read `docs/` or deep directories. Load ONLY the assigned task file. Keep output minimal. Saves 95% tokens.
   - **`LEVEL: STANDARD`** (Next.js pages/components, standard NestJS CRUD APIs, DTOs, forms):
     - Read assigned task file and direct interface contract (`docs/08-api-contract.md`).
   - **`LEVEL: HEAVY`** (System architecture in `docs/`, relational DB schema in `edith`, auth/security logic, root-cause debugging):
     - Deep reasoning allowed. Load full architectural contracts.

---

## 2. Context Isolation & Execution Rules

- **Never load the entire repository or deep directory listings by default.**
- **Never read `package-lock.json`, `pnpm-lock.yaml`, `.git`, or build directories.**
- Read only the specific task file (e.g. `planning/tasks/TASK-005.md`) and direct contract files.
- Prefer targeted, surgical edits over rewriting entire files.
- Run tests cleanly via `bash scripts/clean-run.sh` to filter verbose logs.
- After completing a task, always output the Fresh Session Handoff command:
  ```markdown
  planning/updateplanning.md পড়ে [NEXT-TASK-ID] শুরু করো। [Tier: LEVEL_NAME]
  ```

---

## 3. Engineering & UX Mandates

- **No-Dead-Button Mandate**: Every button, link, and interactive element MUST have an active handler (`onClick`, router navigation, modal trigger, or form submission). Dead buttons are strictly prohibited.
- **6 Mandatory UI States**: Every screen, card, and table must handle:
  1. Default/Success
  2. Loading Skeleton
  3. Empty State
  4. Validation/Error
  5. Responsive
  6. Interactive/Focus
- **Zero Dummy Text Policy**: Consume `docs/domain-lexicon.md`. Strictly forbid "Lorem Ipsum", generic labels ("Item 1", "Card Title"), and dummy placeholders.
- **Verification Gate**: No task is marked DONE without running tests via `bash scripts/verify-task.sh [TASK-ID]` and inspecting actual test outputs.
- **Safety Gate**: NEVER execute `git commit` or `git push` automatically. Always leave version control commits and pushes strictly under manual human control.


- Theme-ready UI rule: no hardcoded colors/fonts in components; use only Tailwind/CSS tokens from tailwind.config.ts and globals.css, reuse src/components/ui, keep logic out of views. Full redesign comes later. See AGENTS.md "Theme-Ready UI Rule".
