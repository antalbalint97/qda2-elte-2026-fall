// Writes tests/unit/fixtures/design-studio-samples.json: samples drawn by the Survey Sampling Design Studio
// (its own population, plan and draw), plus the PSU size measures used for PPS. scripts/validation/
// design_studio_reference.R adds R `survey` and `sampling` results; tests/unit/survey-design-studio.test.ts
// compares the engine with them.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/design_studio_samples.ts
import { writeFileSync } from "node:fs";
import { mulberry32 } from "../../src/lib/engine/rng";
import { draw, makeDsPopulation, plan, toObs, type DesignSpec } from "../../src/components/lab/labs/survey-design-studio/model";

export const DS_SEED = 2026;
const pop = makeDsPopulation(DS_SEED);
const base: DesignSpec = { strata: 1, stages: 1, pps: false, allocation: "proportional", n: 160, m: 10, coverage: [1, 1, 1], nh: [] };
export const DS_CASES: { id: string; d: DesignSpec }[] = [
  { id: "srs", d: base },
  { id: "strat-prop", d: { ...base, strata: 3 } },
  { id: "strat-neyman", d: { ...base, strata: 3, allocation: "neyman", coverage: [1, 0.7, 0.5] } },
  { id: "twostage-srs", d: { ...base, stages: 2 } },
  { id: "twostage-pps", d: { ...base, stages: 2, pps: true } },
  { id: "strat-twostage-pps", d: { ...base, strata: 3, stages: 2, pps: true, n: 200, m: 8 } },
];
const cases = DS_CASES.map((c, i) => {
  const p = plan(pop, c.d);
  const dr = draw(p, c.d, mulberry32(500 + i));
  const rows = toObs(p, c.d, dr).map(({ y, w, stratum, psu, fpc, h }) => ({ y, w, stratum, psu, fpc: fpc ?? null, h }));
  return { id: c.id, stages: c.d.stages, strata: c.d.strata, rows };
});
// PSU frame sizes per stratum and the number of PSUs to select (for sampling::inclusionprobabilities)
const pps = DS_CASES.filter((c) => c.d.pps).flatMap((c) => {
  const p = plan(pop, c.d);
  return p.groups.map((g, gi) => ({ id: `${c.id}-${gi}`, x: g.psus.map((q) => q.units.length), n: p.ah[gi] }));
});
writeFileSync(new URL("../../tests/unit/fixtures/design-studio-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/design_studio_samples.ts", seed: DS_SEED, cases, pps }, null, 1) + "\n");
console.log("wrote", cases.length, "cases and", pps.length, "PPS size vectors");
