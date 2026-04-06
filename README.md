# Robert's Blog

Personal site and blog built with Astro 6.

## Requirements

- Node `22.12.0` or newer
- npm

The repo includes an `.nvmrc` file so the expected Node version is easy to match locally and in CI.

## Setup

```bash
npm install
npx playwright install chromium
```

The Playwright install step is only needed once per machine for browser-based tests.

## Scripts

- `npm run dev` starts the local Astro dev server
- `npm run build` creates the production build in `dist/`
- `npm run preview` serves the built site locally
- `npm run check` runs Astro's type and content checks
- `npm run import:obsidian -- /path/to/note.md` imports an Obsidian note and copies its local images into the site
- `npm run test:unit` runs the Vitest suite
- `npm run test:e2e` builds the site and runs the Playwright smoke tests
- `npm test` runs the full verification flow: checks, unit tests, and e2e tests

## Content

- Blog posts live in `src/content/blog/`
- Content collections are configured in `src/content.config.ts`
- Shared blog helpers live in `src/utils/blog.ts`
- Static images and fonts live in `public/`

## Obsidian Workflow

The easiest setup is to keep your Obsidian vault outside this repo and import finished drafts into the site.

Recommended note shape:

- Start from `templates/obsidian-post.md`
- Keep images next to the note or in an Obsidian attachments folder
- Use either markdown images like `![Alt](assets/screenshot.png)` or Obsidian embeds like `![[assets/screenshot.png|Alt]]`
- Set `heroImage` to a local file path such as `assets/hero.png`

Import a draft:

```bash
npm run import:obsidian -- /absolute/path/to/My\ Draft.md --slug my-draft
```

Optional flags:

- `--attachments-dir /absolute/path/to/attachments` lets the importer resolve images from a shared Obsidian attachments folder
- `--overwrite` replaces an existing imported post with the same slug

What the importer does:

- Copies local note images into `public/images/posts/<slug>/`
- Rewrites article image links to the blog's public image paths
- Rewrites a relative `heroImage` frontmatter value to the copied public image path
- Warns if required blog frontmatter is missing
