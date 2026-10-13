/**
 * One landing page per AI tool, for searches like "build an ecommerce website in Nepal with
 * Claude" (/build-with/<slug>/). Each page has its own title, steps and questions so search
 * engines see five distinct pages, not one page five times.
 */
import type { Faq } from "./site";

export type AgentPage = {
  slug: string;
  /** The tool's name as people search for it. */
  name: string;
  /** Name in the "Works with" logo row (src/lib/agent-icons.ts), when it has a mark there. */
  iconName?: string;
  maker: string;
  /** <title> before " | BlanxerAPI". */
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  /** How to get the tool running, short and true. */
  setup: { title: string; text: string; code?: string }[];
  faqs: Faq[];
};

const sharedFaqs = (name: string): Faq[] => [
  {
    q: `Do I need to know coding to build my store with ${name}?`,
    a: `No. You paste one prompt and answer a few questions about the look of your site. ${name} reads the BlanxerAPI docs and writes the code itself.`,
  },
  {
    q: "Will eSewa, Khalti and Cash on Delivery work?",
    a: "Yes. The website uses Blanxer's own checkout, so eSewa, Khalti, Fonepay, NPX, cards and Cash on Delivery work exactly like on your Blanxer store, with your delivery charges and coupons.",
  },
  {
    q: "How much does it cost?",
    a: `BlanxerAPI is included in every Blanxer plan and Cloudflare's free plan is enough for most stores. You pay only for ${name} and your domain (.com.np domains are free for Nepali businesses).`,
  },
];

