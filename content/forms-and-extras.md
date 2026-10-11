# Forms and extras

Custom forms, back-in-stock alerts, order cancellation, product reviews and the blog. Every write on this page is a browser call (rule 5), with no login.

## Forms

Merchants build forms in Blanxer (enquiries, bookings, wholesale requests). A custom site renders a published form at `/forms/<slug>`.

### Read a form

```http
GET /public/form/<store_id>/<slug>
```

```json
{
  "form": {
    "name": "Wholesale enquiry", "slug": "wholesale",
    "page_header": "Work with us", "page_subheader": "...",
    "title": "...", "description": "...",
    "submit_label": "Submit", "success_message": "Thanks! We'll call you.",
    "page_footer": "<p>HTML</p>",
    "fields": [
      { "key": "full_name", "type": "text", "system": true, "label": "Full Name", "required": true, "width": "half" },
      { "key": "phone", "type": "text", "system": true, "label": "Phone Number", "required": true, "width": "half" },
      { "key": "email", "type": "text", "system": true, "label": "Email Address", "required": false, "width": "full" },
      { "key": "k8f2", "type": "select", "label": "Business type", "required": true, "options": ["Retail", "Online"] }
    ]
  }
}
```

- Only `published` forms are returned. Anything else is HTTP 400 `{"message":"Form not found"}`; render a 404.
- Each field has `key`, `type`, `label`, `placeholder`, `help_text`, `required`, `width` (`full` or `half`), and for some types `options`, `multiple`, `sub_fields` (`{key, label, placeholder, icon}`), `min`, `max`, `step`.
- `page_footer` is HTML; sanitize it before rendering.
- Every form has the three system fields `full_name`, `phone` and `email`.

### Submit

```http
POST /public/form/<store_id>/<slug>/submit
Content-Type: application/json

{ "data": { "full_name": "Asha Gurung", "phone": "9800000000", "email": "", "k8f2": "Retail" } }
```

The server also accepts the values as a flat body, without `data`. Send `data`.

Response: `{"success": true, "message": "<success_message or 'Submitted successfully'>"}`. Show the message.

Values are keyed by field `key` and checked against the published form:

| Type | Value | Rule |
|---|---|---|
| `full_name` (system) | string | 1–200 characters: `Full name is required` (`Required` when the key is missing) |
| `phone` (system) | string | Exactly 10 digits: `Phone number must be of 10 digit` |
| `email` (system) | string | Valid email; may be `''` unless required (then `Provided email address is invalid`) |
| `text`, and any type not listed | string | ≤ 1000 |
| `textarea` | string | ≤ 5000 |
| `richtext` | HTML string | ≤ 50000 |
| `select`, `radio` | string | One of `options` |
| `badges` | string, or string[] when `multiple` | From `options` |
| `checkbox_group` | string[] | From `options` |
| `tags` | string[] | ≤ 30 items, each ≤ 120 |
| `number`, `slider` | number | Within `min`/`max` (slider defaults to 0–100) |
| `email` | string | Valid email |
| `phone` | string | `/^\+?[\d\s-]{6,20}$/` |
| `url` | string | A full URL |
| `date` | `YYYY-MM-DD` | |
| `time` | `HH:MM` | |
| `datetime` | `YYYY-MM-DDTHH:MM` | |
| `color` | `#RRGGBB` | |
| `checkbox` | boolean | Required means it must be ticked |
| `multi_text` | `{ [sub_field.key]: string }` | Each ≤ 500 |
| `heading`, `divider` | — | Layout only; don't send |

- A required custom field that is empty fails with `<label> is required`.
- **Leave out choice fields the shopper didn't answer.** An optional `select`, `radio` or single `badges` field sent as `''` fails with `Invalid option for <label>`.
- Errors: HTTP 400 `{"error_type":"zod_validation","fields":{"<key>":"<message>"}}`. Show each message under its field.
- Unknown keys are dropped.
- An unknown or unpublished form: HTTP 400 `{"message":"Form not found"}`.
- Limit: 10 submissions per 15 minutes per IP.

The package's `BlanxerForm` component renders and submits a form; style it through its class hooks.

## Back-in-stock alerts

When a product (or the chosen variant) is out of stock and the store has `customer_program.back_in_stock.enabled`, show a "Notify me when available" form. Don't show it for `coming_soon` products.

```http
POST /customer/stock-alert
Content-Type: application/json

{ "store": "<store_id>", "product": "<product_id>", "variant_id": "<variant _id or ''>",
  "phone": "9800000000", "email": "asha@example.com",
  "product_name": "Pashmina Shawl - Maroon/Large",
  "product_url": "https://mystore.com/product/pashmina-shawl" }
```

- `phone` or `email` (or both) is required: `A phone number or email is required`. Check the phone is 10 digits in the browser.
- **Leave out a key that is empty.** `email: ""` fails with HTTP 400 `Invalid email`, even when `phone` is set.
- `product_name` and `product_url` go into the alert SMS/email as sent. Send the absolute product URL on the site (`https://mystore.com/product/<slug>`), without a query string.
- Response: `{"data": {"subscribed": true}, "message": "We'll notify you when it's back in stock."}`.
- If the store has the feature off: `This feature is not enabled for this store.` Other errors: `Store not found!`, `Product not found!`.
- Repeating the same request doesn't create a second alert.
- This is the only `/customer/*` route a custom site uses. It needs no login. Everything else under `/customer` is off limits (rule 7).

