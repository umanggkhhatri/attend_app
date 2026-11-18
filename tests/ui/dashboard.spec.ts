import { test, expect } from '@playwright/test';
test('faculty overview, filtering, reports and mobile viewport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:5173');
  await expect(page.getByRole('heading', { name: 'Every class, accounted for.' })).toBeVisible();
  await page.getByRole('button', { name: 'Student records' }).click();
  await page.getByPlaceholder('Search name or roll number').fill('2401AI01');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.locator('tbody tr').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Reports & insights' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('CS3101');
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/faculty-overview.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Every class, accounted for.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('map selection opens a local session and closes it', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start attendance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open attendance' })).toBeDisabled();
  await page.locator('.leaflet-container').click({ position: { x: 200, y: 140 } });
  await expect(page.getByRole('button', { name: 'Open attendance' })).toBeEnabled();
  await page.getByRole('button', { name: 'Open attendance' }).click();
  await expect(page.getByText('● Session open', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close & finalise' }).click();
  await expect(
    page.getByText('Session closed. Remaining students are marked absent.'),
  ).toBeVisible();
});
test('download page does not advertise an unpublished APK', async ({ page }) => {
  await page.goto('http://localhost:5173/download');
  await expect(page.getByText('The APK is not published yet.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download Android APK' })).toHaveCount(0);
});
