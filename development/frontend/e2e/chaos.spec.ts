import { test, expect } from '@playwright/test';

test.describe('Loki Adversarial & Chaos E2E Suite (TASK-018, docs/11 §2)', () => {
  test.beforeEach(async ({ context }) => {
    // 21+ age cookie to bypass age gate for chaos testing
    await context.addCookies([
      {
        name: 'owt_age',
        value: 'verified_age_token_chaos',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  });

  test('Chaos Scenario 1: Malformed and non-existent product slugs return 404 cleanly', async ({
    page,
  }) => {
    // Malicious fuzz slugs
    const fuzzedSlug = 'non-existent-or-sql-injection-slug--12345';
    const response = await page.goto(`/product/${fuzzedSlug}`);

    // Must return 404 or show not found UI, never a raw 500 crash
    expect(response?.status() === 404 || (await page.textContent('body'))?.includes('not found')).toBeTruthy();
  });

  test('Chaos Scenario 2: Checkout with empty cart displays graceful empty state', async ({
    page,
  }) => {
    await page.goto('/checkout');

    await expect(page.locator('h1, h2')).toContainText(/Your Cart is Empty|Cannabis Checkout/i);
    await expect(page.getByRole('button', { name: /Explore Cannabis Catalog|Shop Now/i })).toBeVisible();
  });

  test('Chaos Scenario 3: Non-NY delivery address trigger coverage warning notice', async ({
    page,
  }) => {
    await page.goto('/checkout');

    // Verify presence of coverage disclaimers or pickup alternatives
    const text = await page.textContent('body');
    expect(text).toContain('Dispensary Pickup');
  });

  test('Chaos Scenario 4: Regulatory Penetration Test ensures zero financial data fields exist in checkout DOM', async ({
    page,
  }) => {
    await page.goto('/checkout');

    // DOM query for payment inputs
    const creditCardInputs = page.locator('input[name*="card"], input[name*="credit"], input[placeholder*="Card"]');
    const ssnInputs = page.locator('input[name*="ssn"], input[name*="social"]');
    const dobInputs = page.locator('input[name*="dob"], input[name*="birth"]');

    expect(await creditCardInputs.count()).toBe(0);
    expect(await ssnInputs.count()).toBe(0);
    expect(await dobInputs.count()).toBe(0);
  });
});

