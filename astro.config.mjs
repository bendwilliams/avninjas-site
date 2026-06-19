// @ts-check
import { defineConfig } from "astro/config";

// Host-agnostic static output: deployable to Vercel / Netlify / Cloudflare Pages
// as a plain static directory. No adapter on purpose — add one only when a host
// is chosen AND server features are needed (none are today).
export default defineConfig({
  output: "static",
  // Production root deploy on the apex domain (avninjas.co). Root host
  // (Cloudflare Pages / Netlify / GitHub Pages custom domain) serves at "/".
  site: "https://avninjas.co",
  base: "/",
  trailingSlash: "ignore",
});
