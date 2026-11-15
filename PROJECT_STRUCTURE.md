# 🛡️ Avengers Protocol: Complete File & Folder Guide (A to Z)

> **Version**: 2.1  
> **Purpose**: Detailed reference guide explaining the role of every directory, configuration file, and operational script in the Avengers Protocol.

---

## 🗂️ 1. Root Level Files Overview

| File / Folder | Role & Purpose |
| :--- | :--- |
| **`README.md`** | **Single Source of Truth** for client requirements. Also contains the quick command cheat sheet. |
| **`AGENTS.md`** | Global governance rules, 5-layer hierarchy, BMAD architecture spine rules, and Fast-Path mode. |
| **`project.config.md`** | Central configuration for package manager, workspace folders, port mappings, and activated agents. |
| **`HOW_TO_USE_BN.md`** | বাংলা ভাষায় ধাপে ধাপে ব্যবহার নির্দেশিকা এবং কমান্ড সিকোয়েন্স। |
| **`HOW_TO_USE_EN.md`** | English Master Usage Guide, workflow pipelines, and prompt cheat sheets. |
| **`HOW_TO_USE_IN_EXISTING_PROJECT_BN.md`** | রানিং বা এক্সিস্টিং প্রজেক্টে কীভাবে কোনো কোড না ভেঙে ব্যবহার করবেন তার বাংলা গাইড। |
| **`HOW_TO_USE_IN_EXISTING_PROJECT_EN.md`** | English guide for existing project adoption and zero-conflict execution. |
| **`CLAUDE.md`** | Claude Code CLI specific routing rules and quick actions. |
| **`.cursorrules` / `.windsurfrules` / `.clinerules`** | Specific editor instruction hooks. |

---

## 📁 2. Core Directories

### 2.1 `docs/` (Architecture & Blueprints)
* **`docs/architecture-spine.md`**: ⭐ **Most Critical Token Saver.** The 1-page high-density invariants contract (API envelopes, auth, state management). Standard tasks read this instead of 14 files.
* **`docs/04-experience-spec.md`**: Tactile UX specification (44px touch targets, `active:scale-[0.98]`, 6 UI states).
* **`docs/domain-lexicon.md`**: Real industry vocabulary (strictly enforced to eliminate "Lorem Ipsum").
* **`docs/EXISTING_PROJECT_SUMMARY.md`**: Auto-generated baseline summary for existing codebases.
* **`docs/01-14`**: Comprehensive system design blueprints used for `LEVEL: HEAVY` architectural decisions.

### 2.2 `planning/` (Session State & Task Board)
* **`planning/task.md`**: The master task board tracking assigned agents, priority, and completion status.
* **`planning/tasks/`**: Individual, context-isolated task specs (`TASK-001.md`, `TASK-002.md`).
* **`planning/new-plan.md`**: Where you write new feature ideas for existing projects.
* **`planning/updateplanning.md`**: Active session handoff document containing test evidence.
* **`planning/open-questions.md`**: Client ambiguities tracked by Nick Fury.
* **`planning/decisions.md`**: Architecture Decision Records (ADR).

### 2.3 `scripts/` (Automated Developer Tools)
* **`scripts/check-readiness.sh`**: ⭐ **Pre-Implementation Gate.** Audits tasks for acceptance criteria, file targets, and spine contracts before code is edited.
* **`scripts/verify-task.sh`**: ⭐ **Post-Implementation Gate.** Automatically runs backend, frontend, and mobile verification.
* **`scripts/clean-run.sh`**: Suppresses verbose passing test logs to save input context tokens.
* **`scripts/sync-contracts.sh`**: Syncs NestJS DTO types with frontend Next.js TypeScript interfaces.
* **`scripts/run-local.sh`**: Starts local frontend (`:3000`) or backend (`:4000`) servers.
* **`scripts/dashboard.js`**: Visual terminal dashboard displaying project progress.
