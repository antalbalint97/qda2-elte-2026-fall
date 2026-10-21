"""Independent reference values (SciPy) for the app's statistics code.

Writes tests/unit/fixtures/reference.json, which tests/unit/stats.test.ts compares against
src/lib/stats.ts and the module data. Inputs are written into the fixture too, and the tests check
that the app's own teaching data still equals them, so a change on either side is noticed.

    python3 scripts/validation/reference.py      # needs numpy + scipy
"""

import json
from pathlib import Path

import numpy as np
from scipy import stats

out: dict = {"generator": f"scipy {__import__('scipy').__version__}, numpy {np.__version__}"}

# Distribution functions on a grid -------------------------------------------------------------
out["normalCdf"] = [[x, stats.norm.cdf(x)] for x in [-4, -2.5, -1.96, -1, -0.3, 0, 0.5, 1.645, 1.96, 3, 5]]
t_grid = []
for df in [1, 2, 5, 8, 10, 24, 30, 99, 199, 961.4, 1049, 1198]:
    for t in [0, 0.5, 1, 1.5, 1.96, 2.06, 2.5, 3.12, 4, 6.48, 8]:
        t_grid.append([t, df, stats.t.cdf(t, df), 2 * stats.t.sf(abs(t), df)])
out["t"] = t_grid
out["tCritical"] = [[df, a, stats.t.ppf(1 - a / 2, df)] for df in [5, 10, 24, 30, 100, 1000] for a in [0.05, 0.1, 0.01]]
out["chiSquareP"] = [[x, df, stats.chi2.sf(x, df)] for df in [1, 2, 3, 4, 6, 10] for x in [0.1, 1, 2.5, 3.84, 5.99, 10, 25, 60]]
out["fP"] = [[f, d1, d2, stats.f.sf(f, d1, d2)] for (d1, d2) in [(1, 10), (1, 1198), (2, 8), (3, 40), (4, 120)] for f in [0.2, 0.67, 1, 2.5, 4, 8.32, 20]]

# Crosstab tests (chi-square without continuity correction, as SPSS "Pearson Chi-Square") ------
tables = {
    "crosstabs_age_language": [[312, 188], [270, 330], [120, 380]],
    "advanced_residuals": [[42, 18], [31, 29], [20, 40]],
    "advanced_pairwise_18_29_vs_60plus": [[55, 45], [18, 82]],
    "advanced_pairwise_30_39_vs_40_49": [[40, 60], [42, 58]],
    "three_by_three": [[20, 30, 50], [35, 35, 30], [50, 25, 25]],
}
ct = {}
for name, tab in tables.items():
    a = np.array(tab, dtype=float)
    chi2, p, df, exp = stats.chi2_contingency(a, correction=False)
    n = a.sum()
    v = np.sqrt(chi2 / (n * (min(a.shape) - 1)))
    rt, cl = a.sum(1, keepdims=True), a.sum(0, keepdims=True)
    asr = (a - exp) / np.sqrt(exp * (1 - rt / n) * (1 - cl / n))
    ct[name] = dict(table=tab, chi2=chi2, df=int(df), p=p, cramersV=v, expected=exp.tolist(), asr=asr.tolist())
out["crosstabs"] = ct

# Correlation ----------------------------------------------------------------------------------
x = [1, 2, 2, 3, 4, 5, 5, 5, 7, 9, 10, 12]
y = [2.1, 2.0, 3.5, 3.9, 3.0, 6.2, 5.5, 5.5, 8.8, 7.1, 12.4, 11.0]
pr = stats.pearsonr(x, y)
sr = stats.spearmanr(x, y)
out["correlation"] = dict(x=x, y=y, pearson=pr.statistic, pearsonP=pr.pvalue, spearman=sr.statistic, ranksX=stats.rankdata(x).tolist())

