// Lets `node --test` import the app's TypeScript sources: resolves "@/..." and extensionless imports.
import { register } from "node:module";

register("../../scripts/sopranos/alias-loader.mjs", import.meta.url);
