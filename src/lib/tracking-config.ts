/**
 * tracking-config.ts — THE single source of truth for measurement IDs + consent.
 * ----------------------------------------------------------------------------
 * Felix, foundations-tracking-privacy branch (2026-06-25).
 *
 * Everything that needs a real account ID lives HERE and nowhere else. When Ben
 * provisions the real Google Tag Manager container under his Google account,
 * change GTM_CONTAINER_ID in this ONE place and rebuild — no other file edits.
 *
 * Mack adds GA4 (and any pixels) INSIDE the GTM container later, gated on the
 * consent signals this file defines. We deliberately do NOT hardcode a GA4 tag,
 * a Meta pixel, or a LinkedIn Insight tag in the source — they ride inside GTM
 * so consent governs them centrally.
 */

/**
 * Google Tag Manager container ID.
 * PLACEHOLDER — not a real container. Replace with Ben's real ID, then rebuild.
 */
export const GTM_CONTAINER_ID = "GTM-XXXXXXX"; // TODO: real container id (Ben's Google account)

/** True only once a real-looking GTM id is set (gates the snippet so the placeholder never loads a bogus container). */
export const GTM_ENABLED =
  /^GTM-[A-Z0-9]{6,}$/.test(GTM_CONTAINER_ID) && GTM_CONTAINER_ID !== "GTM-XXXXXXX";

/**
 * First-party storage keys (cookie + localStorage). Kept here so the privacy
 * page, the banner, and the attribution script all agree on the names.
 */
export const CONSENT_STORAGE_KEY = "avn_consent"; // stores "granted" | "denied" | per-category JSON
export const CONSENT_COOKIE_NAME = "avn_consent";
export const ATTRIBUTION_COOKIE_NAME = "avn_attribution";
export const ATTRIBUTION_STORAGE_KEY = "avn_attribution";

/** How long the consent choice and the attribution data persist (days). */
export const CONSENT_TTL_DAYS = 180; // 6 months
export const ATTRIBUTION_TTL_DAYS = 90;
