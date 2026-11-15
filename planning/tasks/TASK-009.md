# TASK-009: Shopify Storefront Accessories Bridge (out of scope — accessories handled by separate Shopify project)

> **Status**: `CANCELLED`  
> **Cancelled**: 2026-11-15 — the custom Owtlet platform is cannabis-only and live shows feature only cannabis products. Accessories are owned by the separate `owtlet.shop` Shopify project (another team member). No Storefront token, no Shopify cart bridge, no `AccessoryRef`. See ADR-008 in [planning/decisions.md](../decisions.md). Do **not** implement; the original spec below is kept for history only.  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-007`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a shopper buying accessories (glassware, grinders, papers), I want them added to the owtlet.shop Shopify cart and to check out on Shopify, so that accessory payments (Authorize.net, Apple/Google Pay) work while cannabis stays separate.

---

## 2. Inputs & Context Documents
- API §5: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Q-005: [planning/open-questions.md](../open-questions.md) (Storefront token)

---

## 3. Step-by-Step Execution Plan
1. `src/server/shopify-bridge`: Storefront GraphQL client (`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cart` query) using `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN`.
2. Persist `Cart.shopifyCartId`; map products through `AccessoryRef`.
3. Route Handlers `GET /api/shopify/cart`, `POST|PATCH|DELETE /api/shopify/cart/lines`; 502 `UPSTREAM_ERROR` on failure.
4. Friday: AccessoriesSection in cart + "Checkout Accessories" → `checkoutUrl` (guest checkout).

---

## 4. Expected Outputs
- `src/server/shopify-bridge/*`, `src/app/api/shopify/**`, `src/components/modules/cart/AccessoriesSection.tsx`

---

## 5. Acceptance Criteria
- [ ] AC-ACC-01 passes (mocked in CI, real on staging once token provided).
- [ ] No cannabis product can be sent to Shopify (guard + test).
- [ ] T-SHP-01 green.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- shopify`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-010 শুরু করো। [Tier: LEVEL: STANDARD]
```
