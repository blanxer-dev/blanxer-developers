# Checkout

> **Use `@blanxer/storefront`'s `Checkout` component. This page documents what it does.** Restyle it with theme props, CSS variables and wrappers (rule 2). Don't rewrite the payment, delivery, coupon or order logic, and don't call payment endpoints yourself. You need this page to theme the checkout safely, to debug it, and to explain it to the merchant.

The checkout behaves like the Blanxer-hosted storefront's checkout (storefront `main` at `cabd695`): the same fields, delivery places and charges, coupons, payment methods, stock holds, flash-sale limits and tracking. Where the package differs from the hosted storefront, this page says so. The hosted storefront also has a few store-specific checkout variants; the package doesn't port them.

The server re-checks the order. Prices, stock, delivery charges, COD and coupons are recomputed on the server; what the browser shows is a preview. Two things are taken from the request as sent: each line's `customization_charge` and its custom-field values.

## The flow at a glance

1. The page loads the store (`check_domain`) on the server. The delivery table is loaded on the server when you pass it to `Checkout` as `delivery` (the starter does); without it, the package fetches it in the browser.
2. The shopper fills the form, picks a delivery place and a payment method, and may apply a coupon.
3. The browser sends `POST /order/<store_id>` with the cart lines, the form, the payment method, the coupon `_id` and `url` = the site's own origin.
4. The API creates the order. COD orders are `Pending` and stock is reduced at once. Online orders are `Inactive` and their units are held while the shopper pays.
5. **COD:** the browser goes to `/track/<order_id>?from=checkout`.
   **Redirect gateways** (eSewa, Khalti, FonePay, NPX, Nabil card): the browser starts the payment and leaves for the gateway. The gateway returns to the API, and the API redirects to `<url>/payment/success` or `<url>/payment/failed`.
   **In-page QR** (Fonepay QR, Blanxer QR, Checkout by Fonepay): a QR modal opens with a hold timer. The browser polls for the payment, then goes to `/payment/success`.
6. `/payment/success` forwards to `/track/<order_id>?from=checkout`.

Everything in steps 3–6 runs in the browser (rule 5).

## What the checkout needs

| Input | From | Notes |
|---|---|---|
| Store config | `GET /store/check_domain?domain=<subdomain>` | `_id`, `plan`, `addons`, `setting`, `checkout`. Load it on the server. (The hosted storefront uses `POST /store/check_domain?d=<domain>` with body `{domain}`; both return the same.) |
| Delivery table | `GET /public/delivery_charge/<store_id>` | Load it on the server and pass it as `delivery`. |
| Cart lines | The browser, `localStorage['cart_items']` | Only the selected lines are ordered (`localStorage['cart_selection']`). |
| `url` | `window.location.origin` | No trailing slash. Never hardcode it (rule 4). |

### A cart line

```ts
interface CartLine {
  id: string;                     // `${product}_${variant}` (see below)
  product: string;                // product _id
  variant: string;                // variant _id, '' for a product without variants
  quantity: number;
  product_name: string;
  variant_name: string;           // the variant's option_name, e.g. "Red/XL"
  price: number;                  // display only; the server uses its own price
  compare_at_price: number;
  weight: number;                 // kg, per unit: the variant's weight if it is a number, else the product's
  image_url: string;
  sku?: string;
  custom_fields: string[];        // serialized, see "Custom fields"
  customization_charge?: number;  // per unit, from paid custom fields
}
```

- **Line id:** `${product}_${variant}`. Adding the same product and variant again adds to that line's quantity, even when the custom-field values differ; the line keeps its first values. Only team-order adds (`addManyToCart`) give each line with custom fields its own id. The hosted storefront also gives print lines their own id (`_${printId}` appended).
- **Storage keys** match the hosted storefront (`cart_items`, `cart_selection`, `promo_code`, `checkout_order_id`, `pixel_purchase_pending`), except back-in-stock: the package uses `stock_alerts`, the hosted storefront `bx_stock_alerts`.

## Fields

Field names are the keys of the order request body. "Server" is the backend's zod schema for `POST /order/:store_id`.

