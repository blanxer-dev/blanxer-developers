// Prepares the files agents read, before `next build` / `next dev`.
//
//   node scripts/content.mjs
//
// - content/<slug>.md -> public/api-docs/<slug>.md (raw Markdown, what agents fetch)
// - every page, sidebar order -> public/llms-full.txt
// - checks: every content file is in content/guides.json, every link between guides
//   points at a real page, and every link in public/llms.txt points at a built file.
//
// The HTML pages are rendered by Next.js from the same content/ files (src/lib/docs.ts).
// The generated files are gitignored; content/ is the only copy to edit.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const OUT_MD = path.join(PUBLIC, 'api-docs');
const SITE = 'https://developers.blanxer.com';

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const { groups } = JSON.parse(fs.readFileSync(path.join(CONTENT, 'guides.json'), 'utf8'));
const pages = groups.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.name })));
const slugs = new Set(pages.map((p) => p.slug));

const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const unlisted = files.filter((s) => !slugs.has(s));
if (unlisted.length) fail(`Add these to content/guides.json: ${unlisted.join(', ')}`);
const missing = [...slugs].filter((s) => !files.includes(s));
if (missing.length) fail(`Listed in content/guides.json but missing in content/: ${missing.join(', ')}`);

// Links between guides are absolute (https://developers.blanxer.com/api-docs/<slug>.md#anchor)
// so they work when an agent reads the raw file. Anything else on this host must exist too.
const ROOT_FILES = new Set(['llms.txt', 'llms-full.txt', 'openapi.yaml', '']);
const broken = [];
for (const p of pages) {
  const md = fs.readFileSync(path.join(CONTENT, `${p.slug}.md`), 'utf8');
  for (const [, href] of md.matchAll(/\]\((https:\/\/developers\.blanxer\.com[^)\s]*)\)/g)) {
    const rest = href.slice(SITE.length).replace(/^\//, '').split('#')[0];
    const m = rest.match(/^api-docs\/([a-z0-9-]+)\.md$/);
    if (m ? !slugs.has(m[1]) : !ROOT_FILES.has(rest)) broken.push(`${p.slug}.md -> ${href}`);
  }
  for (const [, href] of md.matchAll(/\]\((\/[^)\s]*|[a-z0-9-]+\.md[^)\s]*)\)/g)) {
    broken.push(`${p.slug}.md -> ${href} (use the full https://developers.blanxer.com/api-docs/<slug>.md link)`);
  }
}
if (broken.length) fail('Broken links between guides:\n  ' + broken.join('\n  '));

fs.rmSync(OUT_MD, { recursive: true, force: true });
fs.mkdirSync(OUT_MD, { recursive: true });
for (const p of pages) fs.copyFileSync(path.join(CONTENT, `${p.slug}.md`), path.join(OUT_MD, `${p.slug}.md`));

const full = [
  '# BlanxerAPI: all guides in one file',
  '',
  `> Every page of ${SITE}/api-docs, concatenated in sidebar order. Index: ${SITE}/llms.txt. API spec: ${SITE}/openapi.yaml.`,
  '',
  ...pages.flatMap((p) => [
    '',
    '---',
    '',
    `<!-- source: ${SITE}/api-docs/${p.slug}.md -->`,
    '',
    fs.readFileSync(path.join(CONTENT, `${p.slug}.md`), 'utf8').trim(),
    '',
  ]),
].join('\n');
fs.writeFileSync(path.join(PUBLIC, 'llms-full.txt'), full + '\n');

const llms = fs.readFileSync(path.join(PUBLIC, 'llms.txt'), 'utf8');
const llmsBroken = [...llms.matchAll(/https:\/\/developers\.blanxer\.com\/([^)\s"'`]+)/g)]
  .map((m) => m[1].replace(/[.,:;]+$/, '').split('#')[0])
  .filter((f) => !fs.existsSync(path.join(PUBLIC, f)));
if (llmsBroken.length) fail('public/llms.txt links to files that are not built: ' + [...new Set(llmsBroken)].join(', '));

const kb = (f) => (fs.statSync(path.join(PUBLIC, f)).size / 1024).toFixed(1) + ' KB';
console.log(`content: ${pages.length} pages -> public/api-docs/*.md; llms.txt ${kb('llms.txt')}, llms-full.txt ${kb('llms-full.txt')}`);
