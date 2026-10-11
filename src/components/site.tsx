import Link from "next/link";
import { Logo } from "./Logo";
import { GITHUB_ORG, LEGAL_NAME, type Faq } from "@/lib/site";

const navLinks = (
  <>
    <Link href="/api-docs/" className="hidden hover:text-fg sm:inline">
      Docs
    </Link>
    <a href="/llms.txt" className="hidden font-mono text-[13px] hover:text-fg md:inline">
      llms.txt
    </a>
    <a href={GITHUB_ORG} target="_blank" rel="noopener" className="hidden hover:text-fg md:inline">
      GitHub
    </a>
  </>
);

const cta = (
  <Link href="/#prompt" className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-black">
    Get the prompt
  </Link>
);

/**
 * Landing page: a floating frosted pill over the hero (after argent.swmansion.com).
 * Docs (`bar`): a plain full-width bar, with the docs menu button passed as children.
 */
export function SiteHeader({ bar = false, children }: { bar?: boolean; children?: React.ReactNode }) {
  if (bar) {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            {children}
            <Link href="/" aria-label="BlanxerAPI home" className="flex items-center">
              <Logo />
            </Link>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-2 text-sm text-muted sm:gap-6">
            {navLinks}
            {cta}
          </nav>
        </div>
      </header>
    );
  }
  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4">
      <div className="mx-auto flex h-14 w-full max-w-[880px] items-center justify-between gap-4 rounded-full border border-white/60 bg-white/55 pl-5 pr-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <Link href="/" aria-label="BlanxerAPI home" className="flex items-center">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2 text-sm text-muted sm:gap-6">
          {navLinks}
          {cta}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">Custom store websites built by AI agents. Powered by Blanxer.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Build</p>
            <Link href="/api-docs/quickstart/" className="text-muted hover:text-fg">Quickstart</Link>
            <Link href="/api-docs/checkout/" className="text-muted hover:text-fg">Checkout</Link>
            <Link href="/api-docs/deploy-cloudflare/" className="text-muted hover:text-fg">Deploy</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">For agents</p>
            <a href="/llms.txt" className="font-mono text-[13px] text-muted hover:text-fg">llms.txt</a>
            <a href="/llms-full.txt" className="font-mono text-[13px] text-muted hover:text-fg">llms-full.txt</a>
            <a href="/openapi.yaml" className="font-mono text-[13px] text-muted hover:text-fg">openapi.yaml</a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Blanxer</p>
            <a href="https://blanxer.com" className="text-muted hover:text-fg">blanxer.com</a>
            <a href="https://enterprise.blanxer.com" className="text-muted hover:text-fg">Enterprise</a>
            <a href={GITHUB_ORG} target="_blank" rel="noopener" className="text-muted hover:text-fg">GitHub</a>
          </div>
        </div>
      </div>
      <p className="mx-auto w-full max-w-6xl px-5 pb-10 text-xs text-faint sm:px-8">
        &copy; {new Date().getFullYear()} {LEGAL_NAME} Kathmandu, Nepal.
      </p>
    </footer>
  );
}

/** Native disclosure, so every answer is in the HTML for crawlers and works without JS. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {faqs.map((f) => (
        <details key={f.q} className="group px-5 py-4 sm:px-7 sm:py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-fg [&::-webkit-details-marker]:hidden">
            <h3>{f.q}</h3>
            <span aria-hidden className="text-xl leading-none text-accent-text transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
