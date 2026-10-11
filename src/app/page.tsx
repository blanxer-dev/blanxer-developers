import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, Check, Heading, JsonLd, Section } from "@/components/ui";
import { FaqList, SiteFooter, SiteHeader } from "@/components/site";
import { PromptBox } from "@/components/PromptBox";
import { AgentDemo } from "@/components/AgentDemo";
import { AgentLogos } from "@/components/AgentLogos";
import { Logo } from "@/components/Logo";
import { agentBuilds, blanxerPowers, DASHBOARD_URL, devLinks, HOME_DESCRIPTION, homeFaqs, LEGAL_NAME, SITE_NAME, SITE_URL, steps } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const features: { title: string; text: string }[] = [
  { title: "Same checkout", text: "Payments, coupons and delivery work just like your Blanxer store." },
  { title: "Found on Google", text: "SEO is built in from the first page." },
  { title: "Yours to keep", text: "Your code, your Cloudflare, your domain." },
];

const payments = ["Cash on Delivery", "eSewa", "Khalti", "Fonepay", "Fonepay QR", "Checkout by Fonepay", "Blanxer QR", "NPX", "Nabil card"];

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://blanxer.com/#org", name: "Blanxer", legalName: LEGAL_NAME, url: "https://blanxer.com", logo: `${SITE_URL}/apple-touch-icon.png` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, publisher: { "@id": "https://blanxer.com/#org" } },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      description: HOME_DESCRIPTION,
      url: SITE_URL,
      offers: { "@type": "Offer", price: "0", priceCurrency: "NPR", description: "Included in every Blanxer plan" },
      publisher: { "@id": "https://blanxer.com/#org" },
    },
    { "@type": "HowTo", name: "Build an ecommerce website with an AI agent on Blanxer", step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })) },
    { "@type": "FAQPage", mainEntity: homeFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ],
};

/** Frosted glass over the silver scene, as on argent.swmansion.com. */
const glass = "rounded-[24px] border border-white/25 bg-[rgba(58,60,66,0.38)] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] backdrop-blur-2xl";

