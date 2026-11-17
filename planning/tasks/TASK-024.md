# TASK-024: Auth Pages & Admin Panel Redesign (match storefront v3)

> **Status**: `DONE`  
> **Assignee**: `jarvis` (UI/UX) + `friday` (Web)  
> **Priority**: `P1`  
> **Complexity Level**: `STANDARD`  
> **Dependencies**: TASK-022 (storefront design v3 tokens and components)

---

## 1. Goal
Restyle the login pages and the admin panel so they match the home page design (TASK-022): Owtlet palette, Dela Gothic One headings, Red Rose body, mono numbers, photo-backed dark bands, pill buttons.

## 2. Scope
- Shopper auth: `/account/login`, `/account/register`, `/account/reset`. They share a new `AuthShell` (dark photo panel on one side, form card on the other).
- Admin: `/admin/login` (uses `AuthShell`), `admin/layout.tsx` (dark ink sidebar, light content area), and all admin pages: dashboard, products, inventory, dispensaries, brands, orders, live shows.
- Replace hardcoded hex and raw Tailwind palette classes (`[#0D221E]`, `gray-*`, `red-*`, `emerald-*` …) with theme tokens (Theme-Ready UI rule).

## 3. Constraints
- Frontend only. No API, data or logic changes; existing handlers stay as they are.
- No dead buttons, keep all 6 UI states, no dummy text.

## 4. Acceptance
- [x] No hex colors or raw palette classes in auth or admin files
- [x] Typecheck, ESLint, unit tests pass
- [x] Visual check at 1440 and 390 wide (auth pages + admin pages)
- [x] `bash scripts/verify-task.sh TASK-024`

## 5. Progress log
- **2026-11-17** — Done.
  - New `components/layout/auth-shell.tsx`: split layout (home-hero photo panel with LIVE eyebrow, Dela headline, mono stats; form card on mist), plus shared field/link/alert styles. `/account/login`, `/account/register`, `/account/reset`, `/admin/login` use it. Reset page: buttons nested in links replaced by buttons that navigate. Admin login labels now point at their inputs (`htmlFor`).
  - `admin/layout.tsx`: dark Ink sidebar (Owtlet logo + mono ADMIN, Mint active pill, `next/link`), light content area; the hardcoded fallback email while loading replaced by a skeleton. Fixed the wrong `import Link from 'next/navigation'`.
  - All admin pages: hex colors and raw palette classes mapped to theme tokens (~600 classes, 0 left). New token `warning-foreground` (readable amber text). Page titles use the section-header scale; card titles in body bold; dashboard metrics in mono; Live Shows: duplicate LIVE badge removed, status badges use the storefront LIVE/REPLAY/UP NEXT colors.
  - Checks: typecheck clean, ESLint 0 errors (3 old hook warnings), 463/463 tests, screenshots of 4 auth + 7 admin pages at 1440 and 390 (no overflow, no page errors), `verify-task.sh TASK-024` passed.
