import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\((<[^>]+>|[^)\n]+)\)/g;
const OBSIDIAN_EMBED_PATTERN = /!\[\[([^\]]+)\]\]/g;
const IMAGE_EXTENSIONS = new Set([
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.svg',
	'.avif',
	'.bmp',
	'.tif',
	'.tiff',
]);
const REQUIRED_FRONTMATTER_FIELDS = ['title', 'description', 'pubDate', 'heroImage', 'tags'];

export function slugify(value) {
	return value
		.toLowerCase()
		.trim()
		.replace(/['"]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'post';
}

export function splitFrontmatter(source) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match) {
		return { frontmatter: '', body: source, hasFrontmatter: false };
	}

	return {
		frontmatter: match[1],
		body: source.slice(match[0].length),
		hasFrontmatter: true,
	};
}

export function getFrontmatterValue(frontmatter, field) {
	const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = frontmatter.match(new RegExp(`^${escapedField}:\\s*(.+)$`, 'm'));
	return match?.[1]?.trim() ?? '';
}

export function setFrontmatterValue(frontmatter, field, value) {
	const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`^(${escapedField}:\\s*)(.+)$`, 'm');

	if (pattern.test(frontmatter)) {
		return frontmatter.replace(pattern, `$1${value}`);
	}

	return `${frontmatter.trimEnd()}\n${field}: ${value}`.trim();
}

export function getMissingRequiredFrontmatter(frontmatter) {
	if (!frontmatter.trim()) {
		return REQUIRED_FRONTMATTER_FIELDS;
	}

	return REQUIRED_FRONTMATTER_FIELDS.filter((field) => {
		if (field === 'tags') {
			return !/^tags:\r?\n(?:-\s*.+\r?\n?)+/m.test(frontmatter);
		}

		return getFrontmatterValue(frontmatter, field).length === 0;
	});
}

function isExternalReference(reference) {
	return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(reference) || reference.startsWith('data:');
}

function unwrapReference(reference) {
	const trimmed = reference.trim();

	if (
		(trimmed.startsWith('<') && trimmed.endsWith('>')) ||
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1).trim();
	}

	return trimmed;
}

