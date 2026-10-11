"use client";

import { useEffect } from "react";

/** Wires the Copy buttons the Markdown renderer puts on every code block. */
export function CodeCopy() {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-code]");
      if (!btn) return;
      const code = btn.closest(".code")?.querySelector("pre")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code.replace(/\n$/, ""));
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1600);
      } catch {
        /* clipboard blocked */
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
