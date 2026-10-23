// Mathematical Foundations Studio: numeric derivatives within 1e-6 of the analytic ones (and of R's D()),
// Simpson integrals vs the antiderivative and R's integrate(), Riemann convergence, the Σ identities, the SSE
// bowl minimum = OLS (vs engine fit() and R lm()), and the binomial likelihood maximum at k/n (vs optimize()).
// Fixture: scripts/validation/math_reference.R.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { areaOf, bowlAt, contour, descentStep, expandSum, FNS, gPrime, gridMinimum, likelihoodAt, slopeAt, ssAround, vraData, type Fn } from "../../src/components/lab/labs/math-studio/model";

const REF = JSON.parse(readFileSync(new URL("./fixtures/math-reference.json", import.meta.url), "utf8"));
const close = (a: number | null | undefined, b: number, tol: number, what: string) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

describe("Math Studio vs R", () => {
  for (const c of REF.cases as { fn: Fn; a: number; b: number; c: number; d: number; lo: number; hi: number; x0: number; integral: number; deriv: number }[]) {
    const t = { a: c.a, b: c.b, c: c.c, d: c.d };
    test(`${c.fn} a=${c.a} b=${c.b} c=${c.c} d=${c.d}`, () => {
      const s = slopeAt(c.fn, t, c.x0);
      close(s.numeric, c.deriv, 1e-6 * Math.max(1, Math.abs(c.deriv)), "numeric f′ vs R D()");
      close(s.analytic, c.deriv, 1e-12 * Math.max(1, Math.abs(c.deriv)), "analytic f′ vs R D()");
      const ar = areaOf(c.fn, t, c.lo, c.hi, 8, "left");
      // the normal preset's antiderivative is the engine Φ (absolute accuracy ≈ 1e-8), scaled by a/b
      close(ar.exact, c.integral, c.fn === "normal" ? 2e-8 * Math.max(1, Math.abs(c.a / c.b)) : 1e-9, "antiderivative vs integrate()");
      close(ar.simpson, c.integral, 1e-7, "Simpson vs integrate()");
    });
  }
  test("SSE bowl minimum = OLS = R lm()", () => {
    const { x, y } = vraData();
    const bw = bowlAt(x, y, 0, 0);
    close(bw.ols.a, REF.ols.a, 1e-10, "â");
    close(bw.ols.b, REF.ols.b, 1e-12, "b̂");
    close(bw.ols.sse, REF.ols.sse, 1e-9, "SSE_min");
    const at = bowlAt(x, y, REF.ols.a, REF.ols.b);
    close(at.grad[0], 0, 1e-9, "∂SSE/∂a at OLS");
    close(at.grad[1], 0, 1e-8, "∂SSE/∂b at OLS");
    const gm = gridMinimum(x, y, REF.ols.a - 20, REF.ols.a + 20, REF.ols.b - 4, REF.ols.b + 4);
    assert.ok(Math.abs(gm.a - REF.ols.a) <= 40 / 60 + 1e-9 && Math.abs(gm.b - REF.ols.b) <= 8 / 60 + 1e-9, "61×61 grid minimum within one cell of OLS");
  });
  test("binomial likelihood is maximised at k/n (R optimize)", () => {
    for (const l of REF.likelihood) {
      const lk = likelihoodAt(l.k, l.n, 0.5);
      close(lk.pHat, l.argmax, 1e-6, `argmax ${l.k}/${l.n}`);
      close(lk.L, l.L, 1e-12, `L(0.5) = dbinom`);
      close(likelihoodAt(l.k, l.n, l.k / l.n).score, 0, 1e-4, "score zero at p̂");
      close(lk.infoNumeric, lk.infoExact as number, 1e-3 * (lk.infoExact as number), "observed information n/(p̂(1−p̂))");
    }
  });
});

describe("Math Studio invariants", () => {
  test("numeric derivative within 1e-6 of analytic for every preset on a grid of x and transforms", () => {
    const ts = [
      { a: 1, b: 1, c: 0, d: 0 },
      { a: -2, b: 0.5, c: 1, d: 1 },
      { a: 0.7, b: 2, c: -0.5, d: -2 },
    ];
    for (const fn of FNS)
      for (const t of ts)
        for (let x = -3; x <= 3; x += 0.37) {
          const s = slopeAt(fn, t, x);
          if (s.reason) continue;
          const an = gPrime(fn, t, x);
          close(s.numeric, an, 1e-6 * Math.max(1, Math.abs(an)), `${fn} x=${x.toFixed(2)}`);
        }
  });
  test("the kink and the log domain are flagged, not differentiated", () => {
    assert.equal(slopeAt("abs", { a: 1, b: 1, c: 0, d: 0 }, 0).reason, "kink");
    assert.equal(slopeAt("abs", { a: 1, b: 2, c: -1, d: 0 }, 0.5).reason, "kink");
    assert.equal(slopeAt("log", { a: 1, b: 1, c: 0, d: 0 }, -1).reason, "domain");
    assert.equal(areaOf("log", { a: 1, b: 1, c: 0, d: 0 }, -1, 2, 8, "mid").reason, "domain");
  });
  test("Riemann sums converge to the exact integral (error falls with n)", () => {
    for (const rule of ["left", "mid", "right"] as const) {
      const errs = [4, 16, 64, 256].map((n) => {
        const a = areaOf("exp", { a: 1, b: 1, c: 0, d: 0 }, -1, 2, n, rule);
        return Math.abs((a.riemann as number) - (a.exact as number));
      });
      errs.forEach((e, i) => i && assert.ok(e < errs[i - 1], `${rule}: ${errs}`));
    }
  });
  test("Σ(xᵢ − x̄) = 0, Σ(xᵢ − x̄)² = (n−1)s², and x̄ minimises Σ(xᵢ − c)²", () => {
    const { x } = vraData();
    for (const n of [2, 4, 9, 15]) {
      const e = expandSum(x.slice(0, n));
      close(e.sumDev, 0, 1e-12, "Σ deviations");
      for (const c of [e.mean - 1, e.mean + 0.3, e.mean + 2]) assert.ok(ssAround(e.xs, c) > e.ss, "x̄ is the minimiser");
      close(ssAround(e.xs, e.mean), e.ss, 1e-12, "SS at the mean");
    }
  });
  test("bowl contours lie on their level; exact line-search descent decreases SSE and reaches OLS", () => {
    const { x, y } = vraData();
    const bw = bowlAt(x, y, 0, 0);
    for (const lvl of [bw.ols.sse * 1.5, bw.ols.sse * 4]) for (const [a, b] of contour(bw, lvl)) close(bowlAt(x, y, a, b).sse, lvl, 1e-8 * lvl, "on contour");
    assert.deepEqual(contour(bw, bw.ols.sse * 0.5), []);
    let p: [number, number] = [0, 0];
    let last = Infinity;
    for (let i = 0; i < 400; i++) {
      const cur = bowlAt(x, y, p[0], p[1]);
      assert.ok(cur.sse <= last + 1e-9, "descent never increases SSE");
      last = cur.sse;
      p = descentStep(cur);
    }
    close(p[0], bw.ols.a, 1e-6, "descent → â");
    close(p[1], bw.ols.b, 1e-7, "descent → b̂");
  });
});
