# 🛡️ Avengers Protocol — Existing Project Adoption Guide

> **Version**: 2.2 (BMAD Spec-Driven, Stack-Agnostic & Adversarial Review Enhanced)  
> **Philosophy**: Integrate multi-agent AI orchestration into your ongoing project **without modifying or breaking any existing source files**. Fully automated project scanning, stack-agnostic auto-configuration, gap analysis, and disciplined execution with adversarial code review and minimum token burn.  
> **Bengali Guide (বাংলা গাইড)**: [HOW_TO_USE_IN_EXISTING_PROJECT_BN.md](HOW_TO_USE_IN_EXISTING_PROJECT_BN.md)

---

## 🧭 End-to-End Workflow Overview (4-Step Pipeline)

```text
┌─────────────────────────┐
│ 1. Inject Protocol Files│ ──► Run `npx tajul-avengers init` (or paste orchestration folders & skills.json)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 2. Run Command 1        │ ──► AI auto-detects tech stack (Stack-Agnostic), generates docs/architecture-spine.md
│    (Auto-Discovery)     │     and docs/EXISTING_PROJECT_SUMMARY.md baseline (One-time audit)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. Write Your Plan      │ ──► Outline your new feature or bugfix in planning/new-plan.md
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 4. Run Command 2        │ ──► AI runs Gap Analysis, check-readiness.sh audit [PASS],
│    (Planning & Exec)    │     executes tasks via Spine, runs 4-perspective review & Thanos verification
└─────────────────────────┘
```

---

## Step 1: Inject Protocol Files into Your Existing Project

Run the CLI directly inside your existing project root:

```bash
npx tajul-avengers init
```

*Or manually copy these 6 core folders/files into your project root:*
1. **`AGENTS.md`** (Global multi-agent rules, Fast-Path mode, & token policies)
2. **`project.config.md`** (Centralized stack configuration — AI auto-populates this)
3. **`skills.json`** (Open standard agent skills manifest)
4. **`planning/`** (Task tracking directory containing `new-plan.md` and `task.md`)
5. **`docs/`** (Contains `architecture-spine.md` and baseline specifications)
6. **`scripts/`** (Contains `check-readiness.sh`, `verify-task.sh`, `clean-run.sh`)

> 💡 **Safety Guarantee**: Your existing source code (`src/`, `client/`, `server/`, `prisma/`, etc.) remains 100% untouched. You do not need to manually configure paths.

---

## Step 2: Run Command 1 (Auto-Discovery & Architecture Spine Setup)

Open your AI coding assistant (Cursor, Windsurf, Claude Code, Antigravity) and paste:

```text
Iron Man, adapt our Avengers Protocol to this existing codebase:
1. Scan the full codebase to detect the frontend, backend, database ORM, package manager, and folder paths, then automatically update project.config.md (adapt to whatever stack is present).
2. Thoroughly analyze what features, database schemas, and APIs currently exist, and document them in docs/EXISTING_PROJECT_SUMMARY.md.
3. Extract core system invariants and create a high-density docs/architecture-spine.md.
4. Do not modify or refactor any existing source code. Only generate the documentation baselines and configurations.
```

### ⚡ What Happens Behind the Scenes?
1. **Auto-Configuration (`project.config.md`)**: The AI scans manifest files (`package.json`, `requirements.txt`, `go.mod`, etc.) and configures workspace folders automatically.
2. **System Baseline (`docs/EXISTING_PROJECT_SUMMARY.md`)**: All existing models, routes, controllers, and pages are indexed into a clean baseline document.
3. **Architecture Spine Established (`docs/architecture-spine.md`)**: Core API envelope rules, auth flow, and styling conventions are condensed into a single lean contract.
4. **80%+ Token Efficiency**: During subsequent tasks, the AI reads only the spine instead of re-reading your legacy code repeatedly.

---

## Step 3: Write Your Feature Request in `planning/new-plan.md`

Once Command 1 finishes, open:  
📄 **`planning/new-plan.md`**

Describe the new feature or change you want to make:

```markdown
# 📝 New Plan / Feature Request

## 1. Feature Title:
User Profile Avatar Upload with Cloudinary Integration.

## 2. Description & Requirements:
- Users can upload an avatar from their settings page.
- Create backend endpoint: POST /api/v1/users/avatar
- Store images in Cloudinary and save image URL in the User table (`avatarUrl`).
- Apply tactile UX (active compression, 44px touch target, skeleton loader).
- Ensure existing authentication and profile endpoints remain unbroken.

## 3. Acceptance Criteria:
- [ ] Avatar upload saves URL to database
- [ ] Frontend displays image preview with skeleton loading
- [ ] Verification tests pass via Thanos
```

---

## Step 4: Run Command 2 (Gap Analysis, Task Breakdown, Review & Execution)

In your AI chat, paste:

```text
Iron Man, perform gap analysis between docs/EXISTING_PROJECT_SUMMARY.md and planning/new-plan.md. 
Create planning/tasks/TASK-XXX.md files, verify check-readiness.sh passes, and execute tasks via docs/architecture-spine.md. 
Run multi-perspective-code-review and verify-task.sh before marking complete.
```

Submit this command to your AI assistant:

```text
Iron Man, analyze docs/EXISTING_PROJECT_SUMMARY.md and planning/new-plan.md:
1. Perform Gap Analysis (what already exists vs. what needs to be created) to prevent duplicate models/routes.
2. Deconstruct into isolated tasks in planning/tasks/TASK-XXX.md.
3. Verify readiness using bash scripts/check-readiness.sh.
4. Execute tasks using docs/architecture-spine.md and verify via scripts/verify-task.sh.
```

### 🚀 Execution Safeguards:
1. **Zero Conflict**: Iron Man checks legacy models and routes to ensure no breaking changes occur.
2. **Pre-Readiness Audit Gate**: Before modifying code, the agent runs `bash scripts/check-readiness.sh TASK-XXX` to ensure all file paths and acceptance criteria are valid.
3. **Spine-Focused Coding**: `friday` and `edith` implement code using `docs/architecture-spine.md` rather than loading bulky legacy files.
4. **Verification & Fresh Session Handoff**: `thanos` verifies implementation with `bash scripts/verify-task.sh TASK-XXX` and provides the next task prompt.

---

## ⚡ Fast-Path Mode for Small Fixes & Quick Tweaks

For minor bugs, CSS tweaks, or single-file edits (<= 20 lines) in existing projects, bypass heavy planning:

```text
Fast-Path Mode: Fix the following issue in <file_path>: <description>. Do NOT load docs or planning files. Edit target lines directly and verify.
```
* **Token Budget**: `< 1,000 tokens` per fix.

---

## 🛡️ Golden Rules for Existing Projects

1. **Manual Git Control**: Never let AI run `git commit` or `git push` automatically. Always inspect diffs first.
2. **Fresh Session Handoff**: Once a task is completed, close the chat and open a new chat window:
   ```text
   Read planning/updateplanning.md and start the next ready task. [Tier: LEVEL: STANDARD]
   ```
3. **Zero-Destructive Policy**: Never drop database tables or modify working legacy endpoints without explicit human approval.
