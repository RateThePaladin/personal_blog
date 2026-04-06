import { expect, test } from '@playwright/test';

test('the home page loads featured posts', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle("Robert's Blog");
	await expect(page.getByRole('heading', { name: /hello, world/i })).toBeVisible();
	expect(await page.locator('[data-home-post-card]').count()).toBeGreaterThan(0);
});

test('the blog tag filter only shows posts with the selected tag', async ({ page }) => {
	await page.goto('/blog');

	const firstFilter = page.locator('.tagButton[data-tag]:not([data-tag="all"])').first();
	const selectedTag = await firstFilter.getAttribute('data-tag');

	expect(selectedTag).toBeTruthy();
	await firstFilter.click();

	const visibleCards = page.locator('[data-post-card]:visible');
	const visibleCount = await visibleCards.count();

	expect(visibleCount).toBeGreaterThan(0);

	for (let index = 0; index < visibleCount; index += 1) {
		await expect(visibleCards.nth(index).locator(`[data-post-tag="${selectedTag}"]`).first()).toBeVisible();
	}
});
