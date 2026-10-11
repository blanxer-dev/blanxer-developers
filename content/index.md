# BlanxerAPI developer docs

Build a custom Next.js website for a Blanxer store and deploy it to the merchant's own Cloudflare account. Blanxer stays the admin: products, stock, orders, payments, delivery and SEO data are managed in Blanxer, and the website is the front end.

> **AI agents:** read [llms.txt](https://developers.blanxer.com/llms.txt), then follow the [Quickstart](https://developers.blanxer.com/api-docs/quickstart.md). Everything is also in [one file](https://developers.blanxer.com/llms-full.txt).

Merchants start with one line to their AI agent:

> Build my Blanxer store website in Next.js and deploy it to my Cloudflare account. Follow https://developers.blanxer.com/llms.txt My store is `<subdomain>`.

## How it fits together

| Channel | Who uses it | What for |
|---|---|---|
| Public API, `https://api.blanxer.com` | The website | Store, catalog, delivery, coupons, orders, payments, tracking. No key. |
| Blanxer MCP, `https://mcp.blanxer.com/mcp` | The agent, while building | Store data: SEO text, products and photos, categories, coupons, the site link. The merchant signs in. |
| Blanxer XML files | Google and Meta | Product feed and catalog sitemap |

## Install

- Claude Code skill: `/plugin marketplace add blanxer-dev/blanxer-agent-skills` then `/plugin install blanxer-website@blanxer`
- Blanxer MCP: `claude mcp add --transport http blanxer https://mcp.blanxer.com/mcp`
- The site: start from `blanxer-dev/blanxer-storefront-starter`, which uses the `@blanxer-dev/storefront` package.

## Guides

- [Quickstart](https://developers.blanxer.com/api-docs/quickstart.md): the procedure, step by step
- [The 13 hard rules](https://developers.blanxer.com/api-docs/rules.md)
- [Store and theme](https://developers.blanxer.com/api-docs/store-and-theme.md) · [Catalog](https://developers.blanxer.com/api-docs/catalog.md) · [Checkout](https://developers.blanxer.com/api-docs/checkout.md) · [Forms and extras](https://developers.blanxer.com/api-docs/forms-and-extras.md)
- [SEO and tracking](https://developers.blanxer.com/api-docs/seo-and-tracking.md) · [Images and speed](https://developers.blanxer.com/api-docs/images-and-speed.md) · [Package](https://developers.blanxer.com/api-docs/package.md)
- [MCP for your website](https://developers.blanxer.com/api-docs/mcp-for-website.md) · [Testing](https://developers.blanxer.com/api-docs/testing.md) · [Deploy to Cloudflare](https://developers.blanxer.com/api-docs/deploy-cloudflare.md) · [Troubleshooting](https://developers.blanxer.com/api-docs/troubleshooting.md)
- [OpenAPI spec](https://developers.blanxer.com/openapi.yaml) for every endpoint a site uses
