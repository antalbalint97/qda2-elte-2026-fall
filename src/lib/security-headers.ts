// HTTP security headers for every route, applied from next.config.ts.
// Kept free of "@/..." imports so next.config.ts and the Node unit tests can load it directly.

export interface HeaderOptions {
  /** Origins allowed to embed pages in an iframe. Empty (the default) forbids all framing. */
  embedOrigins?: string[];
  /** Development needs 'unsafe-eval' for React Refresh; production never gets it. */
  dev?: boolean;
  /**
   * true for pages that run browser R (webR): WebAssembly compilation ('wasm-unsafe-eval', not 'unsafe-eval'),
   * the self-hosted worker, and package downloads from the webR package repository only. "worker" for the webR
   * runtime files: the same plus 'unsafe-eval', which Emscripten's dynamic linker needs to load R's shared
   * libraries. A same-origin dedicated worker is governed by the CSP of its own script response, so this
   * reaches only the R worker (no DOM, no cookies); the pages keep a CSP without 'unsafe-eval'.
   */
  webr?: boolean | "worker";
}

/** The only package source browser R may contact (binary R packages built for WebAssembly). */
export const WEBR_REPO = "https://repo.r-wasm.org";
/** Routes whose pages contain browser R blocks; only these get the webR CSP additions. */
export const WEBR_ROUTES = ["/r", "/course/:path*"];
/** The self-hosted webR runtime (worker script, WebAssembly, R's virtual file system). */
export const WEBR_RUNTIME_ROUTE = "/webr/:path*";

/**
 * Parses EMBED_ALLOWED_ORIGINS (comma- or space-separated). Only exact https origins are accepted
 * (plus http://localhost and http://127.0.0.1 for local testing): wildcards, paths and other plain
 * http origins are dropped, so a typo can never open framing to everyone.
 */
export function parseEmbedOrigins(raw: string | undefined): { origins: string[]; rejected: string[] } {
  const origins: string[] = [];
  const rejected: string[] = [];
  for (const item of (raw ?? "").split(/[\s,]+/).filter(Boolean)) {
    let ok = false;
    if (!item.includes("*")) {
      try {
        const u = new URL(item);
        const local = u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
        ok = (u.protocol === "https:" || local) && u.origin === item.replace(/\/$/, "") && !u.username && !u.password;
        if (ok && !origins.includes(u.origin)) origins.push(u.origin);
      } catch {
        ok = false;
      }
    }
    if (!ok) rejected.push(item);
  }
  return { origins, rejected };
}

export function contentSecurityPolicy({ embedOrigins = [], dev = false, webr = false }: HeaderOptions = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next.js streams page data through inline <script> tags and the theme script runs before paint.
    // Nonces would force every page to render dynamically, so inline scripts stay allowed but no
    // third-party script origin is.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev || webr === "worker" ? ["'unsafe-eval'"] : []), ...(webr ? ["'wasm-unsafe-eval'"] : [])],
    // Inline style attributes are used by charts and KaTeX.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(dev ? ["ws:"] : []), ...(webr ? [WEBR_REPO] : [])],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-src": ["'none'"],
    "worker-src": ["'self'", ...(webr ? ["blob:"] : [])],
    "manifest-src": ["'self'"],
    "frame-ancestors": embedOrigins.length ? ["'self'", ...embedOrigins] : ["'none'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "usb=()",
  "browsing-topics=()",
].join(", ");

export function securityHeaders(opts: HeaderOptions = {}): Array<{ key: string; value: string }> {
  const embedOrigins = opts.embedOrigins ?? [];
  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(opts) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  // X-Frame-Options cannot list origins, so it is only sent while framing is fully disabled;
  // with an allow-list, CSP frame-ancestors is the single source of truth.
  if (!embedOrigins.length) headers.push({ key: "X-Frame-Options", value: "DENY" });
  // Browsers ignore HSTS over plain http, so this is harmless on localhost. No includeSubDomains or
  // preload: those would bind every subdomain of the owner's domain and are the owner's decision.
  if (!opts.dev) headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  return headers;
}
