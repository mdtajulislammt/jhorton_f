# 04 — Design System & UI Specifications

> Owned and maintained by `jarvis`.
>
> **Brand source**: Extracted on 2026-11-15 from the live `owtlet.shop` Shopify theme (store `f1jc7p-fs`, password page theme CSS color schemes 1–6 and font settings) and the `owtlet.com` Webflow launch page (`::selection` colors `#0D221E` / `#70F1C7`, logo "Owtlet™ Live Shopping for Cannabis"). Note: the bare `owtlet.shop` domain currently shows a registrar parking page; the theme was read from the Shopify storefront itself. Values below are **fetched, not provisional** — confirm final logo files with the client.

---

## 1. Color Palette Tokens (Semantic CSS Variables)

| Brand Name | Hex | Shopify source |
|---|---|---|
| Owtlet Ink (deep forest green) | `#0D221E` | foreground / heading, primary button text |
| Owtlet Mint | `#70F1C7` | primary, borders, primary button bg, selection |
| Owtlet Sage | `#BBD7D1` | secondary button bg, scheme-2 background |
| Owtlet Mist (off-white) | `#F8FAFC` | scheme-1 background |
| Owtlet Night (near-black green) | `#040B0A` | scheme-4 (dark) background |
| Owtlet Volt (lime) | `#DFFE52` | primary button hover, dark-scheme primary |
| Owtlet Ember (orange accent) | `#ED742E` | scheme-2 primary / accent |

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-primary: #f8fafc;        /* Owtlet Mist */
  --bg-secondary: #bbd7d1;      /* Owtlet Sage */
  --bg-card: #ffffff;
  --border-subtle: #d6e6e2;     /* Sage tint */

  /* Typography */
  --text-primary: #0d221e;      /* Owtlet Ink */
  --text-secondary: #3d524e;    /* Ink 80% */
  --text-muted: #6e7f7c;        /* Ink 60% */

  /* Brand / Primary */
  --primary: #70f1c7;           /* Owtlet Mint */
  --primary-hover: #dffe52;     /* Owtlet Volt (matches Shopify hover) */
  --primary-foreground: #0d221e;
  --secondary: #bbd7d1;         /* Owtlet Sage */
  --secondary-foreground: #0d221e;
  --accent: #ed742e;            /* Owtlet Ember — LIVE badges, sale tags */
  --accent-foreground: #ffffff;
  --ink: #0d221e;
  --ring: #0d221e;

  /* Semantic Feedback */
  --success: #1f9d72;
  --warning: #f59e0b;
  --danger: #d93f3f;
  --info: #2f7fd1;
}

.dark {
  /* Used for live/video surfaces and dark sections (Shopify color-scheme-4) */
  --bg-primary: #040b0a;        /* Owtlet Night */
  --bg-secondary: #0d221e;      /* Owtlet Ink */
  --bg-card: #12302a;
  --border-subtle: #1f4a41;

  --text-primary: #f8fafc;
  --text-secondary: #bbd7d1;
  --text-muted: #7fa39b;

  --primary: #70f1c7;
  --primary-hover: #dffe52;
  --primary-foreground: #0d221e;
  --accent: #ed742e;
  --ring: #70f1c7;
}
```

> **Contrast rules**: Mint `#70F1C7` is a **background/accent** color — always pair it with Ink `#0D221E` text (≈ 12:1), never white text. Ember `#ED742E` with white text only at ≥ 18px bold (badges); use Ink text otherwise.

---

## 2. Typography Hierarchy
- **Font Family**:
  - Headings / display / accent: `"Dela Gothic One", system-ui, sans-serif` (from Shopify `--font-heading--family` / `--font-accent--family`) — via `next/font/google`.
  - Body / subheading / UI: `"Red Rose", system-ui, sans-serif` (from Shopify `--font-body--family` / `--font-subheading--family`) — via `next/font/google`.
- **Heading 1**: `2.25rem (36px)`, Dela Gothic One 400, tracking tight (`tracking-tight`), uppercase optional for hero
- **Heading 2**: `1.875rem (30px)`, Dela Gothic One 400
- **Heading 3**: `1.5rem (24px)`, Red Rose 700
- **Body Regular**: `1rem (16px)`, Red Rose 400, line-height 1.5
- **Caption / Helper**: `0.875rem (14px)`, Red Rose 400, text-secondary
- **Spacing scale**: Tailwind default 4px base (`1 = 4px`); section padding `py-12 md:py-20`; card padding `p-4 sm:p-6`.
- **Radius**: `--radius: 0.75rem` (cards), pill buttons `rounded-full` (matches Shopify theme buttons).
- **Iconography**: Lucide icons; LIVE badge = Ember background + pulsing dot.

---

## 3. Mandatory 6 UI States Matrix
| State | Visual Requirement | Implementation Rule |
|---|---|---|
| **1. Default/Success** | Crisp data rendering, balanced padding; product cards show strain badge, THC/CBD, from-price | Follow card & grid layout |
| **2. Loading Skeleton** | Shimmer animation mirroring content shape (product card, video frame 16:9) | `<Skeleton className="h-6 w-32" />` |
| **3. Empty State** | Centered icon, headline, helpful description, CTA button (e.g. "Your cart is empty — Watch a live show") | `<EmptyState icon={ShoppingBag} action={...} />` |
| **4. Error/Validation** | Inline red helper text and toasts for API errors (e.g. "We don't deliver to 10001 yet") | React Hook Form `<ErrorMessage />` |
| **5. Responsive** | Fluid adaptivity across mobile, tablet, and desktop; video full-width on mobile | Tailwind `sm:`, `md:`, `lg:` utilities |
| **6. Interactive/A11y** | Visible focus rings (`focus-visible:ring-2 ring-[--ring]`), hover Mint→Volt transitions | WCAG 2.2 AA compliant contrast |
