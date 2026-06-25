/* ============================================================================
 * consent.js — consent persistence + Google Consent Mode v2 updates.
 * Felix, foundations-tracking-privacy branch (2026-06-25).
 *
 * The Consent Mode DEFAULTS (everything DENIED) are set INLINE in the document
 * <head> by BaseLayout.astro, BEFORE GTM loads — that is mandatory for Consent
 * Mode v2 to apply the default to the very first hit. This file only handles the
 * AFTER-CHOICE updates and persistence.
 *
 * Storage: a first-party cookie + localStorage (key "avn_consent"). The banner
 * reappears only when no stored choice exists. Privacy-preserving: nothing
 * non-essential fires until the visitor clicks Accept (defaults stay DENIED).
 *
 * Config (names / TTL) mirrors src/lib/tracking-config.ts — kept in sync by hand.
 * ==========================================================================*/
(function () {
  "use strict";

  var STORAGE_KEY = "avn_consent";
  var COOKIE_NAME = "avn_consent";
  var TTL_DAYS = 180;

  /* The Consent Mode v2 signals we govern. Defaults (DENIED) are set in <head>;
     these are what we flip on Accept / per-category. */
  var DEFAULT_GRANTED = {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  };
  var ALL_DENIED = {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  };

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function writeCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
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

  function readStored() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* fall through */
    }
    var match = document.cookie.match(/(?:^|; )avn_consent=([^;]*)/);
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[1]));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }

  function persist(choice) {
    var record = { choice: choice.choice, categories: choice.categories, ts: new Date().toISOString() };
    var json = JSON.stringify(record);
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      /* ignore */
    }
    writeCookie(COOKIE_NAME, json, TTL_DAYS);
  }

  /* Apply a category map to Consent Mode + persist. */
  function apply(categories, label) {
    var update = {
      analytics_storage: categories.analytics ? "granted" : "denied",
      ad_storage: categories.ads ? "granted" : "denied",
      ad_user_data: categories.ads ? "granted" : "denied",
      ad_personalization: categories.ads ? "granted" : "denied",
    };
    gtag("consent", "update", update);
    /* Push an event so GTM triggers can fire tags now that consent changed. */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "consent_update", consent_choice: label });
    persist({ choice: label, categories: categories });
    window.__avnConsent = { choice: label, categories: categories, applied: update };
  }

  var AVNConsent = {
    /** Has the visitor made a choice yet? (Banner shows only when false.) */
    hasChoice: function () {
      return readStored() !== null;
    },
    getStored: readStored,
    acceptAll: function () {
      apply({ analytics: true, ads: true }, "accept_all");
    },
    rejectAll: function () {
      apply({ analytics: false, ads: false }, "reject_all");
    },
    /** Save a granular choice from the preferences UI. */
    savePreferences: function (categories) {
      apply(
        { analytics: !!categories.analytics, ads: !!categories.ads },
        "custom"
      );
    },
    /** Re-open the banner (e.g. a "Cookie settings" footer link). */
    reset: function () {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* ignore */
      }
      writeCookie(COOKIE_NAME, "", -1);
      document.dispatchEvent(new CustomEvent("avn:consent-reset"));
    },
    /** On load: re-apply a previously stored choice to Consent Mode. */
    rehydrate: function () {
      var stored = readStored();
      if (stored && stored.categories) {
        var label = stored.choice || "rehydrated";
        var update = {
          analytics_storage: stored.categories.analytics ? "granted" : "denied",
          ad_storage: stored.categories.ads ? "granted" : "denied",
          ad_user_data: stored.categories.ads ? "granted" : "denied",
          ad_personalization: stored.categories.ads ? "granted" : "denied",
        };
        gtag("consent", "update", update);
        window.__avnConsent = { choice: label, categories: stored.categories, applied: update };
      }
    },
  };

  /* expose helpers for debugging / Vera verification */
  AVNConsent._DEFAULT_GRANTED = DEFAULT_GRANTED;
  AVNConsent._ALL_DENIED = ALL_DENIED;
  window.AVNConsent = AVNConsent;

  /* Re-apply any prior choice as early as possible. */
  AVNConsent.rehydrate();
})();
