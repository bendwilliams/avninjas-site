/* ============================================================================
 * attribution.js — ad-attribution link tagging ("which ad did this visitor
 * come from"). Felix, foundations-tracking-privacy branch (2026-06-25).
 *
 * WHAT IT DOES
 *   1. On landing, reads the URL query for the attribution params below.
 *   2. Persists the FIRST-touch set in a first-party cookie + localStorage so it
 *      survives navigation across the session (and across visits, up to TTL).
 *   3. Injects them as hidden <input> fields into every <form> on the page so
 *      they travel with each submission into the lead/attribution loop.
 *
 * PRIVACY NOTE: these are click/campaign identifiers the visitor already carries
 * in their own URL — first-party only, no third party is contacted by this file.
 * It is essential (functional) attribution, so it runs regardless of consent;
 * the consent banner governs analytics/ad STORAGE pixels (in GTM), not this.
 *
 * Config (cookie name / TTL) mirrors src/lib/tracking-config.ts. If you change
 * the names there, change them here — kept in sync by hand (plain static JS).
 * ==========================================================================*/
(function () {
  "use strict";

  var COOKIE_NAME = "avn_attribution";
  var STORAGE_KEY = "avn_attribution";
  var TTL_DAYS = 90;

  /* The captured parameters. UTMs + the three platform click IDs. */
  var PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid", // Google Ads
    "fbclid", // Meta / Facebook
    "li_fat_id", // LinkedIn
  ];

  /* Hidden-field names injected into forms (documented in the privacy page +
     the build report). One field per param, prefixed so they never collide with
     real form fields. */
  var FIELD_PREFIX = "attr_";

  function readCookie(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    /* Lax so it survives same-site navigation; Secure on https. */
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; expires=" +
      expires +
      "; path=/; SameSite=Lax" +
      secure;
  }

  function getStored() {
    /* localStorage first (richer), fall back to cookie. */
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* localStorage blocked — fall through to cookie */
    }
    var c = readCookie(COOKIE_NAME);
    if (c) {
      try {
        return JSON.parse(c);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }

  function setStored(data) {
    var json = JSON.stringify(data);
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      /* ignore */
    }
    writeCookie(COOKIE_NAME, json, TTL_DAYS);
  }

  function readFromUrl() {
    var qs = new URLSearchParams(window.location.search);
    var found = {};
    var any = false;
    for (var i = 0; i < PARAMS.length; i++) {
      var key = PARAMS[i];
      if (qs.has(key)) {
        var val = qs.get(key);
        if (val) {
          found[key] = val;
          any = true;
        }
      }
    }
    return any ? found : null;
  }

  /* First-touch wins: only fill params that aren't already stored. */
  function merge(existing, incoming) {
    var result = existing ? Object.assign({}, existing) : {};
    if (incoming) {
      for (var key in incoming) {
        if (
          Object.prototype.hasOwnProperty.call(incoming, key) &&
          !result[key] // first-touch: do not overwrite an existing value
        ) {
          result[key] = incoming[key];
        }
      }
    }
    if (!result._first_seen) result._first_seen = new Date().toISOString();
    result._landing_page = result._landing_page || window.location.pathname;
    return result;
  }

  function injectIntoForms(data) {
    if (!data) return;
    var forms = document.querySelectorAll("form");
    forms.forEach(function (form) {
      for (var key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        var fieldName = FIELD_PREFIX + key.replace(/^_/, ""); // attr_utm_source, attr_first_seen, ...
        var existing = form.querySelector('input[name="' + fieldName + '"]');
        if (existing) {
          existing.value = data[key];
          continue;
        }
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = fieldName;
        input.value = data[key];
        form.appendChild(input);
      }
    });
  }

  function run() {
    var incoming = readFromUrl();
    var existing = getStored();
    var merged = merge(existing, incoming);
    /* Only persist if we have something worth keeping. */
    if (Object.keys(merged).length > 0) {
      setStored(merged);
    }
    injectIntoForms(merged);

    /* Re-inject into any form added later (defensive — site is static today). */
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        injectIntoForms(getStored());
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    /* Expose for debugging / Vera verification. */
    window.__avnAttribution = merged;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
