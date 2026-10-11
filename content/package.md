# The @blanxer-dev/storefront package

> This page summarises the package's API: entry points, functions, components and the CLI. The package README and its TypeScript types have every argument and return type. The package is at version 0.1.0 and not yet published to npm.

`@blanxer-dev/storefront` is the typed client, checkout and tooling every BlanxerAPI site uses. The starter already depends on it. Keep it (rule 2): the checkout, delivery, coupon, payment and tracking behaviour in it is copied from Blanxer's own storefront and covered by tests, and it is updated when Blanxer's checkout changes.

```bash
npm install @blanxer-dev/storefront
```

Peer dependencies: `next` ≥ 16 (App Router), `react` and `react-dom` ≥ 19. Node ≥ 20.9. ESM with TypeScript types.

## Environment

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `BLANXER_STORE` | Yes | — | The store's subdomain (`mystore` in `mystore.blanxer.io`) or its custom domain, resolved with `check_domain` |
| `BLANXER_API` | No | `https://api.blanxer.com` | `https://api-dev.blanxer.com` for sandbox testing |
| `SITE_URL` | No | The saved `storefront_url` | The site's public origin, for canonical links, `robots.txt` and the sitemap index |
| `NEXT_PUBLIC_BLANXER_IMAGE_LOADER` | No | `wsrv` | Product photo resizing: `wsrv`, `cloudflare` or `none` |

No key, token or secret is ever needed (rule 6).

## Entry points

| Import | Runs on | For |
|---|---|---|
| `@blanxer-dev/storefront/server` | Server only | Reading store and catalog data |
| `@blanxer-dev/storefront/client` | Browser only | Orders, coupons, payments, holds, tracking, forms, events |
| `@blanxer-dev/storefront/react` | Browser (client components) | Provider, cart, product, checkout, the three required pages, forms |
| `@blanxer-dev/storefront/seo` | Server | Metadata and JSON-LD |
| `@blanxer-dev/storefront/next` | Server | Route handlers and the image loader |
| `@blanxer-dev/storefront/core` | Both | The pure logic: delivery, COD rule, coupons, payment method list, order payload, custom fields, validation, variants, formatting, types |
| `@blanxer-dev/storefront/image-loader` | — | The default image loader as a default export, for `loaderFile` |
| `@blanxer-dev/storefront/styles.css` | — | Default styles for the `bx-*` classes (optional) |
| `blanxer-storefront` (CLI) | Your terminal | `check` and `images` |

## `@blanxer-dev/storefront/server`

Server-only data functions. Each uses `fetch` with `next: { revalidate: 60 }` and a normal browser `User-Agent`. Responses are also kept in memory per server process / Worker instance for the same 60 seconds, so a Worker without an incremental cache still reads the catalog about once a minute, not once per page view. `opts` is `{ revalidate?: number | false }`.

| Function | Returns |
|---|---|
| `getStore(opts?)` | The full store config from `check_domain`. Server only: it contains plugin data |
| `getClientStore(opts?)` / `toClientStore(store)` | The browser-safe subset (no gateway keys or third-party plugin tokens), for `<BlanxerProvider store>` |
| `getStoreId()` | The store's `_id` |
| `getProducts(opts?)` | Every active product, unpaginated (prefer `getProductsPage`) |
| `getProductsPage({ page, perPage, sortBy, sortOrder }, opts?)` | `{ meta, products }`; `perPage` ≤ 100 |
| `getProduct(slug)` | The product, or `null` when it is missing, not Active or POS-only |
| `getCategory(slug)` | `{ category, storeCategory, products }` or `null`; `new-arrivals` included |
| `getBrands()` / `getBrand(slug)` | The brands / `{ brand, page, products }` or `null` |
| `searchProducts(q)` | Products (`[]` under 3 characters) |
| `getSaleProducts()` | Products on sale |
| `getDeliveryCharges()` | `{ defaults, places }` |
| `getFlashSales(opts?)` | `{ server_time, sales }` (not cached by default) |
| `getBlogPosts({ cursor, category, tag, author, q })` / `getBlogPost(slug)` | `{ items, next_cursor, has_more, all_categories }` / the post or `null` |
| `getForm(slug)` | The form or `null` |
| `getHomeSeo()` | `{ seo_title, seo_description, seo_image }` from the store's landing page (empty on stores without one) |
| `siteOrigin({ fromRequest? })` | The site's public origin: `SITE_URL`, else the saved `storefront_url`, else the request host. `{ fromRequest: false }` returns `''` instead of reading the request, which keeps a page static |
| `apiBase()`, `storeHandle()`, `blanxerGet(path, opts?)` | Low-level helpers |

