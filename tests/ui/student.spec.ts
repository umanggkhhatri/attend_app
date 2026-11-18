import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 393, height: 852 } });
test('student membership, course analytics and campus request demo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:4174');
  await expect(page.getByText('Good to see you,', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'artifacts/student-home.png', fullPage: true });
  await page.getByRole('tab', { name: 'Attendance', exact: true }).click();
  await page.getByRole('button', { name: 'Unlock attendance insights' }).click();
  await page.getByPlaceholder('Enter demo access code').fill('wrong');
  await page.getByRole('button', { name: 'Unlock demo insights' }).click();
  await expect(page.getByText('That demo code is not valid.', { exact: false })).toBeVisible();
  await page.getByPlaceholder('Enter demo access code').fill('student123');
  await page.getByRole('button', { name: 'Unlock demo insights' }).click();
  await expect(page.getByText('Your semester,', { exact: false })).toBeVisible();
  await expect(page.getByPlaceholder('Enter demo access code')).not.toBeVisible();
  await page.screenshot({ path: 'artifacts/student-attendance.png', fullPage: true });
  await page.getByRole('tab', { name: 'Campus', exact: true }).click();
  await page.getByText('Hostel complaints', { exact: true }).click();
  await page.getByRole('button', { name: 'Report an issue' }).click();
  await page.getByPlaceholder('Ceiling fan is not working').fill('Desk light is broken');
  await page.getByPlaceholder('Hostel A, Room 214').fill('Hostel B, Room 101');
  await page.getByPlaceholder('Electrical / Plumbing / Cleaning').fill('Electrical');
  await page
    .getByPlaceholder('Tell us what needs attention')
    .fill('Light flickers when switched on.');
  await page.getByRole('button', { name: 'Save sample request' }).click();
  await expect(page.getByText('Desk light is broken', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
