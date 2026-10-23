// Every implemented lab has its own route file (src/app/lab/<id>/page.tsx) and no other lab folder exists,
// so unimplemented labs are not routed (404) and each page bundles only its own lab.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { IMPLEMENTED_LABS } from "../../src/content/curriculum/implemented-labs";

const dir = new URL("../../src/app/lab/", import.meta.url);

test("lab route folders = IMPLEMENTED_LABS, each rendering its own lab", () => {
  const folders = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  assert.deepEqual(folders, [...IMPLEMENTED_LABS].sort());
  for (const id of IMPLEMENTED_LABS) {
    const page = new URL(`${id}/page.tsx`, dir);
    assert.ok(existsSync(page), id);
    const src = readFileSync(page, "utf8");
    assert.match(src, new RegExp(`labMetadata\\("${id}"\\)`));
    assert.match(src, new RegExp(`@/components/lab/labs/${id}/`));
  }
});
