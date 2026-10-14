# Quickstart

BlanxerAPI lets you build a custom Next.js website for a Blanxer store and deploy it to the merchant's own Cloudflare account. Blanxer stays the admin: products, stock, orders, payments, delivery and SEO data live in Blanxer. The website is only the front end.

The merchant usually starts with one line to an AI agent:

> Build my Blanxer store website in Next.js and deploy it to my Cloudflare account. Follow https://developers.blanxer.com/llms.txt My store is `<subdomain>.blanxer.io`.

This page is the procedure. Each step links to the guide with the details.

## Before you start

Read [the 13 hard rules](https://developers.blanxer.com/api-docs/rules.md). In short: Next.js only, start from the starter, keep `@blanxer-dev/storefront` for checkout, keep the four required routes, call orders and payments from the browser, no secrets, no customer login, no invented data.

Install the agent tools:

- **Claude Code skill:** `/plugin marketplace add blanxer-dev/blanxer-agent-skills` then `/plugin install blanxer-website@blanxer`
- **Blanxer MCP:** `claude mcp add --transport http blanxer https://mcp.blanxer.com/mcp` (the merchant signs in to Blanxer in the browser). Do this **first**, before any other work: Claude Code only loads a newly added MCP server when it starts. See step 1 for restarting without losing the conversation (`claude -c`).
- **Cursor, Codex, claude.ai:** add `https://mcp.blanxer.com/mcp` as a remote MCP server. See [MCP for your website](https://developers.blanxer.com/api-docs/mcp-for-website.md). The starter's `AGENTS.md` holds the same procedure as the skill.

## Three channels, three jobs

| Channel | Used by | For | Auth |
|---|---|---|---|
| Public API, `https://api.blanxer.com` | The site (server and browser) | Read store, theme, catalog, delivery table, coupons. Place orders, start payments, track orders. | None. CORS `*`. |
| Blanxer MCP, `https://mcp.blanxer.com/mcp` | You, the agent, in chat | Change store data: SEO text, products, photos, categories, brands, coupons, delivery, the site link | OAuth. The merchant signs in. |
| Blanxer-served XML, `https://api.blanxer.com/public/...xml` | Google and Meta | Product feed and catalog sitemap | None |

The site never holds a key and never talks to the MCP.

## The steps

Confirm each step with the merchant before moving on.

**Keep a progress file.** As soon as the site's folder exists, keep `BLANXER-PROGRESS.md` in it: the store, the design brief, what's decided and the step you're on. Update it after every step. If a session starts without the earlier conversation (the merchant restarted, or says "let's continue the website"), read it first and carry on from there instead of starting over.

### 1. Connect the Blanxer MCP first, then find the store

- **Before anything else, make sure the Blanxer MCP is connected**, so the merchant never has to restart in the middle of the work:
  - **Its tools (`blanxer_…`) are already there:** if they need a sign-in, the merchant runs `/mcp`, picks `blanxer` and signs in to Blanxer in the browser. No restart.
  - **Not there:** add it: `claude mcp add --transport http blanxer https://mcp.blanxer.com/mcp`, or install the skill (`/plugin marketplace add blanxer-dev/blanxer-agent-skills`, then `/plugin install blanxer-website@blanxer`). **Claude Code only loads a new MCP server when it starts**, so ask the merchant to restart **now**, while nothing is lost: type `/exit`, then run `claude -c` from the same folder Claude Code was started in. `claude -c` reopens this same conversation with its history. Give them the exact line (`cd <that folder> && claude -c`). Then `/mcp` → `blanxer` → sign in.
  - **Other agents:** Codex resumes with `codex resume --last`. Cursor, Gemini CLI and claude.ai: add `https://mcp.blanxer.com/mcp` as a remote MCP server. If the tool needs a restart, write `BLANXER-PROGRESS.md` first.

Look the store up by subdomain (or custom domain):

```bash
curl -s "https://api.blanxer.com/store/check_domain?domain=mystore"
```

You get the store config, including `_id` (the store id every other call needs), `name`, `plan`, `addons`, `checkout`, `customization` and `categories`. An unknown domain returns HTTP 400 `{"message":"Domain not in use"}`. Field by field: [Store and theme](https://developers.blanxer.com/api-docs/store-and-theme.md).

Show the merchant:

- the store name and plan;
- the product count (`GET /product/public/<store_id>` returns all active products);
- the payment methods the checkout will offer (see [Checkout → Payment methods](https://developers.blanxer.com/api-docs/checkout.md#payment-methods));
- **Free plan** (`plan` not one of `basic`, `premium`, `plus`, `platinum`): the checkout is Cash on Delivery only;
- **Store with customer login turned on** (`customer_program.enabled`): the custom site still uses guest checkout. BlanxerAPI has no login.

Then run `blanxer_audit_seo` (the MCP is already connected from the start of this step). Also check the catalog for products with no photo, no price, no category or no SEO text. Show the gaps.

### 2. Design brief (ask, don't copy)

**Ask the merchant before you design anything:**
- 2–3 websites whose look they like (links or screenshots), or "something like <brand>";
- colours and mood, the pages they need, the tone, and any must-haves.

No references? Offer 3 short, clearly different style directions and let them pick.

**Don't copy their current Blanxer-hosted storefront** (its layout, its sections, or `blanxer_get_site_design`). They are building a new site because they want something different. Reuse it only if they ask to keep their current look. Offer the store's logo, colours (`customization.theme`) and font (`customization.font`) as defaults, not as the design. Agree on a short page list and write the brief into `BLANXER-PROGRESS.md` before building.

### 3. Scaffold from the starter

```bash
npx degit blanxer-dev/blanxer-storefront-starter my-store
cd my-store
cp .env.example .env    # set BLANXER_STORE=<subdomain>
npm install
./node_modules/.bin/next dev
```

`BLANXER_STORE` is the subdomain (required). Optional: `BLANXER_API` (default `https://api.blanxer.com`), `SITE_URL` (the site's public origin; default the link saved in Blanxer) and `NEXT_PUBLIC_BLANXER_IMAGE_LOADER` (`wsrv`, `cloudflare` or `none`). See [Deploy → Configuration](https://developers.blanxer.com/api-docs/deploy-cloudflare.md#configuration). Open `http://localhost:3000` and show the merchant the starter running with their real products before changing the design.

The starter's `npm run dev`, `npm run build` and `npm run deploy` scripts do the same as the direct commands on this page. The direct `./node_modules/.bin/...` form avoids surprises when the machine has another Node install on its path.

### 4. Build

- Build pages with the package's data functions and components. See [Catalog](https://developers.blanxer.com/api-docs/catalog.md) and [Package](https://developers.blanxer.com/api-docs/package.md).
- Theme the checkout; don't rewrite it. See [Checkout](https://developers.blanxer.com/api-docs/checkout.md).
- Optimise every image (rule 11) and show a before/after size table. See [Images and speed](https://developers.blanxer.com/api-docs/images-and-speed.md).
- Fix store data through the MCP: SEO text, categories and brands for the menus, product photos, launch coupons. Confirm bulk changes first (rule 13).

Routes every site has:

`/` · `/products` · `/product/[slug]` · `/collections/[slug]` (including `new-arrivals`) · `/brand/[slug]` · `/brands` · `/search?q=` · `/sale` · `/cart` · `/checkout` · **`/payment/success`** · **`/payment/failed`** · **`/track/[id]`** · `/forms/[slug]` · `/blogs` (and `?category=`) · `/blog/[slug]` · `/sitemap.xml` (index) · `/sitemap-catalog.xml` · `/robots.txt`

No `/account`, `/login` or `/p/[slug]`.

### 5. Check

```bash
./node_modules/.bin/next build
npx blanxer-storefront check            # add --lighthouse http://localhost:3000 with the production build running
```

It checks the routes, secrets, login code, that order and payment calls run in the browser, the image budget (and warns when a page has no main image marked with `preload`), and with `--lighthouse <origin>` the speed (mobile ≥ 90, LCP < 2.5 s on home, a product and checkout; needs `next start` running). Fix every failure before deploying, or tell the merchant why one can't be fixed.

### 6. Test the checkout

See [Testing](https://developers.blanxer.com/api-docs/testing.md). On the merchant's real store, test orders use the phone number `0000000000`: the API validates the order and returns `{"success":true}` **without creating it**. The checkout then shows "Test order accepted" and stops. That tests the form, validation, delivery charges, COD per place and coupons.

Because no order exists, the `0000000000` order can't open a gateway or a QR screen. Check that every payment method the store has on appears for a COD and a non-COD place, and that `/payment/success`, `/payment/failed` and `/track/<id>` render. The gateway and QR screens themselves are checked once, live, in step 12 (see [Testing → The live check](https://developers.blanxer.com/api-docs/testing.md#4-the-live-check)).

### 7. Sign in to Cloudflare

```bash
npx wrangler login
```

The merchant signs in to **their own** Cloudflare account in the browser. Before the first deploy, rename the Worker in `wrangler.jsonc` (`name` and the matching `WORKER_SELF_REFERENCE` service) to the merchant's site name. Check the Worker size: 3 MiB (compressed) on the free plan. See [Deploy to Cloudflare](https://developers.blanxer.com/api-docs/deploy-cloudflare.md).

### 8. Deploy

```bash
./node_modules/.bin/opennextjs-cloudflare build && ./node_modules/.bin/opennextjs-cloudflare deploy
```

Print the live `*.workers.dev` link and open it.

### 9. Link the site to Blanxer

Call `blanxer_set_storefront_url { url }`. It returns a preview and a `confirm_token`; show the merchant, and after their yes call `{ dry_run: false, confirm_token }`. (Or the merchant pastes the link in the Blanxer dashboard → avatar menu → **BlanxerAPI** → Your website, rolling out.) Blanxer then uses the site in the tracking link it generates, the delivered email, flash-sale alerts, the product feed and the sitemap. Register the feed with Meta and submit the sitemap to Google Search Console. See [SEO and tracking](https://developers.blanxer.com/api-docs/seo-and-tracking.md).

### 10. Custom domain (optional)

Add it in Cloudflare, then update the link (step 9).

### 11. Retire the subdomain site (optional, merchant's choice)

Only after step 9. Every page on `<sub>.blanxer.io` then shows a placeholder, **including tracking links sent before today**. See [Deploy to Cloudflare → Retiring the old subdomain site](https://developers.blanxer.com/api-docs/deploy-cloudflare.md#retiring-the-old-subdomain-site).

### 12. Live check

On the live site open home, a product, checkout, the three payment/tracking pages and a real `/track/<id>`. With the merchant's OK, place one real COD order and have the merchant cancel it in the dashboard. For one online method, start a real order, open the gateway or QR screen and stop without paying (closing the QR releases the hold), then cancel it in the dashboard. Hand over a README that says how to edit and redeploy.

## Next

- [Checkout](https://developers.blanxer.com/api-docs/checkout.md) is the most important page. Read it before touching `/checkout`.
- The API spec for every endpoint a site uses: [openapi.yaml](https://developers.blanxer.com/openapi.yaml).
