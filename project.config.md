# ⚙️ Project Configuration: Owtlet (Avengerse)

> **Version**: 1.0  
> **Codename**: Avengers Protocol  
> **Primary AI Environment**: OpenAI Codex & Compatible Multi-Agent Assistants  
> **Architecture**: Hierarchical Multi-Agent Full-Stack System  
> **Chief Orchestrator**: `iron_man`  

---

> [!NOTE]
> **Developer Directive**:  
> This file is the **Single Source of Truth** for technical stack configuration.  
> `iron_man`, `jarvis`, `friday`, `edith`, `thor`, `thanos`, and `ultron` strictly read this file to determine what libraries, frameworks, databases, and architectural patterns to implement. You can use the default stack below or customize it before running the discovery phase.

---

## 1. Project Information & Metadata

- **Project Name**: Owtlet™ — Live Shopping for Cannabis (`owtlet.com`)
- **Project Type**: Decoupled Full-Stack Web (Frontend: Next.js 14+, Backend: NestJS 10+ REST API). Mobile: N/A
- **Project Status**: `new` <!-- Options: new / existing / migration -->
- **Client Requirements Source**: [README.md](README.md)
- **Problem & Product Summary**: Custom 21+ cannabis marketplace with Terrific-powered live shopping & shoppable replays; cannabis items go to Owtlet's own cart and are handed off to Leafly/retailer checkout (no cannabis payment or ID stored), split across partner dispensaries by stock, pickup/delivery eligibility and the shopper's store choice; brand storefronts (channels), one Owtlet price for show products, guest checkout + optional profile, carts held until 30 min after the show ends (client answers in `input/client-docs/`). **Cannabis-only** — accessories are out of scope (separate `owtlet.shop` Shopify project).
- **Target Audience / End Users**: Adult (21+) cannabis consumers in Manhattan, Queens, Brooklyn, Westchester County and Long Island (NY); partner dispensaries/retailers; Owtlet admins.
- **Target Delivery / Milestones**: MVP live on client VPS by **Dec 1, 2026** (Fiverr milestone Nov 28, 2026). Client: Jesce Horton (Grand National Agency). Budget $3,000.

---

## 1.1 AI Engine & Universal Model Profile (Model-Agnostic)

> [!TIP]
> **Universal Compatibility**: This template works across **any AI assistant, editor, or model** (Cursor, Claude, Gemini, DeepSeek, OpenAI, Ollama/Llama, VS Code).
> Developers do NOT need specific models to use this template.

- **Workflow Mode**: `flexible` <!-- Options: flexible (auto-adapts) | multi-model (model switching) | single-model (context choking) -->
- **Developer AI Environment**: [e.g., Cursor with Claude / Antigravity with Gemini / VS Code with DeepSeek / OpenAI ChatGPT]
- **Active Model Setup Note**: [Optional developer note, e.g. "Using Claude Sonnet for all tasks" or "Using DeepSeek R1 for heavy + V3 for light"]
- **Capability Tier Reference**:
  - `LEVEL: HEAVY` (Deep Reasoning): System architecture (`docs/`), relational DB schema, JWT/auth security, complex debugging.
  - `LEVEL: STANDARD` (General Coding): UI components, Next.js pages, standard CRUD APIs, DTOs, Docker config.
  - `LEVEL: LIGHT` (Fast Execution / Token-Saver): Verification scripts, status updates (`planning/`), minor typo/CSS fixes.

---

## 2. Avengers Multi-Agent Roster & System Mapping

