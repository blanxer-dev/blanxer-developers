# The @blanxer/storefront package

> **See the package README for the released API.** This page describes the surface fixed by the BlanxerAPI contract: entry points, function and component names, and what each one does. Exact arguments and return types live in the README and the package's TypeScript types. When this page and the README disagree, the README wins. The package is at version 0.1.0 and not yet published to npm.

`@blanxer/storefront` is the typed client, checkout and tooling every BlanxerAPI site uses. The starter already depends on it. Keep it (rule 2): the checkout, delivery, coupon, payment and tracking behaviour in it is copied from Blanxer's own storefront and covered by tests, and it is updated when Blanxer's checkout changes.

```bash
npm install @blanxer/storefront
```

Peer dependencies: `next` ≥ 16, `react` and `react-dom` ≥ 19. Node ≥ 20.9.

## Environment

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `BLANXER_STORE` | Yes | — | The store's subdomain, e.g. `mystore` |
| `BLANXER_API` | No | `https://api.blanxer.com` | `https://api-dev.blanxer.com` for sandbox testing |

No key, token or secret is ever needed (rule 6).

## Entry points

| Import | Runs on | For |
|---|---|---|
| `@blanxer/storefront/server` | Server only | Reading store and catalog data |
| `@blanxer/storefront/client` | Browser | Orders, coupons, payments, holds, tracking, forms, events |
| `@blanxer/storefront/react` | Browser (client components) | Provider, cart, product, checkout, the three required pages, forms |
| `@blanxer/storefront/seo` | Server | Metadata and JSON-LD |
| `@blanxer/storefront/next` | Server | Route handlers and the image loader |
| `@blanxer/storefront/styles.css` | — | Default styles for the `bx-*` classes (optional) |
| `blanxer-storefront` (CLI) | Your terminal | `check` and `images` |

## `@blanxer/storefront/server`

Server-only data functions. Each uses `fetch` with `next: { revalidate: 60 }` and a normal browser `User-Agent`.

| Function | Calls |
|---|---|
| `getStore()` | `GET /store/check_domain?domain=$BLANXER_STORE` |
| `getStoreId()` | The store's `_id` |
| `getProducts()` | `GET /product/public/:store_id` (every active product, unpaginated) |
| `getProductsPage({ page, perPage, sortBy, sortOrder })` | `GET /product/p/public/:store_id` |
| `getProduct(slug)` | `GET /product/public/:store_id/:slug` |
| `getCategory(slug)` | `GET /product/public/:store_id/category/:slug` (`new-arrivals` included) |
| `getBrands()` | `GET /brand/public/all/:store_id` |
| `getBrand(slug)` | `GET /brand/public/details/...` and `/brand/public/products/...` |
| `searchProducts(q)` | `GET /product/public/search/:store_id?q=` |
| `getSaleProducts()` | `GET /product/public/sale/:store_id` |
| `getDeliveryCharges()` | `GET /public/delivery_charge/:store_id` |
| `getFlashSales()` | `GET /public/flash-sale/:store_id` (not cached) |
| `getBlogPosts(opts)` | `GET /public/blog/:store_id` (or `/category/:c`) |
| `getBlogPost(slug)` | `GET /public/blog/:store_id/:slug` |
| `getForm(slug)` | `GET /public/form/:store_id/:slug` |
| `siteOrigin()` | The site's public origin: `SITE_URL` env, else the store's `storefront_url`, else the request host |

The current package also has `getClientStore()`: the browser-safe subset of the store, for `<BlanxerProvider store>`. Pass that, not the raw `getStore()` result, to client components.

```tsx
// app/product/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getProduct } from '@blanxer/storefront/server';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <h1>{product.name}</h1>;
}
```

