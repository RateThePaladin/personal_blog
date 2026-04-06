import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;
type SearchableBlogPost = Pick<BlogEntry, 'id' | 'data'> & { body?: string };

export function getPostSlug(id: string) {
	return id.replace(/[^A-Za-z0-9/_-]/g, '');
}

export function getPostPath(id: string) {
	return `/blog/${getPostSlug(id)}/`;
}

export function sortPostsByDateDesc(posts: BlogEntry[]) {
	return [...posts].sort((left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf());
}

export function getHomePosts(posts: BlogEntry[]) {
	return sortPostsByDateDesc(posts.filter((post) => post.data.home === true));
}

export function sortPostsForBlogIndex(posts: BlogEntry[]) {
	return sortPostsByDateDesc(posts);
}

export function getUniqueTags(posts: BlogEntry[]) {
	return [...new Set(posts.flatMap((post) => post.data.tags))].sort((left, right) =>
		left.localeCompare(right),
	);
}

export function normalizeSearchText(value: string) {
	return value
		.toLowerCase()
		.replace(/<[^>]+>/g, ' ')
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function stripMarkdownForSearch(source: string) {
	return source
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, ' $1 ')
		.replace(/!\[\[([^\]]+)\]\]/g, (_match, target: string) => {
			const [rawReference, rawLabel] = target.split('|');
			const reference = rawReference.trim().split(/[\\/]/).pop() ?? '';
			const filename = reference.replace(/\.[^.]+$/, '');
			const label = rawLabel?.trim() || filename;
			return ` ${label} `;
		})
		.replace(/!\[([^\]]*)\]\((?:<[^>]+>|[^)\n]+)\)/g, ' $1 ')
		.replace(/\[([^\]]+)\]\((?:<[^>]+>|[^)\n]+)\)/g, ' $1 ')
		.replace(/^>\s?/gm, ' ')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/[*_~|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function buildPostSearchDocument(post: SearchableBlogPost) {
	return normalizeSearchText(
		[
			post.data.title,
			post.data.description,
			post.data.tags.join(' '),
			getPostSlug(post.id).replace(/[-_]/g, ' '),
			stripMarkdownForSearch(post.body ?? ''),
		]
			.filter(Boolean)
			.join(' '),
	);
}

export function matchesSearchQuery(searchDocument: string, query: string) {
	const normalizedQuery = normalizeSearchText(query);

	if (!normalizedQuery) {
		return true;
	}

	return normalizedQuery
		.split(' ')
		.every((term) => searchDocument.includes(term));
}
