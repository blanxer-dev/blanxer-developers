# Catalog

Products, variants, stock, categories, brands, search, sale and flash sales. All catalog reads are public `GET`s on `https://api.blanxer.com` with no key. In the site, read them on the server through `@blanxer/storefront/server` (60-second cache, normal `User-Agent`). Never put sample products or placeholder prices in the site (rule 8).

## Endpoints

| What | Endpoint | Returns |
|---|---|---|
| All products | `GET /product/public/<store_id>` | Array of list items, every Active, non-POS product. Not paginated. |
| A page of products | `GET /product/p/public/<store_id>?page=1&per_page=30&sort_by=created_at&sort_order=desc` | `{success, meta, products}` |
| One product | `GET /product/public/<store_id>/<slug>` | Full product (see below). `<slug>` may also be the product `_id`. |
| A category | `GET /product/public/<store_id>/category/<slug>` | `{category, products}` |
| New arrivals | `GET /product/public/<store_id>/category/new-arrivals` | `{category: {_id: 1, name: "New Arrivals", slug: "new-arrivals"}, products}`: up to 12 of the newest products |
| Search | `GET /product/public/search/<store_id>?q=<text>` | Array of list items, up to 50 |
| On sale | `GET /product/public/sale/<store_id>` | Array of list items |
| All brands | `GET /brand/public/all/<store_id>` | `{brands}` |
| A brand's products | `GET /brand/public/products/<store_id>/<slug>` | `{brand, products}` |
| A brand's details | `GET /brand/public/details/<store_id>/<slug>` | `{brand, page}` |
| Flash sales | `GET /public/flash-sale/<store_id>` | `{server_time, sales}` |
| One product's flash sale | `GET /public/flash-sale/<store_id>/product/<product_id>` | `{server_time, sale, units}` |

