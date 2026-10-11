# Testing

Test the site before it goes live, and once more after. There are three tools: the `0000000000` test order (any store), the sandbox store on `api-dev`, and the live check.

## 1. Run the check command

```bash
npx blanxer-storefront check
```

Fix every failure first. What it checks: [Package → check](https://developers.blanxer.com/package.md#check).

## 2. Test orders that create nothing

On **any** store, including the merchant's real one, an order with:

- `customer_phone_number` = `0000000000`, or
- a `customer_email` containing `mailinator.net`

returns HTTP 200 `{"success": true}` and **creates no order**: no stock change, no SMS, no email, nothing in the dashboard.

- The body is validated **before** this check, so every other field must be valid. Use it to test validation messages too: leave the name empty and you get the real error.
- The response has no `_id`. The package's checkout stops there and shows "Test order accepted — no order was created for this test phone/email.": no payment start, no redirect, nothing in `sessionStorage`.
- It can't test payments, stock holds or the tracking page, because no order exists.
- Test orders still count toward the limit of 5 orders per 10 minutes per store and IP. After 5, wait or you get HTTP 429.
- Applying a coupon is real even here: for a coupon with a usage limit, each successful apply holds one use for about 12 seconds. Don't test a coupon with very few uses left.

Use it for the form, the place select, delivery charges, COD availability per place, coupons (apply, then place), and that the request leaves from the browser (rule 5).

## 3. The sandbox store

A sandbox store on `https://api-dev.blanxer.com` is planned for BlanxerAPI: every gateway in test mode, products with variants, weights and custom fields, delivery places with and without COD, coupons and a live flash sale. Its subdomain will be listed here when it is ready.

**Until then, check the gateway and QR screens live** (see [the live check](#4-the-live-check)): the `0000000000` order creates nothing, so it never opens them.

Point the site at it:

```bash
BLANXER_API=https://api-dev.blanxer.com BLANXER_STORE=<sandbox subdomain> ./node_modules/.bin/next dev
```

On the sandbox, place:

| Order | Expect |
|---|---|
| One COD order | Lands on `/track/<id>?from=checkout` with the congratulations banner |
| One order per gateway the **real** store has on | Returns to `/payment/success`, then `/track/<id>` |
| One cancelled payment (cancel on the gateway page) | Returns to `/payment/failed` |
| One QR order left to expire | The timer runs out, "QR is expired" shows, and the hold is released (the units are buyable again) |
| One QR order closed with ✕ → "Yes, cancel payment" | The hold is released at once |

Notes:

- Run the gateway tests on a deployed preview, or locally on `http://127.0.0.1:3000`. eSewa, Khalti and FonePay reject `http://localhost` as the return `url` (HTTP 400 `Valid Return URL is required`).
- On `api-dev`, Checkout by Fonepay uses Fonepay's development credentials and asks for 1.1, not the order total.
- An eSewa store in test mode has `product_code` `EPAYTEST` and posts to `rc-epay.esewa.com.np`.
- The `api-dev` database is shared with Blanxer's own development. Only create orders on the sandbox store.

## 4. The live check

After deploying and saving the link in Blanxer:

1. Open, on the live site: home, a product, a category, `/checkout`, `/payment/success`, `/payment/failed`, and a real `/track/<id>` (the merchant can give you one from the dashboard).
2. With the merchant's OK, place **one real COD order** on the real store with the merchant's own phone number. Check it reaches `/track/<id>`, appears in the dashboard, and the confirmation email links to the new site.
3. Have the merchant **cancel it in the dashboard**, so stock goes back and it doesn't count as a sale.
4. For one online method the store uses, place a real order and open the gateway or QR screen, then stop without paying. Close the QR screen with ✕ → "Yes, cancel payment" (that releases the stock hold). Have the merchant cancel the order in the dashboard.
5. Run Lighthouse (mobile) on home, a product and checkout: ≥ 90, LCP < 2.5 s.
6. Check `/sitemap.xml`, `/sitemap-catalog.xml` (its links must be on the live domain) and `/robots.txt`.

Don't make real online payments yourself. If the merchant wants to confirm a gateway, they pay a small real order themselves and refund or cancel it in Blanxer.
