import { test, expect } from '@playwright/test';

test('nine-slide story, keyboard navigation, evidence and concise mode', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:5178/presentation');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clearer picture.');
  await expect(
    page.getByRole('navigation', { name: 'Presentation slides' }).getByRole('button'),
  ).toHaveCount(9);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Guesswork');
  await page.getByRole('button', { name: 'See the evidence', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Survey evidence' })).toBeVisible();
  await expect(page.getByText('189 yes · 111 no', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Presentation length' }).selectOption('brief');
  await expect(
    page.getByRole('navigation', { name: 'Presentation slides' }).getByRole('button'),
  ).toHaveCount(5);
  await page.keyboard.press('End');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A record both sides');
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('interactive recovery, screenshot enlargement and persistent contribution editor', async ({
  page,
}) => {
  await page.goto('http://localhost:5178/presentation?slide=5');
  await page.getByRole('button', { name: 'Show the 16-class recovery', exact: true }).click();
  await expect(page.locator('.deck-example-numbers')).toContainText('75.0');
  await expect(page.getByText('At or above 75%.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Enlarge Course-wise attendance', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Course-wise attendance' })).toBeVisible();
  await expect(page.locator('.deck-image-viewer img')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Edit team contributions', exact: true }).click();
  await page.getByLabel('Umang Khatri', { exact: true }).fill('Example role for UI test');
  await page.getByRole('button', { name: 'Save contributions', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Edit team contributions', exact: true }).click();
  await expect(page.getByLabel('Umang Khatri', { exact: true })).toHaveValue(
    'Example role for UI test',
  );
});

test('all slides, screenshot assets and downloadable backup work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5178/presentation');
  for (let slide = 1; slide <= 9; slide++) {
    await page
      .getByRole('navigation', { name: 'Presentation slides' })
      .getByRole('button')
      .nth(slide - 1)
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.deck-stage img')].every(
        (image) =>
          (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
      ),
    );
    await page
      .locator('.deck-scene')
      .evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished)),
      );
    await page.screenshot({
      path: `artifacts/website-presentation/slide-${String(slide).padStart(2, '0')}.png`,
      animations: 'disabled',
    });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);
    const stageFits = await page
      .locator('.deck-stage')
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 2);
    expect(stageFits).toBe(true);
    await page.setViewportSize({ width: 1366, height: 768 });
    const projectorFits = await page
      .locator('.deck-stage')
      .evaluate((element) => element.scrollHeight <= element.clientHeight + 2);
    expect(projectorFits).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.getByRole('button', { name: 'Presentation help', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download PPTX backup', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('OneAttend_MVP_Final.pptx');
});

test('mobile presentation remains readable and navigable', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('http://localhost:5178/presentation');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A clearer picture.');
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Guesswork');
  await page.getByRole('button', { name: 'Open screenshot gallery', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Screenshot gallery' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
});
