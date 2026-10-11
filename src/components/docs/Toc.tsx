"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string; depth: 2 | 3 };

/** "On this page", highlighting the section being read. */
export function Toc({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      let cur = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top < 120) cur = el.id;
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);
  if (!items.length) return null;
  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">On this page</p>
      <ul className="flex flex-col gap-1.5 border-l border-border">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`-ml-px block border-l py-0.5 leading-snug transition-colors ${i.depth === 3 ? "pl-6" : "pl-3"} ${active === i.id ? "border-accent-text text-fg" : "border-transparent text-muted hover:text-fg"}`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
