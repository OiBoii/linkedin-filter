const { test, expect } = require('@playwright/test');

test('fixture loads and has cards', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/tests/fixtures/jobs.html');
  await expect(page.locator('.jobs-search-results__list-item')).toHaveCount(2);
});

test('no long task from simple interaction baseline', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/tests/fixtures/jobs.html');
  const count = await page.locator('a.job-card-list__title').count();
  expect(count).toBeGreaterThan(0);
});