| Agent Name | Hero Identity | Primary Domain | Configuration File | Target Directory |
|---|---|---|---|---|
| **`nick_fury`** | **Client Advocate & PM** | Requirement Discovery, Client Interview, Scope Boundary | `.codex/agents/nick_fury.toml` | Root, `input/`, `planning/open-questions.md` |
| **`iron_man`** | **Chief Orchestrator** | Planning, Delegation, Work Breakdown & Verification | `.codex/agents/iron_man.toml` | Root, `planning/`, `docs/` |
| **`jarvis`** | **UI/UX & Design** | Design Tokens, Typography, Figma Parsing, 6 UI States | `.codex/agents/jarvis.toml` | `development/frontend/src/styles/`, UI Primitives |
| **`friday`** | **Frontend Web** | Next.js, React, TypeScript, Forms, Client State | `.codex/agents/friday.toml` | `development/frontend/` |
| **`edith`** | **Backend & Data** | NestJS REST API, Prisma ORM, PostgreSQL, Redis (optional), API Contracts & Domain Services | `.codex/agents/edith.toml` | `development/backend/src/`, `development/backend/prisma/` |
| **`thor`** | **Mobile (Optional)** | **Disabled for Owtlet** (mobile = false) | `.codex/agents/thor.toml` | — (no `development/mobile/`; removed, ADR-015) |
| **`thanos`** | **QA & Verification** | Unit, Integration, E2E, Acceptance, Bug Snapping | `.codex/agents/thanos.toml` | Test suites across repository |
| **`loki`** | **Chaos & Security Tester** | Edge-Case Fuzzing, Adversarial Attacks, Crash Resilience | `.codex/agents/loki.toml` | Test suites, API security |
| **`ultron`** | **DevOps & Security** | Docker, Nginx, CI/CD, Cyber Security Hardening | `.codex/agents/ultron.toml` | `infrastructure/`, `.github/` |

---

## 3. Technology Stack Specification (Stack-Agnostic with Production Defaults)

> [!IMPORTANT]
> **Decoupled Architecture Directive (ADR-016)**:  
> Per explicit human instruction, Owtlet is structured into two dedicated development directories:  
> - **Frontend Web**: `development/frontend/` (Next.js 14+ App Router, TypeScript, Tailwind CSS, Zustand, TanStack Query)  
> - **Backend API**: `development/backend/` (NestJS 10+, TypeScript, Prisma ORM, PostgreSQL, Swagger docs at `http://localhost:4000/api/docs`)  
> Next.js proxies `/api/*` to the NestJS backend via `rewrites()` in `next.config.mjs`.

### 3.1 Frontend Configuration (`development/frontend/`)
> *Friday and Jarvis strictly adhere to these frontend choices.*
- **Directory**: `development/frontend/` (Next.js 14+ Storefront Web application)
- **Framework**: `Next.js 14+ (App Router, React Server Components)` <!-- Supported: Next.js (App Router) / React (Vite) / Vue / Nuxt / SvelteKit / Angular / Remix / Astro -->
- **Language**: `TypeScript` (Strict Mode) <!-- Options: TypeScript / JavaScript -->
- **Styling**: `Tailwind CSS` + Semantic CSS Variables (`globals.css`, Owtlet brand tokens from `docs/04-design-system.md`) <!-- Options: Tailwind CSS / CSS Modules / Emotion / Styled Components / Sass -->
- **UI Primitives**: `Radix UI` / `Shadcn UI primitives` <!-- Options: Shadcn UI / MUI / Mantine / Ant Design / Native -->
- **Client UI State**: `Zustand` <!-- Options: Zustand / Redux Toolkit / Jotai / Pinia / Signals / Context API -->
- **Server State / Data Fetching**: `TanStack Query (React Query)` <!-- Options: React Query / SWR / Apollo GraphQL / RTK Query / Axios -->
- **Form & Validation**: `React Hook Form` + `Zod` <!-- Options: Zod / Yup / Valibot / Superforms -->
- **Testing**: `Vitest` + `React Testing Library` + `Playwright` (E2E) <!-- Options: Jest / Vitest / Cypress / Playwright -->
- **Third-party client SDKs**: Terrific live-shopping SDK v2 (`https://terrific.live/terrific-sdk.js`). No Shopify integration (accessories out of scope)

### 3.2 Backend Configuration (`development/backend/`)
> *Edith strictly adheres to these backend choices.*
- **Directory**: `development/backend/` (NestJS 10+ REST API Service)
- **Framework**: `NestJS (TypeScript modular architecture)` <!-- Supported: NestJS / Express / Fastify / Django / FastAPI / Go (Gin/Fiber) / Laravel / Spring Boot / ASP.NET Core -->
- **Language**: `TypeScript` (Strict Mode) <!-- Options: TypeScript / Python / Go / PHP / Java / C# -->
- **ORM / Database Client**: `Prisma ORM` <!-- Supported: Prisma / Drizzle / TypeORM / SQLAlchemy / Tortoise / GORM / Eloquent / Hibernate / EF Core -->
- **Primary Database**: `PostgreSQL (v15+)` <!-- Supported: PostgreSQL / MySQL / MongoDB / SQLite / CockroachDB / DynamoDB -->
- **Cache & Queue**: `Redis` (**optional** — 30-min cart TTL & session cache; falls back to PostgreSQL `expiresAt`) <!-- Supported: Redis / Memcached / RabbitMQ / BullMQ / Kafka / Celery -->
- **Object Storage**: `Local Storage` / `Cloudflare R2` / `AWS S3 compatible`
- **API Documentation**: `REST under /api` with Swagger OpenAPI at `http://localhost:4000/api/docs` — contract in `docs/08-api-contract.md` (Zod & class-validator schemas) <!-- Options: REST (OpenAPI/Swagger) / GraphQL / gRPC / tRPC -->
- **Validation**: `Zod` & `class-validator` <!-- Options: class-validator / Pydantic (Python) / Zod / Joi -->
- **Testing**: `Vitest` (services + controller integration against PostgreSQL) <!-- Options: Jest / Pytest / Go Test / PHPUnit -->

