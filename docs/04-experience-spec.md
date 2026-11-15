# UI/UX Experience Specification & Micro-Interaction Standards

> **Owner**: `jarvis` (UI/UX Specialist)  
> **Target Implementer**: `friday` (Web Frontend). Mobile (`thor`) N/A for Owtlet.  
> **Philosophy**: Eliminate AI-generated "cardboard" UIs by enforcing micro-interactions, tactile feedback, density scales, and spatial ergonomics.

---

## 1. Tactile Micro-Interactions & Transitions
Every interactive element MUST include animated micro-feedback so the interface feels alive and responsive:

### 1.1 Button & Clickable Tokens
- **Transition**: `transition-all duration-150 ease-in-out`
- **Hover**: Subtle brightness change or background lift (`hover:bg-primary/90`, `hover:shadow-sm`)
- **Active / Press**: Tactile compression effect (`active:scale-[0.98]`)
- **Focus**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled**: `disabled:pointer-events-none disabled:opacity-50 cursor-not-allowed`

### 1.2 Interactive Cards & List Items
- Cards with navigation must show subtle elevation on hover:
  `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer border border-border/60 hover:border-border`

### 1.3 Modals, Sheets & Dropdowns
- Modals must animate with enter/leave ease:
  `animate-in fade-in-0 zoom-in-95 duration-150`
- Backdrop blur: `backdrop-blur-sm bg-background/80`

---

## 2. Touch Targets & Spatial Ergonomics (Fitts's Law)
- **Minimum Clickable Target**: No button, icon toggle, or input touch area may be smaller than **44×44px** (especially on mobile and tablet viewport). For compact icon buttons (`w-8 h-8`), use padding or pseudo-elements (`before:p-2`) to expand the hit target.
- **Form Inputs**: Default input height minimum `h-10` (40px) or `h-11` (44px) for mobile.

---

## 3. Visual Hierarchy & Density Matrix

| Context | Container Padding | Item Gap | Font Size | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Data Tables / Feeds** | `py-2 px-3` | `gap-1.5` | `text-xs / text-sm` | High-density admin views, transaction logs |
| **Standard Cards / Forms** | `p-4 sm:p-6` | `gap-4` | `text-sm / text-base` | Typical dashboard widgets, user forms |
| **Hero / Landing Sections** | `py-12 px-6` | `gap-6` | `text-xl / text-3xl` | Promotional blocks, feature highlights |

---

## 4. Toast & Feedback Notification Architecture
- Every mutation (Create, Update, Delete, Toggle) MUST trigger immediate visual feedback:
  - **Success**: Sonner / Toast (`toast.success("Item saved successfully")`)
  - **Failure**: Sonner / Toast with descriptive message (`toast.error("Failed to update item. Please check network.")`)
  - **Optimistic UI**: When feasible, update local state immediately and roll back on error.

---

## 5. Skeleton Loading Standard
- Skeletons must mimic the exact layout of the target content:
  - Header: `h-6 w-1/3 rounded animate-pulse bg-muted`
  - Subtext: `h-4 w-2/3 rounded animate-pulse bg-muted/70 mt-2`
  - Avatar: `h-10 w-10 rounded-full animate-pulse bg-muted`
- Never show raw spinners in the middle of an empty page when skeleton layout can be applied.

---

## 6. Owtlet Key User Journeys

### J-1: Age Gate → Browse / Live
1. First visit to any route → middleware redirects to `/age-gate?next=<path>` (no catalog, video or prices render before this).
2. Shopper taps **"I'm 21 or older"** → Server Action sets signed `owt_age` cookie → redirect to `next`. **"I'm under 21"** → exit screen ("Come back when you're 21"), no cookie.
3. Home (`/`) shows the current live show (Terrific embed, LIVE badge in Ember) or the next scheduled show + replays rail, then featured products.

### J-2: Add to Cart from Live / Replay
1. Viewer taps a pinned product in the Terrific player → `cartSyncHandler({ action: "addProductToCart", cartProducts })`.
2. Item → Owtlet cart (all live-show products are cannabis; unmapped products → error toast "This product isn't available on Owtlet yet."). Toast: *"Blue Dream 3.5g added to your cart."*; cart badge animates. Show products show one Owtlet price.
3. During a live show the cart drawer shows *"Held until 30 min after the show ends"*; after End show it counts down from `expiresAt`. Carts not linked to a live show (catalog, replay, shoppable video, brand storefront) show a **30:00 countdown** reset on every change. On expiry the cart empties with an Expired state + "Browse again" CTA.
4. Shoppable videos (`/videos`) and replays use the same add-to-cart flow.

### J-3: Browse Catalog → Add to Cart
1. `/shop` → filter by category / strain / THC → product detail shows per-store availability (store name, price, in-stock).
2. "Add to Cart" → same cart service as J-2.

### J-3b: Brand Storefront
1. `/brands` → pick a brand → `/brands/[slug]` (banner, products, brand shows, "Fulfilled by" store chips).
2. "Add to Cart" → same cart, line tagged with the brand channel → at checkout only the brand's stores are offered for it.

### J-4: Cannabis Checkout Handoff
1. `/checkout` → **Pickup / Delivery** toggle. Delivery: address form (ZIP inside coverage list); Pickup: "Picking up near?" ZIP (pre-filled from profile home ZIP).
2. Preview shows the split: one card per dispensary with items, subtotal, **open/closed + store hours** (pickup) or **delivery hours** (delivery), distance, and a badge *Auto-selected* / *Your default store* / *You chose this store*.
3. **"Change store"** on a card → sheet with eligible alternatives (distance, open now, "Has all items" / "Missing 1 item") → preview refreshes.
4. Items no eligible store can fulfill are flagged (*"Out of stock at Store A — available at Store C (pickup · 3.2 mi)"*) with "Switch to this store" or "Remove"; Place Order stays disabled until resolved.
5. Contact form: first/last name, email, phone (+ address for delivery); signed-in shoppers see it pre-filled; guests see "Sign in for faster checkout" (optional).
6. **"Continue to [Leafly | Store name]"** per sub-order → opens the handoff URL (new tab), sub-order status `HANDED_OFF`. Copy: *"You'll complete your purchase and ID check with the licensed dispensary. Owtlet never takes payment for cannabis."*
7. `/order/[id]` is the single confirmation screen for all Store Orders: Handed off → Confirmed (after store confirmation link/webhook). Guests get "Save my info for next time".

### J-5: Optional Shopper Profile
1. `/account/register` or `/account/login` (from header or checkout) → cart merges into the profile.
2. `/account`: name, phone, home ZIP (location), default partner store, saved addresses, order history.
3. Forgot password → emailed 1-hour reset link.

