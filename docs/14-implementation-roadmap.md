# 14 — Implementation Roadmap

> Owned and maintained by `iron_man`.
>
> **Window**: Nov 15 → **Dec 1, 2026** (Fiverr milestone Nov 28 — target code-complete Nov 27, buffer Nov 28–Dec 1).
> **Rule**: Pending client clarifications (`planning/open-questions.md` Q-001…Q-004, Q-006 SMTP; Q-005 resolved as out of scope) gate only **late-stage** tasks (Phases 3–5).
> **2026-11-15 update**: features Jesce already confirmed in writing (Nov 9/11 — brand storefronts, pickup/delivery + delivery hours, store change + default store, guest checkout + optional profile, one price for show products, cart hold until 30 min after the show ends, out-of-stock suggestions, shoppable video, owtlet.live redirect) are folded into the phases below (ADR-009…015). The foundation (Phases 1–2) does not depend on them and starts now; late integrations are built behind config/interfaces so answers plug in later.

---

## Roadmap Phases (Dependency Order)

### Phase 0: Discovery & Architecture Gate (Nov 15)
- [x] Client brief ingested from `README.md`.
- [x] Technical specifications drafted in `docs/`.
- [x] Multi-agent task assignments defined in `planning/task.md`.
- [x] Terrific SDK client-side hooks verified with a standalone test page.
- [ ] **Approval Gate**: Human developer approves plan.

### Phase 1: Foundation (Nov 15 – Nov 19) — no client dependency
- [ ] Ultron + Friday scaffold the single Next.js app (App Router, TS strict, Tailwind, shadcn) + Docker Compose PostgreSQL (TASK-002).
- [ ] Jarvis applies Owtlet brand tokens (Mint/Ink/Sage, Dela Gothic One + Red Rose) and 6 UI states (TASK-003).
- [ ] Edith creates Prisma schema (21 models incl. Brand, BrandDispensary, Shopper, ShopperAddress, PasswordResetToken; pickup/delivery, delivery hours, `owtletPrice`, show end time) & initial migration + seed (TASK-004).
- [ ] Edith + Friday build the 21+ age gate (middleware + Server Action) (TASK-005).
- [ ] Edith + Friday build the product catalog API + pages with one Owtlet price for show products; import the ~22 owtlet.shop cannabis test products (one-off migration) (TASK-006).
- [ ] Edith implements the custom cannabis cart API with the show-end hold (live-show carts until 30 min after the show ends; others 30-min inactivity); Friday the cart drawer + Zustand store (TASK-007).
- [ ] Friday integrates the Terrific embed + `cartSyncHandler` / `goToCheckoutHandler` bridge — all pinned products are cannabis → Owtlet cart (live, replay, shoppable video; `liveShowId` for the hold); unmapped ids rejected (TASK-008).
- [x] ~~Shopify Storefront accessory bridge (TASK-009)~~ — **CANCELLED 2026-11-15**: accessories out of scope (separate `owtlet.shop` project, ADR-008).

### Phase 2: Orders & Multi-Dispensary Distribution (Nov 19 – Nov 22) — no client dependency (demo dispensaries)
- [ ] Edith: dispensary eligibility (pickup / delivery ZIPs / brand), store + delivery hours, distance + `GET /api/dispensaries` (TASK-010).
- [ ] Edith: allocator (fulfillment type, shopper store change, default store, brand channel, most-items greedy, out-of-stock suggestions) + `POST /api/orders/preview` + order creation with guest contact info (TASK-011).
- [ ] Friday: checkout page — Pickup/Delivery toggle, ZIP/address, Store Order cards with hours/distance, Change store, out-of-stock fixes, guest contact form (TASK-012).

### Phase 3: Cannabis Checkout Handoff + Confirmation Loop (Nov 22 – Nov 25) — ⚠️ depends on Q-001, Q-002
- [ ] Edith: `HandoffProvider` interface + `RetailerPageProvider`; `LeaflyProvider` once Leafly access/method confirmed (TASK-013).
- [ ] Edith: store confirmation webhook / signed link + status roll-up; Friday: `/order/[id]` status page (TASK-014).
- [ ] Edith + Friday: brand storefronts `/brands/[slug]` + brand-restricted checkout (TASK-020) — no client dependency.
- [ ] Edith + Friday: optional shopper profile (saved addresses, default store, password reset) + checkout pre-fill (TASK-021) — production email needs Q-006.

### Phase 4: Admin + Live Shows + Data Migration (Nov 23 – Nov 26) — ⚠️ final data depends on Q-004
- [ ] Edith + Friday: admin console (products + Owtlet price, inventory, brands + store assignment, dispensaries with pickup/delivery + store/delivery hours, live shows, orders) (TASK-015).
- [ ] Edith: live-show model + Terrific show ↔ product mapping + Start/End show (cart hold); Friday: show rail, replays, `/videos` shoppable videos (TASK-016).
- [ ] Edith: load final cannabis dataset (names, categories, THC/CBD, images, per-store price/stock) (TASK-017).

### Phase 5: QA, Hardening & Deployment (Nov 26 – Dec 1) — ⚠️ depends on Q-003 (VPS/DNS)
- [ ] Thanos + Loki: full regression, E2E critical flows, chaos/edge cases (TASK-018).
- [ ] Ultron: security hardening (CSP for Terrific, rate limits, HMAC), Docker image, Nginx + SSL on client VPS, DNS cut-over for `owtlet.com` + `owtlet.live` 301 redirect (TASK-019).
- [ ] Client UAT + handover (Dec 1, 2026).
