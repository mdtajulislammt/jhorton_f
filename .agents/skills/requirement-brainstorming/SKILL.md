---
name: requirement-brainstorming
description: Systematic product idea validation, feature ideation, and anti-bias brainstorming using SCAMPER, Reverse Brainstorming, and User Journey mapping before technical architecture.
---

# 💡 Requirement Brainstorming Protocol (`requirement-brainstorming`)

> **Primary Agent**: `nick_fury` (Client Advocate & PM) with `iron_man` (Chief Orchestrator)  
> **Applicable Phase**: Pre-Architecture / Discovery / Scope Expansion  
> **Trigger**: When starting a new product, adding a major feature module, or when client requirements are vague/abstract.

---

## 1. Purpose & Methodological Foundation

AI-assisted development often fails because developers build the wrong thing with great precision. The **Requirement Brainstorming Protocol** introduces algorithmic creative and validation techniques to explore problem spaces, challenge assumptions, and uncover hidden edge-cases *before* technical specification in `docs/` begins.

It utilizes 4 core brainstorming modules:
1. **SCAMPER Framework**: Systematic feature expansion and differentiation.
2. **Reverse Brainstorming**: Identifying ways to fail the user, then creating preventative barriers.
3. **Anti-Bias & Assumption Auditing**: Unmasking developer/AI biases before writing code.
4. **Value-vs-Complexity Prioritization**: Filtering brainstormed ideas into MVP, Post-MVP, and Scrapped.

---

## 2. The 4-Step Brainstorming Workflow

### Step 1: SCAMPER Exploration (Feature Ideation)
For any feature idea or vague requirement, `nick_fury` systematically answers:
- **S (Substitute)**: Can we substitute a manual step with an automated trigger or AI action?
- **C (Combine)**: Can we combine two workflows or endpoints into a single friction-free action?
- **A (Adapt)**: What external industry pattern (e.g. Uber live tracking, Stripe instant feedback) can we adapt?
- **M (Modify / Magnify / Minify)**: What happens if volume scales 100x? What is the absolute bare minimum version?
- **P (Put to another use)**: Can this collected data or audit log provide business analytics or alert insights?
- **E (Eliminate)**: What redundant form fields, confirmation dialogs, or database joins can be eliminated?
- **R (Reverse / Rearrange)**: What if the user takes the last step first (e.g., test-drive before registration)?

### Step 2: Reverse Brainstorming (Failure Inversion)
Instead of asking *"How do we make this feature work?"*, `nick_fury` asks:
> *"How could a user or system completely break or abandon this workflow?"*
1. **Frustration Points**: Slow API response, opaque loading spinner, lost form data on tab switch.
2. **Data Vulnerabilities**: User enters garbage input, duplicate clicks submit button twice, network drops mid-transaction.
3. **Business Failures**: User does not understand the value proposition, high churn at onboarding.
*Countermeasures* are immediately derived from each failure mode and turned into mandatory NFRs.

### Step 3: Anti-Bias & Assumption Audit
Identify and eliminate the 3 most common AI development biases:
1. **The Happy Path Bias**: Assuming high-speed Wi-Fi, perfect payload data, and desktop screen sizes.
2. **The Tech-First Bias**: Recommending microservices, complex state managers, or WebSockets where a simple REST query or server component suffices.
3. **The Silent Feature Creep**: Adding unrequested abstractions (e.g., full multi-tenant RBAC when the client asked for a 2-user demo).

### Step 4: Output Synthesis & Artifact Generation
Save the synthesized findings into `planning/brainstorming/[FEATURE-NAME].md` with the following structure:

```markdown
# 💡 Brainstorming & Ideation: [Feature/Product Name]
- **Date**: YYYY-MM-DD
- **Owner**: `nick_fury`
- **Status**: APPROVED / IN_REVIEW

## 1. Problem Statement & Core Value
[Clear 2-sentence description of user problem and core value]

## 2. SCAMPER Insights
- **Key Adaptations**: [List innovations]
- **Eliminations**: [What unnecessary complexity was removed]

## 3. Reverse Brainstorming (Preventative NFRs)
| Potential Failure Mode | Root Cause | Preventative Requirement |
|---|---|---|
| User double-clicks checkout | Duplicate charge | Idempotency Key + Client-side disabled button |

## 4. Prioritization Matrix
- **Must-Have (MVP)**: [Directly feeds into docs/01-requirements-analysis.md]
- **Nice-to-Have (Post-MVP)**: [Documented in planning/roadmap.md]
- **Rejected / Out of Scope**: [Recorded in planning/decisions.md]
```