### 3.3 Mobile Configuration (`development/mobile/` — Optional)
> *Thor is activated only when mobile is set to true.*
- **Enabled**: `false` <!-- Set to true if client README.md requires mobile application -->
- **Directory**: `development/mobile/` — **removed for Owtlet** (recreate only if mobile is ever enabled)
- **Framework**: `Flutter (Dart >= 3.0)` <!-- Supported: Flutter / React Native (Expo) / Swift (iOS native) / Kotlin (Android native) -->
- **State Management**: `Flutter Riverpod` / `BLoC` <!-- Options: Riverpod / Bloc / MobX / Redux -->
- **API Client**: `Dio` (Connected to `docs/08-api-contract.md`)
- **Secure Storage**: `flutter_secure_storage`
- **Testing**: `Flutter Test (Widget & Unit)`

### 3.4 Infrastructure & DevOps (`infrastructure/`)
> *Ultron strictly adheres to these infrastructure choices.*
- **Docker**: `infrastructure/docker/` (Multi-stage Dockerfiles for minimal production images)
- **Reverse Proxy**: `infrastructure/nginx/` (Nginx reverse proxy, SSL termination, gzip)
- **CI/CD Pipeline**: `.github/workflows/ci.yml` (Automated validation, lint, test, build)
- **Package Manager**: `pnpm` (default) or `npm`
- **Runtime Environment**: `Node.js >= 20.x LTS`
- **Production Hosting Target**: Client-provided Linux VPS with Docker Compose (Next.js app + PostgreSQL + optional Redis) behind Nginx + Let's Encrypt SSL; DNS for `owtlet.com` pending (see `planning/open-questions.md` Q-003)

---

## 4. Shared Project Contracts & Directory Mapping

| Artifact Type | File / Path | Primary Agent Responsibility |
|---|---|---|
| **Client Intent / Brief** | [README.md](README.md) | Single Source of Truth filled by Developer/Client |
| **System Blueprints** | [docs/](docs/) (`01` to `14`) | Maintained by `iron_man`, `edith`, `jarvis`, `ultron` |
| **API Contract** | [docs/08-api-contract.md](docs/08-api-contract.md) | Shared bridge between `edith`, `friday`, and `thor` |
| **Task Management** | [planning/task.md](planning/task.md) | Work breakdown with `Assignee` tags |
| **Session Continuity** | [planning/updateplanning.md](planning/updateplanning.md) | Checkpoints, test evidence, and active task state |
| **Architecture Decisions** | [planning/decisions.md](planning/decisions.md) | Approved ADRs and design decisions |
| **Open Questions** | [planning/open-questions.md](planning/open-questions.md) | Unresolved client queries (Zero-Assumption Policy) |
| **Application Code** | [development/frontend/](development/frontend/) | Single Next.js app (UI + `app/api` backend + Prisma). No `backend/` or `mobile/` folders (removed, ADR-015) |

---

## 5. Working Agreements & Human Approval Gates

1. **Human Approval Gates (Strict Authorization Required)**:
   - ⚠️ Destructive database migrations (dropping tables, altering production data).
   - ⚠️ Live production deployments or publishing releases.
   - ⚠️ Altering production secrets, API keys, or environment files (`.env`).
   - ⚠️ Major architectural deviations from `docs/` or `project.config.md`.
2. **Zero-Assumption Policy**: Unconfirmed requirements must be recorded in `planning/open-questions.md` rather than guessed by agents.
3. **Context Isolation**: Every agent loads only the specific files required for its current task to ensure **minimum token usage and maximum output quality**.
4. **Evidence-Based Verification**: No task is marked `DONE` without verification by `thanos` with actual test execution evidence.
