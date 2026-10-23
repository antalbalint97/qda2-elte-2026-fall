// Writes tests/unit/fixtures/studio-samples.json: samples drawn by the Survey Design & Weighting Studio
// pipeline (studio population, select → respond → adjust). scripts/validation/studio_reference.R reads it
// and adds R `survey` results; tests/unit/survey-studio.test.ts compares the engine with them.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/studio_samples.ts
import { writeFileSync } from "node:fs";
import { mulberry32 } from "../../src/lib/engine/rng";
import { respond, select, studioPopulation, STUDIO_POPULATION_DEFAULTS, type Design, type ResponseMechanism } from "../../src/lib/engine/survey-design";
import { applyAdjust, type Adjustment } from "../../src/lib/engine/survey-estimators";

const pop = studioPopulation(STUDIO_POPULATION_DEFAULTS);
const cases: { id: string; design: Design; mech: ResponseMechanism; adjust: Adjustment }[] = [
  { id: "srs", design: { type: "srs", n: 120 }, mech: { type: "none", rate: 1 }, adjust: { type: "none" } },
  { id: "strat-prop", design: { type: "strat", n: 120, allocation: "prop" }, mech: { type: "none", rate: 1 }, adjust: { type: "none" } },
  { id: "strat-equal", design: { type: "strat", n: 120, allocation: "equal" }, mech: { type: "none", rate: 1 }, adjust: { type: "none" } },
  { id: "cluster", design: { type: "cluster", n: 120, a: 6 }, mech: { type: "none", rate: 1 }, adjust: { type: "none" } },
  { id: "twostage", design: { type: "twostage", n: 120, a: 6, m: 12 }, mech: { type: "none", rate: 1 }, adjust: { type: "none" } },
  { id: "srs-outcome-raking", design: { type: "srs", n: 300 }, mech: { type: "outcome", rate: 0.6, slope: 1.2 }, adjust: { type: "raking" } },
  { id: "strat-group-poststrat", design: { type: "strat", n: 200, allocation: "prop" }, mech: { type: "group", rate: 0.6, groupRates: { A: 0.85, B: 0.6, C: 0.35 } }, adjust: { type: "poststrat" } },
];
const out = cases.map((c, i) => {
  const rand = mulberry32(1000 + i);
  const sel = select(pop, c.design, rand);
  const resp = applyAdjust(
    respond(sel.sample, c.mech, rand).map((s) => ({ ...s, w: s.d })),
    c.adjust,
    pop,
  );
  // First-stage population size per row: N_frame (SRS), N_h (stratified) or A (cluster / two-stage).
  const fpc = (s: (typeof resp)[number]) => (c.design.type === "srs" ? pop.frameN : c.design.type === "strat" ? sel.info.Nh![s.stratum] : sel.info.A!);
  return { id: c.id, design: c.design.type, frameN: pop.frameN, rows: resp.map((s) => ({ y: s.y, w: s.w, stratum: s.stratum, psu: s.psu, fpc: fpc(s) })) };
});
writeFileSync(new URL("../../tests/unit/fixtures/studio-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/studio_samples.ts", population: STUDIO_POPULATION_DEFAULTS, cases: out }, null, 1) + "\n");
console.log("wrote", out.length, "cases");
