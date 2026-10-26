// 02 Building an Index: the reliability statistics against an independent NumPy/SciPy computation
// (covariance form of alpha), every item subset the builder can produce, and the teaching claims
// printed on the page.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  ABSOLUTE,
  categorise,
  categoryCounts,
  CORRECT_REVERSED,
  cumulative,
  FINAL_INCLUDED,
  INDEX,
  ITEMS,
  percentileCuts,
  relativeCuts,
  RESPONSES,
  scoredMatrix,
} from "../../src/components/modules/indices/data";
import { alphaBand, alphaParts, cronbachAlpha, itemTotalStatistics } from "../../src/lib/reliability";
import { mean } from "../../src/lib/stats";

const REF = JSON.parse(readFileSync(new URL("./fixtures/reference.json", import.meta.url), "utf8")).index;

function close(actual: number, expected: number, tol: number, label = "") {
  assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${label}: ${actual} vs ${expected}`);
}

interface RefReliability {
  alpha: number;
  items: Array<{ scaleMean: number; scaleVar: number; itemTotal: number; alphaIfDeleted: number | null }>;
}

const ALL = ITEMS.map(() => true);
const NONE = ITEMS.map(() => false);
const forgotT5 = CORRECT_REVERSED.map((r, j) => r && j !== 4);

function checkReliability(m: number[][], ref: RefReliability, label: string) {
  close(cronbachAlpha(m), ref.alpha, 1e-10, `${label} alpha`);
  itemTotalStatistics(m).forEach((row, j) => {
    const r = ref.items[j];
    close(row.scaleMeanIfDeleted, r.scaleMean, 1e-12, `${label} item ${j} scale mean`);
    close(row.scaleVarianceIfDeleted, r.scaleVar, 1e-10, `${label} item ${j} scale variance`);
    close(row.itemTotal, r.itemTotal, 1e-10, `${label} item ${j} item-total r`);
    close(row.alphaIfDeleted, r.alphaIfDeleted!, 1e-10, `${label} item ${j} alpha if deleted`);
  });
}

describe("09 Building an Index", () => {
  test("the synthetic answers are the ones checked by the reference script", () => {
    assert.deepEqual(RESPONSES, REF.responses);
    assert.equal(RESPONSES.length, 120);
    assert.ok(RESPONSES.flat().every((v) => Number.isInteger(v) && v >= 1 && v <= 5));
  });

  test("alpha, item-total r, alpha if deleted and scale-if-deleted match NumPy/SciPy", () => {
    checkReliability(scoredMatrix(ALL, NONE), REF.raw, "raw");
    checkReliability(scoredMatrix(ALL, CORRECT_REVERSED), REF.six, "six reversed");
    checkReliability(scoredMatrix(FINAL_INCLUDED, CORRECT_REVERSED), REF.five, "five");
    checkReliability(scoredMatrix(ALL, forgotT5), REF.forgotT5, "T5 not reversed");
  });

  test("every item subset the builder allows has the reference alpha", () => {
    for (const [mask, a] of REF.subsets as Array<[boolean[], number]>)
      close(cronbachAlpha(scoredMatrix(mask, CORRECT_REVERSED)), a, 1e-10, `subset ${mask.map(Number).join("")}`);
  });

  test("alpha identities: mirror-image reversal, parallel items, the variance form", () => {
    const mirror = CORRECT_REVERSED.map((r) => !r);
    close(cronbachAlpha(scoredMatrix(ALL, mirror)), cronbachAlpha(scoredMatrix(ALL, CORRECT_REVERSED)), 1e-12, "mirror");
    const col = RESPONSES.map((r) => r[0]);
    close(cronbachAlpha(col.map((v) => [v, v, v])), 1, 1e-12, "identical items");
    const m = scoredMatrix(ALL, CORRECT_REVERSED);
    const p = alphaParts(m);
    close(cronbachAlpha(m), (p.k / (p.k - 1)) * (1 - p.sumOfItemVariances / p.totalVariance), 1e-12, "parts");
  });

  test("teaching claims: raw items contradict, all six are questionable, T6 is the item to drop, five items are enough", () => {
    assert.ok(REF.raw.alpha < 0, "without reversing, alpha is negative");
    const six = REF.six as RefReliability;
    assert.ok(six.alpha >= 0.6 && six.alpha < 0.7 && alphaBand(six.alpha).label === "questionable");
    const best = six.items.reduce((b, r, j) => (r.alphaIfDeleted! > six.items[b].alphaIfDeleted! ? j : b), 0);
    assert.equal(ITEMS[best].id, "T6");
    assert.ok(six.items[5].itemTotal < 0.25 && six.items.slice(0, 5).every((r) => r.itemTotal >= 0.25));
    const five = REF.five as RefReliability;
    assert.ok(five.alpha >= 0.7 && five.alpha < 0.8 && alphaBand(five.alpha).ok);
    assert.ok(five.items.every((r) => r.alphaIfDeleted! < five.alpha), "no further deletion helps");
    assert.ok(REF.forgotT5.items[4].itemTotal < 0, "a forgotten reversal shows as a negative item-total r");
  });

  test("the final index equals the reference and moves in steps of 0.2", () => {
    assert.deepEqual(INDEX, REF.indexScores);
    close(mean(INDEX), REF.indexMean, 1e-12);
    assert.ok(INDEX.every((v) => Math.abs(v * 5 - Math.round(v * 5)) < 1e-9));
  });

  test("categories: every case lands in exactly one category and the printed ranges leave no gap", () => {
    const step = (k: number) => Math.round(k * 10) / 10;
    const all = [ABSOLUTE, percentileCuts(INDEX), ...Array.from({ length: 9 }, (_, i) => relativeCuts(INDEX, step(0.2 + i * 0.1)))];
    for (const cuts of all) {
      const counts = categoryCounts(INDEX, cuts);
      assert.equal(counts[0] + counts[1] + counts[2], INDEX.length);
      assert.ok(cuts.upper[0] < cuts.upper[1]);
      // the next range starts at upper + 0.01: no index value may fall strictly in between
      for (const u of cuts.upper) assert.ok(INDEX.every((v) => !(v > u && v < u + 0.01)), `gap after ${u}`);
    }
  });

  test("percentile limits use the cumulative % closest to 33.3 and 66.7", () => {
    const rows = cumulative(INDEX);
    assert.equal(rows.at(-1)!.cum, 100);
    const pc = percentileCuts(INDEX);
    for (const [i, target] of [100 / 3, 200 / 3].entries()) {
      const d = Math.abs(pc.reached[i] - target);
      assert.ok(rows.every((r) => Math.abs(r.cum - target) >= d));
    }
  });

  test("quiz: K at 3.3 is middle on the absolute scale but below average when the mean is 3.9", () => {
    const sample = [3.4, 4.4, 3.9, 3.9];
    assert.equal(Math.round(mean(sample) * 10) / 10, 3.9);
    assert.equal(categorise(3.3, ABSOLUTE), 1);
    assert.equal(categorise(3.3, relativeCuts(sample, 0.5)), 0);
  });
});
