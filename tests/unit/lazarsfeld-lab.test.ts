// Lazarsfeld & Simpson Lab: the zero-order table is the weighted sum of the partials, the published
// kidney-stone example reverses, and the composition / percentage edits keep what they claim to keep.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { classify, LZ_SCENARIOS, partials, setComposition, setPartialPct, type Tables } from "../../src/components/lab/labs/lazarsfeld-simpson-lab/model";
import { mulberry32 } from "../../src/lib/engine/rng";

const groupN = (t: Tables, xi: number) => t[0][xi][0] + t[0][xi][1] + t[1][xi][0] + t[1][xi][1];

describe("Lazarsfeld & Simpson model", () => {
  test("aggregate % equals the composition-weighted partial % to 1e-12 (random tables)", () => {
    const r = mulberry32(3);
    for (let k = 0; k < 500; k++) {
      const t: Tables = [0, 1].map(() => [0, 1].map(() => [1 + Math.floor(r() * 300), 1 + Math.floor(r() * 300)]));
      const P = partials(t);
      for (const xi of [0, 1]) {
        const n = P.composition[0][xi] + P.composition[1][xi];
        const w = [0, 1].reduce((a, z) => a + (P.composition[z][xi] / n) * (P.partialPct[z][xi] as number), 0);
        assert.ok(Math.abs(w - (P.zeroPct[xi] as number)) < 1e-12);
      }
    }
  });
  test("kidney stones (Charig et al. 1986): A better within both sizes, worse overall", () => {
    const P = partials(LZ_SCENARIOS.simpson.tables);
    assert.deepEqual(P.zero, [[273, 77], [289, 61]]);
    assert.ok(Math.abs((P.zeroPct[0] as number) - 78) < 1e-12);
    assert.ok(Math.abs((P.zeroPct[1] as number) - (100 * 289) / 350) < 1e-12);
    assert.ok((P.zeroDiff as number) < 0);
    assert.ok(P.partialDiff.every((d) => (d as number) > 0));
    assert.equal(classify(P), "simpson");
  });
  test("each scenario's counts show the pattern it is named after", () => {
    const expect = { replication: "replication", specification: "specification", explanation: "explanation", interpretation: "explanation", simpson: "simpson" } as const;
    for (const [k, v] of Object.entries(expect)) assert.equal(classify(partials(LZ_SCENARIOS[k as keyof typeof expect].tables)), v, k);
  });
  test("setComposition keeps the X group's n and (to rounding) both partial percentages", () => {
    const t0 = LZ_SCENARIOS.explanation.tables;
    const t1 = setComposition(t0, 0, 0.2);
    assert.equal(groupN(t1, 0), groupN(t0, 0));
    assert.deepEqual(t1.map((z) => z[1]), t0.map((z) => z[1]));
    assert.equal(t1[1][0][0] + t1[1][0][1], Math.round(0.2 * groupN(t0, 0)));
    const P0 = partials(t0);
    const P1 = partials(t1);
    for (const z of [0, 1]) assert.ok(Math.abs((P1.partialPct[z][0] as number) - (P0.partialPct[z][0] as number)) < 100 / 50);
  });
  test("setPartialPct keeps the cell n", () => {
    const t = setPartialPct(LZ_SCENARIOS.replication.tables, 1, 0, 25);
    assert.deepEqual(t[1][0], [25, 75]);
  });
});
