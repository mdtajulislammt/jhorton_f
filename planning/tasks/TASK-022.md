  # TASK-022: Storefront Visual Redesign (Synthesized Direction v3)

> **Status**: `DONE`  
> **Assignee**: `jarvis` (UI/UX) + `friday` (Web)  
> **Priority**: `P1` (High)  
> **Complexity Level**: `STANDARD`  
> **Dependencies**: TASK-003 (brand tokens), TASK-006 (catalog), TASK-007 (cart), TASK-008 (live)  
> **Design reference**: https://claude.ai/artifact/QbZH2VukL1aEvHzqcU5AqB (v3, approved 2026-11-16)

---

## 1. Objective
Redesign the customer-facing storefront using a synthesis of three competitor benchmarks (Weedable = live/social energy, Leafly = product information, Dutchie = fast commerce) in Owtlet branding. Keep every existing feature, route and data flow. No new features that the app does not already support.

## 2. Hard Constraints
- **Frontend only.** All work in `development/frontend/`. No change in `development/backend/` (ADR-016).
- **Data layer untouched.** Page-level data queries stay exactly as they are. New components are presentational and receive data via props. No new `prisma` or `@/server` runtime imports in components (type-only imports of existing DTOs are allowed).
- **Theme-ready.** No hardcoded colors/fonts in components; only tokens from `tailwind.config.ts` / `globals.css`.
- **No dead buttons.** Header Pickup/Delivery toggle and ZIP use the existing persisted `checkout.store`; ZIP check calls `GET /api/dispensaries`.
- **6 UI states** on every new card/rail. Domain lexicon copy only.
- **Compliance.** No imagery showing consumption; no third-party brand packaging.
- Admin panel out of scope.

## 3. Scope / Phases
1. Foundation: tokens (strain colors, mono font, motion keyframes), `ui/` updates (Button, Badge), new `SectionHeader`, `StrainBadge`.
2. Shell: `StoreHeader` (search, ZIP, fulfillment toggle, category nav), `StoreFooter` (dark).
3. Home: hero (photo banner, pinned product), strain ticker, tonight lineup, pinned products, photo categories, replays/videos, how it works, coverage band with ZIP check.
4. Listing: `ProductCard` (strain-tinted photo, specs, Owtlet Price, quick add), `ShowCard`.
5. Remaining pages: shop filter rail, product detail, live show page, cart, age gate, checkout/account token pass.
6. Verify: typecheck, tests, `scripts/verify-task.sh TASK-022`.

## 4. Assets
Photos in `public/brand/photos/` (Unsplash License, see `CREDITS.md` there). Replace with client product photography when available.

## 5. Acceptance
- [x] Typecheck passes (only pre-existing, unrelated error in `src/server/shopper-account/edge-crypto.ts`)
- [x] Existing unit tests pass: 451/451 (catalog test updated for new ProductCard copy + `useCart` mock)
- [x] No hex colors in new/changed components; ESLint clean on changed files
- [x] `verify-task.sh TASK-022` passes
- [x] Visual check: 14 pages × desktop (1440) + phone (390) via Playwright on a fresh dev server; no horizontal overflow, no page errors

## 6. Progress log
- **2026-11-16** — Phases 1–4 done:
  - Tokens: strain colors, `surface-muted`, `font-mono` (JetBrains Mono via next/font), `marquee`/`float`/`live-ring` animations. `.dark` ring → Volt for focus contrast.
  - `ui/`: Button `ink` + `outline-inverse` variants (hex removed), Badge `replay` + `upcoming`, new `StrainBadge`, `SectionHeader`, `FallbackImage` (handles pre-hydration image errors).
  - Shell: `StoreHeader` (search → `/shop?q=`, ZIP + Pickup/Delivery via `checkout.store`, active nav), dark `StoreFooter`.
  - Home: `HomeHero` (photo banner, pinned product quick add), `StrainTicker`, `ShowLineup` (countdowns), Shop the stream (Terrific player kept for AC-LIVE-01 + pinned ProductCards), `CategoryShowcase`, Replays & Videos rail, `HowItWorks`, brand CTA, `CoverageBand` (ZIP check via `GET /api/dispensaries`).
  - `ProductCard` (strain tint, specs, Owtlet Price, quick add) and `ShowCard` (photo-forward) — also restyle /shop, /live, /videos, brand pages.
  - Page data queries in `app/page.tsx` unchanged; no backend changes.
