---
name: agile-retrospective
description: Post-milestone and post-task retrospective analysis evaluating Git history, model mistakes, token burn, and self-learning adjustments for continuous workflow improvement.
---

# 🔄 Agile Retrospective & Self-Learning Protocol (`agile-retrospective`)

> **Primary Orchestrator**: `iron_man` (with all active specialists)  
> **Trigger**: End of an Epic / Milestone, after significant test failures, or every 5 completed tasks.

---

## 1. Purpose & Continuous Improvement Philosophy

In AI-driven software development, mistakes compound if the agent repeats the same misconceptions. The **Agile Retrospective Protocol** analyzes Git commit logs, task verification histories, and developer corrections to record actionable lessons learned, updating project instructions and rules dynamically.

---

## 2. Retrospective Workflow & Analysis Steps

### Step 1: Git & Execution Audit
Run an automated audit across recent commits and task execution logs:
- How many iterations or test retries were required per task?
- Did any task fail verification twice (triggering `Self-Healing Escalation`)?
- Were there any unwanted file modifications or scope boundary breaches?

### Step 2: The 4 Retrospective Quadrants
The team answers four objective questions:
1. **What Went Smoothly?**: Modules that passed in one shot with minimal token spend.
2. **Where Did Friction Occur?**: Unclear specifications in `docs/`, missing DTO fields, or unexpected library deprecations.
3. **Model Misconceptions & Blind Spots**: Patterns where the AI assumed wrong behaviors (e.g., outdated syntax, hallucinations, missing imports).
4. **Actionable Rule Changes**: What concrete rule should be updated in `AGENTS.md` or `project.config.md` to prevent this exact mistake forever?

---

## 3. Retrospective Output Artifact

Save each retrospective session to `planning/retrospectives/RETRO-[MILESTONE/DATE].md`:

```markdown
# 🔄 Retrospective Report: [Milestone Name or Sprint Date]
- **Date**: YYYY-MM-DD
- **Tasks Audited**: [TASK-001 through TASK-005]
- **Facilitator**: `iron_man`

## 1. Velocity & Token Efficiency Metrics
- **Total Tasks Completed**: [X]
- **First-Pass Verification Rate**: [X%]
- **Average Token Budget Adherence**: ON_BUDGET / OVER_BUDGET

## 2. Friction Points & Root Causes
- **Incident 1**: [Description e.g. "Prisma migration clashed with existing PostgreSQL schema"]
  - *Root Cause*: [e.g. Migration ran without checking readiness script]
  - *Remediation*: [e.g. Added check to check-readiness.sh]

## 3. Self-Learning Rules Added to Customizations
- [ ] Rule updated in `.agents/rules/` or `AGENTS.md`: *"[Exact rule text added to system]"*

## 4. Next Milestone Focus
- Top priorities for upcoming tasks.
```

