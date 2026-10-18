# MCP for your website

The site's code only **reads** Blanxer, through the public API. Everything you **change** in the store while building (SEO text, products, photos, categories, offers and codes, delivery charges, the site link) you change through the Blanxer MCP, in your chat with the merchant. The site never holds a key and never calls the MCP (rule 6).

## Connect

The server is `https://mcp.blanxer.com/mcp` (streamable HTTP). The merchant signs in to Blanxer in the browser (OAuth). You never see a password or key, and you never ask for one.

**Claude Code**

```bash
claude mcp add --transport http blanxer https://mcp.blanxer.com/mcp
```

Or install the skill, which brings the MCP with it:

```
/plugin marketplace add blanxer-dev/blanxer-agent-skills
/plugin install blanxer-website@blanxer
```

Then run `/mcp`, pick `blanxer` and sign in.

**Connect it first, before any other work.** Claude Code only loads a newly added MCP server when it starts. If you add it during a conversation, the merchant has to restart. Do it straight away, while nothing is lost: type `/exit`, then run `claude -c` **from the same folder** Claude Code was started in. `claude -c` reopens the same conversation with its history; a plain `claude` starts a new, empty one. Signing in through `/mcp` to a server that is already added needs no restart. Codex resumes with `codex resume --last`.

**Cursor**: add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json`:

```json
{ "mcpServers": { "blanxer": { "url": "https://mcp.blanxer.com/mcp" } } }
```

**Codex**: add to `~/.codex/config.toml`:

```toml
[mcp_servers.blanxer]
url = "https://mcp.blanxer.com/mcp"
```

Sign in when Codex asks (recent versions: `codex mcp login blanxer`).

**claude.ai**: Settings → Connectors → Add custom connector → URL `https://mcp.blanxer.com/mcp`.

The tools act as the person who signed in, with their role in the store. Most writes need the **owner** or a **manager**. If a tool says the role isn't allowed, ask the merchant to sign in as the owner.

## What you use it for

