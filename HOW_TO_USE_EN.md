# 🛡️ Avengers Protocol: Complete Workflow & Command Pipeline

> **Version**: 2.2 (BMAD Spec-Driven, Stack-Agnostic & Adversarial Review Enhanced)  
> **Core Objective**: Deliver enterprise software using lean spec-driven execution, minimal token burn, stack-agnostic adaptability, and multi-perspective adversarial code review.  
> **Quick Links**: [Bengali Guide (বাংলা নির্দেশিকা)](HOW_TO_USE_BN.md) | [Existing Project Guide](HOW_TO_USE_IN_EXISTING_PROJECT_BN.md) | [Project Structure](PROJECT_STRUCTURE.md) | [Skills Manifest](skills.json)

---

## ⚡ Master Execution Flowchart & Command Cheat Sheet

```text
 1. Requirements/Ideas     2. Blueprinting              3. Readiness & Code         4. Adversarial Review & Verify
┌───────────────────────┐  ┌──────────────────┐        ┌──────────────────┐       ┌──────────────────────────────┐
│ Fill README.md or run │─►│ Generate Spine   │ ────►  │ check-readiness  │ ────► │ Multi-Perspective Review     │
│ SCAMPER Brainstorming │  │ & Task Breakdown │        │ [PASS] + Code    │       │ + verify-task.sh [DONE]      │
└───────────────────────┘  └──────────────────┘        └──────────────────┘       └──────────────────────────────┘
```

---

## 🧭 Use Case 1: Starting a Brand New Project (Greenfield Pipeline)

Follow these exact 5 steps in order:

### Step 1: Provide Requirements or Run Brainstorming
- Open [README.md](README.md) and fill out the Client Brief, Objectives, and Functional Requirements (`REQ-F-001`, `REQ-F-002`, etc.).
- *(Optional - for vague ideas)*: In your AI chat, paste:
  ```text
  Nick Fury, run the requirement-brainstorming skill to perform SCAMPER and Reverse Brainstorming on our idea before architecture.
  ```

### Step 2: Confirm Tech Stack & Run Blueprinting Command
Check [project.config.md](project.config.md) for your chosen tech stack (Avengers is **100% stack-agnostic**; change frameworks/languages freely).  
In your AI Chat (Cursor, Windsurf, Claude Code, Antigravity), paste:
```text
Iron Man, read README.md and generate docs/architecture-spine.md, planning/task.md, and individual task files in planning/tasks/. Keep architecture concise and token-efficient.
```
* **What happens**: `nick_fury` clarifies ambiguities, `iron_man` generates the high-density [docs/architecture-spine.md](docs/architecture-spine.md) and breaks work into tasks (`TASK-001`, `TASK-002`).

### Step 3: Run Implementation Command (Lean Spec-Driven Guardrails)
Paste this in your chat:
```text
Execute planning/tasks/TASK-001.md. Verify pre-implementation readiness first, apply docs/architecture-spine.md, and implement code.
```
* **What happens**: The agent verifies readiness (`bash scripts/check-readiness.sh TASK-001`), applies tactile UX tokens, writes strict type-safe code, and enforces the zero-dead-button policy.

### Step 4: Multi-Perspective Adversarial Review & Test Verification
Before marking the task complete, the code is audited through the 4 perspectives:
- **Blind Hunter (`loki`)**: Unhandled edge cases and null/async safety.
- **Contract Auditor (`thanos`)**: DTO and schema type adherence.
- **Architecture Guard (`ultron`)**: Boundary compliance and security checks.
- **Tactile UX Auditor (`jarvis`)**: 6 UI states and tactile feedback.

Then Thanos executes automated verification:
```bash
bash scripts/verify-task.sh TASK-001
```

### Step 5: Fresh Session Handoff (Token Saver)
Once `TASK-001` is marked `DONE`, **close the current chat session and open a fresh new chat**. Paste:
```text
Read planning/updateplanning.md and start TASK-002. [Tier: LEVEL: STANDARD]
```
*(Prevents context compounding and saves 95% input tokens across long projects).*

---

## ⚡ Use Case 2: Trivial Fixes & Quick Edits (Fast-Path Mode)

* **When to use**: Bug fixes, typo corrections, single-file color/CSS adjustments (<= 20 lines).
* **Command to give**:
  ```text
  Fast-Path Mode: Fix the following issue in <file_path>: <description>. Do NOT load any docs or planning files. Edit target lines directly.
  ```
* ⚡ **Token Usage**: Under 1,000 tokens!

---

## 🔄 Use Case 3: Adopting into an Existing Live Project

Follow these 4 commands:

| Sequence | What to do | Prompt to Paste into AI Chat |
| :---: | :--- | :--- |
| **Command 1** | Auto-Discovery & Spine Setup | `Iron Man, scan this codebase to update project.config.md, generate docs/EXISTING_PROJECT_SUMMARY.md, and produce docs/architecture-spine.md. Do not alter existing code.` |
| **Manual Step** | Define New Feature | Open `planning/new-plan.md` and write what you want to add or change. |
| **Command 2** | Gap Analysis & Tasks | `Iron Man, perform gap analysis between docs/EXISTING_PROJECT_SUMMARY.md and planning/new-plan.md. Create planning/tasks/TASK-XXX.md files and run check-readiness.sh.` |
| **Command 3** | Implementation | `Read planning/updateplanning.md and execute the next ready task.` |

---

## 🧰 Terminal Command & Skills Reference

```bash
# 1. Pre-Implementation Readiness Gate (Run before writing code)
bash scripts/check-readiness.sh TASK-001

# 2. Tri-Platform Post-Implementation Verification (Edith + Friday + Thor)
bash scripts/verify-task.sh TASK-001

# 3. Clean Log Runner (Filters verbose output to save context tokens)
bash scripts/clean-run.sh pnpm test

# 4. Synchronize API TypeScript contracts between Backend & Frontend
bash scripts/sync-contracts.sh

# 5. Local Dev Servers
bash scripts/run-local.sh frontend   # http://localhost:3000
bash scripts/run-local.sh backend    # http://localhost:4000

# 6. Visual Task Dashboard
node scripts/dashboard.js
```

### 🧩 Registered Agent Skills (Open Standards)
- `skills.json`: Open agent skills manifest compatible with Claude Code, Cursor, and Codex.
- `requirement-brainstorming`: SCAMPER framework & reverse failure brainstorming.
- `multi-perspective-code-review`: Adversarial code review (Blind Hunter, Contract Auditor, Architecture Guard).
- `agile-retrospective`: Continuous milestone retrospective & Git self-learning audit.
