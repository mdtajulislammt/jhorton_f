# TASK-019: Security Hardening & VPS Deployment (owtlet.com)

> **Status**: `BACKLOG`  
> **Assignee**: `ultron` (DevOps & Cyber Security Specialist)  
> **Priority**: `P0` (Critical)  
> **Complexity Level**: `STANDARD`  
> **Token Budget**: Medium (~2,500 tokens)  
> **Model Advice**: Standard Coding Model (Flash / Sonnet / V3 / 4o)  
> **Dependencies**: `TASK-018`  
> **Roadmap Phase**: Phase 5 ([docs/14-implementation-roadmap.md](../../docs/14-implementation-roadmap.md))  
> **Master Board**: [planning/task.md](../task.md)

---

## 1. Objective & User Story
As DevOps (`ultron`), I want Owtlet deployed over HTTPS on the client VPS with hardened headers and secrets, so that `owtlet.com` goes live by Dec 1, 2026 and `owtlet.live` redirects to it. **Gated by Q-003 (VPS/DNS).**

---

## 2. Inputs & Context Documents
- Deployment: [docs/12-deployment-plan.md](../../docs/12-deployment-plan.md)
- Security: [docs/10-security-plan.md](../../docs/10-security-plan.md)

---

## 3. Step-by-Step Execution Plan
1. CSP (allow terrific.live), HSTS, Nginx rate limits (prepared `infrastructure/nginx/nginx.conf`); Docker image build (Next standalone); Compose `--profile prod` on VPS; Let's Encrypt for owtlet.com, www, owtlet.live, www.owtlet.live; DNS cut-over; owtlet.live 301 (REQ-F-019); SMTP env for password reset (Q-006); daily pg_dump backup.

---

## 4. Expected Outputs
- `infrastructure/nginx/nginx.conf`, `infrastructure/docker/*`, deploy runbook

---

## 5. Acceptance Criteria
- [ ] AC-DEP-01 and AC-RDR-01 pass; secrets only in server `.env`; human approval before production go-live.

---

## 6. Verification Evidence (Thanos)
- **Command**: `curl -sI https://owtlet.com && curl -s https://owtlet.com/api/health`
- **Status**: `Pending Verification`
- **Output Log**: Awaiting execution.

---

## 7. Fresh Session Handoff
```markdown
All MVP tasks complete. Handover to client and monitor production at https://owtlet.com.
```
