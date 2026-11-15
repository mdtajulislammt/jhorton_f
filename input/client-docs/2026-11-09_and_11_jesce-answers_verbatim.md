# Jesce Horton — written answers (verbatim)

> Source: team group-chat export `2026-11-08_to_14_team-group-chat-export_with-jesce-answers.html` (relayed by AuraNest Webflow / Akib).
> Team's own write-up sent to Jesce on Nov 11: `2026-11-11_Owtlet-Platform-Technical-Clarifications_team-to-client.pdf`.
> Scope note (developer, 2026-11-15): the custom build is **cannabis-only**; accessories, owtlet.shop and shared login are the Shopify team's part (ADR-008).

---

## Message 1 — Nov 9, 2026 (answers to the team's 4 questions)

Hi Akib, Thanks for getting up to speed. The SRS didn’t come through in your email. Could you resend it as an attachment? Answers to your questions are below.

### 1. Vendor onboarding

Dispensaries don’t self-register, and they don’t get their own storefronts. Owtlet onboards each partner and manages the catalog in an Owtlet admin. Each partner carries a select set of Owtlet products, not its full menu. Stock and price will come from the dispensary’s POS through our checkout partner. Until that feed is live, Owtlet holds the inventory counts in your database. Brands get their own storefronts (channels) on owtlet.com. They don’t self-register: Owtlet sets each one up and manages it in the admin. Each brand picks which of our partner dispensaries fulfill its storefront orders. Checkout on a brand storefront works the same as the main cart, but only shows that brand’s chosen stores. The admin needs a way to assign partner dispensaries to each brand.

### 2. Site structure and Shopify

owtlet.com: the main site. Live shows, brand storefronts and cannabis shopping. This is your custom build with its own database. It’s on Shopify today and moves off it. owtlet.shop: accessories and merch on Shopify, using Shopify’s own cart and checkout. Nothing cannabis goes into Shopify. owtlet.live: redirects to owtlet.com. Each site has one cart and one checkout button. Products go to the right cart automatically, and the shopper never chooses. When a shopper adds an accessory during a live show on owtlet.com, it should go into the owtlet.shop cart in the background with a notice (“Added to your Owtlet Shop cart”), without leaving the show. Please confirm this is doable with Terrific and Shopify. One account across both sites. A shopper should sign in once and be signed in on owtlet.com and owtlet.shop. Please tell us how you’d build it (for example, Shopify customer accounts as the base) and whether it needs a specific Shopify plan. Jesce

[second part, Nov 09, 8:10 PM]

### 3. Payments

Cannabis: Owtlet never takes cannabis payments. Shoppers pick the store and enter their info on owtlet.com. Your build then hands the order to the checkout partner, where ID verification and payment happen. That’s one payment per store. No ID is uploaded or stored on Owtlet. Delivery orders are paid before they leave the store. The partner is still being finalized (Leafly is the lead option; the fallback is each retailer’s own order page), so build the handoff as one swappable step. Accessories and merch: Shopify checkout on owtlet.shop with an Authorize.net gateway on a high-risk merchant account, plus Apple Pay and Google Pay. Shopify Payments is off.

### 4. Order management

Cannabis and accessory orders never combine. They’re separate carts on separate sites. Multiple dispensaries: Checkout leads with the store that has the most of the shopper’s items, then shows other partner stores. If no single store has everything, the cart splits into one order per store. Out-of-stock items are flagged before payment, with another store that has the item suggested. For delivery, only stores that serve the shopper’s address appear. The shopper gets one confirmation screen covering all their orders, and order status comes back to Owtlet. Same price at every partner store for show products, so the cart shows one price. Can we meet later today? Jesce

---

## Message 2 — Nov 11, 2026 ("Re: Owtlet Platform – answers, deadline and next steps")

Subject: Re: Owtlet Platform – answers, deadline and next steps
Hi Akib,
Thanks for the detailed write-up. Answers and direction below.
Deadline
Dec 1 is a hard deadline. All five phases need to be finished before then. Please send a schedule with dates for each phase that finishes by Dec 1, plus your quote.
Dispensary selection
- When we have the shopper's ZIP, the system should pick the dispensary automatically.
- For launch only, if it saves time and is what lets us hit Dec 1, we can list all partner stores in a dropdown instead. We have a small number of partners. Tell us if the dropdown actually saves time; otherwise build the automatic selection.
- Shoppers must be able to change the store at checkout. For example, they might be ordering from home but picking up near work.
- Shopper profiles should have a default partner store setting.
Login / Shopify Plus
We don't want to pay for Shopify Plus. What limitations do we run into on our current plan? If the only thing we lose is shared login between owtlet.com and owtlet.shop, we'll use guest checkout on owtlet.shop for now.
Missing from your scope (please add)
- Add-to-cart from replays and shoppable video, not just live shows
- Guest checkout with an optional profile (location, saved addresses, default store)
- Store hours and distance shown at checkout
- A link from each store back to Owtlet confirming the order
- Carts saved until 30 minutes after the show ends
- 21+ age gate on the site (we're asking you to build this)
Questions we've already answered
- Pricing: one Owtlet price for show products at every partner store.
- Out of stock: suggest another partner store that has the item.
- Delivery areas: each store sets its delivery ZIP codes and hours. Only stores that deliver to the shopper's address appear.
- Pickup: yes, shoppers choose pickup or delivery.
- ID: the dispensary checks ID during checkout on its own site, then again in person at pickup or delivery. No ID collected or stored on Owtlet.
- Merchant account (accessories/merch): Authorize.net through PaymentCloud, approval expected this week.
- Areas: Manhattan, Queens, Brooklyn, Westchester County and Long Island.
- Order handoff: partners in each area will let us send orders either directly to their POS or through Leafly. We'll send each partner's POS system.
- Terrific: you've had the login since Oct 29. Please check the Terrific questions in 3.1 directly and tell us what it can't do.
Jesce