Categories are not an endpoint: they come with the store in `check_domain.categories` (see [Store and theme](https://developers.blanxer.com/store-and-theme.md)).

There is also `GET /product/public/barcode/<store_id>?code=<barcode>` (looks a product up by barcode). A custom site rarely needs it.

Errors:

- HTTP 400 `{"message": "..."}`: `Product not found`, `Category not found`, `Brand not found`.
- HTTP 400 `{"error_type":"zod_validation","fields":{...}}` for a malformed id on search, sale, the paged list, brands and flash sales.
- HTTP 500 `{"errors":{"message":"Cast to ObjectId failed..."}}` for a malformed `store_id` on all products, a category and one product. Always pass the `_id` from `check_domain`.
- A well-formed but unknown store id is not an error: `[]` from the lists, `{category: false, products: []}` from a category.

### Server-side caching

- The API caches only three catalog reads for up to 1 hour: all products, the paged list and a category (new arrivals included). It also caches `check_domain`. It clears them when the merchant changes the store's products, categories or settings.
- Orders don't clear the cache, so stock and `in_stock` in those lists can be up to 1 hour old. The product page and the server's order check always use current stock.
- Product detail, search, sale and brands are not cached by the API.
- The package adds `next: { revalidate: 60 }`. Store changes show on the site within about a minute, without a redeploy.

## List items

Every list endpoint (all products, page, category, search, sale, brand products, similar products) returns this item shape. Each loads a slightly different set of fields; the differences are listed below the example.

```json
{
  "_id": "66f1c0ffee0000000000aa01",
  "name": "Pashmina Shawl",
  "slug": "pashmina-shawl",
  "price": null,
  "min_price": 2500,
  "max_price": 3200,
  "compare_at_price": 0,
  "has_variants": true,
  "in_stock": true,
  "quantity": 14,
  "total_variants": 6,
  "channel": 1,
  "variants": [{ "price": 2500, "compare_at_price": 0, "quantity": 4, "inventory_summary": [] }],
  "total_rating": 18,
  "review_count": 4,
  "image_urls": ["https://.../shawl-1.jpg"],
  "status": "Active",
  "colors": ["Maroon:#7a1f2b", "Cream"],
  "sizes": ["Standard", "Large"],
  "tags": ["new"],
  "categories": ["Shawls"],
  "created_at": "2026-09-30T10:12:00.000Z",
  "release_date": null,
  "brand": { "_id": "...", "name": "...", "slug": "...", "logo": "..." }
}
```

- **Price:** a product without variants has `price`. A product with variants has either `price` or `min_price` / `max_price` with `price: null`. Show "Rs 2,500 – 3,200" for a range. `price` is set (and min/max are null) when all variants cost the same, and also when any variant's price is 0 or missing; then `price` is the highest variant price.
- **`compare_at_price`** above the price means the product is discounted; show it struck through.
- **`categories`** here are category **names**, not ids. Exception: on the category endpoint (not new arrivals) they are `{_id, name, slug}` objects.
- **`brand`** is `{_id, name, slug, logo}` on the category, new-arrivals and sale endpoints, and `{name, slug, logo}` (no `_id`) on search. All products, the paged list, brand products and similar products leave it out. It is never a plain id.
- **`quantity`:** with variants, the sum of the positive variant stock; without variants, the product's own quantity (it can be 0 or below).
- **`variants`** carry `price`, `compare_at_price`, `quantity` and `inventory_summary`. Only search results add `_id` and `option_name`. Get variant ids from the product endpoint.
- **Differences per endpoint:**
  - category, new arrivals, search and similar products don't load `continue_selling`, so their `in_stock` is stock only;
  - `release_date` is only on category, search and brand products;
  - search results have no `total_rating` / `review_count`, and add `score` (relevance);
  - similar products have no `channel`.
- **Rating:** `total_rating` is a sum. Average = `total_rating / review_count`.
- **`in_stock`** is described under [Stock](#stock).

### The paged list

`GET /product/p/public/<store_id>`:

| Param | Default | Values |
|---|---|---|
| `page` | 1 | ≥ 1 |
| `per_page` | 30 | ≥ 1; values above 100 are treated as 100 |
| `sort_by` | `created_at` | `created_at`, `price`, `compare_at_price`, `name`, `total_rating`, `review_count`, `quantity` |
| `sort_order` | `desc` | `asc`, `desc` |

```json
{ "success": true,
  "meta": { "page": 1, "per_page": 30, "total": 212, "total_pages": 8, "sort_by": "created_at", "sort_order": "desc" },
  "products": [ ... ] }
```

`sort_by=price` sorts on the stored top-level price, which is 0 for many products with variants. For a correct price sort, load all products and sort in the site by `price ?? min_price`.

### Search

- `q` must be at least 3 characters; shorter queries return `[]` (no error).
- It is an autocomplete search over a key built from the product name, its category names, colours, sizes and tags (tags containing `:` are left out). Best match first, Active and non-POS only.
- The limit of 50 is applied **before** the Active/non-POS filter, so a search can return fewer than 50 even when more products match. (One store has a higher limit.)

### Sale

`/product/public/sale/<store_id>` returns Active, non-POS products with a `compare_at_price` above 0 on the product or on any variant. (Before the BlanxerAPI backend release it returned `[]` on stores with advanced inventory.)

## One product

`GET /product/public/<store_id>/<slug>` returns the stored product plus a few extras:

| Field | Notes |
|---|---|
| `_id`, `name`, `slug`, `status`, `channel` | See the warning below |
| `description`, `long_description` | **HTML** from Blanxer's editor. Sanitize before rendering. |
| `price`, `compare_at_price`, `quantity`, `weight`, `sku`, `barcode`, `continue_selling` | Product-level values. For a product with variants, use the variant's. |
| `colors`, `sizes` | Empty when the product has no variants |
| `variants[]` | `_id`, `option_name`, `price`, `compare_at_price`, `quantity`, `sku`, `weight`, `image_url`, `barcode`, and also `alt_barcode`, `exim_code`, `tigg_id`, `inventory_summary` |
| `image_urls[]` | Absolute image URLs |
| `categories[]` | Category **ids** (match them against `check_domain.categories`) |
| `brand` | `{_id, name, slug, logo}` or missing |
| `tags[]` | See [Tags](#tags) |
| `custom_fields` | Inputs the shopper fills; see [Checkout → Custom fields](https://developers.blanxer.com/checkout.md#custom-fields) |
| `seo_title`, `seo_description`, `seo_image` | See [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md) |
| `total_rating`, `review_count`, `reviews[]` | Reviews: `rating`, `review`, `images`, `customer_name`, `verified_purchase`, `created_at`, newest first |
| `similar_products[]` | List items: Active only, but may include POS-only products; no `channel` |
| `csrf_token` | Send with custom-field image uploads (accepted, but not checked by the server today) |
| `release_date`, `created_at`, `updated_at` | |

> **Warning: this endpoint also returns non-Active and POS-only products.** `status` is `Active`, `Draft` or `Archived` (`''` when never set). Your product page must show a 404 unless `status === 'Active'` and `channel !== 3`. The package's `getProduct()` already returns `null` for those:
>
> ```ts
> import { notFound } from 'next/navigation';
> const product = await getProduct(params.slug); // @blanxer/storefront/server
> if (!product || product.status !== 'Active' || product.channel === 3) notFound();
> ```
>
> An unknown slug is HTTP **400** `{"message":"Product not found"}`, not 404. Treat it as not found.

`channel`: 1 = website and POS, 2 = website only, 3 = POS only.

## Variants

A product has variants when `variants.length > 0`. Its options are `colors` and/or `sizes`.

### Option names

Each variant's `option_name` is built from the options:

| Product has | `option_name` |
|---|---|
| Colours and sizes | `"<colour>/<size>"`, e.g. `"Red/XL"` |
| Sizes only | `"<size>"` |
| Colours only | `"<colour>"` |

- A colour may carry a swatch code after the **first** colon: `"Maroon:#7a1f2b"`, or a two-tone `"Black:#111111|#e8a200"`. The display name is the part before the colon. The `option_name` uses the display name (`"Maroon/Large"`).
- A colour or size name can contain `/`. Split an `option_name` against the known colour and size lists (longest colour first), not on the first slash.
- Not every colour/size pair has to exist. Offer only sizes that have a variant for the chosen colour; when the colour changes and the size isn't valid any more, pick the first valid size.

### From the shopper's choice to the order

```ts
function findVariant(product: Product, color: string, size: string) {
  const colors = product.colors.map((c) => c.split(':')[0]);
  const name =
    colors.length && product.sizes.length ? `${color}/${size}` :
    product.sizes.length ? size :
    colors.length ? color : '';
  return product.variants.find((v) => v.option_name === name); // undefined = not sold
}
```

- Put the variant's **`_id`** in the cart line as `variant`. The order request needs the id, not the name (`Variant selection required for this product` otherwise).
- Show the variant's `price` (when set), `compare_at_price`, `image_url` (switch the gallery to it) and `sku`.
- The cart line's `weight` is the variant's `weight` when it is a number, else the product's.
- A product's top-level `price` is often 0 when it has variants. Never show it alone.

## Stock

### Simple stores

- Out of stock for a quantity `q`: `!continue_selling && stock < q`, where `stock` is the variant's `quantity` (or the product's for a simple product).
- `continue_selling` is `true` by default: the product sells even at 0 stock. Many stores keep it on.
- List items have `in_stock` = `continue_selling || quantity > 0` (or any variant > 0), except where `continue_selling` isn't loaded (category, new arrivals, search, similar products): there it is stock only. See [List items](#list-items) for `quantity`.

### Stores with advanced inventory

When `check_domain.use_advanced_inventory` is true and the store has a website outlet:

- every `quantity` the API returns is the **website outlet's** stock, not the total;
- list items' `in_stock` ignores `continue_selling` (`quantity > 0`), and the Blanxer storefront's product page does the same (out of stock = `stock < q`). Do the same. (The order check on the server still lets a `continue_selling` product through; showing it as out of stock is the safe side.)
- the brand-products endpoint does not apply the outlet's stock (it returns the global quantity). Prefer the product page's own check.

### What to show

- Out of stock: disable Add to cart and show the back-in-stock form when the store has it on. See [Forms and extras](https://developers.blanxer.com/forms-and-extras.md#back-in-stock-alerts).
- The `product_custom_options` plugin (in `check_domain.plugins`) can ask for stock display: `details.showProductStock` (show "N in stock") and `details.outOfStockBaseValue` (show a low-stock warning at or below that number).
- The server makes the final check at order time, including units held in other shoppers' checkouts.

## Tags

`tags` is free text the merchant sets. A few have meaning in the Blanxer storefront:

| Tag | Meaning |
|---|---|
| `coming_soon` | Shown, but can't be bought yet; no back-in-stock form |
| `no_price` | The price is hidden |
| `team_order` | A team/bulk order product (Blanxer-specific form; not part of v1) |
| `rd_<Label>_<link>` | Replaces Add to cart with a button linking out; `+` in the label is a space |
| `ard_<Label>_<link>` | Adds an extra outlined button linking out, next to Add to cart. When a product has both, `rd_` wins on product cards |


## Categories

From `check_domain.categories`:

```json
{ "_id": "...", "name": "Shawls", "slug": "shawls", "image": "https://...", "order": 2,
  "seo_title": "...", "seo_description": "...", "seo_image": "...", "hide_on_product": false }
```

- Sort by `order` for menus.
- `/collections/<slug>` uses `GET /product/public/<store_id>/category/<slug>`. It returns every product in the category (not paginated); paginate in the site if needed.
- The endpoint's `category` has only `_id`, `name`, `slug` and `desc_page`. Take the SEO fields and image from `check_domain.categories`.
- `new-arrivals` is a virtual category: the 12 newest products, minus any that aren't Active or are POS-only (so up to 12). It is always in Blanxer's sitemap, so keep `/collections/new-arrivals` working.

## Brands

- `GET /brand/public/all/<store_id>` → `{brands: [{_id, name, slug, logo, page, desc_page, created_at, ...}]}` for `/brands`, newest first. Sort them in the site if you want another order.
- `GET /brand/public/products/<store_id>/<slug>` → `{brand: {name, slug, page: {seo_title, seo_description, seo_image}}, products}` for `/brand/<slug>`. Only Active, non-POS products.
- `GET /brand/public/details/<store_id>/<slug>` → `{brand, page}`, where `page` is the brand's page-builder page (or `null`). A custom site uses it only for the brand's SEO fields; it doesn't render page-builder sections.

## Flash sales

A flash sale is an offer campaign with a start and end time. While it is live, **Blanxer writes the offer price into the product's (or variant's) `price`**, and may set `compare_at_price` to the old price. So the catalog endpoints already return sale prices; the flash-sale endpoints add the countdown, limits and units left.

### What is on

`GET /public/flash-sale/<store_id>` lists live sales and sales starting within 14 days:

```json
{ "server_time": "2026-10-11T08:00:00.000Z",
  "sales": [{ "_id": "...", "name": "Dashain Flash", "status": "live",
              "start_at": "2026-10-11T06:00:00.000Z", "end_at": "2026-10-11T10:00:00.000Z",
              "discount_type": "percentage", "discount_value": 20, "max_per_order": 2,
              "show_countdown": true, "show_stock_left": true, "sold_out": false }] }
```

`status` is `live` or `upcoming`. `discount_type` is `percentage`, `fixed_amount` or `fixed_price`. `max_per_order` 0 means no limit.

### One product

`GET /public/flash-sale/<store_id>/product/<product_id>`:

```json
{ "server_time": "...", "sale": { "...same fields...": "", "offer_price_from": 999 },
  "units": { "available": 3, "in_checkout": 2 } }
```

- `sale` is `null` when the product is in no live or upcoming sale.
- `offer_price_from` is the lowest offer price, for "Rs 999 from 10:00" before the sale starts. It is `null` when no offer price is set.
- `units` is missing when `sale` is `null`. Otherwise it is `null` unless the sale is live, `show_stock_left` is on and the product doesn't continue selling. It counts the whole product (all variants). `in_checkout` = units held in other shoppers' checkouts.

### How the strip behaves

The package's `FlashSaleStrip` does this:

- Correct the device clock with `server_time` (offset = `server_time − Date.now()`) and count down to `end_at` (live) or `start_at` (upcoming), when `show_countdown`.
- While live, refresh the product's sale every 15 seconds.
- Show "Only N left", plus "· N in checkout" when some are held. With 0 available but some in checkout: "All remaining units are in other shoppers' checkouts". Sold out when `sold_out` or no units at all.
- Cap the quantity picker at `max_per_order` while live. The server enforces it: `Flash sale: you can buy at most N of "<name>" per order.`
- When the countdown reaches 0, reload the page about 20 seconds later; the backend flips the sale within a minute.
- For an upcoming sale, offer "Notify me" (below).

The site's 60-second cache can show the old price for up to a minute after a sale starts or ends. The server always charges the current price.

### Notify me when it starts

```http
POST /public/flash-sale/<store_id>/notify
{ "campaign_id": "...", "product_id": "...", "product_name": "...",
  "url": "https://mystore.com/product/pashmina-shawl", "phone": "9800000000" }
```

- `phone` (10 digits) or `email` is required. Without both: HTTP 400 `{"error_type":"zod_validation","fields":{"phone":"A phone number or email is required"}}`.
- Only for scheduled sales: any other status gives `This sale has already started`. An unknown sale: `Sale not found`.
- `url` is kept only if it is on the store's own domains, including the saved site link (`storefront_url`). Save the site link in Blanxer, or the alert email has no link.
- Response: `{"success": true, "message": "We'll let you know when the sale starts."}`.
- Limit: 10 per 15 minutes per IP. Call it from the browser.

## Prices and currency

- Prices are in NPR. Format with `Intl.NumberFormat('en-IN')`.
- The store's currency label is `check_domain.customization.currency_indicator` (the package's default is `Rs.`).

## Product images

`image_urls` and variant `image_url` are absolute URLs on Blanxer's storage. Load them with `next/image` and the package's `blanxerImageLoader` so they are resized. Don't download product photos into the site (rule 11). See [Images and speed](https://developers.blanxer.com/images-and-speed.md).
