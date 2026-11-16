# TASK-015: Admin Console (Products, Inventory, Dispensaries, Orders)

> **Status**: `DONE`  
> **Assignee**: `friday` (Web Frontend Specialist) & `edith` (Backend Specialist)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-006`, `TASK-010`  
> **Roadmap Phase**: Phase 4 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As an Owtlet admin, I want to manage products (incl. Owtlet price and brand), per-store inventory, brands and their assigned dispensaries, dispensaries (pickup/delivery, delivery ZIPs, store + delivery hours, handoff URL), live shows/shoppable videos, and orders, so that the marketplace runs without code changes.

---

## 2. Inputs & Context Documents
- API §11: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Security §1: [docs/10-security-plan.md](../../docs/10-security-plan.md)

---

## 3. Step-by-Step Execution Plan
1. Edith: admin auth (argon2id, `owt_admin` session) + `/api/admin/*` CRUD.
2. Product form: `brandId`, `owtletPrice` (required when pinned); Inventory editor: price optional when `owtletPrice` set.
3. Dispensary form: `offersPickup`, `offersDelivery`, `CoverageZipPicker`, `HoursEditor` with Store and Delivery tabs.
4. Brands: `/admin/brands` CRUD + `BrandDispensaryPicker` (`PUT /api/admin/brands/{id}/dispensaries`); block activation with 0 stores.
5. Orders: show fulfillment type, contact (masked in list), assignment per Store Order.
6. Friday: `/admin` DataTables & forms with 6 UI states.

---

## 4. Expected Outputs
- `src/app/admin/**`, `src/app/api/admin/**`, `src/server/admin/*`

---

## 5. Acceptance Criteria
- [x] AC-ADM-01 and AC-BRD-01 (admin part) pass; pinning without Owtlet price is blocked in UI; unauthenticated access redirected.

---

## 6. Verification Evidence (Thanos)
- **Command**: `bash scripts/verify-task.sh TASK-015`
- **Status**: `PASSED`
- **Output Log**: 474 passing tests (333 frontend + 141 backend). All CRUD operations, AC-ADM-01 uniform price enforcement, AC-BRD-01 dispensary requirement gate, argon2id admin session security, and 6 UI states verified.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-016 শুরু করো। [Tier: LEVEL: STANDARD]
```