export const agentPages: AgentPage[] = [
  {
    slug: "claude-code",
    name: "Claude Code",
    iconName: "Claude Code",
    maker: "Anthropic",
    metaTitle: "Build an Ecommerce Website in Nepal with Claude Code",
    metaDescription:
      "Use Claude Code to build your ecommerce website in Nepal. One prompt builds a fast store with eSewa, Khalti and Cash on Delivery, powered by Blanxer.",
    h1: "Build an ecommerce website in Nepal with Claude Code",
    lead: "Paste one prompt into Claude Code. It builds your online store, connects it to Blanxer for products, payments and delivery, and puts it live.",
    setup: [
      { title: "Install Claude Code", text: "You need Node.js and a Claude plan.", code: "npm install -g @anthropic-ai/claude-code" },
      { title: "Open an empty folder and start it", text: "Run it in the folder where your website should live.", code: "claude" },
      { title: "Optional: add the Blanxer skill", text: "It walks Claude through every step and connects the Blanxer MCP.", code: "/plugin marketplace add blanxer-dev/blanxer-agent-skills\n/plugin install blanxer-website@blanxer" },
      { title: "Paste the prompt", text: "Answer Claude's questions about the design, then sign in to Cloudflare when it asks." },
    ],
    faqs: [
      ...sharedFaqs("Claude Code"),
      { q: "Can I use Claude on the web instead of Claude Code?", a: "Building and deploying needs an agent that can run commands on your computer, so use Claude Code. The Blanxer skill makes it follow every step." },
    ],
  },
  {
    slug: "codex",
    name: "Codex",
    iconName: "Codex",
    maker: "OpenAI",
    metaTitle: "Build an Ecommerce Website in Nepal with OpenAI Codex",
    metaDescription:
      "Use OpenAI Codex to build an ecommerce website in Nepal. One prompt builds a fast store with eSewa, Khalti and Cash on Delivery, powered by Blanxer.",
    h1: "Build an ecommerce website in Nepal with Codex",
    lead: "Paste one prompt into Codex. It builds your online store on Blanxer and deploys it to your own Cloudflare account.",
    setup: [
      { title: "Install the Codex CLI", text: "You need Node.js. Sign in with your ChatGPT account.", code: "npm install -g @openai/codex" },
      { title: "Open an empty folder and start it", text: "Run it where your website should live.", code: "codex" },
      { title: "Paste the prompt", text: "Codex reads the BlanxerAPI docs, asks about the design, builds and tests the store." },
      { title: "Sign in to Cloudflare", text: "Codex opens the Cloudflare sign-in in your browser and puts the site live." },
    ],
    faqs: sharedFaqs("Codex"),
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    iconName: "Codex",
    maker: "OpenAI",
    metaTitle: "Build an Ecommerce Website in Nepal with ChatGPT",
    metaDescription:
      "Make an ecommerce website in Nepal with ChatGPT: Codex, included with ChatGPT, builds your store with eSewa, Khalti and COD from one prompt.",
    h1: "Build an ecommerce website in Nepal with ChatGPT",
    lead: "A chat window can't put a website online, but Codex can, and it comes with your ChatGPT plan. Paste one prompt and it builds your store on Blanxer.",
    setup: [
      { title: "Use Codex with your ChatGPT account", text: "Codex is OpenAI's coding agent, included with ChatGPT Plus, Pro, Business and Enterprise.", code: "npm install -g @openai/codex" },
      { title: "Start it in an empty folder", text: "Choose \"Sign in with ChatGPT\" the first time.", code: "codex" },
      { title: "Paste the prompt", text: "Answer a few questions about how your store should look." },
      { title: "Sign in to Cloudflare", text: "Your site goes live on your own Cloudflare account and domain." },
    ],
    faqs: [
      ...sharedFaqs("ChatGPT"),
      { q: "Can I just paste the prompt into the ChatGPT chat?", a: "ChatGPT can explain the steps, but to write the files and deploy the site it needs an agent that runs commands. That's Codex, which signs in with the same ChatGPT account." },
    ],
  },
  {
    slug: "gemini",
    name: "Gemini",
    iconName: "Gemini CLI",
    maker: "Google",
    metaTitle: "Build an Ecommerce Website in Nepal with Gemini CLI",
    metaDescription:
      "Use Google's Gemini CLI to build an ecommerce website in Nepal. One prompt builds a fast store with eSewa, Khalti and Cash on Delivery, powered by Blanxer.",
    h1: "Build an ecommerce website in Nepal with Gemini",
    lead: "Paste one prompt into Gemini CLI, Google's coding agent. It builds your online store on Blanxer and puts it live.",
    setup: [
      { title: "Install Gemini CLI", text: "You need Node.js and a Google account.", code: "npm install -g @google/gemini-cli" },
      { title: "Open an empty folder and start it", text: "Sign in with Google the first time.", code: "gemini" },
      { title: "Paste the prompt", text: "Gemini reads the BlanxerAPI docs and asks how your store should look." },
      { title: "Sign in to Cloudflare", text: "When it's ready, Gemini deploys the site to your Cloudflare account." },
    ],
    faqs: [
      ...sharedFaqs("Gemini"),
      { q: "Can I use the Gemini app instead?", a: "The Gemini app can help you plan, but building and deploying needs Gemini CLI, which runs commands on your computer." },
    ],
  },
  {
    slug: "cursor",
    name: "Cursor",
    iconName: "Cursor",
    maker: "Anysphere",
    metaTitle: "Build an Ecommerce Website in Nepal with Cursor",
    metaDescription:
      "Use Cursor's AI agent to build an ecommerce website for your Nepal store. One prompt builds a Next.js site with eSewa, Khalti and COD, powered by Blanxer.",
    h1: "Build an ecommerce website in Nepal with Cursor",
    lead: "Open an empty folder in Cursor, paste one prompt into the agent, and it builds your online store on Blanxer.",
    setup: [
      { title: "Install Cursor", text: "Download it from cursor.com and open an empty folder." },
      { title: "Open the agent", text: "Open the chat and choose Agent mode." },
      { title: "Paste the prompt", text: "Let it run the commands it asks for, and answer its questions about the design." },
      { title: "Sign in to Cloudflare", text: "Your site goes live on your own Cloudflare account." },
    ],
    faqs: sharedFaqs("Cursor"),
  },
];

export const agentHref = (slug: string) => `/build-with/${slug}/`;
