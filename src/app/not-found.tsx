import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-5 px-5 py-28 sm:px-8">
        <p className="font-mono text-sm text-accent-text">404</p>
        <h1 className="text-4xl font-semibold tracking-tight">This page isn&rsquo;t here.</h1>
        <p className="text-muted">
          Start at the <Link href="/api-docs/quickstart/" className="text-accent-text underline underline-offset-4">quickstart</Link>, or give your agent{" "}
          <a href="/llms.txt" className="font-mono text-accent-text underline underline-offset-4">llms.txt</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
