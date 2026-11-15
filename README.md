# 🛡️ Avengerse: Client Requirements & Project Brief

> 🚀 **দ্রুত ব্যবহার ও কমান্ড নির্দেশিকা (Quick Command Reference)**:
> - 🇧🇩 **ব্যবহার নির্দেশিকা ও কমান্ড ফ্লো (বাংলা)**: [HOW_TO_USE_BN.md](HOW_TO_USE_BN.md)
> - 🔄 **চলমান প্রজেক্টে ব্যবহারের গাইড (বাংলা)**: [HOW_TO_USE_IN_EXISTING_PROJECT_BN.md](HOW_TO_USE_IN_EXISTING_PROJECT_BN.md)
> - 📖 **Developer Guide / How to Use (English)**: [HOW_TO_USE_EN.md](HOW_TO_USE_EN.md)
> - 🔄 **Existing Project Adoption (English)**: [HOW_TO_USE_IN_EXISTING_PROJECT_EN.md](HOW_TO_USE_IN_EXISTING_PROJECT_EN.md)
> - 📚 **ফোল্ডার ও ফাইল পরিচিতি (A to Z Guide)**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
> - 🤖 **Global Agent Rules**: [AGENTS.md](AGENTS.md) | ⚙️ **Config**: [project.config.md](project.config.md)

---

## ⚡ কুইক চিটশিট: কোন কাজের পর কোন কমান্ড দেবেন? (Exact Command Pipeline)

### দৃশ্যপট ১: নতুন প্রজেক্ট শুরু করার সময় (New Project Pipeline)

| ধাপ | আপনি কী করবেন | এআই চ্যাটে হুবহু কোন কমান্ড দেবেন? | ব্যাকগ্রাউন্ডে কী ঘটবে? |
| :---: | :--- | :--- | :--- |
| **১** | [README.md](README.md) ফাইলে ক্লায়েন্টের আইডিয়া ও ফিচার লিখুন। | *(ফাইল সেভ করুন)* | তথ্যের উৎস প্রস্তুত। |
| **২** | এআই চ্যাটে আর্কিটেকচার তৈরির নির্দেশ দিন। | `Iron Man, README.md পড়ে docs/architecture-spine.md এবং planning/task.md তৈরি করো।` | `nick_fury` অস্পষ্টতা খুঁজে প্রশ্ন করবে, `iron_man` স্পাইন ও টাস্ক তৈরি করবে। |
| **৩** | প্রথম টাস্কের কোডিং শুরু করতে বলুন। | `planning/tasks/TASK-001.md অনুযায়ী কোডিং শুরু করো।` | `scripts/check-readiness.sh` অডিট পাস করে স্পাইন অনুযায়ী কোড লিখবে। |
| **৪** | টাস্ক শেষ হলে চ্যাট বন্ধ করে **নতুন চ্যাট** খুলুন। | `planning/updateplanning.md পড়ে TASK-002 শুরু করো। [Tier: LEVEL: STANDARD]` | আগের হিস্ট্রি ডিলিট করে নতুন টাস্ক শুরু করবে (৯৫% টোকেন সেভ)। |

---

### দৃশ্যপট ২: ছোটখাটো বাগ ফিক্স বা কুইক চেঞ্জ (Fast-Path Mode)

* **কখন ব্যবহার করবেন:** যখন ২-১০ লাইনের কোনো কোড চেঞ্জ, বাটন কালার বা টাইপো ফিক্স করবেন।
* **এআই চ্যাটে কমান্ড দিন:**
  ```text
  Fast-Path মোডে <ফাইলের পাথ> ফাইলে গিয়ে এই বাগটি ফিক্স করো: <সমস্যার বিবরণ>। কোনো ডক বা প্ল্যান লোড করবে না।
  ```
* ⚡ **টোকেন খরচ:** `< ১,০০০` টোকেনে কাজ শেষ হবে।

---

### দৃশ্যপট ৩: বিদ্যমান চলমান প্রজেক্টে অ্যাডাপ্ট করার সময় (Existing Project)

| ধাপ | এআই চ্যাটে হুবহু কোন কমান্ড দেবেন? | ব্যাকগ্রাউন্ডে কী ঘটবে? |
| :---: | :--- | :--- |
| **১** | `Iron Man, এই প্রজেক্ট স্ক্যান করে project.config.md এবং docs/architecture-spine.md তৈরি করো। কোনো কোড পরিবর্তন করবে না।` | পুরো কোড স্ক্যান করে বেসলাইন ও স্পাইন বানিয়ে রাখবে (এককালীন কাজ)। |
| **২** | *(planning/new-plan.md ফাইলে নতুন ফিচার লিখে সেভ করুন)* | নতুন কাজের রিকোয়ারমেন্ট রেডি। |
| **৩** | `Iron Man, planning/new-plan.md অনুযায়ী planning/task.md তৈরি করো এবং scripts/check-readiness.sh রান করো।` | গ্যাপ অ্যানালাইসিস করে নতুন টাস্ক ভাগ করবে। |
| **৪** | `planning/updateplanning.md পড়ে প্রথম টাস্ক শুরু করো।` | কোড লিখে `verify-task.sh` দিয়ে ভেরিফাই করবে। |

---

## 1. Project Information (Client Brief)

- **Project Name**: Owtlet™ — Live Shopping for Cannabis (primary domain: `owtlet.com`)
- **Project Description**: Owtlet is a custom cannabis marketplace + live-shopping platform for adult (21+) consumers in the New York metro area. Shoppers pass a 21+ age gate, browse a curated cannabis catalog (strains, THC/CBD, per-dispensary price & stock), and watch live shows, replays and shoppable videos powered by the Terrific live-shopping SDK v2, adding pinned products to cart directly from the video. Brands get their own storefronts (channels) on owtlet.com, each fulfilled only by the partner dispensaries Owtlet assigns to that brand. Show products have one Owtlet price at every partner store. The platform is **cannabis-only**: every product in the catalog and every product pinned in a live show is cannabis and goes into Owtlet's own cart (PostgreSQL). Accessories are **out of scope** (sold separately on the `owtlet.shop` Shopify store by another team member). Owtlet never takes payment for cannabis and never stores government ID — at checkout the shopper chooses **pickup or delivery**, enters their contact info (guest checkout, optional profile with saved addresses and a default store), can change the auto-selected store, and is handed off to Leafly (primary) or the partner retailer's own order page (fallback); a multi-dispensary order is split into a parent order plus per-store sub-orders. Dispensaries post a confirmation link back to Owtlet to close the loop.
- **Business Domain**: Cannabis E-commerce / Live Shopping (regulated adult-use cannabis, New York)
- **Client / Company Information**: Jesce Horton — Grand National Agency (`grandnationalagency.com`), Cannabis retail / media, USA (New York). Engagement via Fiverr, budget **$3,000**, hard deadline **Dec 1, 2026** (Fiverr milestone shows Nov 28, 2026).
- **Target Audience**:
  - Adult (21+) cannabis consumers in **Manhattan, Queens, Brooklyn, Westchester County, and Long Island** (NY).
  - Partner dispensaries / licensed retailers who fulfill orders and confirm them back to Owtlet.
  - Owtlet admins who manage catalog, dispensaries, live shows, and orders.
- **Related Systems**:
  - `owtlet.shop` — **separate project, out of scope**: Shopify store (handle `f1jc7p-fs`) for accessories, built and owned by another team member. Owtlet has no cart/checkout integration with it. Two touch points only: (1) the ~22 cannabis products currently in that Shopify store are **test data only** and will be migrated into Owtlet's PostgreSQL catalog; (2) Owtlet's brand colors/fonts are taken from its theme.
  - Terrific live-shopping SDK v2 (`storeId=BX2hWAVam9JjsFhXP5ZF`, embedding `Cki70GhqvLgWGhJbSxg2`).
  - Leafly / retailer order pages for compliant cannabis checkout (integration details pending client).
  - `owtlet.live` — redirects (301) to `owtlet.com` (client Nov 9: "owtlet.live: redirects to owtlet.com").
  - Client source documents (verbatim answers + team clarification PDF): [`input/client-docs/`](input/client-docs/).
