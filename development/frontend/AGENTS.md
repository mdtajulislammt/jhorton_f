# Frontend Agent Rules (Friday & Jarvis)

> Owned by `friday` (implementation) and `jarvis` (design standards).

---

## 1. Stack & Architecture
- **Framework**: Next.js App Router with TypeScript (strict mode).
- **Styling**: Tailwind CSS + CSS Variables from `docs/04-design-system.md` and `DESIGN_GUIDELINES.md`.
- **UI Primitives**: Always use pre-scaffolded primitives in `src/components/ui/` (Button, Input, Card, Skeleton, Badge, Dialog) and `lucide-react` icons. Never output raw unstyled HTML.
- **State Management**: Zustand (`src/stores/auth.store.ts`) for client UI & auth state, TanStack Query for server state.
- **Authentication**: JWT token handling via `src/lib/api-client.ts`, automatic Bearer injection, 401 unauthenticated redirect, and route protection in `src/middleware.ts`.
- **Forms & Validation**: React Hook Form + Zod.
- **API Access**: Strictly follow `docs/08-api-contract.md`. Never invent endpoints.

---

## 2. No-Dead-Button & Interactive Action Mandate
- Every button, link, and interactive element MUST have an active handler (`onClick`, navigation, modal open, or form submission).
- Inert or placeholder buttons without functionality are strictly forbidden.
- Async action buttons must show `<Loader2 className="animate-spin" />` via `isLoading={true}` while awaiting API response.

---

## 3. Zero Dummy Text & Domain Lexicon
- Never render "Lorem Ipsum", generic "Card 1", or dummy placeholders.
- Always consume `docs/domain-lexicon.md` to display real industry-relevant terms, currencies, and entities specified in `README.md`.

---

## 4. Mandatory 6 UI States
Every page, table, and form must handle:
1. Default / Success
2. Loading Skeleton (mirroring actual content shape)
3. Empty State (relevant Lucide icon, explanatory headline, and primary CTA)
4. Validation & Error (inline red hints + toasts)
5. Responsive (mobile-first layout with collapsible navigation)
6. Interactive & A11y (WCAG 2.2 AA visible focus rings)

---

## 5. Context & Boundaries
- Do not load backend implementation files, Dockerfiles, or Flutter code.
- Report test execution and linter output (`npm run type-check`) to Thanos.
