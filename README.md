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
- `npm run test:unit` runs the Vitest suite
- `npm run test:e2e` builds the site and runs the Playwright smoke tests
- `npm test` runs the full verification flow: checks, unit tests, and e2e tests

## Content

- Blog posts live in `src/content/blog/`
- Content collections are configured in `src/content.config.ts`
- Shared blog helpers live in `src/utils/blog.ts`
- Static images and fonts live in `public/`
