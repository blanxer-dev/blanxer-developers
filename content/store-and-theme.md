# Store and theme

One call returns everything about the store that a site needs to look like the store: name, logo, colours, font, categories, menus, social links, checkout settings, payment add-ons and tracking plugins.

## Looking up the store

```bash
curl -s "https://api.blanxer.com/store/check_domain?domain=mystore"
```

- `domain` is the store's subdomain (`mystore` for `mystore.blanxer.io`) or its custom domain (`shop.example.com`). It is lower-cased.
- `POST /store/check_domain` with `{"domain": "mystore"}` returns the same.
- An unknown domain: HTTP 400 `{"message":"Domain not in use"}`. A missing `domain`: HTTP 400 `{"fields":{"domain":"Domain is required"}}`.
- The API caches the answer for 1 hour and clears it when the merchant changes store settings. The package adds a 60-second cache on top.

In the site: `getStore()` and `getStoreId()` from `@blanxer/storefront/server` read `BLANXER_STORE` and make this call. **`_id` is the `store_id` every other endpoint needs.**

## What it returns

| Field | What it is |
|---|---|
| `_id` | Store id |
| `name`, `description`, `display_image` | Store name, one-line description, an image |
| `sub_domain`, `custom_domain` | `mystore`, and the Blanxer custom domain if any |
| `storefront_url` | The saved link to the custom site, `''` when none. See [Deploy → Link the site](https://developers.blanxer.com/deploy-cloudflare.md#link-the-site-to-blanxer). |
| `plan` | `''` (free), `pos`, `basic`, `premium`, `plus`, `platinum`. Online payments need `basic`, `premium`, `plus` or `platinum`. |
| `customization` | Logo, name, theme colour, font, currency label, top bar, popup, hero images (below) |
| `navigation`, `footer` | Menu items and footer content as set in Blanxer |
| `categories[]` | `_id`, `name`, `slug`, `image`, `order`, `seo_title`, `seo_description`, `seo_image`, `hide_on_product` |
| `blog_categories[]` | `name`, `slug`, `image`, `order`, SEO fields |
| `social` | `facebook`, `instagram`, `tiktok`, `whatsapp` |
| `compliance` | Business details for the footer: `business_name`, `business_address`, `pan`, `registration_number`, `ecommerce_number`, `contact`, `email`, `complain_officer`, `permits`, `outlets`, `exim_code` |
| `checkout` | Which checkout fields are on. See [Checkout → Fields](https://developers.blanxer.com/checkout.md#fields). |
| `addons`, `setting` | Payment add-ons, and payment settings masked to `'yes'` / `''`. See [Checkout → Payment methods](https://developers.blanxer.com/checkout.md#payment-methods). |
| `plugins[]` | `{name, details}`: tracking tags and small features (below) |
| `use_advanced_inventory` | Stock is per outlet. See [Catalog → Stock](https://developers.blanxer.com/catalog.md#stock). |
| `customer_program` | `{enabled, loyalty_enabled, membership_enabled, back_in_stock: {enabled}, login}` |
| `under_construction` | `off`, `sub`, `cus` or `both`. Controls the **Blanxer-hosted** site only. Ignore it in a custom site. |
| `kyc_status`, `blanxer_pay`, `loyalty` | Not needed by a custom site |

### Don't use

- `customer_program.enabled` turns on customer accounts on the Blanxer-hosted site. A custom site has no login (rule 7) and uses guest checkout either way. Use only `customer_program.back_in_stock.enabled`.
- `setting` holds payment configuration. Only test the masked keys listed in the checkout guide for truthiness. Don't display, log or depend on any other value in it.

## Brand and theme

From `customization`:

| Field | Use | Default when empty |
|---|---|---|
| `brand_name` | Store name in the header, titles, JSON-LD | `name` |
| `brand_logo` | Logo URL | Show the name as text |
| `favicon` | Favicon URL | Your own |
| `theme` | Primary colour (below) | `violet` |
| `font` | A Google Fonts family name, e.g. `Poppins` | `Poppins` |
| `currency_indicator` | Currency label before prices | `रू` |
| `image_ratio` | The shape new product photos are cropped to on upload: `1` = 1:1, `2` = 4:5, `3` = 9:16. Use it for product card frames. Older photos may have other shapes, so use `object-fit` | 1:1 |
| `top_bar_text`, `top_bar_goto` | Announcement bar text and link | No bar |
| `popup_image`, `popup_goto` | A promo popup image and its link | No popup |
| `hero_images[]`, `hero_taglines[]`, `hero_links[]` | Home hero slides (image, tagline, link, by index) | Design your own |

The `top_bar_color` plugin, when present, gives the bar's colours: `details: {bg, text}`.

These are **defaults** for the design brief. The merchant may want a different look; the site's design lives in the site (rule 12). If they want the shared brand values changed (also on the Blanxer-hosted site and in emails), use `blanxer_update_store_profile` / `blanxer_update_appearance` through the MCP.

### Theme colour

`customization.theme` is either a palette name or `custom#RRGGBB`.

- **`custom#RRGGBB`**: the merchant picked their own colour. It is the exact primary colour.
- **A name**: one of the palettes below (10 shades, 50 → 900). The Blanxer storefront's buttons use shade 600, hover 700.

| `theme` | Shade 50 | Shade 600 (buttons) | Shade 900 |
|---|---|---|---|
| `dark` | #C9C9C9 | #2e2e2e | #141414 |
| `gray` | #f8f9fa | #868e96 | #212529 |
| `red` | #fff5f5 | #fa5252 | #c92a2a |
| `oliz_red` | #fef2f2 | #db272a | #7f1d1f |
| `pink` | #fff0f6 | #e64980 | #a61e4d |
| `baby_pink` | #fff7fa | #ffa5c2 | #f9739e |
| `grape` | #f8f0fc | #be4bdb | #862e9c |
| `violet` | #f3f0ff | #7950f2 | #5f3dc4 |
| `indigo` | #edf2ff | #4c6ef5 | #364fc7 |
| `blue` | #e7f5ff | #228be6 | #1864ab |
| `cyan` | #e3fafc | #15aabf | #0b7285 |
| `teal` | #e6fcf5 | #12b886 | #087f5b |
| `green` | #ebfbee | #40c057 | #2b8a3e |
| `lime` | #f4fce3 | #82c91e | #5c940d |
| `yellow` | #fff9db | #fab005 | #e67700 |
| `orange` | #fff4e6 | #fd7e14 | #d9480f |
| `brown` | #f6f4f0 | #816a4d | #4e3e35 |
| `blanxer_purple` | #f6f2ff | #8830f7 | #54169c |
| `blanxer_red` | #fff1f2 | #ed1520 | #88141a |
| `blanxer_blue` | #eff8ff | #007ace | #084572 |
| `blanxer_green` | #eefff5 | #01b859 | #0a5d35 |

Map the primary colour to a CSS variable (the name below is an example) and pass it to the package components through their `theme` prop or CSS variables:

```tsx
// app/layout.tsx
import { getStore } from '@blanxer/storefront/server';

const NAMED: Record<string, string> = { violet: '#7950f2', blue: '#228be6' /* ...from the table */ };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const t = store.customization?.theme || 'violet';
  const primary = t.startsWith('custom#') ? t.slice(6) : NAMED[t] ?? NAMED.violet;
  return (
    <html lang="en" style={{ ['--bx-primary' as string]: primary }}>
      <body>{children}</body>
    </html>
  );
}
```

### Font

Load the store's font with `next/font/google`, not a `<link>` to Google Fonts (rule 11: at most 2 families, self-hosted, no layout shift):

```tsx
import { Poppins } from 'next/font/google';
const font = Poppins({ subsets: ['latin'], weight: ['400', '600'], display: 'swap' });
```

`next/font` needs the family at build time. Read `customization.font` once while scaffolding, and change the import if the merchant changes the font later.

## Menus and footer

- `navigation.items` is a list of `{label, goto, items}` (nested for dropdowns). `navigation.style` and `navigation.extras` are Blanxer layout settings; a custom site may ignore them.
- `footer.details` holds the footer content the merchant set. Its shape depends on `footer.style` (one per Blanxer footer layout), so inspect it for the store you are building.
- Restyle both freely. Keep the merchant's labels and links.
- **Links to `/p/<slug>`** are Blanxer page-builder pages. Custom sites don't have them (and Blanxer's sitemap leaves them out once the site link is saved). Ask the merchant what each should become, or leave it out.
- Other `goto` values use the same paths as a custom site (`/collections/<slug>`, `/product/<slug>`, `/brand/<slug>`, `/blogs`), or are full URLs.
- If `compliance` has values, show them in the footer: Nepali e-commerce stores usually display their business name, address, PAN/registration and complaint officer.

## Plugins

`plugins` is a list of `{name, details}`. The ones a custom site uses:

| `name` | `details` | Use |
|---|---|---|
| `meta_tags` | `[{n, c}]`: `<meta name={n} content={c}>` | Search Console verification and other verification tags. See [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md#search-console-verification). |
| `ga` | `"G-XXXXXXXXXX"` | Google Analytics 4 |
| `gtm` | `"GTM-XXXXXXX"` | Google Tag Manager |
| `fb_pixel` | Pixel id | Meta Pixel |
| `meta_capi` | `true` | The store has Meta Conversions API on; relay events (the token stays on the server) |
| `clarity` | Project id | Microsoft Clarity |
| `whatsapp_chat` | `{phone}` | WhatsApp chat button |
| `tawk` | `{p, w}` | Tawk.to chat: property and widget id |
| `top_bar_color` | `{bg, text}` | Announcement bar colours |
| `product_custom_options` | `{showProductStock, outOfStockBaseValue, ...}` | Stock display on product pages |

Delivery-partner plugins are removed from this payload. Treat any other plugin as Blanxer-internal.

## The site's own origin

- In the browser, the site's origin is `window.location.origin`. The checkout sends it as `url` (rule 4).
- On the server (metadata, JSON-LD, sitemap index, robots), use `siteOrigin()` from the package. It is meant to return the origin the site is being served on, so it stays right on `*.workers.dev`, on the custom domain and on `localhost`. (Package API as planned; see the package README for the released behaviour.)
- `storefront_url` is what Blanxer uses for links it sends. Don't hardcode it in the site either; it changes when the merchant adds a custom domain.
