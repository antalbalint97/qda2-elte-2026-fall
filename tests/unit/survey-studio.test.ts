// Survey Design & Weighting Studio: the estimators the studio shows, on samples drawn by its own pipeline
// (tests/unit/fixtures/studio-samples.json, scripts/validation/studio_samples.ts), against R `survey`
// (tests/unit/fixtures/studio-reference.json, scripts/validation/studio_reference.R).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { mulberry32 } from "../../src/lib/engine/rng";
import { respond, select, studioPopulation, STUDIO_POPULATION_DEFAULTS, type Selection } from "../../src/lib/engine/survey-design";
import { closedFormVar, designEffect, estimates, linearizedVarMean, postStratify, rake, svyMean } from "../../src/lib/engine/survey-estimators";

const SAMPLES = JSON.parse(readFileSync(new URL("./fixtures/studio-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/studio-reference.json", import.meta.url), "utf8")).cases;
const rel = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);

interface Row {
  y: number;
  w: number;
  stratum: string;
  psu: number;
  fpc: number;
}

describe("studio samples vs R survey 4.2.1", () => {
  for (const c of SAMPLES.cases as { id: string; design: Selection["design"]["type"]; frameN: number; rows: Row[] }[]) {
    const ref = REF[c.id];
    test(c.id, () => {
      const rows = c.rows;
      assert.equal(rows.length, ref.n);
      const lin = linearizedVarMean(rows);
      const W = rows.reduce((s, r) => s + r.w, 0);
      rel(rows.reduce((s, r) => s + r.w * r.y, 0) / W, ref.mean, 1e-12, "Hájek mean");
      rel(lin.se as number, ref.lin, 1e-10, "linearised SE (no fpc)");
      const withFpc = svyMean(rows, { fpc: true });
      rel(withFpc.se as number, ref.fpc, 1e-10, "linearised SE (first-stage fpc)");
      rel(designEffect(rows, lin.v) as number, ref.deff, 1e-10, 'deff ("replace")');
      rel(designEffect(rows, withFpc.variance, false) as number, ref.deffFpc, 1e-10, "deff (fpc)");
      // Closed forms apply to full-response SRS, stratified and one-stage cluster samples.
      const full = !c.id.includes("-outcome-") && !c.id.includes("-group-");
      if (full && c.design !== "twostage") {
        const Nh: Record<string, number> = {};
        rows.forEach((r) => (Nh[r.stratum] = r.fpc));
        const sel = { design: { type: c.design, n: rows.length }, info: { frameN: c.frameN, method: "", Nh, A: rows[0].fpc }, sample: [] } as Selection;
        const cf = closedFormVar(rows, sel, c.frameN);
        rel(cf.se as number, ref.fpc, 1e-10, "closed form = svymean with fpc");
      }
    });
  }
});

describe("studio pipeline invariants", () => {
  const pop = studioPopulation(STUDIO_POPULATION_DEFAULTS);
  test("population: N = 600, 20 PSUs, frame excludes part of group C only", () => {
    assert.equal(pop.N, 600);
    assert.equal(pop.K, 20);
    const off = pop.units.filter((u) => !u.inFrame);
    assert.ok(off.length > 0 && off.every((u) => u.g === "C"));
  });
  test("base weights sum to N_frame under every design (SRS, stratified, cluster in expectation)", () => {
    const r = mulberry32(5);
    for (const design of [{ type: "srs" as const, n: 120 }, { type: "strat" as const, n: 120, allocation: "prop" as const }]) {
      const sel = select(pop, design, r);
      const sw = sel.sample.reduce((s, x) => s + x.d, 0);
      // stratified: Σ_h n_h · N_h/n_h = N_frame exactly; SRS: n · N/n
      rel(sw, pop.frameN, 1e-9, design.type + " Σd");
    }
    // cluster: Σd = (A/a)·Σ M_i, unbiased for N_frame; check the mean over repeats
    let tot = 0;
    for (let i = 0; i < 2000; i++) tot += select(pop, { type: "cluster", n: 120, a: 6 }, r).sample.reduce((s, x) => s + x.d, 0);
    rel(tot / 2000, pop.frameN, 0.02, "cluster mean Σd");
  });
  test("post-stratification reproduces N_g and raking reproduces both margins", () => {
    const r = mulberry32(6);
    const sel = select(pop, { type: "srs", n: 300 }, r);
    const resp = respond(sel.sample, { type: "group", rate: 0.6, groupRates: { A: 0.85, B: 0.6, C: 0.35 } }, r)
      .filter((s) => s.r)
      .map((s) => ({ ...s, w: s.d }));
    const ps = postStratify(resp, pop.groupN, "g");
    for (const g of ["A", "B", "C"]) rel(ps.filter((s) => s.g === g).reduce((a, s) => a + s.w, 0), pop.groupN[g], 1e-9, "N_" + g);
    const rk = rake(resp, [
      { key: "g", counts: pop.groupN },
      { key: "x", counts: { 0: pop.xN[0], 1: pop.xN[1] } },
    ]);
    assert.ok(rk.converged);
    for (const g of ["A", "B", "C"]) rel(rk.resp.filter((s) => s.g === g).reduce((a, s) => a + s.w, 0), pop.groupN[g], 1e-6, "raked N_" + g);
    rel(rk.resp.filter((s) => s.x === 1).reduce((a, s) => a + s.w, 0), pop.xN[1], 1e-6, "raked x=1");
    assert.ok(estimates(rk.resp, pop.N).hajek !== null);
  });
});
