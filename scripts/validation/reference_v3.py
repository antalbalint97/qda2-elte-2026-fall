"""Reference values (SciPy, statsmodels, scikit-learn) for the V3 engine in src/lib/engine/*.

Writes tests/unit/fixtures/reference-v3.json, compared by tests/unit/engine.test.ts. Every value is computed
by a library implementation that is independent of the TypeScript code under test. Run through
`npm run validate:reference` (reference.py calls this file) or directly:

    python3 scripts/validation/reference_v3.py      # needs numpy, scipy, statsmodels, scikit-learn
"""

import json
from pathlib import Path

import numpy as np
import scipy
import sklearn
import statsmodels
import statsmodels.api as sm
from scipy import stats
from sklearn.decomposition import PCA
from statsmodels.formula.api import ols as smf_ols
from statsmodels.stats.anova import anova_lm
from statsmodels.stats.oneway import anova_oneway
from statsmodels.stats.outliers_influence import OLSInfluence, variance_inflation_factor
import pandas as pd

out: dict = {"generator": f"scipy {scipy.__version__}, numpy {np.__version__}, statsmodels {statsmodels.__version__}, scikit-learn {sklearn.__version__}"}

# ── distributions ─────────────────────────────────────────────────────────────
out["ptukey"] = [[q, k, df, float(stats.studentized_range.cdf(q, k, df))] for k in [2, 3, 4, 6] for df in [5, 12, 30, 120] for q in [0.5, 1.5, 2.5, 3.5, 4.5, 6.0]]
out["qtukey"] = [[p, k, df, float(stats.studentized_range.ppf(p, k, df))] for p in [0.9, 0.95, 0.99] for k in [3, 5] for df in [8, 20, 60]]
out["nct"] = [[t, df, ncp, float(stats.nct.cdf(t, df, ncp))] for df in [3, 10, 38, 100] for ncp in [-1.5, 0.5, 1, 2.5, 4] for t in [-2, -0.5, 0.5, 1.7, 2.6, 4]]


def power_t(d, n, alpha, kind):
    df = 2 * n - 2 if kind == "two" else n - 1
    ncp = d * np.sqrt(n / 2) if kind == "two" else d * np.sqrt(n)
    crit = stats.t.ppf(1 - alpha / 2, df)
    return float(stats.nct.sf(crit, df, ncp) + stats.nct.cdf(-crit, df, ncp))


out["power"] = [[d, n, a, kind, power_t(d, n, a, kind)] for d in [0.2, 0.5, 0.8] for n in [10, 20, 64] for a in [0.05, 0.01] for kind in ["one", "two"]]
out["quantiles"] = dict(
    chi2=[[p, k, float(stats.chi2.ppf(p, k))] for p in [0.05, 0.5, 0.95, 0.99] for k in [1, 3, 10]],
    f=[[p, d1, d2, float(stats.f.ppf(p, d1, d2))] for p in [0.5, 0.95] for (d1, d2) in [(1, 10), (3, 40), (5, 5)]],
    t=[[p, df, float(stats.t.ppf(p, df))] for p in [0.01, 0.2, 0.975] for df in [2, 9, 50]],
    norm=[[p, float(stats.norm.ppf(p))] for p in [0.001, 0.025, 0.3, 0.5, 0.9, 0.999]],
)
out["discrete"] = dict(
    binom=[[k, n, p, float(stats.binom.pmf(k, n, p)), float(stats.binom.cdf(k, n, p))] for (k, n, p) in [(0, 5, 0.3), (2, 10, 0.5), (7, 20, 0.35), (30, 40, 0.8)]],
    pois=[[k, lam, float(stats.poisson.pmf(k, lam)), float(stats.poisson.cdf(k, lam))] for (k, lam) in [(0, 0.5), (3, 2.0), (12, 9.5)]],
)

# ── descriptives ──────────────────────────────────────────────────────────────
xs = [3.1, 4.7, 2.2, 8.9, 5.5, 5.5, 1.0, 7.3, 6.6, 12.4, 4.1]
out["descriptives"] = dict(
    x=xs,
    q=[[p, float(np.quantile(xs, p))] for p in [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]],
    skewG1=float(stats.skew(xs, bias=False)), skewg1=float(stats.skew(xs, bias=True)), kurtosis=float(stats.kurtosis(xs, bias=True)),
)

# ── categorical ───────────────────────────────────────────────────────────────
tabs = {"t22": [[12, 5], [3, 10]], "t23": [[20, 15, 5], [10, 25, 25]], "t33": [[30, 10, 5], [12, 25, 8], [4, 9, 31]]}
cat = {}
for name, tab in tabs.items():
    a = np.array(tab, float)
    chi2, p, df, exp = stats.chi2_contingency(a, correction=False)
    entry = dict(table=tab, chi2=float(chi2), p=float(p), df=int(df), V=float(np.sqrt(chi2 / (a.sum() * (min(a.shape) - 1)))))
    if a.shape == (2, 2):
        y, py, _, _ = stats.chi2_contingency(a, correction=True)
        entry.update(yates=float(y), yatesP=float(py), fisherP=float(stats.fisher_exact(a).pvalue))
        o = a[0, 0] * a[1, 1] / (a[0, 1] * a[1, 0])
        se = np.sqrt((1 / a).sum())
        entry.update(oddsRatio=float(o), orCI=[float(o * np.exp(-stats.norm.ppf(0.975) * se)), float(o * np.exp(stats.norm.ppf(0.975) * se))])
    cat[name] = entry
