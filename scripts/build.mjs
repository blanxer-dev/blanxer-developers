// Builds developers.blanxer.com into dist/.
//
//   node scripts/build.mjs
//
// - content/<name>.md  -> dist/<name>.html (served at /<name>) and dist/<name>.md (raw)
// - content/index.md   -> dist/index.html (home page)
// - every guide        -> dist/llms-full.txt (one file, sidebar order)
// - public/*           -> dist/ (llms.txt, openapi.yaml, style.css, _headers, ...)
//
// Fails on a broken link between guides, so a renamed page can't ship half-linked.

import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://developers.blanxer.com';

// Sidebar and llms-full.txt order. Every file in content/ must be listed here.
const GUIDES = [
  ['quickstart', 'Start here'],
  ['rules', 'Start here'],
  ['store-and-theme', 'Build'],
  ['catalog', 'Build'],
  ['checkout', 'Build'],
  ['forms-and-extras', 'Build'],
  ['seo-and-tracking', 'Build'],
  ['images-and-speed', 'Build'],
  ['package', 'Build'],
  ['mcp-for-website', 'Store data'],
  ['testing', 'Ship'],
  ['deploy-cloudflare', 'Ship'],
  ['troubleshooting', 'Ship'],
];

const read = (file) => fs.readFileSync(file, 'utf8');

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const titleOf = (md, fallback) => {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
};

