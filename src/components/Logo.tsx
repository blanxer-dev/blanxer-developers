import Image from "next/image";

/**
 * The main Blanxer logo, the same as blanxer.com's nav, with "API" beside it in the mono face
 * (owner, 2026-11-06). Replaces the old `<blanxer API>` text wordmark in the nav.
 */
export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const h = size === "lg" ? "h-9 sm:h-10" : size === "sm" ? "h-5" : "h-6 sm:h-7";
  const label = size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-[13px]" : "text-[15px]";
  return (
    <span className={`inline-flex items-center whitespace-nowrap ${className}`}>
      <Image src="/brand/logo-dark.svg" alt="Blanxer" width={408} height={113} priority className={`w-auto ${h}`} />
      <span className={`ml-2.5 border-l border-border pl-2.5 font-mono font-bold tracking-tight text-accent-text ${label}`}>API</span>
    </span>
  );
}
