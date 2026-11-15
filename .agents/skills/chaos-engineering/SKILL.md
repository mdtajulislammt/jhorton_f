---
name: chaos-engineering
description: Workflow for adversarial edge-case testing, invalid payload fuzzing, crash resilience, and anti-fragility auditing with Loki.
---

# Chaos Engineering & Adversarial Testing Workflow (Loki)

## Purpose
Guide the Chaos and Edge-Case Specialist (`loki`) to execute adversarial testing, inject malicious and corrupted payloads, and verify that the application gracefully handles unexpected conditions without crashing.

## Key Focus Areas
- **Payload Fuzzing**: Malformed JSON, oversized payloads, unicode fuzzing, null injections.
- **Security Boundaries**: SQL injection, XSS vectors, broken object level authorization (BOLA).
- **Network & State Stress**: Simulated offline mode, slow network responses, double submissions.
- **Race Condition Auditing**: Simultaneous concurrent requests on transactional tables.

## Step-by-Step Procedure
1. Identify all public and protected endpoints from `docs/08-api-contract.md`.
2. Execute fuzzing tests:
   - Missing required body properties.
   - Negative numbers for quantity, price, or ID fields.
   - String inputs into numeric fields.
   - SQLi patterns (`' OR '1'='1`) in search and filter parameters.
3. Validate response semantics:
   - Must return 4xx (400 Bad Request, 422 Unprocessable Entity, 401 Unauthorized).
   - Must NEVER return raw 500 stack traces or crash the process.
4. Test frontend forms with extreme inputs:
   - 5,000 character strings in standard inputs.
   - Rapid multi-clicking on submit buttons (verify debounce).
5. File bug reports for `edith` and `friday` with exact reproduction steps before `thanos` marks tasks as `DONE`.

