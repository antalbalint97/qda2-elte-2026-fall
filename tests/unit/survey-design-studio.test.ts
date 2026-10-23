// Survey Sampling Design Studio: allocation, inclusion probabilities and estimates on the studio's own
// population and samples. R references: tests/unit/fixtures/design-studio-reference.json
// (scripts/validation/design_studio_reference.R, survey + sampling).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { mulberry32 } from "../../src/lib/engine/rng";
import { ppsInclusion } from "../../src/lib/engine/survey-design";
import { allocate, analyse, draw, exactSe, makeDsPopulation, plan, simulate, toObs, type DesignSpec } from "../../src/components/lab/labs/survey-design-studio/model";

const SAMPLES = JSON.parse(readFileSync(new URL("./fixtures/design-studio-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/design-studio-reference.json", import.meta.url), "utf8"));
const rel = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);

const pop = makeDsPopulation(SAMPLES.seed);
const base: DesignSpec = { strata: 1, stages: 1, pps: false, allocation: "proportional", n: 160, m: 10, coverage: [1, 1, 1], nh: [] };

describe("Survey Sampling Design Studio vs R", () => {
  test("the exported samples are reproduced by the current code", () => {
    const cases: { id: string; d: DesignSpec }[] = [
      { id: "srs", d: base },
      { id: "strat-prop", d: { ...base, strata: 3 } },
      { id: "strat-neyman", d: { ...base, strata: 3, allocation: "neyman", coverage: [1, 0.7, 0.5] } },
      { id: "twostage-srs", d: { ...base, stages: 2 } },
      { id: "twostage-pps", d: { ...base, stages: 2, pps: true } },
      { id: "strat-twostage-pps", d: { ...base, strata: 3, stages: 2, pps: true, n: 200, m: 8 } },
    ];
    cases.forEach((c, i) => {
      const p = plan(pop, c.d);
      const rows = toObs(p, c.d, draw(p, c.d, mulberry32(500 + i)));
      const fx = SAMPLES.cases.find((s: { id: string }) => s.id === c.id);
      assert.equal(rows.length, fx.rows.length, c.id);
      rows.forEach((r, k) => assert.equal(r.y, fx.rows[k].y));
      // estimates shown by the studio vs R svymean / svyby
      const a = analyse(p, c.d, draw(p, c.d, mulberry32(500 + i)));
      const ref = REF.cases[c.id];
      rel(a.est as number, ref.mean, 1e-12, `${c.id} mean`);
      rel(a.se as number, ref.se, 1e-10, `${c.id} SE`);
      a.domains.forEach((dm, h) => {
        rel(dm.est as number, ref.domainMean[h], 1e-12, `${c.id} domain ${h} mean`);
        rel(dm.se as number, ref.domainSe[h], 1e-10, `${c.id} domain ${h} SE`);
      });
    });
  });

  test("PPS first-stage π vs sampling::inclusionprobabilities", () => {
    for (const r of SAMPLES.pps as { id: string; x: number[]; n: number }[]) {
      const pik = ppsInclusion(r.x, r.n) as number[];
      REF.pps[r.id].forEach((v: number, i: number) => rel(pik[i], v, 1e-12, `${r.id} π${i}`));
    }
  });
});

