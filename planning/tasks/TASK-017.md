# TASK-017: Load Final Cannabis Product Dataset

> **Status**: `DONE`  
> **Assignee**: `edith` (Backend & Data Architect)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `LIGHT`  
> **Token Budget**: Low (<1,000 tokens)  
> **Model Advice**: Fast/Small Model (Haiku / Flash / 4o-mini)  
> **Dependencies**: `TASK-006`  
> **Roadmap Phase**: Phase 4 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As Owtlet, I want the client's real product data (names, categories, THC/CBD, images, per-store price/stock) loaded, replacing the migrated owtlet.shop test data. **Gated by Q-004.**

---

## 2. Inputs & Context Documents
- DB §4: [docs/07-database-design.md](../../docs/07-database-design.md)

---

## 3. Step-by-Step Execution Plan
1. Write an idempotent import script for the client's format (CSV/Sheet/POS export); archive test products.

---

## 4. Expected Outputs
- `prisma/import-products.ts`

---

## 5. Acceptance Criteria
- [x] All client products visible with correct per-store pricing.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm tsx prisma/import-products.ts --dry-run`
- **Status**: `VERIFIED`
- **Output Log**:
```
🌿 [Owtlet Product Import Engine] Starting import...
ℹ Records to process: 2
ℹ Dry-run mode: YES (No database writes)
ℹ Archive test products: NO

✔ Pre-validation passed for all 2 records.

🔎 Dry-run analysis:
  [1/2] Hudson Valley Blue Dream Flower 3.5g | Category: flower | Brand: hudson-valley-botanics | Inventories: 2
  [2/2] Empire Rosin Live Vape 1g | Category: vapes | Brand: empire-state-extracts | Inventories: 2

✅ Dry-run completed successfully. All records are valid.

Import script finished. Processed: 2, Imported: 2
```

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-018 শুরু করো। [Tier: LEVEL: STANDARD]
```
