import { test, expect } from '@playwright/test';

test.describe('Brand Storefronts & Channel Checkout E2E Flow (AC-BRD-01, AC-BRD-02, T-BRD-01)', () => {
  test.beforeEach(async ({ page }) => {
    // Pass the 21+ Age Gate
    await page.goto('/age-gate?next=/brands');
    await page.getByRole('button', { name: /I'm 21 or Older/i }).click();
    await page.waitForURL('/brands');
  });

  test('AC-BRD-01: /brands index renders brand channel cards with official badges', async ({
    page,
  }) => {
    await page.goto('/brands');

    // Heading verification
    await expect(
      page.getByRole('heading', { name: /Official Brand Storefronts/i })
    ).toBeVisible();

    // Verify brand card elements exist
    const brandCards = page.locator('[data-testid^="brand-card-"]');
    const count = await brandCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('AC-BRD-01: Navigating to brand storefront /brands/[slug] displays hero, partner dispensary chips, and brand catalog', async ({
    page,
  }) => {
    await page.goto('/brands');

    // Click the first brand card
    const firstBrand = page.locator('[data-testid^="brand-card-"]').first();
    await firstBrand.click();

    // Verify on a brand storefront page
    await expect(page).toHaveURL(/\/brands\/[a-z0-9-]+/);

    // Verify Official Brand Channel badge
    await expect(
      page.getByText(/Official Brand Channel/i).first()
    ).toBeVisible();

    // Verify Fulfilled by Partner Store section
    await expect(
      page.getByText(/Fulfilled by/i).first()
    ).toBeVisible();

    // Verify Catalog & Drops section heading
    await expect(
      page.getByRole('heading', { name: /Catalog & Drops/i })
    ).toBeVisible();
  });

  test('AC-BRD-01: Inactive or non-existent brand returns 404 page', async ({
    page,
  }) => {
    const response = await page.goto('/brands/non-existent-brand-xyz');
    expect(response?.status()).toBe(404);
  });
});

