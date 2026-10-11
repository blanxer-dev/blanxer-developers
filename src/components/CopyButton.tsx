"use client";

import { useState, type ReactNode } from "react";

/** Copies `value` and says so for a moment. `children` is the idle label. */
export function CopyButton({ value, children = "Copy", className = "" }: { value: string | (() => string); children?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof value === "function" ? value() : value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked (http, old browser): nothing to do */
        }
      }}
      className={className}
      aria-live="polite"
    >
      {copied ? "Copied" : children}
    </button>
  );
}
