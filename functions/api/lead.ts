/* ============================================================================
 * /api/lead — Cloudflare Pages Function: server-side proxy for the lead-capture
 * form submit. The browser POSTs the form fields here (same-origin, NO secret in
 * the client); this Function adds the x-ingest-secret header and forwards the
 * lead to the EA Ninjas OS ingest endpoint in Supabase.
 *
 * WHY A PROXY (not a direct client POST): the ingest endpoint is gated by a
 * shared secret (x-ingest-secret). Putting that secret in the static client
 * bundle would publish it in a public repo + page source. Holding it as a
 * Cloudflare Pages environment variable (INGEST_SHARED_SECRET) keeps it
 * server-side. The browser never sees a credential.
 *
 * GO-LIVE PREREQ (one Ben action): set the env var on the avninjas-site
 * Cloudflare Pages project →  Settings → Environment variables →
 *   INGEST_SHARED_SECRET = <the value Larry set as the Supabase secret>
 * Until it is set this Function returns 503 (fails safe — never an unauth write).
 *
 * Contract: supabase/functions/ingest-lead/README.md (the lead "in" path).
 * ==========================================================================*/

interface Env {
  INGEST_SHARED_SECRET?: string;
}

const INGEST_URL =
  "https://mgypehaaykwamwxkotdi.functions.supabase.co/ingest-lead";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Return a trimmed non-empty string or undefined (so the ingest function's
// "every field optional except channel/source_form + one contact" rules hold).
function clean(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.INGEST_SHARED_SECRET) {
    // Mirrors the ingest function's own 503-when-unconfigured posture.
    return json({ ok: false, error: "not configured" }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "bad request" }, 400);
  }

  const email = clean(body.email);
  const name = clean(body.name);
  const message = clean(body.message);
  if (!email && !name && !message) {
    return json({ ok: false, error: "no contact field" }, 422);
  }

  // Attribution: the client forwards window.__avnAttribution (canonical keys)
  // plus wbraid/gbraid (URL) and fbp (the _fbp cookie) under `attribution`.
  const a = (body.attribution && typeof body.attribution === "object"
    ? (body.attribution as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const gclid = clean(a.gclid) ?? clean(body.gclid);
  const wbraid = clean(a.wbraid) ?? clean(body.wbraid);
  const gbraid = clean(a.gbraid) ?? clean(body.gbraid);
  const fbclid = clean(a.fbclid) ?? clean(body.fbclid);
  const fbp = clean(a.fbp) ?? clean(body.fbp);
  const li_fat_id = clean(a.li_fat_id) ?? clean(body.li_fat_id);

  // Channel derivation from the click-id that is present. The ingest schema
  // REQUIRES a channel enum; we infer it from attribution. SAFE DEFAULT when no
  // paid click-id is present: `linkedin_organic` — the only NON-paid bucket, so a
  // no-attribution submit can NEVER arm a paid conversion for the wrong channel.
  // [FLAG-BEN] confirm this default is acceptable; alternative is to reject
  // no-attribution submits, but the schema stores them (just non-reportable).
  let channel: "google" | "meta" | "linkedin" | "linkedin_organic" =
    "linkedin_organic";
  if (gclid || wbraid || gbraid) channel = "google";
  else if (fbclid) channel = "meta";
  else if (li_fat_id) channel = "linkedin";

  const payload: Record<string, unknown> = {
    channel,
    source_form: "website", // the HVCO opt-in is a website form
    email,
    name,
    message,
    gclid,
    wbraid,
    gbraid,
    fbclid,
    fbp,
    li_fat_id,
    utm_source: clean(a.utm_source),
    utm_medium: clean(a.utm_medium),
    utm_campaign: clean(a.utm_campaign),
    utm_term: clean(a.utm_term),
    utm_content: clean(a.utm_content),
    landing_path: clean(a.landing_page) ?? clean(body.landing_path) ?? "/hvco",
    captured_at: new Date().toISOString(),
    event_id: clean(body.event_id), // browser pixel event_id for dedup, if any
  };
  // Drop undefined keys so the payload stays clean.
  for (const k of Object.keys(payload)) {
    if (payload[k] === undefined) delete payload[k];
  }

  let upstream: Response;
  try {
    upstream = await fetch(INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-secret": env.INGEST_SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ ok: false, error: "upstream unreachable" }, 502);
  }

  const data = (await upstream.json().catch(() => ({}))) as {
    ok?: boolean;
  };
  if (upstream.status === 201 && data.ok) {
    // Do not leak lead_id / internals to the browser; a bare ok is enough.
    return json({ ok: true }, 200);
  }
  // Surface a generic failure; details are logged upstream, not leaked here.
  return json({ ok: false, error: "ingestion failed" }, 502);
};
