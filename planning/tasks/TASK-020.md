# TASK-020: Brand Storefronts (Channels) + Brand-Restricted Checkout

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect) — with `friday` for the storefront pages  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 - 4,000 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-006`, `TASK-011`  
> **Roadmap Phase**: Phase 3 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a shopper, I want to shop a brand's own storefront on owtlet.com and have those items fulfilled only by the partner dispensaries the brand chose, so that brand channels work like the client described (REQ-F-011, ADR-009).

Client (Nov 9): *"Checkout on a brand storefront works the same as the main cart, but only shows that brand's chosen stores. The admin needs a way to assign partner dispensaries to each brand."*

---

## 2. Inputs & Context Documents
- README REQ-F-011 (field-by-field)
- API §12 + §11 admin brands: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Schema `Brand`, `BrandDispensary`, `CartItem.channelBrandId`: [docs/07-database-design.md](../../docs/07-database-design.md)
- **Context Constraint**: LOAD ONLY this task file + 08 §12 + 07 §2.1.

---

## 3. Step-by-Step Execution Plan
1. `src/server/brands`: `listActive()`, `getStorefront(slug)` (brand, active products, assigned dispensaries, brand shows).
2. Route Handlers `GET /api/brands`, `GET /api/brands/[slug]`.
3. Cart: accept `source: "brand_storefront"` + `channelBrandSlug` → `CartItem.channelBrandId` (already supported by TASK-007 mapper; add tests).
4. Allocator (TASK-011): verify brand-channel lines are only allocated to `BrandDispensary` stores and suggestions are limited to them (`NOT_AT_BRAND_STORES`).
5. Friday: `/brands` (BrandGrid) and `/brands/[slug]` (BrandHero, ProductGrid, ShowRail, "Fulfilled by" chips) with 6 UI states; channel chip on CartLine and SubOrderCard.
6. Admin brand CRUD + store assignment UI is part of TASK-015 (if TASK-015 is not done yet, add the brand Route Handlers here and the UI there).

---

## 4. Expected Outputs
- `src/server/brands/*`, `src/app/api/brands/**`, `src/app/(shop)/brands/**`, `src/components/modules/brands/*`, tests

---

## 5. Acceptance Criteria
- [ ] AC-BRD-01 (storefront part) and AC-BRD-02 pass; T-BRD-01 green.
- [ ] Inactive/unknown brand → 404; brand with no products → empty state with CTA.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- brands distribution && pnpm playwright test brands`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-021 শুরু করো। [Tier: LEVEL: STANDARD]
```
