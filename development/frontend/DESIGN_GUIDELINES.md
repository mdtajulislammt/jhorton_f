# Frontend UI/UX Design System Guidelines — Owtlet™

> **Owner**: `jarvis` (UI/UX Specialist)  
> **Brand Source**: `owtlet.shop` Shopify Theme (Mint `#70F1C7`, Ink `#0D221E`, Sage `#BBD7D1`, Dela Gothic One + Red Rose)  
> **Target Audience**: 21+ adult-use cannabis shoppers in New York State (Manhattan, Brooklyn, Queens, Westchester, Long Island), partner dispensaries, and admins.

---

## 1. Brand Tokens & Color Palette

All UI components MUST consume semantic CSS variables and Tailwind tokens defined in `src/app/globals.css` and `tailwind.config.ts`.

### 1.1 Color Palette Matrix

| Token Name | Hex | Semantic Role | Contrast / Usage Rule |
|---|---|---|---|
| **Owtlet Ink** | `#0D221E` | Primary text, headings, button text on Mint | Base foreground. Deep forest green. |
| **Owtlet Mint** | `#70F1C7` | Primary brand accent, primary button bg, selection | **STRICT RULE**: Always pair with Ink text (≈ 11.9:1 contrast). Never white text! |
| **Owtlet Sage** | `#BBD7D1` | Secondary button bg, borders, subtle badges | Soft sage tint. Secondary container surface. |
| **Owtlet Mist** | `#F8FAFC` | Light mode canvas / page background | Clean, high-legibility backdrop. |
| **Owtlet Night** | `#040B0A` | Dark mode background (live shopping stream surfaces) | Deep near-black green for immersive video feeds. |
| **Owtlet Volt** | `#DFFE52` | Primary button hover state | High-energy lime transition on hover. |
| **Owtlet Ember** | `#ED742E` | LIVE badges, cart reservation countdowns, sale tags | Pulsing live stream indicator. Pair with bold white text. |
| **Success** | `#1F9D72` | In-stock badges, order confirmed status | Emerald green feedback. |
| **Warning** | `#F59E0B` | Cart reservation expiring (< 5 min), low stock warnings | Amber alert state. |
| **Danger** | `#D93F3F` | Out of stock alerts, age gate denial, validation errors | Crisp red feedback. |

### 1.2 Contrast Rules (WCAG 2.2 AA Compliance)
- **Mint `#70F1C7` + Ink `#0D221E`**: Contrast ratio is **11.88:1** (exceeds WCAG 2.2 AAA standard).
- **White `#FFFFFF` + Mint `#70F1C7`**: Contrast ratio is only **1.39:1** (**FAILS** accessibility). **NEVER** use white text on a Mint background.
- **Ember `#ED742E` + White `#FFFFFF`**: Contrast ratio is **3.2:1** (compliant for bold badges ≥ 14px / large text).

---

## 2. Typography Hierarchy

- **Headings & Display**: `"Dela Gothic One"`, loaded via `next/font/google` (`--font-heading`, Tailwind `font-heading`).
  - Hero display: `font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight`
  - Page title (H1): `font-heading text-2xl sm:text-3xl tracking-tight`
  - Section title (H2): `font-heading text-xl sm:text-2xl`
  - Card title (H3): `font-heading text-lg sm:text-xl`
- **Body & Subtitles**: `"Red Rose"`, loaded via `next/font/google` (`--font-body`, Tailwind `font-body`).
  - Body Regular: `font-body text-base leading-relaxed`
  - Body Small / Captions: `font-body text-xs sm:text-sm text-muted-foreground`

---

## 3. Mandatory 6 UI States Matrix & Implementation Patterns

Every feature screen and interactive component must handle the full 6-state lifecycle:

### State 1: Default / Success State
Crisp typography, balanced spacing, real domain entities (cannabis strains, potencies, NYC dispensary info, USD pricing).

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card interactive className="overflow-hidden">
      <div className="aspect-square bg-secondary/30 relative">
        <Badge variant="default" className="absolute top-3 left-3">
          Hybrid
        </Badge>
      </div>
      <CardHeader>
        <CardTitle>Blue Dream 3.5g</CardTitle>
        <p className="text-xs text-muted-foreground">THC 24.1% · CBD 0.2%</p>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-xl text-foreground">$45.00</p>
        <p className="text-xs text-muted-foreground">Available at Gotham Dispensary</p>
      </CardContent>
      <CardFooter>
        <Button variant="default" size="default" className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### State 2: Loading Skeleton State
