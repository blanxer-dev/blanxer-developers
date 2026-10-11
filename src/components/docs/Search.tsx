"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchEntry = { title: string; section: string; href: string; group: string };

/** ⌘K / Ctrl K search over every page title and heading. Runs in the browser; no service. */
export function Search({ index }: { index: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !open && !(e.target as HTMLElement).closest("input, textarea")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setAt(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return index.filter((e) => !e.section).slice(0, 14);
    return index
      .map((e) => {
        const hay = `${e.title} ${e.section}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = words.reduce((s, w) => s + (e.section.toLowerCase().startsWith(w) || e.title.toLowerCase().startsWith(w) ? 2 : 1), 0) - (e.section ? 0 : -1);
        return { e, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 20)
      .map((r) => r!.e);
  }, [q, index]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-sm text-faint hover:border-faint hover:text-muted">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13.2 13.2 3.3 3.3" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search docs</span>
        <kbd className="hidden rounded border border-border px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search docs">
          <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60">
            <input
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setAt(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setAt((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setAt((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && results[at]) go(results[at].href);
                else if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search: checkout, coupons, deploy, images…"
              className="w-full border-b border-border bg-transparent px-5 py-4 text-[15px] text-fg outline-none placeholder:text-faint"
            />
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length ? (
                results.map((r, i) => (
                  <li key={r.href}>
                    <button
                      type="button"
                      onMouseEnter={() => setAt(i)}
                      onClick={() => go(r.href)}
                      className={`block w-full rounded-lg px-3 py-2 text-left ${i === at ? "bg-accent/15" : ""}`}
                    >
                      <span className="block text-sm text-fg">{r.section || r.title}</span>
                      <span className="block text-xs text-faint">{r.section ? `${r.group} · ${r.title}` : r.group}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-6 text-center text-sm text-faint">Nothing found. Try another word.</li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
