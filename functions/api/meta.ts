/**
 * POST /api/meta: Meta Conversions API relay for developers.blanxer.com (Cloudflare Pages Function).
 *
 * The browser sends the same event it fires on the pixel, with the same event_id (src/lib/pixel.ts).
 * This adds what only a server sees (IP, user agent, the _fbp/_fbc cookies) and posts it to Meta, so
 * ad blockers and iOS don't lose it, and Meta dedupes the two copies by event_id.
 *
 * Secrets (Pages project settings, or `wrangler pages secret put … --project-name blanxer-developers`):
 *   META_CAPI_TOKEN        Events Manager → the Blanxer pixel → Settings → Conversions API → access token.
 *                          Without it the relay accepts and drops events (the pixel still works).
 *   META_TEST_EVENT_CODE   optional: route events to Events Manager → Test events while checking.
 *
 * Guards: only this site's own events (allowlist), same-origin requests only, small bodies, no
 * personal data accepted from the browser.
 */

const PIXEL_ID = "1438544826749597";
const GRAPH_VERSION = "v25.0"; // same as the Blanxer backend (src/services/meta_capi)
const EVENTS = new Set(["PageView", "ViewContent", "CopyPrompt"]);
const SITE_HOSTS = new Set(["developers.blanxer.com", "blanxer-developers.pages.dev", "127.0.0.1", "localhost"]);
const MAX_BODY = 4096;

type Env = { META_CAPI_TOKEN?: string; META_TEST_EVENT_CODE?: string };
type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void };

const noContent = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
const bad = (msg: string, status = 400) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const hostOf = (url: string | null) => {
  try {
    return url ? new URL(url).hostname : "";
  } catch {
    return "";
  }
};
const isOurHost = (host: string) => SITE_HOSTS.has(host) || host.endsWith(".blanxer-developers.pages.dev");

const cookie = (header: string | null, name: string) => {
  const m = (header || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
};

/** `_fbc` when the browser has it, else built from the ad click id (Meta's `fb.1.<ms>.<fbclid>`). */
const fbcOf = (cookieFbc: string | undefined, sourceUrl: string) => {
  if (cookieFbc) return cookieFbc;
  try {
    const fbclid = new URL(sourceUrl).searchParams.get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
  } catch {
    return undefined;
  }
};

/** Only short strings and numbers from the browser; nothing that could carry personal data. */
const cleanCustomData = (raw: unknown) => {
  const out: Record<string, string | number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 10)) {
    if (!/^[a-z_]{1,40}$/.test(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 120);
  }
  return out;
};

export const onRequestPost = async ({ request, env, waitUntil }: Ctx): Promise<Response> => {
  // Same-origin only: the browser always sends Origin on a POST.
  const origin = request.headers.get("origin");
  if (!isOurHost(hostOf(origin))) return bad("forbidden", 403);

  const text = await request.text();
  if (text.length > MAX_BODY) return bad("too large", 413);
  let body: { event_name?: string; event_id?: string; event_source_url?: string; custom_data?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return bad("bad json");
  }

  const name = String(body.event_name || "");
  const eventId = String(body.event_id || "").slice(0, 64);
  const sourceUrl = String(body.event_source_url || "");
  if (!EVENTS.has(name) || !eventId || !isOurHost(hostOf(sourceUrl))) return bad("bad event");

  // Not configured yet: accept and drop, so the browser never sees an error.
  if (!env.META_CAPI_TOKEN) return noContent();

  const cookies = request.headers.get("cookie");
  const userData: Record<string, string> = {};
  const ip = request.headers.get("cf-connecting-ip");
  const ua = request.headers.get("user-agent");
  const fbp = cookie(cookies, "_fbp");
  const fbc = fbcOf(cookie(cookies, "_fbc"), sourceUrl);
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: cleanCustomData(body.custom_data),
      },
    ],
  };
  if (env.META_TEST_EVENT_CODE) payload.test_event_code = env.META_TEST_EVENT_CODE;

  // Answer the browser at once; send to Meta in the background.
  waitUntil(
    fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (r) => {
        if (!r.ok) console.log("meta capi", r.status, (await r.text()).slice(0, 300));
      })
      .catch((e) => console.log("meta capi failed", String(e))),
  );
  return noContent();
};

export const onRequest = async (): Promise<Response> => bad("method not allowed", 405);
