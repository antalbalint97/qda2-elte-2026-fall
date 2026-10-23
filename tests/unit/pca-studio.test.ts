// Linear Algebra & PCA Studio: eigen-decomposition vs numpy.linalg.eigh, PCA vs scikit-learn, principal-axis
// factoring vs numpy and factor_analyzer (MINRES), k-means vs scikit-learn KMeans from the same start, and
// the identities the lab teaches (Σλ = trace, variance along PC1 = λ₁, SSW never increases).
// Fixtures: scripts/validation/pca_studio_samples.ts + pca_studio_reference.py.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { covMatrix, eigenSym, paf, pca, varianceAlongAngle } from "../../src/lib/engine/linalg";
import { apply2, axisGap, DEG, itemAnalysis, itemCols, makeBlobs, makeCloud, mat2Info, probe, runKmeans, varianceCurve, type Mat2 } from "../../src/components/lab/labs/linalg-pca-studio/model";

const S = JSON.parse(readFileSync(new URL("./fixtures/pca-studio-samples.json", import.meta.url), "utf8"));
const REF = JSON.parse(readFileSync(new URL("./fixtures/pca-studio-reference.json", import.meta.url), "utf8"));
const close = (a: number | null | undefined, b: number, tol: number, what: string) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

describe("PCA Studio vs numpy / scikit-learn / factor_analyzer", () => {
  for (const c of S.clouds) {
    test(`probe cloud ${c.id}: eigenpairs of covariance and correlation vs numpy.linalg.eigh`, () => {
      for (const std of [false, true]) {
        const p = probe(c, std, 0);
        assert.ok(p);
        const ref = REF.clouds[c.id][std ? "corr" : "cov"];
        ref[0].forEach((v: number, k: number) => close(p.values[k], v, 1e-12, `λ${k + 1} (${std ? "corr" : "cov"})`));
        ref[1].forEach((v: number[], k: number) => v.forEach((x, j) => close(Math.abs(p.vectors[k][j]), x, 1e-9, `|v${k + 1}_${j}|`)));
      }
    });
  }
  for (const it of S.items) {
    test(`items ${it.id}: PCA and PAF`, () => {
      const ref = REF.items[it.id];
      const pc = pca(it.cols, true);
      assert.ok(pc);
      ref.corr[0].forEach((v: number, k: number) => close(pc.eigenvalues[k], v, 1e-12, `λ${k + 1}`));
      ref.skExplained.forEach((v: number, k: number) => close(pc.eigenvalues[k], v, 1e-10, `sklearn explained_variance_ ${k}`));
      ref.skRatio.forEach((v: number, k: number) => close(pc.explained[k], v, 1e-12, `sklearn ratio ${k}`));
      // components up to sign; the last two eigenvalues can be close, so compare the leading two
      ref.skAbsComponents.slice(0, 2).forEach((v: number[], k: number) => v.forEach((x, j) => close(Math.abs(pc.vectors[k][j]), x, 1e-8, `|PC${k + 1}_${j}|`)));
      const pcv = pca(it.cols, false);
      ref.cov[0].forEach((v: number, k: number) => close(pcv?.eigenvalues[k], v, 1e-11, `cov λ${k + 1}`));
      const R = covMatrix(it.cols, true)!.S;
      const f1 = paf(R, 1, 10000, 1e-12);
      assert.ok(f1?.converged && !f1.heywood, "one-factor PAF converges");
      ref.pafComm1.forEach((v: number, j: number) => close(f1.communalities[j], v, 1e-9, `PAF h²_${j} vs numpy`));
      ref.minresComm1.forEach((v: number, j: number) => close(f1.communalities[j], v, 2e-4, `PAF h²_${j} vs MINRES`));
      // these item sets have one common factor: extracting two drives a communality past 1 (Heywood case)
      const f2 = paf(R, 2);
      assert.ok(f2 && (f2.heywood || !f2.converged), "two-factor PAF is flagged");
      ref.minresAbsLoad1.forEach((v: number, j: number) => close(Math.abs(f1.loadings[0][j]), v, 2e-4, `|loading ${j}| vs MINRES`));
    });
  }
  for (const k of S.kmeans) {
    test(`k-means ${k.id}: same start, same solution as scikit-learn (Lloyd)`, () => {
      const r = runKmeans(k.points, k.k, k.seed);
      assert.ok(r?.converged);
      const ref = REF.kmeans[k.id];
      close(r.ssw, ref.inertia, 1e-9, "SSW = inertia_");
      assert.deepEqual(r.assign, ref.labels);
      ref.centers.forEach((c: number[], j: number) => c.forEach((v, m) => close(r.centroids[j][m], v, 1e-12, `centre ${j},${m}`)));
    });
  }
  test("the exported samples are the lab's data", () => {
    assert.deepEqual(makeCloud(2026, 0.7), { xs: S.clouds[0].xs, ys: S.clouds[0].ys });
    assert.deepEqual(itemCols("efficacy", true).cols, S.items[0].cols);
    assert.deepEqual(makeBlobs(2026), S.kmeans[0].points);
  });
});

