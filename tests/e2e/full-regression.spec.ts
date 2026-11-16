/**
 * Avengers Protocol E2E Regression Harness (TASK-018)
 * Mirrors: development/frontend/e2e/regression.spec.ts
 */
export const regressionJourneys = [
  { id: 'J-01', name: 'Homepage & Terrific Embed', target: '/', ac: 'AC-LIVE-01' },
  { id: 'J-02', name: 'Cannabis Catalog & Filter Bar', target: '/shop', ac: 'AC-CAT-01, AC-PRC-01' },
  { id: 'J-03', name: 'Brand Channels & Dispensaries', target: '/brands', ac: 'AC-BRD-01, AC-BRD-02' },
  { id: 'J-04', name: 'Shoppable Video Vault', target: '/videos', ac: 'AC-LIVE-04' },
  { id: 'J-05', name: 'Compliant Checkout & Zero ID', target: '/checkout', ac: 'AC-SEC-01, AC-PRF-01' },
  { id: 'J-06', name: 'Shopper Profile & Addresses', target: '/account', ac: 'AC-PRF-02, AC-SEL-02' },
  { id: 'J-07', name: 'Admin Operations Portal', target: '/admin', ac: 'AC-ADM-01' },
];

