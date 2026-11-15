# Avengers Task Board

> **Statuses**: `BACKLOG` | `READY` | `IN_PROGRESS` | `BLOCKED` | `IN_REVIEW` | `FAILED` | `DONE` | `CANCELLED`  
> **Priorities**: `P0` (Critical) | `P1` (High) | `P2` (Normal) | `P3` (Low)  
> **Rule**: A task is `READY` only when all dependencies are `DONE`. A task is `DONE` only when acceptance criteria are met and Thanos has verified the actual test execution.

---

## Active Task Board

> **Project**: Owtlet™ — 21+ Cannabis Marketplace + Live Shopping · **Hard Deadline**: Dec 1, 2026 · **Roadmap**: [docs/14-implementation-roadmap.md](../docs/14-implementation-roadmap.md)  
> **Architecture Spine**: [docs/architecture-spine.md](../docs/architecture-spine.md) · **Ideation & Brainstorming**: [planning/brainstorming/owtlet-platform.md](brainstorming/owtlet-platform.md)  
>
> **Execution Strategy**:
> - **Phase 1 Tasks (Foundation & Cart)**: All dependencies for Phase 1 are cleared (`TASK-001` is `DONE`). Tasks `TASK-002` through `TASK-008` are marked `READY` to execute sequentially in priority order.
> - **Scope Guard (ADR-008)**: Platform is cannabis-only; accessories are handled on `owtlet.shop` by a separate team. `TASK-009` is `CANCELLED`.
> - **External Client Gates**: Tasks gated by client confirmations ([planning/open-questions.md](open-questions.md)): `TASK-013`/`014` (Leafly/POS details - Q-001/Q-002), `TASK-017` (Final product dataset - Q-004), `TASK-019` (VPS/DNS cutover - Q-003).

| Task ID | Task Title | Assignee | Dependencies | Status | Priority | Complexity Tier | Verification |
|---|---|---|---|---|---|---|---|
| [`TASK-001`](tasks/TASK-001.md) | Owtlet discovery, docs 01–14, brainstorming & task board | `iron_man` | None | `DONE` | `P0` | `HEAVY` | Phase 0 — Passed |
| [`TASK-002`](tasks/TASK-002.md) | Scaffold Next.js full-stack app + Prisma + Docker Postgres | `friday` | `TASK-001` | `DONE` | `P0` | `STANDARD` | Phase 1 — Passed |
| [`TASK-003`](tasks/TASK-003.md) | Owtlet brand tokens (owtlet.shop) & 6 UI states | `jarvis` | `TASK-001` | `DONE` | `P1` | `STANDARD` | Phase 1 — Passed |
| [`TASK-004`](tasks/TASK-004.md) | Prisma schema + migration + coverage ZIP seed | `edith` | `TASK-002` | `DONE` | `P0` | `HEAVY` | Phase 1 — Passed |
| [`TASK-005`](tasks/TASK-005.md) | 21+ age gate (middleware + cookie + UI) | `edith` | `TASK-002`, `TASK-003`, `TASK-004` | `DONE` | `P0` | `STANDARD` | Phase 1 — Passed |
| [`TASK-006`](tasks/TASK-006.md) | Catalog API + pages + one-price pricing + Shopify test-data import | `edith` | `TASK-003`, `TASK-004` | `READY` | `P0` | `STANDARD` | Phase 1 — Pending |
| [`TASK-007`](tasks/TASK-007.md) | Custom cannabis cart (show-end + 30 min / 30-min sliding hold) | `edith` | `TASK-006` | `READY` | `P0` | `HEAVY` | Phase 1 — Pending |
| [`TASK-008`](tasks/TASK-008.md) | Terrific embed + cartSync/goToCheckout bridge (live, replay, video) | `friday` | `TASK-007` | `READY` | `P0` | `HEAVY` | Phase 1 — Pending |
| [`TASK-009`](tasks/TASK-009.md) | Shopify accessories bridge (Cancelled per ADR-008) | `edith` | `TASK-007` | `CANCELLED` | `P1` | `STANDARD` | Phase 1 — Cancelled |
| [`TASK-010`](tasks/TASK-010.md) | Dispensary eligibility (pickup/delivery ZIPs, brand), hours, distance API | `edith` | `TASK-004` | `BACKLOG` | `P0` | `STANDARD` | Phase 2 — Pending |
| [`TASK-011`](tasks/TASK-011.md) | Distribution allocator (fulfillment, store change, OOS) + parent/sub-orders | `edith` | `TASK-007`, `TASK-010` | `BACKLOG` | `P0` | `HEAVY` | Phase 2 — Pending |
| [`TASK-012`](tasks/TASK-012.md) | Checkout UI (pickup/delivery → split → change store → OOS fixes → guest) | `friday` | `TASK-011`, `TASK-003` | `BACKLOG` | `P0` | `STANDARD` | Phase 2 — Pending |
| [`TASK-013`](tasks/TASK-013.md) | Cannabis handoff (Leafly / retailer page) | `edith` | `TASK-011` | `BACKLOG` | `P0` | `HEAVY` | Phase 3 — Pending |
| [`TASK-014`](tasks/TASK-014.md) | Store confirmation webhook + order status | `edith` | `TASK-013` | `BACKLOG` | `P1` | `STANDARD` | Phase 3 — Pending |
| [`TASK-015`](tasks/TASK-015.md) | Admin console (incl. brands, pickup/delivery, delivery hours, Owtlet price) | `friday` | `TASK-006`, `TASK-010` | `BACKLOG` | `P1` | `STANDARD` | Phase 4 — Pending |
| [`TASK-016`](tasks/TASK-016.md) | Live shows + replays + shoppable videos; start/end show | `friday` | `TASK-008` | `BACKLOG` | `P1` | `STANDARD` | Phase 4 — Pending |
| [`TASK-017`](tasks/TASK-017.md) | Final cannabis product dataset load | `edith` | `TASK-006` | `BACKLOG` | `P1` | `LIGHT` | Phase 4 — Pending |
| [`TASK-018`](tasks/TASK-018.md) | Full regression + E2E + chaos testing | `thanos` | `TASK-012`, `TASK-014`, `TASK-015`, `TASK-016`, `TASK-020`, `TASK-021` | `BACKLOG` | `P0` | `STANDARD` | Phase 5 — Pending |
| [`TASK-019`](tasks/TASK-019.md) | Security hardening + VPS deploy + owtlet.live redirect | `ultron` | `TASK-018` | `BACKLOG` | `P0` | `STANDARD` | Phase 5 — Pending |
| [`TASK-020`](tasks/TASK-020.md) | Brand storefronts (channels) + brand-restricted checkout | `edith` | `TASK-006`, `TASK-011` | `BACKLOG` | `P1` | `STANDARD` | Phase 3 — Pending |
| [`TASK-021`](tasks/TASK-021.md) | Optional shopper profile (addresses, default store) + checkout pre-fill | `edith` | `TASK-007`, `TASK-012` | `BACKLOG` | `P1` | `STANDARD` | Phase 3 — Pending |

