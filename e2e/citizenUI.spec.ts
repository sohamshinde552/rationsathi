import { test, expect } from '@playwright/test';

test.describe('Phase 7: Citizen-Centric UI & i18n Localization Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Goal 1: Modal State Bug Fix (Escape, Backdrop Click, and X Button)', async ({ page }) => {
    // 1. Trigger the modal by attempting submit without verification
    await page.locator('#btn-submit-receipt').click();
    const modal = page.locator('#modal-airgap-violation');
    await expect(modal).toBeVisible();

    // 2. Test visible 'Close' button dismisses modal
    await page.locator('#t-modal-close-btn').click({ force: true });
    await expect(modal).not.toBeVisible();

    // 3. Trigger modal again and test prominent 'X' button dismisses modal
    await page.locator('#btn-submit-receipt').click();
    await expect(modal).toBeVisible();
    await page.locator('.modal-close-btn').click({ force: true });
    await expect(modal).not.toBeVisible();

    // 4. Trigger modal again and test Escape key dismisses modal
    await page.locator('#btn-submit-receipt').click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // 5. Trigger modal again and test backdrop click dismisses modal
    await page.locator('#btn-submit-receipt').click();
    await expect(modal).toBeVisible();
    // Click outside modal content (on the backdrop overlay)
    await page.locator('#modal-airgap-violation').click({ position: { x: 5, y: 5 }, force: true });
    await expect(modal).not.toBeVisible();
  });

  test('Goal 2: Multilingual Support (English, Hindi, and Marathi Translations)', async ({ page }) => {
    // Default English verification
    await expect(page.locator('#t-app-title')).toHaveText('RationSaathi');
    await expect(page.locator('#t-step1-tab')).toHaveText('1. Setup');

    // Switch to Hindi
    await page.selectOption('#lang-select', 'hi');
    await expect(page.locator('#t-app-title')).toHaveText('राशन साथी');
    await expect(page.locator('#t-camera-btn')).toContainText('फोटो खींचें');

    // Switch to Marathi
    await page.selectOption('#lang-select', 'mr');
    await expect(page.locator('#t-app-title')).toHaveText('रेशन साथी');
    await expect(page.locator('#t-camera-btn')).toContainText('फोटो काढा');

    // Return to English
    await page.selectOption('#lang-select', 'en');
    await expect(page.locator('#t-app-title')).toHaveText('RationSaathi');
  });

  test('Goal 3: Mobile-First Step-by-Step Wizard Usability & Touch Targets', async ({ page }) => {
    // Check touch target heights (minimum 44px)
    const langSelect = page.locator('#lang-select');
    const langBox = await langSelect.boundingBox();
    expect(langBox?.height).toBeGreaterThanOrEqual(44);

    const submitBtn = page.locator('#btn-submit-receipt');
    const btnBox = await submitBtn.boundingBox();
    expect(btnBox?.height).toBeGreaterThanOrEqual(44);

    // Large camera upload zone
    const cameraZone = page.locator('.camera-zone');
    await expect(cameraZone).toBeVisible();
    const cameraBox = await cameraZone.boundingBox();
    expect(cameraBox?.height).toBeGreaterThanOrEqual(60);
  });
});
