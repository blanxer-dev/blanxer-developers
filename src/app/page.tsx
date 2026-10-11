import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink, Card, Check, Eyebrow, Heading, JsonLd, Section } from "@/components/ui";
import { FaqList, SiteFooter, SiteHeader } from "@/components/site";
import { PromptBox } from "@/components/PromptBox";
import { agents } from "@/lib/agent-icons";
import { agentBuilds, blanxerPowers, DASHBOARD_URL, devLinks, HOME_DESCRIPTION, homeFaqs, LEGAL_NAME, SITE_NAME, SITE_URL, steps } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const features: { title: string; text: string }[] = [
  { title: "The same checkout as Blanxer", text: "Delivery charges per place, Cash on Delivery rules, coupons, stock holds and every payment method you turned on. Nothing to rebuild, nothing to get wrong." },
  { title: "SEO from day one", text: "Titles, descriptions and product structured data on every page. Blanxer serves the sitemap and product feed for your own domain." },
  { title: "Fast on a phone", text: "Next.js on Cloudflare's network, images resized to AVIF and WebP, at most two fonts. The agent checks for a Lighthouse score of 90 or more." },
  { title: "Your code, your Cloudflare", text: "The site runs on your own Cloudflare account and domain. The code is yours to keep changing with your agent." },
  { title: "Store edits through the MCP", text: "While it builds, the agent can write product SEO, add photos, categories and coupons through the Blanxer MCP. You sign in; it never sees a password or key." },
  { title: "Linked to your dashboard", text: "Save the site's address in Blanxer and order tracking links, delivery emails and flash-sale alerts point to your new website." },
];

const payments = ["Cash on Delivery", "eSewa", "Khalti", "Fonepay", "Fonepay QR", "Checkout by Fonepay", "Blanxer QR", "NPX", "Nabil card"];

const softwareLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://blanxer.com/#org",
      name: "Blanxer",
      legalName: LEGAL_NAME,
      url: "https://blanxer.com",
      logo: `${SITE_URL}/apple-touch-icon.png`,
    },
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
    {
      "@type": "HowTo",
      name: "Build an ecommerce website with an AI agent on Blanxer",
      step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })),
    },
    {
      "@type": "FAQPage",
      mainEntity: homeFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <JsonLd data={softwareLd} />
      <SiteHeader />

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%]"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 50% 108%, rgba(136, 63, 255, 0.55) 0%, rgba(136, 63, 255, 0.24) 32%, rgba(136, 63, 255, 0.06) 58%, transparent 78%)",
            }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(183,140,255,0.7) 50%, transparent)" }} />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <div className="flex flex-col items-start gap-7">
              <Eyebrow>BlanxerAPI · for Claude Code, Codex and every AI agent</Eyebrow>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Your AI agent builds the store. <span className="text-accent-text">Blanxer powers it.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                Paste one prompt into Claude Code, Codex, Cursor or Gemini CLI. Your agent builds a custom Next.js ecommerce website for your Blanxer store and puts it
                live on your own Cloudflare account. Products, stock, checkout, payments and delivery keep running on Blanxer.
              </p>
              <div id="prompt" className="w-full max-w-xl scroll-mt-24">
                <PromptBox />
              </div>
              <p className="text-sm text-faint">
                No code to write. Included in every Blanxer plan.{" "}
                <Link href="/api-docs/" className="text-muted underline decoration-border underline-offset-4 hover:text-fg">
                  Read the docs
                </Link>
              </p>
            </div>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <Image src="/art/hero.webp" alt="A glass browser window showing an online store, with a code tag and a shopping bag" width={1100} height={758} priority className="bx-float h-auto w-full select-none" />
            </div>
          </div>
        </section>

        {/* Works with */}
        <div className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
            <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">Works with the agent you already use</p>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-9 gap-y-5">
              {agents.map((a) => (
                <li key={a.name} className="flex items-center gap-2.5 text-muted">
                  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
                    <path d={a.path} />
                  </svg>
                  <span className="text-sm font-medium">{a.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How it works */}
        <Section id="how">
          <Heading eyebrow="How it works" title="One prompt. A live store on your own domain." lead="You talk to your agent the way you would talk to a developer. It reads the BlanxerAPI docs by itself and asks you only what it needs." />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-7">
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at ${["100% 0%", "100% 100%", "0% 100%"][i]}, rgba(136,63,255,0.42) 0%, rgba(136,63,255,0.12) 34%, transparent 62%)` }} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-sm text-accent-text">0{i + 1}</span>
                    <Image src={s.art} alt="" width={480} height={480} className="h-24 w-auto select-none sm:h-28" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Agents build, Blanxer powers */}
        <Section id="powered" className="border-t border-border">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <Heading
                eyebrow="Custom front, proven engine"
                title={
                  <>
                    Agents build it. <span className="text-accent-text">Blanxer powers it.</span>
                  </>
                }
                lead="Your website looks like nobody else's. Behind it runs the same Blanxer that already handles your orders, so nothing about selling has to be rebuilt or trusted to new code."
              />
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
                  <p className="font-mono text-xs uppercase tracking-wide text-white/70">Blanxer powers</p>
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
            <Image src="/art/engine.webp" alt="A website layer floating above a commerce engine of gears, parcels and payments" width={800} height={798} className="mx-auto w-full max-w-sm select-none" />
          </div>
        </Section>

        {/* What every site gets */}
        <Section id="features" className="border-t border-border">
          <Heading eyebrow="What every site gets" title="Built right the first time." lead="The agent follows the same rules on every store, so the parts customers pay through are never improvised." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold">Payments that already work in Nepal</p>
              <p className="mt-1 text-sm text-muted">The methods you turn on in Blanxer show up on your site by themselves.</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {payments.map((p) => (
                <li key={p} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-fg">
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
              <Heading eyebrow="For developers" title="Open docs, an npm package, and an llms.txt." lead="Everything the agent reads is public, so you can read it too, build by hand, or point any other tool at it." />
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
                  <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="group block h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/60">
                    <p className="flex items-center justify-between gap-3 font-mono text-[15px] text-fg">
                      <span className="min-w-0 truncate">{l.title}</span>
                      <span aria-hidden className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text">→</span>
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
          <Heading eyebrow="FAQ" title="Questions merchants ask" />
          <div className="mt-10">
            <FaqList faqs={homeFaqs} />
          </div>
        </Section>

        {/* Closing */}
        <section className="relative overflow-hidden border-t border-border">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(136,63,255,0.35) 0%, rgba(136,63,255,0.08) 45%, transparent 75%)" }} />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-5 py-24 text-center sm:px-8">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Start your store website now.</h2>
            <p className="max-w-xl text-lg text-muted">Copy the prompt, paste it into your agent, and answer its questions. Signed in to Blanxer? The dashboard fills in your store for you.</p>
            <div className="w-full max-w-xl">
              <PromptBox compact />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={DASHBOARD_URL}>Open BlanxerAPI in your dashboard</ButtonLink>
              <ButtonLink href="/api-docs/quickstart/" variant="ghost">
                Read the quickstart
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

