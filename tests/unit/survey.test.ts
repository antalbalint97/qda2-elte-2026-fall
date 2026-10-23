// Survey engine (src/lib/engine/survey-*.ts) against hand-derived closed forms (fixtures F1–F10 of the
// V3 package) and against R `survey` 4.x (tests/unit/fixtures/survey-reference.json, written by
// scripts/validation/survey_reference.R). Each R comparison uses the same design declaration on both sides.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import * as E from "../../src/lib/engine/survey-estimators";
import * as SD from "../../src/lib/engine/survey-design";
import { mulberry32 } from "../../src/lib/engine/rng";

const R = JSON.parse(readFileSync(new URL("./fixtures/survey-reference.json", import.meta.url), "utf8"));

function close(actual: number | null | undefined, expected: number, tol: number, label = "") {
  assert.ok(actual !== null && actual !== undefined && Number.isFinite(actual), `${label}: got ${actual}`);
  assert.ok(Math.abs((actual as number) - expected) <= tol * Math.max(1, Math.abs(expected)), `${label}: got ${actual}, expected ${expected} (tol ${tol})`);
}

const srsObs = () => [2, 4, 6, 8].map((y, i) => ({ y, w: 2.5, stratum: "all", psu: i, fpc: 10 }));
const stratObs = () => [
  { y: 1, w: 3, stratum: "A", psu: 1, fpc: 6 },
  { y: 3, w: 3, stratum: "A", psu: 2, fpc: 6 },
  { y: 10, w: 2, stratum: "B", psu: 3, fpc: 4 },
  { y: 14, w: 2, stratum: "B", psu: 4, fpc: 4 },
];
const clusObs = () => [[1, 2, 3], [5, 6, 7]].flatMap((ys, c) => ys.map((y) => ({ y, w: 2, stratum: "all", psu: c, fpc: 4 })));

describe("closed-form fixtures F1–F10 (hand-derived) and R survey", () => {
  test("F1 SRS: Hájek mean, Var with and without FPC", () => {
    close(E.svyMean(srsObs()).est, 5, 1e-12, "F1a");
    close(E.svyMean(srsObs(), { fpc: true }).variance, 1.0, 1e-12, "F1b");
    close(E.svyMean(srsObs()).variance, 5 / 3, 1e-12, "F1c");
    close(E.linearizedVarMean(srsObs()).v, 5 / 3, 1e-12, "F1d");
    close(E.srsVarMean([2, 4, 6, 8], 10), 1.0, 1e-12, "F1e");
    close(R.F1a, 5, 1e-12, "R F1a");
    close(R.F1b, 1.0, 1e-12, "R F1b");
    close(R.F1c, 5 / 3, 1e-12, "R F1c");
  });
  test("F2 stratified: mean, Var fpc/no fpc, closed form, JKn", () => {
    close(E.svyMean(stratObs()).est, 6, 1e-12, "F2a");
    close(E.svyMean(stratObs(), { fpc: true }).variance, 0.56, 1e-12, "F2b");
    close(E.svyMean(stratObs()).variance, 1.0, 1e-12, "F2c");
    close(E.stratVarMean([{ ys: [1, 3], Nh: 6 }, { ys: [10, 14], Nh: 4 }], 10), 0.56, 1e-12, "F2d");
    const o = stratObs();
    const rv = E.replicateVar(o, (w) => w.reduce((s, wi, i) => s + wi * o[i].y, 0) / w.reduce((s, wi) => s + wi, 0), E.replicateWeights(o, "jkn"));
    close(rv.variance, 1.0, 1e-12, "F2e");
    for (const k of ["F2a", "F2b", "F2c", "F2e"]) close(R[k], { F2a: 6, F2b: 0.56, F2c: 1, F2e: 1 }[k] as number, 1e-12, `R ${k}`);
  });
  test("F3 one-stage cluster", () => {
    close(E.svyMean(clusObs()).est, 4, 1e-12, "F3a");
    close(E.svyMean(clusObs()).variance, 4, 1e-12, "F3b");
    close(E.svyMean(clusObs(), { fpc: true }).variance, 2, 1e-12, "F3c");
    close(E.clusterVarMean([{ ys: [1, 2, 3] }, { ys: [5, 6, 7] }], 4), 2, 1e-12, "F3d");
    close(R.F3b, 4, 1e-12, "R F3b");
    close(R.F3c, 2, 1e-12, "R F3c");
  });
  test("F4 Kish, F5 post-stratification, F7 GREG, F8 domain, F9 Neyman, F10 PPS", () => {
    close(E.kishDeff([1, 1, 3, 3]), 1.25, 1e-12, "F4a");
    close(E.kishNeffW([1, 1, 3, 3]), 3.2, 1e-12, "F4b");
    const w5 = E.postStratifyWeights([1, 1, 1], ["a", "a", "b"], { a: 10, b: 5 });
    close(w5[0] + w5[1], R.F5, 1e-12, "F5");
    const cal = E.calibrateLinear([2, 2, 2, 2], [[1, 1], [1, 2], [1, 3], [1, 4]], [10, 100]);
    close((cal.w as number[]).reduce((s, w, i) => s + w * (i + 1), 0), R.F7, 1e-9, "F7 total");
    R.F7weights.forEach((w: number, i: number) => close(cal.w?.[i], w, 1e-9, `F7 weight ${i}`));
    assert.equal(cal.negative, 2);
    close((E.svyDomainMean(stratObs(), (o) => o.stratum === "A", { fpc: true }).se as number) ** 2, R.F8, 1e-12, "F8");
    close(SD.neyman([100, 200], [10, 5], 60)[0], R.F9, 1e-12, "F9");
    SD.ppsInclusion([1, 2, 3, 4, 50], 3)?.forEach((p, i) => close(p, R.F10[i], 1e-12, `F10 π${i}`));
    SD.ppsInclusion([5, 1, 8, 2, 30, 4, 12], 4)?.forEach((p, i) => close(p, R.F10b[i], 1e-12, `F10b π${i}`));
  });
});

