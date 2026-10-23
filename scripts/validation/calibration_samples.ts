// Writes tests/unit/fixtures/calibration-samples.json: respondent sets of the Weighting & Calibration Lab
// (its own population and nonresponse), the population totals and the adjustment to run.
// scripts/validation/calibration_reference.R adds R survey results; tests/unit/calibration.test.ts compares.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/calibration_samples.ts
import { writeFileSync } from "node:fs";
import { mulberry32 } from "../../src/lib/engine/rng";
import { AGEG, drawRespondents, EDU, makeCalPopulation, REG, type Aux, type Method } from "../../src/components/lab/labs/weighting-calibration-lab/model";

const SEED = 2026;
const pop = makeCalPopulation(SEED);
const cases: { id: string; aux: Aux[]; method: Method; bounds?: [number, number]; mnar?: boolean }[] = [
  { id: "poststrat-edu", aux: ["edu"], method: "poststrat" },
  { id: "poststrat-cells", aux: ["edu", "region"], method: "poststrat" },
  { id: "poststrat-age", aux: ["edu", "age"], method: "poststrat" },
  { id: "raking", aux: ["edu", "region", "age"], method: "raking" },
  { id: "raking-cat", aux: ["edu", "region"], method: "raking" },
  { id: "linear", aux: ["edu", "region", "age"], method: "linear" },
  { id: "linear-edu", aux: ["edu"], method: "linear" },
  { id: "bounded", aux: ["edu", "region", "age"], method: "bounded", bounds: [0.6, 2] },
  { id: "raking-mnar", aux: ["edu", "region", "age"], method: "raking", mnar: true },
];
const out = cases.map((c, i) => {
  const { resp, d } = drawRespondents(pop, { rr: [0.4, 0.6, 0.9], east: 0.8, mnar: !!c.mnar }, mulberry32(700 + i));
  return { ...c, d, rows: resp.map((p) => ({ id: p.id, edu: EDU[p.edu], region: REG[p.reg], age: p.age, ageG: AGEG[p.ageG], trust: p.y.trust, online: p.y.online, life: p.y.life })) };
});
const totals = { N: pop.people.length, edu: Object.fromEntries(EDU.map((e, i) => [e, pop.eduN[i]])), region: Object.fromEntries(REG.map((r, i) => [r, pop.regN[i]])), age: pop.ageTotal, people: pop.people.map((p) => ({ edu: EDU[p.edu], region: REG[p.reg], ageG: AGEG[p.ageG] })) };
writeFileSync(new URL("../../tests/unit/fixtures/calibration-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/calibration_samples.ts", seed: SEED, totals, cases: out }, null, 1) + "\n");
console.log("wrote", out.length, "cases");
