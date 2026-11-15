# TASK-004: Prisma Schema, Initial Migration & Coverage Seed

> **Status**: `DONE`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `HEAVY`  
> **Token Budget**: High (~4,000 - 6,000 tokens)  
> **Model Advice**: Use High-Reasoning / CoT Model (e.g. Sonnet / Pro / R1 / GPT-4o / o1)  
> **Dependencies**: `TASK-002`  
> **Roadmap Phase**: Phase 1 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As the backend architect (`edith`), I want the full Owtlet relational schema migrated in PostgreSQL with seed data for coverage ZIPs and demo dispensaries, so that catalog, cart, and order features have a stable data model.

---

## 2. Inputs & Context Documents
- DB design: [docs/07-database-design.md](../../docs/07-database-design.md)
- **Context Constraint**: LOAD ONLY this task file + 07.

---

## 3. Step-by-Step Execution Plan
1. Copy the Prisma schema from `docs/07-database-design.md` into `prisma/schema.prisma` — 21 models: User, Brand, BrandDispensary, Category, Strain, Product (`brandId`, `owtletPrice`), Dispensary (`offersPickup`, `offersDelivery`), DispensaryHours (`kind` STORE/DELIVERY), Inventory (`price` optional), Shopper, ShopperAddress, PasswordResetToken, Cart (`shopperId`, `liveShowId`, `lastActivityAt`), CartItem (`channelBrandId`, `liveShowId`), Order (`fulfillmentType`, contact + delivery address, `shopperId`), SubOrder (`fulfillmentType`, `assignment`, `channelBrandId`), OrderItem, LiveShow (`format`, `brandId`, `scheduledEndAt`, `startedAt`, `endedAt`), ShowProduct, AgeVerificationSession, CoverageZip — and enums Role, StrainType, CartStatus, OrderStatus, SubOrderStatus, HandoffChannel, ShowStatus, VideoFormat, FulfillmentType, HoursKind, AssignmentSource. Business rules: docs/07 §2.1–2.2.
2. Run `prisma migrate dev --name init`; add raw migration for the GIN index on `dispensaries.coverage_zips`.
3. Write `prisma/seed.ts`: coverage ZIPs for Manhattan, Queens, Brooklyn, Westchester, Long Island (with centroids), categories, 2 demo brands each assigned to 1–2 stores, 3 demo dispensaries (one pickup-only, one delivery-only, one both) with STORE + DELIVERY hours and inventory, a few products with `owtletPrice` (show products) and some with per-store prices, one admin user (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
4. Confirm no DOB / government ID / payment columns exist (contact fields on Order and Shopper profile only).

---

## 4. Expected Outputs
- `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`, `prisma/data/coverage-zips.json`

---

## 5. Acceptance Criteria
- [x] `prisma migrate reset --force` runs clean and seeds data.
- [x] `prisma validate` passes; all FKs indexed.
- [x] Schema review confirms zero ID/DOB/payment fields.
- [x] Seed covers brands + brand stores, pickup/delivery flags, STORE + DELIVERY hours, `owtletPrice` products (for TASK-006…012, 020, 021).

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && npx prisma validate && npx prisma migrate reset --force && npm test`
- **Status**: `PASSED`
- **Output Log**:
  - `prisma validate`: Schema valid, 21 models, 11 enums, all FK relations indexed.
  - `prisma migrate reset --force`: Successfully applied `20261115095820_init` with GIN index `dispensaries_coverage_zips_gin_idx`.
  - Database row counts:
    - `users`: 1 (SUPERADMIN ops@owtlet.com)
    - `brands`: 2 (Hudson Valley Botanics, Gotham Select)
    - `brandDispensaries`: 4
    - `categories`: 5 (Flower, Pre-Rolls, Vapes, Edibles, Concentrates)
    - `strains`: 7 (Blue Dream, Sour Diesel, OG Kush, Gelato #33, ACDC, Granddaddy Purple, Jack Herer)
    - `products`: 5 (3 show products with `owtletPrice`, 2 catalog products with per-store prices)
    - `dispensaries`: 3 (Gotham Greenery [pickup+delivery], Kings County [pickup-only], Empire Express [delivery-only])
    - `dispensaryHours`: 42 (7 days x 2 kinds [STORE, DELIVERY] x 3 stores)
    - `inventory`: 10
    - `shoppers`: 1 (Alex Rivera, saved default store + address)
    - `liveShows`: 1 (Owtlet Launch Drop, status: LIVE)
    - `showProducts`: 3 (pinned show items)
    - `coverageZips`: 40 (Manhattan, Brooklyn, Queens, Westchester, Long Island centroids)
  - Tri-Platform Verification (`bash scripts/verify-task.sh TASK-004`): Passed.
  - Vitest test suite: 22/22 tests passed (including schema verification and domain compliance tests).

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-005 শুরু করো। [Tier: LEVEL: STANDARD]
```
