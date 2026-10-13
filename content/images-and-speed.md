# Images and speed

Most shoppers in Nepal browse on mid-range phones over mobile data. Image weight is the main reason a store site is slow. Every BlanxerAPI site must pass these targets before it is deployed:

- **Lighthouse mobile ≥ 90** on the home page, a product page and `/checkout`;
- **LCP < 2.5 s**.

`npx blanxer-storefront check` measures them (see [Package](https://developers.blanxer.com/api-docs/package.md#cli)).

## Rule 11, in full

**Optimise every image before it goes into the site.**

- Use `npx blanxer-storefront images`:
  - resize to the largest size shown ×2 (hero 2560 px, banner 1600, card 800);
  - export AVIF + WebP at ~75 quality;
  - strip EXIF and location data;
  - use SVG for logos when available.
- Never commit originals.
- Load with `next/image`: each page's main (LCP) image gets `preload`, the rest load lazily with correct `sizes`.
- **Product photos go into Blanxer through the MCP, never into the site.**
- No autoplay video backgrounds or GIF banners unless the merchant insists after hearing the speed cost.
- Fonts go through `next/font`, at most 2 families.

## Size per slot

Export at twice the largest width the slot is shown at, so it stays sharp on high-density screens.

| Slot | Shown at (CSS px, widest) | Export width | `sizes` example |
|---|---|---|---|
| Hero, full-width banner | 1280 | **2560** | `100vw` |
| Banner, half-width promo, blog cover | 800 | **1600** | `(max-width: 768px) 100vw, 50vw` |
| Product card, category tile, brand tile | 400 | **800** | `(max-width: 768px) 50vw, 25vw` |
| Logo | — | **SVG** when there is one; else 2× the shown height | — |
| Share image (`og:image`) | — | 1200 × 630, WebP or JPEG | — |

Budget, enforced by the check command:

- no file in `public/` over **300 KB**;
- no file wider than **2560 px**;
- no JPEG or PNG where WebP or AVIF fits (PNG stays fine for a logo with no SVG);
- every image rendered through `next/image` with a width and height (or `fill` with `sizes`);
- each page's main (LCP) image marked with `preload` (or `loading="eager"` + `fetchPriority="high"`); the check warns when no image is marked.

## Optimising a merchant's images

The merchant sends a hero photo, banner art, a logo. Before any of it goes into the repo:

```bash
npx blanxer-storefront images ./incoming ./public/images
```

It resizes, writes AVIF and WebP next to each other, strips metadata (EXIF, GPS) and prints a size report. Show the merchant a before/after table, for example:

| Image | Original | AVIF | WebP |
|---|---|---|---|
| hero.jpg | 6.8 MB, 6000 px | 212 KB, 2560 px | 298 KB, 2560 px |
| banner-sale.png | 2.1 MB, 3200 px | 96 KB, 1600 px | 141 KB, 1600 px |

Delete the originals; never commit them (`./incoming` belongs in `.gitignore`). Options and defaults: see the package README.

## Loading images

```tsx
import Image from 'next/image';
import hero from '@/public/images/hero.avif';

export function Hero() {
  return <Image src={hero} alt="New winter collection" preload sizes="100vw" placeholder="blur" />;
}
```

- **One main image per page, marked with `preload`**: the largest image above the fold (usually the LCP element). Next.js 16 deprecates `priority`; use `preload`, or `loading="eager"` with `fetchPriority="high"`. Everything else loads lazily, which is `next/image`'s default.
- Always give `sizes` for responsive images, or the browser downloads the widest file.
- Write real `alt` text. Product images: the product name (and variant).
- Keep the image config the starter ships with. It is set up for Cloudflare Workers.

## Product photos

Product photos live in Blanxer. `image_urls` and variant `image_url` are absolute URLs on Blanxer's storage, often uploaded straight from a phone camera at full size. Never download them into the site. Load them through the package's loader, which asks a resize service for the width `next/image` needs:

```tsx
import Image from 'next/image';
import { blanxerImageLoader } from '@blanxer-dev/storefront/next';

<Image
  loader={blanxerImageLoader}
  src={product.image_urls[0]}
  alt={product.name}
  width={800}
  height={800}
  sizes="(max-width: 768px) 50vw, 25vw"
/>
```

The Blanxer-hosted storefront uses `https://wsrv.nl/?w=<width>&url=<image>` for thumbnails today. The package's loader does the same by default (WebP output, quality 75). `NEXT_PUBLIC_BLANXER_IMAGE_LOADER` switches it: `wsrv` (default), `cloudflare` (Cloudflare Image Transformations on the site's own zone, `/cdn-cgi/image/...`; the merchant must turn Transformations on in Cloudflare) or `none`. The loader hides the choice, so site code doesn't change. Local files and SVGs are passed through unchanged (they are already optimised).

To use it for every `next/image`, set it once in `next.config.ts`. If the starter already sets an image loader, keep the starter's setting:

```ts
// next.config.ts
const nextConfig = { images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts' } };
export default nextConfig;

// src/lib/image-loader.ts
export { default } from '@blanxer-dev/storefront/image-loader';
```

New or better product photos go **into Blanxer through the MCP** (`blanxer_upload_product_image`, `blanxer_request_image_upload`), so the dashboard, POS, app, feed and site all get them. See [MCP for your website](https://developers.blanxer.com/api-docs/mcp-for-website.md).

## Video and GIFs

- No autoplay video backgrounds and no GIF banners by default. A 10-second background video is often heavier than the rest of the page together.
- If the merchant insists after hearing the cost, use a short, muted MP4/WebM with a `poster` image, `preload="none"`, no autoplay on mobile, and keep the poster as the LCP image.
- An animated banner is better as an AVIF/WebP sequence or CSS animation than a GIF.

## Fonts

- Load fonts with `next/font` (`next/font/google` or `next/font/local`). It self-hosts them and avoids layout shift.
- At most **2 families**. The store's font (`customization.font`, default Poppins) is usually one of them.
- Load only the weights you use, with `display: 'swap'`.
- If the site shows Nepali text, pick a family with a `devanagari` subset (for example Mukta or Noto Sans Devanagari) and include that subset. It still counts toward the 2.

## Other speed rules

- Read store and catalog data in **server components** (`@blanxer-dev/storefront/server`), not with client-side fetches above the fold.
- Keep client components small: cart, variant picker, checkout. Don't make whole pages client components.
- Load third-party tags (GA, GTM, Pixel, Clarity, chat widgets) with `next/script` `strategy="afterInteractive"` or `lazyOnload`.
- Avoid heavy UI and animation libraries for things CSS can do. They also count toward the Worker size limit (see [Deploy](https://developers.blanxer.com/api-docs/deploy-cloudflare.md#worker-size)).
- Don't render page-builder data or embed the Blanxer-hosted site.

## When the check fails

| Failure | Fix |
|---|---|
| A file in `public/` is over 300 KB | Re-run `blanxer-storefront images` with the slot's export width; lower quality to ~65 for photos |
| A file is wider than 2560 px | It was committed unresized. Resize it. |
| JPEG/PNG found | Convert to AVIF + WebP |
| Image without width/height or `sizes` | Add them, or use `fill` + `sizes` |
| No image marked as main (warning) / the wrong one | Put `preload` on the LCP image only |
| LCP over 2.5 s | Usually the hero: check its size, `preload`, and that nothing (a font, a client fetch, a carousel script) delays it |
| Lighthouse under 90 | Read the report's top items; most often images, unused JavaScript or a third-party script loaded too early |
