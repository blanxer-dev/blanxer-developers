/**
 * Meta Pixel + Conversions API for developers.blanxer.com.
 *
 * Same Blanxer pixel as blanxer.com and enterprise.blanxer.com. Every event goes two ways
 * with ONE event id, so Meta counts it once:
 *   - the browser pixel (`fbq`), and
 *   - our Cloudflare function `/api/meta` (functions/api/meta.ts), which sends it on to the
 *     Conversions API server-side, so ad blockers and iOS don't lose it.
 *
 * Events:
 *   PageView     every page, including client-side navigations (MetaPixel)
 *   ViewContent  a "Build with <tool>" page (TrackView)
 *   CopyPrompt   the prompt was copied (custom event; PromptBox)
 */
export const META_PIXEL_ID = "1438544826749597";

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export type PixelEvent = "PageView" | "ViewContent" | "CopyPrompt";
const STANDARD: PixelEvent[] = ["PageView", "ViewContent"];

const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * The pixel's base code, run once from here rather than a <Script> tag: a page can fire an
 * event (ViewContent on mount) before a deferred script has loaded, and that event was lost.
 * The stub queues calls, and `init` is always queued first.
 */
export function ensurePixel() {
  if (typeof window === "undefined" || window.fbq) return;
  /* eslint-disable */
  // prettier-ignore
  (function(f: any,b: Document,e: string,v: string){if(f.fbq)return;const n: any=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];const t=b.createElement(e) as HTMLScriptElement;t.async=!0;t.src=v;const s=b.getElementsByTagName(e)[0];s.parentNode!.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq!("init", META_PIXEL_ID);
}

/** Fire an event on the pixel and the Conversions API. Never throws: tracking must not break the page. */
export function track(event: PixelEvent, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  ensurePixel();
  const eventID = newEventId();
  try {
    window.fbq?.(STANDARD.includes(event) ? "track" : "trackCustom", event, params, { eventID });
  } catch {
    /* blocked or not loaded */
  }
  try {
    const body = JSON.stringify({ event_name: event, event_id: eventID, event_source_url: location.href, custom_data: params });
    const sent = navigator.sendBeacon?.("/api/meta", new Blob([body], { type: "application/json" }));
    if (!sent) void fetch("/api/meta", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* offline or blocked */
  }
}
