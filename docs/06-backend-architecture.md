# 06 — Backend Architecture

> Owned and maintained by `edith`.
>
> **Owtlet backend = Next.js Route Handlers + Server Actions inside the single Next.js app** (`development/frontend/`). The template's NestJS scaffold (`development/backend/`) was **removed** (ADR-015).

---

## 1. Directory Structure (`development/frontend/` — backend parts)
```text
development/frontend/
├── src/
│   ├── app/api/                         # Route Handlers (thin: parse → service → envelope)
│   │   ├── age-verify/route.ts          # POST
│   │   ├── products/route.ts            # GET list
│   │   ├── products/[slug]/route.ts     # GET detail
│   │   ├── cart/route.ts                # GET / DELETE current cart
│   │   ├── cart/items/route.ts          # POST add (Terrific payload), PATCH update, DELETE remove
│   │   ├── dispensaries/route.ts        # GET ?zip=&fulfillment=&brand=
│   │   ├── brands/route.ts              # GET list
│   │   ├── brands/[slug]/route.ts       # GET storefront
│   │   ├── account/**                   # register, login, logout, profile, addresses, password-reset, orders
│   │   ├── live-shows/route.ts          # GET live/upcoming/replays
│   │   ├── orders/preview/route.ts      # POST distribution preview
│   │   ├── orders/route.ts              # POST create parent + sub-orders
│   │   ├── orders/[id]/route.ts         # GET status
│   │   ├── checkout/handoff/route.ts    # POST handoff URLs per sub-order
│   │   ├── webhooks/store-confirmation/route.ts  # POST (HMAC)
│   │   └── admin/**                     # Admin CRUD (session-guarded)
│   ├── server/                          # Domain services (server-only)
│   │   ├── db.ts                        # Prisma Client singleton
│   │   ├── http.ts                      # envelope helpers ok()/fail(), error codes
│   │   ├── age-session/                 # cookie signing, AgeVerificationSession audit
│   │   ├── products/                    # catalog queries, Terrific id / SKU → Product mapping
│   │   ├── pricing/                     # unitPrice = owtletPrice ?? Inventory.price; PRICE_REQUIRED guard
│   │   ├── brands/                      # brand storefronts, brand ↔ dispensary assignment
│   │   ├── shopper-account/             # optional profile: argon2id, owt_shopper session, addresses, reset tokens, cart merge
│   │   ├── cart/                        # cart service, hold rules (show end + 30 min / 30-min inactivity), Terrific payload mapper
│   │   ├── dispensaries/                # eligibility (pickup / delivery ZIP / brand), STORE + DELIVERY hours (America/New_York), distance
│   │   ├── distribution/                # greedy multi-dispensary allocator (pure function)
│   │   ├── orders/                      # parent Order + SubOrder creation, status roll-up
│   │   ├── checkout-handoff/            # HandoffProvider interface: LeaflyProvider (pending), RetailerPageProvider
│   │   ├── live-shows/                  # LiveShow (live / shoppable video) + ShowProduct mapping, start/end → cart hold recompute
│   │   └── admin/                       # admin auth (argon2), CRUD services
│   └── actions/                         # Server Actions (age gate confirm, admin forms)
├── prisma/
│   ├── schema.prisma                    # Prisma models & relations (see 07)
│   ├── migrations/                      # Versioned SQL migrations
│   └── seed.ts                          # Coverage ZIPs, demo dispensaries, migrated owtlet.shop cannabis test products (one-off)
└── tests/                               # Vitest unit + integration
```

---

## 2. Request Lifecycle
1. Incoming HTTP request hits Nginx reverse proxy (SSL, gzip, rate limit) → Next.js.
2. `middleware.ts` enforces the 21+ age cookie on storefront routes and `/api/*` (except `age-verify`, `webhooks/*`, `health`), and the admin session on `/admin` + `/api/admin/*`.
3. Route Handler parses & validates the body/query with the shared **Zod** schema (400 `VALIDATION_ERROR` on failure).
4. Handler calls the domain service in `src/server/<module>/`.
5. Domain service executes business logic with the Prisma singleton; multi-step mutations (order + sub-orders, cart merges) use `prisma.$transaction`.
6. Standardized JSON envelope (`{ success, data, message, timestamp }`) returned to caller.

---

