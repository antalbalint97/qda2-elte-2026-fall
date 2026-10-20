/**
 * Facts about who runs the site. Deliberately empty until the owner supplies them: the about and
 * privacy pages show a neutral sentence instead of invented details while a field is null.
 * See docs/institutional/open-issues.md.
 */
export const SITE = {
  name: "StatisztikaMetis",
  product: "QDA2 Interactive Lab",
  /** Name of the developer as it should appear publicly, e.g. "Jane Doe". */
  author: null as string | null,
  /** Public contact for questions about the site and its data handling, e.g. an e-mail address. */
  contact: null as string | null,
  /** Hosting provider (verified from the repository's deployment status checks). */
  host: { name: "Vercel", privacyUrl: "https://vercel.com/legal/privacy-policy" },
  lastReviewed: "20 October 2026",
};