function sanitizeAssetPath(reference, fallbackName) {
	const withoutQuery = unwrapReference(reference).split(/[?#]/, 1)[0];
	const safeSegments = withoutQuery
		.replace(/^\.\/+/, '')
		.split(/[\\/]/)
		.filter((segment) => segment && segment !== '.' && segment !== '..');

	return safeSegments.length > 0 ? safeSegments.join('/') : fallbackName;
}

function isImageReference(reference) {
	const extension = extname(unwrapReference(reference).split(/[?#]/, 1)[0]).toLowerCase();
	return IMAGE_EXTENSIONS.has(extension);
}

async function replaceMatches(source, pattern, replacer) {
	let result = '';
	let lastIndex = 0;

	for (const match of source.matchAll(pattern)) {
		const index = match.index ?? 0;
		result += source.slice(lastIndex, index);
		result += await replacer(match);
		lastIndex = index + match[0].length;
	}

	result += source.slice(lastIndex);
	return result;
}

async function ensureImportedAsset(reference, context) {
	if (!reference || isExternalReference(reference)) {
		return null;
	}

	const unwrappedReference = unwrapReference(reference);
	const candidates = [];

	if (isAbsolute(unwrappedReference)) {
		candidates.push(resolve(unwrappedReference));
	} else {
		candidates.push(resolve(context.noteDir, unwrappedReference));

		if (context.attachmentsDir) {
			candidates.push(resolve(context.attachmentsDir, unwrappedReference));
			candidates.push(resolve(context.attachmentsDir, basename(unwrappedReference)));
		}
	}

	const sourcePath = candidates.find((candidate) => existsSync(candidate));
	if (!sourcePath) {
		return null;
	}

	if (context.copiedAssets.has(sourcePath)) {
		return context.copiedAssets.get(sourcePath);
	}

	const relativeAssetPath = sanitizeAssetPath(unwrappedReference, basename(sourcePath));
	const destinationFsPath = join(
		context.projectRoot,
		'public',
		'images',
		'posts',
		context.slug,
		...relativeAssetPath.split('/'),
	);
	const publicUrl = `/${posix.join('images', 'posts', context.slug, ...relativeAssetPath.split('/'))}`;

	await mkdir(dirname(destinationFsPath), { recursive: true });
	await copyFile(sourcePath, destinationFsPath);

	context.copiedAssets.set(sourcePath, publicUrl);
	return publicUrl;
}

export async function rewriteObsidianMarkdown(source, context) {
	let rewritten = await replaceMatches(source, MARKDOWN_IMAGE_PATTERN, async (match) => {
		const altText = match[1];
		const reference = match[2];

		if (!isImageReference(reference)) {
			return match[0];
		}

		const publicUrl = await ensureImportedAsset(reference, context);
		return publicUrl ? `![${altText}](<${publicUrl}>)` : match[0];
	});

	rewritten = await replaceMatches(rewritten, OBSIDIAN_EMBED_PATTERN, async (match) => {
		const [rawTarget, rawLabel = ''] = match[1].split('|');
		const reference = rawTarget.trim();

		if (!isImageReference(reference)) {
			return match[0];
		}

		const publicUrl = await ensureImportedAsset(reference, context);
		if (!publicUrl) {
			return match[0];
		}

		const label = rawLabel.trim();
		const basenameWithoutExtension = basename(reference, extname(reference));
		const altText = label && !/^\d+$/.test(label) ? label : basenameWithoutExtension;

		return `![${altText}](<${publicUrl}>)`;
	});

	return rewritten;
}

export async function importObsidianPost(options) {
	const projectRoot = resolve(options.projectRoot ?? process.cwd());
	const notePath = resolve(options.notePath);
	const attachmentsDir = options.attachmentsDir ? resolve(options.attachmentsDir) : undefined;
	const noteSource = await readFile(notePath, 'utf8');
	const { frontmatter, body, hasFrontmatter } = splitFrontmatter(noteSource);
	const title = getFrontmatterValue(frontmatter, 'title') || basename(notePath, extname(notePath));
	const slug = options.slug ?? slugify(title);
	const outputExtension = extname(notePath).toLowerCase() === '.mdx' ? '.mdx' : '.md';
	const outputPath = join(projectRoot, 'src', 'content', 'blog', `${slug}${outputExtension}`);

	if (existsSync(outputPath) && options.overwrite !== true) {
		throw new Error(`Refusing to overwrite existing post: ${outputPath}`);
	}

	const context = {
		projectRoot,
		noteDir: dirname(notePath),
		attachmentsDir,
		slug,
		copiedAssets: new Map(),
	};

	let nextFrontmatter = frontmatter;
	const heroImageReference = getFrontmatterValue(frontmatter, 'heroImage');

	if (heroImageReference && isImageReference(heroImageReference)) {
		const publicHeroImageUrl = await ensureImportedAsset(heroImageReference, context);
		if (publicHeroImageUrl) {
			nextFrontmatter = setFrontmatterValue(nextFrontmatter, 'heroImage', publicHeroImageUrl);
		}
	}

	const nextBody = await rewriteObsidianMarkdown(body, context);
	const outputSource = hasFrontmatter
		? `---\n${nextFrontmatter}\n---\n\n${nextBody.trimStart()}`
		: nextBody;

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, outputSource.endsWith('\n') ? outputSource : `${outputSource}\n`, 'utf8');

	return {
		slug,
		outputPath,
		publicImageUrls: [...context.copiedAssets.values()],
		missingFrontmatter: getMissingRequiredFrontmatter(nextFrontmatter),
	};
}

export function parseCliArgs(argv) {
	const args = { overwrite: false };

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];

		if (!token.startsWith('--') && !args.notePath) {
			args.notePath = token;
			continue;
		}

		if (token === '--slug') {
			args.slug = argv[index + 1];
			index += 1;
			continue;
		}

		if (token === '--attachments-dir') {
			args.attachmentsDir = argv[index + 1];
			index += 1;
			continue;
		}

		if (token === '--overwrite') {
			args.overwrite = true;
			continue;
		}

		if (token === '--help' || token === '-h') {
			args.help = true;
		}
	}

	return args;
}

function printHelp() {
	console.log(`Usage:
  npm run import:obsidian -- /absolute/path/to/note.md --slug optional-post-slug

Options:
  --slug <slug>               Override the output slug and filename
  --attachments-dir <path>    Optional fallback directory for Obsidian attachments
  --overwrite                 Replace an existing imported post
  --help                      Show this message
`);
}

export async function runCli(argv = process.argv.slice(2)) {
	const args = parseCliArgs(argv);

	if (args.help || !args.notePath) {
		printHelp();
		return;
	}

	const result = await importObsidianPost(args);

	console.log(`Imported "${result.slug}" to ${result.outputPath}`);

	if (result.publicImageUrls.length > 0) {
		console.log(`Copied ${result.publicImageUrls.length} image file(s) into public/images/posts/${result.slug}/`);
	}

	if (result.missingFrontmatter.length > 0) {
		console.warn(`Missing recommended frontmatter fields: ${result.missingFrontmatter.join(', ')}`);
	}
}

const isDirectExecution =
	process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
	runCli().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
