# Troubleshooting

Find the symptom, then the fix. API errors come back as HTTP 400 `{"message": "..."}` unless noted; validation errors as `{"error_type": "zod_validation", "fields": {...}}` or `{"fields": {...}}`.

## Checkout and payments

### The shopper gets a 404 after paying

The gateway returned to `<url>/payment/success` or `<url>/payment/failed`, and that page doesn't exist on the site.

- Add `/payment/success`, `/payment/failed` and `/track/[id]` at exactly these paths, with the package's `PaymentSuccess`, `PaymentFailed` and `OrderTracking` (rule 3).
- `url` must be the site's origin with no path and no trailing slash: `window.location.origin`. Blanxer appends `/payment/success` to it as is.
- Never hardcode `url` (rule 4). A hardcoded `workers.dev` origin sends shoppers back to the old host after the custom domain is added.

### `/payment/success` sends the shopper to the home page instead of their order

The success page reads the order id from `sessionStorage['checkout_order_id']`, which only exists on the origin where the checkout ran.

- Serve the site on **one** host. Redirect `www` to the apex (or the reverse) so checkout and success are on the same origin.
- Don't clear `sessionStorage` in your own code.
- A shopper who finished paying on another device or browser has no session there; they land on `/`. Their order is fine and the confirmation email links to `/track/<id>`.

### `Selected delivery city not found, please try again`

The order's `customer_address_city` doesn't exactly match a place name in the store's delivery table.

- Fill the place select only from `GET /public/delivery_charge/<store_id>`. Never type place names into the code.
- Send the place **name** as `customer_address_city`, not the address.
- The merchant may have renamed a place; the site's cached table is at most a minute old. Reload.

### `Cash on delivery is not available for the selected delivery location`

The order asked for COD at a place where the store turned COD off.

- COD is allowed only when the place's flag is `true` or `'Y'`. A check like `!!cod` treats `'N'` as yes: that is a known bug in the Blanxer-hosted storefront; the package doesn't copy it.
- When the shopper changes the place and COD disappears from the list, the selected method must change too (the first available one).

### The coupon shows a discount, but the order has none

The order was sent with the coupon **code** (`"coupon": "DASHAIN10"`). The server only reads `coupon` when it is longer than 20 characters (an id), so a code is ignored **silently**: no discount, no error.

