# SEO and tracking

Blanxer builds the product feed and the catalog sitemap. The site passes the sitemap through, renders metadata and JSON-LD from Blanxer's SEO fields, and loads the tracking tags the merchant set in Blanxer. SEO **text** is changed in Blanxer through the MCP, never hardcoded in the site.

## Files Blanxer builds

| File | URL | Cache |
|---|---|---|
| Catalog sitemap | `https://api.blanxer.com/public/sitemap/<store_id>.xml` | Data rebuilt at most daily, and after product, category, brand or page changes |
| Product feed (RSS 2.0 + `g:` namespace) | `https://api.blanxer.com/public/product-feed/<store_id>.xml` | Data rebuilt at most hourly |

Both send `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`. An unknown store id is HTTP 404.

**Every link in them is absolute, on the store's site origin:**

1. the saved site link (`storefront_url`), if set;
2. else the verified Blanxer custom domain;
3. else `https://<sub>.blanxer.io`.

So **save the site link in Blanxer before you submit either file** (`blanxer_set_storefront_url`, see [Deploy](https://developers.blanxer.com/deploy-cloudflare.md#link-the-site-to-blanxer)). Before that, they point at the Blanxer-hosted site. Changing the link takes effect on the next request; no cache clearing is needed.

### What the catalog sitemap lists

- `/`, `/products`, `/collections/new-arrivals`
- `/collections/<slug>` for every category
- `/product/<slug>` for every Active, non-POS product
- `/brand/<slug>` for every brand
- `/blogs`, `/blogs?category=<slug>` and `/blog/<slug>` when the store has published, indexable posts
- page-builder pages `/p/<slug>` **only when no site link is saved**; a custom site has none

This is why the paths are fixed (rule 10). It does not list `/brands`, `/sale`, `/search`, `/forms/<slug>` or any page you add. Those go in the site's own sitemap.

### What the product feed contains

One `<item>` per product, or per variant for products with variants:

- `g:id`: the product `_id`, or `<product_id>_<variant_id>` for a variant, with `g:item_group_id` = the product `_id`;
- `g:link`: `<origin>/product/<slug>`;
- `g:title`, `g:description`, `g:image_link` (+ up to 10 `g:additional_image_link`), `g:brand`, `g:condition`, `g:availability` (`in stock` / `out of stock`), `g:product_type`;
- `g:price`, and `g:sale_price` when `compare_at_price` is above the price;
- `g:quantity_to_sell_on_facebook`.

Items without an image or a price above 0 are left out (Meta rejects them). The `g:id` values are the same ids the site must send as Meta `content_ids` (see [Meta Pixel](#meta-pixel-and-conversions-api)).

**Don't build a feed or a catalog sitemap in the site** (rule 10).

## The site's sitemap and robots

| Route | Content |
|---|---|
| `/sitemap.xml` | A sitemap **index** listing `/sitemap-catalog.xml` and `/sitemap-pages.xml` |
| `/sitemap-catalog.xml` | Blanxer's catalog sitemap, passed through unchanged |
| `/sitemap-pages.xml` | The site's own extra pages: `/brands`, `/sale`, `/forms/<slug>`, about, contact |
| `/robots.txt` | Allow all, keep private pages out, point to `/sitemap.xml` |

Google wants a sitemap on the same host as the pages it lists. That's why the site serves the catalog sitemap on its own host instead of linking to `api.blanxer.com`.

```ts
// app/sitemap-catalog.xml/route.ts
import { catalogSitemapRoute } from '@blanxer/storefront/next';
export const GET = catalogSitemapRoute(); // fetches /public/sitemap/<store_id>.xml
```

```ts
// app/sitemap.xml/route.ts
import { siteOrigin } from '@blanxer/storefront/server';

export async function GET() {
  const origin = await siteOrigin();
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${origin}/sitemap-catalog.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${origin}/sitemap-pages.xml</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
```

```ts
// app/robots.txt/route.ts
import { robotsRoute } from '@blanxer/storefront/next';
export const GET = robotsRoute();
```

The robots file should allow everything, disallow `/checkout`, `/cart`, `/payment/` and `/track/`, and end with `Sitemap: <origin>/sitemap.xml`. (The Blanxer-hosted storefront disallows `/checkout` and `/cdn-cgi/`.)

Check the package README for the exact `catalogSitemapRoute` / `robotsRoute` / `siteOrigin` signatures of the released version.

## Page metadata

Use Next.js `generateMetadata`. The package's `storeMetadata`, `productMetadata`, `categoryMetadata` and `brandMetadata` build these from the API data. The values below are what the Blanxer-hosted storefront uses; follow them so the merchant's SEO work in Blanxer shows up the same way.

| Page | `<title>` | Description | Share image (`og:image`) |
|---|---|---|---|
| Home | `brand_name` (or `name`) | `description`, else `top_bar_text` | `hero_images[0]` |
| Product | Product `name` | `seo_description`, else the name | `seo_image`, else `image_urls[0]` |
| Category | `seo_title` (else the name) + ` \| ` + store name | `seo_description`, else the store `description` | `seo_image`, else the category `image`, else `hero_images[0]` |
| Brand | The brand page's `seo_title` + ` \| ` + store name (use the brand name when it is empty) | The brand page's `seo_description`, else the store `description` | The brand page's `seo_image`, else `hero_images[0]` |
| Blog post | `seo_title` | `seo_description` | `seo_image` (all three already defaulted by the API) |

The brand page's SEO fields come from `GET /brand/public/products/<store_id>/<slug>` as `brand.page.seo_title`, `seo_description`, `seo_image`.

- For products, `og:title` is `seo_title` when set, else the name.
- Every page: `og:site_name` = the store name, `og:type` (`website`, `product`, `article`), `twitter:card` = `summary_large_image`, and a canonical URL `<origin><path>` without query strings (except `/blogs?category=`).
- `noindex` on `/cart`, `/checkout`, `/payment/success`, `/payment/failed`, `/track/[id]`, `/search`, and blog posts with `no_index`.
- Home-page SEO text set in Blanxer's page builder isn't part of BlanxerAPI. Write the home title and description from the store name and description, and confirm them with the merchant.

To improve the text, use the MCP: `blanxer_audit_seo`, then `blanxer_update_product_status_seo`, `blanxer_bulk_update_products`, `blanxer_bulk_update_categories_seo`, `blanxer_update_brand`. Confirm bulk changes first (rule 13). See [MCP for your website](https://developers.blanxer.com/mcp-for-website.md).

## JSON-LD

Add structured data with the package's `productJsonLd`, `organizationJsonLd` and `breadcrumbJsonLd`, in a `<script type="application/ld+json">`.

**Product** (product pages), from real data only:

- `@type: Product`, `@id: <url>#product`, `name`, `url`, `description` (`seo_description` or the name), `image` (all `image_urls`);
- `offers`: `@type: Offer`, `price` (first variant's price, else the product's), `priceCurrency: NPR`, `availability` (`InStock` when `continue_selling`, or any stock), `itemCondition: NewCondition`, `seller` = the store;
- `sku` and `gtin` (barcode) when present, `brand` when the product has one, `category` from the first matching category name;
- `aggregateRating` only when `review_count > 0`: `ratingValue` = `total_rating / review_count` (the average, 1–5), `reviewCount`. (The Blanxer storefront puts the raw sum in `ratingValue`; don't copy that.)
- `review` entries only for real reviews.

**Organization** (home): `name`, `url`, `logo`, and `sameAs` with the `social` links that are set.

**BreadcrumbList** (product, category, brand): Home → Category or Brand → Product.

Never add placeholder ratings, prices or reviews (rule 8).

## Search Console verification

1. The merchant adds the site in [Google Search Console](https://search.google.com/search-console) as a **URL-prefix** property (`https://mystore.com/`) and picks **HTML tag**. They copy the tag or just its `content` value.
2. You call `blanxer_set_site_verification { google_verification_code: "<the tag or the content value>" }` through the MCP. Blanxer stores it in the `meta_tags` plugin as `{n: "google-site-verification", c: "<code>"}`.
3. The site renders every `meta_tags` entry as `<meta name={n} content={c}>` on the home page. `verificationMetadata(store)` from the package returns it as Next.js `metadata.verification` / `metadata.other`.
4. Wait about a minute for the caches, check the tag is in the page source, then click **Verify**.
5. Submit `https://<site>/sitemap.xml` under **Sitemaps**.

A **Domain** property (verified with a DNS TXT record) works too: the merchant adds the TXT record in their own Cloudflare DNS. Then no meta tag is needed.

## Google Analytics, Tag Manager and Clarity

The ids come from `check_domain.plugins`:

- `ga`: a GA4 id (`G-...`);
- `gtm`: a Tag Manager id (`GTM-...`);
- `clarity`: a Microsoft Clarity id.

Set or change GA/GTM with `blanxer_set_site_verification { ga_id }` or `{ gtm_id }`. Load each tag only when its id is present, with `next/script` and `strategy="afterInteractive"` (or `@next/third-parties`), so it doesn't block rendering. Never hardcode an id in the site.

## Meta Pixel and Conversions API

- **Pixel:** when `plugins` has `fb_pixel`, load Meta's `fbevents.js` with that id and track `PageView` on every route change.
- **Conversions API relay:** when `plugins` has `meta_capi` (its `details` is just `true`; the access token stays on Blanxer's server), every event is also sent to Blanxer, which forwards it to Meta. The relay goes through Blanxer's domain, so ad blockers don't drop it.

The package's `Pixel` component and `trackEvent` do both.

### Events

| Event | When | `custom_data` |
|---|---|---|
| `ViewContent` | Product page opens | `content_ids: [product _id]`, `content_name`, `content_type: 'product'`, `value`, `currency: 'NPR'` |
| `AddToCart` | Add to cart | `content_ids: ['<product>_<variant>' or '<product>']`, `content_name`, `content_type`, `value`, `currency` |
| `InitiateCheckout` | Checkout opens with lines | `content_ids`, `content_type`, `value`, `currency`, `num_items` |
| `Purchase` | Order placed (COD) / paid (online) | `content_ids`, `content_type`, `value`, `currency`, `num_items` |

`content_ids` must match the feed's `g:id`: `<product_id>_<variant_id>` for a variant line, the product `_id` otherwise. Otherwise Meta's catalog ads can't match events to products.

### The relay call

```http
POST /public/meta-event/<store_id>
Content-Type: application/json

{ "event_name": "AddToCart", "event_id": "<uuid, the same one passed to fbq as eventID>",
  "event_source_url": "https://mystore.com/product/pashmina-shawl",
  "fbp": "<_fbp cookie>", "fbc": "<_fbc cookie>",
  "custom_data": { "content_ids": ["..._..."], "content_type": "product", "value": 2500, "currency": "NPR" } }
```

- `event_name` is one of `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`. Add `email` and `phone` only for `Purchase`.
- Always `{"success": true}`. It does nothing when the store has no `meta_capi`.
- Limit: 100 per minute per IP.
- Send it from the **browser** with `fetch(..., { keepalive: true })` and don't wait for it. Blanxer forwards the caller's IP and user agent to Meta, so a server-side call would report the Worker instead of the shopper.

### Purchase without double counting

- The checkout creates one `event_id` per order and sends it in the order's `meta` block with `fbp`, `fbc` and `event_source_url`.
- **COD:** Blanxer's server sends the CAPI `Purchase` when the order is created. The browser fires only the Pixel `Purchase`, with the same `event_id`.
- **Online payments:** `/payment/success` fires the Pixel and the relay with that `event_id`.
- Meta dedupes on `event_id`.

## Register the product feed

After the site link is saved:

- **Meta Commerce Manager:** Catalog → Data sources → Data feed → scheduled feed from URL `https://api.blanxer.com/public/product-feed/<store_id>.xml`, hourly or daily.
- **Google Merchant Center:** Products → Feeds → scheduled fetch of the same URL.

`blanxer_get_store_context` returns the feed and sitemap URLs (the `product_feed_url` and `sitemap_url` fields arrive with the BlanxerAPI MCP release).
