/* ============================================================================
 * hvco-lead.js — wires the /hvco/ opt-in form's submit to the lead pipeline.
 *
 * It does ONE thing: on submit, send the form's data (email + the attribution
 * already captured by attribution.js) to the same-origin /api/lead Pages
 * Function, which forwards it (with the server-held shared secret) into the
 * EA Ninjas OS ingest endpoint. No copy or design is changed — the button gets
 * transient functional states (Sending… / Sent ✓) only.
 *
 * Attribution source: window.__avnAttribution (set by attribution.js — utm_*,
 * gclid, fbclid, li_fat_id, _first_seen, _landing_page) PLUS wbraid/gbraid from
 * the URL (attribution.js does not capture those) and the _fbp Meta-pixel cookie
 * if present. The secret is NEVER in this file — it lives in the Pages Function.
 * ==========================================================================*/
(function () {
  "use strict";

  function readCookie(name) {
    var m = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
    );
    return m ? decodeURIComponent(m[1]) : null;
  }

  function collectAttribution() {
    var attr = {};
    // Canonical set from attribution.js.
    var src = window.__avnAttribution || {};
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "li_fat_id"];
    keys.forEach(function (k) { if (src[k]) attr[k] = src[k]; });
    if (src._landing_page) attr.landing_page = src._landing_page;
    // wbraid / gbraid — not captured by attribution.js; read from the URL now.
    var qs = new URLSearchParams(window.location.search);
    ["wbraid", "gbraid"].forEach(function (k) { var v = qs.get(k); if (v) attr[k] = v; });
    // Meta browser-pixel id (set by the Meta pixel as _fbp), if it exists.
    var fbp = readCookie("_fbp");
    if (fbp) attr.fbp = fbp;
    return attr;
  }

  function wire(form) {
    if (!form || form.__avnWired) return;
    form.__avnWired = true;
    var btn = form.querySelector('button[type="submit"], button:not([type])');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailEl = form.querySelector('input[type="email"], input[name="email"]');
      var email = emailEl && emailEl.value ? emailEl.value.trim() : "";
      if (!email) { if (emailEl) emailEl.focus(); return; }

      var original = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, attribution: collectAttribution() }),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j && j.ok }; }); })
        .then(function (res) {
          if (res.ok) {
            // Functional success state only. The marketing confirmation message
            // is [PENDING BEN: confirmation-copy] — not invented here.
            if (btn) btn.textContent = "Sent ✓";
            try { form.reset(); } catch (e2) {}
          } else if (btn) {
            btn.disabled = false; btn.textContent = original;
          }
        })
        .catch(function () { if (btn) { btn.disabled = false; btn.textContent = original; } });
    });
  }

  function run() { wire(document.querySelector(".hvco-form")); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
