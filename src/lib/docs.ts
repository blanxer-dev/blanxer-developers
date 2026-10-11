/**
 * The docs pages, read from content/ at build time. content/<slug>.md is the only copy:
 * scripts/content.mjs publishes the same file raw at /api-docs/<slug>.md for agents, and
 * this module renders it to HTML for people.
 */
import fs from "node:fs";
import path from "node:path";
import { Marked, Renderer } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import guides from "../../content/guides.json";
import { SITE_URL } from "./site";

const CONTENT = path.join(process.cwd(), "content");

export type DocPage = { slug: string; nav: string; group: string };
export type TocItem = { id: string; text: string; depth: 2 | 3 };

export const docPages: DocPage[] = guides.groups.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.name })));
export const docGroups = guides.groups.map((g) => ({
  name: g.name,
  pages: g.pages.map((p) => ({ ...p, group: g.name })),
}));

/** `/api-docs/` for the overview, `/api-docs/<slug>/` for the rest. */
export const docHref = (slug: string) => (slug === "index" ? "/api-docs/" : `/api-docs/${slug}/`);
/** The raw Markdown an agent reads. */
export const docMdHref = (slug: string) => `/api-docs/${slug}.md`;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;|&#\d+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const LANGS = ["bash", "html", "http", "json", "jsonc", "toml", "ts", "tsx", "yaml"];
let highlighter: Promise<Highlighter> | null = null;
const getHighlighter = () =>
  (highlighter ??= createHighlighter({ themes: ["github-dark-default"], langs: LANGS }));

/**
 * Guides link to each other as https://developers.blanxer.com/api-docs/<slug>.md (right for
 * agents reading the raw file). On the HTML page those become /api-docs/<slug>/.
 */
const rewriteHref = (href: string) => {
  if (!href.startsWith(SITE_URL)) return href;
  const rest = href.slice(SITE_URL.length) || "/";
  const m = rest.match(/^\/api-docs\/([a-z0-9-]+)\.md(#.*)?$/);
  return m ? docHref(m[1]) + (m[2] || "") : rest;
};

export type RenderedDoc = {
  slug: string;
  title: string;
  description: string;
  html: string;
  toc: TocItem[];
  markdown: string;
};

export async function renderDoc(slug: string): Promise<RenderedDoc> {
  const markdown = fs.readFileSync(path.join(CONTENT, `${slug}.md`), "utf8");
  const hl = await getHighlighter();
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  let title = slug;

  const renderer = new Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const inner = this.parser.parseInline(tokens);
    if (depth === 1) {
      title = plain(inner);
      return `<h1>${inner}</h1>\n`;
    }
    let id = slugify(inner) || "section";
    const n = seen.get(id) || 0;
    seen.set(id, n + 1);
    if (n) id = `${id}-${n}`;
    if (depth === 2 || depth === 3) toc.push({ id, text: plain(inner), depth });
    return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${depth}>\n`;
  };
  renderer.link = function ({ href, title: t, tokens }) {
    const inner = this.parser.parseInline(tokens);
    const out = rewriteHref(href);
    const external = /^https?:\/\//.test(out);
    return `<a href="${escapeHtml(out)}"${t ? ` title="${escapeHtml(t)}"` : ""}${external ? ' rel="noopener" target="_blank"' : ""}>${inner}</a>`;
  };
  renderer.code = function ({ text, lang }) {
    const language = (lang || "").split(/\s/)[0];
    const known = LANGS.includes(language);
    const body = known
      ? hl.codeToHtml(text, { lang: language, theme: "github-dark-default" })
      : `<pre><code>${escapeHtml(text)}</code></pre>`;
    return `<div class="code"><div class="code-head"><span>${escapeHtml(language || "text")}</span><button type="button" class="copy-code" data-copy-code>Copy</button></div>${body}</div>\n`;
  };
  renderer.table = function (token) {
    return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>`;
  };

  const html = await new Marked({ gfm: true, renderer }).parse(markdown);

  // First paragraph after the H1, as plain text, for <meta name="description">.
  const para = markdown
    .replace(/^#\s+.+$/m, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("```"));
  const description = (para || "")
    .replace(/^>\s?/gm, "")
    .replace(/[`*_]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return { slug, title, description, html, toc, markdown };
}

export const neighbours = (slug: string) => {
  const i = docPages.findIndex((p) => p.slug === slug);
  return { prev: i > 0 ? docPages[i - 1] : null, next: i >= 0 && i < docPages.length - 1 ? docPages[i + 1] : null };
};

/** Titles and headings of every page, for the search box. */
export async function searchIndex() {
  const out: { title: string; section: string; href: string; group: string }[] = [];
  for (const p of docPages) {
    const doc = await renderDoc(p.slug);
    out.push({ title: doc.title, section: "", href: docHref(p.slug), group: p.group });
    for (const h of doc.toc) out.push({ title: doc.title, section: h.text, href: `${docHref(p.slug)}#${h.id}`, group: p.group });
  }
  return out;
}
