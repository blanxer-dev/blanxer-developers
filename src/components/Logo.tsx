/**
 * The BlanxerAPI wordmark: written as a code tag, `<blanxer API>`, with API in bold purple.
 * Plain text in the mono face (not an image), so it stays sharp at every size.
 */
export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl sm:text-4xl" : size === "sm" ? "text-[15px]" : "text-lg";
  return (
    <span className={`inline-flex items-baseline font-mono tracking-tight whitespace-nowrap ${text} ${className}`}>
      <span className="text-faint">&lt;</span>
      <span className="font-medium text-fg">blanxer</span>
      <span className="font-extrabold text-accent-text">&nbsp;API</span>
      <span className="text-faint">&gt;</span>
    </span>
  );
}

/** The square mark for small places (favicon, app icon): `</>` on brand purple. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" fill="#883FFF" />
      <path d="M24 21 13 32l11 11M40 21l11 11-11 11M35.5 17.5l-7 29" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