| Field | Shown | Required | Browser check | Server rule |
|---|---|---|---|---|
| `customer_full_name` | Always | Yes | Not empty | 2–120 characters |
| `customer_phone_number` | Always | Yes | `/^[0-9]{10}$/` | Exactly 10 characters: `Phone number must be of 10 digit` |
| `customer_alt_phone_number` | Always, labelled optional | No | Empty, or `/^[0-9]{10}$/` | Empty or 10 digits: `Alternate phone number must be of 10 digit` |
| `customer_email` | Always | When `checkout.extras.email_required` | Valid email when required | Valid email or `''`. Lower-cased; a trailing `.con` becomes `.com`. Missing when required: HTTP **401** `{"fields":{"customer_email":"Email address is required"}}` |
| `customer_address_city` | Always (the delivery place select) | Yes | Not empty | 2–320 characters, and must equal a place name in the delivery table |
| `customer_address` | Always | Yes | Not empty | 2–320 characters |
| `customer_address_landmark` | Always | No | — | ≤ 320 characters |
| `order_note` | Always | No | — | ≤ 320 characters: `Max 320 character is allowed` |
| `sender_full_name` | When `checkout.receiver_info` | Yes, when shown | Not empty | ≤ 200 characters |
| `sender_phone_number` | When `checkout.receiver_info` | Yes, when shown | `/^[0-9]{10}$/` | ≤ 15 characters |
| `sender_email` | When `checkout.receiver_info` | When `checkout.extras.sender_email_required` | Valid email when required | Valid email or `''`. Missing when required: HTTP **401** `{"fields":{"sender_email":"Sender email address is required"}}` |
| `company_name` | When `checkout.pan` | No | — | ≤ 50 characters |
| `pan` | When `checkout.pan` | No | — | ≤ 9 characters |
| `delivery_date` | When `checkout.estimated_delivery` | No | Date input, minimum today | Optional string; sent as `YYYY-MM-DD` |

Layout rules the component follows:

- With `checkout.receiver_info` on, the form has "1. Sender Information" (the `sender_*` fields) and "2. Receiver Information" (the `customer_*` fields plus the delivery place and address). The receiver is the person the parcel goes to.
- **Confirmation email:** when `sender_full_name` is set, it goes only to `sender_email`, and to nobody when that is empty. Otherwise it goes to `customer_email`. COD orders are emailed when they are created; online orders only once paid.
- Without it, the form has "1. General Information" and a separate "Delivery Address" block.
- The Blanxer storefront shows Company Name and PAN/VAT together when `checkout.pan` is on.
- `checkout.extras.checkout_note`, when not empty, is shown under the total.
- The delivery place defaults to the first place in the table.

## "Checkout Powered by Blanxer"

The package's `Checkout` always renders this line under the place-order button:

```html
<p class="bx-powered-by">Checkout Powered by <a href="https://blanxer.com" target="_blank" rel="noopener noreferrer">Blanxer</a></p>
```

- It is part of the checkout (rule 2, owner decision 2026-10-11). There is no prop to remove it.
- Restyle it through `.bx-powered-by` and `.bx-powered-by a` (colour, size, font, spacing, alignment).
- Never remove, hide, cover or blend it into the background. Your own `footer` content goes below it.

## Delivery places and charges

`GET /public/delivery_charge/<store_id>` returns:

```json
{
  "defaults": [100, 150, 200, 250, 300, 400],
  "places": [
    ["Kathmandu Inside Ring Road", true, 100, -1, -1, -1, -1, -1],
    ["Pokhara", "N", 150, 200, 250, 300, 350, 500],
    ["Ilam", "Y", -1, -1, -1, -1, -1, -1]
  ]
}
```

- `defaults` has 6 numbers, one per weight bracket.
- Each place is `[name, cod, ≤1 kg, ≤2 kg, ≤3 kg, ≤5 kg, ≤10 kg, >10 kg]`.
- `-1` in a place means "use the default for that bracket".
- A store that never saved a table gets 83 default places, all with COD on, all `-1`, and defaults of `0`: free delivery everywhere. The merchant edits the list in Blanxer (or you do, with the MCP and their confirmation).

### The rules

- **Weight** = the sum of `weight × quantity` over the ordered lines, in kg. The server uses the variant's weight for a variant line (0 when the variant has none) and the product's weight otherwise. The cart line falls back to the product's weight when the variant has none, so the preview can show a different delivery charge than the order.
- **Bracket index**: the first of `[1, 2, 3, 5, 10]` that the weight is `<=`; above 10 kg it is index 5.
- **Charge** = `place[index + 2]`; if that is below 0, `defaults[index]`.
- **COD is allowed for a place when `cod === true || cod === 'Y'`.** That is the server's rule. The Blanxer storefront uses `!!cod`, which treats `'N'` as yes; don't copy that.
- The place name must match exactly. An unknown place fails the order with `Selected delivery city not found, please try again`.

```ts
type DeliveryTable = { defaults: number[]; places: [string, boolean | string, ...number[]][] };

const BRACKETS = [1, 2, 3, 5, 10];

export function deliveryFor(table: DeliveryTable, place: string, weightKg: number) {
  let i = BRACKETS.findIndex((max) => weightKg <= max);
  if (i === -1) i = BRACKETS.length; // > 10 kg
  const row = table.places.find((p) => p[0] === place);
  if (!row) return { charge: 0, cod: false, known: false };
  const n = (v: unknown) => (v === '' || v == null || isNaN(Number(v)) ? 0 : Number(v));
  const own = n(row[i + 2]);
  const cod = row[1] === true || row[1] === 'Y';
  return { charge: own < 0 ? n(table.defaults[i]) : own, cod, known: true };
}
```

## Payment methods

The list is built from the store config. **Never add or remove a method by hand (rule 9).**

