import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getPostPath, sortPostsByDateDesc } from '../utils/blog';

export async function GET(context) {
	const posts = sortPostsByDateDesc(await getCollection('blog'));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: getPostPath(post.id),
		})),
	});
}