The package's `StockAlertForm` does this.

## Cancel an order

On `/track/<id>`, offer **Cancel Order** when the order's `status` is `Pending` or `Processing` and the store has `checkout.extras.allow_customer_cancellation`.

```http
POST /order/public/cancel
{ "store_id": "<store_id>", "order_id": "<order_id>", "phone_number": "9800000000" }
```

- The shopper types the phone number used for the order. Show the placeholder `ending with <last 3 digits>` from the masked number in the tracking response.
- Success: `{"success": true, "message": "Order cancelled successfully"}`. Reload the tracking data.
- A phone that isn't 10 characters: HTTP 400 `{"error_type":"zod_validation","fields":{"phone_number":"Phone number must be of 10 digit"}}`, before any other check.
- Wrong phone: HTTP **401** `{"fields":{"phone_number":"Provided phone number don't match with order phone number"}}`. The phone is checked before the status, so a wrong phone on a Delivered order is also 401.
- Other errors (HTTP 400 `{message}`): `Store not found`, `Order cancellation is not available`, `Order not found`, `Only orders in Pending or Processing status can be cancelled`.
- Cancelling puts the stock back and sends the store's cancellation SMS if it has one.
- Ask "Are you sure you want to cancel this order? This action cannot be undone." first.

## Review a product

On `/track/<id>`, when the order's `status` is `Delivered`, offer **Review Product** for each product in the order that isn't in `review.received`. (The server doesn't check the status; the page does.)

```http
POST /order/public/submit-review
{ "store_id": "...", "order_id": "...", "product_id": "...",
  "rating": 5, "review": "Lovely colour, fast delivery.", "phone_number": "9800000000" }
```

- `rating` is 1–5; send a whole number (the server doesn't enforce it). `review` is up to 1000 characters.
- `phone_number` must be 10 characters, else HTTP 400 `{"error_type":"zod_validation","fields":{"phone_number":"Phone number must be of 10 digit"}}`.
- Success: `{"success": true, "message": "Review recorded successfully", "rating": 5, "review": "..."}`.
- Wrong phone: HTTP **401** `{"fields":{"phone_number":"..."}}`.
- Other errors (HTTP 400 `{message}`): `Order item not found` (no such order, or another store's), `Product has already been reviewed`, `Provided product not found in the following order`, `Selected product not found`.
- The review is published as a verified purchase and counts in the product's `total_rating` / `review_count`.

The package's `OrderTracking` component includes both the cancel and review flows.

## Blog

If the store has published posts, add `/blogs` and `/blog/[slug]`. Blanxer's sitemap lists them only when posts exist.

### List

```http
GET /public/blog/<store_id>?limit=12&cursor=<next_cursor>&category=<slug>&tag=<tag>&author=<user id>&q=<text>
GET /public/blog/<store_id>/category/<category_slug>
GET /public/blog/<store_id>/tag/<tag>
GET /public/blog/<store_id>/author/<author user id>
```

The `category`, `tag` and `author` routes take the same query parameters as the list (`limit`, `cursor`, `tag`, `q`, `author`, `category`); the path value wins over the query.

```json
{
  "items": [{ "_id": "...", "name": "How to care for pashmina", "slug": "pashmina-care",
              "excerpt": "...", "featured_image": "https://...", "author": { },
              "categories": ["care"], "tags": ["pashmina"], "reading_time": 4,
              "view_count": 120, "published_at": "2026-09-01T06:00:00.000Z" }],
  "next_cursor": "eyJwIjoi...", "has_more": true,
  "all_categories": [{ "slug": "care", "name": "Care", "image": "" }]
}
```

- `limit` is clamped to 1–50, default 12. Pass `next_cursor` back as `cursor` for the next page.
- `q` matches the post name or excerpt (case-insensitive). `author` is the author's user id (`author.user`).
- `all_categories` lists every category with live posts, for filter chips. Blanxer's sitemap lists `/blogs?category=<slug>` for every blog category in `check_domain.blog_categories`, even empty ones, so support the query parameter and show an empty state.

### One post

```http
GET /public/blog/<store_id>/<slug>
```

Returns the post with `name`, `slug`, `excerpt`, `featured_image`, `author`, `categories`, `tags`, `reading_time`, `published_at`, `seo_title`, `seo_description`, `seo_image` (already filled from the title, excerpt and image when the merchant left them empty), `no_index`, `sections`, plus `related` (up to 3 posts), and `products`, `single_products` and `blogs` referenced by the post's sections. Unknown or unpublished: HTTP 400 `{"message":"Blog post not found"}`.

The body is in `sections`, in Blanxer's section format (the same section codes as the page builder). A custom site renders the text and image sections it understands and skips the rest. Look at a real post's `sections` for the store you are building before writing the renderer. If `no_index` is true, add `noindex` to the page.
