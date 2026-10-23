// Model Diagnostics Studio: coefficients, classical and HC3 SEs, hat values, studentised residuals, Cook's D,
// VIF and the Breusch–Pagan test vs statsmodels on every scenario; the scenario properties the lab teaches.
// Fixtures: scripts/validation/diagnostics_samples.ts + diagnostics_reference.py.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { applyMoves, diagnose, genPoints, makeX2, type Diagnosis } from "../../src/components/lab/labs/model-diagnostics-studio/model";

const S = JSON.parse(readFileSync(new URL("./fixtures/diagnostics-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/diagnostics-reference.json", import.meta.url), "utf8"));
const close = (a: number | null | undefined, b: number, tol: number, what: string) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: ${a} vs ${b}`);
const run = (c: { x: number[]; x2: number[] | null; y: number[] }) => diagnose(c.x.map((x, i) => ({ x, y: c.y[i] })), !!c.x2, c.x2 ?? []) as Diagnosis;

describe("Model Diagnostics Studio vs statsmodels", () => {
  for (const c of S.cases) {
    test(c.id, () => {
      const d = run(c);
      const r = REF[c.id];
      assert.ok("fit" in d);
      r.coef.forEach((v: number, j: number) => close(d.fit.coef[j], v, 1e-10, `coef ${j}`));
      r.se.forEach((v: number, j: number) => close(d.fit.se[j], v, 1e-10, `se ${j}`));
      r.seHC3.forEach((v: number, j: number) => close(d.fit.seHC3?.[j], v, 1e-10, `HC3 ${j}`));
      r.hat.forEach((v: number, i: number) => close(d.fit.leverage[i], v, 1e-10, `hat ${i}`));
      r.stdRes.forEach((v: number, i: number) => close(d.fit.stdRes[i], v, 1e-10, `studentised ${i}`));
      r.cooks.forEach((v: number, i: number) => close(d.fit.cooks[i], v, 1e-10, `Cook ${i}`));
      close(d.fit.r2, r.r2, 1e-12, "R²");
      if (r.vif) r.vif.forEach((v: number, j: number) => close(d.fit.vif?.[j], v, 1e-10, `VIF ${j}`));
      close(d.bp?.lm, r.bp.lm, 1e-10, "BP LM");
      close(d.bp?.p, r.bp.p, 1e-8, "BP p");
    });
  }
  test("the exported samples are the lab's data", () => {
    assert.deepEqual(genPoints(2026, "linear").map((p) => p.x), S.cases[0].x);
    assert.deepEqual(makeX2(genPoints(2026, "collinear").map((p) => p.x), 0.95, 2026), S.cases.find((c: { id: string }) => c.id === "x2-rho0.95").x2);
  });
});

describe("Model Diagnostics Studio scenarios", () => {
  test("the influential point has the largest leverage and Cook's D; moving it changes the slope a lot", () => {
    const p = genPoints(2026, "outlier");
    const d = diagnose(p, false, []) as Diagnosis;
    const maxD = Math.max(...(d.fit.cooks as number[]));
    assert.equal(d.fit.cooks[0], maxD);
    assert.ok(maxD > d.dCut && d.fit.leverage[0] > d.hCut, `D ${maxD}, h ${d.fit.leverage[0]}`);
    const d2 = diagnose(applyMoves(p, [[0, 14, 95]]), false, []) as Diagnosis;
    assert.ok(Math.abs(d2.fit.coef[1] - d.fit.coef[1]) > 1, "one point steers the slope");
  });
  test("fan: BP rejects and HC3 > classical; linear: BP rarely rejects and HC3 ≈ classical (over 60 seeds and at the default)", () => {
    const fan = diagnose(genPoints(2026, "fan"), false, []) as Diagnosis;
    assert.ok((fan.fit.seHC3 as number[])[1] > fan.fit.se[1] && (fan.bp?.p ?? 1) < 0.05, "default seed, fan");
    const lin = diagnose(genPoints(2026, "linear"), false, []) as Diagnosis;
    assert.ok(Math.abs((lin.fit.seHC3 as number[])[1] / lin.fit.se[1] - 1) < 0.2 && (lin.bp?.p ?? 0) > 0.05, "default seed, linear");
    let fanRej = 0;
    let linRej = 0;
    for (let seed = 1; seed <= 60; seed++) {
      if (((diagnose(genPoints(seed, "fan"), false, []) as Diagnosis).bp?.p ?? 1) < 0.05) fanRej++;
      if (((diagnose(genPoints(seed, "linear"), false, []) as Diagnosis).bp?.p ?? 1) < 0.05) linRej++;
    }
    assert.ok(fanRej >= 45, `fan rejections ${fanRej}/60`);
    assert.ok(linRej <= 8, `linear rejections ${linRej}/60 (nominal 5 %)`);
  });
  test("curved: residuals bend (running mean positive in the middle, negative at both ends)", () => {
    const d = diagnose(genPoints(2026, "curved"), false, []) as Diagnosis;
    const s = d.smooth;
    const mid = s[Math.floor(s.length / 2)].e;
    assert.ok(mid > 0 && s[0].e < 0 && s[s.length - 1].e < 0, `${s[0].e} ${mid} ${s[s.length - 1].e}`);
  });
  test("collinear pair: VIF grows with ρ; the slope SE inflates", () => {
    const p = genPoints(2026, "collinear");
    const x2lo = makeX2(p.map((q) => q.x), 0.3, 2026);
    const x2hi = makeX2(p.map((q) => q.x), 0.97, 2026);
    const lo = diagnose(p, true, x2lo) as Diagnosis;
    const hi = diagnose(p, true, x2hi) as Diagnosis;
    assert.ok((hi.fit.vif as number[])[0] > 5 * (lo.fit.vif as number[])[0]);
    assert.ok(hi.fit.se[1] > 2 * lo.fit.se[1]);
  });
  test("undefined cases: too few points", () => {
    const d = diagnose([{ x: 1, y: 2 }, { x: 2, y: 3 }], false, []);
    assert.ok("reason" in d);
  });
});