describe("PCA Studio identities", () => {
  test("the variance curve peaks at PC1 with value λ₁ and bottoms at PC2 with λ₂; Σλ = trace", () => {
    for (const std of [false, true])
      for (const rho of [0.7, -0.4, 0.2]) {
        const p = probe(makeCloud(2026, rho), std, 30)!;
        close(varianceAlongAngle(p.xs, p.ys, p.pc1Deg * DEG), p.values[0], 1e-12, "Var at PC1 = λ₁");
        close(varianceAlongAngle(p.xs, p.ys, (p.pc1Deg + 90) * DEG), p.values[1], 1e-12, "Var at PC2 = λ₂");
        close(p.values[0] + p.values[1], p.S[0][0] + p.S[1][1], 1e-12, "Σλ = trace");
        close(p.covScores, 0, 1e-12, "PC scores uncorrelated");
        const curve = varianceCurve(p.xs, p.ys);
        const best = curve.reduce((a, b) => (b.v > a.v ? b : a));
        assert.ok(axisGap(best.deg, p.pc1Deg) <= 1.0001, `grid maximum ${best.deg}° near PC1 ${p.pc1Deg}°`);
        assert.ok(curve.every((c) => c.v <= p.values[0] + 1e-12 && c.v >= p.values[1] - 1e-12), "λ₂ ≤ Var(θ) ≤ λ₁");
      }
  });
  test("standardising changes the components (PCA is not unit invariant)", () => {
    const c = makeCloud(2026, 0.7);
    const a = probe(c, false, 0)!;
    const b = probe(c, true, 0)!;
    assert.ok(axisGap(a.pc1Deg, b.pc1Deg) > 5, `${a.pc1Deg} vs ${b.pc1Deg}`);
    close(b.pc1Deg, 45, 1e-9, "two standardised variables with r > 0: PC1 at 45°");
  });
  test("k-means SSW never increases over the Lloyd steps", () => {
    for (const k of [1, 2, 3, 4, 6])
      for (const seed of [1, 2026, 77]) {
        const r = runKmeans(makeBlobs(seed), k, seed)!;
        r.sswHistory.forEach((v, i) => i && assert.ok(v <= r.sswHistory[i - 1] + 1e-9, `k=${k} seed=${seed} step ${i}`));
        assert.equal(r.steps.length, r.sswHistory.length);
      }
  });
  test("2×2 matrices: eigenpairs satisfy Av = λv; det and trace; complex case has none", () => {
    const cases: Mat2[] = [
      [[2, 1], [1, 2]],
      [[1.4, 0.5], [0.3, 0.8]],
      [[1, 1], [0, 1]],
      [[3, 0], [0, 0.5]],
    ];
    for (const A of cases) {
      const m = mat2Info(A);
      close(m.det, A[0][0] * A[1][1] - A[0][1] * A[1][0], 0, "det");
      for (const e of m.eig) {
        const Av = apply2(A, e.vector);
        close(Av[0], e.value * e.vector[0], 1e-12, "Av = λv (x)");
        close(Av[1], e.value * e.vector[1], 1e-12, "Av = λv (y)");
      }
      if (m.eig.length === 2) close(m.eig[0].value + m.eig[1].value, m.trace, 1e-12, "λ₁ + λ₂ = trace");
    }
    mat2Info([[2, 1], [1, 2]]).eig.forEach((e, k) => close(e.value, [3, 1][k], 1e-14, `λ${k + 1}`));
    assert.equal(mat2Info([[0, -1], [1, 0]]).eig.length, 0, "rotation: no real eigenvectors");
    assert.equal(mat2Info([[1, 1], [0, 1]]).eig.length, 1, "shear: one eigen-direction");
  });
  test("PAF stays below PCA: communalities exclude unique variance; the weak item has the lowest", () => {
    const a = itemAnalysis("efficacy", true, true, 1);
    assert.ok(a.pc && a.fa?.converged);
    const pcComm = a.pc.loadings[0].map((l) => l * l);
    a.fa.communalities.forEach((h, j) => assert.ok(h < pcComm[j], `item ${j}: PAF ${h} < PCA ${pcComm[j]}`));
    const weak = a.fa.communalities.indexOf(Math.min(...a.fa.communalities));
    assert.equal(a.names[weak], a.names[4]);
    close(eigenSym([[2, 1], [1, 2]]).values[0], 3, 1e-14, "λ₁ of [[2,1],[1,2]]");
  });
  test("undefined cases return null", () => {
    assert.equal(paf([[1]], 1), null);
    assert.equal(paf([[1, 0.5], [0.5, 1]], 2), null);
  });
});
