# Development Directory Rules (Avengers Protocol)

> Applies to all code under `development/`.

---

## 1. Domain Ownership
- **`development/frontend/`** — the **single Owtlet Next.js app** (UI + backend):
  - UI (`src/app/(shop)`, `src/app/admin`, `src/components`, `src/stores`, `src/hooks`): owned by **Friday** (implementation) and **Jarvis** (design standards).
  - Backend (`src/app/api/**`, `src/server/**`, `src/actions/**`, `prisma/**`): owned by **Edith** (route handlers, services, Prisma models, migrations).
- **No `development/backend/` (NestJS) or `development/mobile/` (Flutter)** — template scaffolds removed for Owtlet (ADR-015). Do not recreate them.

---

## 2. Cross-Domain Communication
- Agents must NOT directly write code into another agent's domain without an assigned multi-domain task or delegation.
- Communication between frontend/mobile and backend is mediated **exclusively through `docs/08-api-contract.md`**.

---

## 3. Mandatory Standards
- **TypeScript Strict Mode**: No implicit `any`. All data types must be defined.
- **Validation**: Client validates for UX; backend validates for security.
- **Verification**: Thanos must verify tests before any task is marked `DONE`.
