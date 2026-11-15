# 01 — Requirements Analysis

> Generated and maintained by `iron_man` based on root [README.md](../README.md).

---

## 1. Executive Summary & Problem Statement
- **Product Overview**: Owtlet™ (`owtlet.com`) is a custom 21+ cannabis marketplace with live shopping. Shoppers watch Terrific-powered live shows and shoppable replays, add cannabis products to Owtlet's own cart, and are handed off to Leafly or the partner retailer's order page to pay — Owtlet never processes cannabis payments or stores government ID. Orders spanning several dispensaries are split into a parent order plus per-store sub-orders, chosen by stock coverage, pickup/delivery eligibility and the shopper's store choice. Brands get storefronts (channels) fulfilled by their assigned partner stores; show products have one Owtlet price; shoppers check out as guests or with an optional profile. Client answers are stored verbatim in `input/client-docs/`. The platform is cannabis-only; accessories are out of scope (sold by a separate team on the `owtlet.shop` Shopify store).
- **Core Domain**: Cannabis E-commerce / Live Shopping (regulated adult-use cannabis, New York State). Coverage: Manhattan, Queens, Brooklyn, Westchester County, Long Island.
- **Primary Objectives**:
  1. MVP live on the client VPS by **Dec 1, 2026** (Fiverr milestone Nov 28) within a $3,000 budget.
  2. Video → cart → compliant dispensary checkout with minimal friction.
  3. Smart multi-dispensary routing (most items in one store, ZIP eligible, open now).
  4. Zero cannabis payment / ID liability for Owtlet (handoff model).
- **Pre-Architecture Brainstorming Status**: No SCAMPER session run. Terrific SDK hooks (`cartSyncHandler`, `goToCheckoutHandler`) were verified against SDK source with a standalone test page before planning. Pending client inputs are tracked in [planning/open-questions.md](../planning/open-questions.md).

---

## 2. Functional Requirements Breakdown
| ID | Module / Feature | Description | Priority | Dependencies |
|---|---|---|---|---|
| `REQ-F-001` | 21+ Age Gate | Full-screen gate on first visit (middleware-enforced); "I am 21+" sets a signed HTTP-only `owt_age` cookie (30 days); "Under 21" shows an exit screen; no DOB/ID stored; audit row in `AgeVerificationSession` | P0 | None |
| `REQ-F-002` | Cannabis Product Catalog | PostgreSQL catalog: category, strain (indica/sativa/hybrid/CBD), THC/CBD %, weight, images, description; per-dispensary price & stock via `Inventory`; list/search/filter + product detail; one-off migration of ~22 Shopify test products | P0 | `REQ-F-001` |
| `REQ-F-003` | Live Shopping + Replay + Shoppable Video | Embed Terrific SDK v2 (`storeId BX2hWAVam9JjsFhXP5ZF`, embedding `Cki70GhqvLgWGhJbSxg2`); live, replay and shoppable-video player; pinned products added to cart via `cartSyncHandler`; `goToCheckoutHandler` opens Owtlet checkout | P0 | `REQ-F-002`, `REQ-F-004` |
| `REQ-F-004` | Custom Cannabis Cart | Owtlet-owned cart in PostgreSQL keyed by anonymous session (or `shopperId` when signed in to the optional profile); add/update/remove; live-show carts held until 30 min after the show ends (REQ-F-016), others 30-min inactivity; accepts Terrific `cartProducts` payload shape | P0 | `REQ-F-002` |
| `REQ-F-005` | ~~Accessories via Shopify~~ | **Removed — out of scope** (2026-11-15): accessories handled by the separate `owtlet.shop` Shopify project; ID kept for traceability (ADR-008) | — | — |
| `REQ-F-006` | Cannabis Checkout Handoff | On checkout, cannabis sub-orders are handed off to Leafly (primary) or the retailer order page (fallback) via a configurable `HandoffProvider`; Owtlet takes no payment, stores no ID. Provider details pending client (Q-001, Q-002) | P0 | `REQ-F-007` |
| `REQ-F-007` | Multi-Dispensary Order Distribution | Create parent `Order` + per-store `SubOrder`s; greedy allocation: filter stores by delivery ZIP (closed stores stay eligible, status shown), pick store covering most cart items, repeat for remaining items; reject items no eligible store carries | P0 | `REQ-F-004`, `REQ-F-002` |
| `REQ-F-008` | Store Hours & Distance at Checkout | Show each assigned store's open/closed status (America/New_York), today's hours, distance (ZIP centroid) and ZIP eligibility on the checkout review page | P1 | `REQ-F-007` |
| `REQ-F-009` | Store → Owtlet Confirmation | `POST /api/webhooks/store-confirmation` (HMAC-signed per dispensary) or signed confirmation link; updates SubOrder → `CONFIRMED`, rolls up parent status | P1 | `REQ-F-006` |
| `REQ-F-010` | Admin Console | Credentialed admin area: products (Owtlet price) & inventory, brands + store assignment, dispensaries (pickup/delivery, delivery ZIPs, store + delivery hours, handoff URL), live shows/shoppable videos (Terrific show ↔ products, start/end), orders & sub-orders | P1 | `REQ-F-002`, `REQ-F-007` |
| `REQ-F-011` | Brand Storefronts (Channels) | Admin-created brand storefronts `/brands/[slug]`; brand ↔ dispensary assignment; brand-storefront lines only allocated to the brand's stores (client Nov 9) | P1 | `REQ-F-002`, `REQ-F-007` |
| `REQ-F-012` | Pickup or Delivery | Shopper chooses pickup or delivery; delivery = stores delivering to the address ZIP; pickup = stores offering pickup, nearest first (client Nov 11) | P0 | `REQ-F-007` |
| `REQ-F-013` | Change Store + Default Store | Auto-selected stores can be switched by the shopper at checkout; profile default store used first (client Nov 11) | P0 | `REQ-F-007`, `REQ-F-014` |
| `REQ-F-014` | Guest Checkout + Optional Profile | Contact info at checkout (no DOB/ID); optional profile with home ZIP, saved addresses, default store; password reset by email (client Nov 9/11) | P0 | `REQ-F-007` |
| `REQ-F-015` | One Owtlet Price for Show Products | `Product.owtletPrice` required for pinned products; cart shows one price; non-show products may be per-store (client Nov 9/11) | P0 | `REQ-F-002` |
| `REQ-F-016` | Show-End Cart Hold | Cart linked to a LIVE show held until 30 min after it ends (admin End show / scheduled end) (client Nov 11) | P1 | `REQ-F-004`, `REQ-F-003` |
| `REQ-F-017` | Out-of-Stock Flag + Suggestion | Unfulfillable lines flagged before handoff with partner stores that have the item (client Nov 9/11) | P0 | `REQ-F-007` |
| `REQ-F-018` | Delivery Hours per Store | `DispensaryHours.kind = DELIVERY` alongside store hours; shown on delivery checkouts (client Nov 11) | P1 | `REQ-F-008` |
| `REQ-F-019` | owtlet.live Redirect | 301 `owtlet.live` → `https://owtlet.com` (client Nov 9) | P2 | Q-003 |

