# TASK-003: Apply Owtlet Brand Tokens & 6 UI States

> **Status**: `DONE`  
> **Assignee**: `jarvis` (UI/UX Specialist)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-001`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As the UI/UX specialist (`jarvis`), I want the owtlet.shop brand (Mint `#70F1C7`, Ink `#0D221E`, Sage `#BBD7D1`, Dela Gothic One + Red Rose) codified as tokens and primitives, so that every Owtlet screen looks on-brand and handles all 6 UI states.

---

## 2. Inputs & Context Documents
- Design system: [docs/04-design-system.md](../../docs/04-design-system.md)
- Experience spec: [docs/04-experience-spec.md](../../docs/04-experience-spec.md)
- Lexicon: [docs/domain-lexicon.md](../../docs/domain-lexicon.md)
- **Context Constraint**: LOAD ONLY this task file + 04 docs.

---

## 3. Step-by-Step Execution Plan
1. Write CSS variables (light + `.dark` live surfaces) into `src/app/globals.css` and map them in `tailwind.config.ts` (`primary`, `secondary`, `accent`, `ink`, `ring`).
2. Load Dela Gothic One + Red Rose via `next/font/google` in the root layout (`--font-heading`, `--font-body`).
3. Style primitives in `src/components/ui/` (Button pill variants Mint→Volt hover, Badge incl. LIVE Ember badge, Card, Input, Dialog, Skeleton) and add `EmptyState`.
4. Document 6 UI-state patterns in `development/frontend/DESIGN_GUIDELINES.md` with Owtlet copy examples.

---

## 4. Expected Outputs
- `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/*`, `src/components/ui/empty-state.tsx`, `DESIGN_GUIDELINES.md`

---

## 5. Acceptance Criteria
- [x] Tokens match the hex values in `docs/04-design-system.md`.
- [x] Mint backgrounds always use Ink text; WCAG 2.2 AA 4.5:1 verified for text pairs (~11.88:1 contrast).
- [x] All 6 UI states documented with code patterns.
- [x] `focus-visible:ring-2` on every interactive primitive.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npm test`
- **Status**: `PASSED`
- **Output Log**:
```
 ✓ src/__tests__/http.test.ts (2)
 ✓ src/__tests__/components/ui.test.tsx (16)
 Test Files  2 passed (2)
      Tests  18 passed (18)
```
- **Thanos Gate**: `bash scripts/verify-task.sh TASK-003` -> `✅ VERIFICATION PASSED: Task TASK-003 meets all criteria.`

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-004 শুরু করো। [Tier: LEVEL: HEAVY]
```
