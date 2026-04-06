import { describe, expect, it } from 'vitest';
import type { BlogEntry } from '../utils/blog';
import {
	buildPostSearchDocument,
	getHomePosts,
	getPostPath,
	getPostSlug,
	getUniqueTags,
	matchesSearchQuery,
	sortPostsForBlogIndex,
	stripMarkdownForSearch,
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
		body: '',
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

	it('sorts the blog index newest first regardless of featured status', () => {
		const sortedPosts = sortPostsForBlogIndex(posts);

		expect(sortedPosts.map((post) => post.id)).toEqual([
			'081-again-with-the-repos',
			'069-build-a-heroku',
			'046-pend-tx-api-&&-react',
			'007-key-management-w_-keychain',
		]);
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

	it('builds a normalized search document from metadata and markdown content', () => {
		const searchDocument = buildPostSearchDocument({
			...makePost({
				id: '085-fail2banned',
				pubDate: '2026-04-05',
				tags: ['Security', 'Cloud'],
			}),
			body: `
# le processus

Cloudflare bans, Telegram alerts, and \`fail2ban-client\`.

![alert](./telegram-alert.png)
`,
		});

		expect(searchDocument).toContain('085 fail2banned');
		expect(searchDocument).toContain('security cloud');
		expect(searchDocument).toContain('cloudflare bans telegram alerts and fail2ban-client');
	});

	it('removes markdown formatting noise from searchable content', () => {
		expect(
			stripMarkdownForSearch(`
## heading

> quoted line

Regular [link](https://example.com) and ![[alert.png|Telegram alert]]

\`\`\`bash
echo "ignored"
\`\`\`
`),
		).toBe('heading quoted line Regular link and Telegram alert');
	});

	it('matches search queries as normalized multi-word terms', () => {
		const searchDocument = 'fail2ban cloudflare telegram alerts security';

		expect(matchesSearchQuery(searchDocument, 'fail2ban cloudflare')).toBe(true);
		expect(matchesSearchQuery(searchDocument, '  Telegram   security ')).toBe(true);
		expect(matchesSearchQuery(searchDocument, 'proxy xcode')).toBe(false);
	});
});