See [Catalog](https://developers.blanxer.com/catalog.md) for what the product endpoints return and which products must 404.

## `@blanxer/storefront/client`

Browser calls. Use them only from client components (rule 5); never from server components, route handlers or server actions.

| Function | Calls |
|---|---|
| `placeOrder` | `POST /order/:store_id` (adds `url` = the page's origin) |
| `applyCoupon` | `POST /public/coupon` |
| `startPayment` | The method's `/payment/*/init` |
| `checkPayment` | `GET /payment/dynamic_qr/check/:transaction` or `/payment/fonepay_checkout/check/:transaction` |
| `releaseHold` | `POST /order/public/release-hold` |
| `getOrder` | `GET /order/public/:store_id/id/:order_id` |
| `cancelOrder` | `POST /order/public/cancel` |
| `submitReview` | `POST /order/public/submit-review` |
| `requestStockAlert` | `POST /customer/stock-alert` |
| `submitForm` | `POST /public/form/:store_id/:slug/submit` |
| `trackEvent` | Meta Pixel + `POST /public/meta-event/:store_id` |

You rarely call these yourself: the React components do.

## `@blanxer/storefront/react`

Client components and hooks. **Unstyled by default**: each element has a `bx-*` class, and the styles read CSS variables. The behaviour is fixed; style it, don't fork it.

| Export | What it is |
|---|---|
| `<BlanxerProvider store>` | Wrap the app. Gives components the store config, holds the cart, remembers `?promo=`, sets the theme variables |
| `CartProvider`, `useCart()` | The cart in `localStorage['cart_items']`, with line selection (`cart_selection`) |
| `AddToCart` | Builds the cart line (variant `_id`, weight, custom fields, customization charge) |
| `VariantPicker` | Option selection that resolves to a variant `_id` |
| `FlashSaleStrip` | Countdown, units left, per-order limit, notify me |
| `Checkout` | The whole checkout: form, place select, delivery charge, coupons, payment methods, every gateway, QR modals with the hold timer. See [Checkout](https://developers.blanxer.com/checkout.md). |
| `PaymentSuccess` | `/payment/success` |
| `PaymentFailed` | `/payment/failed` |
| `OrderTracking` | `/track/[id]`, with cancel and review |
| `BlanxerForm` | A Blanxer custom form |
| `StockAlertForm` | Back-in-stock "Notify me" |
| `Pixel` | Meta Pixel, GA4, GTM and Clarity from the store's plugins |

### Theming

`BlanxerProvider` takes a `theme` prop. Each key sets a CSS variable that the `bx-*` styles read. Anything you leave out keeps its default; `primary` defaults to the store's theme colour from Blanxer.

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

You can also set the variables in your own CSS, or target the `bx-*` classes directly.

```tsx
// app/layout.tsx
import { getClientStore, apiBase } from '@blanxer/storefront/server';
import { BlanxerProvider, Pixel } from '@blanxer/storefront/react';
import '@blanxer/storefront/styles.css';

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
import { getDeliveryCharges } from '@blanxer/storefront/server';
import { Checkout } from '@blanxer/storefront/react';

export const metadata = { robots: { index: false } };

export default async function CheckoutPage() {
  const delivery = await getDeliveryCharges();
  return <Checkout delivery={delivery} />;
}
```

`Checkout` also takes `labels` (button and section text), `className`, `header` and `footer` (your own content above the form and under the place-order area), and `paymentMethodIcons`.

```tsx
// app/payment/success/page.tsx  (likewise PaymentFailed and OrderTracking)
import { PaymentSuccess } from '@blanxer/storefront/react';
export const metadata = { robots: { index: false } };
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

## `@blanxer/storefront/seo`

| Export | Returns |
|---|---|
| `storeMetadata(store)` | Home `Metadata` |
| `productMetadata(product, store)` | Product `Metadata` |
| `categoryMetadata(category, store)` | Category `Metadata` |
| `brandMetadata(brand, store)` | Brand `Metadata` |
| `productJsonLd(product, store)` | schema.org `Product` |
| `organizationJsonLd(store)` | schema.org `Organization` |
| `breadcrumbJsonLd(items)` | schema.org `BreadcrumbList` |
| `verificationMetadata(store)` | Search Console and other `meta_tags` from the store's plugins |

What they produce: [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md).

## `@blanxer/storefront/next`

| Export | Use |
|---|---|
| `catalogSitemapRoute()` | `export const GET = catalogSitemapRoute()` in `app/sitemap-catalog.xml/route.ts`. Proxies `/public/sitemap/:store_id.xml`. |
| `robotsRoute()` | `export const GET = robotsRoute()` in `app/robots.txt/route.ts` |
| `blanxerImageLoader` | `next/image` loader for product photos (asks a resize service for the width needed) |

The current package also has `sitemapIndexRoute({ extra })` for `app/sitemap.xml/route.ts`: a sitemap index listing `/sitemap-catalog.xml` plus your own extra sitemaps.

## CLI

```bash
npx blanxer-storefront check
npx blanxer-storefront images <in> <out>
```

### `check`

Run before every deploy. It fails when:

- a required route is missing: `/checkout`, `/payment/success`, `/payment/failed`, `/track/[id]` (and the other site routes);
- a secret is in the code, `.env` or the build (an `sk_` key, tokens, gateway keys);
- the code calls `/customer/auth` or `/customer/account`, or has login, account, wishlist or rewards pages;
- order, coupon, payment, hold or stock-alert calls run outside the browser;
- the image budget is broken (see [Images and speed](https://developers.blanxer.com/images-and-speed.md#size-per-slot));
- with `--lighthouse <url>`: Lighthouse mobile is under 90 or LCP over 2.5 s.

After an OpenNext build it also reports the Worker size against the 3 MiB free-plan limit.

### `images`

Resizes images (default max width 2560, `--max-width` to change it), writes AVIF and WebP (~75 quality), strips EXIF and location data, and prints a before/after size report. See [Images and speed](https://developers.blanxer.com/images-and-speed.md#optimising-a-merchants-images).

## Versions

The checkout is versioned: checkout v1 matches Blanxer's storefront `main` at `cabd695` (stock holds and flash sales included). Partial payment, offers and agreed delivery come in checkout v1.1. Update the package to get checkout fixes; the site code doesn't change.
