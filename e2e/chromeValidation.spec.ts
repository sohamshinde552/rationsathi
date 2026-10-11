import { test, expect } from '@playwright/test';

const BANNED_WORDS = [
  /fraud/i,
  /theft/i,
  /stolen/i,
  /scam/i,
  /corrupt/i,
  /culprit/i,
  /siphoned/i,
  /illegal/i,
];

const MANDATORY_DISCLAIMER_SNIPPET =
  'This document is an administrative reconciliation report. Differences may occur due to stock shortages, delivery delays, unrecorded visits, or documentation errors.';

test.describe('Phase 6: Chrome End-to-End Validation & Final System Audit', () => {
  test.beforeEach(async ({ page, request }) => {
    // Clean server ledger state for reproducible test runs
    await request.post('/api/ledger/clear').catch(() => {});
    // Navigate to local test server
    await page.goto('/');
  });

  test('Check 1: Air-Gap Protocol & Schema Enforcer', async ({ page }) => {
    // Fill in receipt text and trigger OCR parse
    await page.fill('#raw-ocr-input', 'Visit 1\nDate: 2026-10-04\nWheat: 8.00 kg');
    await page.click('#btn-parse-receipt');

    // Wait for suggested fields to be filled
    await expect(page.locator('#verified-item')).toHaveValue('Wheat');
    await expect(page.locator('#verified-qty')).toHaveValue('8');

    // Ensure confirmation checkbox remains unchecked by default
    const isChecked = await page.isChecked('#user-verified-checkbox');
    expect(isChecked).toBe(false);

    // Attempt to click submit while user_verified is false
    await page.click('#btn-submit-receipt');

    // Assert that the app blocks the submit action and displays "Explicit User Confirmation Required" modal
    const modal = page.locator('#modal-airgap-violation');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Explicit User Confirmation Required');
  });

  test('Check 2: Multi-Visit Partial Delivery Math Test', async ({ page }) => {
    // Household: 4 members * 5 kg = 20.00 kg baseline
    await expect(page.locator('#display-expected-baseline')).toContainText('20.00 kg');

    // Visit 1: 8.00 kg received. Confirmed.
    await page.fill('#verified-item', 'Wheat');
    await page.fill('#verified-qty', '8.00');
    await page.check('#user-verified-checkbox');
    await page.click('#btn-submit-receipt');

    await expect(page.locator('#receipt-message')).toContainText('Committed to ledger successfully!');
    await expect(page.locator('#cell-received')).toContainText('8.00 kg');
    await expect(page.locator('#cell-shortfall')).toContainText('12.00 kg');

    // Visit 2: 7.00 kg received. Confirmed.
    await page.fill('#verified-date', '2026-10-18');
    await page.fill('#verified-qty', '7.00');
    await page.check('#user-verified-checkbox');
    await page.click('#btn-submit-receipt');

    // Assert DOM calculates exact remaining shortfall: 20.00 - (8.00 + 7.00) = 5.00 kg
    // Assert exact string "5.00 kg" appears without floating-point precision issues
    await expect(page.locator('#cell-received')).toContainText('15.00 kg');
    await expect(page.locator('#cell-shortfall')).toContainText('5.00 kg');

    // Verify cell content does NOT contain float drift like 5.000000001
    const shortfallText = await page.locator('#cell-shortfall').innerText();
    expect(shortfallText.trim()).toBe('5.00 kg');
  });

  test('Check 3: Neutral Language DOM Audit Function (scanNeutrality)', async ({ page }) => {
    // Retrieve entire page text content
    const bodyText = await page.locator('body').innerText();

    // Scan against regex array of banned words
    for (const bannedRegex of BANNED_WORDS) {
      const match = bodyText.match(bannedRegex);
      expect(
        match,
        `Neutrality violation! Prohibited accusatory word detected: "${match?.[0]}"`
      ).toBeNull();
    }

    // Assert presence of mandatory disclaimer text
    const disclaimer = page.locator('#neutral-disclaimer');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(MANDATORY_DISCLAIMER_SNIPPET);
  });

  test('Check 4: Chrome Offline Network & IndexedDB Sync', async ({ page, context }) => {
    // Simulate offline state in browser context
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Status pill should switch to offline mode
    await expect(page.locator('#network-status')).toContainText('Offline Mode (Cached)');

    // Submit a receipt entry while offline
    await page.fill('#verified-item', 'Wheat');
    await page.fill('#verified-qty', '5.00');
    await page.check('#user-verified-checkbox');
    await page.click('#btn-submit-receipt');

    // Verify confirmation message indicates IndexedDB caching
    await expect(page.locator('#receipt-message')).toContainText(
      'Stored locally in IndexedDB (Offline)'
    );

    // Verify item is present in browser IndexedDB
    const cachedCount = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve) => {
        const req = indexedDB.open('RationSaathiBrowserDB', 1);
        req.onsuccess = () => resolve(req.result);
      });
      return new Promise<number>((resolve) => {
        const tx = db.transaction('offline_receipts', 'readonly');
        const countReq = tx.objectStore('offline_receipts').count();
        countReq.onsuccess = () => resolve(countReq.result);
      });
    });
    expect(cachedCount).toBe(1);

    // Restore online state
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Network status updates and automatic background sync is triggered
    await expect(page.locator('#network-status')).toContainText('Online Mode');

    // Verify table updates with synchronized record
    await expect(page.locator('#cell-received')).toBeVisible();
  });

  test('Check 5: Mobile Viewport & DevTools Console Cleanliness', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test responsive rendering in mobile mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Verify layout elements are loaded and clickable
    await expect(page.locator('#card-airgap')).toBeVisible();
    await expect(page.locator('#card-household')).toBeVisible();
    await expect(page.locator('#card-ledger')).toBeVisible();

    // Zero unhandled console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
