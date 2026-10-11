# MCP for your website

The site's code only **reads** Blanxer, through the public API. Everything you **change** in the store while building (SEO text, products, photos, categories, coupons, delivery charges, the site link) you change through the Blanxer MCP, in your chat with the merchant. The site never holds a key and never calls the MCP (rule 6).

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
| Write category and brand SEO | `blanxer_bulk_update_categories_seo`, `blanxer_update_category`, `blanxer_update_brand` | `check_domain.categories`, brand details |
| Verify Search Console, add GA / GTM | `blanxer_set_site_verification` | `check_domain.plugins` → the package renders the tags |
| Add products and photos | `blanxer_create_product`, `blanxer_bulk_create_products`, `blanxer_bulk_import_products`, `blanxer_upload_product_image`, `blanxer_request_image_upload` | Product endpoints |
| Create categories and brands for the menus | `blanxer_create_category`, `blanxer_create_brand`, `blanxer_reorder_categories` | Categories / brands |
| Set up launch coupons | `blanxer_create_coupon` | `/public/coupon` |
| Fix delivery places, charges and COD | `blanxer_get_delivery_charges`, `blanxer_update_delivery_charges` | `/public/delivery_charge` |
| Change name, logo, favicon, colours (shared with the Blanxer site and emails) | `blanxer_update_store_profile`, `blanxer_update_appearance` | `check_domain.customization` |
| Write blog posts | `blanxer_create_blog_post`, `blanxer_set_blog_post_status` | `/public/blog/*` |
| **Save the website link** | **`blanxer_set_storefront_url`** (new) | — |
| Get the feed and sitemap URLs | `blanxer_get_store_context` | — |
| Retire the subdomain site | `blanxer_update_appearance { store_visibility: 'hidden_on_subdomain' }` | — |

`blanxer_how_to` returns step-by-step guides for store tasks (SEO pass, editing products, and more).

### `blanxer_set_storefront_url`

```
blanxer_set_storefront_url { url: "https://mystore.com" }   // save or change
blanxer_set_storefront_url { url: null }                    // clear
```

- Owner or manager.
- It shows the old and the new value and asks for confirmation.
- Blanxer cleans the link to `https://<host>`: it must be `https`, with no path, query, port or login, and not an IP or `localhost`. A `*.workers.dev` link is fine.
- It returns the product feed URL, the sitemap URL, and a reminder about the subdomain switch.
- Once saved, Blanxer uses the site in SMS tracking links, the delivered email, flash-sale alerts, the product feed and the sitemap. Clearing it puts all of them back on the Blanxer domain.

This tool ships with the BlanxerAPI release of the Blanxer MCP. Until your MCP lists it, the merchant pastes the link in Blanxer → avatar menu → BlanxerAPI → Your website.

## Confirm before bulk changes (rule 13)

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
- Don't use the MCP from the site's code, and don't put an MCP token anywhere.
- Don't change `store_visibility` unless the merchant asks (see [Deploy → Retiring the old subdomain site](https://developers.blanxer.com/deploy-cloudflare.md#retiring-the-old-subdomain-site)).
- Don't put product photos in the site's repo; upload them to Blanxer.
