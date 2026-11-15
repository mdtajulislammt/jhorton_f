# 11 — Testing Strategy & Verification

> Owned and maintained by `thanos`.

---

## 1. Test Matrix
| Level | Tool | Target Scope | Frequency |
|---|---|---|---|
| **Unit Tests** | Vitest | Distribution allocator, cart TTL logic, Terrific id → Product mapping, store hours (`isOpenNow`, America/New_York, DST), ZIP coverage, age-cookie signing, HMAC verification, Terrific payload mapper | On every file save / commit |
| **Component Tests** | React Testing Library | Age gate dialog, CartTimer countdown/expiry, SubOrderCard (open/closed, distance), ZipForm validation, 6 UI states | On PR / task review |
| **Integration Tests** | Vitest + test PostgreSQL (Docker) | Next.js Route Handlers (`/api/cart/items`, `/api/orders/preview`, `/api/orders`, `/api/checkout/handoff`, `/api/webhooks/store-confirmation`), Prisma transactions | Before marking task DONE |
| **E2E Tests** | Playwright | Age gate → catalog / brand storefront → add to cart → pickup/delivery → split preview → change store → contact → handoff; guest + profile; Terrific hook simulation (live, replay, shoppable video) | Pre-deployment milestone |

---

## 1.1 Owtlet Critical Test Cases
| ID | Area | Case | Level |
|---|---|---|---|
| `T-AGE-01` | Age gate | Visiting `/shop` without `owt_age` redirects to `/age-gate`; `/api/products` returns 451 | E2E + integration |
| `T-AGE-02` | Age gate | "Under 21" sets no cookie and shows exit screen; tampered cookie rejected | Unit + E2E |
| `T-MAP-01` | Product mapping | Terrific `cartProducts` resolve via `terrificProductId` (fallback `sku`) into the Owtlet cart; unmapped ids → 404 `UNMAPPED_PRODUCT`, not added, error toast | Unit + integration |
| `T-CART-01` | Cart TTL | Non-show cart `expiresAt` = last change + 30 min; access after expiry returns 410 and a new cart | Unit + integration |
| `T-HOLD-01` | Show-end hold | Cart linked to a LIVE show is not expired while LIVE; End show → expires at `max(lastActivity, endedAt) + 30 min`; `scheduledEndAt` fallback | Unit + integration (fake timers) |
| `T-TRF-01` | Terrific hooks | Simulated `cartSyncHandler` for `addProductToCart`/`updateProductInCart`/`removeProductFromCart` updates server cart; `goToCheckoutHandler` resolves and routes to `/checkout` | Component + E2E (mock `window.terrificLive`) |
| `T-DST-01` | Distribution | Store with most cart items wins; remaining items split to next best store | Unit |
| `T-DST-02` | Distribution | Tie-breaks: lowest subtotal, then nearest; deterministic output | Unit |
| `T-DST-03` | ZIP filter | Stores not covering ZIP excluded; ZIP outside 5 regions → `NO_COVERAGE` | Unit + integration |
| `T-DST-04` | Unfulfillable | Item with no eligible stock listed in `unfulfillable`, order creation blocked until removed | Integration |
| `T-ORD-01` | Orders | `POST /api/orders` creates 1 parent + N sub-orders + items atomically; cart → `CHECKED_OUT` | Integration |
| `T-HND-01` | Handoff | Handoff URL built from dispensary template; status → `HANDED_OFF`; no payment/ID fields in request/response | Integration |
| `T-WH-01` | Confirmation | Valid HMAC → sub-order `CONFIRMED`, parent roll-up; invalid signature → 401; replay idempotent | Integration |
| `T-HRS-01` | Store hours | Open/closed correct across midnight-closing stores and DST change | Unit |
| `T-DLH-01` | Delivery hours | `isDeliveringNow` uses `kind=DELIVERY` rows, independent of store hours | Unit |
| `T-FUL-01` | Pickup/Delivery | DELIVERY candidates = `offersDelivery` ∧ ZIP covered; PICKUP candidates = `offersPickup` sorted by distance | Unit |
| `T-BRD-01` | Brand channel | Brand-storefront lines only allocated to assigned stores; main lines unaffected | Unit + integration |
| `T-SEL-01` | Store change | `itemOverrides` / `preferredDispensaryId` respected; non-eligible store → 422; default store used when signed in | Unit + integration |
| `T-OOS-01` | Suggestions | Unfulfillable line returns ≤ 3 nearest stores with stock | Unit |
| `T-PRC-01` | Pricing | `owtletPrice` overrides `Inventory.price`; pinning without `owtletPrice` → 422 `PRICE_REQUIRED` | Unit + integration |
| `T-PRF-01` | Profile | Register/login/logout, cart merge, address CRUD, reset token single-use + 1 h expiry; guest checkout without profile | Integration + E2E |
| `T-RDR-01` | owtlet.live | `nginx -t` passes; `curl -I` owtlet.live → 301 owtlet.com | Manual on VPS |

---

## 2. Thanos Quality Gate & Multi-Perspective Review
- A task is NEVER `DONE` based on an agent's claim alone.
- Real terminal output with 0 failures is required from `bash scripts/verify-task.sh [TASK-ID]`.
- **Mandatory Review Gate**: Code must satisfy the 4 perspectives from `.agents/skills/multi-perspective-code-review/SKILL.md`:
  1. *Blind Hunter (`loki`)*: Edge-case fuzzing and unhandled null/async branches (expired carts, empty ZIP coverage, Terrific sending unknown product ids).
  2. *Contract Auditor (`thanos`)*: Strict DTO, schema, and API contract compliance.
  3. *Architecture Guard (`ultron`)*: Boundary isolation, no leaked server keys, clean separation; no cannabis payment/ID fields anywhere.
  4. *Tactile UX Auditor (`jarvis`)*: 6 UI states verified, touch targets, and zero dead buttons.
- If a test or review fails, Thanos captures logs and re-delegates to the responsible agent (Friday or Edith).
