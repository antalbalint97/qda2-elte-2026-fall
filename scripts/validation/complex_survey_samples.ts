// Writes tests/unit/fixtures/complex-survey-samples.json: samples drawn by the Complex Survey Inference Lab.
// scripts/validation/complex_survey_reference.R adds R survey results; tests/unit/complex-survey.test.ts compares.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/complex_survey_samples.ts
import { writeFileSync } from "node:fs";
import { mulberry32 } from "../../src/lib/engine/rng";
import { drawSample, makeCsPopulation } from "../../src/components/lab/labs/complex-survey-lab/model";

export const CS_CASES = [
  { id: "h4a6", H: 4, a: 6 },
  { id: "h3a2", H: 3, a: 2 },
  { id: "h8a2", H: 8, a: 2 },
  { id: "h2a10", H: 2, a: 10 },
  { id: "h5a2", H: 5, a: 2 },
];
const cases = CS_CASES.map((c, i) => {
  const pop = makeCsPopulation(c.H, 2026);
  const rows = drawSample(pop, c.a, mulberry32(900 + i)).map(({ stratum, psu, fpc, w, group, x, y, agree }) => ({ stratum, psu, fpc, w, group, x, y, agree }));
  return { ...c, rows };
});
writeFileSync(new URL("../../tests/unit/fixtures/complex-survey-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/complex_survey_samples.ts", seed: 2026, cases }, null, 1) + "\n");
console.log("wrote", cases.length, "cases");
