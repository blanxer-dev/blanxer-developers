# The 13 hard rules

These rules apply to every BlanxerAPI website. Read them before writing any code, and follow them on every step. They are the same rules the `blanxer-website` skill and the starter's `AGENTS.md` state first.

1. **Next.js only:** TypeScript, App Router. If asked for another framework, say BlanxerAPI supports Next.js and continue in Next.js.
2. **Start from `blanxer-storefront-starter` and keep `@blanxer/storefront`.** Restyle the checkout through theme props and wrappers. **Never rewrite** the payment, delivery, coupon or order logic, and never call payment endpoints directly. The checkout's **"Checkout Powered by Blanxer"** line under the place-order button ("Blanxer" links to https://blanxer.com) is part of it: restyle it through `.bx-powered-by`, never remove or hide it.
3. **Required routes:** `/checkout`, `/payment/success`, `/payment/failed` and `/track/[id]`, at these exact paths.
4. **Send the site's own origin as `url`.** The package does it; never hardcode it.
5. **Browser-only calls:** orders, coupons, payment starts, hold release, back-in-stock, forms, cancel and review go from client components. Never from server code, route handlers or server actions.
6. **No secrets in the site.** No `sk_` key, MCP token, dashboard login or gateway key in code, `.env` or the build. Never ask the merchant to paste a key. Store changes go through the Blanxer MCP.
7. **No customer login.** No `/customer/auth/*` calls, and no account, login, wishlist or rewards pages.
8. **Don't invent data.** Prices, stock, delivery and payment methods come only from the API. No sample products or placeholder prices.
9. **Payment methods come from the store's settings** via the package. Never add or remove them by hand.
10. **Use our URL paths** (`/product/[slug]`, `/collections/[slug]`, `/brand/[slug]`), because the feed and sitemap use them. **Don't build a product feed or catalog sitemap**; Blanxer serves both. Only add the site's own extra pages to the sitemap index.
11. **Optimise every image before it goes into the site.**
    - Use `npx blanxer-storefront images`:
      - resize to the largest size shown ×2 (hero 2560 px, banner 1600, card 800);
      - export AVIF + WebP at ~75 quality;
      - strip EXIF and location data;
      - use SVG for logos when available.
    - Never commit originals.
    - Load with `next/image`: each page's main (LCP) image gets `preload`, the rest load lazily with correct `sizes`.
    - **Product photos go into Blanxer through the MCP, never into the site.**
    - No autoplay video backgrounds or GIF banners unless the merchant insists after hearing the speed cost.
    - Fonts go through `next/font`, at most 2 families.
12. **The site's design lives in the site.** Don't use MCP page-builder tools for a custom site. Use the MCP only for store data.
13. **Confirm before bulk store changes.** Show the list (SEO for many products, imports, delivery charges) and get a yes. The MCP's own confirmations still apply.

## Why these rules exist

| Rule | What breaks without it |
|---|---|
| 2, 9 | The checkout drifts from Blanxer's: wrong totals, missing gateways, orders the server refuses. |
| 2 (Powered by) | The "Checkout Powered by Blanxer" line is a condition of using Blanxer's checkout on a custom site (owner decision, 2026-10-11). The package has no prop to turn it off. |
| 3, 4 | Gateways return the shopper to `<url>/payment/success` or `<url>/payment/failed`, and the confirmation email links to `<url>/track/<id>`. A missing page means a 404 **after the shopper paid**. |
| 5 | Order creation is limited to 5 per 10 minutes per store and IP. Every Cloudflare Worker shares a few IPs, so server-side orders would block each other. The Meta relay also uses the caller's IP. |
| 6 | The site is public code on the merchant's account. Anything in it is readable. The public API needs no key. |
| 7 | Customer accounts are not part of BlanxerAPI. Custom sites use guest checkout. |
| 10 | Blanxer's product feed and sitemap link to `/product/<slug>`, `/collections/<slug>` and `/brand/<slug>` on the site. Other paths turn every feed and sitemap link into a 404. |
| 11 | Image weight is the main reason a store site is slow. See [Images and speed](https://developers.blanxer.com/images-and-speed.md). |
| 12 | Page-builder tools change the Blanxer-hosted site, not the custom site. |
| 13 | Bulk changes touch live store data shared with the Blanxer dashboard, POS and app. |
