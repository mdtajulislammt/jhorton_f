---
name: multi-perspective-code-review
description: Multi-perspective adversarial code review covering Blind Hunter, Contract Auditor, Architecture Compliance, and Security/Tactile UX verification before task acceptance.
---

# 🔍 Multi-Perspective Adversarial Code Review (`multi-perspective-code-review`)

> **Primary Reviewers**: `thanos` (QA & Contract Auditor), `loki` (Blind Hunter & Edge-Case Specialist), `ultron` (Security & Infra Auditor), `jarvis` (UX/UI Tactile Auditor)  
> **Trigger**: When a task's implementation is complete, *prior* to marking the task `DONE` or committing code.

---

## 1. Purpose & Core Methodology

Standard unit tests verify that code does what the author intended. **Multi-Perspective Adversarial Code Review** verifies what the author *forgot to consider*. 

Every completed task must pass through 4 specialized review perspectives before acceptance:

```
Task Code 
  ├── [1. Blind Hunter] ────────► Catches edge cases without seeing requirements
  ├── [2. Contract Auditor] ────► Validates DTOs, schemas, and API contracts
  ├── [3. Architecture Guard] ──► Enforces layer boundaries & token efficiency
  └── [4. Tactile & UX Auditor] ─► Checks 6 UI states, zero-dummy text & dead buttons
```

---

## 2. The 4 Review Perspectives

### Perspective 1: Blind Hunter (`loki`)
- **Premise**: Review code *purely as a raw code audit* without reading the user's optimistic story.
- **Checklist**:
  - [ ] Are null/undefined pointers possible on nested object access?
  - [ ] Does any loop or array operation lack boundary protection (e.g. `arr[0]` on empty array)?
  - [ ] Are async operations wrapped in `try/catch` with deterministic error fallback?
  - [ ] What happens on HTTP 500, 401, or offline state?
  - [ ] Can concurrent requests cause race conditions or duplicate writes?

### Perspective 2: Contract & Data Auditor (`thanos`)
- **Premise**: Verify that actual inputs/outputs match `docs/08-api-contract.md` and database schemas.
- **Checklist**:
  - [ ] Does the payload match the Swagger/DTO specification?
  - [ ] Are parameter types strictly typed (no `any` types)?
  - [ ] Are validation decorators (`class-validator`, `zod`) present on *every* input?
  - [ ] Is pagination enforced on list queries (never unbounded `SELECT *`)?

### Perspective 3: Architecture & Security Guard (`ultron` & `iron_man`)
- **Premise**: Verify system boundaries, credentials safety, and stack conformity.
- **Checklist**:
  - [ ] Did frontend code import server-only modules or secrets?
  - [ ] Did backend controllers contain business logic instead of delegating to services?
  - [ ] Are SQL injection, XSS, or mass-assignment vulnerabilities prevented?
  - [ ] Are database transactions used where multi-table mutations occur?

### Perspective 4: Tactile UX & Component Auditor (`jarvis`)
- **Premise**: Verify visual and tactile compliance with Avengers Protocol Standards.
- **Checklist**:
  - [ ] Are all **6 UI States** implemented (Default, Loading Skeleton, Empty State, Error, Responsive, Focus/Hover)?
  - [ ] **No-Dead-Button Mandate**: Does every clickable element trigger a functional action?
  - [ ] **Zero Dummy Text**: Are actual domain terms used from `docs/domain-lexicon.md` (no "Lorem ipsum")?
  - [ ] Touch targets are at least 44x44px with active tactile compression (`active:scale-[0.98]`).

---

## 3. Review Verdict & Output Format

Whenever code is submitted for verification, the review summary must be output in this format:

```markdown
### 🛡️ Multi-Perspective Adversarial Review: [TASK-ID]
- **Target Files**: [List reviewed files]
- **Auditors**: `loki`, `thanos`, `ultron`, `jarvis`

| Perspective | Auditor | Status | Critical Findings / Remediation |
|---|---|---|---|
| Blind Hunter | `loki` | PASS / FLAG | [Concise issue or "No unhandled edge cases"] |
| Contract Auditor | `thanos` | PASS / FLAG | [Contract conformity status] |
| Architecture Guard | `ultron` | PASS / FLAG | [Layer boundary & security check] |
| Tactile UX Auditor | `jarvis` | PASS / FLAG / N/A | [6 UI States & interactive buttons] |

**Final Verdict**: APPROVED / REWORK_REQUIRED
*(If REWORK_REQUIRED, implementation agent must resolve before Thanos acceptance)*
```

