// Complex Survey Inference Lab vs R survey on the lab's own samples (svymean, as.svrepdesign JK1 / JKn / BRR,
// domain via subset, svychisq first and second order, svyglm), plus a coverage simulation.
// Fixtures: scripts/validation/complex_survey_samples.ts + complex_survey_reference.R.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { tQuantile } from "../../src/lib/engine/distributions";
import { mulberry32 } from "../../src/lib/engine/rng";
import { raoScott, svyGlm } from "../../src/lib/engine/survey-estimators";
import { brrWeights, coverageSim, domainEstimates, drawSample, hajek, makeCsPopulation, seSet, type CsObs } from "../../src/components/lab/labs/complex-survey-lab/model";
import { replicateVar } from "../../src/lib/engine/survey-estimators";

const SAMPLES = JSON.parse(readFileSync(new URL("./fixtures/complex-survey-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/complex-survey-reference.json", import.meta.url), "utf8")).cases;
const rel = (a: number | null, b: number, tol: number, what: string) => assert.ok(a !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);

describe("Complex Survey Inference Lab vs R survey", () => {
  SAMPLES.cases.forEach((c: { id: string; H: number; a: number; rows: Omit<CsObs, "h">[] }, i: number) => {
    test(c.id, () => {
      const obs = drawSample(makeCsPopulation(c.H, 2026), c.a, mulberry32(900 + i));
      assert.deepEqual(obs.map((o) => o.y), c.rows.map((r) => r.y), "sample reproduced");
      const ref = REF[c.id];
      const s = seSet(obs, "jkn", false);
      rel(s.est, ref.mean, 1e-12, "mean");
      rel(s.taylor, ref.se, 1e-10, "Taylor SE");
      rel(s.replicate, ref.jkn, 1e-10, "JKn SE");
      rel(s.deff, ref.deff, 1e-10, "deff");
      rel(seSet(obs, "taylor", true).taylor, ref.seFpc, 1e-10, "Taylor SE with fpc");
      const jk1 = seSet(obs.map((o) => ({ ...o, stratum: "all" })), "jk1", false);
      rel(jk1.replicate, ref.jk1, 1e-10, "JK1 SE");
      if (c.a === 2) rel(seSet(obs, "brr", false).replicate, ref.brr, 1e-10, "BRR SE");
      else assert.equal(brrWeights(obs), null, "BRR needs two PSUs per stratum");
      const dm = domainEstimates(obs, { key: "group", value: "C" }, "jkn", false);
      rel(dm.est, ref.domainC.mean, 1e-12, "domain mean");
      rel(dm.seTaylor, ref.domainC.se, 1e-10, "domain SE");
      rel(dm.seRep, ref.domainC.jkn, 1e-10, "domain JKn SE");
      const rs = raoScott(obs, (o) => o.group, (o) => String(o.agree));
      rel(rs.pearson, ref.chisq.X2, 1e-10, "Pearson X2");
      rel(rs.chisqP, ref.chisq.p, 1e-8, "first-order p");
      rel(rs.F, ref.chisq.F, 1e-10, "F");
      rel(rs.ndf, ref.chisq.ndf, 1e-10, "ndf");
      rel(rs.ddf, ref.chisq.ddf, 1e-10, "ddf");
      rel(rs.Fp, ref.chisq.Fp, 1e-8, "F p");
      const g = svyGlm(obs, (o) => [o.x, o.group === "B" ? 1 : 0, o.group === "C" ? 1 : 0]);
      assert.ok(g.coef);
      if ("seDesign" in g) {
        ref.glm.coef.forEach((b: number, k: number) => rel(g.coef[k], b, 1e-10, `coef ${k}`));
        ref.glm.se.forEach((se: number, k: number) => rel(g.seDesign[k], se, 1e-8, `glm SE ${k}`));
      }
    });
  });
});

describe("Complex Survey Inference Lab invariants", () => {
  test("BRR replicates are balanced: every unit is doubled in exactly half of the replicates", () => {
    const obs = drawSample(makeCsPopulation(5, 2026), 2, mulberry32(4));
    const rw = brrWeights(obs)!;
    assert.equal(rw.replicates.length, 8);
    obs.forEach((o, k) => assert.equal(rw.replicates.filter((r) => r[k] > 0).length, 4));
    assert.ok(replicateVar(obs, hajek(obs), rw).se! > 0);
  });

  test("coverage of design-based 95 % intervals is close to 95 % (1 000 samples); naive intervals undercover", () => {
    const pop = makeCsPopulation(4, 2026);
    const sim = coverageSim(pop, 6, false, 1000, 77, (df) => tQuantile(0.975, df) as number);
    assert.ok(sim.coverageDesign >= 0.935 && sim.coverageDesign <= 0.965, `design coverage ${sim.coverageDesign}`);
    assert.ok(sim.coverageNaive < sim.coverageDesign, `naive ${sim.coverageNaive}`);
  });
});
