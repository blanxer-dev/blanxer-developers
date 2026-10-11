import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList, SiteFooter, SiteHeader } from "@/components/site";
import { JsonLd } from "@/components/ui";
import { PromptBox } from "@/components/PromptBox";
import { PaymentLogos } from "@/components/PaymentLogos";
import { agentHref, agentPages } from "@/lib/agents";
import { agents as agentIcons } from "@/lib/agent-icons";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ agent: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return agentPages.map((a) => ({ agent: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agent } = await params;
  const a = agentPages.find((x) => x.slug === agent);
  if (!a) return {};
  return {
    title: { absolute: `${a.metaTitle} | ${SITE_NAME}` },
    description: a.metaDescription,
    alternates: { canonical: agentHref(a.slug) },
    openGraph: { title: a.metaTitle, description: a.metaDescription, url: agentHref(a.slug), locale: "en_NP", images: ["/og.jpg"] },
    twitter: { card: "summary_large_image", title: a.metaTitle, description: a.metaDescription, images: ["/og.jpg"] },
  };
}

export default async function AgentPage({ params }: Props) {
  const { agent } = await params;
  const a = agentPages.find((x) => x.slug === agent);
  if (!a) notFound();
  const icon = agentIcons.find((i) => i.name === a.iconName);
  const url = `${SITE_URL}${agentHref(a.slug)}`;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: a.h1,
        description: a.metaDescription,
        url,
        tool: [{ "@type": "HowToTool", name: a.name }, { "@type": "HowToTool", name: "Blanxer" }, { "@type": "HowToTool", name: "Cloudflare" }],
        step: a.setup.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.code ? `${s.text} ${s.code}` : s.text })),
      },
      { "@type": "FAQPage", mainEntity: a.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: `Build with ${a.name}`, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <SiteHeader bar />
      <main className="flex-1">
        <section className="border-b border-border bg-surface/60">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <nav aria-label="Breadcrumb" className="font-mono text-xs text-faint">
                <Link href="/" className="hover:text-muted">blanxerapi</Link>
                <span className="mx-1.5">/</span>
                <span className="text-muted">build with {a.name.toLowerCase()}</span>
              </nav>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted">
                {icon ? (
                  <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill={a.slug === "claude-code" ? "#D97757" : "#141416"}>
                    <path d={icon.path} />
                  </svg>
                ) : null}
                {a.name} by {a.maker} · Blanxer
              </div>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">{a.h1}</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{a.lead}</p>
            </div>
            <div id="prompt" className="scroll-mt-24">
              <PromptBox />
              <p className="mt-3 text-center text-sm text-muted">Paste this into {a.name}.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight">How to do it with {a.name}</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-2">
            {a.setup.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border bg-surface p-6">
                <p className="font-mono text-sm text-faint">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.text}</p>
                {s.code ? (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-white px-4 py-3 font-mono text-[13px] text-fg">{s.code}</pre>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight">Made for selling in Nepal</h2>
            <p className="mt-3 max-w-2xl text-muted">
              {a.name} builds the look. Blanxer runs the shop: products, stock, orders, delivery with Nepali couriers, and payments customers already use.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-7">
              <PaymentLogos />
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-8">
              <FaqList faqs={a.faqs} />
            </div>
            <p className="mt-10 text-sm text-muted">
              Using another tool?{" "}
              {agentPages
                .filter((x) => x.slug !== a.slug)
                .map((x, i, list) => (
                  <span key={x.slug}>
                    <Link href={agentHref(x.slug)} className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                      Build with {x.name}
                    </Link>
                    {i < list.length - 1 ? " · " : ""}
                  </span>
                ))}
              {" · "}
              <Link href="/api-docs/quickstart/" className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg">
                Read the docs
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