describe("Survey Sampling Design Studio invariants", () => {
  test("Neyman allocation equals the closed form n·N_h·S_h / Σ N_h·S_h before rounding", () => {
    const p = plan(pop, { ...base, strata: 3, allocation: "neyman" });
    const Nh = p.groups.map((g) => g.N);
    const Sh = p.groups.map((g) => g.S);
    const D = Nh.reduce((s, N, h) => s + N * Sh[h], 0);
    p.nh.forEach((v, h) => assert.ok(Math.abs(v - (160 * Nh[h] * Sh[h]) / D) <= 1, `n_${h}`));
    assert.equal(p.nh.reduce((a, b) => a + b, 0), 160);
    assert.deepEqual(allocate([100, 300], [1, 1], 40, "custom", [1, 500]), [2, 300]);
  });

  test("Σπ_k = n for one-stage designs and = E[n] = Σ π_PSU·min(m, M_i) for two-stage designs", () => {
    for (const d of [base, { ...base, strata: 3 as const, allocation: "equal" as const }, { ...base, coverage: [0.5, 0.8, 1] }]) {
      const p = plan(pop, d);
      rel(p.sumPi, p.nh.reduce((a, b) => a + b, 0), 1e-12, "Σπ one stage");
    }
    for (const d of [{ ...base, stages: 2 as const }, { ...base, stages: 2 as const, pps: true }, { ...base, strata: 3 as const, stages: 2 as const, pps: true, m: 30 }]) {
      const p = plan(pop, d);
      const exp = p.groups.flatMap((g) => g.psus).reduce((s, q) => s + (p.pi1.get(q.psu.id) as number) * Math.min(d.m, q.units.length), 0);
      rel(p.sumPi, exp, 1e-12, "Σπ two stage");
      if (!d.pps || d.m <= 10) rel(p.groups.reduce((s, g) => s + g.psus.reduce((t, q) => t + (p.pi1.get(q.psu.id) as number), 0), 0), p.ah.reduce((a, b) => a + b, 0), 1e-12, "Σπ_PSU = a");
    }
  });

  test("PPS with a fixed take gives (nearly) equal unit π: self-weighting", () => {
    const p = plan(pop, { ...base, stages: 2, pps: true, m: 8 });
    const pis = [...p.pik.values()];
    const max = Math.max(...pis);
    const min = Math.min(...pis);
    const pSrs = plan(pop, { ...base, stages: 2, m: 8 });
    const s = [...pSrs.pik.values()];
    assert.ok(max / min < Math.max(...s) / Math.min(...s), "PPS spreads π less than equal-probability PSU selection");
  });

  test("selection frequencies match π_k (2 000 draws, two-stage stratified PPS)", () => {
    const d: DesignSpec = { ...base, strata: 3, stages: 2, pps: true, m: 8, n: 120 };
    const p = plan(pop, d);
    const hits = new Map<number, number>();
    const rand = mulberry32(9);
    const R = 2000;
    for (let r = 0; r < R; r++) draw(p, d, rand).sample.forEach((s) => hits.set(s.unit.id, (hits.get(s.unit.id) ?? 0) + 1));
    // compare PSU-level totals (sum of π over the PSU's units) to keep the Monte Carlo error small
    for (const q of p.groups.flatMap((g) => g.psus)) {
      const expected = q.units.reduce((s, u) => s + (p.pik.get(u.id) as number), 0);
      const got = q.units.reduce((s, u) => s + (hits.get(u.id) ?? 0), 0) / R;
      const sdv = Math.sqrt((expected * Math.max(d.m, 1) * (1 - Math.min(1, expected / d.m))) / R) + 1e-9;
      assert.ok(Math.abs(got - expected) < 5 * sdv + 0.02, `PSU ${q.psu.id}: ${got} vs ${expected}`);
    }
  });

  test("one-stage exact SE agrees with the simulated SE; frame undercoverage biases the mean", () => {
    const d: DesignSpec = { ...base, strata: 3 };
    const p = plan(pop, d);
    const sim = simulate(p, d, 1500, 4);
    const ex = exactSe(p, d) as number;
    assert.ok(Math.abs(sim.se - ex) / ex < 0.08, `${sim.se} vs ${ex}`);
    assert.ok(Math.abs((sim.mean as number) - pop.truth) < 3 * (ex / Math.sqrt(1500)) + 1e-9);
    const dc: DesignSpec = { ...d, strata: 1, coverage: [1, 1, 0.3] };
    const pc = plan(pop, dc);
    assert.ok(pc.frameMean - pop.truth > 0.5, "villages (low y) under-covered → mean too high");
  });
});
