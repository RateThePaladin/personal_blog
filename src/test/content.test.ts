import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const contentDir = new URL('../content/blog/', import.meta.url);
const publicDir = new URL('../../public/', import.meta.url);

function getFrontmatter(source: string) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) {
		throw new Error('Missing frontmatter block');
	}

	return match[1];
}

function getFrontmatterValue(frontmatter: string, field: string) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
	return match?.[1]?.trim() ?? '';
}

function getFrontmatterTags(frontmatter: string) {
	const match = frontmatter.match(/^tags:\r?\n((?:-\s*.+\r?\n?)*)/m);
	if (!match) {
		return [];
	}

	return match[1]
		.split(/\r?\n/)
		.map((line) => line.replace(/^-+\s*/, '').trim())
		.filter(Boolean);
}

describe('blog content', () => {
	const posts = readdirSync(contentDir).filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));

	it('includes the metadata required by the site and RSS feed', () => {
		expect(posts.length).toBeGreaterThan(0);

		for (const post of posts) {
			const source = readFileSync(new URL(post, contentDir), 'utf8');
			const frontmatter = getFrontmatter(source);

			expect(getFrontmatterValue(frontmatter, 'title').length).toBeGreaterThan(0);
			expect(getFrontmatterValue(frontmatter, 'description').length).toBeGreaterThan(0);
			expect(getFrontmatterValue(frontmatter, 'pubDate').length).toBeGreaterThan(0);
			expect(getFrontmatterTags(frontmatter).length).toBeGreaterThan(0);

			const heroImage = getFrontmatterValue(frontmatter, 'heroImage');
			expect(heroImage.startsWith('/')).toBe(true);
		}
	});

	it('points every post hero image at a real file in public/', () => {
		for (const post of posts) {
			const source = readFileSync(new URL(post, contentDir), 'utf8');
			const frontmatter = getFrontmatter(source);
			const heroImage = getFrontmatterValue(frontmatter, 'heroImage');
			const heroImagePath = fileURLToPath(new URL(`.${heroImage}`, publicDir));

			expect(existsSync(heroImagePath), `${post} is missing ${heroImage}`).toBe(true);
		}
	});

	it('does not use legacy external article or upload links in post content', () => {
		for (const post of posts) {
			const source = readFileSync(new URL(post, contentDir), 'utf8');
			expect(source).not.toMatch(/https?:\/\/[^\s)]+\/experiments\/\d+\/?/);
			expect(source).not.toMatch(/https?:\/\/[^\s)]+\/uploads\/[^\s)]+/);
		}
	});
});
