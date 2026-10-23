// Writes tests/unit/fixtures/diagnostics-samples.json: the data sets the Model Diagnostics Studio fits (each
// scenario, the collinear pair, and an edited outlier). scripts/validation/diagnostics_reference.py adds the
// statsmodels results; tests/unit/model-diagnostics.test.ts compares.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/diagnostics_samples.ts
import { writeFileSync } from "node:fs";
import { applyMoves, genPoints, makeX2, type Scenario } from "../../src/components/lab/labs/model-diagnostics-studio/model";

const cases: { id: string; x: number[]; x2: number[] | null; y: number[] }[] = [];
for (const sc of ["linear", "curved", "outlier", "fan"] as Scenario[])
  for (const seed of [2026, 7]) {
    const p = genPoints(seed, sc);
    cases.push({ id: `${sc}-${seed}`, x: p.map((q) => q.x), x2: null, y: p.map((q) => q.y) });
  }
for (const rho of [0.5, 0.95]) {
  const p = genPoints(2026, "collinear");
  cases.push({ id: `x2-rho${rho}`, x: p.map((q) => q.x), x2: makeX2(p.map((q) => q.x), rho, 2026), y: p.map((q) => q.y) });
}
const moved = applyMoves(genPoints(2026, "outlier"), [[0, 14, 95]]);
cases.push({ id: "outlier-moved", x: moved.map((q) => q.x), x2: null, y: moved.map((q) => q.y) });
writeFileSync(new URL("../../tests/unit/fixtures/diagnostics-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/diagnostics_samples.ts", cases }) + "\n");
console.log("wrote", cases.length);
