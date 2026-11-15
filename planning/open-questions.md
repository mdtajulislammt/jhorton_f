# Open Questions & Client Clarifications

> **Rule**: When requirements, business logic, permissions, edge cases, or UX flows are ambiguous, Iron Man and all agents must log them here rather than inventing assumptions.

---

## Active Questions

| Question ID | Date Logged | Domain | Question Description | Impacted Agent | Status | Resolution |
|---|---|---|---|---|---|---|
| `Q-001` | 2026-11-15 | Checkout Handoff | Leafly: is the Leafly partnership/account finalized and can we get API access (or a documented deep-link/order URL format)? If not, confirm we hand off via each retailer's own order page for MVP. | `edith`, `friday` | `OPEN` | Clarification requested from client (Nov 14–15); awaiting reply. Gates TASK-013. Built behind `HandoffProvider`; `RetailerPageProvider` is the default until answered. |
| `Q-002` | 2026-11-15 | Dispensaries / POS | Which partner dispensaries are live at launch (name, address, license #, pickup and/or delivery, delivery ZIPs, store hours, delivery hours)? What POS/ordering system does each use, what order-page URL should Owtlet send shoppers to, and can they POST a confirmation (webhook) or only open a signed confirmation link? | `edith`, `iron_man` | `OPEN` | Clarification requested (Nov 14–15); awaiting reply. Gates TASK-013/014 and production dispensary seed; Phase 2 uses demo dispensaries. |
| `Q-003` | 2026-11-15 | Deployment | VPS + DNS readiness: provider, OS, specs, SSH access for deployment, and who manages `owtlet.com` DNS (currently a Webflow launch page)? `owtlet.live` DNS is needed too (301 redirect to owtlet.com, client-confirmed). | `ultron` | `OPEN` | Clarification requested (Nov 14–15); awaiting reply. Gates TASK-019 (deploy). |
| `Q-004` | 2026-11-15 | Catalog Data | Final cannabis product dataset: names, brand, categories, strain type, THC/CBD %, weights, images, Owtlet price for show products (per-store price for others) and stock per store, plus brand storefront assets (logo, banner, assigned stores) — in what format (CSV/Sheet/POS export) and when? (Current ~22 Shopify cannabis products are test data only.) | `edith` | `OPEN` | Clarification requested (Nov 14–15); awaiting reply. Gates TASK-017; Phase 1 uses migrated Shopify test data. |
| `Q-006` | 2026-11-15 | Email | Which sender/SMTP should Owtlet use for transactional email (password reset for optional shopper profiles)? E.g. a `no-reply@owtlet.com` mailbox or a provider account (Postmark / SendGrid / Amazon SES). | `edith`, `ultron` | `OPEN` | Internal/team first (may not need the client if the agency provides SMTP). Dev logs reset links to the console; gates only the production password-reset email (TASK-021, TASK-019). |

---

> Not open questions (already answered in writing by Jesce, Nov 9/11 — recorded as ADR-009…014): brand storefronts, pickup vs delivery, delivery hours, store change + default store, guest checkout + optional profile, one price for show products, cart hold until 30 min after the show ends, out-of-stock suggestions, shoppable video, owtlet.live redirect. Accessories in live shows = Shopify team (ADR-008).

## Resolved Questions Log
*(Move resolved items here with date and confirmed decision)*

| Question ID | Date Resolved | Domain | Question | Decision |
|---|---|---|---|---|
| `Q-T01` | 2026-11-15 | Auth | Authentication strategy? (template default question) | Guest checkout + optional shopper profile (`owt_shopper`, argon2id) per client Nov 11 (ADR-013); 21+ attestation cookie + cart cookie; admins use HTTP-only session cookie with argon2id. See `docs/10-security-plan.md`. |
| `Q-T02` | 2026-11-15 | Mobile | Is a mobile app required? (template default question) | No — responsive web only; `thor` idle. |
| `Q-005` | 2026-11-15 | Accessories Payments | Accessory payments on `owtlet.shop` (Authorize.net/PaymentCloud, Apple/Google Pay) and a Storefront API token for an accessory bridge? | **Out of scope: accessories handled by separate Shopify project (decided 2026-11-15).** Custom platform is cannabis-only; no Storefront token needed (ADR-008). |
| `Q-T03` | 2026-11-15 | Deployment | Hosting target? (template default question) | Client-provided Linux VPS with Docker + Nginx (readiness still open as Q-003). |
