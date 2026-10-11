"use client";

import { useState } from "react";
import { buildPrompt } from "@/lib/site";
import { CopyButton } from "./CopyButton";

/**
 * The copy-paste prompt. The visitor can type their store's subdomain and the prompt
 * fills it in; the copied text is exactly what the dashboard's BlanxerAPI page gives.
 */
export function PromptBox({ compact = false }: { compact?: boolean }) {
  const [sub, setSub] = useState("");
  const clean = sub.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.blanxer\.(io|com).*$/, "").replace(/[^a-z0-9-]/g, "");
  const prompt = buildPrompt(clean);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-[0_10px_40px_-18px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4da]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4da]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d4d4da]" />
        </div>
        <CopyButton
          value={prompt}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-xs font-medium text-white transition-colors hover:bg-black"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="7" y="7" width="10" height="10" rx="2" />
            <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          </svg>
          Copy prompt
        </CopyButton>
      </div>
      <pre className={`whitespace-pre-wrap break-words px-5 font-mono leading-relaxed text-fg ${compact ? "py-4 text-[13px]" : "py-4 text-[13px] sm:text-[13.5px]"}`}>
        {prompt}
        <span className="bx-caret ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-accent" aria-hidden />
      </pre>
      <label className="flex flex-wrap items-center gap-3 border-t border-border bg-surface/60 px-5 py-2.5 text-xs text-muted">
        <span>Your store</span>
        <span className="flex items-center rounded-lg border border-border bg-white font-mono focus-within:border-ink">
          <input
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            placeholder="mystore"
            spellCheck={false}
            autoCapitalize="off"
            className="w-28 bg-transparent px-2.5 py-1.5 text-fg outline-none placeholder:text-faint"
            aria-label="Your Blanxer store subdomain"
          />
          <span className="pr-2.5 text-faint">.blanxer.io</span>
        </span>
      </label>
    </div>
  );
}
