// Writes tests/unit/fixtures/measurement-items.json: the keyed item matrices the Measurement & Index Lab
// analyses. scripts/validation/measurement_reference.R adds α, α-if-deleted and corrected item-total r
// (covariance form, base R); tests/unit/measurement-lab.test.ts compares.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/measurement_samples.ts
import { writeFileSync } from "node:fs";
import { itemSet, keyed } from "../../src/components/lab/labs/measurement-index-lab/model";

const trust = itemSet("trust");
const eff = itemSet("efficacy");
const cases = [
  { id: "trust-keyed", items: keyed(trust, trust.names, ["T3", "T5"]).cols },
  { id: "trust-unkeyed", items: keyed(trust, trust.names, []).cols },
  { id: "trust-core", items: keyed(trust, ["T1", "T2", "T3", "T4", "T5"], ["T3", "T5"]).cols },
  { id: "efficacy-keyed", items: keyed(eff, eff.names, ["eff4_rev"]).cols },
];
writeFileSync(new URL("../../tests/unit/fixtures/measurement-items.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/measurement_samples.ts", cases }) + "\n");
console.log("wrote", cases.length, "cases");
