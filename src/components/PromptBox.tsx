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
  const [first, second, third] = prompt.split("\n");

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface/90 text-left shadow-[0_0_80px_-20px_rgba(136,63,255,0.45)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a46]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a46]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a46]" />
        </div>
        <p className="hidden font-mono text-xs text-faint sm:block">paste into your AI agent</p>
        <CopyButton
          value={prompt}
          className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-accent px-4 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Copy prompt
        </CopyButton>
      </div>
      <pre className={`whitespace-pre-wrap break-words px-5 font-mono leading-relaxed text-fg ${compact ? "py-4 text-[13px]" : "py-5 text-[13.5px] sm:text-sm"}`}>
        <span className="select-none text-accent-text">&gt; </span>
        {first}
        {"\n"}
        {second}
        {"\n"}
        {third}
        <span className="bx-caret ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-accent-text" aria-hidden />
      </pre>
      <label className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3 text-xs text-muted">
        <span>Your store</span>
        <span className="flex items-center rounded-lg border border-border bg-bg font-mono focus-within:border-accent">
          <input
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            placeholder="mystore"
            spellCheck={false}
            autoCapitalize="off"
            className="w-32 bg-transparent px-2.5 py-1.5 text-fg outline-none placeholder:text-faint"
            aria-label="Your Blanxer store subdomain"
          />
          <span className="pr-2.5 text-faint">.blanxer.io</span>
        </span>
      </label>
    </div>
  );
}
