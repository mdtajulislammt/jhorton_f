# TASK-013: Cannabis Checkout Handoff Providers (Leafly / Retailer Page)

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `HEAVY`  
> **Token Budget**: High (~4,000 - 6,000 tokens)  
> **Model Advice**: Use High-Reasoning / CoT Model (e.g. Sonnet / Pro / R1 / GPT-4o / o1)  
> **Dependencies**: `TASK-011`  
> **Roadmap Phase**: Phase 3 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As Owtlet, I want each cannabis sub-order handed off to Leafly or the retailer's own order page, so that payment and ID checks happen with the licensed dispensary and never on Owtlet. **Gated by Q-001, Q-002.**

---

## 2. Inputs & Context Documents
- API §9: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- ADR-005: [planning/decisions.md](../decisions.md)
- Q-001/Q-002: [planning/open-questions.md](../open-questions.md)

---

## 3. Step-by-Step Execution Plan
1. `HandoffProvider` interface `buildUrl(subOrder)`; `RetailerPageProvider` using `Dispensary.handoffUrlTemplate`; `LeaflyProvider` stub until client confirms Leafly access/format (do not invent an API).
2. `POST /api/checkout/handoff` → URLs + status HANDED_OFF; Friday: HandoffButton per sub-order with compliance copy.

---

## 4. Expected Outputs
- `src/server/checkout-handoff/*`, `src/app/api/checkout/handoff/route.ts`, `src/components/modules/checkout/HandoffButton.tsx`

---

## 5. Acceptance Criteria
- [ ] AC-HND-01 / T-HND-01 green; no payment/ID fields anywhere.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- handoff`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-014 শুরু করো। [Tier: LEVEL: STANDARD]
```