# t-tests, Levene, effect size, skewness ------------------------------------------------------
a = [6, 7, 5, 8, 7, 9, 6, 7, 8, 5, 7, 6]
b = [5, 4, 6, 5, 3, 6, 4, 5, 7, 2]
eq = stats.ttest_ind(a, b, equal_var=True)
we = stats.ttest_ind(a, b, equal_var=False)
va, vb = np.var(a, ddof=1), np.var(b, ddof=1)
na, nb = len(a), len(b)
welch_df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1))
lev = stats.levene(a, b, center="mean")
sp = np.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2))
d = (np.mean(a) - np.mean(b)) / sp
one = stats.ttest_1samp(a, 6)
pre = [12, 15, 11, 14, 13, 16, 12, 15]
post = [14, 15, 13, 17, 13, 18, 15, 16]
paired = stats.ttest_rel(pre, post)
out["ttests"] = dict(
    a=a, b=b, mu0=6, pre=pre, post=post,
    equal=dict(t=eq.statistic, df=na + nb - 2, p=eq.pvalue),
    welch=dict(t=we.statistic, df=welch_df, p=we.pvalue),
    levene=dict(f=lev.statistic, p=lev.pvalue),
    cohenD=d, hedgesG=d * (1 - 3 / (4 * (na + nb) - 9)),
    oneSample=dict(t=one.statistic, df=na - 1, p=one.pvalue),
    paired=dict(t=paired.statistic, df=len(pre) - 1, p=paired.pvalue),
    skewnessA=stats.skew(a, bias=False), sdA=np.std(a, ddof=1), medianB=float(np.median(b)),
)

# ANOVA: the 11 observations of the ANOVA lab ----------------------------------------------------
groups = [[45, 61, 53, 73], [20, 14, 17], [22, 32, 26, 21]]
allv = np.concatenate([np.array(g, float) for g in groups])
grand = allv.mean()
ssb = sum(len(g) * (np.mean(g) - grand) ** 2 for g in groups)
ssw = sum(((np.array(g) - np.mean(g)) ** 2).sum() for g in groups)
sst = ((allv - grand) ** 2).sum()
fo = stats.f_oneway(*groups)
out["anova"] = dict(groups=groups, ssb=ssb, ssw=ssw, sst=sst, dfb=2, dfw=8, f=fo.statistic, p=fo.pvalue, eta2=ssb / sst)

# Overlap of two unit normals separated by d (Effect size module) -----------------------------
out["overlap"] = [[dd, 2 * stats.norm.cdf(-dd / 2)] for dd in [0, 0.2, 0.5, 0.8, 1.5]]

# 09 Building an Index: synthetic 1-5 answers of 120 respondents (scripts/indices/generate.py) -------
import re  # noqa: E402

src = (Path(__file__).resolve().parents[2] / "src/components/modules/indices/responses.ts").read_text()
resp = np.array(json.loads(re.search(r"= (\[.*\]);", src).group(1)), dtype=float)


def cronbach(m):
    # covariance form, independent of the app's variance form: k/(k-1) * (1 - trace(C) / sum(C))
    c = np.cov(m, rowvar=False, ddof=1)
    k = m.shape[1]
    return k / (k - 1) * (1 - np.trace(c) / c.sum())


def reliability(m):
    tot = m.sum(1)
    rows = []
    for j in range(m.shape[1]):
        rest = tot - m[:, j]
        rows.append(dict(
            scaleMean=rest.mean(), scaleVar=rest.var(ddof=1),
            itemTotal=stats.pearsonr(m[:, j], rest).statistic,
            alphaIfDeleted=cronbach(np.delete(m, j, 1)) if m.shape[1] > 2 else None,
        ))
    return dict(alpha=cronbach(m), items=rows)


rev = resp.copy()
rev[:, [2, 4]] = 6 - rev[:, [2, 4]]
forgot = resp.copy()
forgot[:, 2] = 6 - forgot[:, 2]
subsets = []
for mask in range(1, 64):
    cols = [j for j in range(6) if mask >> j & 1]
    if len(cols) >= 2:
        subsets.append([[bool(mask >> j & 1) for j in range(6)], cronbach(rev[:, cols])])
idx = np.round(rev[:, :5].mean(1), 2)
out["index"] = dict(
    responses=resp.astype(int).tolist(),
    raw=reliability(resp), six=reliability(rev), five=reliability(rev[:, :5]), forgotT5=reliability(forgot),
    subsets=subsets,
    indexScores=idx.tolist(), indexMean=idx.mean(),
)


def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return float(o)
    if isinstance(o, np.integer):
        return int(o)
    return o


path = Path(__file__).resolve().parents[2] / "tests/unit/fixtures/reference.json"
path.write_text(json.dumps(clean(out), indent=1) + "\n")
print(f"wrote {path}")
