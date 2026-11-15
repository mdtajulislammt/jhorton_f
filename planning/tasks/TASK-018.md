# TASK-018: Full Regression, E2E & Chaos Testing

> **Status**: `BACKLOG`  
> **Assignee**: `thanos` (QA & Verification Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-012`, `TASK-014`, `TASK-015`, `TASK-016`, `TASK-020`, `TASK-021`  
> **Roadmap Phase**: Phase 5 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As QA (`thanos` + `loki`), I want every acceptance criterion verified with real test evidence, so that the Dec 1 handover is safe.

---

## 2. Inputs & Context Documents
- Testing: [docs/11-testing-strategy.md](../../docs/11-testing-strategy.md)
- Acceptance: [docs/13-acceptance-criteria.md](../../docs/13-acceptance-criteria.md)

---

## 3. Step-by-Step Execution Plan
1. Run all unit/integration/E2E suites; execute the T-* critical cases (incl. T-HOLD/FUL/BRD/SEL/OOS/PRC/PRF/DLH); chaos/edge cases (expired cart mid-checkout, show ended mid-checkout, unknown Terrific ids, no coverage, store change to ineligible store, brand with no stock).

---

## 4. Expected Outputs
- `tests/e2e/*`, evidence in `planning/updateplanning.md`

---

## 5. Acceptance Criteria
- [ ] All AC-* rows pass with logged evidence.

---

## 6. Verification Evidence (Thanos)
- **Command**: `bash scripts/verify-task.sh TASK-018`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-019 শুরু করো। [Tier: LEVEL: STANDARD]
```
