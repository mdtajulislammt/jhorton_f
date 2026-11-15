# Technical Documentation (`docs/`)

> Maintained by the **Avengers Multi-Agent System** under the leadership of `iron_man`.

---

## Documentation Index & Agent Ownership

| # | Document | Primary Owner | Description & Scope |
|---|---|---|---|
| **01** | [01-requirements-analysis.md](01-requirements-analysis.md) | `iron_man` | Functional and non-functional requirements breakdown |
| **02** | [02-system-architecture.md](02-system-architecture.md) | `iron_man` / `edith` | System architecture, component flow, and infrastructure topology |
| **03** | [03-figma-analysis.md](03-figma-analysis.md) | `jarvis` | Screen inventory, layouts, breakpoints, and design references |
| **04** | [04-design-system.md](04-design-system.md) | `jarvis` | Semantic color tokens, typography scale, and 6 UI states |
| **05** | [05-frontend-architecture.md](05-frontend-architecture.md) | `friday` | Next.js App Router tree, components, state, and form strategy |
| **06** | [06-backend-architecture.md](06-backend-architecture.md) | `edith` | Next.js Route Handlers + Server Actions, domain services (Owtlet: no NestJS) |
| **07** | [07-database-design.md](07-database-design.md) | `edith` | PostgreSQL schema, Prisma models, relations, and indexes |
| **08** | [08-api-contract.md](08-api-contract.md) | `edith` | REST endpoints, DTO schemas, status codes, and error formats |
| **09** | [09-mobile-architecture.md](09-mobile-architecture.md) | `thor` | N/A for Owtlet (mobile disabled) |
| **10** | [10-security-plan.md](10-security-plan.md) | `ultron` / `edith` | Authentication, authorization, rate limiting, and data protection |
| **11** | [11-testing-strategy.md](11-testing-strategy.md) | `thanos` | Unit, integration, E2E testing matrix and verification gates |
| **12** | [12-deployment-plan.md](12-deployment-plan.md) | `ultron` | Docker multi-stage builds, Nginx reverse proxy, CI/CD pipelines |
| **13** | [13-acceptance-criteria.md](13-acceptance-criteria.md) | `thanos` | Feature-by-feature acceptance criteria, multi-perspective review gate, and definition of done |
| **14** | [14-implementation-roadmap.md](14-implementation-roadmap.md) | `iron_man` | Phased implementation milestones and dependency gates |

---

## Process & Quality Protocols (BMad/SDD Alignment)
- [Architecture Spine](architecture-spine.md): High-density invariant contract for token-saving execution.
- [Context Map](context-map.md): Routing guide for picking minimal relevant context per task.
- [AI Context Policy](ai-context-policy.md): Rules for keeping token consumption minimal and preventing context rot.
- [Requirement Brainstorming](../.agents/skills/requirement-brainstorming/SKILL.md): SCAMPER, reverse brainstorming, and anti-bias validation.
- [Multi-Perspective Code Review](../.agents/skills/multi-perspective-code-review/SKILL.md): Blind Hunter, Contract Auditor, Architecture Guard, and UX verification.
- [Agile Retrospective](../.agents/skills/agile-retrospective/SKILL.md): Post-milestone Git audit and self-learning feedback loop.
