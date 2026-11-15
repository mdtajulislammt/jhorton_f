---
name: requirement-discovery
description: Workflow for conducting discovery interviews, resolving scope ambiguities, and extracting client requirements with Nick Fury.
---

# Requirement Discovery Workflow (Nick Fury)

## Purpose
Guide the Client Advocate and Product Manager (`nick_fury`) to conduct interactive discovery interviews, extract technical details, and eliminate ambiguity before Iron Man decomposes the architecture.

## Key Focus Areas
- **Discovery Interview**: Ask 3-7 sharp, focused questions on unclear client requirements.
- **Ambiguity Resolution**: Document options and trade-offs in `planning/open-questions.md`.
- **Domain Lexicon Extraction**: Identify industry terms, entities, and currencies for `docs/domain-lexicon.md`.
- **Scope Guarding**: Define MVP boundary vs future backlog.

## Step-by-Step Procedure
1. Read raw client briefs in `README.md` and `input/client-docs/`.
2. Analyze gaps in:
   - Authentication (Email/Password, Social OAuth, OTP, 2FA)
   - Authorization & Roles (RBAC: Admin, Manager, Member, Guest)
   - Business Logic & Calculations (Tax, Discounts, Commissions, Currency)
   - External Integrations (Payment Gateways, SMS, Email, S3 storage)
3. Populate unresolved questions in `planning/open-questions.md`.
4. Prompt the developer/client with interactive multiple-choice questions.
5. Record answers in `planning/decisions.md` and hand off refined specs to `iron_man`.

