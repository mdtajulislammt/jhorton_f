# TASK-021: Optional Shopper Profile (Saved Addresses, Default Store) + Checkout Pre-fill

> **Status**: `BACKLOG`  
> **Assignee**: `edith` (Backend & Data Architect) — with `friday` for `/account` pages  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~3,000 - 4,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-007`, `TASK-012`  
> **Roadmap Phase**: Phase 3 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As a returning shopper, I want an optional profile that remembers my location, saved addresses and default partner store and pre-fills checkout, while guest checkout keeps working without an account (REQ-F-013, REQ-F-014, ADR-013).

Client (Nov 11): *"Guest checkout with an optional profile (location, saved addresses, default store)"* · *"Shopper profiles should have a default partner store setting."*

---

## 2. Inputs & Context Documents
- README REQ-F-014 (field-by-field)
- API §13: [docs/08-api-contract.md](../../docs/08-api-contract.md)
- Security §1: [docs/10-security-plan.md](../../docs/10-security-plan.md)
- **Context Constraint**: LOAD ONLY this task file + 08 §13 + 10 §1.

---

## 3. Step-by-Step Execution Plan
1. `src/server/shopper-account`: register/login (argon2id, ≥ 10-char password), `owt_shopper` HMAC session (`SHOPPER_SESSION_SECRET`, 30 days), logout, profile get/patch (`firstName`, `lastName`, `phone`, `homeZip`, `defaultDispensaryId` must be active), address CRUD (one default), order history.
2. Password reset: `PasswordResetToken` (SHA-256, 1 h, single use); mailer interface — SMTP when `SMTP_HOST` set (Q-006), else log link to console.
3. Cart merge on login/register (anonymous cart lines → shopper cart, quantities capped at 10).
4. Checkout pre-fill: contact + default address + `homeZip`; profile default store sent as `preferredDispensaryId` (`assignment = PROFILE_DEFAULT`); `saveToProfile` on order create.
5. Friday: `/account/login`, `/account/register`, `/account/reset`, `/account` (ProfileForm, DefaultStorePicker, AddressList, OrderHistory); guest "Save my info for next time" on `/order/[id]`; header account menu.
6. `middleware.ts`: `/account` (except login/register/reset) requires `owt_shopper`; rate-limit login/reset.

---

## 4. Expected Outputs
- `src/server/shopper-account/*`, `src/app/api/account/**`, `src/app/(shop)/account/**`, `src/components/modules/account/*`, mailer adapter, tests

---

## 5. Acceptance Criteria
- [ ] AC-PRF-01 (guest still works) and AC-PRF-02 pass; AC-SEL-02 (default store) passes; T-PRF-01 green.
- [ ] No DOB / ID / payment fields anywhere; password never returned by any API.

---

## 6. Verification Evidence (Thanos)
- **Command**: `cd development/frontend && pnpm test -- shopper-account && pnpm playwright test account`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
planning/updateplanning.md পড়ে TASK-013 শুরু করো। [Tier: LEVEL: HEAVY]
```
