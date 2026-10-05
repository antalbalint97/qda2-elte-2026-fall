"""Independent check (scipy) of every statistic quoted in /bonus/sopranos.

Reads the generated dataset.ts, recomputes the statistics with scipy, and prints them.
scripts/sopranos/verify-app.mjs runs the app's own computations; both must agree.
"""

import json
import re
from pathlib import Path

import numpy as np
from scipy import stats

src = (Path(__file__).resolve().parents[2] / "src/content/sopranos/dataset.ts").read_text()
rows = []
for line in src.splitlines():
    if line.strip().startswith("{ episode_id"):
        js = re.sub(r"(\w+):", r'"\1":', line.strip().rstrip(","))
        rows.append(json.loads(js))
d = {k: np.array([r[k] for r in rows]) for k in rows[0] if k != "episode_id"}
N = len(rows)
out = {"N": N}


def desc(v):
    return dict(
        n=len(v), mean=round(v.mean(), 2), median=float(np.median(v)), min=int(v.min()) if v.dtype.kind == "i" else float(v.min()),
        max=int(v.max()) if v.dtype.kind == "i" else float(v.max()), sd=round(v.std(ddof=1), 2), skew=round(stats.skew(v, bias=False), 2),
    )


for v in ["death_count", "violence_event_count", "fuck_count", "runtime_minutes"]:
    out[v] = desc(d[v])

# Crosstab early_late x major_violence
t = np.array([[((d["early_late"] == i) & (d["major_violence"] == j)).sum() for j in (0, 1)] for i in (0, 1)])
chi2, p, df, exp = stats.chi2_contingency(t, correction=False)
out["crosstab"] = dict(table=t.tolist(), chi2=round(chi2, 3), df=df, p=round(p, 4), V=round(np.sqrt(chi2 / N), 3),
                       row_pct=(t / t.sum(1, keepdims=True) * 100).round(1).tolist(),
                       col_pct=(t / t.sum(0, keepdims=True) * 100).round(1).tolist(), min_expected=round(exp.min(), 2))
for f in (0, 1):
    m = d["finale_episode"] == f
    tt = np.array([[((d["early_late"][m] == i) & (d["major_violence"][m] == j)).sum() for j in (0, 1)] for i in (0, 1)])
    entry = dict(table=tt.tolist(), row_pct=(tt / tt.sum(1, keepdims=True) * 100).round(1).tolist())
    if f == 0:
        c2, pp, _, _ = stats.chi2_contingency(tt, correction=False)
        entry.update(chi2=round(c2, 3), p=round(pp, 4), V=round(np.sqrt(c2 / tt.sum()), 3))
    out[f"partial_finale_{f}"] = entry
t_fin = np.array([[((d["early_late"] == i) & (d["finale_episode"] == j)).sum() for j in (0, 1)] for i in (0, 1)])
out["early_late_x_finale"] = t_fin.tolist()

# Correlations
r, p = stats.pearsonr(d["runtime_minutes"], d["violence_event_count"])
out["runtime_violence"] = dict(r=round(r, 3), p=round(p, 4), rho=round(stats.spearmanr(d["runtime_minutes"], d["violence_event_count"])[0], 3))
r, p = stats.pearsonr(d["runtime_minutes"], d["fuck_count"])
rho, prho = stats.spearmanr(d["runtime_minutes"], d["fuck_count"])
out["runtime_fuck"] = dict(r=round(r, 3), p=round(p, 4), rho=round(rho, 3), p_rho=round(prho, 4))
order = np.arange(1, N + 1)
r, p = stats.pearsonr(order, d["violence_event_count"])
out["order_violence"] = dict(r=round(r, 3), p=round(p, 4),
                             season_means=[round(d["violence_event_count"][d["season"] == s].mean(), 2) for s in range(1, 7)])

# t-tests
res = stats.ttest_1samp(d["runtime_minutes"], 50)
out["one_sample"] = dict(t=round(res.statistic, 3), df=N - 1, p=res.pvalue, mean=round(d["runtime_minutes"].mean(), 2),
                         diff=round(d["runtime_minutes"].mean() - 50, 2))