- **COD** is offered when the chosen place allows it (see above). It comes first.
- **Online methods** are offered only when `plan` is one of `basic`, `premium`, `plus`, `platinum`. On any other plan (free) the checkout is COD only.

In this order:

| `paymentMethod` | Offered when | Label in the Blanxer storefront | Flow |
|---|---|---|---|
| `COD` | The chosen place allows COD | Cash on delivery | No payment call |
| `QR_Dynamic` | `addons.fonepay_dynamic && setting.fonepay_dynamic_key` | Fonepay QR Payment | In-page QR |
| `FonepayCheckout` | `addons.fonepay_checkout && setting.fonepay_checkout_key` | Checkout by Fonepay | In-page QR + bank app links |
| `QR` | `addons.qr_request_enabled` | QR Payment | In-page QR (Blanxer QR) |
| `Esewa` | `addons.esewa && setting.esewa_secret` | Esewa | Form post to eSewa |
| `FonePay` | `addons.fonepay` | FonePay | Redirect |
| `Khalti` | `addons.khalti` | Khalti | Redirect |
| `NPX` | `addons.npx` | Nepal Payment Solution | Form post |
| `nbank_card` | `addons.nbank_card` | Visa/Mastercard | Redirect (Nabil Bank) |

- The payment-credential keys in `setting` arrive masked: `'yes'` when set, `''` when not (`fonepay_checkout_pubkey` is always `''`). Other `setting` keys come as stored. Test only the keys in this table, for truthiness.
- Card (Cybersource) is always off: `check_domain` always returns `addons.cybersource: false`.
- The strings are exact and case-sensitive. The server stores whatever string you send, so a typo creates an order no gateway will ever pay. A missing `paymentMethod` is saved as `COD`.
- The first available method is preselected. If the selected method disappears (for example COD after switching to a no-COD place), the package selects the first available one again. (The hosted storefront doesn't; it keeps the old selection and the server refuses it.)
- The server also saves the method as the customer's `preferred_payment_method`, for guests too.
- The server rejects COD for a place without COD: `Cash on delivery is not available for the selected delivery location`.

## Coupons

### Applying a code

```http
POST /public/coupon
Content-Type: application/json

{ "store": "<store_id>", "code": "DASHAIN10",
  "products": [{ "product": "<product_id>", "variant": "<variant_id or ''>", "quantity": 2 }] }
```

Response:

```json
{
  "_id": "6705f0c2a1b2c3d4e5f60718",
  "code": "DASHAIN10",
  "coupon_type": 2,
  "coupon_value": 10,
  "min_order_value": 1000,
  "max_discount_amount": 500,
  "total_applicable_amount": 4200,
  "only_for_cod_payment": false,
  "only_for_online_payment": false,
  "categories": [],
  "places": []
}
```

- The code lookup is exact (case-sensitive). The package and the hosted storefront upper-case what the shopper types.
- The promo code box shows only when `store.plan` is set (not on the free plan).
- Errors are HTTP 400 `{message}`: `Coupan not found` (sic), `Coupon is inactive`, `All the available coupons have been used.`, `Coupon code not available` (not started yet), `Coupon code is expired`, `Cart must not be empty`, `Coupon is not applicable to any products` (category-restricted coupon, no matching product).
- **Each successful apply holds one use of the coupon for about 12 seconds.** That matters only for a coupon with a usage limit: on its last use, an order placed within ~12 seconds of Apply can fail with `All the available coupons have been used.` Call it when the shopper presses Apply, never on every keystroke.
- `total_applicable_amount` is the sum of `price × quantity` of the lines the coupon applies to (all lines, or only lines in the coupon's `categories`).

### Checks in the browser

The package re-checks the coupon on every change: payment method, place, delivery charge and cart total. (The hosted storefront re-checks when the coupon, delivery charge, payment method or place changes, but not when the cart total changes.) These give live feedback; the server enforces the same rules when the order is placed.

| Check | Message |
|---|---|
| `min_order_value !== -1 && subtotal + customization + delivery < min_order_value` | `Coupon is only applicable for order value above <min>` (`<min>` formatted as currency, `en-IN`) |
| `only_for_cod_payment && paymentMethod !== 'COD'` | `Only cash on delivery can use this coupon` |
| `only_for_online_payment && paymentMethod === 'COD'` | `Only online payment method can use this coupon` |
| `places.length && place chosen && !places.includes(place)` | `This coupon is not valid for <place>` |

### The discount

```ts
// coupon_type: 1 = flat, 2 = percent, 3 = shipping (percent of the delivery charge)
export function couponDiscount(c: Coupon, deliveryCharge: number) {
  const base = c.total_applicable_amount;
  const max = c.max_discount_amount; // -1 = no cap
  let d = 0;
  if (c.coupon_type === 1) d = Math.min(base, c.coupon_value);
  if (c.coupon_type === 2) {
    const p = Math.floor((c.coupon_value / 100) * base);
    d = max === -1 ? Math.min(p, base) : Math.min(p, max);
  }
  if (c.coupon_type === 3) {
    const s = Math.floor((c.coupon_value / 100) * deliveryCharge);
    d = max === -1 ? Math.min(s, deliveryCharge) : Math.min(s, max);
  }
  return Math.max(d, 0);
}
```

Total shown = subtotal + customization charges + delivery − discount (the discount only while the browser checks pass).

### Sending it with the order

- **Send the coupon's `_id` as `coupon`, never the code.** The server only looks at `coupon` when it is longer than 20 characters (an id is 24). A code like `DASHAIN10` is **silently ignored**: the order goes through with no discount and no error.
- Send `coupon: ''` when there is no coupon or a browser check fails.
- A `coupon` longer than 20 characters that isn't a valid id fails the order with HTTP 500.
- The server re-validates the coupon. If it fails, the whole order fails with one of: `Coupon not found` (spelled correctly here), `You are not allowed to perform this action` (another store's coupon), `This reward coupon belongs to another account`, `Coupon is inactive`, `All the available coupons have been used.`, `Coupon code not available`, `Coupon code is expired`, `Only cash on delivery can use this coupon`, `Only online payment method can use this coupon`, `This coupon is not valid for <place>`, `Coupon is only applicable for order value above <min>` (the raw number, not formatted), `Coupon is not applicable to any products`.
- The server's discount is final. Its base includes customization charges when the coupon has no category restriction, so it can differ slightly from the preview.

### `?promo=`

Any page opened with `?promo=CODE` stores `CODE` in `localStorage['promo_code']` (`BlanxerProvider` does this). The checkout applies it once each time it opens with cart lines. The package also reads `?promo=` from the checkout URL itself. Use this for shared promo links.

- The stored code stays. It is applied again on later checkouts until another `?promo=` replaces it. (The hosted storefront clears it only on logout.)
- It is sent as stored, not upper-cased. Codes are case-sensitive, so `?promo=dashain10` gets `Coupan not found` for the code `DASHAIN10`. Write promo links with the code exactly as created.

## Custom fields

Some products ask the shopper for extra input (a name to engrave, a photo, a delivery time). The product detail response has them in `custom_fields`, as arrays:

```ts
// [type, label, required, placeholder, options, price]
type RawCustomField = [string, string, boolean, string, (string | { label: string; value: string })[]?, number?];
```

| Type | Input |
|---|---|
| `text` | Text |
| `text_dp` | Text with a price: when filled, `price` is added to the line's `customization_charge` |
| `textarea` | Long text |
| `image` | Image upload (below) |
| `date` | Date, minimum today |
| `time` | One of `8AM - 10AM`, `10AM - 12PM`, `12PM - 2PM`, `2PM - 4PM`, `4PM - 6PM`, `6PM - 8PM`, `8PM - 10PM` |
| `single` | One option (chips under 8 options, a select otherwise); the first option is preselected |
| `multi`, `checkbox` | Several options |

### Serialization

Each filled field becomes one string, `label|||type|||value`:

- arrays are joined with `, `;
- dates are formatted `MMM DD, YYYY` (for example `Oct 24, 2026`);
- an image is its uploaded URL.

```json
["Name on cake|||text|||Asha", "Delivery time|||time|||4PM - 6PM", "Photo|||image|||https://.../public_uploads/.../photo-1234.jpg"]
```

- A required field left empty shows `This field is required` and blocks Add to cart.
- Adding the same product and variant again goes into the existing line, even with different values (see [A cart line](#a-cart-line)).
- `customization_charge` is per unit. Send it on the line only when it is above 0, and send `custom_fields` only when at least one string is not empty.

### Image upload

```http
POST /product/<store_id>/<product_id>/file
Content-Type: multipart/form-data

file=<the image>
csrf_token=<csrf_token from the product detail response>
```

- PNG, JPG, JPEG or WebP, else `Only png, jpg, jpeg, webp file is allowed!`. At most 5,900,000 bytes, else `You can only upload at max 5MB file`. No file: `File wasn't supplied.`
- Response: `{"success": true, "file": {"file_url": "https://...", ...}}`. Use `file.file_url` as the field's value.
- The file is stored as `public_uploads/<store_id>/<product_id>_<name>-<4 digits><ext>`.
- The server does not currently check `csrf_token` or that the product exists; send the real values anyway.
- Upload from the browser.

## The order request

```http
POST /order/<store_id>
Content-Type: application/json
```

```ts
interface OrderRequest {
  products: {
    product: string;
    variant: string;                 // '' for a product without variants
    quantity: number;                // ≥ 1
    customization_charge?: number;   // per unit, only when > 0
    custom_fields?: string[];        // only when at least one is not empty
    print_id?: string;               // the chosen print, for a print add-on product (see below)
  }[];
  meta?: {                           // Meta CAPI dedup, see "Meta events" below
    event_id?: string;               // ≤ 100
    fbp?: string;                    // ≤ 200, the _fbp cookie
    fbc?: string;                    // ≤ 400, the _fbc cookie
    event_source_url?: string;       // ≤ 1000, location.href
  };
  customer_full_name: string;
  customer_phone_number: string;
  customer_alt_phone_number: string; // '' when not given
  customer_email: string;            // '' when not given
  customer_address_city: string;     // the delivery place name
  customer_address: string;
  customer_address_landmark: string;
  order_note: string;
  sender_full_name?: string;         // only with checkout.receiver_info
  sender_phone_number?: string;
  sender_email?: string;
  delivery_date?: string;            // YYYY-MM-DD, only with checkout.estimated_delivery
  pan?: string;
  company_name?: string;
  paymentMethod: 'COD' | 'QR_Dynamic' | 'FonepayCheckout' | 'QR' | 'Esewa' | 'FonePay' | 'Khalti' | 'NPX' | 'nbank_card'; // missing = 'COD'
  url: string;                       // window.location.origin
  coupon: string;                    // coupon _id or ''
}
```

Example:

```json
{
  "products": [
    { "product": "66f1c0ffee0000000000aa01", "variant": "66f1c0ffee0000000000bb07", "quantity": 1 },
    { "product": "66f1c0ffee0000000000aa02", "variant": "", "quantity": 2,
      "customization_charge": 100, "custom_fields": ["Name on cake|||text_dp|||Asha"] }
  ],
  "meta": { "event_id": "b6a3a0e2-1c1e-4f5e-9b8e-2f0c7d9e1a11", "fbp": "", "fbc": "",
            "event_source_url": "https://mystore.com/checkout" },
  "customer_full_name": "Asha Gurung",
  "customer_phone_number": "9800000000",
  "customer_alt_phone_number": "",
  "customer_email": "asha@example.com",
  "customer_address_city": "Pokhara",
  "customer_address": "Lakeside, Ward 6",
  "customer_address_landmark": "Near the boat station",
  "order_note": "",
  "paymentMethod": "Khalti",
  "url": "https://mystore.com",
  "coupon": "6705f0c2a1b2c3d4e5f60718"
}
```

The package sends no `Authorization` header (guest checkout). The hosted storefront sends a Bearer token for logged-in members, for loyalty; customer login is not part of BlanxerAPI.

### Print add-on products

A product can have a print add-on (`print_addon` on the product): the shopper picks a print, and the order line carries its id as `print_id`. When the add-on is on and required, a line without `print_id` fails with `Please choose a print for <name>`; a print that is no longer allowed fails with `The selected print is no longer available for <name>`. The list of prints comes from `GET /print-design/public/<store_id>`, which isn't part of BlanxerAPI yet.

**The package has no print picker yet**, so it can't sell a product whose print is required. Before launch, check the store's products for `print_addon.enabled` and tell the merchant.

### What the server checks, in order

1. The body against the schema (lengths and formats above). Errors: HTTP 400 `{"error_type":"zod_validation","fields":{"<field>":"<message>"}}`. Field keys are body keys, for example `customer_phone_number` or `products.0.quantity`. An empty `products` list: `Atleast a product is required`.
2. The testing short-circuit (see [Testing](#testing-without-creating-an-order)).
3. Email and sender email when the store requires them (HTTP 401, see the table above).
4. Lines with an empty `product` are dropped; if none is left: `Product is required`. Every product exists in this store and is `Active`, else `Either of the selected product is already deleted`.
5. A product with variants has a `variant`, else `Variant selection required for this product`; the print choice (see above); the variant exists, else `Either of the selected product has been modified, please add to cart again`.
6. Stock, unless the product has `continue_selling`: `Either of the selected product is out of stock`. Stores with advanced inventory are checked against the website outlet's stock.
7. Live flash sale limits: `Flash sale: you can buy at most N of "<name>" per order.`
8. The stock hold. When the last units sit in other shoppers' checkouts: `The last units of an item in your cart are in other shoppers' checkouts right now. Please try again in about N minutes.`
9. The delivery place and COD (messages above).
10. The coupon (messages above).

Any other error is HTTP 400 `{"message": "..."}`.

**Rate limit:** more than 5 requests in 10 minutes for one store from one IP (the limiter keys on the store id and `cf-connecting-ip`) is HTTP 429 with the plain-text body `Too many requests, please try again later.` Every request counts, including test orders and failed ones. The limit runs before the test-phone check.

Prices are the server's: the variant's price if it has one, else the product's. The cart's prices are only shown. `customization_charge` and the custom-field values are taken from the request.

### The response

```json
{
  "success": true,
  "_id": "6709a1b2c3d4e5f607182930",
  "order_number": 1042,
  "total_price": 4180,
  "total_quantity": 3,
  "delivery_charge": 150,
  "email": "asha@example.com",
  "slug": "",
  "hold_seconds": 300,
  "hold_expires_at": "2026-10-11T09:15:00.000Z"
}
```

- `total_price` = products + customization charges − discount. **It does not include delivery.** The shopper pays `total_price + delivery_charge`.
- `hold_seconds` and `hold_expires_at` come only for online orders that hold stock.
- `slug` is always `''`.
- COD orders are created as `Pending`. Online orders are created as `Inactive` with `payment_status` `Unpaid`; it becomes `Processing` when a payment starts, and the order becomes `Pending` / `Paid` when the payment is confirmed.

Right after a successful response the component stores, in `sessionStorage`:

- `checkout_order_id` = `_id` (the success page needs it);
- `pixel_purchase_pending` = the Purchase event data, including the `event_id` sent in `meta`.

## Payment flows

Every payment start is a browser `POST` with the same body:

```json
{ "store": "<store_id>", "order": "<order _id>", "url": "https://mystore.com" }
```

The API checks the order belongs to the store, creates a payment transaction for `products + customization + delivery − discount`, and remembers `url` for the return.

- eSewa, Khalti, FonePay (and the unused card route) validate `url` with a strict URL check that **rejects `http://localhost:3000`**: HTTP 400 `{"fields":{"url":"Valid Return URL is required"}}`. Use `http://127.0.0.1:3000` locally, or test on the deployed site.
- QR, Checkout by Fonepay, NPX and Nabil card accept `localhost`. Their bad-URL error is `{"error_type":"zod_validation","fields":{"url":"Invalid url"}}`.
- If the gateway's verification fails, the API sets `payment_status` to `Failed`; the order stays `Inactive`.

### COD

No payment call.

1. Fire the browser Pixel `Purchase` with the stored `event_id` (no CAPI relay; the server already sent the CAPI Purchase for COD).
2. Remove the ordered lines from the cart and clear the two `sessionStorage` keys.
3. `router.replace('/track/<_id>?from=checkout')`.

### eSewa (form post)

`POST /payment/esewa/init` returns the eSewa v2 form:

```json
{
  "action_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  "amount": 4330, "total_amount": 4330,
  "product_service_charge": 0, "product_delivery_charge": 0, "tax_amount": 0,
  "transaction_uuid": "6709a1b2c3d4e5f6071829aa",
  "product_code": "EPAYTEST",
  "success_url": "https://api.blanxer.com/payment/esewa/verify",
  "failure_url": "https://api.blanxer.com/payment/esewa/verify",
  "signed_field_names": "total_amount,transaction_uuid,product_code",
  "signature": "..."
}
```

Build a hidden `<form method="post" action={action_url}>` with one hidden input per key **except** `action_url`, append it to the body and submit it. eSewa returns to the API, which verifies the payment and redirects to `<url>/payment/success` or `<url>/payment/failed`.

- `product_code` `EPAYTEST` means the store is on eSewa's test environment, with the `rc-epay.esewa.com.np` form above. A live store gets `https://epay.esewa.com.np/api/epay/main/v2/form`.
- `success_url` and `failure_url` point at `api.blanxer.com` in production and at `api-dev.blanxer.com` elsewhere.
- **Known limitation (likely, not yet tested):** if the shopper cancels and eSewa returns without a valid `data` parameter, the API answers HTTP 400 JSON on its own host instead of redirecting to `/payment/failed`. The order stays `Inactive`.

### Khalti (redirect)

`POST /payment/khalti/init` returns Khalti's own initiate response, which includes `payment_url` (and `pidx`, `expires_at`, `expires_in`). Set `window.location.href = payment_url`. Khalti returns to the API (`/payment/khalti/verify/<transaction>`), which redirects to success or failed. Khalti's error text is passed through as `{message}`; show it. It can read `[object Object]` when Khalti returns a structured error. Opening the verify link again for an order that is already paid returns HTTP 400 `{"message":"Payment already received"}` on the API host.

### FonePay (redirect)

`POST /payment/fonepay/init` returns `{"url": "https://..."}`. Set `window.location.href = url`.

### NPX, Nepal Payment Solution (form post)

`POST /payment/npx/init` returns `{ "action_url": "...", ...fields, "Signature": "..." }`. Post a hidden form exactly as for eSewa.

### Nabil card (redirect)

`POST /payment/nabil_card/init` returns `{"url": "https://..."}`. Redirect to it. A failed card payment returns to `<url>/payment/failed?method=card`.

### Fonepay QR (`QR_Dynamic`) and Blanxer QR (`QR`)

```http
POST /payment/dynamic_qr/init
{ "store": "...", "order": "...", "url": "...", "self": true }   // QR_Dynamic: the store's own Fonepay
{ "store": "...", "order": "...", "url": "..." }                 // QR: Blanxer QR (needs addons.qr_request === 'approved')
```

Response:

```json
{ "prn": "6709a1b2c3d4e5f6071829aaxkqz", "transaction": "6709a1b2c3d4e5f6071829aa",
  "amount": 4330, "socket_url": "wss://...", "qr_message": "000201010212..." }
```

1. Open a modal. Render `qr_message` as a QR code and show `amount`.
2. Start the hold timer (see [Stock holds](#stock-holds)).
3. Every 5 seconds while the tab is visible, and right away when the shopper returns to the tab, call `GET /payment/dynamic_qr/check/<transaction>`. HTTP 200 `{"success": true}` = paid. HTTP 400 `{"message":"Payment not received"}` = not yet. Payment confirmation itself happens on the server, from Fonepay's websocket.
4. A **Check Payment** button runs the same check and says `Payment has not been received yet.` when it isn't.
5. When paid: remove the ordered lines from the cart, close the modal, `router.push('/payment/success')`.

Blanxer QR on a store whose QR request isn't approved fails with `QR request is not approved for this store`.

### Checkout by Fonepay (`FonepayCheckout`)

`POST /payment/fonepay_checkout/init` returns the QR data plus a bank list:

```json
{
  "prn": "6709a1b2c3d4e5f6071829aaxkqz", "transaction": "6709a1b2c3d4e5f6071829aa",
  "amount": 4330, "socket_url": "wss://...", "qr_message": "000201010212...",
  "banks": [{ "bankName": "...", "bankCode": "...", "bankIcon": "https://...", "packageName": "...", "intentScheme": "..." }]
}
```

- **Desktop:** show the QR, as above.
- **Mobile with banks:** show a searchable bank list. Tapping a bank opens `${intentScheme}/?qrPayload=${encodeURIComponent(qr_message)}`. If the page is still visible 2 seconds later, show "Mobile banking App not found". Offer "Scan QR Code Instead" and "Check Status".
- **Websocket:** open `socket_url`. Each message is JSON whose `transactionStatus` is itself a JSON string. When its `productNumber` equals `prn` and `paymentSuccess` is true, run the check below.
- **Check:** every 10 seconds while visible (this one asks Fonepay, so less often), on tab return, and on "Check Status": `GET /payment/fonepay_checkout/check/<transaction>`. HTTP 200 `{"success": true, "amount": 4330}` = paid; HTTP 400 `{"message":"Payment not received"}` = not yet.
- When paid: same as the QR above.
- Outside production (`api-dev`), Checkout by Fonepay uses Fonepay's development credentials and charges 1.1, not the order amount. The `amount` in the response is still the order's real amount.

### Errors when starting a payment

If a start call fails, the component shows that method's error (for example "Khalti payment is not available at the moment, please try again later."; for Khalti, Khalti's own message when there is one) and stops. (The hosted storefront shows the eSewa text for an NPX failure.) The order already exists as `Inactive`; the merchant sees it in the dashboard and may call the shopper. For redirect gateways the ordered lines were already removed from the cart, so they are gone even when the start fails.

## Stock holds

- When an order is created, the API holds the units of every line whose product does **not** have `continue_selling`. Holds are atomic across all shoppers.
- **COD** reduces stock at once and ends the hold. **Online** orders keep the hold until paid, released or expired.
- **Hold time:** 300 seconds by default. If a product in the order is in a live flash sale, the sale's hold time applies (2–5 minutes, default 3); the shortest wins.
- `hold_seconds` is missing when nothing was held (every line continues selling) and for COD.

### The QR timer

- Timer = `hold_seconds − 20` seconds, so a payment made in the last seconds still lands inside the hold. If `hold_seconds` is missing or ≤ 20, the timer is 280 seconds.
- It is measured from when the QR opens, on the device clock.
- Show the time left as `MM:SS`. It turns red in the last 60 seconds.
- When it runs out, the modal shows "QR is expired" with **Back to checkout** and **Go to home**.

### Releasing a hold

```http
POST /order/public/release-hold
{ "store_id": "...", "order_id": "...", "transaction_id": "<transaction from the payment start>" }
```

Response: `{"success": true, "released": true}`, or `"released": false` when the order is already paid or no longer `Inactive`.

Release **only** when:

1. the timer runs out (then show "QR is expired" and "Your items were released so other shoppers can buy them. If you already paid, your order is still confirmed."), or
2. the shopper taps ✕ and confirms. While the QR is live, ✕ first asks "Cancel this payment?" with **Check payment** as the main button, then "Back to QR", then "Yes, cancel payment".

**Never** release on tab switch, page hide or page leave: shoppers pay in their banking app while the QR stays open. A payment that lands after a release is still honoured. The units were already released, so this can oversell (known). For redirect gateways the hold simply expires.

## When the cart is cleared

Only the selected lines are ordered and removed; unselected lines stay in the cart.

| Method | Ordered lines removed |
|---|---|
| COD | Right after the order is created |
| `Esewa`, `Khalti`, `FonePay`, `NPX`, `nbank_card` | Right after the order is created, before the redirect. A shopper who comes back from a failed payment finds those lines gone. |
| `QR`, `QR_Dynamic`, `FonepayCheckout` | Only when the payment is confirmed. Closing the QR keeps them, so the shopper can try again (which creates a new order). |

## The three required pages

These pages are not optional (rule 3):

- every redirect gateway returns the shopper to `<url>/payment/success` or `<url>/payment/failed`;
- the order confirmation email links to `<url>/track/<order_id>`;
- once the site link is saved in Blanxer, the tracking link Blanxer generates (dashboard copy, `get_tracking_link`) and the delivered email point at `<site>/track/<order_id>`. (Whether SMS short links follow it is not yet verified.)

If a page is missing, the shopper sees a 404 **after paying**. The package ships all three: `PaymentSuccess`, `PaymentFailed`, `OrderTracking`. Mark all three `noindex`.

### `/payment/success`

A client component, on the same origin as `/checkout` (it reads `sessionStorage`):

1. Read and remove `sessionStorage['checkout_order_id']`.
2. If `sessionStorage['pixel_purchase_pending']` exists, fire `Purchase` on the Pixel and the CAPI relay with its `event_id`, `email` and `phone`, then remove it.
3. `router.replace('/track/<id>?from=checkout')`, or `/` when there is no id.

The gateway adds no order id to the URL. `sessionStorage` is the only link between the checkout and this page.

### `/payment/failed`

Show "Payment for your order failed" and "However, you might receive call/sms soon for confirmation", plus a "Shop More" link. With `?method=card`, show "Transaction Failed" and the card reasons: wrong card number, expiry or CVV; wrong OTP; the bank declined online transactions; try again. Don't say the order was cancelled: it exists as `Inactive`.

### `/track/[id]`

`GET /order/public/<store_id>/id/<order_id>` returns:

| Field | Notes |
|---|---|
| `_id`, `slug`, `status`, `payment_status` | Status: `Inactive`, `Draft`, `Pending`, `Processing`, `Dispatched`, `Delivered`, `Cancelled`, `Returned`. Payment: `Unpaid`, `Processing`, `Paid`, `Failed`, `Refunded`. |
| `customer_full_name`, `customer_email`, `customer_address_city`, `customer_address`, `customer_address_landmark`, `customer_address_province` | |
| `customer_phone_number` | Masked: the first 7 digits become `•••••••` |
| `ordered_products[]` | `image_url`, `product_id`, `product_name`, `price`, `compare_at_price`, `variant_id`, `variant_name`, `quantity`, `print` |
| `product_total_price`, `delivery_charge`, `customization_total`, `discount` (the full object: `d_value`, `code`, ...), `partial_payment_amount` | Total = `product_total_price + delivery_charge + customization_total − discount.d_value` |
| `store` | The store id |
| `review` | `{count, total_rating, received: [product ids], reviews: [ids]}` |
| `reviews[]` | `product`, `images`, `review`, `rating` |

The response has no `order_number`. An unknown id is HTTP 400 `{"message":"Order item not found"}`; an id that isn't 24 hex characters is HTTP 400 `{"error_type":"zod_validation","fields":{"order_id":"..."}}`. The package shows "Order not found" for both. (The hosted storefront redirects to `/` on any error.)

What the page shows:

- With `?from=checkout`: "Congratulations! Your order has been placed successfully! Thank you for your purchase. You will receive a confirmation SMS or call soon."
- The status and payment status, the lines, and the totals. If `partial_payment_amount > 0`, show it and "Cash on Delivery: total − partial".
- **Cancel** when `status` is `Pending` or `Processing` and `checkout.extras.allow_customer_cancellation` is on. See [Forms and extras → Cancel an order](https://developers.blanxer.com/forms-and-extras.md#cancel-an-order).
- **Review** per product when `status` is `Delivered` and the product isn't in `review.received`. See [Forms and extras → Review a product](https://developers.blanxer.com/forms-and-extras.md#review-a-product).

## Meta events in the checkout

- `InitiateCheckout` once, when the checkout has lines: `content_ids` (a variant line is `<product>_<variant>`, the same ids as the product feed), `content_type: 'product'`, `value` (the payable total), `currency: 'NPR'`, `num_items` (the number of unique content ids).
- `Purchase`: `num_items` is the number of order lines. One `event_id` per order, sent in the order's `meta` block. COD: the server sends the CAPI Purchase and the browser fires the Pixel. Online: the success page fires both. Meta dedupes on `event_id`.

Details: [SEO and tracking → Meta Pixel and Conversions API](https://developers.blanxer.com/seo-and-tracking.md#meta-pixel-and-conversions-api).

## Testing without creating an order

On any store, an order with `customer_phone_number` `0000000000`, or a `customer_email` containing `mailinator.net`, returns `{"success": true}` and **creates nothing**.

- The body is validated first, so every other field must still be valid.
- The response has no `_id`. The checkout must treat `success` without `_id` as a test response and stop: no payment start, no redirect.
- It still counts toward the order rate limit (5 per 10 minutes per store and IP).
- This tests the form, validation, delivery and coupon display. It can't test payments: there is no order to pay, so the gateway and QR screens are checked live (see [Testing](https://developers.blanxer.com/testing.md)).

## Not in v1

Partial payment, offers and agreed delivery are not in the package's checkout v1. They come in checkout v1.1. Neither is a print picker (see [Print add-on products](#print-add-on-products)). Customer login, loyalty discounts and reward points are not part of BlanxerAPI.