- **Business Objectives**: 
  - Launch a compliant cannabis live-shopping MVP on `owtlet.com` by **Dec 1, 2026**.
  - Let viewers go from live/replay video → cart → compliant dispensary checkout in as few steps as possible.
  - Route every cannabis order to the best-fit partner dispensary (most items in stock, delivers to the shopper's ZIP, currently open), splitting across stores when needed.
  - Keep Owtlet out of cannabis payment and ID handling entirely (handoff model).

---

## 2. Functional Requirements
- **REQ-F-001 (21+ Age Gate)**: On first visit every shopper must confirm they are 21 or older before any catalog, video, or cart content renders; under-21 is blocked with an exit screen; the confirmation is remembered in a signed, HTTP-only session cookie (no DOB or ID is stored).
- **REQ-F-002 (Cannabis Product Catalog)**: Custom catalog in PostgreSQL (migrated from the Shopify test data): categories (flower, pre-rolls, vapes, edibles, concentrates, …), strain (indica/sativa/hybrid), THC/CBD content, images, description, and per-dispensary price & stock; search, filter, and product detail pages.
- **REQ-F-003 (Live Shopping + Replay + Shoppable Video)**: Embed the Terrific live-shopping SDK v2 so viewers can watch live shows, recorded replays and shoppable videos and add pinned products to the Owtlet cart directly from the video player (client Nov 11: "Add-to-cart from replays and shoppable video, not just live shows").
- **REQ-F-004 (Custom Cannabis Cart)**: Cannabis items added from the catalog or from Terrific video go into Owtlet's **own** cart (PostgreSQL); carts are held until **30 minutes after the live show ends** when filled from a live show (REQ-F-016), otherwise for 30 minutes of inactivity; session-based, owned by the shopper when signed in.
- **REQ-F-005 (Removed — out of scope)**: Accessories are handled by the separate `owtlet.shop` Shopify project (another team member). The custom platform is cannabis-only; no Shopify cart/checkout integration. ID kept for traceability.
- **REQ-F-006 (Cannabis Checkout Handoff)**: Owtlet never processes cannabis payment and never stores government ID. At cannabis checkout the shopper is handed off to Leafly (primary) or the retailer's own order page (fallback) to complete the compliant purchase.
- **REQ-F-007 (Multi-Dispensary Order Distribution)**: A cart may contain items from multiple dispensaries. Create a **parent order** plus per-store **sub-orders**; prioritize the store that carries the most cart items; split across stores when needed; for delivery only consider stores that deliver to the shopper's ZIP, for pickup any partner store offering pickup (REQ-F-012); brand-storefront lines only go to that brand's stores (REQ-F-011); shopper may change the store (REQ-F-013).
- **REQ-F-008 (Store Hours & Distance at Checkout)**: Show each assigned store's open/closed status and hours (delivery hours for delivery orders, REQ-F-018) plus distance / ZIP eligibility at checkout.
- **REQ-F-009 (Store → Owtlet Confirmation)**: The dispensary posts an order confirmation link back to Owtlet (secured endpoint) which updates the sub-order and parent order status.
- **REQ-F-010 (Admin Console)**: Owtlet admins manage products (incl. Owtlet price), brands and brand ↔ dispensary assignment, dispensaries/partners (pickup/delivery, delivery ZIPs, store + delivery hours, inventory), live shows & shoppable videos (Terrific show ↔ product mapping, start/end), and orders.
- **REQ-F-011 (Brand Storefronts / Channels)**: Owtlet creates each brand storefront in admin (no self-registration) and assigns the partner dispensaries that fulfill it; `/brands/[slug]` shows the brand's products and shows; checkout for items added there works like the main cart but only offers that brand's stores.
- **REQ-F-012 (Pickup or Delivery)**: At checkout the shopper chooses pickup or delivery; delivery shows only stores that deliver to the shopper's address ZIP; pickup shows partner stores offering pickup, nearest first.
- **REQ-F-013 (Change Store at Checkout + Default Store)**: The system auto-selects the store(s); the shopper can switch any Store Order to another eligible store (e.g., order from home, pick up near work); a signed-in shopper's default partner store is used first.
- **REQ-F-014 (Guest Checkout + Optional Shopper Profile)**: Checkout works as guest with contact info (name, email, phone; delivery address for delivery); optional profile stores location (home ZIP), saved addresses and default store. No DOB/ID/payment data.
- **REQ-F-015 (One Owtlet Price for Show Products)**: Every product pinned in a show has one `owtletPrice` used at every partner store, so the cart shows one price; non-show products may keep per-store prices.
- **REQ-F-016 (Cart Held Until 30 Min After the Show Ends)**: A cart filled from a live show is held while the show is live and until 30 minutes after it ends.
- **REQ-F-017 (Out-of-Stock Flag + Alternative Store)**: Items out of stock at the selected/eligible store are flagged before handoff with another partner store that has the item suggested.
- **REQ-F-018 (Delivery Hours per Store)**: Each store sets delivery hours (7 days) in addition to store hours; shown for delivery orders.
- **REQ-F-019 (owtlet.live → owtlet.com Redirect)**: `owtlet.live` and `www.owtlet.live` permanently redirect to `https://owtlet.com` (path preserved).

---

## 2.1 Detailed Feature Specifications (Field-by-Field)

> **How to use this section**: each feature below is self-contained so a developer can build it field by field. Field and model names match the Prisma schema in [docs/07-database-design.md](docs/07-database-design.md); endpoints match [docs/08-api-contract.md](docs/08-api-contract.md); acceptance IDs match [docs/13-acceptance-criteria.md](docs/13-acceptance-criteria.md). All API responses use the standard envelope `{ success, data, message, timestamp }` / `{ success: false, error: { code, message, details } }`. Money is USD with 2 decimals; times are evaluated in `America/New_York`.

### Global conventions used below
| Item | Value |
|---|---|
| Coverage regions | `MANHATTAN`, `QUEENS`, `BROOKLYN`, `WESTCHESTER`, `LONG_ISLAND` (rows in `CoverageZip`) |
| Cookies | `owt_age` (21+ attestation, 30 days), `owt_cart` (cart token), `owt_shopper` (optional shopper profile session, 30 days), `owt_admin` (admin session, 8 h) — all HTTP-only + Secure |
| Cart hold | Live-show cart: held while the show is LIVE and until `LiveShow.endedAt + 30 min` (REQ-F-016). Other carts: 30 minutes **sliding** inactivity (`lastActivityAt + 30 min`). Rules: `docs/07` §2.2 |
| Pricing | `unitPrice = Product.owtletPrice ?? Inventory.price`; show products must have `owtletPrice` (one price everywhere, REQ-F-015) |
| Fulfillment | `PICKUP` or `DELIVERY`, chosen per checkout (REQ-F-012) |
| Channels | Main site or a brand storefront (`CartItem.channelBrandId`, REQ-F-011) |
| Product scope | **Cannabis only.** Every product (catalog and Terrific-pinned) goes to the Owtlet cart and is fulfilled via dispensary handoff. Accessories / `owtlet.shop` are out of scope |
| Terrific products | `cartSyncHandler` sends every pinned product to the Owtlet cart; a Terrific product id with no matching `Product.terrificProductId` (or `sku`) is rejected with `404 UNMAPPED_PRODUCT` and an error toast |
| Never stored | Date of birth, government ID (number/image), cannabis payment data (cards, bank) |
| Copy | Use terms from [docs/domain-lexicon.md](docs/domain-lexicon.md) ("Live Show", "Replay", "Dispensary", "Store Order") |

---

### REQ-F-001 — 21+ Age Gate

**Purpose / goal**: Block everyone from the catalog, prices, and live video until they attest they are 21 or older. Owtlet records only the attestation, never a DOB or ID.

**User stories**
- As a shopper, I want to confirm I'm 21+ once and not be asked again on this browser for 30 days, so that I can get straight to shopping.
- As a visitor under 21, I am stopped with a clear exit screen and can't reach any cannabis content.
- As Owtlet, I want a server-enforced gate (not just a pop-up), so that direct URLs and API calls are also protected.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/age-gate?next=/path` | `AgeGateDialog` (logo, headline "You must be 21+ to enter Owtlet.", 2 buttons), `ExitScreen` | Full-screen, no header/cart; brand Ink background, Mint primary button |
| Every storefront route | `middleware.ts` | Redirects to `/age-gate?next=<original path>` when `owt_age` is missing/invalid |

**Data fields**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `confirmed21Plus` (form/API) | boolean | Yes | Must be `true` to pass; `false` → exit screen | `true` | Sent by "I'm 21 or Older" / "I'm Under 21" buttons |
| `next` (query param) | string | No | Must start with `/` and be same-origin (no `//`, no `http`) | `/live/abc` | Prevents open redirect; default `/` |
| `owt_age` cookie | signed string | Yes (after pass) | HMAC-SHA256 with `AGE_COOKIE_SECRET`; payload = `nonce.exp` | `n9F2….1765785600.sig` | HTTP-only, Secure, SameSite=Lax, Max-Age 30 days |
| `AgeVerificationSession.id` | uuid | Yes | auto | `3f0c…` | |
| `AgeVerificationSession.sessionHash` | string (unique) | Yes | SHA-256 of the cookie nonce | `a1b2…` | Never the raw nonce |
| `AgeVerificationSession.confirmed` | boolean | Yes | `true` attested / `false` declined | `true` | |
| `AgeVerificationSession.ipHash` | string | No | salted SHA-256 of client IP | `9c8d…` | Rate-limiting only |
| `AgeVerificationSession.userAgent` | string | No | max 512 chars | `Mozilla/5.0…` | |
| `AgeVerificationSession.createdAt` | datetime | Yes | auto | `2026-11-15T06:00:00Z` | |
| `AgeVerificationSession.expiresAt` | datetime | Yes | `createdAt + 30 days` | `2026-12-15T06:00:00Z` | Matches cookie expiry |

**Step-by-step flow**
1. Visitor opens any storefront URL → `middleware.ts` finds no valid `owt_age` → 307 redirect to `/age-gate?next=<path>`.
2. Visitor taps **"I'm 21 or Older"** → Server Action `confirmAge()` / `POST /api/age-verify { confirmed21Plus: true }`.
3. Server generates a nonce, signs the cookie, inserts `AgeVerificationSession { confirmed: true, sessionHash, ipHash, userAgent, expiresAt }`, sets `owt_age`.
4. Server redirects to the validated `next` path (default `/`).
5. Visitor taps **"I'm Under 21"** → `POST /api/age-verify { confirmed21Plus: false }` → 403 `FORBIDDEN`; optional `AgeVerificationSession { confirmed: false }` row; UI shows `ExitScreen`; no cookie set.
6. Any `/api/*` call (except `/api/age-verify`, `/api/webhooks/*`, `/api/health`) without a valid cookie → 451 `AGE_GATE_REQUIRED`; `api-client.ts` redirects to `/age-gate`.

**Business rules**
- 21+ only; it is an attestation, **no DOB entry, no ID upload** (ID check happens at the dispensary after handoff).
- Cookie validity 30 days; tampered or expired cookie = not verified.
- Terrific SDK, product images and prices must not load before the gate passes.
- `/admin` uses its own login and is not behind the age gate cookie (admins still must log in).

**API endpoints used**: `POST /api/age-verify`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Cookie tampered / signature invalid | Treated as missing → redirect to gate |
| Cookies disabled in browser | Gate shows inline error "Please enable cookies to enter Owtlet." |
| `next` is an external URL | Ignored, redirect to `/` |
| Bots/crawlers | Gate page is indexable with no cannabis content; product pages return the gate |
| Repeated decline → accept on same browser | Allowed (attestation model); each attempt logged |
| Rate abuse | Nginx limits `/api/age-verify` to 5 req/min/IP |

**Acceptance criteria**: `AC-AGE-01`, `AC-AGE-02`, `AC-AGE-03`, `AC-SEC-01`.
- [ ] No storefront content renders before passing the gate (also via direct URL).
- [ ] Under-21 sees the exit screen, no cookie set; APIs return 451.
- [ ] Verified visitor is not asked again for 30 days; DB has no DOB/ID column.

**Dependencies / open questions**: None (no client dependency). Tasks: TASK-005.

---

### REQ-F-002 — Cannabis Product Catalog

**Purpose / goal**: A custom cannabis catalog in PostgreSQL (replacing the Shopify test data) that shoppers can browse, filter, and compare across dispensaries.

**User stories**
- As a shopper, I want to filter by category, strain type, and THC %, so that I find what I like fast.
- As a shopper, I want to see which dispensaries carry a product, at what price, and whether they deliver to my ZIP or offer pickup.
- As an admin, I want products to have complete potency and image data, so that the catalog looks professional.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/shop` | `ProductGrid`, `ProductCard`, `FilterBar`, `SearchInput`, `EmptyState`, `Skeleton` | Filters persist in the URL query |
| `/shop/[category]` | Same, pre-filtered by `Category.slug` | |
| `/product/[slug]` | `ProductGallery`, `StrainBadge`, potency chips, `StoreAvailabilityList`, `AddToCartButton`, quantity stepper | Shows per-store price & stock |

**Data fields — Product (DB `products`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `id` | uuid | Yes | auto | `7c1e…` | |
| `name` | string | Yes | 2–120 chars | `Blue Dream 3.5g` | Display name |
| `slug` | string (unique) | Yes | lowercase kebab-case, auto from name, unique | `blue-dream-3-5g` | URL |
| `description` | text | No | ≤ 5,000 chars, plain text/markdown | `Sweet berry aroma…` | |
| `brandId` | uuid → `Brand` | No | must exist, active | Grand National brand id | Links the product to its brand storefront (REQ-F-011) |
| `owtletPrice` | decimal(10,2) | No (**Yes if pinned in any show**) | > 0, USD | `45.00` | One price at every partner store (REQ-F-015); when set, `Inventory.price` is ignored |
| `categoryId` | uuid → `Category` | Yes | must exist | `flower` category id | |
| `strainId` | uuid → `Strain` | No (Yes for flower/pre-roll/vape) | must exist | Blue Dream strain id | |
| `thcPercent` | decimal(5,2) | No (Yes for CANNABIS) | 0–100 | `24.10` | Shown as "THC 24.1%" |
| `cbdPercent` | decimal(5,2) | No | 0–100 | `0.20` | |
| `weightGrams` | decimal(8,2) | No | > 0 | `3.50` | Edibles may use mg in description |
| `imageUrls` | string[] | Yes (≥ 1) | HTTPS URLs, max 8, jpg/png/webp | `["https://…/bd.webp"]` | First = cover |
| `sku` | string (unique) | No | ≤ 64 chars | `OWT-BD-35` | Used for Terrific/import matching |
| `terrificProductId` | string (unique) | No | must match Terrific product id | `terrific-prod-123` | Required if product is pinned in shows |
| `shopifyLegacyId` | string | No | Shopify product GID/ID | `gid://shopify/Product/8123…` | Set by test-data import |
| `isActive` | boolean | Yes | default `true` | `true` | Inactive = hidden everywhere |
| `createdAt` / `updatedAt` | datetime | Yes | auto | | |

**Data fields — Category / Strain**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `Category.name` | string | Yes | 2–40 chars | `Flower` | Flower, Pre-Rolls, Vapes, Edibles, Concentrates (cannabis categories only) |
| `Category.slug` | string (unique) | Yes | kebab-case | `pre-rolls` | |
| `Category.sortOrder` | int | Yes | default 0 | `1` | Menu order |
| `Strain.name` | string (unique) | Yes | 2–60 chars | `Blue Dream` | |
| `Strain.type` | enum `StrainType` | Yes | `INDICA` \| `SATIVA` \| `HYBRID` \| `CBD` | `HYBRID` | Badge colour |

**Data fields — Inventory (per-dispensary price/stock, DB `inventory`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `productId` | uuid | Yes | unique together with `dispensaryId` | | |
| `dispensaryId` | uuid | Yes | active dispensary | | |
| `price` | decimal(10,2) | Yes unless `Product.owtletPrice` set | > 0, USD | `45.00` | Per-store price for non-show products only |
| `stockQty` | int | Yes | ≥ 0 | `12` | 0 = out of stock at that store |
| `externalSku` | string | No | ≤ 64 | `POS-55821` | Store/POS SKU (Q-002) |

**Data fields — filters (query params, `GET /api/products`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `category` | string | No | existing `Category.slug` | `flower` | |
| `strainType` | enum | No | `StrainType` value | `HYBRID` | |
| `minThc` / `maxThc` | number | No | 0–100, min ≤ max | `18` | |
| `q` | string | No | 2–60 chars, trimmed | `blue` | name/brand/strain search |
| `brand` | string | No | existing `Brand.slug` | `grand-national` | Brand storefront filter |
| `cursor` / `limit` | uuid / int | No | limit 1–48, default 24 | `24` | Cursor pagination |
| `zip` (detail) | string | No | 5 digits | `11201` | Adds `deliversToZip` per store |

**Derived (computed, not stored)**: `priceMode` = `OWTLET` if `owtletPrice` is set, else `PER_STORE`; `fromPrice` = `owtletPrice`, or the lowest in-stock `Inventory.price` among active stores; `availableAtCount` = number of active stores with stock.

**Step-by-step flow**
1. Shopper opens `/shop` → Server Component calls `products.list(filters)` → Prisma query on `Product` (`isActive`) joined with `Inventory`/`Dispensary` (`isActive`).
2. Shopper changes a filter → URL updates → TanStack Query refetches `GET /api/products?...`.
3. Shopper opens `/product/[slug]` → `GET /api/products/{slug}?zip=` → availability list per store (price, inStock, deliversToZip).
4. "Add to Cart" → REQ-F-004 flow.
5. One-off import: `prisma/seed-shopify-import.ts` reads the ~22 Shopify test products (store `f1jc7p-fs`) → upserts `Product` by `shopifyLegacyId` (test-data migration only — no runtime Shopify link).

**Business rules**
- Only `isActive` products from `isActive` dispensaries are shown; a product with no in-stock store shows "Currently unavailable" and cannot be added.
- Show products (`owtletPrice` set) show **one price** everywhere (card, detail, cart, checkout). Other products: "from $X" on cards (lowest in-stock price), exact per-store prices on the detail page.
- Potency must be shown for cannabis products (THC required, CBD optional).
- No medical claims in descriptions (admin content rule).

**API endpoints used**: `GET /api/products`, `GET /api/products/{slug}`, admin `GET|POST|PATCH|DELETE /api/admin/products`, `PUT /api/admin/inventory`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| No products match filters | `EmptyState` "No products match these filters" + "Clear filters" CTA |
| Product slug not found / inactive | 404 page with link back to `/shop` |
| All stores out of stock | Card greyed, badge "Out of stock", Add to Cart disabled |
| Image URL broken | Fallback brand placeholder (Ink background + leaf icon) |
| Product stocked only outside shopper's ZIP | Detail page shows store with "Doesn't deliver to 11201" |
| API error | Inline error card + "Try again" button; toast |

**Acceptance criteria**: `AC-CAT-01`, `AC-CAT-02`, `AC-CAT-03`.
- [ ] Filters by category/strain/THC work and persist in the URL.
- [ ] Detail page lists every dispensary's price and stock.
- [ ] All Shopify test cannabis products imported with images and `shopifyLegacyId`.

**Dependencies / open questions**: Final production dataset **Q-004** (TASK-017); dispensary SKUs **Q-002**. Tasks: TASK-004, TASK-006.

---

### REQ-F-003 — Live Shopping + Replay + Shoppable Video (Terrific SDK v2)

**Purpose / goal**: Let viewers watch live shows, replays and shoppable videos and add pinned products to the Owtlet cart directly from the video, then jump to checkout. Client Nov 11: "Add-to-cart from replays and shoppable video, not just live shows".

**User stories**
- As a viewer, I want to tap a product while watching a live show, a replay or a shoppable video and have it added to my cart instantly.
- As a viewer, I want "Checkout" inside the player to take me to Owtlet's checkout.
- As an admin, I want to schedule shows and choose which products are pinned, so that the video links to real catalog items.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/` | `TerrificEmbed`, `LiveBadge` (Ember), `ShowRail` (upcoming + replays), featured products | Loads only after the age gate |
| `/live/[showId]` | `TerrificEmbed`, `PinnedProducts` side panel (desktop) / sheet (mobile) | Live → replay automatically when ended |
| `/videos`, `/videos/[id]` | `VideoGrid`, `TerrificEmbed` | Shoppable videos (`format = SHOPPABLE_VIDEO`) |
| Cart badge in header | `CartDrawer` trigger | Updated by bridge events |

**Data fields — Terrific configuration (env / client)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_TERRIFIC_STORE_ID` | string | Yes | non-empty | `BX2hWAVam9JjsFhXP5ZF` | Appended to `https://terrific.live/terrific-sdk.js?storeId=` |
| `NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID` | string | Yes | non-empty | `Cki70GhqvLgWGhJbSxg2` | `<div data-source="terrific" embedding-id="…">` |
| `window.terrificLiveSettings.cartSyncConfig.cartSyncHandler` | function | Yes | set **before** SDK script loads | — | Receives `{ action, cartProducts }` |
| `window.terrificLiveSettings.goToCheckoutConfig.goToCheckoutHandler` | async function | Yes | must resolve (SDK awaits it) | — | Receives `{ cartProducts, coupons, redirectUrl }` |

**Data fields — Terrific payload (incoming to the bridge)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `action` | string | Yes | `addProductToCart` \| `removeProductFromCart` \| `updateProductInCart` | `addProductToCart` | |
| `cartProducts[]` | array | Yes | ≥ 1 item | | |
| `cartProducts[].externalId` (Terrific product id) | string | Yes | matched to `Product.terrificProductId` | `terrific-prod-123` | Mapped server-side to `Product.terrificProductId` |
| `cartProducts[].sku` | string | No | fallback match to `Product.sku` | `OWT-BD-35` | |
| `cartProducts[].quantity` | int | Yes | 1–10 | `1` | |
| `coupons` (checkout) | array | No | ignored for cannabis (no Owtlet payment) | `[]` | Logged only |
| `redirectUrl` (checkout) | string | No | ignored; Owtlet routes to `/checkout` | | |

**Data fields — LiveShow / ShowProduct (DB)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `LiveShow.title` | string | Yes | 3–120 chars | `Friday Night Flower Drop` | |
| `LiveShow.description` | text | No | ≤ 2,000 | `Top hybrids from Brooklyn stores` | |
| `LiveShow.terrificShowId` | string (unique) | No | Terrific show id | `show_8f2a` | Links to Terrific |
| `LiveShow.embeddingId` | string | Yes | default `Cki70GhqvLgWGhJbSxg2` | | Per-show override possible |
| `LiveShow.format` | enum `VideoFormat` | Yes | `LIVE_SHOW` \| `SHOPPABLE_VIDEO` (default `LIVE_SHOW`) | `LIVE_SHOW` | Shoppable videos are always "on demand" |
| `LiveShow.brandId` | uuid → `Brand` | No | active brand | | Brand channel show (REQ-F-011) |
| `LiveShow.status` | enum `ShowStatus` | Yes | `SCHEDULED` \| `LIVE` \| `REPLAY` \| `ARCHIVED` | `LIVE` | |
| `LiveShow.scheduledEndAt` | datetime | No | > `scheduledAt` | `2026-11-29T00:00:00Z` | Fallback show end for the cart hold |
| `LiveShow.startedAt` / `endedAt` | datetime | No | set by admin "Start show" / "End show" | | `endedAt` drives REQ-F-016 |
| `LiveShow.scheduledAt` | datetime | Yes for `SCHEDULED` | future date when scheduling | `2026-11-28T23:00:00Z` | Shown in NY time |
| `LiveShow.thumbnailUrl` | string | No | HTTPS URL | `https://…/show.jpg` | |
| `ShowProduct.showId` + `productId` | uuid pair (PK) | Yes | product must be active **and have `owtletPrice`** (else 422 `PRICE_REQUIRED`) | | Pinned products |
| `ShowProduct.sortOrder` | int | Yes | default 0 | `1` | Order in panel |

**Step-by-step flow**
1. Age-verified viewer opens `/` or `/live/[showId]` → `GET /api/live-shows?status=LIVE` (and `SCHEDULED`, `REPLAY`) for the rail.
2. `TerrificEmbed` (client) sets `window.terrificLiveSettings` → injects SDK script → renders embed div.
3. Viewer taps a pinned product → SDK calls `cartSyncHandler({ action: "addProductToCart", cartProducts })`.
4. Bridge sends the items straight to `POST /api/cart/items { action, source: "terrific_live" | "terrific_replay" | "terrific_video", liveShowId, cartProducts }`; the server resolves each `externalId` to `Product.terrificProductId` (fallback `sku`). Unmapped ids → `404 UNMAPPED_PRODUCT` (nothing added for that id) → toast "This product isn't available on Owtlet yet."
5. Server writes `CartItem` → returns updated cart → Zustand store + badge update; toast "Blue Dream 3.5g added to your cart."
6. `updateProductInCart` / `removeProductFromCart` → `PATCH` / `DELETE /api/cart/items`.
7. Viewer taps checkout in player → `goToCheckoutHandler` → bridge reconciles server cart with `cartProducts` → `router.push('/checkout')` → returns `true`.
8. Bridge listens to `cart-change-notification`, `GoToCheckout`, `Navigate` to keep the badge and navigation in sync.

**Business rules**
- Settings object must exist before the SDK loads (verified requirement).
- Live shows on the custom platform feature **cannabis products only**; every pinned product goes to the Owtlet cart (no Shopify routing).
- Pinned products must have `terrificProductId` set, otherwise they can't be added (admin warning).
- Replays and shoppable videos use the same add-to-cart path (`source = terrific_replay` / `terrific_video`).
- Adding from a show with `status = LIVE` links the cart to that show (REQ-F-016 hold).
- Show products always display their one `owtletPrice` (REQ-F-015).

**API endpoints used**: `GET /api/live-shows`, `POST|PATCH|DELETE /api/cart/items`, admin `GET|POST|PATCH /api/admin/live-shows`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| No live show now | Show next scheduled show countdown + replays; `EmptyState` if none: "No live shows yet — browse the Shop" |
| SDK script fails to load | Fallback card "Live player unavailable" + retry; catalog still usable |
| Terrific product unmapped | `404 UNMAPPED_PRODUCT`; not added; error toast + server log with the id |
| Cart expired while watching | Server returns 410 → new cart created, item re-added, toast "Your previous cart expired" |
| Product out of stock everywhere | 409 `OUT_OF_STOCK` → toast "Sold out at partner stores" |
| Player and server cart diverge | `goToCheckoutHandler` reconciles before routing |

**Acceptance criteria**: `AC-LIVE-01`, `AC-LIVE-02`, `AC-LIVE-03`.
- [ ] Player renders on `/` and `/live/[showId]` with store `BX2hWAVam9JjsFhXP5ZF` / embedding `Cki70GhqvLgWGhJbSxg2`.
- [ ] Add/update/remove from a live show, a replay **and** a shoppable video reach the Owtlet cart within 1 s with a toast.
- [ ] Checkout button in player opens `/checkout` (cannabis handoff flow).
- [ ] Unmapped pinned products are rejected with an error toast (`UNMAPPED_PRODUCT`).

**Acceptance criteria (added)**: `AC-LIVE-04` (shoppable video add-to-cart).

**Dependencies / open questions**: Terrific product ids for real products depend on final data (**Q-004**). Shoppable-video embedding on Terrific is verified in TASK-016 (same SDK hooks expected). Tasks: TASK-008, TASK-016.

---

### REQ-F-004 — Custom Cannabis Cart (show-end / 30-minute hold)

**Purpose / goal**: Hold cannabis items in Owtlet's own PostgreSQL cart — until 30 minutes after the live show ends for live-show carts (REQ-F-016), otherwise 30 minutes of inactivity — fed by the catalog, brand storefronts and video.

**User stories**
- As a shopper, I want my cart to survive page reloads while I keep shopping.
- As a shopper, I want to see how long my cart is held and change quantities easily.
- As Owtlet, I want abandoned carts to expire automatically so stock isn't shown as reserved forever.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| Header (all storefront pages) | Cart icon with `itemCount` badge | |
| Drawer | `CartDrawer`, `CartLine` (image, name, strain, qty stepper, remove), `CartTimer` ("Your cart is held for 29:41") | |
| `/cart` | `CartLineList`, `CartTimer`, "Continue to Checkout" | Empty / Expired states |

**Data fields — Cart (DB `carts`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `id` | uuid | Yes | auto | | |
| `sessionToken` | string (unique) | Yes | 256-bit random, base64url; = `owt_cart` cookie | `Yz3…` | HTTP-only cookie |
| `status` | enum `CartStatus` | Yes | `ACTIVE` \| `CHECKED_OUT` \| `EXPIRED` | `ACTIVE` | |
| `zip` | string | No | 5 digits, set at checkout | `11201` | |
| `shopperId` | uuid → `Shopper` | No | set when signed in | | Cart follows the profile (REQ-F-014) |
| `liveShowId` | uuid → `LiveShow` | No | set on add from a LIVE show | | REQ-F-016 hold |
| `lastActivityAt` | datetime | Yes | now on every change | | Inactivity timer |
| `expiresAt` | datetime | Yes | computed per `docs/07` §2.2 | `2026-11-15T06:30:00Z` | Indexed |
| `createdAt` / `updatedAt` | datetime | Yes | auto | | |

**Data fields — CartItem (DB `cart_items`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `cartId` | uuid | Yes | unique with `productId` + `channelBrandId` | | One line per product per channel |
| `productId` | uuid | Yes | active product, in stock at ≥ 1 active dispensary | | |
| `quantity` | int | Yes | 1–10 per line | `2` | 0 on update = remove |
| `source` | string | Yes | `catalog` \| `brand_storefront` \| `terrific_live` \| `terrific_replay` \| `terrific_video` | `terrific_live` | Analytics |
| `channelBrandId` | uuid → `Brand` | No | set on brand storefronts | | Restricts the line to the brand's stores (REQ-F-011) |
| `liveShowId` | uuid → `LiveShow` | No | show/video it came from | | |
| `preferredDispensaryId` | uuid | No | active dispensary carrying the product | | Set when shopper picks a store on the product page; used as tie-break hint |
| `createdAt` | datetime | Yes | auto | | |

**Step-by-step flow**
1. First add → no `owt_cart` cookie → server creates `Cart { status: ACTIVE, lastActivityAt: now, expiresAt: now+30m }`, sets cookie.
2. `POST /api/cart/items { action: "addProductToCart", source, cartProducts: [{ productId|externalId|sku, quantity }] }` → resolve product (`productId` → `terrificProductId` → `sku`; unmapped → 404 `UNMAPPED_PRODUCT`) → upsert `CartItem` (adding increments quantity, capped at 10) → `lastActivityAt = now`; if added from a LIVE show set `liveShowId` → recompute `expiresAt` (`docs/07` §2.2).
3. Qty change → `PATCH /api/cart/items` (`updateProductInCart`); remove → `DELETE /api/cart/items` (`removeProductFromCart`); clear → `DELETE /api/cart`.
4. Every page load → `GET /api/cart` → if `expiresAt < now` → mark `EXPIRED`, delete items, issue new cart, return 410 `CART_EXPIRED` → UI shows Expired state.
5. `CartTimer` counts down from `expiresAt` client-side (while held for a live show it shows "Held until 30 min after the show ends"); at 0 it refetches `GET /api/cart`.
6. Optional Redis: mirror `cart:<sessionToken>` with TTL 1800 s; PostgreSQL remains source of truth.
7. On order creation (REQ-F-007) → `status = CHECKED_OUT`.

**Business rules**
- Cannabis only (the catalog contains no other product type).
- Live-show carts: held during the show and until `endedAt + 30 min`; other carts: sliding 30-minute expiry; expired carts are never revived.
- Max 10 units per line, max 30 lines per cart (prevents abuse).
- Show products show their one `owtletPrice`; other products show "from $X" until the checkout preview fixes the store price (REQ-F-007).
- No stock reservation in MVP (stock checked at preview and order creation).

**API endpoints used**: `GET /api/cart`, `DELETE /api/cart`, `POST|PATCH|DELETE /api/cart/items`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Empty cart | `EmptyState` "Your cart is empty — catch a Live Show or browse the Shop." |
| Cart expired | 410 → Expired state "Your cart expired after 30 minutes" + "Browse again" |
| Product became inactive / out of stock | Line flagged "No longer available", excluded from checkout |
| Quantity > 10 | Inline validation, capped at 10 |
| Unknown product id / Terrific id | 404 `UNMAPPED_PRODUCT`; error toast |
| Cookie lost (new browser) | New empty cart; a signed-in shopper gets their profile cart back after login (REQ-F-014) |
| Two tabs editing | Last write wins; both tabs refetch on focus |

**Acceptance criteria**: `AC-CART-01`, `AC-CART-02`.
- [ ] Cannabis items stored only in PostgreSQL cart; add/update/remove work from catalog and Terrific.
- [ ] Cart persists across reloads; a non-show cart expires after 30 min inactivity; a live-show cart is held until 30 min after the show ends (`AC-HOLD-01`).

**Dependencies / open questions**: None. Tasks: TASK-007 (show-end hold logic), TASK-016 (admin End show).

---

### REQ-F-005 — Removed — out of scope (accessories handled by separate owtlet.shop Shopify project)

**Status**: Removed on 2026-11-15 (see `planning/decisions.md` ADR-008). The ID is kept so other REQ numbers stay stable.

- The custom Owtlet platform is **cannabis-only**; live shows on it feature only cannabis products.
- Accessories (glassware, grinders, papers, etc.) are sold on the separate `owtlet.shop` Shopify store, built and owned by another team member.
- This project has **no** Shopify Storefront token, Shopify cart bridge, accessory product mapping, or accessory checkout.
- Remaining links to `owtlet.shop`: migration of its ~22 cannabis **test** products into PostgreSQL (REQ-F-002) and its theme as the brand source (`docs/04-design-system.md`).

---

### REQ-F-006 — Cannabis Checkout Handoff (Leafly / Retailer Page)

**Purpose / goal**: Complete each cannabis Store Order on a licensed partner's own system (Leafly primary, retailer order page fallback) so that Owtlet **never takes cannabis payment and never sees or stores ID**.

**User stories**
- As a shopper, I want one clear button per dispensary that takes me to finish my purchase with them.
- As Owtlet, I want zero payment/ID liability for cannabis.
- As a dispensary, I want shoppers to arrive with the order reference so I can match the order.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/checkout` (after "Place Order") | `HandoffButton` per Store Order ("Continue to Leafly" / "Continue to {Store name}"), compliance notice | Opens in new tab |
| `/order/[id]` | `SubOrderStatusList` (Pending → Handed off → Confirmed) | Shopper can reopen a handoff link |

**Data fields — Dispensary handoff config (DB `dispensaries`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `handoffChannel` | enum `HandoffChannel` | Yes | `LEAFLY` \| `RETAILER_PAGE` (default `RETAILER_PAGE`) | `RETAILER_PAGE` | `LEAFLY` usable only after Q-001 |
| `handoffUrlTemplate` | string | Yes if `RETAILER_PAGE` | HTTPS URL; allowed placeholders `{subOrderId}`, `{orderNumber}` | `https://store-a.example/order?ref={subOrderId}` | Built per Store Order |
| `leaflyStoreId` | string | No | format **TBD (Q-001)** | — | Do not use until confirmed |

**Data fields — SubOrder handoff state (DB `sub_orders`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `handoffChannel` | enum | Yes | copied from dispensary at order creation | `RETAILER_PAGE` | |
| `handoffUrl` | string | No (set on handoff) | HTTPS | `https://store-a.example/order?ref=uuid-s1` | |
| `handedOffAt` | datetime | No | set on first handoff | `2026-11-15T06:12:00Z` | |
| `status` | enum `SubOrderStatus` | Yes | `PENDING` → `HANDED_OFF` | `HANDED_OFF` | |

**Request field**: `POST /api/checkout/handoff { orderId: uuid }` (order must belong to the current `owt_cart` session).

**Step-by-step flow**
1. Order created (REQ-F-007) → UI calls `POST /api/checkout/handoff { orderId }`.
2. Server loads Store Orders → `HandoffProvider` per `handoffChannel`: `RetailerPageProvider.buildUrl()` fills `handoffUrlTemplate`; `LeaflyProvider` returns "not configured" until Q-001 is answered (falls back to retailer page if template exists).
3. Server saves `handoffUrl`, `handedOffAt`, `status = HANDED_OFF`; parent `Order.status = HANDED_OFF`.
4. UI shows one button per Store Order with the notice: *"You'll complete your purchase and ID check with the licensed dispensary. Owtlet never takes payment for cannabis."*
5. Shopper completes payment + ID check on the partner site. Confirmation comes back via REQ-F-009.

**Business rules**
- No payment form, card field, or ID/DOB field anywhere in Owtlet for cannabis.
- The shopper's contact/delivery info is collected on owtlet.com (client Nov 9: "Shoppers pick the store and enter their info on owtlet.com", REQ-F-014) and passed to the partner only in the form the provider supports (Leafly API / retailer URL params — Q-001/Q-002); the default retailer URL template carries the order reference only. Never ID or payment data.
- Leafly is primary **once confirmed**; until then `RETAILER_PAGE` is the default (no invented Leafly API).
- A handoff link can be reopened from `/order/[id]` (idempotent; `handedOffAt` keeps the first time).

**API endpoints used**: `POST /api/checkout/handoff`, `GET /api/orders/{id}`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Dispensary has no `handoffUrlTemplate` and Leafly not configured | 502 `UPSTREAM_ERROR` for that Store Order; UI "This store isn't accepting online orders right now"; admin alert |
| Popup blocked | Button is a normal link (`target=_blank`); no reliance on `window.open` |
| Shopper returns without buying | Store Order stays `HANDED_OFF`; link still available |
| Store closed at handoff time | Allowed, with warning from REQ-F-008 ("Opens at 10:00 AM") |
| Order belongs to another session | 404 `NOT_FOUND` |

**Acceptance criteria**: `AC-HND-01`, `AC-SEC-01`.
- [ ] Each Store Order has a working handoff button to Leafly or the retailer's page.
- [ ] No payment or ID fields in UI, API payloads, or schema.

**Dependencies / open questions**: **Q-001** (Leafly partnership / API or link format), **Q-002** (each dispensary's ordering system + order page URL). Tasks: TASK-013.

---

### REQ-F-007 — Multi-Dispensary Order Distribution

**Purpose / goal**: Turn one cart into a parent Order plus one Store Order (SubOrder) per dispensary — using as few stores as possible, only eligible stores (delivery ZIP or pickup, brand channel), respecting the shopper's store changes.

**User stories**
- As a shopper, I want my order filled by as few stores as possible.
- As a shopper, I want to know before ordering if something can't be delivered to my ZIP.
- As a dispensary, I only receive orders for my delivery area.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/checkout` | `FulfillmentToggle` (Pickup / Delivery), `ZipForm` / `AddressForm`, `SubOrderCard` (store, items, subtotal, "Change store"), `UnfulfillableList` (suggestions + remove), `ContactForm`, "Place Order" | Preview before creation |
| `/order/[id]` | Order number, Store Order list | |

**Data fields — checkout form / requests**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `fulfillmentType` | enum | Yes | `PICKUP` \| `DELIVERY` | `DELIVERY` | REQ-F-012 |
| `zip` | string | Yes | `^\d{5}$`; for DELIVERY must be in `CoverageZip` | `11201` | Else 422 `NO_COVERAGE` |
| `preferredDispensaryId` / `itemOverrides[]` | uuid / `{ productId, dispensaryId }[]` | No | store must be eligible | | REQ-F-013 |
| `contact`, `deliveryAddress` | objects | Yes / DELIVERY only | see REQ-F-014 | | Order create only |
| `previewHash` | string | Yes (create) | SHA-256 of the preview allocation (store ids, items, prices) | `9af3…` | Detects stale previews |

**Data fields — Order (DB `orders`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `id` | uuid | Yes | auto | | |
| `orderNumber` | string (unique) | Yes | `OWT-` + 6 digits, sequential | `OWT-100245` | Shown to shopper and stores |
| `cartId` | uuid (unique) | No | the checked-out cart | | |
| `zip` | string | Yes | 5 digits (covered for DELIVERY) | `11201` | |
| `fulfillmentType` | enum | Yes | `PICKUP` \| `DELIVERY` | `PICKUP` | |
| `shopperId` | uuid | No | null = guest | | REQ-F-014 |
| `contactFirstName`, `contactLastName`, `contactEmail`, `contactPhone` | string | Yes | see REQ-F-014 | `Jane`, `Doe`, `jane@example.com`, `+12125550123` | No DOB/ID |
| `deliveryLine1`, `deliveryLine2`, `deliveryCity`, `deliveryState` | string | DELIVERY only | NY address | `120 Atlantic Ave` | |
| `status` | enum `OrderStatus` | Yes | `PENDING` \| `HANDED_OFF` \| `PARTIALLY_CONFIRMED` \| `CONFIRMED` \| `CANCELLED` | `PENDING` | Rolled up from Store Orders |
| `subtotal` | decimal(10,2) | Yes | sum of Store Order subtotals | `90.00` | Estimate (store sets final price/tax) |

**Data fields — SubOrder (DB `sub_orders`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `orderId` | uuid | Yes | parent | | |
| `dispensaryId` | uuid | Yes | eligible for `fulfillmentType` + `zip` (+ brand channel) | | |
| `fulfillmentType` | enum | Yes | copied from Order | `DELIVERY` | |
| `assignment` | enum `AssignmentSource` | Yes | `AUTO` \| `PROFILE_DEFAULT` \| `SHOPPER_CHANGED` | `AUTO` | REQ-F-013 |
| `channelBrandId` | uuid | No | brand storefront lines | | REQ-F-011 |
| `status` | enum `SubOrderStatus` | Yes | `PENDING` \| `HANDED_OFF` \| `CONFIRMED` \| `REJECTED` \| `CANCELLED` | `PENDING` | |
| `handoffChannel` | enum | Yes | from dispensary | `RETAILER_PAGE` | |
| `subtotal` | decimal(10,2) | Yes | Σ `quantity × unitPrice` | `45.00` | |
| `handoffUrl`, `handedOffAt`, `confirmationRef`, `confirmationUrl`, `confirmedAt` | various | No | see REQ-F-006 / REQ-F-009 | | |

**Data fields — OrderItem (DB `order_items`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `subOrderId` | uuid | Yes | | | |
| `productId` | uuid | Yes | cannabis | | |
| `name` | string | Yes | snapshot of `Product.name` | `Blue Dream 3.5g` | Survives product edits |
| `quantity` | int | Yes | 1–10 | `1` | |
| `unitPrice` | decimal(10,2) | Yes | snapshot of `Product.owtletPrice ?? Inventory.price` | `45.00` | REQ-F-015 |

**Step-by-step flow**
1. Shopper picks Pickup or Delivery and enters a ZIP (delivery: address ZIP; pickup: location ZIP, pre-filled from the profile) → `POST /api/orders/preview { fulfillmentType, zip, preferredDispensaryId?, itemOverrides? }`.
2. Server: candidate stores = active `Dispensary` with `offersDelivery` and `zip ∈ coverageZips` (DELIVERY) or with `offersPickup` (PICKUP); per line, brand-storefront lines keep only the brand's assigned stores (REQ-F-011). Apply `itemOverrides`, then `preferredDispensaryId` (shopper change or profile default, REQ-F-013).
3. Greedy allocation loop for the remaining lines: pick the candidate that can fully supply (`stockQty ≥ quantity`) the **most** still-unassigned cart items → assign them → remove that store → repeat. Tie-break: lower subtotal, then nearer (distance), then `preferredDispensaryId` hint.
4. Items no candidate can supply → `unfulfillable[]` with reason `NOT_IN_STOCK_FOR_ZIP` / `NOT_AT_SELECTED_STORE` + `suggestions` (REQ-F-017).
5. Response: `subOrders[]` (with hours/distance REQ-F-008, `alternatives` REQ-F-013), `unfulfillable[]`, `total`, plus `previewHash`.
6. Shopper fixes unfulfillable items (switch store / switch to pickup / remove), fills contact info and taps **Place Order** → `POST /api/orders { fulfillmentType, zip, contact, deliveryAddress?, preferredDispensaryId?, itemOverrides?, previewHash }`.
7. Server recomputes the allocation; if the hash differs → 409 `PREVIEW_STALE` (UI refreshes preview). Otherwise one `prisma.$transaction`: create `Order`, `SubOrder`s, `OrderItem`s; set `Cart.status = CHECKED_OUT`, `Cart.zip`.
8. Continue to handoff (REQ-F-006).

**Business rules**
- Coverage = Manhattan, Queens, Brooklyn, Westchester County, Long Island (`CoverageZip`). Delivery: only stores that deliver to the shopper's address ZIP appear. Pickup: any partner store offering pickup, nearest first.
- A single item line is never split across stores (whole quantity from one store).
- Store with most items first; split only when needed.
- Closed stores are still eligible (shown as "Opens at …"); the store's own rules apply after handoff.
- Order creation is atomic; prices snapshotted into `OrderItem.unitPrice`.

**API endpoints used**: `POST /api/orders/preview`, `POST /api/orders`, `GET /api/orders/{id}`, `GET /api/dispensaries?zip=`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| ZIP invalid format | Inline "Enter a 5-digit ZIP code" |
| ZIP not covered | 422 `NO_COVERAGE` → "We don't deliver to {zip} yet — we currently serve Manhattan, Queens, Brooklyn, Westchester & Long Island." |
| No store can fulfill anything | All items in `unfulfillable`; Place Order disabled |
| Some items unfulfillable | Listed with remove buttons; Place Order disabled until removed (422 `UNFULFILLABLE_ITEMS` otherwise) |
| Stock/price changed between preview and create | 409 `PREVIEW_STALE` → re-preview automatically |
| Cart expired during checkout | 410 `CART_EXPIRED` → Expired state |
| Double-click Place Order | Idempotent on `cartId` (unique) → returns existing order |

**Acceptance criteria**: `AC-DST-01`, `AC-DST-02`.
- [ ] Multi-store cart → 1 parent Order + N Store Orders; first store covers the most items.
- [ ] Stores outside the ZIP are never assigned; uncovered ZIP shows the no-coverage message.

**Dependencies / open questions**: Real dispensaries, coverage ZIPs and stock **Q-002** (demo data until then). Related: REQ-F-011…018. Tasks: TASK-010, TASK-011, TASK-012.

---

### REQ-F-008 — Store Hours & Distance at Checkout

**Purpose / goal**: Show, for every assigned dispensary, whether it's open now, today's hours, and how far it is, so the shopper knows what to expect.

**User stories**
- As a shopper, I want to see "Open · Closes 10:00 PM" and "1.8 mi" for each store before I continue.

**Screens / UI elements**: `/checkout` → `SubOrderCard` → `StoreHours` (Open/Closed badge, today's hours, "Opens at…"), distance chip, "Delivers to 11201 ✓".

**Data fields — DispensaryHours (DB `dispensary_hours`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `dispensaryId` | uuid | Yes | unique with `kind` + `dayOfWeek` | | 7 rows per kind per store |
| `kind` | enum `HoursKind` | Yes | `STORE` \| `DELIVERY` | `STORE` | Delivery hours: REQ-F-018 |
| `dayOfWeek` | int | Yes | 0 (Sun) – 6 (Sat) | `5` | |
| `opensAt` | string | Yes unless closed | `HH:mm` 24h local time | `10:00` | |
| `closesAt` | string | Yes unless closed | `HH:mm`; may be ≤ `opensAt` = closes after midnight | `02:00` | |
| `isClosed` | boolean | Yes | default `false` | `false` | Closed all day |

**Data fields — Dispensary location (DB `dispensaries`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `addressLine1`, `city`, `state`, `zip` | string | Yes | `state` = `NY`; zip 5 digits | `120 Atlantic Ave`, `Brooklyn`, `NY`, `11201` | |
| `latitude` / `longitude` | decimal(9,6) | Recommended | valid coordinates | `40.690`, `-73.995` | Else ZIP centroid used |
| `timezone` | string | Yes | default `America/New_York` | | |
| `CoverageZip.latitude/longitude` | decimal | Yes | ZIP centroid | | Shopper side of distance |

**Computed (response only)**: `isOpenNow` (bool), `hoursToday { opensAt, closesAt }`, `distanceMiles` (haversine from shopper ZIP centroid to store, 1 decimal).

**Step-by-step flow**
1. Preview (REQ-F-007) → for each Store Order the server computes `isOpenNow(STORE hours)`, `hoursToday`, and for DELIVERY orders `isDeliveringNow` / `deliveryHoursToday` (DELIVERY hours), plus `distanceMiles` (America/New_York).
2. UI renders badges: green "Open · Closes 10:00 PM", grey "Closed · Opens 10:00 AM", distance "1.8 mi".
3. `GET /api/dispensaries?zip=` provides the same data for store lists on product pages.

**Business rules**
- Evaluate in `America/New_York` with DST.
- `closesAt ≤ opensAt` means the store closes after midnight (spans to next day).
- Missing hours row for a day = treat as closed and show "Hours not available".
- Distance is informational only (eligibility is ZIP coverage, not distance).

**API endpoints used**: `POST /api/orders/preview`, `GET /api/dispensaries?zip=`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Store closed now | Show "Closed · Opens {time}"; still selectable |
| No hours configured | "Hours not available"; admin warning |
| No coordinates | Use store ZIP centroid; if unknown, hide distance |
| DST change day | Correct by timezone library (tested T-HRS-01) |

**Acceptance criteria**: `AC-HRS-01`.
- [ ] Checkout shows Open/Closed, today's hours (NY time) and distance for every assigned store.

**Dependencies / open questions**: Real hours/addresses **Q-002**. Tasks: TASK-010, TASK-012.

---

### REQ-F-009 — Store → Owtlet Confirmation

**Purpose / goal**: Let the dispensary tell Owtlet that a Store Order was accepted (with its own order number/link), closing the loop for the shopper.

**User stories**
- As a dispensary, I want to confirm an Owtlet order with one call or one link.
- As a shopper, I want to see "Confirmed by Store A (#STORE-A-88812)" on my order page.

**Screens / UI elements**: `/order/[id]` → `SubOrderStatusList` (status chip, store reference, "View store order" link). Admin `/admin/orders` shows the same.

**Data fields — webhook request (`POST /api/webhooks/store-confirmation`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| Header `X-Owtlet-Dispensary` | uuid | Yes | must match `SubOrder.dispensaryId` | `uuid-A` | |
| Header `X-Owtlet-Timestamp` | int (unix s) | Yes | within ±5 min | `1763186400` | Replay protection |
| Header `X-Owtlet-Signature` | string | Yes | `sha256=` HMAC of `timestamp.rawBody` with `Dispensary.webhookSecret` | `sha256=ab12…` | Constant-time compare |
| `subOrderId` | uuid | Yes | exists, belongs to header dispensary | `uuid-s1` | |
| `status` | enum | Yes | `CONFIRMED` \| `REJECTED` | `CONFIRMED` | |
| `confirmationRef` | string | Yes if CONFIRMED | ≤ 64 chars | `STORE-A-88812` | Store's order number |
| `confirmationUrl` | string | No | HTTPS URL | `https://store-a.example/orders/88812` | |

**Data fields — stored (DB)**: `SubOrder.status`, `SubOrder.confirmationRef`, `SubOrder.confirmationUrl`, `SubOrder.confirmedAt`; `Dispensary.webhookSecret` (random 32+ bytes, generated by admin, shown once); parent `Order.status` roll-up.

**Step-by-step flow**
1. Store accepts the order in its system → sends the signed webhook (or opens a signed confirmation link `GET /api/webhooks/store-confirmation?token=…` if it can't send webhooks).
2. Server verifies headers/signature/timestamp → loads `SubOrder` → checks dispensary match.
3. If already confirmed with the same `confirmationRef` → return 200 (idempotent, no change).
4. Else update `status`, `confirmationRef`, `confirmationUrl`, `confirmedAt`.
5. Roll-up: all Store Orders `CONFIRMED` → `Order.CONFIRMED`; some → `PARTIALLY_CONFIRMED`.
6. `/order/[id]` shows the new status on next fetch.

**Business rules**
- Only the owning dispensary can confirm its Store Order.
- Webhook bypasses the age gate but requires a valid signature.
- Duplicate confirmations are idempotent; a different `confirmationRef` on an already-confirmed Store Order → 409 (manual admin review).
- `REJECTED` keeps the parent from becoming `CONFIRMED`; admin can follow up.

**API endpoints used**: `POST /api/webhooks/store-confirmation`, `GET /api/webhooks/store-confirmation?token=` (link variant), `GET /api/orders/{id}`, admin `PATCH /api/admin/sub-orders/{id}`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Bad/missing signature | 401 `INVALID_SIGNATURE`, logged |
| Timestamp too old | 401 `INVALID_SIGNATURE` (replay) |
| Unknown `subOrderId` | 404 `NOT_FOUND` |
| Duplicate same confirmation | 200, no change |
| Conflicting confirmation | 409, admin alert |
| Store can't send webhooks | Signed link flow, or admin marks confirmed manually |

**Acceptance criteria**: `AC-CNF-01`.
- [ ] Correctly signed confirmation marks the Store Order Confirmed and shows on `/order/[id]`; invalid signatures rejected; duplicates idempotent.

**Dependencies / open questions**: **Q-002** — whether each store's POS can send a webhook or only use a link. Tasks: TASK-014.

---

### REQ-F-010 — Admin Console

**Purpose / goal**: Give Owtlet admins a login-protected console to manage products, per-store inventory, dispensaries, live shows, and orders without code changes.

**User stories**
- As an admin, I want to add a product with potency, images and per-store prices.
- As an admin, I want to onboard a dispensary with its delivery ZIPs, hours and order-page URL.
- As an admin, I want to schedule a live show (or add a shoppable video), pin products to it, and press Start / End show.
- As an admin, I want to create brand storefronts and assign which partner dispensaries fulfill each brand.
- As an admin, I want to see all orders and Store Order statuses and fix one manually.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/admin/login` | `AdminLoginForm` (email, password) | Rate-limited |
| `/admin/products`, `/admin/products/[id]` | `DataTable`, `ProductForm`, `InventoryEditor` (per store price/stock) | |
| `/admin/dispensaries`, `/admin/dispensaries/[id]` | `DispensaryForm` (offers pickup / delivery), `HoursEditor` (Store + Delivery tabs, 7 days each), `CoverageZipPicker` (delivery ZIPs), "Regenerate webhook secret" | |
| `/admin/brands`, `/admin/brands/[id]` | `BrandForm`, `BrandDispensaryPicker` | REQ-F-011 |
| `/admin/live-shows`, `/admin/live-shows/[id]` | `ShowForm` (format, brand, scheduled start/end), `PinnedProductsPicker` (only products with Owtlet price), Start / End show buttons | |
| `/admin/orders`, `/admin/orders/[id]` | `OrdersTable` (filters: status, date, store), `SubOrderStatusEditor` | |

**Data fields — User (admin, DB `users`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `email` | string (unique) | Yes | valid email | `ops@owtlet.com` | |
| `passwordHash` | string | Yes | argon2id of password ≥ 12 chars | — | Never returned by API |
| `name` | string | No | ≤ 80 | `Owtlet Ops` | |
| `role` | enum `Role` | Yes | `SUPERADMIN` \| `ADMIN` | `ADMIN` | SUPERADMIN manages admins |
| `isActive` | boolean | Yes | default true | | |

**Entity form fields**: Product (incl. `brandId`, `owtletPrice`), Category, Strain, Inventory (REQ-F-002/015), Brand + BrandDispensary (REQ-F-011), Dispensary + DispensaryHours STORE/DELIVERY (REQ-F-006/008/012/018, plus `name`, `slug`, `licenseNumber`, `offersPickup`, `offersDelivery`, `coverageZips`, `isActive`, `webhookSecret`), LiveShow + ShowProduct (REQ-F-003/016). Full lists are in **§2.2**.

**Step-by-step flow**
1. Admin logs in → `POST /api/admin/login` → argon2id verify → `owt_admin` session cookie.
2. CRUD screens call `/api/admin/*` (Zod-validated) → Prisma writes.
3. Bulk inventory: `PUT /api/admin/inventory` with `[{ productId, dispensaryId, price, stockQty }]` (upsert).
4. Orders: list/filter → open order → optional manual `PATCH /api/admin/sub-orders/{id} { status }` (logged).

**Business rules**
- All `/admin` routes and `/api/admin/*` require an active admin session; SameSite=Strict.
- Deleting a product with order history = deactivate (`isActive=false`), not hard delete.
- `webhookSecret` shown once at creation/regeneration.
- Dispensary `coverageZips` must all exist in `CoverageZip`.

**API endpoints used**: `POST /api/admin/login`, `GET|POST|PATCH|DELETE /api/admin/products`, `PUT /api/admin/inventory`, `GET|POST|PATCH /api/admin/dispensaries`, `GET|POST|PATCH /api/admin/brands`, `PUT /api/admin/brands/{id}/dispensaries`, `GET|POST|PATCH /api/admin/live-shows`, `POST /api/admin/live-shows/{id}/start|end`, `GET /api/admin/orders`, `PATCH /api/admin/sub-orders/{id}`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Wrong password | "Invalid email or password"; 5 attempts/min limit |
| Session expired | Redirect to `/admin/login` |
| Duplicate slug/SKU/terrificProductId | Inline validation error |
| Coverage ZIP not in list | Inline error "ZIP 10999 is outside the coverage area" |
| Empty tables | `EmptyState` with "Add Product" / "Add Dispensary" / "Schedule Live Show" CTA |

**Acceptance criteria**: `AC-ADM-01`.
- [ ] Logged-in admin can create/edit products (Owtlet price), inventory, brands + store assignment, dispensaries (pickup/delivery, ZIPs, store + delivery hours, handoff URL), live shows/shoppable videos (start/end), and view/update orders; unauthenticated access redirected.

**Dependencies / open questions**: Data for the forms comes from **Q-002** (dispensaries) and **Q-004** (products). Tasks: TASK-015 (brands admin in TASK-020, show start/end in TASK-016).

---

### REQ-F-011 — Brand Storefronts (Channels)

**Client source**: Nov 9 — *"Brands get their own storefronts (channels) on owtlet.com. They don't self-register: Owtlet sets each one up and manages it in the admin. Each brand picks which of our partner dispensaries fulfill its storefront orders. Checkout on a brand storefront works the same as the main cart, but only shows that brand's chosen stores. The admin needs a way to assign partner dispensaries to each brand."*

**Purpose / goal**: Give each brand its own storefront on owtlet.com (products + shows), fulfilled only by the partner stores Owtlet assigned to that brand.

**User stories**
- As a shopper, I want to open a brand's storefront and buy its products, knowing they come from that brand's partner stores.
- As an admin, I want to create a brand storefront and pick which partner dispensaries fulfill it.
- As a brand, my storefront orders only go to the stores I chose.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/brands` | `BrandGrid`, `BrandCard` (logo, name) | Active brands by `sortOrder` |
| `/brands/[slug]` | `BrandHero` (banner, logo, description), `ProductGrid` (brand products), `ShowRail` (brand shows), "Fulfilled by" store chips | Add to Cart sends `channelBrandSlug` |
| `/admin/brands`, `/admin/brands/[id]` | `BrandForm`, `BrandDispensaryPicker` (multi-select of active dispensaries) | Admin only |

**Data fields — Brand (DB `brands`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `name` | string | Yes | 2–80 chars | `Grand National` | |
| `slug` | string (unique) | Yes | kebab-case, auto from name | `grand-national` | `/brands/{slug}` |
| `description` | text | No | ≤ 2,000 | `Small-batch flower from upstate NY` | No medical claims |
| `logoUrl` / `bannerUrl` | string | No | HTTPS image URL | `https://…/logo.png` | |
| `isActive` | boolean | Yes | default `true` | | Inactive → 404 storefront |
| `sortOrder` | int | Yes | default 0 | `1` | |

**Data fields — BrandDispensary (DB `brand_dispensaries`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `brandId` + `dispensaryId` | uuid pair (PK) | Yes | both active | | A brand needs ≥ 1 store before it can be activated |

**Data fields — linked**: `Product.brandId`, `LiveShow.brandId`, `CartItem.channelBrandId`, `SubOrder.channelBrandId`.

**Step-by-step flow**
1. Admin creates the brand → assigns stores (`PUT /api/admin/brands/{id}/dispensaries { dispensaryIds[] }`) → activates it.
2. Shopper opens `/brands/[slug]` → `GET /api/brands/{slug}`.
3. Add to Cart → `POST /api/cart/items { source: "brand_storefront", channelBrandSlug, cartProducts }` → line saved with `channelBrandId`.
4. Checkout preview (REQ-F-007) filters candidate stores for those lines to the brand's stores (∩ pickup/delivery eligibility). Main-site lines in the same cart use all partner stores.
5. Store Orders record `channelBrandId` for reporting.

**Business rules**
- Brands never self-register and have no login (Owtlet admin manages everything).
- Same product added on the main site and on a brand storefront = two lines (different channel).
- If none of the brand's stores can fulfill a line → unfulfillable with suggestions (REQ-F-017) limited to the brand's stores; shopper can remove or re-add from the main shop.
- Prices follow REQ-F-015 (same as main site).

**API endpoints used**: `GET /api/brands`, `GET /api/brands/{slug}`, `POST /api/cart/items`, admin `GET|POST|PATCH /api/admin/brands`, `PUT /api/admin/brands/{id}/dispensaries`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Brand inactive / unknown slug | 404 page + link to `/shop` |
| Brand has no products | `EmptyState` "No products from {brand} yet — browse the Shop" |
| Store unassigned from brand while a cart holds brand lines | Next preview simply excludes it (no error) |
| Activate brand with no stores | 422 `VALIDATION_ERROR` "Assign at least one partner dispensary" |

**Acceptance criteria**: `AC-BRD-01`, `AC-BRD-02`.
- [ ] Admin can create a brand, assign dispensaries and see the storefront at `/brands/[slug]`.
- [ ] Checkout for brand-storefront items only offers the brand's assigned stores.

**Dependencies / open questions**: Brand list/assets come with the product data (**Q-004**); demo brands until then. Tasks: TASK-004 (schema), TASK-020.

---

### REQ-F-012 — Pickup or Delivery

**Client source**: Nov 11 — *"Pickup: yes, shoppers choose pickup or delivery."*; *"Delivery areas: each store sets its delivery ZIP codes and hours. Only stores that deliver to the shopper's address appear."*; Nov 9 — *"Delivery orders are paid before they leave the store."*

**Purpose / goal**: Let the shopper choose pickup or delivery at checkout and only show stores that can do that.

**User stories**
- As a shopper, I want to choose pickup or delivery before I see stores.
- As a shopper choosing delivery, I only want stores that deliver to my address.
- As a shopper choosing pickup, I want the nearest partner stores, even outside my home area.

**Screens / UI elements**: `/checkout` → `FulfillmentToggle` (Pickup / Delivery, default Delivery or last used), `AddressForm` (delivery) or `ZipForm` "Where are you picking up near?" (pickup), store cards badge "Pickup" / "Delivery".

**Data fields**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `Dispensary.offersPickup` | boolean | Yes | default `true` | `true` | |
| `Dispensary.offersDelivery` | boolean | Yes | default `true` | `true` | `coverageZips` required if true |
| `Dispensary.coverageZips` | string[] | Yes if delivery | each in `CoverageZip` | `["11201","11217"]` | Delivery ZIPs per store |
| `Order.fulfillmentType` / `SubOrder.fulfillmentType` | enum | Yes | `PICKUP` \| `DELIVERY` | `PICKUP` | One choice per checkout |
| request `zip` | string | Yes | 5 digits; DELIVERY → must be covered | `10001` | Pickup: used for distance only |

**Step-by-step flow**
1. Shopper selects Pickup or Delivery → preview with `fulfillmentType`.
2. DELIVERY: candidates = `offersDelivery` ∧ `zip ∈ coverageZips`; card shows delivery hours (REQ-F-018).
3. PICKUP: candidates = `offersPickup` (all active partner stores), sorted by distance from `zip`; card shows store hours + address.
4. Allocation, store change, suggestions as in REQ-F-007/013/017.
5. Order + Store Orders saved with `fulfillmentType`; handoff tells the shopper "Pickup at {store}" or "Delivery from {store}".

**Business rules**
- Payment and ID check stay with the store (delivery orders are paid before they leave the store — store-side rule, Owtlet only shows the notice).
- Switching the toggle re-runs the preview (store changes are kept only if still eligible).

**API endpoints used**: `POST /api/orders/preview`, `POST /api/orders`, `GET /api/dispensaries?zip=&fulfillment=`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Delivery ZIP not covered | 422 `NO_COVERAGE` + "Switch to Pickup" button |
| No store delivers an item | Unfulfillable with pickup suggestions (REQ-F-017) |
| Store offers neither | Hidden from shoppers; admin warning |

**Acceptance criteria**: `AC-FUL-01`, `AC-FUL-02`.
- [ ] Delivery shows only stores whose delivery ZIPs include the shopper's address ZIP.
- [ ] Pickup lists stores offering pickup, nearest first; the order records the fulfillment type.

**Dependencies / open questions**: Real per-store pickup/delivery setup (**Q-002**). Tasks: TASK-004, TASK-010, TASK-011, TASK-012.

---

### REQ-F-013 — Change Store at Checkout + Default Store

**Client source**: Nov 11 — *"When we have the shopper's ZIP, the system should pick the dispensary automatically."*; *"Shoppers must be able to change the store at checkout. For example, they might be ordering from home but picking up near work."*; *"Shopper profiles should have a default partner store setting."*; Nov 9 — *"Checkout leads with the store that has the most of the shopper's items, then shows other partner stores."*

**Purpose / goal**: Auto-select stores, but let the shopper switch any Store Order to another eligible store.

**User stories**
- As a shopper, I want the best store picked for me automatically.
- As a shopper, I want to tap "Change store" and pick another store that has my items.
- As a signed-in shopper, I want my default store used first.

**Screens / UI elements**: `SubOrderCard` → "Change store" → `StorePickerSheet` (list of `alternatives`: name, distance, open status, "Has all items" / "Missing 1 item"); badge "Your default store" / "You chose this store".

**Data fields**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `preferredDispensaryId` (request) | uuid | No | eligible store | | Whole-cart switch or profile default |
| `itemOverrides[]` (request) | `{ productId, dispensaryId }` | No | eligible store; max 30 | | Per-line switch |
| `SubOrder.assignment` | enum | Yes | `AUTO` \| `PROFILE_DEFAULT` \| `SHOPPER_CHANGED` | `SHOPPER_CHANGED` | |
| `Shopper.defaultDispensaryId` | uuid | No | active store | | REQ-F-014 |
| `alternatives[]` (response) | array | — | other eligible stores for that Store Order | | `canSupplyAll`, `missingProductIds`, `distanceMiles`, `isOpenNow` |

**Step-by-step flow**
1. Preview runs: overrides → preferred/default store → greedy auto (most items first).
2. Each Store Order returns `alternatives`.
3. Shopper picks a store → client re-calls preview with `preferredDispensaryId` (move all of that Store Order's lines) or `itemOverrides` → new allocation + `previewHash`.
4. Lines the chosen store can't supply stay unfulfillable with suggestions (REQ-F-017).

**Business rules**
- Only eligible stores (fulfillment type, ZIP, brand channel) can be chosen.
- Shopper choice beats profile default; profile default beats auto.
- Changing stores never splits a single line across stores.

**API endpoints used**: `POST /api/orders/preview`, `POST /api/orders`, `GET /api/dispensaries`.

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Chosen store not eligible | 422 `STORE_NOT_ELIGIBLE`, toast |
| Chosen store lacks some items | Those lines flagged + suggestions |
| Default store inactive / not eligible | Ignored silently, auto allocation |

**Acceptance criteria**: `AC-SEL-01`, `AC-SEL-02`.
- [ ] Shopper can switch a Store Order to another eligible store and the preview updates.
- [ ] A signed-in shopper's default store is used first when eligible.

**Dependencies / open questions**: None. Tasks: TASK-011, TASK-012, TASK-021.

---

### REQ-F-014 — Guest Checkout + Optional Shopper Profile

**Client source**: Nov 11 — *"Guest checkout with an optional profile (location, saved addresses, default store)"*; Nov 9 — *"Shoppers pick the store and enter their info on owtlet.com. Your build then hands the order to the checkout partner, where ID verification and payment happen."*; Nov 11 — *"ID: the dispensary checks ID during checkout on its own site… No ID collected or stored on Owtlet."*

**Purpose / goal**: Anyone can check out as a guest by entering contact info; shoppers may optionally create a profile to save location, addresses and a default store.

**User stories**
- As a guest, I want to check out without creating an account.
- As a returning shopper, I want my addresses and default store remembered.
- As Owtlet, I never store ID, DOB or payment data.

**Screens / UI elements**
| Route | Components | Notes |
|---|---|---|
| `/checkout` | `ContactForm` (first/last name, email, phone), `AddressForm` (delivery), "Sign in for faster checkout" link | Pre-filled when signed in |
| `/account/login`, `/account/register`, `/account/reset` | `LoginForm`, `RegisterForm`, `ResetForm` | Rate-limited |
| `/account` | `ProfileForm` (name, phone, home ZIP, default store picker), `AddressList`, `OrderHistory` | |
| `/order/[id]` (guest) | "Save my info for next time" → register pre-filled | |

**Data fields — checkout contact (stored on `Order`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `contact.firstName` / `lastName` | string | Yes | 1–50 chars | `Jane` / `Doe` | |
| `contact.email` | string | Yes | valid email | `jane@example.com` | Order reference / status |
| `contact.phone` | string | Yes | E.164 US (`+1…`) | `+12125550123` | Store contact |
| `deliveryAddress.line1`/`line2`/`city`/`state`/`zip` | string | DELIVERY only | `state = NY`, zip covered | `120 Atlantic Ave`, `Brooklyn`, `NY`, `11201` | |

**Data fields — Shopper (DB `shoppers`)**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `email` | string (unique) | Yes | valid email | `jane@example.com` | |
| `passwordHash` | string | Yes | argon2id of ≥ 10 chars | — | Never returned |
| `firstName`, `lastName`, `phone` | string | No | as above | | Pre-fill checkout |
| `homeZip` | string | No | 5 digits | `11201` | "Location" |
| `defaultDispensaryId` | uuid | No | active store | | REQ-F-013 |

**Data fields — ShopperAddress (DB `shopper_addresses`)**: `label` (≤ 30, `Home`), `line1`, `line2?`, `city`, `state` (`NY`), `zip`, `isDefault` (one per shopper).

**Data fields — PasswordResetToken**: `tokenHash` (SHA-256), `expiresAt` (1 h), `usedAt`.

**Step-by-step flow**
1. Guest: checkout → contact (+ address for delivery) → `POST /api/orders { contact, deliveryAddress, … }` → `Order.shopperId = null`.
2. Profile: register/login → `owt_shopper` cookie → anonymous cart merged into the shopper's cart → checkout pre-filled (default address, default store, home ZIP).
3. `saveToProfile: true` stores new contact/address on the profile.
4. Password reset by emailed 1-hour token (SMTP sender **Q-006**).

**Business rules**
- Guest checkout is always available; a profile is never required.
- Never collect DOB, government ID or payment data (ID is checked by the store).
- Shared login with owtlet.shop is **out of scope** (Shopify team; client accepted guest checkout on owtlet.shop — ADR-013).
- Contact data is used only for the order handoff/status, not marketing.

**API endpoints used**: `POST /api/orders`, `/api/account/*` (docs/08 §13).

**Edge cases & error states**
| Case | Behavior |
|---|---|
| Email already registered | 409 `EMAIL_TAKEN` → "Sign in instead" |
| Wrong password | 401 `INVALID_CREDENTIALS`; 5/min limit |
| Reset token expired/used | "This link has expired — request a new one" |
| Guest uses an email that has a profile | Allowed; order not linked unless signed in |

**Acceptance criteria**: `AC-PRF-01`, `AC-PRF-02`.
- [ ] Guest can complete checkout with contact info only; schema has no DOB/ID/payment fields.
- [ ] Signed-in shopper sees saved addresses and default store pre-filled and can edit them.

**Dependencies / open questions**: **Q-006** (email sender for password reset). Tasks: TASK-004, TASK-012 (contact form), TASK-021.

---

### REQ-F-015 — One Owtlet Price for Show Products

**Client source**: Nov 9 — *"Same price at every partner store for show products, so the cart shows one price."*; Nov 11 — *"Pricing: one Owtlet price for show products at every partner store."*; Nov 9 — *"Stock and price will come from the dispensary's POS through our checkout partner."*

**Purpose / goal**: A product featured in shows has one price everywhere; the cart shows one price.

**Data fields**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `Product.owtletPrice` | decimal(10,2) | Yes for show products | > 0 USD | `45.00` | Single price |
| `Inventory.price` | decimal(10,2) | Only if no `owtletPrice` | > 0 USD | `47.00` | Non-show products (POS price later) |
| `OrderItem.unitPrice` | decimal(10,2) | Yes | `owtletPrice ?? Inventory.price` snapshot | `45.00` | |

**Step-by-step flow**: Admin sets `owtletPrice` → pins product (`422 PRICE_REQUIRED` if missing) → catalog/cart/checkout use `owtletPrice` for every store.

**Business rules**
- Non-show products keep per-store prices because the client only fixed one price for show products (ADR-011). If the client later wants one price for everything, admin just sets `owtletPrice` on those products too — no schema change.
- Allocation tie-break "lowest subtotal" has no effect for one-price items (falls through to distance).

**Edge cases**: unpinning a product keeps its `owtletPrice` (still one price) · `owtletPrice` changed after preview → 409 `PREVIEW_STALE`.

**Acceptance criteria**: `AC-PRC-01`.
- [ ] A show product shows the same price on catalog, cart and every Store Order regardless of store; pinning a product without Owtlet price is rejected.

**Dependencies / open questions**: Real prices with the product data (**Q-004**). Tasks: TASK-004, TASK-006, TASK-015, TASK-016.

---

### REQ-F-016 — Cart Held Until 30 Minutes After the Show Ends

**Client source**: Nov 11 — *"Carts saved until 30 minutes after the show ends"*.

**Purpose / goal**: Viewers don't lose their cart while a show is running; it stays until 30 minutes after the show ends.

**Data fields**
| Field | Type | Required | Validation / rules | Example | Notes |
|---|---|---|---|---|---|
| `Cart.liveShowId` | uuid | No | show with `status = LIVE` at add time | | |
| `Cart.lastActivityAt` | datetime | Yes | now on change | | |
| `LiveShow.endedAt` | datetime | No | set by admin "End show" | `2026-11-28T00:42:00Z` | |
| `LiveShow.scheduledEndAt` | datetime | No | fallback end | | |

**Step-by-step flow**
1. Add from a LIVE show → `Cart.liveShowId` set.
2. While the show is LIVE: cart held (timer shows "Held until 30 min after the show ends").
3. Admin presses **End show** (`POST /api/admin/live-shows/{id}/end`) → `endedAt = now`, status → `REPLAY`, held carts get `expiresAt = max(lastActivityAt, endedAt) + 30 min`.
4. If End show is never pressed: `scheduledEndAt` is used as the end.
5. Non-show carts: 30 min inactivity (unchanged).

**Business rules**: rules in `docs/07` §2.2; a later add from another LIVE show re-links the cart to that show.

**Edge cases**: show runs past `scheduledEndAt` without End show and no `endedAt` while status is `LIVE` → still held (status wins) · cart edited after show end → normal 30-min inactivity from the edit, never shorter than `endedAt + 30 min`.

**Acceptance criteria**: `AC-HOLD-01`.
- [ ] A cart filled during a live show does not expire while the show is live and expires 30 min after End show (fake timers).

**Dependencies / open questions**: None (Terrific show-end webhook not required — admin End show + scheduled end). Tasks: TASK-007, TASK-008, TASK-016.

---

### REQ-F-017 — Out-of-Stock Flag + Alternative Store Suggestion

**Client source**: Nov 9 — *"Out-of-stock items are flagged before payment, with another store that has the item suggested."*; Nov 11 — *"Out of stock: suggest another partner store that has the item."*

**Purpose / goal**: Before handoff, flag any item the selected/eligible stores can't supply and suggest a partner store that has it.

**Data fields — `unfulfillable[]` (preview response)**
| Field | Type | Notes |
|---|---|---|
| `productId`, `name` | | |
| `reason` | `NOT_IN_STOCK_FOR_ZIP` \| `NOT_AT_SELECTED_STORE` \| `NOT_AT_BRAND_STORES` | |
| `suggestions[]` | `{ dispensaryId, dispensaryName, fulfillmentTypes[], distanceMiles }` | Active stores with `stockQty ≥ quantity`, nearest first, max 3 (brand lines: brand stores only) |

**Step-by-step flow**: preview → unfulfillable lines shown with "Available at {Store} (pickup · 3.2 mi)" → actions: "Switch to this store" (adds `itemOverrides`, may switch to Pickup) or "Remove" → Place Order disabled until resolved.

**Business rules**: flagged **before** handoff/payment; suggestion never shows stores with zero stock; product page also shows "Out of stock at {store} — available at {other store}".

**Edge cases**: no store anywhere has it → "Sold out at all partner stores" + remove only.

**Acceptance criteria**: `AC-OOS-01`.
- [ ] An item missing at the selected store is flagged with at least one partner store that has it, and choosing it updates the preview.

**Dependencies / open questions**: Real stock (**Q-002/Q-004**). Tasks: TASK-011, TASK-012.

---

### REQ-F-018 — Delivery Hours per Store

**Client source**: Nov 11 — *"Delivery areas: each store sets its delivery ZIP codes and hours."*

**Purpose / goal**: Each store keeps delivery hours separately from store (pickup) hours; delivery checkouts show delivery hours.

**Data fields**: `DispensaryHours.kind = DELIVERY` rows (`dayOfWeek`, `opensAt`, `closesAt`, `isClosed`) — same rules as REQ-F-008; unique (`dispensaryId`, `kind`, `dayOfWeek`).

**Step-by-step flow**: admin fills the Delivery tab of `HoursEditor` → `GET /api/dispensaries` / preview return `isDeliveringNow`, `deliveryHoursToday` → delivery Store Order card shows "Delivering now · until 9:00 PM" or "Delivery starts 11:00 AM".

**Business rules**: `offersDelivery = true` requires delivery hours (else admin warning and "Delivery hours not available"); outside delivery hours the store stays selectable with a notice (store decides timing after handoff).

**Acceptance criteria**: `AC-DLH-01`.
- [ ] Delivery checkout shows each store's delivery hours (NY time); pickup shows store hours.

**Dependencies / open questions**: Real hours (**Q-002**). Tasks: TASK-004, TASK-010, TASK-012, TASK-015.

---

### REQ-F-019 — owtlet.live → owtlet.com Redirect

**Client source**: Nov 9 — *"owtlet.live: redirects to owtlet.com."*

**Purpose / goal**: Anyone visiting owtlet.live lands on owtlet.com.

**Implementation**: Nginx `server_name owtlet.live www.owtlet.live` → `return 301 https://owtlet.com$request_uri;` on 80 and 443 (Let's Encrypt cert covers both names). DNS: `A owtlet.live` / `www.owtlet.live` → VPS IP (with Q-003).

**Edge cases**: deep link `owtlet.live/live/abc` → `owtlet.com/live/abc` (path kept, then age gate) · HTTPS on owtlet.live needs the cert before the redirect works over 443.

**Acceptance criteria**: `AC-RDR-01`.
- [ ] `curl -I https://owtlet.live/x` → `301` `Location: https://owtlet.com/x`.

**Dependencies / open questions**: **Q-003** (DNS access for owtlet.live as well as owtlet.com). Tasks: TASK-019.

---

## 2.2 Admin Data Entry Checklist (what the client must provide, field by field)

> Send this list to the client for data collection. **Bold** = required. Field names = Prisma fields in `docs/07-database-design.md`.

**Product** (one row per cannabis product)
- [ ] **`name`** (e.g. "Blue Dream 3.5g")
- [ ] **`category`** — Flower / Pre-Rolls / Vapes / Edibles / Concentrates
- [ ] **`strain`** name + **`type`** (INDICA / SATIVA / HYBRID / CBD) — required for flower, pre-rolls, vapes
- [ ] **`thcPercent`** (cannabis) · `cbdPercent`
- [ ] `weightGrams` (or mg for edibles in description)
- [ ] **`imageUrls`** — at least 1 image (jpg/png/webp, ≥ 1000 px)
- [ ] `description` (no medical claims) · `brand` (must exist as a Brand)
- [ ] **`owtletPrice`** — required for every product that will be pinned in a show (one price at all stores); otherwise per-store price in Inventory
- [ ] `sku` · `terrificProductId` (required if the product will be pinned in live shows)

**Dispensary** (one per partner store)
- [ ] **`name`** · `slug` (auto) · `licenseNumber` (NY OCM)
- [ ] **`addressLine1`**, **`city`**, **`state`** (NY), **`zip`** · `latitude` / `longitude` (optional)
- [ ] **`offersPickup`** · **`offersDelivery`**
- [ ] **`coverageZips`** — list of delivery ZIPs (must be within Manhattan, Queens, Brooklyn, Westchester, Long Island)
- [ ] **Store hours** — for each day Sun–Sat: **`opensAt`**, **`closesAt`** or **`isClosed`** (DispensaryHours `kind=STORE`)
- [ ] **Delivery hours** — same 7-day grid (`kind=DELIVERY`) if the store delivers
- [ ] **`handoffChannel`** — `LEAFLY` or `RETAILER_PAGE`
- [ ] **`handoffUrlTemplate`** — order page URL that can accept an order reference (if RETAILER_PAGE) · `leaflyStoreId` (if LEAFLY, format pending Q-001)
- [ ] Confirmation method — webhook (we issue **`webhookSecret`**) or signed link (Q-002)
- [ ] `isActive`

**Inventory** (one row per product × dispensary)
- [ ] **`product`** (name or SKU) · **`dispensary`**
- [ ] **`price`** (USD) — only for products without an Owtlet price
- [ ] **`stockQty`**
- [ ] `externalSku` (store/POS SKU)

**Brand** (one per brand storefront)
- [ ] **`name`** · `slug` (auto) · `description` · `logoUrl` · `bannerUrl` · `sortOrder`
- [ ] **Partner dispensaries** that fulfill this brand's storefront orders (BrandDispensary)

**LiveShow / Shoppable video**
- [ ] **`title`** · `description` · **`format`** (LIVE_SHOW / SHOPPABLE_VIDEO) · `brand` (optional)
- [ ] **`scheduledAt`** (date + time, New York time) · `scheduledEndAt`
- [ ] `terrificShowId` (from Terrific dashboard) · `embeddingId` (default `Cki70GhqvLgWGhJbSxg2`)
- [ ] `thumbnailUrl`
- [ ] **`status`** (SCHEDULED / LIVE / REPLAY / ARCHIVED — admin updates)

**ShowProduct** (pinned products per show)
- [ ] **`show`** · **`product`** (must have `terrificProductId` and `owtletPrice`)
- [ ] `sortOrder`

---

## 3. Technology Preferences
- **Frontend**: Next.js 14+ (App Router, React Server Components), TypeScript, Tailwind CSS + CSS variables, shadcn/Radix UI, Zustand (client state), TanStack Query (server state), React Hook Form + Zod
- **Backend**: Next.js Route Handlers (`app/api/*`) + Server Actions in the **same** Next.js app — no separate NestJS service
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache / Messaging**: Redis (optional — 30-min cart TTL & sessions; PostgreSQL `expiresAt` fallback)
- **Mobile (Optional)**: N/A — not required for this project (responsive web only)
- **Live Shopping**: Terrific SDK v2 (client-side `window.terrificLiveSettings` hooks)
- **Accessories**: Out of scope — handled by the separate `owtlet.shop` Shopify project
- **Hosting / Infrastructure**: Docker + Nginx reverse proxy on a client-provided Linux VPS (DNS for `owtlet.com` to be finalized); Node.js >= 20 LTS; pnpm or npm