a = d["violence_event_count"][d["therapy_scene"] == 1]
b = d["violence_event_count"][d["therapy_scene"] == 0]
eq = stats.ttest_ind(a, b, equal_var=True)
neq = stats.ttest_ind(a, b, equal_var=False)
lev = stats.levene(a, b, center="mean")
sp = np.sqrt(((len(a) - 1) * a.var(ddof=1) + (len(b) - 1) * b.var(ddof=1)) / (len(a) + len(b) - 2))
dd = (a.mean() - b.mean()) / sp
J = 1 - 3 / (4 * (len(a) + len(b)) - 9)
out["independent"] = dict(n=[len(a), len(b)], mean=[round(a.mean(), 3), round(b.mean(), 3)], sd=[round(a.std(ddof=1), 3), round(b.std(ddof=1), 3)],
                          t_eq=round(eq.statistic, 3), p_eq=round(eq.pvalue, 4), t_neq=round(neq.statistic, 3), p_neq=round(neq.pvalue, 4),
                          levene_F=round(lev.statistic, 3), levene_p=round(lev.pvalue, 3), cohen_d=round(dd, 3), hedges_g=round(dd * J, 3))
res = stats.ttest_rel(d["crime_conflict_count"], d["family_conflict_count"])
out["paired"] = dict(t=round(res.statistic, 3), p=round(res.pvalue, 4), crime=round(d["crime_conflict_count"].mean(), 2),
                     family=round(d["family_conflict_count"].mean(), 2))

# Internal consistency of the synthetic coding scheme
assert ((d["major_violence"] == 1) <= (d["violence_event_count"] >= 1)).all()
assert ((d["death_present"] == 1) == (d["death_count"] > 0)).all()
assert ((d["death_count"] > 0) <= (d["major_violence"] == 1)).all()
assert ((d["violence_present"] == 1) == (d["violence_event_count"] > 0)).all()
assert ((d["therapy_scene"] == 1) == (d["therapy_scene_count"] > 0)).all()
assert ((d["therapy_scene"] == 1) <= (d["tony_present"] == 1)).all()
assert ((d["early_late"] == 1) == (d["season"] >= 4)).all()
assert d["finale_episode"].sum() == 6

print(json.dumps(out, indent=1, default=float))

# ---------------- Compare with the app's own computations ----------------
import subprocess

app = json.loads(subprocess.run(["node", "--no-warnings", str(Path(__file__).with_name("verify-app.mjs"))], capture_output=True, text=True, check=True).stdout)
checks = [
    ("chi2", out["crosstab"]["chi2"], app["crosstab"]["chi2"]),
    ("chi2 p", out["crosstab"]["p"], app["crosstab"]["p"]),
    ("Cramer's V", out["crosstab"]["V"], app["crosstab"]["V"]),
    ("partial non-finale p", out["partial_finale_0"]["p"], app["partialNonFinale"]["p"]),
    ("r runtime-violence", out["runtime_violence"]["r"], app["runtimeViolence"]["r"]),
    ("p runtime-violence", out["runtime_violence"]["p"], app["runtimeViolence"]["p"]),
    ("rho runtime-violence", out["runtime_violence"]["rho"], app["runtimeViolence"]["rho"]),
    ("r runtime-fuck", out["runtime_fuck"]["r"], app["runtimeFuck"]["r"]),
    ("rho runtime-fuck", out["runtime_fuck"]["rho"], app["runtimeFuck"]["rho"]),
    ("r order-violence", out["order_violence"]["r"], app["orderViolence"]["r"]),
    ("one-sample t", out["one_sample"]["t"], app["oneSample"]["t"]),
    ("t equal", out["independent"]["t_eq"], app["independent"]["equal"]["t"]),
    ("p equal", out["independent"]["p_eq"], app["independent"]["equal"]["p"]),
    ("t welch", out["independent"]["t_neq"], app["independent"]["welch"]["t"]),
    ("p welch", out["independent"]["p_neq"], app["independent"]["welch"]["p"]),
    ("Levene F", out["independent"]["levene_F"], app["independent"]["levene"]["F"]),
    ("Levene p", out["independent"]["levene_p"], app["independent"]["levene"]["p"]),
    ("Hedges g", out["independent"]["hedges_g"], app["independent"]["hedgesG"]),
    ("paired t", out["paired"]["t"], app["paired"]["t"]),
]
for v in ["death_count", "violence_event_count", "fuck_count", "runtime_minutes"]:
    for k in ["mean", "median", "sd", "skew", "min", "max"]:
        checks.append((f"{v} {k}", out[v][k], app["descriptives"][v][k]))
bad = [(n, a, b) for n, a, b in checks if abs(a - b) > 0.0015]
print(f"\napp vs scipy: {len(checks) - len(bad)}/{len(checks)} statistics agree")
for n, a, b in bad:
    print("MISMATCH", n, "scipy", a, "app", b)
assert not bad
