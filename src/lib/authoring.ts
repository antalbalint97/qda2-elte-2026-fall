// Whether this deployment serves the Course Builder. Authoring is local-only (drafts live in the instructor's
// browser and publishing goes through a reviewed pull request), but until institutional sign-in exists the
// Builder is not served publicly: it is on in development and only where the deployment sets
// QDA2_AUTHORING=local (for example a Vercel preview environment). This is a server-side deployment setting,
// not an access-control mechanism: it decides whether the page exists, it does not identify anyone.
export function authoringEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.QDA2_AUTHORING === "local";
}
