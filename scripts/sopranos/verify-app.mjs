// Prints the statistics exactly as the app computes them (src/content/sopranos/analysis.ts),
// for comparison with scripts/sopranos/verify.py (scipy).   Run: node scripts/sopranos/verify-app.mjs
import { register } from "node:module";

register("./alias-loader.mjs", import.meta.url);
const a = await import("../../src/content/sopranos/analysis.ts");

const r = (x, d = 3) => Number(x.toFixed(d));
const out = {
  N: a.N,
  descriptives: Object.fromEntries(
    ["death_count", "violence_event_count", "fuck_count", "runtime_minutes"].map((k) => {
      const d = a.describe(k);
      return [k, { n: d.n, mean: r(d.mean, 2), median: d.median, min: d.min, max: d.max, sd: r(d.sd, 2), skew: r(d.skew, 2) }];
    }),
  ),
  crosstab: { table: a.ZERO_ORDER, chi2: r(a.ZERO_ORDER_TEST.chi2), p: r(a.ZERO_ORDER_TEST.p, 4), V: r(a.ZERO_ORDER_TEST.cramersV), rowPct: a.rowPct(a.ZERO_ORDER).map((x) => x.map((v) => r(v, 1))) },
  partialNonFinale: { table: a.PARTIAL_NON_FINALE, p: r(a.PARTIAL_NON_FINALE_TEST.p, 4), V: r(a.PARTIAL_NON_FINALE_TEST.cramersV), rowPct: a.rowPct(a.PARTIAL_NON_FINALE).map((x) => x.map((v) => r(v, 1))) },
  partialFinale: { table: a.PARTIAL_FINALE, rowPct: a.rowPct(a.PARTIAL_FINALE).map((x) => x.map((v) => r(v, 1))) },
  earlyLateByFinale: a.EARLY_LATE_BY_FINALE,
  runtimeViolence: { r: r(a.RUNTIME_VIOLENCE.r), p: r(a.RUNTIME_VIOLENCE.p, 4), rho: r(a.RUNTIME_VIOLENCE.rho) },
  runtimeFuck: { r: r(a.RUNTIME_FUCK.r), p: r(a.RUNTIME_FUCK.p, 4), rho: r(a.RUNTIME_FUCK.rho), pRho: r(a.RUNTIME_FUCK.pRho, 4) },
  orderViolence: { r: r(a.ORDER_VIOLENCE.r), p: r(a.ORDER_VIOLENCE.p, 4), seasonMeans: a.SEASON_MEANS.map((m) => r(m, 2)) },
  oneSample: { m: r(a.ONE_SAMPLE.m, 2), t: r(a.ONE_SAMPLE.t), df: a.ONE_SAMPLE.df, p: a.ONE_SAMPLE.p },
  independent: {
    groups: a.THERAPY_GROUPS.map((g) => ({ n: g.n, m: r(g.m, 3), s: r(g.s, 3) })),
    equal: { t: r(a.THERAPY_T.equal.t), df: a.THERAPY_T.equal.df, p: r(a.THERAPY_T.equal.p, 4) },
    welch: { t: r(a.THERAPY_T.welch.t), df: r(a.THERAPY_T.welch.df, 2), p: r(a.THERAPY_T.welch.p, 4) },
    levene: { F: r(a.THERAPY_LEVENE.f), p: r(a.THERAPY_LEVENE.p) },
    hedgesG: r(a.THERAPY_G),
  },
  paired: { crime: r(a.PAIRED.crime, 2), family: r(a.PAIRED.family, 2), t: r(a.PAIRED.t), p: a.PAIRED.p },
};
console.log(JSON.stringify(out, null, 1));
