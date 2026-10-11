import type { Metadata } from "next";
import { DocArticle } from "@/components/docs/DocArticle";
import { renderDoc } from "@/lib/docs";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await renderDoc("index");
  return {
    title: "Docs: build a Blanxer store website with an AI agent",
    description: doc.description,
    alternates: { canonical: "/api-docs/", types: { "text/markdown": "/api-docs/index.md" } },
    openGraph: { title: "BlanxerAPI docs", description: doc.description, url: "/api-docs/", images: ["/og.jpg"] },
  };
}

export default async function DocsHome() {
  const doc = await renderDoc("index");
  return <DocArticle doc={doc} group="Start here" />;
}