out["categorical"] = cat

# ── correlation ───────────────────────────────────────────────────────────────
cx = [1, 3, 4, 4, 6, 7, 9, 10, 12, 15]
cy = [2.0, 2.9, 4.4, 3.8, 6.1, 5.0, 8.3, 7.7, 9.9, 9.0]
pr = stats.pearsonr(cx, cy)
ci = pr.confidence_interval(0.95)
sr = stats.spearmanr(cx, cy)
out["correlation"] = dict(x=cx, y=cy, r=float(pr.statistic), p=float(pr.pvalue), ci=[float(ci.low), float(ci.high)], rho=float(sr.statistic), rhoP=float(sr.pvalue))

# ── t-tests ───────────────────────────────────────────────────────────────────
ta = [5.1, 6.0, 7.2, 5.8, 6.6, 7.9, 6.1]
tb = [4.2, 5.0, 4.9, 6.1, 3.8, 5.5]
we = stats.ttest_ind(ta, tb, equal_var=False)
eq = stats.ttest_ind(ta, tb, equal_var=True)
out["ttests"] = dict(a=ta, b=tb, welchT=float(we.statistic), welchP=float(we.pvalue), welchCI=[float(v) for v in we.confidence_interval(0.95)], eqT=float(eq.statistic), eqP=float(eq.pvalue), eqCI=[float(v) for v in eq.confidence_interval(0.95)])

# ── ANOVA: Welch, Tukey HSD, Games–Howell, two-way ───────────────────────────
G = [[12.1, 14.3, 13.0, 15.2, 11.8], [16.0, 18.2, 17.5, 15.9, 19.1, 17.0], [13.5, 12.2, 14.8, 21.0]]
wel = anova_oneway(G, use_var="unequal", welch_correction=True)
out["welch"] = dict(groups=G, F=float(wel.statistic), df1=float(wel.df[0]), df2=float(wel.df[1]), p=float(wel.pvalue))
th = stats.tukey_hsd(*G)
thci = th.confidence_interval(0.95)
tukey = []
for i in range(3):
    for j in range(i + 1, 3):
        tukey.append(dict(i=i, j=j, p=float(th.pvalue[i, j]), lo=float(thci.low[i, j]), hi=float(thci.high[i, j])))
out["tukey"] = tukey
# Games–Howell from its definition with SciPy's studentised range (independent of the app's ptukey port)
gh = []
for i in range(3):
    for j in range(i + 1, 3):
        gi, gj = np.array(G[i]), np.array(G[j])
        vi, vj = gi.var(ddof=1) / len(gi), gj.var(ddof=1) / len(gj)
        se = np.sqrt((vi + vj) / 2)
        df = (vi + vj) ** 2 / (vi ** 2 / (len(gi) - 1) + vj ** 2 / (len(gj) - 1))
        diff = gi.mean() - gj.mean()
        q = abs(diff) / se
        qc = stats.studentized_range.ppf(0.95, 3, df)
        gh.append(dict(i=i, j=j, q=float(q), df=float(df), p=float(stats.studentized_range.sf(q, 3, df)), lo=float(diff - qc * se), hi=float(diff + qc * se)))
out["gamesHowell"] = gh

rows = []
cells = [[[4, 5, 6], [7, 9]], [[5, 6, 6, 8], [10, 12, 11]]]
for a, ra in enumerate(cells):
    for b, cb in enumerate(ra):
        for v in cb:
            rows.append(dict(y=v, A=f"a{a}", B=f"b{b}"))
df2 = pd.DataFrame(rows)
m2 = smf_ols("y ~ C(A) * C(B)", data=df2).fit()
t1 = anova_lm(m2, typ=1)
out["twoWay"] = dict(cells=cells, ssA=float(t1.loc["C(A)", "sum_sq"]), ssB=float(t1.loc["C(B)", "sum_sq"]), ssAB=float(t1.loc["C(A):C(B)", "sum_sq"]), ssW=float(t1.loc["Residual", "sum_sq"]), FA=float(t1.loc["C(A)", "F"]), pAB=float(t1.loc["C(A):C(B)", "PR(>F)"]))

