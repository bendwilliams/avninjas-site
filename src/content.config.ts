import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Resources collection — the CMS shell. Drop a markdown file into
 * src/content/resources/ and it appears on /resources/ and gets its own
 * page at /resources/<slug>/ via the article template.
 * Empty today by design (no canonical article copy exists yet).
 */
const resources = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/resources" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { resources };
