import { test, expect } from '@playwright/test';

test.describe('Phase 8: Multi-User Auth, Dashboard Metrics & Report Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Specification 1: Real-time Monthly Allocation vs Collection Metrics Rendered', async ({ page }) => {
    // Household: 4 members * 5.00 kg = 20.00 kg expected baseline
    await expect(page.locator('#display-expected-baseline')).toContainText('20.00 kg');
    await expect(page.locator('#cell-received')).toBeVisible();
    await expect(page.locator('#cell-shortfall')).toBeVisible();
  });

  test('Specification 2: Form Reset Mechanics Auto-Clears Inputs and Candidates', async ({ page }) => {
    // Fill in receipt candidate inputs
    await page.fill('#verified-item', 'Wheat');
    await page.fill('#verified-qty', '8.00');
    await page.check('#user-verified-checkbox');

    // Click submit
    await page.click('#btn-submit-receipt');
    await expect(page.locator('#receipt-message')).toContainText('Committed to ledger successfully!');

    // Checkbox is auto-cleared back to unverified
    const isChecked = await page.isChecked('#user-verified-checkbox');
    expect(isChecked).toBe(false);
  });

  test('Specification 3: Banned-Word Scanner On Generated Report DOM', async ({ page }) => {
    // Retrieve report DOM text
    const reportText = await page.locator('#card-ledger').innerText();

    const bannedWords = [/fraud/i, /theft/i, /stolen/i, /corrupt/i, /culprit/i, /siphoned/i, /illegal/i, /scam/i];
    for (const regex of bannedWords) {
      expect(reportText.match(regex)).toBeNull();
    }

    // Verify administrative reconciliation notice is visible
    await expect(page.locator('#neutral-disclaimer')).toBeVisible();
    await expect(page.locator('#neutral-disclaimer')).toContainText(
      'This document is an administrative reconciliation report'
    );
  });
});
