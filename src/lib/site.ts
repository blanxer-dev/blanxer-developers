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

export const HOME_TITLE = "Build an Ecommerce Website in Nepal with Claude, ChatGPT or Gemini";
export const HOME_DESCRIPTION =
  "Build your online store in Nepal with AI. Paste one prompt into Claude, ChatGPT or Gemini and get a fast website with eSewa, Khalti and COD, powered by Blanxer.";

/** The one line a merchant pastes into their agent. The dashboard's BlanxerAPI page uses the same words. */
export const buildPrompt = (subdomain: string) =>
  `Build my Blanxer store website in Next.js and deploy it to my Cloudflare account.
Follow ${LLMS_URL}
My store is ${subdomain ? `${subdomain}.blanxer.io` : "<your-store>.blanxer.io"}.`;

export type Faq = { q: string; a: string };

export const homeFaqs: Faq[] = [
  {
    q: "How do I make an ecommerce website in Nepal with AI?",
    a: "Open an AI coding agent such as Claude Code, Codex (with your ChatGPT account) or Gemini CLI in an empty folder and paste the prompt above. It builds your store website, connects it to Blanxer and puts it online on your own Cloudflare account.",
  },
  {
    q: "Does it work with eSewa, Khalti and Cash on Delivery?",
    a: "Yes. The checkout is Blanxer's own, so eSewa, Khalti, Fonepay, NPX, cards and Cash on Delivery work as on your Blanxer store, with delivery through Pathao, Nepal Can Move, Dash and other couriers.",
  },
  {
    q: "What is BlanxerAPI?",
    a: "A way to get your own custom website without hiring a developer. Your AI agent builds it, and Blanxer keeps running your shop behind it.",
  },
  {
    q: "Do I need to code?",
    a: "No. Paste the prompt, tell the agent how you want the site to look, and sign in to Cloudflare when it asks. That's it.",
  },
  {
    q: "Can I use ChatGPT, Claude or Gemini?",
    a: "Yes: Claude Code, Codex (signs in with ChatGPT), Gemini CLI, Cursor, GitHub Copilot, Windsurf, Zed, Cline, or any agent that can run commands and read a web page.",
  },
  {
    q: "What does it cost?",
    a: "Nothing extra. It's included in every Blanxer plan, and Cloudflare's free plan is enough for most stores. You only pay for your AI agent and your domain (.com.np is free for Nepali businesses).",
  },
  {
    q: "Where do I see my orders?",
    a: "In your Blanxer dashboard, same as today. Products, stock and payments all stay there too.",
  },
  {
    q: "Can customers log in?",
    a: "Not yet. Shoppers check out as guests. Login and rewards stay on your Blanxer site.",
  },
];

/** What the agent builds vs what Blanxer runs, for the "Agents build it" section. */
export const agentBuilds = ["Your own design", "Fast pages, sharp photos", "Your own domain"];

export const blanxerPowers = ["Products and stock", "Checkout and payments", "Orders and delivery", "Feeds for Facebook and Google"];

export const steps: { title: string; text: string; art: string }[] = [
  { title: "Copy the prompt", text: "Paste it into your AI agent.", art: "/art/step1.webp" },
  { title: "Answer a few questions", text: "Tell it how the site should look. Sign in to Cloudflare when it asks.", art: "/art/step2.webp" },
  { title: "You're live", text: "Your site is online. Orders show up in Blanxer.", art: "/art/step3.webp" },
];

export const devLinks: { title: string; text: string; href: string }[] = [
  { title: "llms.txt", text: "Where every agent starts.", href: "/llms.txt" },
  { title: "Docs", text: "Every step, in detail.", href: "/api-docs/" },
  { title: "@blanxer-dev/storefront", text: "The npm package.", href: "https://www.npmjs.com/package/@blanxer-dev/storefront" },
  { title: "Starter", text: "The Next.js starter.", href: "https://github.com/blanxer-dev/blanxer-storefront-starter" },
  { title: "Agent skill", text: "For Claude Code.", href: "https://github.com/blanxer-dev/blanxer-agent-skills" },
  { title: "OpenAPI", text: "The public endpoints.", href: "/openapi.yaml" },
];
