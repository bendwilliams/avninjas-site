import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Resources collection — the CMS shell. Drop a markdown file into
 * src/content/resources/ and it appears on /resources/ and gets its own
 * page at /resources/<slug>/ via the article template.
 *
 * Schema-fidelity fields (Crawford content-page spec, 2026-06-22):
 *   • `directAnswer` — Hook's two-sentence lift block (the AEO citation candidate).
 *     The article template renders this as the VISIBLE opening paragraph AND feeds
 *     the exact same string into the Article JSON-LD `description`. Single source →
 *     schema can never drift from the visible opener (the same anti-drift pattern
 *     the homepage FAQ uses). The markdown body holds everything AFTER the opener.
 *   • `breadcrumbLabel` — the final (current-page) breadcrumb crumb. Rendered in the
 *     visible breadcrumb nav AND used as the last BreadcrumbList ListItem name, so
 *     the marked-up breadcrumb mirrors a breadcrumb the user can actually see.
 *   • `pendingBen` — true if the page carries [PENDING BEN] content (e.g. A6 dollar
 *     floors). Surfaces a visible build-state banner so nothing un-ratified ships
 *     silently. Pure staging signal; flip to false / delete when Ben confirms.
 *
 * Author byline is intentionally absent: per Crawford §1, Articles ship with NO
 * author node (and no visible byline) until Ben ratifies a name. Insertion point
 * is marked in src/pages/resources/[slug].astro.
 */
const resources = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/resources" }),
  schema: z.object({
    title: z.string(),
    /** Meta description / Article JSON-LD description — equals the visible lift block. */
    description: z.string().optional(),
    /** Hook's two-sentence direct-answer lift block. Rendered visibly as the lead. */
    directAnswer: z.string().optional(),
    /** Final crumb label in the visible breadcrumb trail + BreadcrumbList. */
    breadcrumbLabel: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    /** Real last-modified date for Article.dateModified; falls back to pubDate. */
    updatedDate: z.coerce.date().optional(),
    /** True while the page carries [PENDING BEN] content — shows a staging banner. */
    pendingBen: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { resources };
