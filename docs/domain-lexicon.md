# 📚 Domain Lexicon & Copywriting Engine

> **Mandate**: Zero Dummy Text Policy (`AGENTS.md` Section 5.1).  
> Owned by `iron_man` (extraction) and enforced by `jarvis` (UI copy) and `friday` (frontend pages).

---

## 1. Domain Extraction Protocol

When `iron_man` reads client requirements in `README.md` during Project Discovery, it extracts and populates this document with domain-specific vocabulary. All agents MUST use these terms in UI components, form placeholders, table column headers, and empty states.

```markdown
### Active Project Lexicon

- **Industry / Domain**: Cannabis E-commerce / Live Shopping (regulated adult-use cannabis, New York State)
- **Target Audience**: Adult (21+) cannabis consumers in Manhattan, Queens, Brooklyn, Westchester County and Long Island; partner dispensaries; Owtlet admins
- **Brand Tone**: Bold, culture-forward & playful-but-trustworthy — "Owtlet™ Live Shopping for Cannabis". Short punchy headlines (Dela Gothic One), friendly plain-language body (Red Rose), Mint-on-Ink energy from the owtlet.shop / owtlet.com brand. Responsible-use, never medical claims, never targeting minors.
- **Currency & Formatting**: USD ($), 2-decimal formatting (`$45.00`); weights in grams (`3.5g`) or eighths ("1/8 oz"); potency as `THC 24.1%` / `CBD 0.2%`; times in America/New_York (`Open · Closes 10:00 PM`)
- **Primary Entity Names**:
  - Entity 1: "Product" for catalog items; cannabis items show their **Strain** (e.g. "Blue Dream 3.5g — Hybrid") (never "Item" or "Post")
  - Entity 2: "Dispensary" / "Store" for licensed partner retailers (never "Vendor" or "Seller")
  - Entity 3: "Live Show" (live), "Replay" (recording of a live show) and "Shoppable Video" (short pre-recorded video) (never "Event")
  - Entity 4: "Order" (parent) and "Store Order" (per-dispensary sub-order) (never "Ticket")
  - Entity 5: "Cart" (held until 30 minutes after the live show ends, or 30 minutes after your last change) — cannabis only; never use "Accessory" in UI copy (accessories are out of scope)
  - Entity 6: "Brand Storefront" (a brand's channel on Owtlet) (never "Vendor shop")
  - Entity 7: "Pickup" / "Delivery" (fulfillment choice) (never "Shipping")
  - Entity 8: "Owtlet Price" (one price at every partner store for show products)
  - Entity 9: "Profile" (optional shopper account) and "Guest checkout" (never "Member")
- **Standard Action Labels**:
  - Create Action: "Add to Cart", "Add Dispensary", "Add Brand Storefront", "Schedule Live Show", "Add Shoppable Video", "Add Product"
  - Submit Action: "Check Delivery ZIP", "Change Store", "Switch to this store", "Place Order", "Continue to Leafly", "Continue to [Store Name]", "I'm 21 or Older", "Save my info for next time", "End Show"
- **Signature Copy**:
  - Age gate: "You must be 21+ to enter Owtlet." / "I'm 21 or Older" / "I'm Under 21"
  - Handoff: "You'll complete your purchase and ID check with the licensed dispensary. Owtlet never takes payment for cannabis."
  - Cart timer: "Your cart is held for 30:00" / during a show: "Held until 30 min after the show ends"
  - Out of stock: "Out of stock at {Store} — available at {Other Store} (pickup · 3.2 mi)"
  - Store badges: "Auto-selected" · "Your default store" · "You chose this store"
  - Brand storefront: "Fulfilled by {Store A}, {Store B}"
  - No coverage: "We don't deliver to {zip} yet — we currently serve Manhattan, Queens, Brooklyn, Westchester & Long Island."
  - Empty cart: "Your cart is empty — catch a Live Show or browse the Shop."
```

---

## 2. Anti-Patterns (Strictly Forbidden in UI Code)

| ❌ Forbidden Pattern | Why It Fails | ✅ Required Domain Replacement |
|---|---|---|
| `"Lorem ipsum dolor sit amet"` | Destroys realism and client trust | Real contextual descriptions matching domain |
| `"Card Title" / "Item 1, 2, 3"` | Generic placeholder laziness | Actual entity names (e.g., "Dr. Sarah Jenkins", "Stripe Invoice #1042") |
| `"Button" / "Submit" / "Click here"` | Vague, poor accessibility | Action verbs (e.g., "Deploy Container", "Transfer Funds", "Download Report") |
| `"No data found"` | Boring, unhelpful empty state | Friendly empty state with Lucide icon + primary CTA |
| Broken image links (`/placeholder.jpg`) | Renders broken UI icons | SVG fallback avatar with user initials or Lucide icon |

---

## 3. Mandatory Copy Rules for Jarvis & Friday

1. **Empty States**: Every empty state must have:
   - An intuitive Lucide icon (e.g., `<FolderOpen />`, `<FileQuestion />`).
   - A friendly heading: *"No [Entity Names] yet"*.
   - A descriptive sentence: *"Get started by creating your first [Entity Name] below."*
   - A high-visibility primary CTA button: *"[Create Entity Name]"*.
2. **Form Placeholders**: Must provide helpful examples:
   - Email: `name@company.com`
   - Name: `Jane Doe`
   - Search: `Search by [entity name, order ID, patient ID]...`
3. **Toasts & Feedback**:
   - Success: `"[Entity Name] created successfully."`
   - Failure: `"Failed to save [Entity Name]. Please check your input."`

