import { test, expect } from '@playwright/test';

test.describe('Terrific Live Shopping E2E Flow (AC-LIVE-01, AC-LIVE-02, AC-LIVE-03, T-TRF-01, T-MAP-01)', () => {
  test.beforeEach(async ({ page }) => {
    // Pass the 21+ Age Gate
    await page.goto('/age-gate?next=/');
    await page.getByRole('button', { name: /I'm 21 or Older/i }).click();
    await page.waitForURL('/');
  });

  test('AC-LIVE-01: Terrific player renders on / with configured embeddingId and window.terrificLiveSettings', async ({
    page,
  }) => {
    await page.goto('/');

    // Verify Terrific container and player element
    const container = page.getByTestId('terrific-embed-container');
    await expect(container).toBeVisible();

    const playerRoot = page.getByTestId('terrific-player-root');
    await expect(playerRoot).toBeAttached();
    await expect(playerRoot).toHaveAttribute('data-source', 'terrific');
    await expect(playerRoot).toHaveAttribute('embedding-id', 'Cki70GhqvLgWGhJbSxg2');

    // Verify window.terrificLiveSettings is configured before SDK script loads
    const hasSettings = await page.evaluate(() => {
      const settings = (window as any).terrificLiveSettings;
      return (
        Boolean(settings) &&
        typeof settings.cartSyncConfig?.cartSyncHandler === 'function' &&
        typeof settings.goToCheckoutConfig?.goToCheckoutHandler === 'function'
      );
    });

    expect(hasSettings).toBe(true);
  });

  test('AC-LIVE-02 & T-TRF-01: Simulated cartSyncHandler adds pinned product to cart and shows toast', async ({
    page,
  }) => {
    await page.goto('/');

    // Simulate Terrific in-stream add to cart for mapped product
    const syncResult = await page.evaluate(async () => {
      const settings = (window as any).terrificLiveSettings;
      if (!settings?.cartSyncConfig?.cartSyncHandler) return false;

      return await settings.cartSyncConfig.cartSyncHandler({
        action: 'addProductToCart',
        cartProducts: [
          {
            externalId: 'terrific-prod-sour-diesel-prerolls',
            name: 'Sour Diesel Pre-Roll 5-Pack',
            quantity: 1,
          },
        ],
      });
    });

    expect(syncResult).toBe(true);

    // Verify toast notification appears
    await expect(
      page.getByText(/Sour Diesel Pre-Roll 5-Pack added to your cart/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('AC-LIVE-03 & T-MAP-01: Unmapped live product shows error toast and does not crash', async ({
    page,
  }) => {
    await page.goto('/');

    // Simulate Terrific in-stream add to cart for UNMAPPED product ID
    await page.evaluate(async () => {
      const settings = (window as any).terrificLiveSettings;
      if (!settings?.cartSyncConfig?.cartSyncHandler) return;

      await settings.cartSyncConfig.cartSyncHandler({
        action: 'addProductToCart',
        cartProducts: [
          {
            externalId: 'unmapped-terrific-id-999',
            name: 'Unknown Pinned Item',
            quantity: 1,
          },
        ],
      });
    });

    // Verify AC-LIVE-03 verbatim error toast: "This product isn't available on Owtlet yet."
    await expect(
      page.getByText("This product isn't available on Owtlet yet.")
    ).toBeVisible({ timeout: 5000 });
  });

  test('T-TRF-01: goToCheckoutHandler routes to /checkout', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const settings = (window as any).terrificLiveSettings;
      if (!settings?.goToCheckoutConfig?.goToCheckoutHandler) return;

      await settings.goToCheckoutConfig.goToCheckoutHandler({
        cartProducts: [],
      });
    });

    await page.waitForURL('**/checkout');
    expect(page.url()).toContain('/checkout');
  });
});

