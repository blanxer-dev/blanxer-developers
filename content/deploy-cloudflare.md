# Deploy to Cloudflare

The site runs on Cloudflare Workers in the **merchant's own Cloudflare account**. Blanxer doesn't host it and never gets access to that account.

## The toolchain

- Next.js 16, App Router, TypeScript.
- [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), which runs the real `next build` and turns the output into a Worker.
- `wrangler`, Cloudflare's CLI.

The starter already has `wrangler.jsonc`, `open-next.config.ts` and these scripts:

| Script | Runs |
|---|---|
| `dev` | `next dev` (local, Node) |
| `build` | `next build` |
| `preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview`: the real Worker, locally |
| `deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` |

This page calls the binaries directly (`./node_modules/.bin/opennextjs-cloudflare ...`); the scripts do the same.

Deploy to **Workers**, not Cloudflare Pages. Don't swap the adapter: Blanxer tests the checkout against this setup.

## Configuration

The site reads its settings from `.env`. OpenNext copies `.env` into the Worker at build time, so the same file works locally and deployed. None of these is a secret.

| Variable | Required | Meaning |
|---|---|---|
| `BLANXER_STORE` | Yes (`check` fails without it) | The store's subdomain, e.g. `mystore` |
| `BLANXER_API` | No | API base, default `https://api.blanxer.com` (`https://api-dev.blanxer.com` for sandbox testing) |
| `SITE_URL` | No | The site's public origin, for canonical links, `robots.txt` and the sitemap index. Default: the website link saved in Blanxer (`storefront_url`) |
| `NEXT_PUBLIC_BLANXER_IMAGE_LOADER` | No | Product photo resizing: `wsrv` (default), `cloudflare` or `none` |

**Before the first deploy, rename the Worker** in `wrangler.jsonc`: set `name` to the merchant's site name, and the `WORKER_SELF_REFERENCE` service binding's `service` to the same value. The name is part of the `workers.dev` link.

```jsonc
{
  "name": "mystore",
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "mystore" }]
}
```

Keep the rest of the starter's `wrangler.jsonc` as it is. No other configuration is needed: the public API needs no key, and nothing secret belongs in the Worker (rule 6).

### Caching on the Worker

The starter has no R2 or KV cache configured, so a new merchant can deploy without creating Cloudflare resources. Pages render on each request, and the package keeps API reads in memory for 60 seconds per Worker instance. For full ISR, create an R2 bucket and turn on the R2 incremental cache: the steps are commented in the starter's `open-next.config.ts` and `wrangler.jsonc`.

## Sign in to Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

- **Normal case:** a browser opens. The merchant signs in to **their own** Cloudflare account (a free account is enough) and approves access. You never see their password. `whoami` shows which account you are on; confirm it with the merchant.
- **No browser** (remote machine, CI): the merchant creates an API token in Cloudflare → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers**, and sets it in **their own** terminal:

  ```bash
  export CLOUDFLARE_API_TOKEN=...      # and CLOUDFLARE_ACCOUNT_ID=... if they have several accounts
  ```

  Don't ask them to paste the token into the chat, and never write it to a file in the repo.

## Worker size

```bash
./node_modules/.bin/opennextjs-cloudflare build
```

The build prints the Worker's size. The **compressed** size must be under:

- **3 MiB** on the Workers **free** plan;
- **10 MiB** on the Workers **paid** plan ($5/month).

Static assets (images, CSS, client JavaScript chunks) don't count toward it. If the Worker is over 3 MiB, tell the merchant **before** deploying and offer:

- remove heavy server-side dependencies (large UI kits, date and icon libraries imported whole, markdown or PDF libraries on the server);
- move work out of server code where it isn't needed;
- or the $5/month paid plan.

## Preview, then deploy

```bash
./node_modules/.bin/opennextjs-cloudflare build && ./node_modules/.bin/opennextjs-cloudflare preview   # the real Worker, locally
./node_modules/.bin/opennextjs-cloudflare build && ./node_modules/.bin/opennextjs-cloudflare deploy
```

The deploy ends with the live link: `https://<worker-name>.<account-subdomain>.workers.dev`. Then check, on that link:

- the home page, a product, a category and `/checkout` load with real data;
- `/payment/success`, `/payment/failed` and `/track/<a real order id>` exist (not 404);
- `/sitemap.xml`, `/sitemap-catalog.xml` and `/robots.txt` respond.

## Link the site to Blanxer

1. Save the link: `blanxer_set_storefront_url { url: "https://<the workers.dev link or the custom domain>" }` through the MCP. That call is a preview with a `confirm_token`; after the merchant's yes, apply it with `{ dry_run: false, confirm_token }`. Or the merchant pastes it in the Blanxer dashboard → avatar menu → BlanxerAPI → Your website (rolling out).

   Blanxer then uses it for the tracking link it generates, the delivered email, flash-sale alerts, the product feed and the sitemap. See [MCP for your website](https://developers.blanxer.com/mcp-for-website.md#blanxersetstorefronturl) for the full list.
2. Register the product feed `https://api.blanxer.com/public/product-feed/<store_id>.xml` with Meta Commerce Manager and/or Google Merchant Center.
3. Verify the site in Google Search Console and submit `https://<site>/sitemap.xml`.

Details for 2 and 3: [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md).

## Custom domain (optional)

1. The domain must be a zone on the merchant's Cloudflare account. In Cloudflare: **Add a domain**, then change the nameservers at the registrar if Cloudflare asks. This can take a few hours.
2. **Workers & Pages** → the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → enter `mystore.com` (and `www.mystore.com` if wanted). Cloudflare creates the DNS record and the certificate.
3. Pick one host as the main one and redirect the other to it (a Cloudflare redirect rule, `www` → apex or the reverse).
4. Update the Blanxer link (step 1 above) to `https://mystore.com`.

**If the domain currently points at Blanxer** (it appears as `custom_domain` in `check_domain`), moving it to the Worker switches every shopper on that domain from the Blanxer-hosted site to the new site, at once. Explain that, and let the merchant decide when.

## Retiring the old subdomain site

Optional, the merchant's choice, and **only after the link is saved**.

- Through the MCP: `blanxer_update_appearance { store_visibility: 'hidden_on_subdomain' }`;
- or in Blanxer: **Appearance → Branding → Site under construction → Sub-domain**.

Tell the merchant plainly, before switching:

- **every** page on `<sub>.blanxer.io` shows a placeholder, **including tracking and payment links sent before today**. There is no exception for old `/track` or `/payment` links;
- new orders' links go to the new site;
- it can be switched back at any time (`store_visibility: 'live'`).

The switch only affects the Blanxer-hosted pages. The API, and so the custom site, keeps working: `check_domain?domain=<sub>` still answers.

## Redeploying later

1. Edit the code.
2. `./node_modules/.bin/next build` and `npx blanxer-storefront check`.
3. `./node_modules/.bin/opennextjs-cloudflare build && ./node_modules/.bin/opennextjs-cloudflare deploy`.

Store data changes (products, prices, stock, SEO text, delivery charges, coupons) need **no** redeploy. They show on the site within about a minute.

## Hand-over

Leave a `README.md` in the site repo for the merchant (or their developer): how to run it locally, how to change the design, how to redeploy (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`), which Cloudflare account it lives on, which domain, and that products and SEO are edited in Blanxer, not in the code.