// First paragraph after the H1, as plain text, for <meta name="description">.
const summaryOf = (md) => {
  const body = md.replace(/^#\s+.+$/m, '').trim();
  const para = body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith('#'));
  return (para || '')
    .replace(/^>\s?/gm, '')
    .replace(/[`*_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
};

// --- link handling ---------------------------------------------------------

const known = new Set(['index', ...GUIDES.map(([n]) => n)]);
const brokenLinks = [];

// Guides link to each other as https://developers.blanxer.com/<name>.md (best for
// agents reading the raw files). In HTML those become /<name>.
const rewriteHref = (href, from) => {
  const abs = href.startsWith(SITE) ? href.slice(SITE.length) : href;
  const m = abs.match(/^\/?([a-z0-9-]+)\.md(#.*)?$/);
  if (m) {
    if (!known.has(m[1])) brokenLinks.push(`${from}: ${href}`);
    return `/${m[1] === 'index' ? '' : m[1]}${m[2] || ''}`;
  }
  // other files on this site (llms.txt, openapi.yaml): keep them on the same host
  if (href.startsWith(SITE)) return abs || '/';
  return href;
};

const renderMarkdown = (md, from) => {
  const seen = new Map();
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    let id = slugify(text) || 'section';
    const n = seen.get(id) || 0;
    seen.set(id, n + 1);
    if (n) id = `${id}-${n}`;
    return `<h${depth} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${depth}>\n`;
  };
  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const out = rewriteHref(href, from);
    const external = /^https?:\/\//.test(out) && !out.startsWith(SITE);
    const t = title ? ` title="${escapeHtml(title)}"` : '';
    const rel = external ? ' rel="noopener"' : '';
    return `<a href="${escapeHtml(out)}"${t}${rel}>${text}</a>`;
  };
  return marked.parse(md, { renderer, gfm: true });
};

// --- page template ---------------------------------------------------------

const pages = []; // { name, title, group, md }

const sidebar = (current) => {
  const groups = [];
  for (const p of pages) {
    let g = groups.find((x) => x.name === p.group);
    if (!g) groups.push((g = { name: p.group, items: [] }));
    g.items.push(p);
  }
  const items = groups
    .map(
      (g) =>
        `<p class="nav-group">${escapeHtml(g.name)}</p><ul>` +
        g.items
          .map(
            (p) =>
              `<li><a href="/${p.name}"${p.name === current ? ' aria-current="page"' : ''}>${escapeHtml(p.title)}</a></li>`,
          )
          .join('') +
        '</ul>',
    )
    .join('');
  return `${items}<p class="nav-group">For agents</p><ul>
<li><a href="/llms.txt">llms.txt</a></li>
<li><a href="/llms-full.txt">llms-full.txt</a></li>
<li><a href="/openapi.yaml">openapi.yaml</a></li>
</ul>`;
};

const layout = ({ name, title, description, body, rawLink }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}${name === 'index' ? '' : ' · BlanxerAPI'}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${SITE}/${name === 'index' ? '' : name}">
${rawLink ? `<link rel="alternate" type="text/markdown" href="${rawLink}">` : ''}
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body>
<header class="top">
  <a class="brand" href="/">Blanxer <span>Developers</span></a>
  <nav class="top-links"><a href="/quickstart">Quickstart</a><a href="/llms.txt">llms.txt</a><a href="/openapi.yaml">OpenAPI</a></nav>
</header>
<div class="wrap">
<aside class="side"><details open><summary>Guides</summary>${sidebar(name)}</details></aside>
<main class="doc">
${body}
${rawLink ? `<p class="raw">This page as Markdown: <a href="${rawLink}">${SITE}${rawLink}</a></p>` : ''}
</main>
</div>
</body>
</html>
`;

// --- build -----------------------------------------------------------------

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.md'));
const unlisted = files
  .map((f) => f.replace(/\.md$/, ''))
  .filter((n) => n !== 'index' && !GUIDES.some(([g]) => g === n));
if (unlisted.length) {
  console.error(`Add these to GUIDES in scripts/build.mjs: ${unlisted.join(', ')}`);
  process.exit(1);
}

for (const [name, group] of GUIDES) {
  const file = path.join(CONTENT, `${name}.md`);
  if (!fs.existsSync(file)) {
    console.error(`Missing content/${name}.md (listed in GUIDES)`);
    process.exit(1);
  }
  const md = read(file);
  pages.push({ name, group, md, title: titleOf(md, name) });
}

for (const p of pages) {
  fs.writeFileSync(
    path.join(DIST, `${p.name}.html`),
    layout({
      name: p.name,
      title: p.title,
      description: summaryOf(p.md),
      body: renderMarkdown(p.md, `${p.name}.md`),
      rawLink: `/${p.name}.md`,
    }),
  );
  fs.writeFileSync(path.join(DIST, `${p.name}.md`), p.md);
}

// home page
const indexMd = read(path.join(CONTENT, 'index.md'));
fs.writeFileSync(
  path.join(DIST, 'index.html'),
  layout({
    name: 'index',
    title: titleOf(indexMd, 'BlanxerAPI'),
    description: summaryOf(indexMd),
    body: renderMarkdown(indexMd, 'index.md'),
    rawLink: '/index.md',
  }),
);
fs.writeFileSync(path.join(DIST, 'index.md'), indexMd);

// 404
fs.writeFileSync(
  path.join(DIST, '404.html'),
  layout({
    name: '404',
    title: 'Page not found',
    description: 'Page not found',
    body: '<h1>Page not found</h1><p>Start at <a href="/quickstart">the quickstart</a> or read <a href="/llms.txt">llms.txt</a>.</p>',
    rawLink: '',
  }),
);

// llms-full.txt: every guide, sidebar order, each under its source URL
const full = [
  '# BlanxerAPI: all guides in one file',
  '',
  `> Every guide from ${SITE}, concatenated. Index: ${SITE}/llms.txt. API spec: ${SITE}/openapi.yaml.`,
  '',
  ...pages.flatMap((p) => ['', '---', '', `<!-- source: ${SITE}/${p.name}.md -->`, '', p.md.trim(), '']),
].join('\n');
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), full + '\n');

// public/ as is
fs.cpSync(PUBLIC, DIST, { recursive: true });

if (brokenLinks.length) {
  console.error('Broken links between guides:\n  ' + brokenLinks.join('\n  '));
  process.exit(1);
}

// llms.txt must only link to pages that exist
const llms = read(path.join(PUBLIC, 'llms.txt'));
const llmsBroken = [...llms.matchAll(/\]\((https:\/\/developers\.blanxer\.com\/[^)]+)\)/g)]
  .map((m) => m[1].slice(SITE.length + 1))
  .filter((f) => !fs.existsSync(path.join(DIST, f)));
if (llmsBroken.length) {
  console.error('llms.txt links to files that are not built: ' + llmsBroken.join(', '));
  process.exit(1);
}

const size = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(1) + ' KB';
console.log(`Built ${pages.length} guides + home into dist/`);
console.log(`  llms.txt ${size('llms.txt')}, llms-full.txt ${size('llms-full.txt')}, openapi.yaml ${size('openapi.yaml')}`);
