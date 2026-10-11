import Link from "next/link";
import { agents } from "@/lib/agent-icons";
import { agentHref, agentPages } from "@/lib/agents";

/** Brand colours where the mark has one; the rest are drawn in ink, as on argent.swmansion.com. */
const colour: Record<string, string> = {
  "Claude Code": "#D97757",
  "GitHub Copilot": "#111114",
};

/** The "Works with" row: agent marks with their names on hover (and for screen readers and crawlers). */
export function AgentLogos() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
      {agents.map((a) => (
        <li key={a.name} className="group relative flex flex-col items-center">
          <AgentLink name={a.name}>
          <svg viewBox="0 0 24 24" role="img" aria-label={a.name} className="h-8 w-8 transition-transform duration-200 group-hover:-translate-y-0.5">
            {a.name === "Gemini CLI" ? (
              <defs>
                <linearGradient id="bx-gemini" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4285F4" />
                  <stop offset="0.5" stopColor="#9B72CB" />
                  <stop offset="1" stopColor="#D96570" />
                </linearGradient>
              </defs>
            ) : null}
            <title>{a.name}</title>
            <path d={a.path} fill={a.name === "Gemini CLI" ? "url(#bx-gemini)" : colour[a.name] || "#141416"} />
          </svg>
          </AgentLink>
          <span className="pointer-events-none absolute top-full mt-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {a.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Marks that have a "Build with …" page link to it (Codex's mark goes to the Codex page). */
function AgentLink({ name, children }: { name: string; children: React.ReactNode }) {
  const page = agentPages.find((p) => p.iconName === name && p.slug !== "chatgpt");
  if (!page) return <>{children}</>;
  return (
    <Link href={agentHref(page.slug)} aria-label={`Build an ecommerce website with ${page.name}`}>
      {children}
    </Link>
  );
}