- **2026-11-16** — Phase 5 done:
  - Shop: `CatalogView` rebuilt as a two-column layout (breadcrumb header, category strip, sticky `FilterRail` on desktop / `MobileFilterSheet` on mobile, active filter chips, transition skeleton, load-more error state). Old `filter-bar.tsx` replaced by `filter-rail.tsx`. Fixed: category filter on `/shop/[category]` set `?category=`, which that route ignores; categories now link to `/shop/[slug]` and keep the other filters. Load more now sends the route category. Quick add on catalog cards now adds to cart (it used to only navigate). `shop/loading.tsx` added.
  - Product detail: new `ProductBuyBox` (price, quantity stepper, Add to Cart through the existing `useCart` with the selected store as `preferredDispensaryId`). Before this the page had no add-to-cart. Selection is shared with the availability list via `ProductPurchaseProvider`. `StoreAvailabilityList` restyled, supports controlled selection, `alert()` replaced by an inline error, hardcoded green/red/amber removed. `product/[slug]/loading.tsx` added.
  - Live show page: dark stage band, Live/Replay/Upcoming badges, scheduled time (ET), numbered how-it-works steps, brand link, pinned-products empty state. Prisma query unchanged.
  - Cart: page, `CartLine` (photo fallback, strain tint, pill stepper), `CartTimer`, drawer restyled; error state with retry added; duplicate `CartDrawer` mount removed (StoreHeader already mounts it).
  - Age gate: semantic tokens with a `dark` scope instead of raw `owtlet-*`/`white` classes; still image-free because it shows before 21+ verification.
  - Checkout/account/order: raw emerald/amber/blue/`owtlet-volt` classes swapped for tokens.
  - Tokens: `tailwind.config.ts` colors wrapped in `color-mix(... <alpha-value> ...)`. Before this, every opacity modifier on a CSS-variable color (`bg-ink/85`, `bg-primary/20`, …) produced no CSS. `destructive` added as an alias of `--danger` (used in 11 files but never defined).
  - Checks: typecheck clean apart from the known `edge-crypto.ts` error (it also stops `next build`); 451/451 tests; ESLint 0 errors; `verify-task.sh TASK-022` passed.
- **Next**: visual QA on a restarted dev server (shop, product, live, cart, checkout, age gate in light and dark). Because of the token fix, effects that used to be invisible (translucent header, tinted chips, hover tints) now render, so check pages outside this task too.
- **2026-11-16** — Visual QA done (Playwright screenshots of age gate, home, shop, filtered/empty shop, product ×2, live index/show, cart, checkout, account, brands, videos at 1440 and 390 wide). Fixes:
  - **Brand fonts never rendered.** The font stacks used `var(--font-dela)` / `var(--font-rose)`, which are undefined, and one undefined `var()` invalidates the whole declaration. Removed them from `tailwind.config.ts` and `globals.css`. Dela Gothic One + Red Rose now load across the site.
  - Filter rail: `fieldset`/`legend` drew the border through the heading; now a labelled group with a heading.
  - Product ZIP placeholder shortened (was clipped).
  - Catalog quick-add for PER_STORE products is now a link to the product page (store choice), because the cart prices store-less PER_STORE lines at $0.00 (see TASK-023).
  - Mint-on-white text links (about 1.6:1 contrast) on login/register/reset, order history and order page → Ink text with a Mint underline; account badges → Ink text.
  - Checks: 451/451 tests, typecheck (only known `edge-crypto.ts` error), ESLint 0 errors, `verify-task.sh TASK-022` passed.
  - Found and logged in **TASK-023** (outside this task's scope): Terrific player never loads because `owt_age` is HttpOnly and the embed reads it client-side; cart DTO prices PER_STORE lines without a store at $0.00.
- **2026-11-16** — Pixel pass against the design v3 artifact (rendered the reference and our pages at the same width, 1198/390, side by side):
  - Content column now 1120px with 28px gutters (`max-w-content` token), as in the reference `.in`.
  - Home: Terrific player moved into its own dark `LiveStage` band (AC-LIVE-01 kept); new 4-up "Pinned in today's shows" grid; Brand Storefronts is now a 3-card grid (banner, initials tile with logo fallback, "Fulfilled by" partner stores, product count, next show; one read-only brand query added to `app/page.tsx`); "How Owtlet works" uses the reference illustrations drawn with tokens; section headers clamp to 34px with 56ch descriptions; hero sizes (62px headline, 44ch intro, 14.5px buttons, "Add").
  - Header: 14px rows, 23px logo, 46px search with a working `/` shortcut, 42px icon buttons; Delivery/Pickup toggle now visible on phones.
  - Shop: reference layout — white rail card with checkboxes, THC % dual range (wired to the existing `minThc`/`maxThc` API params, which the pages never passed), 26px title + mono count, Ink filter chips; big header band and category strip removed (header nav has categories). Sort and fulfillment filters from the mockup left out: the API has neither, and a non-working control would break the No-Dead-Button rule.
  - Product card: brand-only header, strain chip only when the name doesn't include it, potency shown as `24.5%` (new `formatPct`) across card, hero, ticker and product page.
  - **Terrific player fix:** the SDK reads the store ID from a `storeId` attribute on its script tag (`document.currentScript.getAttribute('storeId')`), not from the `?storeId=` query. The embed now sets the attribute; before this every page logged `storeId null` + 400 and no stream loaded. The stream now loads, but as Terrific's floating mini-player (bottom-right) rather than inside our player box — that comes from the embedding's configuration in the Terrific dashboard.
  - Checks: typecheck 0 errors, 461/461 tests, ESLint 0 errors, `verify-task.sh TASK-022` passed, no horizontal overflow at 390/1198/1440 on home, shop, product, cart, live.

- **2026-11-17** — Reference re-check (artifact rendered side by side with home at 1198 and 390 wide): layout, spacing and type already matched. Copy aligned to the reference: header search "Search strains, brands, products and shows"; card availability "Available at N stores near you"; ZIP results "Good news: delivery and pickup are available in {zip} ({area})." / "We don't deliver to {zip} yet. We currently serve …". Kept on purpose: footer "Compliance" column instead of the mockup's "Legal" (Terms/Privacy/Responsible use pages don't exist, so those links would be dead); mockup brand/show/product names are example data, so the page keeps showing DB data. Checks: 463/463 tests, ESLint clean, typecheck clean, `verify-task.sh TASK-022` passed.
