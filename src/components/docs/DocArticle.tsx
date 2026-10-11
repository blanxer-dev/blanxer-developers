import Link from "next/link";
import { docHref, docMdHref, neighbours, type RenderedDoc } from "@/lib/docs";
import { DOCS_REPO, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/ui";
import { PageActions } from "./PageActions";
import { Toc } from "./Toc";
import { CodeCopy } from "./CodeCopy";

/** One docs page: breadcrumb + actions, the rendered Markdown, prev/next, and "On this page". */
export function DocArticle({ doc, group }: { doc: RenderedDoc; group: string }) {
  const { prev, next } = neighbours(doc.slug);
  const url = `${SITE_URL}${docHref(doc.slug)}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: doc.title,
        description: doc.description,
        url,
        inLanguage: "en",
        isPartOf: { "@type": "WebSite", name: "BlanxerAPI", url: SITE_URL },
        publisher: { "@type": "Organization", name: "Blanxer", url: "https://blanxer.com" },
        encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: `${SITE_URL}${docMdHref(doc.slug)}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "BlanxerAPI", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE_URL}/api-docs/` },
          ...(doc.slug === "index" ? [] : [{ "@type": "ListItem", position: 3, name: doc.title, item: url }]),
        ],
      },
    ],
  };

  return (
    <div className="flex min-w-0 flex-1 gap-10">
      <JsonLd data={ld} />
      <CodeCopy />
      <article className="min-w-0 flex-1 py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-faint">
            <Link href="/api-docs/" className="hover:text-muted">
              docs
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-muted">{group.toLowerCase()}</span>
          </nav>
          <PageActions markdown={doc.markdown} mdUrl={`${SITE_URL}${docMdHref(doc.slug)}`} title={doc.title} />
        </div>
        <div className="prose max-w-[760px]" dangerouslySetInnerHTML={{ __html: doc.html }} />

        <div className="mt-14 grid max-w-[760px] gap-3 border-t border-border pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={docHref(prev.slug)} className="group rounded-xl border border-border p-4 hover:border-accent/60">
              <span className="block text-xs text-faint">← Previous</span>
              <span className="mt-1 block text-[15px] text-fg group-hover:text-accent-text">{prev.nav}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={docHref(next.slug)} className="group rounded-xl border border-border p-4 text-right hover:border-accent/60">
              <span className="block text-xs text-faint">Next →</span>
              <span className="mt-1 block text-[15px] text-fg group-hover:text-accent-text">{next.nav}</span>
            </Link>
          ) : null}
        </div>
        <p className="mt-8 max-w-[760px] text-xs text-faint">
          Agents read this page at{" "}
          <a href={docMdHref(doc.slug)} className="font-mono text-muted hover:text-fg">
            {docMdHref(doc.slug)}
          </a>
          {" · "}
          <a href={`${DOCS_REPO}/edit/main/content/${doc.slug}.md`} target="_blank" rel="noopener" className="text-muted hover:text-fg">
            Edit on GitHub
          </a>
        </p>
      </article>
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto py-10 xl:block">
        <Toc items={doc.toc} />
      </aside>
    </div>
  );
}
