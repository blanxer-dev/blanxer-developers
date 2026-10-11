"use client";

import { useEffect, useState } from "react";

/**
 * A short, looping picture of what happens after the prompt is pasted: the agent reads the
 * docs, finds the store, asks about the design, builds, tests and deploys. Illustrative only.
 */
const lines: { kind: "you" | "step" | "ask" | "done"; text: string }[] = [
  { kind: "you", text: "Build my Blanxer store website… My store is shop.blanxer.io." },
  { kind: "step", text: "Reading developers.blanxer.com/llms.txt" },
  { kind: "step", text: "Found shop.blanxer.io · 48 products · eSewa, Khalti, COD" },
  { kind: "ask", text: "How should it feel? → “Clean and premium, white”" },
  { kind: "step", text: "Building home, collections, product and checkout" },
  { kind: "step", text: "Optimising 96 images · Lighthouse 97" },
  { kind: "step", text: "Test order placed and checked" },
  { kind: "step", text: "Signed in to your Cloudflare · deploying" },
  { kind: "done", text: "Live at https://shop.com.np" },
];

export function AgentDemo() {
  const [shown, setShown] = useState(lines.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(1);
    let n = 1;
    const t = setInterval(() => {
      n = n >= lines.length + 3 ? 1 : n + 1; // hold the finished run for a moment, then replay
      setShown(Math.min(n, lines.length));
    }, 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#141416]/90 text-left font-mono text-[12.5px] leading-relaxed text-[#d8d8de] shadow-[0_10px_40px_-18px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[11px] text-[#8b8b95]">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a40]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a40]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a40]" />
        </span>
        <span>your agent</span>
      </div>
      <ol className="min-h-[11rem] flex-1 space-y-1.5 px-4 py-4" aria-label="What your agent does">
        {lines.map((l, i) => (
          <li
            key={l.text}
            className={`flex gap-2 transition-all duration-500 ${i < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
          >
            <span className={`shrink-0 ${l.kind === "you" ? "text-[#b78cff]" : l.kind === "done" ? "text-[#4ade80]" : l.kind === "ask" ? "text-[#facc15]" : "text-[#8b8b95]"}`}>
              {l.kind === "you" ? ">" : l.kind === "done" ? "✓" : l.kind === "ask" ? "?" : "●"}
            </span>
            <span className={`min-w-0 break-words ${l.kind === "done" || l.kind === "you" ? "text-white" : ""}`}>{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
