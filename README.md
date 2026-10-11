# developers.blanxer.com

Source of https://developers.blanxer.com. Repository: https://github.com/blanxer-dev/blanxer-developers (MIT, see `LICENSE`).

The BlanxerAPI developer docs: guides for building a custom Next.js website for a Blanxer store, an `llms.txt` index for AI agents, and an OpenAPI spec for the public endpoints a site uses. A static site for Cloudflare Pages.

## Layout

```
content/*.md          the guides (source of truth); index.md is the home page
public/llms.txt       the agent index (llms.txt convention), hand-written
public/openapi.yaml   OpenAPI 3.1, only the endpoints a custom site uses
public/style.css      site styles
public/_headers       Cloudflare Pages headers (content types, CORS for agents)
scripts/build.mjs     the build
dist/                 build output (git-ignored)
```

## Build

```bash
npm install
node scripts/build.mjs
```

On Blanxer machines, call `node scripts/build.mjs` directly rather than `npm run build` (a stray `~/node_modules` can make `npm run` pick the wrong Node).

The build:

- renders every `content/<name>.md` to `dist/<name>.html` (served at `/<name>`) with the sidebar, and copies the raw file to `dist/<name>.md`;
- renders `content/index.md` as the home page;
- writes `dist/llms-full.txt`: every guide in sidebar order;
- copies `public/` into `dist/`;
- **fails** when a guide links to a page that doesn't exist, when `llms.txt` links to a file that isn't built, or when a file in `content/` isn't listed in `GUIDES` in `scripts/build.mjs`.

Guides link to each other as `https://developers.blanxer.com/<name>.md` (best for agents reading the raw files). The build rewrites those links to `/<name>` in the HTML.

Preview locally: `npx serve dist` (or any static server).

## Adding or renaming a guide

1. Add `content/<name>.md`, starting with a `# Title`.
2. Add it to `GUIDES` in `scripts/build.mjs` (that sets the sidebar order and group).
3. Add a line to `public/llms.txt`.
4. Run the build.

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm install && node scripts/build.mjs` |
| Build output directory | `dist` |
| Root directory | `/` |
| Environment variable | `NODE_VERSION` = `20` (or newer) |
| Custom domain | `developers.blanxer.com` |

Cloudflare Pages serves `dist/checkout.html` at `/checkout` and the raw `dist/checkout.md` at `/checkout.md`. `public/_headers` sets `text/markdown` / `text/plain` / `application/yaml` and `Access-Control-Allow-Origin: *` on the agent files.

## Keeping it true

Every fact here comes from code: the backend (`gigbig_backend`, branch `dev`, plus `feat/storefront-url`) and the Blanxer storefront (`blanxer-storefront-web` `main` at `cabd695`). When the checkout, an endpoint or a limit changes there, change the guide and `openapi.yaml` in the same week. The package page (`content/package.md`) describes the contract surface and defers to the package README for the released API.

Validate the spec after edits:

```bash
npx @redocly/cli lint public/openapi.yaml
```