- Send the `_id` returned by `POST /public/coupon` (rule 2: use the package's checkout, which does this).
- Compare the order response: `total_price` already has the discount taken off.

### Coupon errors

| Message | Cause |
|---|---|
| `Coupan not found` | No coupon with that exact code in this store. Codes are case-sensitive: the input is upper-cased, but a `?promo=` link is sent as written, so `?promo=dashain10` fails for `DASHAIN10` |
| `Coupon not found` (at order time) | The coupon `_id` sent with the order no longer exists |
| `Coupon is inactive` | Turned off in Blanxer |
| `All the available coupons have been used.` | Used up. For a coupon with a usage limit, each successful apply also holds a use for about 12 seconds, so on the last use an order placed right after Apply can fail with this. Wait a few seconds and place it again |
| `Coupon code not available` / `Coupon code is expired` | Before its start / after its end |
| `Coupon is not applicable to any products` | A category coupon and no line in those categories |
| `Coupon is only applicable for order value above N` | Subtotal + customization + delivery under the minimum |
| `Only cash on delivery can use this coupon` / `Only online payment method can use this coupon` | Payment method restriction |
| `This coupon is not valid for <place>` | Place restriction |

### `Valid Return URL is required`

`POST /payment/esewa/init`, `/payment/khalti/init` and `/payment/fonepay/init` reject `http://localhost:3000` as `url`. Test on `http://127.0.0.1:3000`, on the OpenNext preview opened via `127.0.0.1`, or on the deployed site.

### `Variant selection required for this product` / `Either of the selected product has been modified, please add to cart again`

- The cart line has no `variant`, or a variant `_id` that no longer exists (the merchant edited the variants).
- Make sure `AddToCart` stores the variant **`_id`**, not its name.
- For old carts: drop the line and ask the shopper to add it again.

### `Please choose a print for <name>`

The product has a required print add-on, and the line has no `print_id`. The package has no print picker yet, so it can't sell that product. Ask the merchant to make the print optional, or leave the product off the site for now. See [Checkout → Print add-on products](https://developers.blanxer.com/checkout.md#print-add-on-products).

### `Either of the selected product is already deleted` / `... is out of stock`

The product is no longer Active, or the stock is lower than the quantity (and it doesn't continue selling). Refresh the cart from the product data.

### `The last units of an item in your cart are in other shoppers' checkouts right now...`

Other shoppers hold the last units while they pay. It clears within the hold time (5 minutes; 2–5 during a flash sale). Show the message as is.

### HTTP 429 when placing orders

More than 5 order requests in 10 minutes from one IP for one store. Every request counts, including `0000000000` test orders and failed ones. The body is plain text (`Too many requests, please try again later.`), not JSON; handle that. If **every** shopper hits it, orders are being sent from the server (one shared Worker IP for everyone): move the call to the browser (rule 5).

### The QR payment never confirms

- The page checks while the tab is **visible** (every 5 s for Fonepay QR, 10 s for Checkout by Fonepay) and when the shopper returns to it. Ask them to come back to the tab or press "Check payment".
- Never close the QR or release the hold on tab switch; shoppers pay in their banking app with the QR open.
- `Payment not received` from the check endpoint only means "not yet".

### The eSewa page shows an error from api.blanxer.com after the shopper cancels

eSewa sends both success and failure back to the same API endpoint. A return without eSewa's `data` parameter may end on an API error page instead of `/payment/failed`. This is on Blanxer's side and is being verified; the order stays `Inactive`, and the shopper can go back to the site.

### Khalti shows an error before redirecting

Khalti's own error text is passed through (for example a minimum amount or a configuration problem). Show it; the merchant may need to fix their Khalti settings in Blanxer. If it reads `[object Object]`, Khalti returned a structured error; check the store's Khalti keys in Blanxer.

## Catalog and data

### A Draft or POS-only product page is visible

`GET /product/public/<store_id>/<slug>` also returns non-Active (`Draft`, `Archived`) and POS-only products. The page must call `notFound()` unless `status === 'Active' && channel !== 3`; the package's `getProduct()` returns `null` for them. See [Catalog → One product](https://developers.blanxer.com/catalog.md#one-product).

### A product page shows "Product not found" as an error instead of a 404

An unknown slug is HTTP **400** `Product not found`, not 404. Catch it and call `notFound()`.

### Prices or stock lag behind the dashboard

The site caches data for 60 seconds. The API caches the product lists for up to 1 hour and clears them when the merchant saves products, categories or settings. Orders don't clear it, so stock in lists can lag by up to an hour; the product page itself isn't cached by the API. The checkout always charges the current server price and checks the current stock.

### `Domain not in use`

`BLANXER_STORE` is wrong. It is the subdomain only (`mystore`), not `mystore.blanxer.io` and not the custom-site domain.

### Server-side reads fail with Cloudflare error 1010

Public reads have been checked to work from plain `fetch`, `curl` and Node. The package sends a normal `User-Agent`. If a Worker still gets 1010, report it to Blanxer with the time and URL; don't work around it with a proxy.

## SEO

### The catalog sitemap or product feed links to `<sub>.blanxer.io`

The site link isn't saved in Blanxer. Call `blanxer_set_storefront_url` (preview, then `{ dry_run: false, confirm_token }`), or the merchant saves it in BlanxerAPI → Your website. The API uses it on the next request, but HTTP caches (`max-age=3600`, plus `stale-while-revalidate`) and the site's own `/sitemap-catalog.xml` can serve old links for an hour or more.

### Search Console says the verification tag is missing

- Check the home page source for `<meta name="google-site-verification" ...>`. The site must render the store's `meta_tags` plugin (`verificationMetadata(store)`).
- After `blanxer_set_site_verification`, wait about a minute for the API and site caches.
- The property in Search Console must be the exact host the site is served on (`https://mystore.com/`, not `www.` if that redirects).

### The shopper got no confirmation email

- With `checkout.receiver_info` on and a sender name filled, the email goes only to `sender_email`; none is sent when that is empty.
- Online orders are emailed only once paid. COD orders are emailed when created.

### Confirmation emails link to the wrong site

The email uses the `url` sent with **that** order. Orders placed before a domain change keep the old link. Make sure the checkout sends `window.location.origin`.

## Deploy

### The Worker is over 3 MiB

The Workers free plan allows 3 MiB compressed. Tell the merchant before deploying, then:

- remove heavy server-side dependencies (whole icon sets, UI kits, date libraries, markdown/PDF tools used on the server);
- keep large libraries out of server components;
- or move to the $5/month Workers paid plan (10 MiB).

See [Deploy → Worker size](https://developers.blanxer.com/deploy-cloudflare.md#worker-size).

### `wrangler` deploys to the wrong Cloudflare account

Run `npx wrangler whoami`. If it's not the merchant's account, `npx wrangler logout`, then `npx wrangler login` and have the merchant sign in. With several accounts, set `CLOUDFLARE_ACCOUNT_ID`.

## Images

### Images too big / the image budget fails

Every file in `public/` must be ≤ 300 KB and ≤ 2560 px wide, as AVIF/WebP, rendered with `next/image` and a size. Re-run `npx blanxer-storefront images` with the right export width for the slot (hero 2560, banner 1600, card 800). Never commit originals. Product photos belong in Blanxer, loaded through `blanxerImageLoader`. See [Images and speed](https://developers.blanxer.com/images-and-speed.md).

## `npx blanxer-storefront check` failures

| Failure | Fix |
|---|---|
| Missing route `/checkout`, `/payment/success`, `/payment/failed` or `/track/[id]` | Add it at that exact path with the package component |
| Secret found | Remove it from code, `.env` and the build. No key is ever needed (rule 6) |
| `/customer/auth` or `/customer/account` call, or a login/account/wishlist/rewards page | Remove it (rule 7). Only `/customer/stock-alert` is allowed |
| Order or payment call outside the browser | Move it into a client component; no server actions or route handlers for orders, coupons, payments, holds or stock alerts (rule 5) |
| Image budget | See above |
| No image marked as main (warning) | Add `preload` to each page's main (LCP) image. See [Images and speed](https://developers.blanxer.com/images-and-speed.md#loading-images) |
| Lighthouse under 90 / LCP over 2.5 s | See [Images and speed → When the check fails](https://developers.blanxer.com/images-and-speed.md#when-the-check-fails) |