# ── OLS with diagnostics ──────────────────────────────────────────────────────
rng = np.random.default_rng(20261023)
n = 30
x1 = np.round(rng.normal(10, 3, n), 2)
x2 = np.round(0.6 * x1 + rng.normal(0, 2, n), 2)
y = np.round(3 + 1.5 * x1 - 0.8 * x2 + rng.normal(0, 2 + 0.2 * x1, n), 2)
X = sm.add_constant(np.column_stack([x1, x2]))
fit = sm.OLS(y, X).fit()
fit3 = sm.OLS(y, X).fit(cov_type="HC3")
inf = OLSInfluence(fit)
out["ols"] = dict(
    x1=x1.tolist(), x2=x2.tolist(), y=y.tolist(),
    coef=fit.params.tolist(), se=fit.bse.tolist(), seHC3=fit3.bse.tolist(), r2=float(fit.rsquared), adjR2=float(fit.rsquared_adj), F=float(fit.fvalue), Fp=float(fit.f_pvalue),
    leverage=inf.hat_matrix_diag.tolist(), cooks=inf.cooks_distance[0].tolist(), stdRes=inf.resid_studentized_internal.tolist(),
    vif=[float(variance_inflation_factor(X, j)) for j in [1, 2]],
)
wts = np.round(rng.uniform(0.5, 3, n), 2)
wfit = sm.WLS(y, X, weights=wts).fit()
out["wls"] = dict(w=wts.tolist(), coef=wfit.params.tolist(), se=wfit.bse.tolist(), r2=float(wfit.rsquared))

# ── logistic regression ───────────────────────────────────────────────────────
lx = np.round(rng.normal(0, 1.2, 60), 3)
lz = rng.integers(0, 2, 60)
pr_ = 1 / (1 + np.exp(-(-0.4 + 1.1 * lx + 0.7 * lz)))
ly = (rng.uniform(size=60) < pr_).astype(int)
lfit = sm.Logit(ly, sm.add_constant(np.column_stack([lx, lz]))).fit(disp=0, tol=1e-12, maxiter=100)
out["logit"] = dict(x=lx.tolist(), z=lz.tolist(), y=ly.tolist(), coef=lfit.params.tolist(), se=lfit.bse.tolist(), p=lfit.pvalues.tolist(), llf=float(lfit.llf), llnull=float(lfit.llnull), prsquared=float(lfit.prsquared))

# ── PCA ───────────────────────────────────────────────────────────────────────
base = rng.normal(0, 1, (40, 1))
P = np.round(np.hstack([base + rng.normal(0, 0.5, (40, 1)), 0.8 * base + rng.normal(0, 0.6, (40, 1)), rng.normal(0, 1, (40, 1)), -0.5 * base + rng.normal(0, 0.8, (40, 1))]), 3)
R = np.corrcoef(P, rowvar=False)
ev = np.sort(np.linalg.eigvalsh(R))[::-1]
Z = (P - P.mean(0)) / P.std(0, ddof=1)
sk = PCA().fit(Z)
evc = np.sort(np.linalg.eigvalsh(np.cov(P, rowvar=False)))[::-1]
out["pca"] = dict(data=P.tolist(), eigCorr=ev.tolist(), explained=sk.explained_variance_ratio_.tolist(), skEigen=sk.explained_variance_.tolist(), eigCov=evc.tolist(), absFirstLoadingVector=np.abs(sk.components_[0]).tolist())

# ── reliability (covariance form) ─────────────────────────────────────────────
items = np.array([[4, 5, 3, 4], [2, 2, 1, 3], [5, 4, 4, 5], [3, 3, 2, 2], [4, 4, 5, 4], [1, 2, 2, 1], [3, 4, 3, 3], [5, 5, 4, 4]], float)
c = np.cov(items, rowvar=False, ddof=1)
k = items.shape[1]
out["cronbach"] = dict(items=items.T.astype(int).tolist(), alpha=float(k / (k - 1) * (1 - np.trace(c) / c.sum())))

# ── VRA lab base scenario (HANDOFF §2, §4) ────────────────────────────────────
vx = [1, 2, 3, 4, 6, 3, 5, 6, 8, 9, 5, 7, 9, 11, 13]
vy = [28, 35, 31, 44, 49, 46, 52, 58, 55, 66, 60, 71, 68, 82, 88]
vg = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2]
lr = stats.linregress(vx, vy)
grp = [[v for v, g in zip(vy, vg) if g == j] for j in range(3)]
fo = stats.f_oneway(*grp)
allv = np.array(vy, float)
ssb = sum(len(g) * (np.mean(g) - allv.mean()) ** 2 for g in grp)
out["vra"] = dict(x=vx, y=vy, g=vg, slope=float(lr.slope), intercept=float(lr.intercept), r=float(lr.rvalue), sst=float(((allv - allv.mean()) ** 2).sum()), F=float(fo.statistic), p=float(fo.pvalue), ssb=float(ssb))


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


path = Path(__file__).resolve().parents[2] / "tests/unit/fixtures/reference-v3.json"
path.write_text(json.dumps(clean(out), indent=1) + "\n")
print(f"wrote {path}")