Pass `getClientStore()` (or `toClientStore(store)`), not the raw `getStore()` result, to client components.

```tsx
// app/product/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getProduct } from '@blanxer-dev/storefront/server';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug); // null for missing, non-Active and POS-only products
  if (!product) notFound();
  return <h1>{product.name}</h1>;
}
```

See [Catalog](https://developers.blanxer.com/catalog.md) for what the product endpoints return.

## `@blanxer-dev/storefront/client`

Browser calls. This entry point imports `client-only`, so importing it from a Server Component, route handler or server action fails the build (rule 5).

| Function | Calls |
|---|---|
| `placeOrder(storeId, payload)` | `POST /order/:store_id` |
| `applyCoupon({ store, code, products })` | `POST /public/coupon` |
| `startPayment(method, { store, order, url? })` | The method's `/payment/*/init`. Returns the next step: `none`, `redirect`, `form`, `qr` or `fonepay_checkout` |
| `followPayment(start)` | Performs that step: navigates, or posts the eSewa/NPX form |
| `checkPayment('qr' \| 'fonepay_checkout', transaction)` | `GET /payment/dynamic_qr/check/:transaction` or `/payment/fonepay_checkout/check/:transaction` → `boolean` |
| `releaseHold({ store_id, order_id, transaction_id })` | `POST /order/public/release-hold` |
| `getOrder(storeId, orderId)` | `GET /order/public/:store_id/id/:order_id` |
| `cancelOrder({ store_id, order_id, phone_number })` | `POST /order/public/cancel` |
| `submitReview({ store_id, product_id, order_id, rating, review, phone_number })` | `POST /order/public/submit-review` |
| `requestStockAlert({ store, product, variant_id?, phone?, email?, product_name?, product_url? })` | `POST /customer/stock-alert` |
| `submitForm(storeId, slug, data)` | `POST /public/form/:store_id/:slug/submit` |
| `trackEvent(event, customData?, { eventId?, email?, phone? })` | Meta Pixel + `POST /public/meta-event/:store_id`, with one event id |

Also: `getDeliveryCharges`, `getFlashSaleForProduct`, `notifyFlashSale`, `uploadCustomFieldImage`, `pingAnalytics`, `pixelTrack`, `getEventId`, `buildOrderMeta`, `initMetaCapi`, `configureClient`, `BlanxerApiError`, `errorMessage`, `fieldError`.

`url` on orders and payments is always the site's own origin (`window.location.origin`). You rarely call these yourself: the React components do.

## `@blanxer-dev/storefront/react`

Client components and hooks. **Unstyled by default**: each element has a `bx-*` class, and the styles read CSS variables. The behaviour is fixed; style it, don't fork it.

| Export | What it is |
|---|---|
| `<BlanxerProvider store apiBase? theme? notify?>` | Wrap the app. Gives components the store config, holds the cart, remembers `?promo=`, sends the session ping, switches the Meta CAPI relay, sets the theme variables, shows toasts |
| `useBlanxer()` / `useStore()` | `{ store, storeId, apiBase, notify }` / the store |
| `CartProvider`, `useCart()` | The cart in `localStorage['cart_items']`, with line selection (`cart_selection`) |
| `<CartLines>`, `<CartView>` | Cart lines (optionally selectable and editable) and a full cart page |
| `<AddToCart product>` | Builds the cart line (variant `_id`, weight, custom fields, customization charge). Options to show the price, variants, custom fields, quantity, flash sale and stock alert |
| `useProductSelection(product)`, `<VariantPicker>`, `<CustomFields>`, `<QuantityPicker>` | Build your own product form from the same selection state |
| `<FlashSaleStrip productId>` | Countdown, units left, per-order limit, notify me |
| `<Checkout>` | The whole checkout: form, place select, delivery charge, coupons, payment methods, every gateway, QR modals with the hold timer. See [Checkout](https://developers.blanxer.com/checkout.md). |
| `<PaymentSuccess>` | `/payment/success` |
| `<PaymentFailed method?>` | `/payment/failed` |
| `<OrderTracking orderId fromCheckout?>` | `/track/[id]`, with cancel and review |
| `<BlanxerForm form>` | A Blanxer custom form (from `getForm()`) |
| `<StockAlertForm product variantId?>` | Back-in-stock "Notify me" (alias `BackInStockForm`) |
| `<Pixel>` | Meta Pixel, GA4, GTM and Clarity from the store's plugins |
| `<Money amount>`, `useMoney()`, `<BlanxerImage>` | Prices with the store's currency label; `next/image` with the Blanxer loader |

### Theming

`BlanxerProvider` takes a `theme` prop. Each key sets a CSS variable that the `bx-*` styles read. `primary` defaults to the store's theme colour from Blanxer; the `theme` prop wins over it.

| `theme` key | CSS variable |
|---|---|
| `primary` | `--bx-primary` |
| `primaryContrast` | `--bx-primary-contrast` |
| `background` | `--bx-bg` |
| `foreground` | `--bx-fg` |
| `muted` | `--bx-muted` |
| `border` | `--bx-border` |
| `danger` | `--bx-danger` |
| `success` | `--bx-success` |
| `radius` | `--bx-radius` |
| `fontFamily` | `--bx-font` |

Two more variables have no `theme` key: `--bx-surface` (card and panel background) and `--bx-gap` (spacing). Set any of them in your own CSS, or target the `bx-*` classes directly.

```tsx
// app/layout.tsx
import { getClientStore, apiBase } from '@blanxer-dev/storefront/server';
import { BlanxerProvider, Pixel } from '@blanxer-dev/storefront/react';
import '@blanxer-dev/storefront/styles.css';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await getClientStore();
  return (
    <html lang="en">
      <body>
        <BlanxerProvider store={store} apiBase={apiBase()} theme={{ primary: '#0f766e', radius: '10px' }}>
          {children}
          <Pixel />
        </BlanxerProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/checkout/page.tsx
import { getDeliveryCharges } from '@blanxer-dev/storefront/server';
import { Checkout } from '@blanxer-dev/storefront/react';
import { noIndexMetadata } from '@blanxer-dev/storefront/seo';

export const metadata = noIndexMetadata('Checkout');

export default async function CheckoutPage() {
  const delivery = await getDeliveryCharges();
  return <Checkout delivery={delivery} />;
}
```

`Checkout` also takes `labels` (button and section text), `className`, `header` and `footer` (your own content above the form and under the place-order area), `paymentMethodIcons` and `onOrderPlaced(order, method)`. Without `delivery`, it fetches the delivery table in the browser.

```tsx
// app/payment/success/page.tsx  (likewise PaymentFailed and OrderTracking)
import { PaymentSuccess } from '@blanxer-dev/storefront/react';
import { noIndexMetadata } from '@blanxer-dev/storefront/seo';
export const metadata = noIndexMetadata('Payment');
export default function Page() {
  return <PaymentSuccess />;
}
```

### "Checkout Powered by Blanxer"

`Checkout` always renders this under the place-order button:

```html
<p class="bx-powered-by">Checkout Powered by <a href="https://blanxer.com" target="_blank" rel="noopener noreferrer">Blanxer</a></p>
```

- Restyle it through `.bx-powered-by` (and `.bx-powered-by a`): colour, size, font, alignment, spacing.
- **Never remove or hide it** (rule 2). There is no prop to turn it off. Don't hide it with CSS (`display: none`, `visibility: hidden`, zero size, off-screen, same colour as the background) and don't cover it.
- Your own `footer` content renders below it.

### Where the package differs from the hosted storefront

- Test contacts (phone `0000000000` or a `mailinator.net` email) get `{ success: true }` with no order. The hosted storefront then goes to `/track/undefined`; `Checkout` shows "Test order accepted" and keeps the cart.
- Not ported on purpose: the customer login gate, loyalty tier discount and points preview (custom sites have no login), store-specific variants, and Card (Cybersource), which stays off.
- `Checkout` offers the optional delivery date from today only, like storefront `main`; the newer backend delivery-date rules aren't on `main` either.
- Payment methods are shown by name; logos are opt-in through `paymentMethodIcons`.
- The package re-selects a payment method that disappears, re-checks the coupon when the cart total changes, and shows per-method payment-start errors. See [Checkout](https://developers.blanxer.com/checkout.md).

## `@blanxer-dev/storefront/seo`

| Export | Returns |
|---|---|
| `storeMetadata(store, { origin?, homeSeo? })` | Home `Metadata` (pass `homeSeo` from `getHomeSeo()`) |
| `productMetadata(product, store, { origin? })` | Product `Metadata` |
| `categoryMetadata(store, category, { origin? })` | Category `Metadata` |
| `brandMetadata(store, brand, page?, { origin? })` | Brand `Metadata` |
| `blogPostMetadata(post, store, { origin? })` | Blog post `Metadata` |
| `noIndexMetadata(title)` | `noindex` metadata for cart, checkout, payment and tracking pages |
| `verificationMetadata(store)` | Search Console and other `meta_tags` from the store's plugins |
| `productJsonLd`, `organizationJsonLd`, `breadcrumbJsonLd` | schema.org `Product`, `Organization`, `BreadcrumbList` |
| `jsonLd(data)` | A safe serialiser for `<script type="application/ld+json">` |

Canonical URLs are only emitted when the origin is known. What they produce: [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md).

### Site tags (0.1.1+)

`storeMetadata` adds two tags to every page: `<meta name="generator" content="Blanxer Storefront">` and `<meta name="blanxer-store" content="<store id>">`.

- **What they're for:** Blanxer's nightly check reads them to confirm that the website link saved for a store is that store's own site. A site that answers but lacks them stays "linked", not "live", in Blanxer's records.
- **Keep them:** keep `storeMetadata` in the root layout.

## `@blanxer-dev/storefront/next`

| Export | Use |
|---|---|
| `sitemapIndexRoute({ extra? })` | `export const GET = sitemapIndexRoute()` in `app/sitemap.xml/route.ts`: an index of `/sitemap-catalog.xml` plus your own extra sitemaps |
| `catalogSitemapRoute()` | `export const GET = catalogSitemapRoute()` in `app/sitemap-catalog.xml/route.ts`. Proxies `/public/sitemap/:store_id.xml`. |
| `robotsRoute({ disallow? })` | `export const GET = robotsRoute()` in `app/robots.txt/route.ts` |
| `blanxerImageLoader`, `createImageLoader(provider)` | `next/image` loader for product photos (asks a resize service for the width needed) |

## CLI

```bash
npx blanxer-storefront check [dir] [--lighthouse <origin>] [--offline] [--no-worker-size] [--json]
npx blanxer-storefront images <in> <out> [--max-width 2560] [--quality 75] [--formats avif,webp]
```

### `check`

Run before every deploy. It prints a PASS/FAIL table and fails when:

- `BLANXER_STORE` isn't set, or Next.js or the package is missing;
- a contract route is missing: `/`, `/products`, `/product/[slug]`, `/collections/[slug]`, `/brand/[slug]`, `/brands`, `/search`, `/sale`, `/cart`, `/checkout`, `/payment/success`, `/payment/failed`, `/track/[id]`, `/forms/[slug]`, `/blogs`, `/blog/[slug]`, `/sitemap.xml`, `/sitemap-catalog.xml`, `/robots.txt`; or `/checkout` doesn't render the package's `<Checkout>`;
- there are account, login, wishlist, rewards or `/p/` pages, or calls to `/customer/auth`, `/customer/account`, wishlist or rewards;
- a secret is in the code, env files, `wrangler` config or the build output (`sk_` keys, gateway keys, plugin tokens, passwords, JWTs);
- `@blanxer-dev/storefront/client` is imported by server files, or the code calls payment, coupon or hold endpoints directly;
- the image budget is broken: see [Images and speed](https://developers.blanxer.com/images-and-speed.md#size-per-slot). It also warns when no image on a page is marked as the main (LCP) image;
- with `--lighthouse <origin>` (the production build running with `next start`): Lighthouse mobile is under 90 or LCP over 2.5 s on the home page, one product page and `/checkout`. It runs `npx --yes lighthouse` and needs Chrome.

It also lists the store's delivery places and payment methods. `--offline` skips the network checks. After an OpenNext build it reports the Worker size against the 3 MiB free-plan limit.

### `images`

Resizes images (never enlarges; default max width 2560, `--max-width` to change it), writes AVIF and WebP (~75 quality; `--quality`, `--formats`), copies SVGs, strips EXIF and location data, and prints a before/after size report. Needs `sharp` (an optional dependency of the package). See [Images and speed](https://developers.blanxer.com/images-and-speed.md#optimising-a-merchants-images).

## Versions

The checkout is versioned: checkout v1 matches Blanxer's storefront `main` at `cabd695` (stock holds and flash sales included). Partial payment, offers and agreed delivery come in checkout v1.1. Update the package to get checkout fixes; the site code doesn't change.
