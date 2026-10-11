import { SiteHeader } from "@/components/site";
import { DocsMenuButton, DocsSidebar } from "@/components/docs/DocsNav";
import { Search } from "@/components/docs/Search";
import { docGroups, searchIndex } from "@/lib/docs";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const index = await searchIndex();
  const groups = docGroups.map((g) => ({ name: g.name, pages: g.pages.map(({ slug, nav }) => ({ slug, nav })) }));
  return (
    <>
      <SiteHeader wide>
        <DocsMenuButton groups={groups} />
      </SiteHeader>
      <div className="border-b border-border/70 bg-bg/80">
        <div className="mx-auto flex h-12 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
          <p className="font-mono text-xs text-faint">
            docs <span className="text-border">·</span> <span className="text-muted">build a Blanxer store website with an AI agent</span>
          </p>
          <Search index={index} />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-10 px-5 sm:px-8">
        <DocsSidebar groups={groups} />
        {children}
      </div>
    </>
  );
}
