import { expect, test } from '@playwright/test';

test('the home page loads featured posts', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle("Robert's Blog");
	await expect(page.getByRole('heading', { name: /hello, world/i })).toBeVisible();
	expect(await page.locator('[data-home-post-card]').count()).toBeGreaterThan(0);
	await expect(page.locator('[data-home-post-card]').first().locator('.title')).toContainText(/fail2banned/i);
	await expect(page.getByRole('link', { name: /key management w\/ keychain/i })).toHaveCount(0);
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

test('the blog search filters posts and persists after refresh', async ({ page }) => {
	await page.goto('/blog');

	const searchInput = page.locator('#postSearchInput');

	await searchInput.fill('fail2banned');

	await expect(page).toHaveURL(/\/blog\?q=fail2banned$/);
	await expect(page.locator('#filterSearchSummary')).toHaveText('Search: "fail2banned"');
	await expect(page.locator('[data-post-card]:visible')).toHaveCount(1);
	await expect(page.locator('[data-post-card]:visible .title').first()).toContainText(/fail2banned/i);

	await page.reload();

	await expect(searchInput).toHaveValue('fail2banned');
	await expect(page.locator('#filterSearchSummary')).toHaveText('Search: "fail2banned"');
	await expect(page.locator('[data-post-card]:visible')).toHaveCount(1);
});

test('the blog tag filter selection persists after refresh', async ({ page }) => {
	await page.goto('/blog');

	const firstFilter = page.locator('.tagButton[data-tag]:not([data-tag="all"])').first();
	const selectedTag = await firstFilter.getAttribute('data-tag');

	expect(selectedTag).toBeTruthy();
	await firstFilter.click();
	await expect(firstFilter).toHaveAttribute('aria-pressed', 'true');

	await page.reload();

	const restoredFilter = page.locator(`.tagButton[data-tag="${selectedTag}"]`);
	await expect(restoredFilter).toHaveAttribute('aria-pressed', 'true');

	const visibleCards = page.locator('[data-post-card]:visible');
	const visibleCount = await visibleCards.count();

	expect(visibleCount).toBeGreaterThan(0);

	for (let index = 0; index < visibleCount; index += 1) {
		await expect(visibleCards.nth(index).locator(`[data-post-tag="${selectedTag}"]`).first()).toBeVisible();
	}
});

test('selecting every individual tag collapses back to all posts', async ({ page }) => {
	await page.goto('/blog');

	const allPostsButton = page.locator('.tagButton[data-tag="all"]');
	const individualFilters = page.locator('.tagButton[data-tag]:not([data-tag="all"])');
	const filterCount = await individualFilters.count();
	const totalPostCount = await page.locator('[data-post-card]').count();

	for (let index = 0; index < filterCount; index += 1) {
		await individualFilters.nth(index).click();
	}

	await expect(allPostsButton).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('#filterSelectionSummary')).toHaveText('All tags');

	for (let index = 0; index < filterCount; index += 1) {
		await expect(individualFilters.nth(index)).toHaveAttribute('aria-pressed', 'false');
	}

	await expect(page.locator('[data-post-card]:visible')).toHaveCount(totalPostCount);
});

test('the mobile blog filter can be expanded and collapsed', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/blog');

	const toggle = page.locator('#mobileFilterToggle');
	const panel = page.locator('#filterPanel');
	const firstFilter = page.locator('.tagButton[data-tag]:not([data-tag="all"])').first();

	await expect(toggle).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(panel).toBeHidden();

	await toggle.click();

	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(panel).toBeVisible();
	await expect(firstFilter).toBeVisible();

	await firstFilter.click();
	await expect(toggle).toContainText('#');

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(panel).toBeHidden();
});
