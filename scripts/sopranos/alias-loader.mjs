// Lets Node run the app's TypeScript modules directly: resolves "@/..." and extensionless relative imports to .ts files.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = new URL("../../src/", import.meta.url);

export async function resolve(specifier, context, next) {
  let url = null;
  if (specifier.startsWith("@/")) url = new URL(specifier.slice(2), SRC);
  else if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) url = new URL(specifier, context.parentURL);
  if (url) {
    for (const ext of ["", ".ts", ".tsx"]) {
      const candidate = new URL(url.href + ext);
      if (ext !== "" || /\.tsx?$/.test(url.pathname)) {
        if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
      }
    }
  }
  return next(specifier, context);
}
