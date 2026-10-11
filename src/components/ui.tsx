import type { ReactNode } from "react";

export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-text">{children}</p>;
}

export function Heading({ eyebrow, title, lead, align = "left" }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; align?: "left" | "center" }) {
  const center = align === "center";
  return (
    <div className={`flex flex-col gap-5 ${center ? "items-center text-center" : "items-start"}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-fg sm:text-4xl md:text-[2.75rem]">{title}</h2>
      {lead ? <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{lead}</p> : null}
    </div>
  );
}

export function Card({ children, className = "", accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 sm:p-7 ${accent ? "border-accent bg-accent text-white" : "border-border bg-surface"} ${className}`}>
      {children}
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary", className = "" }: { href: string; children: ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const styles = variant === "primary" ? "bg-accent text-white hover:bg-accent-hover" : "border border-border text-fg hover:border-faint hover:bg-surface";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}

/** A small check mark for list items. Inline so the site carries no icon dependency. */
export function Check({ onAccent = false }: { onAccent?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0">
      <circle cx="10" cy="10" r="9" className={onAccent ? "fill-white/20 stroke-white/50" : "fill-accent/15 stroke-accent/50"} strokeWidth="1" />
      <path d="M6 10.2l2.6 2.6L14 7.6" className={onAccent ? "stroke-white" : "stroke-accent-text"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
