import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { contentSecurityPolicy, parseEmbedOrigins, securityHeaders } from "../../src/lib/security-headers";

const get = (h: Array<{ key: string; value: string }>, k: string) => h.find((x) => x.key === k)?.value;

describe("security headers", () => {
  test("default: framing forbidden by CSP and X-Frame-Options", () => {
    const h = securityHeaders();
    assert.match(get(h, "Content-Security-Policy")!, /frame-ancestors 'none'/);
    assert.equal(get(h, "X-Frame-Options"), "DENY");
    assert.equal(get(h, "X-Content-Type-Options"), "nosniff");
    assert.equal(get(h, "Referrer-Policy"), "strict-origin-when-cross-origin");
    assert.match(get(h, "Permissions-Policy")!, /camera=\(\)/);
    assert.match(get(h, "Strict-Transport-Security")!, /^max-age=\d+$/);
  });
  test("production CSP allows no third-party origins and no eval", () => {
    const csp = contentSecurityPolicy();
    assert.doesNotMatch(csp, /https?:\/\//);
    assert.doesNotMatch(csp, /unsafe-eval/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
  });
  test("an allow-list switches framing to CSP frame-ancestors only", () => {
    const h = securityHeaders({ embedOrigins: ["https://lms.example.edu"] });
    assert.match(get(h, "Content-Security-Policy")!, /frame-ancestors 'self' https:\/\/lms\.example\.edu/);
    assert.equal(get(h, "X-Frame-Options"), undefined);
  });
  test("development adds only what React Refresh needs and no HSTS", () => {
    const h = securityHeaders({ dev: true });
    assert.match(get(h, "Content-Security-Policy")!, /'unsafe-eval'/);
    assert.equal(get(h, "Strict-Transport-Security"), undefined);
  });
});

describe("EMBED_ALLOWED_ORIGINS parsing", () => {
  test("accepts exact https origins, comma or space separated, deduplicated", () => {
    const r = parseEmbedOrigins("https://a.example.edu, https://b.example.edu https://a.example.edu/");
    assert.deepEqual(r.origins, ["https://a.example.edu", "https://b.example.edu"]);
    assert.deepEqual(r.rejected, []);
  });
  test("rejects wildcards, http, paths, credentials and garbage", () => {
    const bad = ["*", "https://*.example.edu", "http://lms.example.edu", "https://lms.example.edu/course/1", "https://u:p@lms.example.edu", "lms.example.edu", "'self'"];
    const r = parseEmbedOrigins(bad.join(" "));
    assert.deepEqual(r.origins, []);
    assert.deepEqual(r.rejected, bad);
  });
  test("plain http is accepted only for localhost testing", () => {
    assert.deepEqual(parseEmbedOrigins("http://localhost:3999 http://127.0.0.1:4000").origins, ["http://localhost:3999", "http://127.0.0.1:4000"]);
  });
  test("empty or missing means no embedding", () => {
    assert.deepEqual(parseEmbedOrigins(undefined).origins, []);
    assert.deepEqual(parseEmbedOrigins("  ").origins, []);
  });
});

test("webR pages add only WebAssembly compilation, blob workers and the webR package repository", () => {
  const plain = contentSecurityPolicy();
  const r = contentSecurityPolicy({ webr: true });
  assert.doesNotMatch(plain, /wasm-unsafe-eval|repo\.r-wasm\.org/);
  assert.match(r, /script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(r, /'unsafe-eval'/);
  assert.match(r, /connect-src 'self' https:\/\/repo\.r-wasm\.org/);
  assert.match(r, /worker-src 'self' blob:/);
  assert.match(r, /frame-ancestors 'none'/);
  // only the R worker's own script response gets 'unsafe-eval' (Emscripten's loader for R's shared libraries)
  const w = contentSecurityPolicy({ webr: "worker" });
  assert.match(w, /script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'/);
  assert.match(w, /connect-src 'self' https:\/\/repo\.r-wasm\.org/);
});
