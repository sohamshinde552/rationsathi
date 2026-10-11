import { test, expect } from '@playwright/test';

test.describe('Phase 7.5: Frontend Rescue (Mock Auth & Bulletproof PDF Report)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Rescue Goal 1: Frictionless Demo / Guest Onboarding Bypass', async ({ page }) => {
    // 1. Verify that user badge is rendered in navbar with active user
    const guestBadge = page.locator('#badge-demo-guest');
    await expect(guestBadge).toBeVisible();
    await expect(page.locator('#current-user-display')).toBeVisible();

    // 2. Ensure tester can navigate through all workflow steps without being blocked by backend auth
    await expect(page.locator('#display-expected-baseline')).toContainText('20.00 kg');
    await page.click('#tab-step-2');
    await expect(page.locator('#t-step2-title')).toBeVisible();
    await page.click('#tab-step-3');
    await expect(page.locator('#t-step3-title')).toBeVisible();
  });

  test('Rescue Goal 2: Bulletproof PDF Export & Print Buttons on Discrepancy Report', async ({ page }) => {
    // 1. Ensure report container with exact id="discrepancy-report-container" exists in DOM
    const reportContainer = page.locator('#discrepancy-report-container');
    await expect(reportContainer).toBeVisible();

    // 2. Verify Download PDF button exists and is clickable
    const downloadBtn = page.locator('#btn-download-pdf');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toContainText('Download PDF Report');

    // 3. Verify Print Report fallback button exists
    const printBtn = page.locator('#btn-print-report');
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toContainText('Print Report');
  });

  test('Rescue Goal 3: Zero Banned Accusatory Words in Report DOM', async ({ page }) => {
    const reportDom = await page.locator('#discrepancy-report-container').innerText();
    const bannedRegexes = [/fraud/i, /theft/i, /corrupt/i, /scam/i, /siphoned/i, /culprit/i, /illegal/i];

    for (const regex of bannedRegexes) {
      expect(reportDom.match(regex)).toBeNull();
    }

    // Verify neutral administrative notice presence
    await expect(page.locator('#neutral-disclaimer')).toBeVisible();
  });
});
