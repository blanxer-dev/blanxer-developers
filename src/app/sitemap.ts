import type { MetadataRoute } from "next";
import { docHref, docPages } from "@/lib/docs";
import { agentHref, agentPages } from "@/lib/agents";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...agentPages.map((a) => ({ url: `${SITE_URL}${agentHref(a.slug)}`, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...docPages.map((p) => ({ url: `${SITE_URL}${docHref(p.slug)}`, changeFrequency: "weekly" as const, priority: p.slug === "index" || p.slug === "quickstart" ? 0.9 : 0.7 })),
  ];
}
