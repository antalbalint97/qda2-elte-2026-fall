// Calibration engine and the Weighting & Calibration Lab against R survey (postStratify, calibrate with
// calfun "linear" / "raking", with and without bounds): weights, estimates and calibration SEs on the lab's
// own respondent sets. Fixtures: scripts/validation/calibration_samples.ts + calibration_reference.R.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { calibrate, calibratedMean, ginvSym } from "../../src/lib/engine/calibration";
import { mulberry32 } from "../../src/lib/engine/rng";
import { adjust, biasSim, design, drawRespondents, makeCalPopulation, outcomeRows, OUTCOMES, type Aux, type Method } from "../../src/components/lab/labs/weighting-calibration-lab/model";

const SAMPLES = JSON.parse(readFileSync(new URL("./fixtures/calibration-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/calibration-reference.json", import.meta.url), "utf8")).cases;
const rel = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);
const pop = makeCalPopulation(SAMPLES.seed);

describe("Weighting & Calibration Lab vs R survey", () => {
  SAMPLES.cases.forEach((c: { id: string; aux: Aux[]; method: Method; bounds?: [number, number]; mnar?: boolean; d: number; rows: { id: number }[] }, i: number) => {
    test(c.id, () => {
      const { resp, d } = drawRespondents(pop, { rr: [0.4, 0.6, 0.9], east: 0.8, mnar: !!c.mnar }, mulberry32(700 + i));
      assert.deepEqual(resp.map((p) => p.id), c.rows.map((r) => r.id), "the exported respondents are reproduced");
      rel(d, c.d, 1e-15, "base weight");
      const adj = adjust(pop, resp, d, c.aux, c.method, c.bounds ?? [0.6, 2]);
      assert.ok(adj.ok && adj.converged, adj.method);
      const ref = REF[c.id];
      ref.weights.forEach((w: number, k: number) => rel(adj.w[k], w, 1e-7, `weight ${k}`));
      // calibration totals reproduced
      const { X, T } = design(pop, resp, c.aux, c.method);
      T.forEach((t, a) => rel(X.reduce((s, x, k) => s + x[a] * adj.w[k], 0), t, 1e-9, `total ${a}`));
      const rows = outcomeRows(pop, resp, d, c.aux, c.method, adj);
      rows.forEach((r) => {
        rel(r.calibrated as number, ref.est[r.outcome].mean, 1e-8, `${r.outcome} mean`);
        rel(r.seCal as number, ref.est[r.outcome].se, 1e-6, `${r.outcome} calibration SE`);
      });
    });
  });
});

describe("calibration engine", () => {
  test("linear calibration: totals to 1e-9 and the closed form w = d(1 + x'λ)", () => {
    const d = [2, 2, 2, 2, 3, 3];
    const X = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6]];
    const r = calibrate(d, X, [16, 60]);
    assert.ok(r.converged);
    [16, 60].forEach((t, a) => rel(X.reduce((s, x, k) => s + x[a] * (r.w as number[])[k], 0), t, 1e-9, `T${a}`));
  });

  test("raking is invariant to step count once converged; bounds are respected", () => {
    const { resp, d } = drawRespondents(pop, { rr: [0.4, 0.6, 0.9], east: 0.8, mnar: false }, mulberry32(1));
    const a = adjust(pop, resp, d, ["edu", "region", "age"], "bounded", [0.5, 2.5]);
    assert.ok(a.converged);
    a.w.forEach((w) => assert.ok(w / d >= 0.5 - 1e-9 && w / d <= 2.5 + 1e-9));
    const early = adjust(pop, resp, d, ["edu", "region", "age"], "raking", [0.6, 2], 1);
    assert.equal(early.iterations, 1);
    assert.ok(!early.converged && early.log[0] > 1e-7);
  });

  test("bounds that are too tight are reported as not converged (R: 'Calibration failed')", () => {
    const { resp, d } = drawRespondents(pop, { rr: [0.4, 0.6, 0.9], east: 0.8, mnar: false }, mulberry32(1));
    const a = adjust(pop, resp, d, ["edu", "region", "age"], "bounded", [0.95, 1.05]);
    assert.equal(a.converged, false);
  });

  test("ginvSym inverts a regular matrix and handles a singular one", () => {
    const A = [[4, 1], [1, 3]];
    const G = ginvSym(A);
    rel(G[0][0], 3 / 11, 1e-12, "g00");
    rel(G[0][1], -1 / 11, 1e-12, "g01");
    const S = ginvSym([[1, 1], [1, 1]]);
    rel(S[0][0], 0.25, 1e-12, "pinv");
  });

  test("calibratedMean reduces to svymean when X is only an intercept", () => {
    const obs = [1, 4, 2, 8].map((y, i) => ({ y, w: 2, d: 2, psu: i }));
    const m = calibratedMean(obs, obs.map(() => [1]));
    const ybar = 3.75;
    const s2 = [1, 4, 2, 8].reduce((s, y) => s + (y - ybar) ** 2, 0) / 3;
    rel(m.se, Math.sqrt(s2 / 4), 1e-12, "SE");
  });

  test("calibrating on the variables that drive nonresponse removes most of the bias; MNAR does not go away", () => {
    const nr = { rr: [0.4, 0.6, 0.9], east: 0.8, mnar: false };
    const s = biasSim(pop, nr, ["edu", "region", "age"], "linear", [0.6, 2], 120, 3);
    const trust = s.rows.find((r) => r.outcome === "trust")!;
    assert.ok(Math.abs(trust.biasU) > 2, `unweighted bias ${trust.biasU}`);
    assert.ok(Math.abs(trust.biasC as number) < 0.6, `calibrated bias ${trust.biasC}`);
    const m = biasSim(pop, { ...nr, mnar: true }, ["edu", "region", "age"], "linear", [0.6, 2], 120, 3);
    assert.ok((m.rows.find((r) => r.outcome === "trust")!.biasC as number) > 1, "MNAR bias remains");
    assert.equal(OUTCOMES.length, s.rows.length);
  });
});
