"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Group = { name: string; pages: { slug: string; nav: string }[] };
const hrefOf = (slug: string) => (slug === "index" ? "/api-docs/" : `/api-docs/${slug}/`);

function NavList({ groups, onPick }: { groups: Group[]; onPick?: () => void }) {
  const path = usePathname();
  const here = (slug: string) => path === hrefOf(slug) || path === hrefOf(slug).replace(/\/$/, "");
  return (
    <nav aria-label="Docs" className="flex flex-col gap-7 text-sm">
      {groups.map((g) => (
        <div key={g.name}>
          <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{g.name}</p>
          <ul className="flex flex-col gap-0.5">
            {g.pages.map((p) => (
              <li key={p.slug}>
                <Link
                  href={hrefOf(p.slug)}
                  onClick={onPick}
                  aria-current={here(p.slug) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-1.5 transition-colors ${here(p.slug) ? "bg-surface-2 font-medium text-fg" : "text-muted hover:bg-surface hover:text-fg"}`}
                >
                  {p.nav}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">For agents</p>
        <ul className="flex flex-col gap-0.5 font-mono text-[13px]">
          {["llms.txt", "llms-full.txt", "openapi.yaml"].map((f) => (
            <li key={f}>
              <a href={`/${f}`} className="block rounded-lg px-3 py-1.5 text-muted hover:bg-surface hover:text-fg">
                {f}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Desktop: a sticky column. Phone: a menu button that opens the same list in a sheet. */
export function DocsSidebar({ groups }: { groups: Group[] }) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border py-8 pr-4 lg:block">
      <NavList groups={groups} />
    </aside>
  );
}

export function DocsMenuButton({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open docs menu" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-fg lg:hidden">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Docs menu">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/25" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs overflow-y-auto border-r border-border bg-bg px-3 py-6">
            <NavList groups={groups} onPick={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
