# Selling from several stores

> **Most stores never use this.** A store that sells online from several of its shops ("pooled stock") has it switched on by Blanxer support. Every other store works exactly as the rest of these docs say: **don't change anything on a site whose store isn't pooled.** The `Checkout` of `@blanxer-dev/storefront` does everything below from 0.5.0 (see [The package](#the-package)). This page documents what it does, so you can theme it, debug it and explain it to the merchant.

A pooled store is on the Platinum plan with advanced inventory and has at least two shops that can ship. Blanxer support allows it per store; the merchant then picks the shops and the display in Blanxer (Setting → Checkout → Store pickup & fulfilment). From then on:

- the website's stock number can be the shops' total, not one shop's;
- the server picks which shop sends each order. A cart no single shop can fill becomes **one checkout with several orders**, one per shop ("Arrives in 2 parcels");
- each shop can have its own delivery charge, so **the browser can't work the delivery charge out**. The server's **checkout plan** gives it, and the order is charged what the plan said.

## Is the store pooled?

`check_domain` has:

```ts
online_fulfilment: {
  pooled: boolean;
  display_stock: 'combined' | 'website_outlet'; // what the stock number on products means
  show_stores: boolean;     // the product page may list the shops that have it
  checkout_plan: boolean;   // true = price checkout with POST /order/public/checkout-plan
}
```

- Not pooled: `{ pooled: false, display_stock: 'website_outlet', show_stores: false, checkout_plan: false }`. The site keeps today's checkout: the delivery table and the [delivery rules](https://developers.blanxer.com/api-docs/checkout.md#delivery-places-and-charges) in the browser.
- Older backends send no `online_fulfilment`: treat it as not pooled.
- `check_domain` is cached like the rest of the store config (see [Store and theme](https://developers.blanxer.com/api-docs/store-and-theme.md)).

## Stock on product pages

The fields don't change: `quantity` on products and variants, and `continue_selling: false` on advanced stores ([Catalog → Stock](https://developers.blanxer.com/api-docs/catalog.md#stock)). Only the number in them does:

| Store | `quantity` |
|---|---|
| Not pooled | Today's: the website outlet's stock |
| Pooled, `display_stock: 'combined'` | The pool: for every pool shop that is active and can ship, its stock minus the units it keeps for walk-in customers, added up |
| Pooled, `display_stock: 'website_outlet'` | The website outlet's stock minus the units it keeps for walk-ins |

- Show stock the way the site already does. The number is simply the pooled one; there is nothing to add.
- The server's checkout checks (stock check, holds, payment start, the order) always use the pooled number on a pooled store, whatever the display.

### Which shops have it

Only when `online_fulfilment.show_stores` is true:

```http
GET /order/public/store-availability/<store_id>/<product_id>
```

```json
{ "success": true, "enabled": true,
  "stores": [ { "_id": "65a…02", "name": "Butwal", "city": "Butwal", "pickup": true,
                "variants": [ { "variant": "65b…9", "band": "few" } ] } ] }
```

- `band` is `in_stock` (3 or more) or `few` (1–2). Shops with none are left out. The answer never has counts: never show a number per shop.
- `variant` is `""` for a product without variants.
- `pickup: true` = the shop is a store-pickup outlet; link the line to pickup where the checkout offers it.
- `show_stores` off, or the store not pooled: `{ "enabled": false, "stores": [] }`. Show nothing.
- Cached 60 seconds by the API.

Show it as one line on the product page, for the picked variant: "Available at Pokhara, Butwal (few left)".

## The checkout plan

**When `online_fulfilment.checkout_plan` is true, the site must price checkout with the plan** and never compute delivery from the delivery table. The plan gives the parcels, the shop each one ships from, each one's delivery charge, the discount and advance per parcel, and the total the shopper pays. It holds nothing.

Any store may call it; a store that isn't pooled gets one parcel from its website outlet at its usual charges. Stores that aren't pooled keep today's browser calculation.

```http
POST /order/public/checkout-plan
Content-Type: application/json

{ "store_id": "6ac8…",
  "products": [ { "product": "…", "variant": "", "quantity": 2, "customization_charge": 0, "bundle_picks": [] } ],
  "place": "Pokhara",
  "payment": "cod",
  "fulfilment": "delivery",
  "pickup_outlet": null,
  "code": "", "coupon": "", "gift_choices": {}, "removed_offers": [], "phone": "" }
```

| Field | Rule |
|---|---|
| `products` | The shopper's lines, as the order will send them. Never lines the server added (`added_by`) |
| `place` | The delivery place (`customer_address_city`). Required unless it's a pickup |
| `payment` | `cod` or `online` (offers may depend on it) |
| `fulfilment`, `pickup_outlet` | `delivery`, or `pickup` with the pickup outlet's `_id` ([Store pickup](https://developers.blanxer.com/api-docs/checkout.md#store-pickup)) |
| `code`, `coupon`, `gift_choices`, `removed_offers`, `phone` | As on the order |

Response:

```jsonc
{ "success": true, "data": {
  "plan_id": "cp_6730…",
  "expires_at": "2026-11-07T10:30:00.000Z",
  "pooled": true, "split": true, "place": "Pokhara", "cod_available": true,
  "parcels": [
    { "index": 1, "outlet": { "_id": "65a…02", "name": "Pokhara", "city": "Pokhara" },
      "lines": [ { "product": "…", "variant": "…", "name": "Kurta", "variant_name": "M", "quantity": 2,
                   "unit_price": 1500, "line_total": 3000, "gift": false, "bundle": null } ],
      "weight": 0.8,
      "goods": 3000, "customization": 0, "discount": 300,
      "delivery_base": 150, "delivery": 150,
      "total": 2850, "advance": 150, "cod_to_collect": 2700 },
    { "index": 2, "outlet": { "_id": "65a…03", "name": "Butwal", "city": "Butwal" },
      "lines": [ /* Shoes */ ], "weight": 1.2,
      "goods": 2000, "customization": 0, "discount": 200,
      "delivery_base": 0, "delivery": 0, "total": 1800, "advance": 0, "cod_to_collect": 1800 } ],
  "totals": { "goods": 5000, "customization": 0, "discount": 500, "member_discount": 0,
              "delivery_base": 150, "delivery": 150, "total": 4650 },
  "delivery_label": "Delivery: Pokhara Rs 150 · Butwal free",
  "offers": { "applications": [], "code": null, "totals": {} },
  "advance": { "amount": 150, "on_delivery": 4500, "total": 4650, "basis": "delivery", "required": true, "full": false },
  "payable": { "total": 4650 } } }
```

- **`plan_id`** is valid for 30 minutes (`expires_at`). Send it with the order.
- **`parcels`**: one per order the checkout will make. `discount` is this parcel's share of the order discount; `delivery_base` / `delivery` are its charge before and after a delivery offer; `total` = `goods` + `customization` − `discount` + `delivery`; `advance` is its share of the advance and `cod_to_collect` what its courier collects.
- **`totals`** and **`payable.total`**: the whole checkout. Show these; don't add the parcels up yourself.
- **`delivery_label`**: the delivery line, ready to show.
- **`cod_available`**: whether cash on delivery is offered for this place. COD per place is store-wide, as today.
- **`offers`**: on an Offers store, `applications`, `code` and `totals` for the same cart, as in [the quote](https://developers.blanxer.com/api-docs/checkout.md#the-quote); `null` when the store isn't on Offers.
- **`advance`**: the checkout's advance (`null` = plain COD). It is paid once, for the whole checkout.
- A **pickup** is always one parcel at `pickup_outlet`, with no delivery and the pickup advance.
- Ask again when the lines, place, payment method, pickup choice, code or phone change. Debounce, and drop answers to older requests.
- **Browser only** (rule 5): 120 plans per 10 minutes per IP.

Errors:

- HTTP 400 `stock_error { code: 'OUT_OF_STOCK', lines }` when even the shops together can't fill a line; `available` is the pool's units.
- HTTP 400 `Selected delivery city not found…` (the same text as today) with `error_code: 'UNKNOWN_PLACE'`.
- HTTP 400 `{ message: 'Add a product to the cart' }`.

### How the server splits a cart

For explaining a plan to the merchant, not for computing it:

1. The first shop in the place's routing list that can fill the whole cart sends it all: one parcel.
2. Otherwise the fewest shops, in routing order. A bundle's parts stay together, and an offer's lines stay together where possible.
3. A line is split by quantity only when no single shop has all of it.
4. The order discount (code, cart offer) is shared by line value, rounded to rupees, the remainder on parcel 1.
5. A delivery offer's saving is shared by `delivery_base`; a full free-delivery offer makes every parcel's delivery 0.

Blanxer works out the routing list for each place (a shop in that city first, then shops in the same province, then the rest); the merchant can change it in Blanxer.

## Placing the order

Send the plan's id with the usual [order request](https://developers.blanxer.com/api-docs/checkout.md#the-order-request):

```json
{ "products": [ … ], "customer_address_city": "Pokhara", "paymentMethod": "COD", "checkout_plan_id": "cp_6730…", "…": "…" }
```

**The quoted charge is final.** The server routes the order again on live stock. If the same shops can still send the same lines, each order gets the plan's delivery charge. If not (another shopper took the last unit), the plan's total delivery is shared over the new parcels, and the response says `plan_changed: true`. Either way the shopper pays the delivery the plan showed. Offers, code and advance are priced again from the cart, as on every order.

The plan must match the order: the same lines (product, variant, quantity, bundle picks, customization charge), place, fulfilment and pickup outlet. Payment method, code and phone may change.

**A plan that is expired, unknown or doesn't match** is refused:

```jsonc
// HTTP 409
{ "message": "Your delivery details changed. Please check the new total.", "error_code": "CHECKOUT_PLAN_STALE",
  "plan": { /* a fresh plan, the same shape as data above */ } }
```

Show the message and the new plan (parcels and total), and let the shopper place the order again; send it with `plan.plan_id`. Never resend on their behalf at a new price. Every attempt counts toward the order rate limit (5 per 10 minutes per store and IP).

Without `checkout_plan_id`, the server works a plan out inside the order and uses it (older sites do this). The order is then priced per shop even if the page showed the delivery table's charge.

### The response

Today's fields describe **the whole checkout**, so a site that doesn't know about parcels keeps working:

| Field | On a split checkout |
|---|---|
| `_id`, `order_number` | Parcel 1's |
| `delivery_charge` | The checkout's total delivery |
| `total_price` | The checkout's goods after discount |
| `amount_to_pay` | What the one online payment charges |
| `advance` | The checkout's advance |
| `hold_seconds`, `hold_expires_at` | The earliest hold |

And on pooled stores:

```jsonc
"checkout_group": { "id": "6730…", "count": 2, "reason": "outlet" },   // null when not split
"plan_changed": false,
"orders": [
  { "_id": "…", "order_number": "1043", "index": 1, "outlet": { "_id": "65a…02", "name": "Pokhara" },
    "total": 2850, "delivery_charge": 150, "advance_due": 150, "amount_to_pay": 150, "status": "Inactive" },
  { "_id": "…", "order_number": "1044", "index": 2, "outlet": { "_id": "65a…03", "name": "Butwal" },
    "total": 1800, "delivery_charge": 0, "advance_due": 0, "amount_to_pay": 0, "status": "Inactive" } ]
```

- When the checkout waits for an online payment (an online method, or an advance), **every** order in it is `Inactive` until it is paid, including orders with nothing to pay. They expire or are cancelled together if it is never paid. Once paid, orders with nothing to pay become `Pending` (cash on delivery).
- With `plan_changed: true`, show the parcels from `orders` as they are; the delivery the shopper pays didn't change.
- One confirmation SMS and email lists every order number.
- Keep storing `_id` (parcel 1) as `checkout_order_id`, as today.

## Paying

One online payment covers the whole checkout. Start it exactly as today ([Payment flows](https://developers.blanxer.com/api-docs/checkout.md#payment-flows)) with any of the checkout's order ids; parcel 1's `_id` is what the package sends. You may send `checkout_group` (its `id`) instead of `order`.

- The amount is the sum of each live order's due: its advance, or its full total.
- The response is the gateway's usual one. Its `transaction` / PRN is the checkout's, so use it for the QR check and for releasing the hold. It adds:
  ```jsonc
  "checkout_group": "6730…",
  "orders": [ { "_id": "…", "order_number": "1043", "amount": 150 }, { "_id": "…", "order_number": "1044", "amount": 0 } ]
  ```
- `GET /payment/dynamic_qr/check/<id>` and `/payment/fonepay_checkout/check/<id>` accept the checkout's transaction.
- Cash on delivery and pay at store need no payment call: each parcel's courier or shop collects its own `cod_to_collect`.
- `POST /order/public/release-hold` releases the holds of every order in the checkout.

## Success page, tracking and cancel

`GET /order/public/<store_id>/id/<order_id>` adds:

- `checkout_group`: `{ id, index, count, reason }` (`null` when not split);
- `linked_orders`: the checkout's other orders, `[{ _id, order_number, index, outlet_name, status, payment_status, total, delivery_charge }]`, `[]` when not split.

On the success and tracking page of a split checkout, list every order with its number, the shop it ships from and its status ("Parcel 1 of 2 · from Pokhara"), and link each to its own `/track/<_id>`. Each parcel is packed, sent, delivered and returned on its own.

**Cancel** (`POST /order/public/cancel`, [Forms and extras → Cancel an order](https://developers.blanxer.com/api-docs/forms-and-extras.md#cancel-an-order)) takes `scope: 'order' | 'group'`; the default `order` cancels only this parcel, `group` the whole checkout. An unpaid online checkout always cancels whole. Ask the shopper which, when the checkout has several orders.

## What the shopper sees

- **Keep the payment grid as it is.** Parcels, "Arrives in 2 parcels" and `delivery_label` go in the order summary, a payment tile's subtitle or the place-order button. Never a second grid of choices.
- In the summary: "Arrives in 2 parcels: from Pokhara (Kurta) and from Butwal (Shoes)", then the delivery line (`delivery_label`) and the total (`payable.total`).
- An advance is one amount for the whole checkout ("Pay Rs 150 now, Rs 4,500 on delivery"), not one per parcel.
- Never show stock per shop as a number.
- The success page lists every order number.

## The package

Package 0.5.0 does all of this by itself on a pooled store, and nothing on any other store (it needs the Blanxer backend from the multi-outlet release; older backends send no `online_fulfilment`). Update to it **before** Blanxer support switches the store to pooled. Names in 0.5.0:

| Where | Name | What |
|---|---|---|
| `/core` | `usesCheckoutPlan(store)`, `showsStores(store)` | Read `online_fulfilment` (older backends: not pooled) |
| `/core` | `checkoutPlanBody(input)` | The plan request, from the same lines, place, method, pickup and offer choices as the order |
| `/core` | `quoteCheckout({ …, plan })` | With a plan, its delivery, COD rule and total replace the delivery table's |
| `/core` | `buildOrderPayload({ …, checkoutPlanId })` | Adds `checkout_plan_id` |
| `/core` | `staleCheckoutPlan(err)` | Reads the 409 `CHECKOUT_PLAN_STALE`: the message and the fresh plan |
| `/client` | `checkoutPlan(body)` | `POST /order/public/checkout-plan` |
| `/client` | `storeAvailability(storeId, productId)` | `GET /order/public/store-availability/…`; never throws |
| `/client` | `cancelOrder({ …, scope })` | Cancel one parcel or the whole checkout |
| `/react` | `useCheckoutPlan`, `<PlanParcels>`, `<PlanNotice>` | The plan in the checkout, "Arrives in 2 parcels" in the summary, the "your total changed" note |
| `/react` | `<CheckoutParcels>` | Every order of a split checkout on the success / tracking page |
| `/react` | `<AddToCart showStores>`, `useStoreAvailability`, `<StoreAvailabilityLine>` | "Available at Pokhara, Butwal (few left)" on the product page |
| Types | `OnlineFulfilment`, `CheckoutPlan`, `StoreAvailability`, `CheckoutGroup`, `LinkedOrder` | `Store.online_fulfilment`; `OrderResponse.checkout_group / orders / plan_changed`; `PublicOrder.checkout_group / linked_orders` |

`Checkout`, `OrderTracking` and the product components use these on their own. Restyle them through the `bx-plan-*`, `bx-checkout-parcels`, `bx-store-availability` and `bx-cancel-scope` classes. On a store with Offers, the checkout keeps the quote's goods and offers and takes delivery, cash on delivery, advance and total from the plan.

## An older site on a pooled store

A site on an older package still works on a pooled store, but the page and the order can disagree:

- Stock reads keep their fields, so product pages are fine.
- The checkout shows the delivery table's charge, while the server charges per shop. `amount_to_pay` and the gateway's amount are the truth.
- The order response is the checkout's, with parcel 1's number; paying with parcel 1's id pays the whole checkout. The SMS lists every order.

That is why Blanxer support switches a store to pooled only after its site uses the checkout plan. Update the package first.
