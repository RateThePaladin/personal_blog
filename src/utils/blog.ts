import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

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
	return [...posts].sort((left, right) => {
		if (left.data.featured !== right.data.featured) {
			return left.data.featured ? -1 : 1;
		}

		return right.data.pubDate.valueOf() - left.data.pubDate.valueOf();
	});
}

export function getUniqueTags(posts: BlogEntry[]) {
	return [...new Set(posts.flatMap((post) => post.data.tags))].sort((left, right) =>
		left.localeCompare(right),
	);
}
