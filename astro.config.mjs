// @ts-check
import { defineConfig } from "astro/config";

// Host-agnostic static output: deployable to Vercel / Netlify / Cloudflare Pages
// as a plain static directory. No adapter on purpose — add one only when a host
// is chosen AND server features are needed (none are today).
export default defineConfig({
  output: "static",
  // GitHub Pages project-site deploy (feedback): served from /avninjas-site/.
  // For the eventual root deploy (avninjas.co / Vercel), set base back to "/".
  site: "https://bendwilliams.github.io",
  base: "/avninjas-site/",
  trailingSlash: "ignore",
});