export default function Home() {
  return (
    <>
      <JsonLd data={ld} />

      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        {/* Hero: the silver scene, the floating nav, a glass card with the pitch, then the demo and the prompt. */}
        <section className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[28px] bg-[#a9adb4]">
          <Image src="/art/hero-scene.webp" alt="" fill priority sizes="(min-width: 1400px) 1400px, 100vw" className="select-none object-cover object-[50%_0%]" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#8e939b]/70" />

          <div className="relative pb-12 pt-3 sm:pb-16 sm:pt-4">
            <SiteHeader />

            <div className="mx-auto mt-[clamp(150px,25vw,340px)] w-full max-w-[880px] px-3">
              <div className={`${glass} px-6 py-10 text-center text-white sm:px-12 sm:py-14`}>
                <p className="flex items-center justify-center gap-2 text-sm text-white/80">
                  Powered by
                  <span className="rounded-md bg-white/90 px-2 py-0.5">
                    <Logo size="sm" />
                  </span>
                </p>
                <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-[3.4rem]">
                  Your AI agent builds the store. Blanxer powers it.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                  Paste one prompt. Your agent builds your store website and puts it online.
                </p>
              </div>

              <div id="prompt" className="mt-4 grid scroll-mt-24 gap-4 md:grid-cols-2">
                <div className={`${glass} min-w-0 p-4 sm:p-5`}>
                  <AgentDemo />
                </div>
                <div className={`${glass} order-first flex min-w-0 flex-col justify-center gap-4 p-4 sm:p-6 md:order-none`}>
                  <PromptBox compact />
                  <p className="text-center text-sm text-white/90">Paste this into your AI agent.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main id="top" className="flex-1">
        {/* Works with */}
        <section className="px-5 pb-6 pt-20 text-center sm:pt-24">
          <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Works with</h2>
          <div className="mt-10">
            <AgentLogos />
          </div>
                  </section>

        {/* How it works */}
        <Section id="how">
          <Heading eyebrow="How it works" title="Three steps. That's it." />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-3xl border border-border bg-surface p-6 sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm text-faint">0{i + 1}</span>
                  <Image src={s.art} alt="" width={420} height={420} className="h-24 w-auto select-none sm:h-28" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Agents build, Blanxer powers */}
        <Section id="powered" className="border-t border-border">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <Heading eyebrow="Agents build it. Blanxer powers it." title="You get the look. We handle the selling." />
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <Card>
                  <p className="font-mono text-xs uppercase tracking-wide text-faint">Your agent builds</p>
                  <ul className="mt-4 space-y-3 text-[15px] text-muted">
                    {agentBuilds.map((t) => (
                      <li key={t} className="flex gap-2.5">
                        <Check />
                        {t}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card accent>
                  <p className="font-mono text-xs uppercase tracking-wide text-white/60">Blanxer powers</p>
                  <ul className="mt-4 space-y-3 text-[15px]">
                    {blanxerPowers.map((t) => (
                      <li key={t} className="flex gap-2.5">
                        <Check onAccent />
                        {t}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
            <Image src="/art/engine.webp" alt="A website layer floating above a commerce engine of gears, parcels and payments" width={723} height={760} className="mx-auto w-full max-w-sm select-none" />
          </div>
        </Section>

        {/* What every site gets */}
        <Section id="features" className="border-t border-border">
          <Heading eyebrow="Every site gets" title="Done right from day one." />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="shrink-0 font-semibold">Payments that just work</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <li key={p} className="rounded-full border border-border bg-white px-3 py-1 text-sm text-fg">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Developers */}
        <Section id="developers" className="border-t border-border">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Heading eyebrow="For developers" title="Everything's open." lead="Read the docs, use the npm package, or build it by hand." />
              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface font-mono text-[13px]">
                <div className="border-b border-border px-4 py-2 text-xs text-faint">terminal</div>
                <pre className="overflow-x-auto px-4 py-4 leading-relaxed text-fg">
                  <span className="text-faint"># the starter, with the package already in it</span>
                  {"\n"}npx degit blanxer-dev/blanxer-storefront-starter my-store
                  {"\n"}
                  <span className="text-faint"># or add the package to your own Next.js app</span>
                  {"\n"}npm install <span className="text-accent-text">@blanxer-dev/storefront</span>
                </pre>
              </div>
            </div>
            <ul className="grid content-start gap-3 sm:grid-cols-2">
              {devLinks.map((l) => (
                <li key={l.title}>
                  <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="group block h-full rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/40 hover:bg-surface">
                    <p className="flex items-center justify-between gap-3 font-mono text-[15px] text-fg">
                      <span className="min-w-0 truncate">{l.title}</span>
                      <span aria-hidden className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg">→</span>
                    </p>
                    <p className="mt-1.5 text-sm text-muted">{l.text}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" className="border-t border-border">
          <Heading eyebrow="FAQ" title="Questions?" />
          <div className="mt-10">
            <FaqList faqs={homeFaqs} />
          </div>
        </Section>

        {/* Closing: the dark block, as on argent.swmansion.com */}
        <div className="px-3 pb-4 sm:px-4">
          <section className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[28px] bg-ink text-white">
            <Image src="/art/emblem.webp" alt="" width={1000} height={659} className="pointer-events-none absolute -bottom-20 -right-24 hidden w-[440px] max-w-none select-none opacity-30 lg:block" />
            <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-5 py-24 text-center sm:px-8">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready? Copy the prompt.</h2>
              <p className="max-w-xl text-lg text-white/70">Paste it into your agent and answer a few questions.</p>
              <div className="w-full max-w-xl">
                <PromptBox compact />
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={DASHBOARD_URL} className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-ink hover:bg-white/90">
                  Open in your dashboard
                </a>
                <Link href="/api-docs/quickstart/" className="inline-flex h-11 items-center rounded-full border border-white/25 px-6 text-sm font-medium text-white hover:bg-white/10">
                  Read the quickstart
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