---

## Phased Execution Roadmap

### Phase 0: Project Setup & Specification (Complete)
- `TASK-001`: Extract requirements, architecture spine, domain contracts, and initialize master task board. [Status: `DONE`]

### Phase 1: Core Foundation, Catalog & Cart (Current Sprint)
- `TASK-002`: Scaffold Next.js 14 App Router, Prisma ORM singleton, Docker Compose. [Status: `READY`]
- `TASK-003`: Configure brand tokens (Mint `#70F1C7`, Ink `#0D221E`, Dela Gothic One) and 6 UI state primitives. [Status: `DONE`]
- `TASK-004`: Database migrations, seed NY coverage ZIPs (Manhattan, Queens, Brooklyn, Westchester, Long Island). [Status: `DONE`]
- `TASK-005`: 21+ Age Gate Edge Middleware (`middleware.ts`) and HMAC-signed attestation cookie (`owt_age`). [Status: `DONE`]
- `TASK-006`: PostgreSQL cannabis catalog API, filter bar, single show price, and Shopify test data import. [Status: `READY`]
- `TASK-007`: Custom PostgreSQL cannabis cart API with 30-min-post-show hold rule (REQ-F-016). [Status: `READY`]
- `TASK-008`: Client-side Terrific Live SDK v2 integration (`cartSyncHandler` & `goToCheckoutHandler`). [Status: `READY`]

### Phase 2: Fulfillment, Routing & Checkout Experience
- `TASK-010`: Dispensary eligibility engine (pickup/delivery ZIPs, STORE/DELIVERY hours in America/New_York). [Status: `BACKLOG`]
- `TASK-011`: Multi-dispensary greedy order distribution (Parent Order + SubOrders) with OOS suggestions. [Status: `BACKLOG`]
- `TASK-012`: Interactive checkout page with fulfillment toggle, store split cards, and change store picker. [Status: `BACKLOG`]

### Phase 3: Checkout Handoff & Channels
- `TASK-013`: Resilient `HandoffProvider` (Leafly primary, retailer web page fallback). [Status: `BACKLOG`]
- `TASK-014`: Dispensary order confirmation webhook (`POST /api/webhooks/store-confirmation`) and order tracking. [Status: `BACKLOG`]
- `TASK-020`: Brand storefronts (`/brands/[slug]`) and brand-restricted dispensary checkout. [Status: `BACKLOG`]
- `TASK-021`: Optional shopper profile (`owt_shopper`), address book, and default store preference. [Status: `BACKLOG`]

### Phase 4: Media, Admin & Production Catalog
- `TASK-015`: Admin console for products, inventory, dispensaries, brands, and order overrides. [Status: `BACKLOG`]
- `TASK-016`: Live show management, start/end show cart hold synchronization, and shoppable video rail. [Status: `BACKLOG`]
- `TASK-017`: Production cannabis catalog dataset ingestion (gated by Q-004). [Status: `BACKLOG`]

### Phase 5: Verification, Hardening & VPS Deployment
- `TASK-018`: Multi-perspective code review, E2E user journey testing, chaos fuzzing. [Status: `BACKLOG`]
- `TASK-019`: Docker production build, Nginx reverse proxy, Let's Encrypt SSL, and `owtlet.live` 301 redirect. [Status: `BACKLOG`]

---

## Token Efficiency & Context Isolation Rules

To preserve **minimum tokens and maximum speed**:
1. **Never load `docs/01-14` by default**: Load **only** [docs/architecture-spine.md](../docs/architecture-spine.md) and your assigned `planning/tasks/TASK-XXX.md`.
2. **Pre-Implementation Check**: Always run `bash scripts/check-readiness.sh [TASK-ID]` before writing code.
3. **Execution Filter**: Always run test suites through `bash scripts/clean-run.sh` to keep context clean.
4. **Fresh Session Handoff**: At the end of each task, instruct the developer to start a fresh chat session using:
   `"planning/updateplanning.md পড়ে [Next TASK-ID] শুরু করো। [Tier: LEVEL_NAME]"`
