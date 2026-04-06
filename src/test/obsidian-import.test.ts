import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { importObsidianPost, rewriteObsidianMarkdown } from '../../scripts/import-obsidian-post.js';

const tempDirectories: string[] = [];

async function makeTempProject() {
	const root = await mkdtemp(join(tmpdir(), 'personal-blog-obsidian-'));
	tempDirectories.push(root);

	await mkdir(join(root, 'public'), { recursive: true });
	await mkdir(join(root, 'src', 'content', 'blog'), { recursive: true });

	return root;
}

afterEach(async () => {
	await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('Obsidian import workflow', () => {
	it('imports a note, copies relative images, and rewrites the article content', async () => {
		const projectRoot = await makeTempProject();
		const vaultRoot = await mkdtemp(join(tmpdir(), 'personal-blog-vault-'));
		tempDirectories.push(vaultRoot);

		const noteDir = join(vaultRoot, 'posts');
		const assetsDir = join(noteDir, 'assets');
		const notePath = join(noteDir, 'Shipping Notes.md');

		await mkdir(assetsDir, { recursive: true });
		await writeFile(join(assetsDir, 'hero image.png'), 'hero');
		await writeFile(join(assetsDir, 'inline one.png'), 'inline-one');
		await writeFile(join(assetsDir, 'inline two.png'), 'inline-two');
		await writeFile(
			notePath,
			`---
title: Shipping Notes
description: Obsidian import test
pubDate: 2026-04-05
heroImage: assets/hero image.png
tags:
- Testing
---

![[assets/inline one.png]]

![Diagram](assets/inline two.png)
`,
		);

		const result = await importObsidianPost({
			notePath,
			projectRoot,
		});

		const outputPath = join(projectRoot, 'src', 'content', 'blog', 'shipping-notes.md');
		const outputSource = await readFile(outputPath, 'utf8');

		expect(result.slug).toBe('shipping-notes');
		expect(outputSource).toContain('heroImage: /images/posts/shipping-notes/assets/hero image.png');
		expect(outputSource).toContain('![inline one](</images/posts/shipping-notes/assets/inline one.png>)');
		expect(outputSource).toContain('![Diagram](</images/posts/shipping-notes/assets/inline two.png>)');
		expect(existsSync(join(projectRoot, 'public', 'images', 'posts', 'shipping-notes', 'assets', 'hero image.png'))).toBe(true);
		expect(existsSync(join(projectRoot, 'public', 'images', 'posts', 'shipping-notes', 'assets', 'inline one.png'))).toBe(true);
		expect(existsSync(join(projectRoot, 'public', 'images', 'posts', 'shipping-notes', 'assets', 'inline two.png'))).toBe(true);
	});

	it('uses the attachments fallback directory for Obsidian image embeds', async () => {
		const projectRoot = await makeTempProject();
		const vaultRoot = await mkdtemp(join(tmpdir(), 'personal-blog-vault-'));
		tempDirectories.push(vaultRoot);

		const noteDir = join(vaultRoot, 'drafts');
		const attachmentsDir = join(vaultRoot, 'attachments');

		await mkdir(noteDir, { recursive: true });
		await mkdir(attachmentsDir, { recursive: true });
		await writeFile(join(attachmentsDir, 'shared screenshot.png'), 'shared-image');

		const output = await rewriteObsidianMarkdown('![[shared screenshot.png|Product screenshot]]', {
			projectRoot,
			noteDir,
			attachmentsDir,
			slug: 'shared-assets',
			copiedAssets: new Map(),
		});

		expect(output).toBe('![Product screenshot](</images/posts/shared-assets/shared screenshot.png>)');
		expect(existsSync(join(projectRoot, 'public', 'images', 'posts', 'shared-assets', 'shared screenshot.png'))).toBe(true);
	});
});
