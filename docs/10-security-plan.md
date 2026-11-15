# 10 — Security Plan & Hardening

> Owned and maintained by `ultron` and `edith`.

---

## 1. Authentication & Session Security
- **Shoppers**: guest checkout by default (contact info stored on the Order only). **Optional shopper profile** (client Nov 11): passwords hashed with `argon2id` (≥ 10 chars), `owt_shopper` HMAC-signed session cookie (`SHOPPER_SESSION_SECRET`, HTTP-only, Secure, SameSite=Lax, 30 days, rotated on login), login 5/min rate limit, password reset via single-use SHA-256-hashed token (1 h). Never DOB, ID or payment data.
- **21+ age gate**: `middleware.ts` blocks all storefront pages and `/api/*` (except `/api/age-verify`, `/api/webhooks/*` and `/api/health`) until a valid `owt_age` cookie exists. Cookie = HMAC-signed (`AGE_COOKIE_SECRET`) nonce + expiry, HTTP-only, Secure, SameSite=Lax, 30 days. No DOB, no ID, only an attestation audit row (`AgeVerificationSession`, hashed session/IP).
- **Cart session**: `owt_cart` random 256-bit token, HTTP-only, Secure, SameSite=Lax; cart expires 30 minutes after the live show ends (live-show carts) or after 30 minutes of inactivity.
- **Admins**: passwords hashed with `argon2id`; HTTP-only, Secure, SameSite=Strict `owt_admin` session cookie (8h TTL, rotated on login); `/admin` + `/api/admin/*` guarded; login rate-limited.

---

## 2. Cannabis Compliance Controls (New York)
- **No cannabis payment processing**: Owtlet never collects card/bank data for cannabis. Payment and ID checks happen at Leafly or the licensed retailer after handoff. No payment SDKs are loaded on cannabis checkout pages.
- **No government ID / DOB storage**: there are no schema fields for ID images, ID numbers, or DOB. Code review (Architecture Guard) rejects any such field.
- **Licensed fulfillment only**: orders are routed only to active partner dispensaries (license number recorded) inside the coverage area (Manhattan, Queens, Brooklyn, Westchester County, Long Island).
- **Cannabis-only scope**: the platform sells only cannabis via licensed-dispensary handoff; accessories / the `owtlet.shop` Shopify store are a separate project with no integration (no Shopify tokens or payment credentials in Owtlet).
- **Age-appropriate content**: no catalog, prices, or video render before the age gate (server-enforced, not just a client modal).

---

## 3. API & Network Protection
- **Rate Limiting**: Nginx `limit_req` (e.g. 10 r/s burst 20 on `/api/*`, 5 r/min on `/api/admin/login`, `/api/account/login`, `/api/account/password-reset/*` and `/api/age-verify`); optional Redis-based limiter in Route Handlers.
- **CORS Policy**: Same-origin only (`owtlet.com`); no CORS headers except for the store webhook (server-to-server).
- **Input Sanitization**: Every Route Handler / Server Action validates with Zod (`.strict()` — unknown keys rejected); Prisma parameterized queries only.
- **Webhooks**: Store confirmations verified with per-dispensary HMAC-SHA256 over the raw body (constant-time compare), timestamp header with 5-minute replay window, idempotent processing.
- **Third-party scripts**: CSP allows `https://terrific.live` (script/frame/media); everything else self (plus outbound links to Leafly/retailer handoff pages). Terrific hooks only call same-origin `/api`.
- **HTTPS**: Let's Encrypt via Nginx (`owtlet.com`, `www.owtlet.com`, `owtlet.live`, `www.owtlet.live`), HSTS, TLS 1.2+; HTTP → HTTPS redirect; `owtlet.live` → 301 `https://owtlet.com`.

---

## 4. Infrastructure & Secret Hygiene
- Never commit `.env` or secrets to Git (`DATABASE_URL`, `AGE_COOKIE_SECRET`, `ADMIN_SESSION_SECRET`, `SHOPPER_SESSION_SECRET`, `IP_HASH_SALT`, `SMTP_*`, `LEAFLY_*`, dispensary webhook secrets).
- **PII minimisation**: order contact data (name, email, phone, delivery address) is only shown to admins and passed to the fulfilling store via the handoff; no marketing use; admin order list masks phone/email except on the detail page.
- Third-party credentials shared during discovery (e.g. Terrific dashboard login) must be rotated by the client after setup; never stored in the repo.
- Enforce automated vulnerability scans (`pnpm audit`).
- Apply least privilege to database users (app user without superuser; PostgreSQL bound to Docker network only).
- Daily encrypted DB backups (see `12-deployment-plan.md`).
