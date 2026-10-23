// Categorical Data Lab: the count-table edits behind the draggable mosaic preserve the totals they claim to.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { apportion, moveRowBoundary, moveWithinRow, PRESET_TABLES, resize, transpose } from "../../src/components/lab/labs/categorical-lab/table-ops";
import { mulberry32 } from "../../src/lib/engine/rng";
import { chiSquare } from "../../src/lib/engine/inference";

const rowT = (t: number[][]) => t.map((r) => r.reduce((a, b) => a + b, 0));
const colT = (t: number[][]) => t[0].map((_, j) => t.reduce((a, r) => a + r[j], 0));
const N = (t: number[][]) => rowT(t).reduce((a, b) => a + b, 0);
const nonneg = (t: number[][]) => t.every((r) => r.every((v) => Number.isInteger(v) && v >= 0));

describe("categorical table edits", () => {
  test("apportion: integers, exact total, proportional", () => {
    assert.deepEqual(apportion([1, 1, 1], 10), [4, 3, 3]);
    assert.deepEqual(apportion([0, 0], 5), [3, 2]);
    assert.deepEqual(apportion([62, 88], 300), [124, 176]);
  });
  test("moveWithinRow keeps row totals (and both margins with keepMargins) over random drags", () => {
    const r = mulberry32(11);
    for (const keep of [false, true]) {
      let t: number[][] = PRESET_TABLES.strong.base.map((x) => [...x]);
      const rows0 = rowT(t);
      const cols0 = colT(t);
      for (let k = 0; k < 500; k++) {
        const i = Math.floor(r() * 3);
        const j = Math.floor(r() * 2);
        t = moveWithinRow(t, i, j, r() * rows0[i], keep);
        assert.ok(nonneg(t));
        assert.deepEqual(rowT(t), rows0);
        if (keep) assert.deepEqual(colT(t), cols0);
      }
    }
  });
  test("moveWithinRow with keepMargins changes association but not the margins", () => {
    const t0 = PRESET_TABLES.lecture.base.map((x) => [...x]);
    const t1 = moveWithinRow(t0, 0, 0, 100, true);
    assert.deepEqual(rowT(t1), rowT(t0));
    assert.deepEqual(colT(t1), colT(t0));
    assert.ok((chiSquare(t1).chi2 as number) > (chiSquare(t0).chi2 as number));
  });
  test("moveRowBoundary keeps N and within-row shares (to rounding)", () => {
    const t0 = PRESET_TABLES.strong.base.map((x) => [...x]);
    const t1 = moveRowBoundary(t0, 0, 150);
    assert.equal(N(t1), N(t0));
    assert.equal(rowT(t1)[0], 150);
    assert.equal(rowT(t1)[2], rowT(t0)[2]);
    t1[0].forEach((v, j) => assert.ok(Math.abs(v / 150 - t0[0][j] / 90) < 1 / 150));
  });
  test("resize and transpose", () => {
    assert.deepEqual(resize([[1, 2], [3, 4]], 2, 3), [[1, 2, 10], [3, 4, 10]]);
    assert.deepEqual(transpose([[1, 2, 3], [4, 5, 6]]), [[1, 4], [2, 5], [3, 6]]);
  });
  test("scaling N leaves V unchanged and multiplies χ²", () => {
    const t = PRESET_TABLES.lecture.base.map((x) => [...x]);
    const a = chiSquare(t);
    const b = chiSquare(t.map((r) => r.map((v) => v * 4)));
    assert.ok(Math.abs((b.chi2 as number) - 4 * (a.chi2 as number)) < 1e-9);
    assert.ok(Math.abs((b.V as number) - (a.V as number)) < 1e-12);
  });
});