describe("stratified cluster survey vs R survey 4.x", () => {
  const data = R.data as { id: number; h: number; psu_id: number; y: number; a: string; b: string; x: number; w: number; Npsu: number }[];
  const obs = data.map((d) => ({ y: d.y, w: d.w, stratum: String(d.h), psu: d.psu_id, fpc: d.Npsu, a: d.a, b: d.b, x: d.x }));
  test("Hájek mean and linearised SE (no fpc / fpc), total, design df", () => {
    const m = E.svyMean(obs);
    close(m.est, R.mean.est, 1e-12, "mean");
    close(m.se, R.mean.se, 1e-10, "SE");
    assert.equal(m.df, R.mean.df);
    close(E.svyMean(obs, { fpc: true }).se, R.meanFpc.se, 1e-10, "SE fpc");
    close(E.svyTotalVar(obs).se, R.total.se, 1e-10, "total SE");
  });
  test("domain means: estimate and SE (svyby)", () => {
    R.domain.levels.forEach((lv: string, k: number) => {
      const d = E.svyDomainMean(obs, (o) => o.a === lv);
      close(d.est, R.domain.est[k], 1e-12, `domain ${lv}`);
      close(d.se, R.domain.se[k], 1e-10, `domain SE ${lv}`);
    });
  });
  test("jackknife JKn (stratified) and JK1 replicate SEs of the Hájek mean", () => {
    const est = (w: number[]) => w.reduce((s, wi, i) => s + wi * obs[i].y, 0) / w.reduce((s, wi) => s + wi, 0);
    close(E.replicateVar(obs, est, E.replicateWeights(obs, "jkn")).se, R.jkn.se, 1e-10, "JKn");
    const noStrata = obs.map((o) => ({ ...o, stratum: "all" }));
    close(E.replicateVar(noStrata, est, E.replicateWeights(noStrata, "jk1")).se, R.jk1.se, 1e-10, "JK1");
  });
  test("Rao–Scott first- and second-order (svychisq)", () => {
    const rs = E.raoScott(obs, (o) => o.a, (o) => o.b);
    close(rs.pearson, R.raoScott.pearson, 1e-10, "Pearson X²");
    close(rs.chisqP, R.raoScott.chisqP, 1e-8, "first-order p");
    close(rs.F, R.raoScott.Fstat, 1e-9, "second-order F");
    close(rs.ndf, R.raoScott.ndf, 1e-9, "ndf");
    close(rs.ddf, R.raoScott.ddf, 1e-9, "ddf");
    close(rs.Fp, R.raoScott.Fp, 1e-8, "F p");
  });
  test("svyglm coefficients and design-based SEs", () => {
    const g = E.svyGlm(obs, (o) => [o.x]);
    if (g.coef === null) throw new Error("fit failed");
    R.svyglm.coef.forEach((b: number, j: number) => close(g.coef[j], b, 1e-10, `b${j}`));
    R.svyglm.se.forEach((s: number, j: number) => close(g.seDesign[j], s, 1e-8, `se${j}`));
  });
  test("raking weight vector (rake to convergence) and linear calibration (GREG) weights", () => {
    const cats = obs.map((o) => ({ a: o.a, b: o.b }));
    const rk = E.rakeBounded(obs.map((o) => o.w), cats, { a: { no: 1500, yes: 1300 }, b: { high: 800, low: 1100, mid: 900 } }, { tol: 1e-13, maxIt: 500 });
    assert.equal(rk.converged, true);
    R.rake.weights.forEach((w: number, i: number) => close(rk.w[i], w, 1e-8, `rake w${i}`));
    const raked = obs.map((o, i) => ({ ...o, w: rk.w[i] }));
    close(E.svyMean(raked).est, R.rake.mean, 1e-9, "raked mean");
    const xs = obs.map((o) => [1, o.a === "yes" ? 1 : 0, o.b === "low" ? 1 : 0, o.b === "mid" ? 1 : 0]);
    const greg = E.calibrateLinear(obs.map((o) => o.w), xs, [2800, 1300, 1100, 900]);
    R.greg.weights.forEach((w: number, i: number) => close(greg.w?.[i], w, 1e-9, `GREG w${i}`));
  });
  test("respondent-level rake() of the Weighting Studio equals rakeBounded without bounds", () => {
    const resp = obs.map((o, i) => ({ unit: null as never, id: i, y: o.y, g: o.a, x: (o.b === "low" ? 0 : 1) as 0 | 1, pi: 1 / o.w, d: o.w, stratum: o.stratum, psu: o.psu, r: true, pResp: 1, w: o.w }));
    const counts = { no: 1500, yes: 1300 };
    const xCounts = { 0: 1100, 1: 1700 };
    const a = E.rake(resp, [{ key: "g", counts }, { key: "x", counts: xCounts }], 500, 1e-9);
    const b = E.rakeBounded(obs.map((o) => o.w), resp.map((r) => ({ g: r.g, x: r.x })), { g: counts, x: xCounts }, { tol: 1e-12, maxIt: 500 });
    a.resp.forEach((r, i) => close(r.w, b.w[i], 1e-8, `w${i}`));
  });
  test("documented differences stay visible (not silently matched)", () => {
    // svymean(deff = TRUE) uses a different SRS-variance denominator than the engine's deff
    const m = E.svyMean(obs);
    assert.ok(Math.abs((m.deff as number) - R.mean.deffR) > 1e-3, "engine deff convention differs from R; keep it labelled provisional");
    assert.equal(E.SURVEY_VALIDATION.deff.state, "provisional");
    // two-stage with FPC at both stages is not implemented: the ultimate-cluster SE differs from R's
    assert.ok(Math.abs((E.svyMean(obs, { fpc: true }).se as number) - R.twoStage.se) > 1e-3);
    assert.equal(E.SURVEY_VALIDATION.twoStage.state, "unvalidated");
  });
});

