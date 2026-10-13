import type { NextConfig } from "next";

/**
 * Static export for Cloudflare Pages (output in `out/`). `trailingSlash` writes every page as
 * `<path>/index.html`, so `/api-docs/quickstart/` opens on any static host, including a plain
 * local file server; Cloudflare Pages also answers `/api-docs/quickstart` without the slash.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
  /** Do not regenerate AGENTS.md / CLAUDE.md on every `next dev`. */
  agentRules: false,
  turbopack: { root: __dirname },
};

export default nextConfig;
