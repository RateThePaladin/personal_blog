import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/': "/blog"
	},
	site: 'https://robertbordeaux.com',
	integrations: [mdx(), sitemap()],
});
