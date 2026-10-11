/**
 * Site-wide facts for developers.blanxer.com. The landing page, the docs, the sitemap and the
 * structured data read from here.
 */

export const SITE_URL = "https://developers.blanxer.com";
export const SITE_NAME = "BlanxerAPI";
export const LEGAL_NAME = "Blanxer Technology Pvt. Ltd.";
export const GITHUB_ORG = "https://github.com/blanxer-dev";
export const DOCS_REPO = "https://github.com/blanxer-dev/blanxer-developers";
export const LLMS_URL = `${SITE_URL}/llms.txt`;
export const DASHBOARD_URL = "https://app.blanxer.com/dashboard/blanxer-api";

export const HOME_TITLE = "Build your ecommerce website with Claude Code, Codex or any AI agent";
export const HOME_DESCRIPTION =
  "Paste one prompt into Claude Code, Codex, Cursor or Gemini CLI. Your agent builds a custom Next.js store for your Blanxer shop and deploys it to your own Cloudflare account. Blanxer powers products, stock, checkout, payments and delivery.";

/** The one line a merchant pastes into their agent. The dashboard's BlanxerAPI page uses the same words. */
export const buildPrompt = (subdomain: string) =>
  `Build my Blanxer store website in Next.js and deploy it to my Cloudflare account.
Follow ${LLMS_URL}
My store is ${subdomain || "<your store subdomain>"}.`;

export type Faq = { q: string; a: string };

export const homeFaqs: Faq[] = [
  {
    q: "What is BlanxerAPI?",
    a: "BlanxerAPI lets an AI coding agent build a custom website for a Blanxer store. The agent writes a Next.js site with your design and deploys it to your own Cloudflare account. Blanxer keeps running the shop behind it: products, stock, orders, payments, delivery and SEO data.",
  },
  {
    q: "Which AI agents can build my site?",
    a: "Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Windsurf, Zed, Cline, or any agent that can run commands and read a web page. Claude Code can also install the Blanxer skill, which walks it through every step; other agents read the same steps from llms.txt.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. You paste one prompt and answer the agent's questions: what the site should look like, and a sign-in to your Cloudflare account when it is ready to go live. The agent reads these docs itself.",
  },
  {
    q: "How much does it cost?",
    a: "BlanxerAPI is included in every Blanxer plan. Cloudflare's free plan is enough for most stores. You pay for your AI agent's usage and your own domain, if you use one.",
  },
  {
    q: "Is the checkout the same as on my Blanxer store?",
    a: "Yes. The site uses Blanxer's checkout package, so delivery charges, Cash on Delivery per place, coupons, stock holds and every payment method you turned on (eSewa, Khalti, Fonepay and others) work exactly as on your Blanxer store. It shows a small \"Checkout Powered by Blanxer\" line.",
  },
  {
    q: "Where do I manage orders and products?",
    a: "In your Blanxer dashboard, as today. New orders from the website appear there, stock updates on the site by itself, and payment methods you turn on later show up without changing the code.",
  },
  {
    q: "Who owns the website?",
    a: "You do. The code is yours and it runs on your own Cloudflare account and your own domain. You can keep changing it with your agent at any time.",
  },
  {
    q: "Can customers log in on the custom site?",
    a: "Not yet. Custom sites use guest checkout. Customer login, rewards and member discounts stay on your Blanxer site.",
  },
];

/** What the agent builds vs what Blanxer runs, for the "Agents build it" section. */
export const agentBuilds = [
  "Your own design, pages and brand, not a template",
  "A fast Next.js site with optimised images",
  "SEO titles, structured data and a sitemap for your domain",
  "Deployed to your Cloudflare account and your domain",
];

export const blanxerPowers = [
  "Products, variants, categories and live stock",
  "Checkout, coupons and delivery charges per place",
  "eSewa, Khalti, Fonepay, cards and Cash on Delivery",
  "Orders, tracking, couriers and messages to customers",
  "Product feed for Facebook, Instagram and Google",
];

export const steps: { title: string; text: string; art: string }[] = [
  {
    title: "Paste the prompt",
    text: "Copy the prompt into Claude Code, Codex or your agent of choice, with your store's subdomain.",
    art: "/art/step1.webp",
  },
  {
    title: "Your agent builds it",
    text: "It asks how the site should look, builds it on Blanxer's checkout and tests an order. Sign in to Cloudflare when it asks.",
    art: "/art/step2.webp",
  },
  {
    title: "Blanxer runs the shop",
    text: "The site goes live on your domain. Orders, stock and payments keep working from your Blanxer dashboard.",
    art: "/art/step3.webp",
  },
];

export const devLinks: { title: string; text: string; href: string }[] = [
  { title: "llms.txt", text: "The index every agent starts from.", href: "/llms.txt" },
  { title: "Docs", text: "Quickstart, checkout, SEO, deploy and the 13 rules.", href: "/api-docs/" },
  { title: "@blanxer-dev/storefront", text: "The npm package: data, checkout, SEO and image loader.", href: "https://www.npmjs.com/package/@blanxer-dev/storefront" },
  { title: "Starter", text: "The Next.js starter the agent clones.", href: "https://github.com/blanxer-dev/blanxer-storefront-starter" },
  { title: "Agent skill", text: "The Claude Code plugin with the Blanxer MCP.", href: "https://github.com/blanxer-dev/blanxer-agent-skills" },
  { title: "OpenAPI", text: "Every public endpoint a site uses.", href: "/openapi.yaml" },
];
