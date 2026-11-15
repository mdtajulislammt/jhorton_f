# TASK-006: Cannabis Catalog API, Pages & Shopify Test-Data Import

> **Status**: `READY`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-003`, `TASK-004`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a 21+ shopper, I want to browse cannabis products by category, strain, THC and brand and see availability per dispensary — with one Owtlet price for show products — so that I can choose what to buy.

---

## 2. Inputs & Context Documents
- API: [docs/08-api-contract.md](../../docs/08-api-contract.md) §3
- DB: [docs/07-database-design.md](../../docs/07-database-design.md) §4
- Screens SCR-003/004: [docs/03-figma-analysis.md](../../docs/03-figma-analysis.md)

---

## 3. Step-by-Step Execution Plan
1. `src/server/pricing`: `unitPrice(product, inventory) = owtletPrice ?? inventory.price`, `priceMode` (REQ-F-015, ADR-011).
2. `src/server/products`: list (filters incl. `brand`, cursor pagination), detail with availability by ZIP (`deliversToZip`, `offersPickup`, distance), `resolve(productId | terrificProductId | sku)` (unmapped → `UNMAPPED_PRODUCT`).
3. Route Handlers `GET /api/products`, `GET /api/products/[slug]`.
4. `prisma/seed-shopify-import.ts`: import ~22 Shopify test cannabis products from store `f1jc7p-fs` (CSV export or API) → `Product` (`shopifyLegacyId`) — one-off test-data migration, no runtime Shopify link.
5. Friday: `/shop`, `/shop/[category]`, `/product/[slug]` with ProductCard (one price vs "from $X"), FilterBar, StoreAvailabilityList (pickup/delivery badges, "Out of stock here — available at …"), 6 UI states.

---

## 4. Expected Outputs
- `src/server/pricing/*`, `src/server/products/*`, `src/app/api/products/**`, `src/app/(shop)/shop/**`, `src/app/(shop)/product/[slug]/page.tsx`, `prisma/seed-shopify-import.ts`

---

## 5. Acceptance Criteria
- [ ] AC-CAT-01/02/03 pass; T-PRC-01 (price resolution part) green — show products show one price.
- [ ] Filters persist in the URL; skeleton/empty/error states present.
- [ ] Product resolution by `terrificProductId` / `sku` works; unmapped ids → `UNMAPPED_PRODUCT` (T-MAP-01).

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- products`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-007 শুরু করো। [Tier: LEVEL: HEAVY]
```
