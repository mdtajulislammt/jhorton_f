/**
 * Avengers Protocol Chaos Engineering Harness (TASK-018)
 * Mirrors: development/frontend/src/__tests__/chaos-engineering.test.ts
 */
export const chaosScenarios = [
  { id: 'C-01', name: 'Expired Cart Mid-Checkout', code: 'CART_EXPIRED', status: 410 },
  { id: 'C-02', name: 'Live Show Ended Mid-Checkout', code: 'SHOW_ENDED_HOLD', status: 200 },
  { id: 'C-03', name: 'Terrific Product ID Fuzzing & SQLi', code: 'UNMAPPED_PRODUCT', status: 404 },
  { id: 'C-04', name: 'Out-of-Coverage NY Geo Fuzzing', code: 'NO_COVERAGE', status: 422 },
  { id: 'C-05', name: 'Store Change to Ineligible Store', code: 'STORE_NOT_ELIGIBLE', status: 422 },
  { id: 'C-06', name: 'Brand Channel Isolation & Zero Stock', code: 'UNFULFILLABLE_ITEMS', status: 422 },
  { id: 'C-07', name: 'Zero ID & Zero Payment Penetration', code: 'INVALID_PAYLOAD', status: 400 },
  { id: 'C-08', name: 'HMAC Tampering & Webhook Replay', code: 'INVALID_SIGNATURE', status: 401 },
  { id: 'C-09', name: 'Double Submission Idempotency', code: 'IDEMPOTENT_OK', status: 200 },
  { id: 'C-10', name: 'Shopper Auth Fuzzing & Token Tampering', code: 'UNAUTHORIZED', status: 401 },
];

