// Post-build check of what the browser receives: no credentials in client bundles, no source maps
// published, and no third-party script or stylesheet references in the generated HTML.
//   node scripts/check-build.mjs   (after `npm run build`)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../.next/", import.meta.url).pathname;
const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
walk(join(ROOT, "static"));
walk(join(ROOT, "server/app"));

const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/\bsk-(ant-)?[A-Za-z0-9_-]{20,}/, "API secret key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "GitHub token"],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, "Slack token"],
];
const problems = [];
let checked = 0;
for (const f of files) {
  if (f.endsWith(".map") && f.includes("/static/")) problems.push(`source map published: ${f}`);
  if (!/\.(js|html|css|json|rsc|txt)$/.test(f)) continue;
  const text = readFileSync(f, "utf8");
  checked++;
  for (const [re, what] of SECRET_PATTERNS) if (re.test(text)) problems.push(`${what} pattern in ${f}`);
  if (f.endsWith(".html")) {
    for (const m of text.matchAll(/<(script|link)\b[^>]*\b(src|href)="(https?:)?\/\/([^"/]+)/g))
      problems.push(`external ${m[1]} (${m[4]}) in ${f.replace(ROOT, "")}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`check-build: ${checked} files checked, no secrets, source maps or external script/style references`);
