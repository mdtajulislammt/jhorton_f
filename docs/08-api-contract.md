# 08 — API Contracts (Backend & Frontend Bridge)

> Maintained by `edith`. Consulted by `friday`. **Scope**: cannabis-only — no Shopify/accessory endpoints (accessories are a separate `owtlet.shop` project). (`thor` N/A — no mobile app.)

---

## 1. Global Conventions
- **Base URL**: `/api` (same-origin Next.js Route Handlers)
- **Standard Headers**:
  - `Content-Type: application/json`
  - Shoppers: no `Authorization` header — the HTTP-only cookies `owt_age` (21+ attestation), `owt_cart` (cart session) and, for shoppers with an optional profile, `owt_shopper` (signed session, 30 days) are sent automatically. Guest checkout needs no account.
  - Admin: HTTP-only `owt_admin` session cookie.
  - Store webhooks: `X-Owtlet-Signature: sha256=<hex HMAC of raw body with Dispensary.webhookSecret>`, `X-Owtlet-Dispensary: <dispensaryId>`, `X-Owtlet-Timestamp: <unix seconds>` (rejected if older than 5 minutes; the HMAC covers `timestamp + "." + rawBody`).
- **Envelope**: every response uses the spine envelope:
```json
{ "success": true, "data": {}, "message": "Operation completed", "timestamp": "2026-11-15T06:00:00.000Z" }
```
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "zip must be a 5-digit NY ZIP", "details": [] }, "timestamp": "2026-11-15T06:00:00.000Z" }
```
- **Error codes**: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CART_EXPIRED` (410), `AGE_GATE_REQUIRED` (451), `NO_COVERAGE` (422), `OUT_OF_STOCK` (409), `INVALID_SIGNATURE` (401), `UNMAPPED_PRODUCT` (404 — Terrific id / SKU / productId not mapped to an active Owtlet product), `UNFULFILLABLE_ITEMS` (422), `PREVIEW_STALE` (409 — price/stock changed since preview), `UPSTREAM_ERROR` (502 — handoff provider), `STORE_NOT_ELIGIBLE` (422 — chosen store doesn't offer the fulfillment type / doesn't deliver to the ZIP / isn't assigned to the brand channel), `ITEM_NOT_AT_STORE` (422 — chosen store has no stock for a line; response carries `suggestions`), `EMAIL_TAKEN` (409), `INVALID_CREDENTIALS` (401), `PRICE_REQUIRED` (422 — admin pins a product without `owtletPrice`).
- **Health**: `GET /api/health` (public, no age gate) → `{ success: true, data: { db: "up", version: "<git-sha>" } }` — used by Docker/Nginx health checks.
- **Money**: strings with 2 decimals in USD (`"45.00"`).

---

## 2. Age Gate

### 2.1 Verify Age
- **Endpoint**: `POST /api/age-verify`
- **Access**: Public (only endpoint reachable without `owt_age`, besides webhooks)
- **Request Body**:
```json
{ "confirmed21Plus": true }
```
- **Success Response (200 OK)** — sets `owt_age` (signed, HTTP-only, Secure, SameSite=Lax, 30 days):
```json
{ "success": true, "data": { "verified": true, "expiresAt": "2026-12-15T06:00:00.000Z" }, "message": "Age verified", "timestamp": "..." }
```
- **Error Response (403 Forbidden)** when `confirmed21Plus: false`:
```json
{ "success": false, "error": { "code": "FORBIDDEN", "message": "You must be 21 or older to enter Owtlet.", "details": [] }, "timestamp": "..." }
```

---

## 3. Products

### 3.1 List Products
- **Endpoint**: `GET /api/products?category=flower&strainType=HYBRID&minThc=18&q=blue&brand=<slug>&cursor=<id>&limit=24`
- **Access**: Age-verified
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid", "slug": "blue-dream-3-5g", "name": "Blue Dream 3.5g",
        "category": { "slug": "flower", "name": "Flower" },
        "strain": { "name": "Blue Dream", "type": "HYBRID" },
        "thcPercent": "24.10", "cbdPercent": "0.20", "weightGrams": "3.50",
        "imageUrls": ["https://.../blue-dream.jpg"],
        "brand": { "slug": "grand-national", "name": "Grand National" },
        "priceMode": "OWTLET", "owtletPrice": "45.00",
        "fromPrice": "45.00", "availableAtCount": 3
      }
    ],
    "nextCursor": "uuid-or-null"
  },
  "message": "OK", "timestamp": "..."
}
```

### 3.2 Product Detail
- **Endpoint**: `GET /api/products/{slug}?zip=11201`
- **Success Response (200 OK)**: product fields above + `description`, `availability: [{ "dispensaryId", "dispensaryName", "price": "45.00", "inStock": true, "deliversToZip": true, "offersPickup": true, "distanceMiles": 1.8 }]`.
- **Pricing**: `priceMode = "OWTLET"` when `owtletPrice` is set (every show product) → one price, `availability[].price` equals it everywhere. `priceMode = "PER_STORE"` for non-show products without `owtletPrice` → `fromPrice` = lowest in-stock store price.

---

## 4. Cannabis Cart (Owtlet — PostgreSQL)

### 4.1 Get Cart
- **Endpoint**: `GET /api/cart`
- **Success Response (200 OK)**:
```json
{ "success": true, "data": {
  "id": "uuid", "status": "ACTIVE", "expiresAt": "2026-11-15T06:30:00.000Z",
  "hold": { "reason": "LIVE_SHOW", "liveShowId": "uuid", "showStatus": "LIVE" },
  "items": [ { "productId": "uuid", "name": "Blue Dream 3.5g", "quantity": 1, "priceMode": "OWTLET", "unitPrice": "45.00", "fromPrice": "45.00", "source": "terrific_live", "channelBrand": null } ],
  "itemCount": 1, "estimatedSubtotal": "45.00"
}, "message": "OK", "timestamp": "..." }
```
- `hold.reason`: `LIVE_SHOW` (held while the linked show is live, then until `endedAt + 30 min`) or `INACTIVITY` (30 min after the last change). See docs/07 §2.2.
- **Error (410)** `CART_EXPIRED` when the hold lapsed (a new empty cart is issued).

### 4.2 Add / Update / Remove Items (Terrific payload shape)
- **Endpoints**: `POST /api/cart/items` (add), `PATCH /api/cart/items` (update qty), `DELETE /api/cart/items` (remove)
- **Request Body** — mirrors Terrific `cartSyncHandler({ action, cartProducts })`; the catalog uses the same shape with `source: "catalog"`:
```json
{
  "action": "addProductToCart",
  "source": "terrific_live",
  "liveShowId": "uuid-optional",
  "channelBrandSlug": "grand-national-optional",
  "cartProducts": [
    { "externalId": "terrific-prod-123", "productId": "uuid-optional", "sku": "OWT-BD-35", "quantity": 1, "preferredDispensaryId": "uuid-optional" }
  ]
}
```
  - `action ∈ addProductToCart | updateProductInCart | removeProductFromCart` (must match the HTTP method).
  - Each product is resolved by `productId`, else `terrificProductId = externalId`, else `sku`; unresolved → `404 UNMAPPED_PRODUCT` with the ids in `error.details` (nothing is added for those ids).
  - `quantity`: integer 1–10 per line (0 on `updateProductInCart` = remove); max 30 lines per cart.
  - The catalog is cannabis-only, so every resolved product is accepted (live shows pin cannabis products only).
  - `source ∈ catalog | brand_storefront | terrific_live | terrific_replay | terrific_video`. `liveShowId` (from the Terrific embed context) links the cart to a LIVE show for the show-end hold. `channelBrandSlug` is sent by brand storefront pages → the line is restricted to that brand's partner stores at checkout.
- **Success Response (200 OK)**: full cart (as 4.1); `lastActivityAt` = now and `expiresAt` recomputed (docs/07 §2.2).

### 4.3 Clear Cart
- **Endpoint**: `DELETE /api/cart` → `200` with empty cart.

---

## 5. Accessories — Removed (out of scope)
Accessories are handled by the separate `owtlet.shop` Shopify project. This API has no Shopify endpoints (section number kept so later section numbers stay stable).

---

## 6. Dispensaries
- **Endpoint**: `GET /api/dispensaries?zip=11201&fulfillment=DELIVERY|PICKUP&brand=<slug-optional>`
- DELIVERY → stores with `offersDelivery` whose `coverageZips` contain the ZIP; PICKUP → all active stores with `offersPickup`, sorted by distance from the ZIP; `brand` limits to that brand's assigned stores.
- **Success Response (200 OK)**:
```json
{ "success": true, "data": { "zip": "11201", "region": "BROOKLYN", "items": [
  { "id": "uuid", "name": "Example Cannabis Co. Brooklyn", "offersPickup": true, "offersDelivery": true,
    "isOpenNow": true, "hoursToday": { "opensAt": "10:00", "closesAt": "22:00" },
    "isDeliveringNow": true, "deliveryHoursToday": { "opensAt": "11:00", "closesAt": "21:00" },
    "distanceMiles": 1.8, "handoffChannel": "RETAILER_PAGE" }
] }, "message": "OK", "timestamp": "..." }
```
- **Error (422)** `NO_COVERAGE` — ZIP outside Manhattan / Queens / Brooklyn / Westchester / Long Island (DELIVERY only; PICKUP accepts any 5-digit ZIP for distance sorting).

---

## 7. Live Shows
- **Endpoint**: `GET /api/live-shows?status=LIVE|SCHEDULED|REPLAY&format=LIVE_SHOW|SHOPPABLE_VIDEO&brand=<slug>`
- **Success Response (200 OK)**: `items: [{ "id", "title", "format": "LIVE_SHOW", "status": "LIVE", "scheduledAt", "scheduledEndAt", "endedAt", "thumbnailUrl", "embeddingId": "Cki70GhqvLgWGhJbSxg2", "terrificShowId", "brand": { "slug", "name" } | null, "products": [{ "productId", "slug", "name", "terrificProductId", "owtletPrice": "45.00" }] }]`

---

## 8. Orders (parent + sub-orders)

### 8.1 Preview Distribution
- **Endpoint**: `POST /api/orders/preview`
- **Request Body** (uses current cart):
```json
{
  "fulfillmentType": "DELIVERY",
  "zip": "11201",
  "preferredDispensaryId": "uuid-optional",
  "itemOverrides": [ { "productId": "uuid", "dispensaryId": "uuid-B" } ]
}
```
  - Store choice order: `itemOverrides` (shopper changed the store for specific lines) → `preferredDispensaryId` (shopper changed the store for the whole cart, or the profile default store when signed in) → greedy auto allocation for the rest (most items first).
  - Each line is only allocated to stores eligible for `fulfillmentType` + ZIP and, for brand-storefront lines, assigned to that brand.
  - An override to a non-eligible store → `422 STORE_NOT_ELIGIBLE`; an override to a store without stock → line returned in `unfulfillable` with reason `NOT_AT_SELECTED_STORE` + `suggestions`.
- **Success Response (200 OK)**:
```json
{ "success": true, "data": {
  "zip": "11201",
  "subOrders": [
    { "dispensaryId": "uuid-A", "dispensaryName": "Store A", "assignment": "AUTO", "channelBrand": null,
      "isOpenNow": true, "hoursToday": { "opensAt": "10:00", "closesAt": "22:00" },
      "deliveryHoursToday": { "opensAt": "11:00", "closesAt": "21:00" }, "distanceMiles": 1.8,
      "items": [ { "productId": "uuid", "name": "Blue Dream 3.5g", "quantity": 1, "unitPrice": "45.00", "priceMode": "OWTLET" } ], "subtotal": "45.00", "handoffChannel": "LEAFLY",
      "alternatives": [ { "dispensaryId": "uuid-B", "dispensaryName": "Store B", "canSupplyAll": true, "missingProductIds": [], "distanceMiles": 3.2, "isOpenNow": true } ] }
  ],
  "unfulfillable": [ { "productId": "uuid", "name": "Rare Rosin 1g", "reason": "NOT_IN_STOCK_FOR_ZIP",
      "suggestions": [ { "dispensaryId": "uuid-C", "dispensaryName": "Store C", "fulfillmentTypes": ["PICKUP"], "distanceMiles": 6.4 } ] } ],
  "total": "45.00",
  "previewHash": "sha256-of-allocation"
}, "message": "OK", "timestamp": "..." }
```

### 8.2 Create Order
- **Endpoint**: `POST /api/orders`
- **Request Body**:
```json
{
  "fulfillmentType": "DELIVERY", "zip": "11201",
  "preferredDispensaryId": "uuid-optional", "itemOverrides": [],
  "contact": { "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "phone": "+12125550123" },
  "deliveryAddress": { "line1": "120 Atlantic Ave", "line2": "Apt 4", "city": "Brooklyn", "state": "NY", "zip": "11201" },
  "saveToProfile": false,
  "previewHash": "sha256-of-preview"
}
```
  - `contact` always required (guest or signed in; pre-filled from the profile). `deliveryAddress` required for DELIVERY (its `zip` must equal `zip`), ignored for PICKUP. No DOB, ID or payment fields are accepted (`.strict()` schema).
  - Rejects with `409 PREVIEW_STALE` if stock/prices changed since preview, `422 UNFULFILLABLE_ITEMS` if the cart still contains unfulfillable items, `410 CART_EXPIRED` if the cart expired)
- Idempotent per cart: a repeated call for an already checked-out cart returns the existing order (`200`).
- **Success Response (201 Created)**:
```json
{ "success": true, "data": { "orderId": "uuid", "orderNumber": "OWT-100245", "status": "PENDING",
  "subOrders": [ { "id": "uuid-s1", "dispensaryId": "uuid-A", "status": "PENDING", "subtotal": "45.00" } ] }, "message": "Order created", "timestamp": "..." }
```

### 8.3 Get Order
- **Endpoint**: `GET /api/orders/{id}` → order (incl. `fulfillmentType`) + sub-orders with `status`, `assignment`, `handoffUrl`, `confirmationRef`, `confirmedAt` — the single confirmation screen for all Store Orders. Access: same `owt_cart` session, or the owning signed-in shopper.

---

## 9. Cannabis Checkout Handoff
- **Endpoint**: `POST /api/checkout/handoff`
- **Request Body**: `{ "orderId": "uuid" }`
- **Success Response (200 OK)**:
```json
{ "success": true, "data": { "handoffs": [
  { "subOrderId": "uuid-s1", "channel": "RETAILER_PAGE", "url": "https://store-a.example/order?ref=uuid-s1", "dispensaryName": "Store A" }
] }, "message": "Ready for handoff", "timestamp": "..." }
```
- Sets each `SubOrder.status = HANDED_OFF`. **No payment or ID data is ever sent to or received by Owtlet.**
- Contact / delivery info collected on owtlet.com is passed to the partner **only in the form the provider supports** (Leafly API or retailer URL parameters — Q-001/Q-002); the default `RETAILER_PAGE` template carries the order reference only. Every handoff tells the shopper they'll confirm details, pay and show ID with the store.
- `channel: "LEAFLY"` is **pending integration** (Q-001): the provider interface exists, but no Leafly API shape is assumed until the client provides partnership/API details.

---

## 10. Store → Owtlet Confirmation Webhook
- **Endpoint**: `POST /api/webhooks/store-confirmation`
- **Access**: Dispensary (HMAC `X-Owtlet-Signature`), age gate not applied.
- **Request Body**:
```json
{ "subOrderId": "uuid-s1", "status": "CONFIRMED", "confirmationRef": "STORE-A-88812", "confirmationUrl": "https://store-a.example/orders/88812" }
```
- **Success Response (200 OK)**: `{ "success": true, "data": { "subOrderId": "uuid-s1", "status": "CONFIRMED", "orderStatus": "CONFIRMED" }, ... }`
- `status ∈ CONFIRMED | REJECTED`; `confirmationRef` required when `CONFIRMED`.
- **Error (401)** `INVALID_SIGNATURE` (bad signature or timestamp older than 5 min). **Error (404)** `NOT_FOUND`. **Error (409)** when an already-confirmed sub-order receives a different `confirmationRef`. Idempotent on `(subOrderId, confirmationRef)`.
- Alternative for stores without webhook capability: signed link `GET /api/webhooks/store-confirmation?token=<jwt>` emailed/linked to the store (format confirmed with client, Q-002).

---

## 11. Admin (session-guarded, `/api/admin/*`)
`POST /api/admin/login` · `GET|POST|PATCH|DELETE /api/admin/products` · `PUT /api/admin/inventory` (bulk price/stock per dispensary) · `GET|POST|PATCH /api/admin/dispensaries` (pickup/delivery flags, delivery ZIPs, STORE + DELIVERY hours, handoff config) · `GET|POST|PATCH /api/admin/brands` · `PUT /api/admin/brands/{id}/dispensaries` (assign partner stores to a brand) · `GET|POST|PATCH /api/admin/live-shows` (+ product pinning; pinned products need `owtletPrice` → else `422 PRICE_REQUIRED`) · `POST /api/admin/live-shows/{id}/start` · `POST /api/admin/live-shows/{id}/end` (sets `endedAt`, recomputes held carts) · `GET /api/admin/orders` · `PATCH /api/admin/sub-orders/{id}` (manual status).

---

## 12. Brand Storefronts (channels)
- `GET /api/brands` → `items: [{ "slug", "name", "logoUrl", "bannerUrl" }]` (active brands, `sortOrder`).
- `GET /api/brands/{slug}` → `{ brand, products: [ProductCard], dispensaries: [{ "id", "name" }], shows: [LiveShow] }`; 404 if inactive.
- Adding from a storefront uses `POST /api/cart/items` with `source: "brand_storefront"` and `channelBrandSlug`.

---

## 13. Shopper Account (optional profile — guest checkout never requires it)
| Endpoint | Body / response |
|---|---|
| `POST /api/account/register` | `{ email, password (≥ 10 chars), firstName?, lastName?, phone?, homeZip? }` → sets `owt_shopper`; attaches the current cart; `409 EMAIL_TAKEN` |
| `POST /api/account/login` | `{ email, password }` → `owt_shopper`; merges the anonymous cart into the shopper's cart; `401 INVALID_CREDENTIALS` (5/min rate limit) |
| `POST /api/account/logout` | clears `owt_shopper` |
| `GET / PATCH /api/account/profile` | `{ firstName, lastName, phone, homeZip, defaultDispensaryId }` (default store must be an active dispensary) |
| `GET / POST /api/account/addresses`, `PATCH / DELETE /api/account/addresses/{id}` | `{ label, line1, line2, city, state: "NY", zip, isDefault }` |
| `POST /api/account/password-reset/request` | `{ email }` → always 200; emails a 1-hour token (SMTP sender pending Q-006) |
| `POST /api/account/password-reset/confirm` | `{ token, password }` |
| `GET /api/account/orders` | the shopper's orders (newest first) |
- Order create with `saveToProfile: true` (signed in) stores the contact + delivery address on the profile; a guest gets a "Save my info for next time" prompt on `/order/[id]` that opens register pre-filled.

---

## 14. Contract Change Protocol
1. Edith updates endpoint contract here first.
2. Friday updates Next.js query hooks, Zod schemas and DTO types (`src/types/api.generated.ts`).
3. Thor updates Flutter API models (if mobile is active) — N/A for Owtlet.
