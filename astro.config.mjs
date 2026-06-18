// @ts-check
import { defineConfig } from "astro/config";

// Host-agnostic static output: deployable to Vercel / Netlify / Cloudflare Pages
// as a plain static directory. No adapter on purpose — add one only when a host
// is chosen AND server features are needed (none are today).
export default defineConfig({
  output: "static",
  site: "https://avninjas.co",
  trailingSlash: "ignore",
});
