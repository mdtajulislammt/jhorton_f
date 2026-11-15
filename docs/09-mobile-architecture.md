# 09 — Mobile Architecture (Flutter / Thor)

> Owned and maintained by `thor`.  
> **Status**: **N/A for Owtlet** — `project.config.md` §3.3 `Enabled: false`. The client brief requires a responsive web experience only; no native iOS/Android app is in the Dec 1, 2026 MVP scope. `thor` stays idle; the template's `development/mobile/` scaffold was removed (ADR-015).

---

## 1. Directory Structure (`development/mobile/`)
```text
Not applicable — no mobile application for Owtlet.
(Template scaffold removed — ADR-015. Re-create only if a native app is approved later.)
```

---

## 2. Architectural Conventions
- **Mobile experience**: Delivered by the responsive Next.js web app (mobile-first layouts, full-width Terrific player, 44×44px touch targets).
- **Future**: If a native app is requested later, it would consume the same `/api` contract in `docs/08-api-contract.md`; re-enable `thor` via `project.config.md` and a new plan in `planning/new-plan.md`.
