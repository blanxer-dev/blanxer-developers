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