describe("design simulation properties", () => {
  const spec = { N: 2000, groups: [{ id: "u", label: "Urban", share: 0.6, mu: 60, sd: 12 }, { id: "r", label: "Rural", share: 0.4, mu: 45, sd: 10 }], clusters: 30, icc: 0.1, seed: 7 };
  test("population is reproducible from its seed", () => {
    const a = SD.makePopulation(spec);
    const b = SD.makePopulation(spec);
    assert.deepEqual(a.units.slice(0, 20), b.units.slice(0, 20));
    assert.equal(a.N, 2000);
  });
  test("Σ π over the frame equals n for SRS and stratified designs", () => {
    const pop = SD.makePopulation(spec);
    const sel = SD.select(pop, { type: "srs", n: 100 }, mulberry32(1));
    close(sel.sample.reduce((s, x) => s + x.d, 0), pop.frameN, 1e-9, "Σd = N (SRS)");
    const st = SD.select(pop, { type: "strat", n: 100, allocation: "prop" }, mulberry32(2));
    close(st.sample.reduce((s, x) => s + x.d, 0), pop.frameN, 1e-9, "Σd = N (stratified)");
  });
  test("Hájek mean is approximately unbiased under SRS (Monte Carlo, 400 reps)", () => {
    const pop = SD.makePopulation(spec);
    const r = E.repeat(pop, { type: "srs", n: 80 }, { type: "none", rate: 1 }, { type: "none" }, 400, 11);
    assert.ok(Math.abs(r.biasHajek as number) < 0.5, `bias ${r.biasHajek}`);
    // the average linearised SE tracks the simulated SD of the estimates (within 15 %)
    assert.ok(Math.abs((r.meanSeLin as number) / (r.hajek.sd as number) - 1) < 0.15);
  });
  test("outcome-dependent nonresponse biases the unweighted mean; post-stratification on group does not remove it", () => {
    const pop = SD.makePopulation(spec);
    const r = E.repeat(pop, { type: "srs", n: 150 }, { type: "outcome", rate: 0.6, slope: 1.5 }, { type: "poststrat" }, 200, 5);
    assert.ok((r.biasHajek as number) > 1, `MNAR bias should remain: ${r.biasHajek}`);
  });
  test("systematic PPS selects n units with π summing to n", () => {
    const pik = SD.ppsInclusion([5, 1, 8, 2, 30, 4, 12], 4) as number[];
    const s = SD.systematicPps(pik, mulberry32(3));
    assert.equal(s.length, 4);
    assert.ok(s.includes(4) && s.includes(6), "certainty units always selected");
  });
  test("allocation helpers", () => {
    assert.deepEqual(SD.roundAllocation([10.4, 20.6, 29]), [10, 21, 29]);
    assert.equal(SD.roundAllocation([10.4, 20.4, 29.2]).reduce((s, v) => s + v, 0), 60);
    assert.equal(SD.stratMeanVar([100, 200], [10, 5], [0, 10]), null);
    assert.equal(SD.ppsInclusion([1, 2], 3), null);
  });
});