Shimmering pulse placeholders mirroring the exact dimensions of loaded content. Never render blank pages or raw spinners.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full rounded-full" />
      </CardFooter>
    </Card>
  );
}
```

### State 3: Empty State
Centered Lucide icon, explanatory headline, helpful message, and an actionable CTA button.

```tsx
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export function EmptyCartView() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="Your cart is empty"
      description="Catch a Live Show or browse curated drops from licensed New York dispensaries."
      action={{
        label: "Explore Live Shows",
        href: "/",
      }}
    />
  );
}
```

### State 4: Validation & Error State
Inline helper text under invalid form inputs, contextual notices for fulfillment gaps (out of stock, ZIP restriction), and toast alerts.

```tsx
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DeliveryZipInput({ error, helperText, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">Delivery ZIP Code</label>
      <Input
        placeholder="e.g. 10001 (Manhattan)"
        error={Boolean(error)}
        helperText={helperText || "We deliver to Manhattan, Brooklyn, Queens, Westchester & Long Island."}
        {...props}
      />
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-danger font-medium mt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>We don't deliver to this ZIP yet. Choose pickup or enter an eligible NY ZIP.</span>
        </div>
      )}
    </div>
  );
}
```

### State 5: Responsive State
Mobile-first layout structure. Minimum 44×44px touch targets on mobile (Fitts's Law), full-width video on small viewports, and adaptive grids.

```tsx
// Responsive Grid Standard
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
  {products.map((item) => (
    <ProductCard key={item.id} product={item} />
  ))}
</div>
```

### State 6: Interactive & Accessibility State
Visible keyboard focus ring (`focus-visible:ring-2 focus-visible:ring-ring`), tactile compression on click (`active:scale-[0.98]`), and smooth transitions.

```tsx
// Pill Button with Owtlet Signature Hover
<button className="h-10 px-5 rounded-full bg-primary text-primary-foreground font-semibold transition-all duration-150 ease-in-out hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Reserve Line Item
</button>
```

---

## 4. Primitives Catalog

| Primitive | Path | Variants / Capabilities |
|---|---|---|
| **Button** | `src/components/ui/button.tsx` | Pill-shaped (`rounded-full`), `default` (Mint→Volt), `secondary` (Sage), `accent` (Ember), `destructive`, `outline`, `ghost`, `link`, `isLoading` spinner, tactile `active:scale-[0.98]`. |
| **Badge** | `src/components/ui/badge.tsx` | `default` (Mint bg + Ink text), `secondary` (Sage bg + Ink text), `live` (Ember bg + white text + pulsing dot), `destructive`, `outline`, `success`, `warning`. |
| **Card** | `src/components/ui/card.tsx` | `rounded-xl border border-border bg-card`, `interactive` hover elevation, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. |
| **Input** | `src/components/ui/input.tsx` | `h-10 sm:h-11` (44px touch ergonomics), accessible `error` state, `helperText`, `focus-visible:ring-2`. |
| **Dialog** | `src/components/ui/dialog.tsx` | Backdrop blur `backdrop-blur-sm bg-black/60`, enter/leave animations `animate-in zoom-in-95`, accessible close button with focus ring. |
| **Skeleton** | `src/components/ui/skeleton.tsx` | Shimmer pulse `animate-pulse bg-owtlet-sage/30 dark:bg-owtlet-ink/60`. |
| **EmptyState** | `src/components/ui/empty-state.tsx` | Lucide icon container, heading, descriptive copy, primary CTA button. |

---

## 5. Copywriting Rules (Zero Dummy Text Policy)

1. **Cannabis Entities**: Use "Product" with strain name and classification (e.g., *"Sour Diesel 3.5g — Sativa"*), never "Item" or "Post".
2. **Retail Partners**: Use "Dispensary" or "Partner Store" (e.g., *"Fulfilled by Union Square Herbal"*), never "Vendor" or "Seller".
3. **Shopping Mediums**: Use "Live Show", "Replay", and "Shoppable Video", never "Webinar" or "Event".
4. **Fulfillment**: Use "Pickup" or "Delivery", never "Shipping".
5. **No Lorem Ipsum**: All empty states, banners, buttons, and helper texts must feature realistic New York adult-use cannabis information.
