// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { visit } from "unist-util-visit";

/**
 * rehype plugin — wrap every markdown <table> in <div class="table-scroll">.
 *
 * HIGH-2 (Vera v5 re-gate): article tables clipped their last column on narrow
 * viewports because nothing provided horizontal scroll. This wraps each table at
 * BUILD time (no JS, no first-paint flash, works with JS disabled) in a scroll
 * container styled in resources/[slug].astro (.table-scroll{overflow-x:auto}),
 * mirroring the homepage comparison-table overflow pattern. Build-time wrapping is
 * idempotent — a table already inside a .table-scroll is skipped.
 */
function rehypeWrapTables() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "table" || !parent || index === null) return;
      const parentClass = parent.properties?.className;
      const inWrapper =
        parent.tagName === "div" &&
        Array.isArray(parentClass) &&
        parentClass.includes("table-scroll");
      if (inWrapper) return; // already wrapped — idempotent
      const wrapper = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

// Host-agnostic static output: deployable to Vercel / Netlify / Cloudflare Pages
// as a plain static directory. No adapter on purpose — add one only when a host
// is chosen AND server features are needed (none are today).
export default defineConfig({
  output: "static",
  // Production root deploy on the canonical www host (www.avninjas.co). Mack's
  // fix (deploy runbook): apex (avninjas.co) 301-redirects to www, so the sitemap
  // and canonical tags must emit www URLs, not apex URLs that bounce through a 301.
  site: "https://www.avninjas.co",
  base: "/",
  trailingSlash: "ignore",
  markdown: {
    // Wrap article tables in a horizontal-scroll container at build time (HIGH-2).
    rehypePlugins: [rehypeWrapTables],
  },
  integrations: [
    sitemap({
      // /hvco/ is a paid-funnel landing page, not an organic surface — keep it
      // out of the sitemap (robots.txt also noindex/disallows it). See audit §3.4.
      // Host follows `site` (now www) so this prefix keeps matching the emitted URLs.
      filter: (page) => !page.startsWith("https://www.avninjas.co/hvco"),
    }),
  ],
});
