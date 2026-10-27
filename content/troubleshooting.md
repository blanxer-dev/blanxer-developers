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

On a store **without** Offers: the order was sent with the coupon **code** (`"coupon": "DASHAIN10"`). The server only reads `coupon` when it is longer than 20 characters (an id), so a code is ignored **silently**: no discount, no error.

- Send the `_id` returned by `POST /public/coupon` (rule 2: use the package's checkout, which does this).
- Compare the order response: `total_price` already has the discount taken off.

On a store **with** Offers, send the typed code as `code` (and `coupon: ''`). See [Checkout → The order on an Offers store](https://developers.blanxer.com/api-docs/checkout.md#the-order-on-an-offers-store).

### Coupon errors

For stores without Offers (`POST /public/coupon` and the order's `coupon`).

| Message | Cause |
|---|---|
| `Coupan not found` | No coupon with that code in this store. Codes are not case-sensitive (`dashain10`, also from `?promo=`, finds `DASHAIN10`), so check the spelling |
| `Coupon not found` (at order time) | The coupon `_id` sent with the order no longer exists |
| `Coupon is inactive` | Turned off in Blanxer |
| `All the available coupons have been used.` | Used up. Applying holds nothing, so this means real orders took every use. Uses come back when those orders are cancelled, fail to pay or are abandoned at the QR |
| `This coupon has just been used up` (at order time) | Another order took the last use a moment earlier |
| `Coupon code not available` | Before its start, or (at order time) a retention code sent to another phone number |
| `Coupon code is expired` | After its end |
| `Coupon is not applicable to any products` | A category coupon and no line in those categories |
| `Coupon is only applicable for order value above N` | Subtotal + customization + delivery under the minimum |
| `Only cash on delivery can use this coupon` / `Only online payment method can use this coupon` | Payment method restriction |
| `This coupon is not valid for <place>` | Place restriction |
| HTTP 429 `Too many requests, please try again later.` | More than 40 coupon checks in 10 minutes from one IP. Check when the shopper presses Apply, not on every keystroke or cart change |

### A discount code is rejected

On a store with Offers, the quote's `code` is `{"status": "rejected", "reason": "...", "message": "..."}`, and an order with that code fails with HTTP **401** `{"fields":{"code":"<message>"}}`. Show the message under the code field. The reasons:

| `reason` | `message` |
|---|---|
| `not_found` | `This code isn't valid.` (also a personal code used with another phone number) |
| `not_active` | `This code isn't active right now.` (paused or archived) |
| `not_started` | `This code isn't active yet.` |
| `ended` | `This code has expired.` |
| `used_up` | `This code has been fully used.` |
| `customer_used` | `You've already used this code.` |
| `need_phone` | `This code is once per customer: add the customer's phone first.` Send `phone` in the quote |
| `channel` | `This code can't be used here.` (the offer isn't on for the website) |
| `payment` | `This code only works with cash on delivery.` / `This code only works with online payment.` |
| `place` | `This code isn't available for delivery to <place>.` |
| `customer` | `This code is for first orders only.` / `This code is for members only.` |
| `min_amount` | `Add Rs <amount> more to use this code.` (products before discounts, without delivery) |
| `min_qty` | `Add <n> more item(s) to use this code.` |
| `no_items` | `Nothing in your cart can use this code.` |
| `not_better` | `<CODE> would save Rs <a>, but it doesn't combine with <offers>, which save Rs <b> — so we kept it.` or `<CODE> doesn't combine with <offer>, which is already applied.` The automatic offers already save more |

- Only one code per order. A second code replaces the first.
- A free-delivery code entered before the place is picked says `<CODE> applied — delivery discount shows once the place is picked`. That is `applied`, not an error.

### The order fails with "... has just been fully used. Please review your order."

Another order took the last use of an offer or code between the quote and the order (`"<offer>" has just been fully used...`, `The code <CODE> has just been fully used...`, or `You've already used "<offer>".` for a once-per-customer offer). HTTP 400 `{message}`. Quote again and let the shopper review the new price before placing the order again.

### HTTP 429 from the quote

More than 300 quotes in 10 minutes from one IP. The body is plain text. Quote only when the lines, code, place, payment method or phone change, debounce it (the package's `useCartQuote` does), and never quote from the server: every visitor would share the Worker's IP (rule 5). The package keeps the last quote and tries again.

### The price on the page differs from the order

On a store with Offers, the site worked the prices out itself, or showed the catalog price, instead of showing the quote (rule 13). The order is always priced by the server, so the shopper pays the server's number.

- Show the quote's `totals`, `lines[].net` and `applications`. Don't apply percentages, tiers or codes in the site's code.
- Quote again after every change to the lines, code, place, payment method or phone, and drop answers to older requests.
- Add customization charges to the quote's `total`; the quote leaves them out.
- Don't send gift lines (`added_by`) back: a gift sent as a normal line is an extra item at full price, next to the gift the server adds again.
- Older package versions (0.1.x) don't know Offers. Update to 0.2.0.

### A gift doesn't appear

- The cart hasn't reached the offer's minimum yet: the quote's `messages` say how much is missing.
- The gift is out of stock (at the website's outlet on an advanced-inventory store, in the product's quantity on a simple one). The quote says `The free <name> is out of stock`; the checkout still works without it.
- The shopper removed it: its offer id is in `removed_offers`. Restoring it (`restoreOffer` in the package) brings it back.
- Some gift offers don't add the gift by themselves: the quote has an `eligible` message (`Add your free gift — <offer>`), and the gift is free once the shopper puts it in the cart. With several gifts, the server adds the first one in stock unless the shopper picked one (`gift_choices`).

### The offers don't show at all

- `GET /public/promotions/<store_id>` says `enabled: false`: the store isn't on Offers (the merchant turns it on in Blanxer → Offers). The coupon flow is right.
- `enabled: true` but `data` is empty: no public offer is live for the website. Offers on POS or manual orders only, hidden offers and personal codes are never listed.
- Offers was turned on a moment ago: the package only asks for offers when the store data (`check_domain`) carries the `offers` plugin, and the site caches that for about a minute. Reload after a minute.
- Your own code reads the flag from `check_domain`: use `GET /public/promotions/<store_id>` (`useOffers().enabled`) for the live state.

### `Valid Return URL is required`

`POST /payment/esewa/init`, `/payment/khalti/init` and `/payment/fonepay/init` reject `http://localhost:3000` as `url`. Test on `http://127.0.0.1:3000`, on the OpenNext preview opened via `127.0.0.1`, or on the deployed site.

### `Variant selection required for this product` / `Either of the selected product has been modified, please add to cart again`

- The cart line has no `variant`, or a variant `_id` that no longer exists (the merchant edited the variants).
- Make sure `AddToCart` stores the variant **`_id`**, not its name.
- For old carts: drop the line and ask the shopper to add it again.

### `Please choose a print for <name>`

The product has a required print add-on, and the line has no `print_id`. The package has no print picker yet, so it can't sell that product. Ask the merchant to make the print optional, or leave the product off the site for now. See [Checkout → Print add-on products](https://developers.blanxer.com/api-docs/checkout.md#print-add-on-products).

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

`GET /product/public/<store_id>/<slug>` also returns non-Active (`Draft`, `Archived`) and POS-only products. The page must call `notFound()` unless `status === 'Active' && channel !== 3`; the package's `getProduct()` returns `null` for them. See [Catalog → One product](https://developers.blanxer.com/api-docs/catalog.md#one-product).

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

See [Deploy → Worker size](https://developers.blanxer.com/api-docs/deploy-cloudflare.md#worker-size).

### `wrangler` deploys to the wrong Cloudflare account

Run `npx wrangler whoami`. If it's not the merchant's account, `npx wrangler logout`, then `npx wrangler login` and have the merchant sign in. With several accounts, set `CLOUDFLARE_ACCOUNT_ID`.

## Images

### Images too big / the image budget fails

Every file in `public/` must be ≤ 300 KB and ≤ 2560 px wide, as AVIF/WebP, rendered with `next/image` and a size. Re-run `npx blanxer-storefront images` with the right export width for the slot (hero 2560, banner 1600, card 800). Never commit originals. Product photos belong in Blanxer, loaded through `blanxerImageLoader`. See [Images and speed](https://developers.blanxer.com/api-docs/images-and-speed.md).

## `npx blanxer-storefront check` failures

| Failure | Fix |
|---|---|
| Missing route `/checkout`, `/payment/success`, `/payment/failed` or `/track/[id]` | Add it at that exact path with the package component |
| Secret found | Remove it from code, `.env` and the build. No key is ever needed (rule 6) |
| `/customer/auth` or `/customer/account` call, or a login/account/wishlist/rewards page | Remove it (rule 7). Only `/customer/stock-alert` is allowed |
| Order or payment call outside the browser | Move it into a client component; no server actions or route handlers for orders, coupons, payments, holds or stock alerts (rule 5) |
| Image budget | See above |
| No image marked as main (warning) | Add `preload` to each page's main (LCP) image. See [Images and speed](https://developers.blanxer.com/api-docs/images-and-speed.md#loading-images) |
| Lighthouse under 90 / LCP over 2.5 s | See [Images and speed → When the check fails](https://developers.blanxer.com/api-docs/images-and-speed.md#when-the-check-fails) |