| While building the site you… | MCP tool | The site reads it from |
|---|---|---|
| Find SEO gaps | `blanxer_audit_seo` | — |
| Write product titles and descriptions for search | `blanxer_update_product_status_seo`, `blanxer_bulk_update_products` | Product `seo_*` → page metadata |
| Write category and brand SEO | `blanxer_bulk_update_categories_seo`, `blanxer_update_category`, `blanxer_update_brand` (brand SEO is saved only when the brand has a page; `''` can't clear a field) | `check_domain.categories`, brand details |
| Verify Search Console, add GA / GTM | `blanxer_set_site_verification` | `check_domain.plugins` → the package renders the tags |
| Add products and photos | `blanxer_create_product`, `blanxer_bulk_create_products`, `blanxer_bulk_import_products`, `blanxer_upload_product_image`, `blanxer_request_image_upload` | Product endpoints |
| Create categories and brands for the menus | `blanxer_create_category`, `blanxer_create_brand`, `blanxer_reorder_categories` | Categories / brands |
| Set up launch offers and codes | `blanxer_create_offer` (stores on Offers), `blanxer_create_coupon` (other stores). See [Launch offers](#launch-offers) | `/public/promotions` (Offers) or `/public/coupon` |
| Fix delivery places, charges and COD | `blanxer_get_delivery_charges`, `blanxer_update_delivery_charges` | `/public/delivery_charge` |
| Change the store name or description (shared with the Blanxer site) | `blanxer_update_store_profile` (only the top-level `name` and `description`) | `check_domain.name`, `description` |
| Change logo, favicon, brand name or colours (shared with the Blanxer site and emails) | `blanxer_update_appearance` | `check_domain.customization` |
| Write blog posts | `blanxer_create_blog_post` (an empty post), then its body with `blanxer_add_section` / `blanxer_update_section` using `{ post_id }`, then `blanxer_set_blog_post_status` | `/public/blog/*` |
| **Save the website link** | **`blanxer_set_storefront_url`** (new): preview, then `{ dry_run: false, confirm_token }` | — |
| Get the feed and sitemap URLs | `blanxer_get_store_context` (only once a website link is saved) | — |
| Retire the subdomain site | `blanxer_update_appearance { store_visibility: 'hidden_on_subdomain' }` | — |

`blanxer_how_to` returns step-by-step guides for store tasks (SEO pass, editing products, and more). For the whole custom-site flow: `blanxer_how_to { operation: 'custom_website' }`.

With a website link saved, `blanxer_audit_seo` treats the custom site as the live site and reports `<site>/sitemap.xml` as the sitemap to submit.

### `blanxer_set_storefront_url`

```
blanxer_set_storefront_url { url: "https://mystore.com" }              // preview a save or change
blanxer_set_storefront_url { url: null }                               // preview clearing it
blanxer_set_storefront_url { dry_run: false, confirm_token: "..." }    // apply, after the merchant's yes
```

- Owner or manager.
- **The first call saves nothing.** It shows the old and the new value and returns a `confirm_token`. Show the merchant the change; after their yes, call again with `{ dry_run: false, confirm_token }` only. If the link changed since the preview, the apply is refused; preview again.
- Blanxer cleans the link to `https://<host>`: it must be `https`, with no path, query, port or login, and not an IP or `localhost`. A bare `mystore.com` becomes `https://mystore.com`. A `*.workers.dev` link is fine. The MCP refuses `*.blanxer.io` and `*.blanxer.com` addresses (those are the Blanxer-hosted site).
- A save returns the product feed URL, the sitemap URL, and a reminder about the subdomain switch. Clearing returns only a confirmation (and a warning if the subdomain site is still hidden).

Once saved, Blanxer uses the site in:

- the tracking link it generates (dashboard copy, `get_tracking_link`);
- the confirmation emails of orders created in the dashboard, as leads or through Sambad (orders placed on the site use the site's own `url`);
- the delivered email;
- flash-sale alerts: the alert links to the `url` the site sent with "Notify me", which is kept only when it is on the store's domains, the saved link included;
- the product feed and the catalog sitemap.

Whether SMS short links follow it is not yet verified. Clearing the link puts these back on the custom domain if the store has one, else the subdomain (the delivered email falls back to `<sub>.blanxer.com`).

This tool ships with the BlanxerAPI release of the Blanxer MCP. Until your MCP lists it, the merchant pastes the link in the Blanxer dashboard → avatar menu → BlanxerAPI → Your website (rolling out).

## Launch offers

A launch discount, free delivery over an amount, buy more save more, buy X get Y, a free gift or a bundle are **offers**. They need the store's **Offers** plugin.

1. `blanxer_get_store_context` says whether the store is on Offers (`offers.enabled`). Every plan can have it. The owner or a manager turns it on in the Blanxer dashboard (Offers in the menu, in place of Discount Coupons); it can't be turned on through the MCP. Turning it on moves the store's coupons into Offers with the same codes and use counts.
2. Not on Offers and the merchant doesn't want it: a code is a coupon (`blanxer_create_coupon`), for website checkout only. Automatic offers, tiers, gifts and bundles need Offers.
3. On Offers: `blanxer_how_to` with `create_discount_code`, `create_automatic_offer`, `buy_more_save_more`, `buy_x_get_y`, `free_gift`, `bundle_offer` or `offer_performance` returns the exact call for this store.

| Tool | What |
|---|---|
| `blanxer_list_offers` | The store's offers with state (live, scheduled, paused, ended, draft, archived), code and numbers (uses, discount, revenue). Check a code isn't taken before creating one |
| `blanxer_get_offer` | One offer's rules in plain words, its codes and recent orders |
| `blanxer_create_offer` | Any kind: `amount_off`, `free_delivery`, `tiers`, `bxgy`, `bundle`, `gift`; automatic, or with a `code`. Products, variants, categories and places are checked before saving |
| `blanxer_update_offer` | Change only what changes; the tool merges it into the saved offer |
| `blanxer_set_offer_status` | Pause or resume at once. Archive is preview-first (`confirm_token`) and can't be undone |
| `blanxer_quote_cart` | What a manual or POS order costs with the store's offers and a code: line discounts, gift lines, the code's result. It doesn't price the website |
| `blanxer_get_offer_performance` | Orders, revenue, discount given and gifts, for all offers or one |

- **Show the merchant the offer before creating it**: what the shopper gets, on which products, from when to when, and the limits. Create it after their yes. Start dates and end days are Nepal time.
- An offer shows on the site by itself: the site reads `/public/promotions` live, so there is nothing to redeploy. It must include the website in `channels` (the default is all three: `web`, `pos`, `manual`). Keep `display.public` on for offers the site should list; a code meant for one influencer or customer can be hidden (`display: { public: false }`) and still works when typed.
- Check the result on the site: add the products to the cart and read the totals (they come from the quote). From your terminal, one `POST /public/promotions/<store_id>/quote` with the same lines gives the same answer.
- The site never creates or changes offers, and the agent never computes a discount for it (rule 13).

## Confirm before bulk changes (rule 14)

Store data is live and shared with the dashboard, POS and mobile app. Before any change that touches many records (SEO for many products, imports, category renames, delivery charges):

1. Run the tool with `dry_run: true` where it has one, or list what will change.
2. Show the merchant the list or a sample, with counts.
3. Apply only after a clear yes.

The MCP's own confirmations still apply on top of this. Never invent product facts, reviews or claims in SEO text; use the product's own data and the merchant's words.

## What not to do

- **Don't use the page-builder tools on a custom site** (rule 12). These change the **Blanxer-hosted** site only:
  - `blanxer_add_section`, `blanxer_update_section`, `blanxer_move_section`, `blanxer_remove_section`, `blanxer_duplicate_section`
  - `blanxer_apply_page_template`, `blanxer_create_page`, `blanxer_update_page`, `blanxer_duplicate_page`, `blanxer_delete_page`
  - `blanxer_update_navigation`, `blanxer_update_footer`

  The custom site's design, menus and footer live in its code.

  **Exception: blog post bodies.** `blanxer_create_blog_post` makes an empty post; write its body with `blanxer_add_section` / `blanxer_update_section` using `{ post_id }`. That is content the site shows (the post's `sections`), so use them for blog posts.
- Don't use the MCP from the site's code, and don't put an MCP token anywhere.
- Don't change `store_visibility` unless the merchant asks (see [Deploy → Retiring the old subdomain site](https://developers.blanxer.com/api-docs/deploy-cloudflare.md#retiring-the-old-subdomain-site)).
- Don't put product photos in the site's repo; upload them to Blanxer.
