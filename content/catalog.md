# Catalog

Products, variants, stock, categories, brands, search, sale and flash sales. All catalog reads are public `GET`s on `https://api.blanxer.com` with no key. In the site, read them on the server through `@blanxer/storefront/server` (60-second cache, normal `User-Agent`). Never put sample products or placeholder prices in the site (rule 8).

## Endpoints

| What | Endpoint | Returns |
|---|---|---|
| All products | `GET /product/public/<store_id>` | Array of list items, every Active, non-POS product. Not paginated. |
| A page of products | `GET /product/p/public/<store_id>?page=1&per_page=30&sort_by=created_at&sort_order=desc` | `{success, meta, products}` |
| One product | `GET /product/public/<store_id>/<slug>` | Full product (see below). `<slug>` may also be the product `_id`. |
| A category | `GET /product/public/<store_id>/category/<slug>` | `{category, products}` |
| New arrivals | `GET /product/public/<store_id>/category/new-arrivals` | `{category: {_id: 1, name: "New Arrivals", slug: "new-arrivals"}, products}`: the 12 newest products |
| Search | `GET /product/public/search/<store_id>?q=<text>` | Array of list items, at most 50 |
| On sale | `GET /product/public/sale/<store_id>` | Array of list items |
| All brands | `GET /brand/public/all/<store_id>` | `{brands}` |
| A brand's products | `GET /brand/public/products/<store_id>/<slug>` | `{brand, products}` |
| A brand's details | `GET /brand/public/details/<store_id>/<slug>` | `{brand, page}` |
| Flash sales | `GET /public/flash-sale/<store_id>` | `{server_time, sales}` |
| One product's flash sale | `GET /public/flash-sale/<store_id>/product/<product_id>` | `{server_time, sale, units}` |