---

## 3. Non-Functional Requirements
- **Performance**: P95 API latency < 200ms; Core Web Vitals LCP < 2.5s on catalog/home; Terrific SDK loaded lazily after age gate; catalog pages SSR/ISR-cached.
- **Security**: 21+ gate enforced server-side (middleware); signed HTTP-only, Secure, SameSite=Lax cookies; admin auth with argon2 hashing; HMAC-signed store webhooks; secrets only in env; HTTPS everywhere.
- **Compliance (Cannabis, NY)**: Owtlet never processes cannabis payments; never collects/stores government ID or DOB; fulfillment only by licensed partner dispensaries in the coverage area; 21+ gate on every entry; no cannabis items in Shopify.
- **Privacy**: Minimal PII — checkout contact info (name, email, phone, delivery address) and optional shopper profiles (argon2id passwords); used only for orders; no DOB, ID or payment data ever.
- **Accessibility**: WCAG 2.2 AA target, keyboard navigation, visible focus rings, captions support delegated to Terrific player.
- **Scalability**: Stateless Next.js app container; PostgreSQL single instance on VPS; optional Redis.
- **Maintainability**: Handoff provider and dispensary integrations behind interfaces/config so late client answers plug in without refactoring.

---

## 4. Scope Matrix
- **In-Scope (MVP — Dec 1, 2026)**: REQ-F-001 … REQ-F-019 except REQ-F-005 (removed); migration of Shopify cannabis test data; Docker/Nginx deployment on client VPS; responsive web (mobile browsers).
- **Out-of-Scope**: Native mobile apps; Owtlet-side cannabis payment processing; ID scanning/verification beyond the 21+ attestation; accessories and anything on the `owtlet.shop` Shopify store — catalog, cart, checkout, Storefront API, payments (separate project, other team member); shared login between owtlet.com and owtlet.shop (client accepted guest checkout on owtlet.shop); dispensary POS integrations beyond the confirmation link/webhook (pending Q-002); loyalty/rewards, reviews; delivery logistics/driver tracking; marketing email.
