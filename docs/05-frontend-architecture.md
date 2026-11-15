# 05 — Frontend Architecture

> Owned and maintained by `friday`.
>
> Owtlet is ONE Next.js app: UI (this doc) and backend Route Handlers (`docs/06-backend-architecture.md`) share `development/frontend/`.

---

## 1. Directory Structure (`development/frontend/`)
```text
development/frontend/
├── prisma/                         # schema.prisma, migrations, seed (see 07)
├── src/
│   ├── app/                        # Next.js App Router routes & layouts
│   │   ├── age-gate/page.tsx       # 21+ gate (SCR-001)
│   │   ├── (shop)/                 # Age-gated storefront group
│   │   │   ├── layout.tsx          # Header, cart drawer, footer
│   │   │   ├── page.tsx            # Home: live/upcoming show + featured (SCR-002)
│   │   │   ├── live/[showId]/page.tsx   # Live / replay (SCR-005)
│   │   │   ├── videos/page.tsx          # Shoppable videos (SCR-010)
│   │   │   ├── brands/page.tsx          # Brand list (SCR-011)
│   │   │   ├── brands/[slug]/page.tsx   # Brand storefront / channel (SCR-012)
│   │   │   ├── account/                 # Optional shopper profile: login, register, reset, profile, addresses (SCR-013)
│   │   │   ├── shop/page.tsx            # Catalog (SCR-003)
│   │   │   ├── shop/[category]/page.tsx
│   │   │   ├── product/[slug]/page.tsx  # Product detail (SCR-004)
│   │   │   ├── cart/page.tsx            # Cart (SCR-006)
│   │   │   ├── checkout/page.tsx        # Pickup/Delivery → split → change store → contact → handoff (SCR-007)
│   │   │   └── order/[id]/page.tsx      # Order status (SCR-008)
│   │   ├── admin/                  # Admin console (SCR-009): products, brands, dispensaries, shows, orders
│   │   ├── api/                    # Backend Route Handlers (owned by edith, see 06)
│   │   ├── layout.tsx              # Root layout: fonts (Dela Gothic One, Red Rose), QueryProvider
│   │   └── globals.css             # Jarvis/Owtlet CSS variables
│   ├── components/
│   │   ├── ui/                     # Jarvis design primitives (Button, Input, Card, Dialog, Skeleton, Badge)
│   │   └── modules/
│   │       ├── age-gate/           # AgeGateDialog, ExitScreen
│   │       ├── live/               # TerrificEmbed, ShowRail, LiveBadge
│   │       ├── catalog/            # ProductCard, ProductGrid, FilterBar, StrainBadge
│   │       ├── cart/               # CartDrawer, CartLine, CartTimer
│   │       ├── checkout/           # FulfillmentToggle, ZipForm, AddressForm, ContactForm, SubOrderCard, StorePickerSheet, UnfulfillableList, StoreHours, HandoffButton
│   │       ├── brands/             # BrandGrid, BrandCard, BrandHero
│   │       ├── account/            # LoginForm, RegisterForm, ProfileForm, AddressList, DefaultStorePicker
│   │       └── admin/              # DataTable, ProductForm, BrandForm, BrandDispensaryPicker, DispensaryForm, HoursEditor (Store/Delivery), ShowForm
│   ├── hooks/                      # useCart, useProducts, useBrands, useCheckoutPreview, useShopper, useTerrificBridge
│   ├── lib/                        # api-client.ts, zod schemas (shared), format (USD), terrific.ts
│   ├── server/                     # Backend domain services (edith) — never imported by client components
│   ├── stores/                     # Zustand: cart.store.ts, checkout.store.ts (fulfillment, overrides), ui.store.ts
│   ├── middleware.ts               # 21+ gate + /admin auth guard (+ /account requires owt_shopper)
│   └── types/                      # api.generated.ts (DTOs from 08)
├── public/                         # Logo, favicon, placeholders
└── package.json
```

---

## 2. State Management Strategy
- **Server State**: Managed exclusively by **TanStack Query** — keys: `['products', filters]`, `['product', slug]`, `['cart']`, `['checkout-preview', fulfillmentType, zip, overrides]`, `['shows', status, format]`, `['brands']`, `['brand', slug]`, `['account']`, `['order', id]`.
- **Client State**: **Zustand** `cart.store.ts` holds `cartId`, `itemCount`, `expiresAt`, `hold` (`LIVE_SHOW` | `INACTIVITY`, for `CartTimer`), drawer open state; `checkout.store.ts` holds `fulfillmentType`, `zip`, `preferredDispensaryId`, `itemOverrides`; it is hydrated from `GET /api/cart` and updated optimistically by the Terrific bridge. `ui.store.ts` for filters/modals.
- **Form State**: Managed via **React Hook Form** paired with **Zod** schema resolvers (ZIP form, admin forms) — schemas shared with Route Handlers from `src/lib/schemas`.

---

## 3. API Communication Layer
- Centralized fetch wrapper `src/lib/api-client.ts` against same-origin `/api` (cookies carry the anonymous cart session and age cookie plus optional `owt_shopper` — no Bearer token for shoppers). Admin requests use the HTTP-only admin session cookie.
- Unwraps the standard envelope (`docs/architecture-spine.md` §2); 401 on `/admin` → redirect to `/admin/login`; 451 `AGE_GATE_REQUIRED` → redirect to `/age-gate`.
- Server Components fetch via domain services directly (no HTTP hop); Client Components use TanStack Query + `api-client`.

---

## 4. Terrific Embed Component (`components/modules/live/TerrificEmbed.tsx`)
- Client component, rendered only after the age gate.
- **Order matters**: set `window.terrificLiveSettings` **before** injecting `https://terrific.live/terrific-sdk.js?storeId=BX2hWAVam9JjsFhXP5ZF`.
- Renders `<div data-source="terrific" embedding-id="Cki70GhqvLgWGhJbSxg2" />` (embedding id configurable via `NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID`).

```ts
window.terrificLiveSettings = {
  cartSyncConfig: {
    cartSyncHandler: async ({ action, cartProducts }) => {
      // action: 'addProductToCart' | 'removeProductFromCart' | 'updateProductInCart'
      await terrificBridge.sync(action, cartProducts, { source, liveShowId }); // all pinned products are cannabis → Owtlet cart (/api/cart/items); source = terrific_live | terrific_replay | terrific_video; unmapped → error toast
    },
  },
  goToCheckoutConfig: {
    goToCheckoutHandler: async ({ cartProducts, coupons, redirectUrl }) => {
      await terrificBridge.reconcile(cartProducts);   // make sure server cart matches player cart
      router.push('/checkout');                       // cannabis checkout → ZIP split → dispensary handoff; awaited by the SDK
      return true;
    },
  },
};
```
- Also subscribes (when `window.terrificLive` is ready) to `cart-change-notification`, `GoToCheckout`, `Navigate` events to keep the Zustand cart badge in sync and handle in-player navigation.
