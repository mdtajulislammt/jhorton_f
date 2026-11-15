import { test, expect } from '@playwright/test';

test.describe('21+ Age Gate E2E Flow (AC-AGE-01, AC-AGE-02, AC-AGE-03)', () => {
  test('AC-AGE-01: First visit to storefront redirects to /age-gate', async ({ page }) => {
    // Navigate to homepage without cookie
    await page.goto('/');

    // Should be redirected to /age-gate
    await expect(page).toHaveURL(/.*\/age-gate/);
    await expect(page.getByRole('heading', { name: /You must be 21\+ to enter Owtlet/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I'm 21 or Older/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I'm Under 21/i })).toBeVisible();
  });

  test('AC-AGE-02: Declining (under 21) shows the exit screen and sets no verified cookie', async ({ page, context }) => {
    await page.goto('/age-gate');

    // Click "I'm Under 21"
    await page.getByRole('button', { name: /I'm Under 21/i }).click();

    // Should display Exit Screen with OCM legal notice
    await expect(page.getByRole('heading', { name: /21\+ Restricted Access/i })).toBeVisible();
    await expect(page.getByText(/Marihuana Regulation & Taxation Act/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Visit NY State OCM/i })).toHaveAttribute(
      'href',
      'https://cannabis.ny.gov'
    );

    // Verify owt_age cookie is not set
    const cookies = await context.cookies();
    const ageCookie = cookies.find((c) => c.name === 'owt_age');
    expect(ageCookie).toBeUndefined();
  });

  test('AC-AGE-03: Confirming 21+ sets owt_age cookie and allows browsing without re-prompt', async ({ page, context }) => {
    await page.goto('/age-gate?next=/');

    // Click "I'm 21 or Older"
    await page.getByRole('button', { name: /I'm 21 or Older/i }).click();

    // Should redirect to homepage /
    await page.waitForURL('/');
    expect(page.url()).not.toContain('/age-gate');

    // Verify owt_age cookie is present and httpOnly
    const cookies = await context.cookies();
    const ageCookie = cookies.find((c) => c.name === 'owt_age');
    expect(ageCookie).toBeDefined();
    expect(ageCookie?.httpOnly).toBe(true);

    // Direct reload of / should NOT redirect back to /age-gate
    await page.goto('/');
    expect(page.url()).not.toContain('/age-gate');
  });
});

