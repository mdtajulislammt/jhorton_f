# TASK-014: Store → Owtlet Confirmation Webhook & Order Status Page

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-013`  
> **Roadmap Phase**: Phase 3 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a partner dispensary, I want to confirm an order back to Owtlet, so that the shopper sees it as confirmed. **Format gated by Q-002.**

---

## 2. Inputs & Context Documents
- API §10: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Security §3: [docs/10-security-plan.md](../../docs/10-security-plan.md)

---

## 3. Step-by-Step Execution Plan
1. `POST /api/webhooks/store-confirmation` with HMAC + timestamp verification, idempotency; optional signed-link GET variant.
2. Roll up parent status; Friday builds `/order/[id]` status page.

---

## 4. Expected Outputs
- `src/app/api/webhooks/store-confirmation/route.ts`, `src/server/orders/confirm.ts`, `src/app/(shop)/order/[id]/page.tsx`

---

## 5. Acceptance Criteria
- [ ] AC-CNF-01 / T-WH-01 green.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- webhook`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-015 শুরু করো। [Tier: LEVEL: STANDARD]
```