Categories are not an endpoint: they come with the store in `check_domain.categories` (see [Store and theme](https://developers.blanxer.com/store-and-theme.md)).

Errors are HTTP 400 `{"message": "..."}`: `Product not found`, `Category not found`, `Brand not found`.

### Server-side caching

- The API caches the product lists, category lists and `check_domain` for up to 1 hour, and clears them when the merchant changes the store's products, categories or settings.
- Product detail is not cached by the API.
- The package adds `next: { revalidate: 60 }`. Store changes show on the site within about a minute, without a redeploy.

## List items

Every list endpoint (all products, page, category, search, sale, brand products) returns the same item shape:

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
  "variants": [{ "_id": "...", "price": 2500, "compare_at_price": 0, "quantity": 4 }],
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

- **Price:** a product without variants has `price`. A product with variants has either `price` (all variants cost the same) or `min_price` / `max_price` with `price: null`. Show "Rs 2,500 – 3,200" for a range.
- **`compare_at_price`** above the price means the product is discounted; show it struck through.
- **`categories`** here are category **names**, not ids.
- **`brand`** is a full `{_id, name, slug, logo}` object on the category, new-arrivals and search endpoints. The sale endpoint returns only the brand id. "All products", the paged list and brand products leave it out.
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
- It is an autocomplete search over a key built from the product name, its category names, colours, sizes and tags (tags containing `:` are left out). Best match first, up to 50 results, Active and non-POS only.

### Sale

`/product/public/sale/<store_id>` returns Active, non-POS products with a `compare_at_price` above 0 on the product or on any variant.

## One product

`GET /product/public/<store_id>/<slug>` returns the stored product plus a few extras:

| Field | Notes |
|---|---|
| `_id`, `name`, `slug`, `status`, `channel` | See the warning below |
| `description`, `long_description` | **HTML** from Blanxer's editor. Sanitize before rendering. |
| `price`, `compare_at_price`, `quantity`, `weight`, `sku`, `barcode`, `continue_selling` | Product-level values. For a product with variants, use the variant's. |
| `colors`, `sizes` | Empty when the product has no variants |
| `variants[]` | `_id`, `option_name`, `price`, `compare_at_price`, `quantity`, `sku`, `weight`, `image_url`, `barcode` |
| `image_urls[]` | Absolute image URLs |
| `categories[]` | Category **ids** (match them against `check_domain.categories`) |
| `brand` | `{_id, name, slug, logo}` or missing |
| `tags[]` | See [Tags](#tags) |
| `custom_fields` | Inputs the shopper fills; see [Checkout → Custom fields](https://developers.blanxer.com/checkout.md#custom-fields) |
| `seo_title`, `seo_description`, `seo_image` | See [SEO and tracking](https://developers.blanxer.com/seo-and-tracking.md) |
| `total_rating`, `review_count`, `reviews[]` | Reviews: `rating`, `review`, `images`, `customer_name`, `verified_purchase`, `created_at`, newest first |
| `similar_products[]` | List items (Active only) |
| `csrf_token` | Send with custom-field image uploads |
| `release_date`, `created_at`, `updated_at` | |

> **Warning: this endpoint also returns Draft, Inactive and POS-only products.** Blanxer's dashboard uses it to preview drafts. Your product page must show a 404 unless `status === 'Active'` and `channel !== 3`:
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
- A colour name can contain `/`. Split an `option_name` against the known colour and size lists (longest colour first), not on the first slash.
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
- List items have `in_stock` = `continue_selling || quantity > 0` (or any variant > 0) and `quantity` = the sum of positive stock.

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
| `rd_<Label>_<link>`, `ard_<Label>_<link>` | A "more information" button linking out; `+` in the label is a space |


## Categories

From `check_domain.categories`:

```json
{ "_id": "...", "name": "Shawls", "slug": "shawls", "image": "https://...", "order": 2,
  "seo_title": "...", "seo_description": "...", "seo_image": "...", "hide_on_product": false }
```

- Sort by `order` for menus.
- `/collections/<slug>` uses `GET /product/public/<store_id>/category/<slug>`. It returns every product in the category (not paginated); paginate in the site if needed.
- `new-arrivals` is a virtual category: the 12 newest Active, non-POS products. It is always in Blanxer's sitemap, so keep `/collections/new-arrivals` working.

## Brands

- `GET /brand/public/all/<store_id>` → `{brands: [{_id, name, slug, logo, page, desc_page, created_at, ...}]}` for `/brands`.
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
              "discount_type": "...", "discount_value": 20, "max_per_order": 2,
              "show_countdown": true, "show_stock_left": true, "sold_out": false }] }
```

`status` is `live` or `upcoming`.

### One product

`GET /public/flash-sale/<store_id>/product/<product_id>`:

```json
{ "server_time": "...", "sale": { "...same fields...": "", "offer_price_from": 999 },
  "units": { "available": 3, "in_checkout": 2 } }
```

- `sale` is `null` when the product is in no live or upcoming sale.
- `offer_price_from` is the lowest offer price, for "Rs 999 from 10:00" before the sale starts.
- `units` is only there while the sale is live, `show_stock_left` is on and the product doesn't continue selling. `in_checkout` = units held in other shoppers' checkouts.

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

- `phone` (10 digits) or `email` is required: `A phone number or email is required`.
- Only for sales that haven't started: `This sale has already started`.
- `url` is kept only if it is on the store's own domains, including the saved site link (`storefront_url`). Save the site link in Blanxer, or the alert email has no link.
- Response: `{"success": true, "message": "We'll let you know when the sale starts."}`.
- Limit: 10 per 15 minutes per IP. Call it from the browser.

## Prices and currency

- Prices are in NPR. Format with `Intl.NumberFormat('en-IN')`.
- The store's currency label is `check_domain.customization.currency_indicator` (default `रू`).

## Product images

`image_urls` and variant `image_url` are absolute URLs on Blanxer's storage. Load them with `next/image` and the package's `blanxerImageLoader` so they are resized. Don't download product photos into the site (rule 11). See [Images and speed](https://developers.blanxer.com/images-and-speed.md).
