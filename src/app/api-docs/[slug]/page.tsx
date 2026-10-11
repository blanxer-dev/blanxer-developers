import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocArticle } from "@/components/docs/DocArticle";
import { docHref, docMdHref, docPages, renderDoc } from "@/lib/docs";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return docPages.filter((p) => p.slug !== "index").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await renderDoc(slug);
  return {
    title: `${doc.title} · Docs`,
    description: doc.description,
    alternates: { canonical: docHref(slug), types: { "text/markdown": docMdHref(slug) } },
    openGraph: { title: `${doc.title} · BlanxerAPI docs`, description: doc.description, url: docHref(slug), type: "article", images: ["/og.jpg"] },
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const page = docPages.find((p) => p.slug === slug);
  if (!page || slug === "index") notFound();
  const doc = await renderDoc(slug);
  return <DocArticle doc={doc} group={page.group} />;
}
