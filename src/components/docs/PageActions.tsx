"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Per-page actions, like the ones on modern docs sites: copy the page as Markdown (for pasting
 * into an AI chat), open the raw .md, or open it in Claude / ChatGPT with the link attached.
 */
export function PageActions({ markdown, mdUrl, title }: { markdown: string; mdUrl: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked */
    }
    setOpen(false);
  };

  const ask = `Read ${mdUrl} (BlanxerAPI docs: "${title}") and help me with my Blanxer store website.`;
  const items: { label: string; hint: string; onClick?: () => void; href?: string }[] = [
    { label: "Copy page", hint: "As Markdown, for any AI chat", onClick: () => copy(markdown, "page") },
    { label: "View as Markdown", hint: "The raw file agents read", href: mdUrl },
    { label: "Open in Claude", hint: "Ask about this page", href: `https://claude.ai/new?q=${encodeURIComponent(ask)}` },
    { label: "Open in ChatGPT", hint: "Ask about this page", href: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(ask)}` },
    { label: "Copy link to llms.txt", hint: "Give your agent every page", onClick: () => copy("https://developers.blanxer.com/llms.txt", "llms") },
  ];

  return (
    <div ref={box} className="relative inline-flex">
      <div className="inline-flex overflow-hidden rounded-full border border-border bg-white text-[13px]">
        <button type="button" onClick={() => copy(markdown, "page")} className="inline-flex h-8 items-center gap-2 px-3 text-fg hover:bg-surface-2">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="7" y="7" width="10" height="10" rx="2" />
            <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          </svg>
          {copied === "page" ? "Copied" : copied === "llms" ? "Link copied" : "Copy page"}
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="More page actions" className="inline-flex h-8 w-8 items-center justify-center border-l border-border text-muted hover:bg-surface-2 hover:text-fg">
          <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>
      </div>
      {open ? (
        <div role="menu" className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-xl shadow-black/10">
          {items.map((it) => {
            const body = (
              <>
                <span className="block text-[13px] text-fg">{it.label}</span>
                <span className="block text-xs text-faint">{it.hint}</span>
              </>
            );
            const cls = "block w-full rounded-lg px-3 py-2 text-left hover:bg-surface-2";
            return it.href ? (
              <a key={it.label} role="menuitem" href={it.href} target="_blank" rel="noopener" className={cls} onClick={() => setOpen(false)}>
                {body}
              </a>
            ) : (
              <button key={it.label} role="menuitem" type="button" className={cls} onClick={it.onClick}>
                {body}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
