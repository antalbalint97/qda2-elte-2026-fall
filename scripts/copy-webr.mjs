// Copies the pinned webR runtime from node_modules/webr/dist into public/webr/<version>/ so the browser R
// blocks load it from this site (no third-party CDN). Runs on postinstall and before dev/build; the copy is
// git-ignored. Only the files the worker needs are copied (no REPL, tests or service worker).
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "webr", "dist");
if (!existsSync(src)) {
  console.warn("copy-webr: node_modules/webr is missing; skipping (browser R will not load)");
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(join(root, "node_modules", "webr", "package.json"), "utf8"));
const dest = join(root, "public", "webr", version);
const marker = join(dest, "R.bin.wasm");
if (existsSync(marker)) process.exit(0);
rmSync(join(root, "public", "webr"), { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const f of ["R.bin.js", "R.bin.wasm", "libRblas.so", "libRlapack.so", "webr-worker.js"]) cpSync(join(src, f), join(dest, f));
cpSync(join(src, "vfs"), join(dest, "vfs"), { recursive: true });
console.log(`copy-webr: webR ${version} runtime copied to public/webr/${version}/`);
