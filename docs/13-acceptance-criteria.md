# 13 — Feature Acceptance Criteria

> Owned and verified by `thanos`.

---

## 1. Global Baseline Acceptance Checklist
Every completed feature must meet:
- [ ] TypeScript strict compilation without errors.
- [ ] No ESLint / linter warnings or errors.
- [ ] Unit and integration tests passed with evidence.
- [ ] Responsive UI verified on mobile (<640px) and desktop (>1024px).
- [ ] No unhandled Promise rejections or runtime console errors.
- [ ] **Multi-Perspective Review Passed**: Blind Hunter, Contract Auditor, Architecture Guard, Tactile UX (`multi-perspective-code-review`).
- [ ] **6 UI States Implemented**: Default, Skeleton Loading, Empty State, Error/Validation, Responsive, Interactive Focus.
- [ ] **No Dead Buttons**: Every action triggers an active route, handler, or feedback.
- [ ] **Zero Dummy Text**: Uses vocabulary from `docs/domain-lexicon.md`.

---

## 2. Feature Specific Criteria Matrix
| Feature ID | Feature Name | Acceptance Condition | Verification Method |
|---|---|---|---|
| `AC-AGE-01` | 21+ Age Gate (REQ-F-001) | First visit to any storefront route shows the age gate before any product, price, or video renders | E2E Playwright test |
| `AC-AGE-02` | 21+ Age Gate | "I'm under 21" shows the exit screen and sets no cookie; `/api/*` returns 451 without `owt_age` | E2E + integration |
| `AC-AGE-03` | 21+ Age Gate | After confirming, the shopper is not asked again for 30 days on the same browser; no DOB/ID stored in DB | E2E + schema review |
| `AC-CAT-01` | Catalog (REQ-F-002) | `/shop` lists active cannabis products with category, strain type, THC/CBD, from-price; filters by category/strain/THC persist in URL | Component + E2E |
| `AC-CAT-02` | Catalog | Product page lists each dispensary's price and stock; out-of-stock disables "Add to Cart" | Component test |
| `AC-CAT-03` | Data migration | All ~22 Shopify test cannabis products imported into PostgreSQL with images and `shopifyLegacyId` | Seed script + DB count |
| `AC-LIVE-01` | Live Shopping (REQ-F-003) | Terrific player renders on `/` and `/live/[showId]` using store `BX2hWAVam9JjsFhXP5ZF` / embedding `Cki70GhqvLgWGhJbSxg2` | Manual + E2E smoke |
| `AC-LIVE-02` | Live / Replay add-to-cart | Adding a pinned product from a live show **or** replay adds it to the Owtlet cart within 1s and shows a toast | E2E (mocked SDK) + manual |
| `AC-LIVE-03` | Unmapped live product (REQ-F-003) | A pinned product with no matching `terrificProductId`/SKU is not added and shows an error toast (`UNMAPPED_PRODUCT`) | Integration + E2E (mocked SDK) |
| `AC-CART-01` | Custom Cart (REQ-F-004) | Cannabis items are stored in Owtlet's PostgreSQL cart; add/update/remove work from both catalog and Terrific | Integration test |
| `AC-LIVE-04` | Shoppable video (REQ-F-003) | Adding a pinned product from a shoppable video (`format = SHOPPABLE_VIDEO`) adds it to the Owtlet cart with `source = terrific_video` | E2E (mocked SDK) + manual on Terrific |
| `AC-CART-02` | Cart persistence | A non-show cart survives reloads for 30 min of inactivity; after that it is expired and an Expired empty state is shown | Unit + E2E (fake timers) |
| ~~`AC-ACC-01`~~ | ~~Accessories (REQ-F-005)~~ | **Removed — out of scope** (accessories handled by the separate `owtlet.shop` Shopify project) | — |
| `AC-HND-01` | Checkout Handoff (REQ-F-006) | Each cannabis sub-order offers a handoff button to Leafly or the retailer's order page; Owtlet shows no payment or ID form | E2E + code review |
| `AC-DST-01` | Distribution (REQ-F-007) | Given a ZIP, a cart spanning multiple stores yields one parent order + sub-orders where the first store covers the most items | Unit + integration |
| `AC-DST-02` | ZIP filter | Stores not delivering to the ZIP are never assigned; ZIP outside Manhattan/Queens/Brooklyn/Westchester/Long Island shows "We don't deliver to {zip} yet" | Unit + E2E |
| `AC-HRS-01` | Hours & Distance (REQ-F-008) | Checkout shows Open/Closed, today's hours (NY time), and distance per assigned store | Component + unit |
| `AC-CNF-01` | Store Confirmation (REQ-F-009) | A correctly signed confirmation marks the sub-order Confirmed and is visible on `/order/[id]`; invalid signatures are rejected | Integration |
| `AC-ADM-01` | Admin (REQ-F-010) | Admin (login required) can create/edit products, inventory, dispensaries (ZIPs, hours, handoff URL), live shows, and view orders | E2E |
| `AC-BRD-01` | Brand storefronts (REQ-F-011) | Admin creates a brand, assigns ≥ 1 dispensary, activates it; `/brands/[slug]` lists only that brand's products and shows | E2E |
| `AC-BRD-02` | Brand channel checkout | A line added on a brand storefront is only allocated to that brand's assigned stores; main-site lines use all eligible stores | Unit (allocator) + integration |
| `AC-FUL-01` | Delivery (REQ-F-012) | With `DELIVERY`, only stores with `offersDelivery` whose delivery ZIPs include the address ZIP are candidates | Unit + integration |
| `AC-FUL-02` | Pickup (REQ-F-012) | With `PICKUP`, stores with `offersPickup` are candidates sorted by distance; Order and Store Orders store `fulfillmentType` | Unit + integration |
| `AC-SEL-01` | Change store (REQ-F-013) | Shopper switches a Store Order to an eligible alternative → preview re-allocates, `assignment = SHOPPER_CHANGED`; non-eligible store → 422 `STORE_NOT_ELIGIBLE` | Integration + E2E |
| `AC-SEL-02` | Default store (REQ-F-013) | Signed-in shopper's default store gets the items first when eligible (`assignment = PROFILE_DEFAULT`) | Integration |
| `AC-PRF-01` | Guest checkout (REQ-F-014) | Guest completes checkout with name, email, phone (+ address for delivery); `Order.shopperId` null; no DOB/ID/payment fields accepted | E2E + schema review |
| `AC-PRF-02` | Shopper profile (REQ-F-014) | Register/login/logout/reset work; saved addresses, home ZIP and default store pre-fill checkout; anonymous cart merges on login | Integration + E2E |
| `AC-PRC-01` | One price (REQ-F-015) | A show product shows the same `owtletPrice` in catalog, cart and every Store Order; pinning a product without `owtletPrice` → 422 `PRICE_REQUIRED` | Unit + integration |
| `AC-HOLD-01` | Show-end hold (REQ-F-016) | A cart linked to a LIVE show never expires during the show and expires 30 min after End show (or `scheduledEndAt`) | Unit + integration (fake timers) |
| `AC-OOS-01` | Out-of-stock (REQ-F-017) | A line missing at the selected/eligible stores is flagged with ≥ 1 suggested store that has stock; choosing it updates the preview | Unit + E2E |
| `AC-DLH-01` | Delivery hours (REQ-F-018) | Delivery checkout shows `deliveryHoursToday`/`isDeliveringNow` (NY time); pickup shows store hours | Unit + component |
| `AC-RDR-01` | owtlet.live (REQ-F-019) | `https://owtlet.live/<path>` and `www.` return 301 to `https://owtlet.com/<path>` | curl on VPS |
| `AC-SEC-01` | Compliance | Database schema and all API payloads contain no DOB, government ID, or cannabis payment fields | Schema review + code review |
| `AC-DEP-01` | Deployment | App served over HTTPS at `owtlet.com` from the client VPS via Docker + Nginx; `/api/health` returns 200 | Manual + curl |