## 3. Module Responsibilities
| Module | Responsibility | Key rules |
|---|---|---|
| `age-session` | Sign/verify `owt_age` cookie; log `AgeVerificationSession` (no DOB/ID) | HMAC with `AGE_COOKIE_SECRET`, 30-day max age |
| `products` | Catalog list/detail, filters, `resolve(productId \| terrificProductId \| sku)` | Cannabis-only catalog; unmapped Terrific id → `UNMAPPED_PRODUCT` |
| `cart` | Session cart (`owt_cart` cookie → `Cart.sessionToken`; `shopperId` when signed in) | Hold rules docs/07 §2.2: LIVE show → held until `endedAt + 30 min`; else `lastActivityAt + 30 min`; expired carts rejected (`CART_EXPIRED`) and purged; Redis TTL optional |
| `pricing` | `unitPrice(product, inventory)` | `owtletPrice` wins (one price for show products); pinned products must have it |
| `brands` | Storefront queries, store assignment | Brand lines only allocated to assigned stores |
| `shopper-account` | Optional profile, `owt_shopper` session (HMAC `SHOPPER_SESSION_SECRET`), addresses, default store, password reset | argon2id; reset token SHA-256, 1 h; never DOB/ID/payment |
| `dispensaries` | `findEligible({ fulfillmentType, zip, brandId? })`; `isOpenNow(STORE hours)`, `isDeliveringNow(DELIVERY hours)`; distance from ZIP centroid | DELIVERY: `offersDelivery` ∧ zip ∈ `coverageZips` (Manhattan, Queens, Brooklyn, Westchester, Long Island); PICKUP: `offersPickup`, nearest first |
| `distribution` | Pure greedy allocator (see §4) | Deterministic tie-breaks: most items → lowest subtotal → nearest → `CartItem.preferredDispensaryId` hint; a line is never split across stores |
| `orders` | Create parent `Order` + `SubOrder`s + `OrderItem`s in one transaction; status roll-up | Parent `CONFIRMED` only when all sub-orders confirmed |
| `checkout-handoff` | `HandoffProvider.buildUrl(subOrder)` → URL; mark `HANDED_OFF` | Leafly provider **pending client**; retailer provider uses `Dispensary.handoffUrlTemplate` |
| `live-shows` | Shows & shoppable videos list, pinning map, start/end | Terrific product ids via `Product.terrificProductId`; End show sets `endedAt` and recomputes held carts |
| `admin` | Credentialed CRUD for products, inventory, dispensaries, shows, orders | argon2id, HTTP-only session |

---

## 4. Multi-Dispensary Distribution Algorithm (`server/distribution`)
1. Input: cart lines `{productId, qty, channelBrandId?}`, `fulfillmentType`, `zip`, `itemOverrides[]`, `preferredDispensaryId?` (shopper change or profile default), `now`.
2. Eligible stores per line = active dispensaries matching the fulfillment type (DELIVERY: `offersDelivery` ∧ `zip ∈ coverageZips`; PICKUP: `offersPickup`) ∩ the brand's assigned stores for brand-channel lines. Closed stores stay eligible (status shown, REQ-F-008/018).
3. Apply `itemOverrides` (store must be eligible → else `STORE_NOT_ELIGIBLE`; no stock → unfulfillable `NOT_AT_SELECTED_STORE`), then give `preferredDispensaryId` every remaining line it can supply (`assignment = SHOPPER_CHANGED` / `PROFILE_DEFAULT`).
4. Loop while unassigned items remain (`assignment = AUTO`): pick the candidate with the most unassigned items it has in stock (qty ≥ requested — a line is never split); tie → lowest subtotal → nearest → preferred-store hint. Assign those items → one `SubOrder`. Remove that store from candidates.
5. Items no candidate can fulfill → `unfulfillable[]` with `suggestions` = up to 3 nearest active stores with stock (any fulfillment type, brand stores only for brand lines) — REQ-F-017.
6. Per sub-order, `alternatives` = other eligible stores with `canSupplyAll` / `missingProductIds` (REQ-F-013).
7. Prices via `pricing.unitPrice` (REQ-F-015).
8. Output: `{ subOrders: [{ dispensaryId, assignment, channelBrandId, items[], subtotal, isOpenNow, hoursToday, deliveryHoursToday, distanceMiles, alternatives[] }], unfulfillable[] }`.
