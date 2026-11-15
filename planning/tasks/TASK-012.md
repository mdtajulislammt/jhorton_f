# TASK-012: Checkout Page: ZIP, Store Split, Hours & Distance

> **Status**: `BACKLOG`  
> **Assignee**: `friday` (Web Frontend Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-011`, `TASK-003`  
> **Roadmap Phase**: Phase 2 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a shopper, I want to choose pickup or delivery, see exactly which dispensary fulfills which items (with hours and distance), change a store if I want, fix out-of-stock items, and enter my contact info as a guest, so that I know what to expect before handoff.

---

## 2. Inputs & Context Documents
- Journey J-4: [docs/04-experience-spec.md](../../docs/04-experience-spec.md)
- API §8: [docs/08-api-contract.md](../../docs/08-api-contract.md)

---

## 3. Step-by-Step Execution Plan
1. `/checkout`: `FulfillmentToggle` (Pickup / Delivery), ZipForm / AddressForm (RHF + Zod), `checkout.store.ts`, `useCheckoutPreview`.
2. SubOrderCard: items (one price for show products), subtotal, store or delivery hours (Open/Closed, "Delivering now"), distance, assignment badge, **Change store** → `StorePickerSheet` (alternatives) → re-preview with `preferredDispensaryId` / `itemOverrides`.
3. `UnfulfillableList`: "Out of stock at … — available at …" with "Switch to this store" (may switch to pickup) or "Remove"; Place Order disabled until resolved.
4. `ContactForm`: first/last name, email, phone (+ address for delivery) — guest by default; "Sign in for faster checkout" link (profile pre-fill wired in TASK-021). No DOB/ID/payment fields.
5. "Place Order" → `POST /api/orders` → cannabis handoff (no accessory checkout — out of scope).

---

## 4. Expected Outputs
- `src/app/(shop)/checkout/page.tsx`, `src/components/modules/checkout/*`, `src/hooks/useCheckoutPreview.ts`

---

## 5. Acceptance Criteria
- [ ] AC-HRS-01, AC-DLH-01, AC-FUL-01/02, AC-SEL-01, AC-OOS-01, AC-PRF-01 pass in the UI; 6 UI states incl. no-coverage (with "Switch to Pickup").

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm playwright test checkout`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-013 শুরু করো। [Tier: LEVEL: HEAVY]
```
