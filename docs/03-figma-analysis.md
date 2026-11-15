# 03 — Figma & UI Screen Inventory

> Maintained by `jarvis`.

---

## 1. Design References
- **Figma File URL**: **N/A — no Figma provided yet.** Built using the Jarvis Design System with the Owtlet brand taken from the `owtlet.shop` Shopify theme and the `owtlet.com` launch page (see `docs/04-design-system.md`). If the client supplies a Figma file later, update this section.
- **Target Aesthetic**: Owtlet brand — deep forest-green ink, mint accents, bold display headings (Dela Gothic One), dark "live" surfaces for video.

---

## 2. Screen & Page Inventory
| Screen ID | Page / Route | Core Purpose | Key Components | Required UI States |
|---|---|---|---|---|
| `SCR-001` | `/age-gate` | 21+ verification | AgeGateDialog, ExitScreen | Default, Focus, Blocked (under-21) |
| `SCR-002` | `/` | Home + live / upcoming shows | TerrificEmbed, ShowRail, FeaturedProducts | Default, Loading Skeleton, Empty (no live show), Error, Responsive |
| `SCR-003` | `/shop`, `/shop/[category]` | Cannabis catalog | ProductGrid, FilterBar (category, strain, THC), SearchInput | Default, Skeleton, Empty, Error, Responsive |
| `SCR-004` | `/product/[slug]` | Product detail + per-store availability | ProductGallery, StrainBadge, StoreAvailabilityList, AddToCartButton | Default, Skeleton, Out-of-stock, Error |
| `SCR-005` | `/live/[showId]` | Live show / shoppable replay | TerrificEmbed, PinnedProducts | Default, Loading, Ended→Replay, Error |
| `SCR-006` | `/cart` | Cannabis cart | CartLineList, CartTimer (show-end hold / 30 min) | Default, Empty, Expired, Held-for-show, Error |
| `SCR-007` | `/checkout` | Pickup/Delivery → store split → change store → contact | FulfillmentToggle, ZipForm/AddressForm, SubOrderCard (hours, delivery hours, distance, Change store), StorePickerSheet, UnfulfillableList (suggestions), ContactForm, HandoffButtons | Default, Validation, No-coverage, Out-of-stock, Loading |
| `SCR-008` | `/order/[id]` | Single confirmation screen for all Store Orders | SubOrderStatusList, "Save my info" (guest) | Default, Pending, Confirmed |
| `SCR-009` | `/admin/*` | Admin console (products, brands, dispensaries, shows, orders) | DataTables, Forms, HoursEditor (Store/Delivery), BrandDispensaryPicker | Default, Skeleton, Empty, Error |
| `SCR-010` | `/videos`, `/videos/[id]` | Shoppable videos | VideoGrid, TerrificEmbed | Default, Skeleton, Empty, Error |
| `SCR-011` | `/brands` | Brand storefront list | BrandGrid, BrandCard | Default, Skeleton, Empty |
| `SCR-012` | `/brands/[slug]` | Brand storefront (channel) | BrandHero, ProductGrid, ShowRail, "Fulfilled by" chips | Default, Skeleton, Empty, 404 |
| `SCR-013` | `/account/*` | Optional shopper profile | LoginForm, RegisterForm, ResetForm, ProfileForm, DefaultStorePicker, AddressList, OrderHistory | Default, Validation, Loading, Error |

> Mobile layouts are responsive-web only; there is no native app (see `09-mobile-architecture.md`).

---

## 3. Responsive Breakpoints
- **Mobile**: `< 640px` (single column, drawer navigation, full-width video)
- **Tablet**: `640px - 1024px` (adaptive 2-column grid)
- **Desktop**: `> 1024px` (video + pinned products side panel, multi-column product grid, full admin tables)
