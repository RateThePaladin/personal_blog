import { describe, expect, it } from 'vitest';
import type { BlogEntry } from '../utils/blog';
import {
	getHomePosts,
	getPostPath,
	getPostSlug,
	getUniqueTags,
	sortPostsForBlogIndex,
} from '../utils/blog';

function makePost({
	id,
	pubDate,
	tags,
	featured = false,
	home = false,
}: {
	id: string;
	pubDate: string;
	tags: string[];
	featured?: boolean;
	home?: boolean;
}): BlogEntry {
	return {
		id,
		data: {
			title: id,
			description: `${id} description`,
			pubDate: new Date(pubDate),
			heroImage: '/images/test/hero.png',
			tags,
			featured,
			home,
		},
	} as BlogEntry;
}

describe('blog utilities', () => {
	const posts = [
		makePost({
			id: '046-pend-tx-api-&&-react',
			pubDate: '2023-03-01',
			tags: ['React', 'API'],
			featured: true,
		}),
		makePost({
			id: '069-build-a-heroku',
			pubDate: '2023-04-12',
			tags: ['Deployments', 'DevOps'],
			featured: true,
			home: true,
		}),
		makePost({
			id: '081-again-with-the-repos',
			pubDate: '2023-05-03',
			tags: ['GitHub', 'DevOps'],
		}),
		makePost({
			id: '007-key-management-w_-keychain',
			pubDate: '2022-12-21',
			tags: ['iOS', 'Security'],
			featured: true,
			home: true,
		}),
	];

	it('preserves legacy post slugs for punctuation-heavy filenames', () => {
		expect(getPostSlug('003-gasless-mint-&-scw-v0_01')).toBe('003-gasless-mint--scw-v0_01');
		expect(getPostSlug("023-uploads-n'-stuff")).toBe('023-uploads-n-stuff');
		expect(getPostSlug('054-the-(digital)-iron-dome')).toBe('054-the-digital-iron-dome');
	});

	it('builds blog paths from content ids', () => {
		expect(getPostPath('046-pend-tx-api-&&-react')).toBe('/blog/046-pend-tx-api--react/');
	});

	it('sorts the blog index with featured posts first and newest posts first within each group', () => {
		const sortedPosts = sortPostsForBlogIndex(posts);
		const firstStandardPostIndex = sortedPosts.findIndex((post) => !post.data.featured);
		const featuredPosts =
			firstStandardPostIndex === -1 ? sortedPosts : sortedPosts.slice(0, firstStandardPostIndex);
		const standardPosts =
			firstStandardPostIndex === -1 ? [] : sortedPosts.slice(firstStandardPostIndex);

		expect(featuredPosts.every((post) => post.data.featured)).toBe(true);

		for (let index = 1; index < featuredPosts.length; index += 1) {
			expect(featuredPosts[index - 1].data.pubDate.valueOf()).toBeGreaterThanOrEqual(
				featuredPosts[index].data.pubDate.valueOf(),
			);
		}

		for (let index = 1; index < standardPosts.length; index += 1) {
			expect(standardPosts[index - 1].data.pubDate.valueOf()).toBeGreaterThanOrEqual(
				standardPosts[index].data.pubDate.valueOf(),
			);
		}
	});

	it('returns home posts newest first', () => {
		const homePosts = getHomePosts(posts);

		expect(homePosts.length).toBeGreaterThan(0);
		expect(homePosts.every((post) => post.data.home)).toBe(true);

		for (let index = 1; index < homePosts.length; index += 1) {
			expect(homePosts[index - 1].data.pubDate.valueOf()).toBeGreaterThanOrEqual(
				homePosts[index].data.pubDate.valueOf(),
			);
		}
	});

	it('returns unique tags in a stable alphabetical order', () => {
		const tags = getUniqueTags(posts);

		expect(tags.length).toBeGreaterThan(0);
		expect(tags).toEqual([...tags].sort((left, right) => left.localeCompare(right)));
		expect(new Set(tags).size).toBe(tags.length);
	});
});
