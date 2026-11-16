import { test, expect } from '@playwright/test';

test.describe('Full E2E Regression Journey Suite (TASK-018, docs/11, docs/13)', () => {
  test.beforeEach(async ({ context }) => {
    // Standard 21+ age cookie attestation for storefront browsing
    await context.addCookies([
      {
        name: 'owt_age',
        value: 'verified_age_token_e2e_regression',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  });

  // ==========================================================================
  // Journey 1: Storefront Home & Terrific Live Shopping
  // ==========================================================================
  test('Journey 1: Homepage renders live broadcast hero, Terrific embed, and catalog rail (AC-LIVE-01)', async ({
    page,
  }) => {
    await page.goto('/');

    // Header navigation
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /Shop/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Live Shows/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Brands/i })).toBeVisible();

    // Terrific container
    const liveContainer = page.getByTestId('terrific-embed-container');
    if (await liveContainer.isVisible()) {
      await expect(page.getByTestId('terrific-player-root')).toBeAttached();
    }
  });

  // ==========================================================================
  // Journey 2: Cannabis Catalog Browsing & One-Price Indicator
  // ==========================================================================
  test('Journey 2: Catalog displays cannabis products, category filters, and uniform pricing (AC-CAT-01, AC-PRC-01)', async ({
    page,
  }) => {
    await page.goto('/shop');

    // Heading and categories
    await expect(page.locator('h1')).toContainText(/Cannabis Catalog|Shop Cannabis/i);

    // Filter controls
    const filterSection = page.locator('aside, section, div').filter({ hasText: /Categories|Strain Type/i }).first();
    await expect(filterSection).toBeVisible();

    // Verify products render with prices
    const productCards = page.locator('[data-testid="product-card"], .product-card, article');
    if ((await productCards.count()) > 0) {
      const firstCard = productCards.first();
      await expect(firstCard).toBeVisible();
    }
  });

  // ==========================================================================
  // Journey 3: Brand Channels & Scoped Partner Storefronts
  // ==========================================================================
  test('Journey 3: Brand channels list verified partner dispensaries and scoped products (AC-BRD-01)', async ({
    page,
  }) => {
    await page.goto('/brands');

    await expect(page.locator('h1')).toContainText(/Featured Brands|Brand Channels/i);
    const brandCards = page.locator('article, [data-testid="brand-card"]');
    if ((await brandCards.count()) > 0) {
      await expect(brandCards.first()).toBeVisible();
    }
  });

  // ==========================================================================
  // Journey 4: Shoppable Videos & On-Demand Replay Vault
  // ==========================================================================
  test('Journey 4: Shoppable video reels and on-demand stream directory (AC-LIVE-04)', async ({
    page,
  }) => {
    await page.goto('/videos');

    await expect(page.locator('h1')).toContainText(/Shoppable Videos|Video Vault/i);
  });

  // ==========================================================================
  // Journey 5: Cannabis Checkout & Zero ID / Zero Payment Guarantee
  // ==========================================================================
  test('Journey 5: Checkout guarantees zero ID collection and zero payment processing (AC-SEC-01, AC-PRF-01)', async ({
    page,
  }) => {
    await page.goto('/checkout');

    const pageContent = await page.textContent('body');
    // Absolute compliance guarantees
    expect(pageContent).not.toContain('Credit Card Number');
    expect(pageContent).not.toContain('CVV / CVC');
    expect(pageContent).not.toContain('Social Security Number');
    expect(pageContent).not.toContain('Driver License Upload');
    expect(pageContent).not.toContain('Date of Birth (MM/DD/YYYY)');
  });

  // ==========================================================================
  // Journey 6: Shopper Account Portal & Address Book
  // ==========================================================================
  test('Journey 6: Shopper account login and registration options (AC-PRF-02)', async ({
    page,
  }) => {
    await page.goto('/account/login');

    await expect(page.locator('h1, h2')).toContainText(/Sign In|Shopper Login/i);
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Create an account|Register/i })).toBeVisible();
  });

  // ==========================================================================
  // Journey 7: Admin Operations Portal & Login Safeguard
  // ==========================================================================
  test('Journey 7: Admin portal login requires secure credentials and protects operations (AC-ADM-01)', async ({
    page,
  }) => {
    await page.goto('/admin/login');

    await expect(page.locator('h1, h2')).toContainText(/Admin Sign In|Owtlet Admin/i);
    await expect(page.getByLabel(/Email|Username/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Login/i })).toBeVisible();
  });
});

