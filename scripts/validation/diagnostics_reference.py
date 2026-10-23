"""statsmodels reference for the Model Diagnostics Studio (tests/unit/model-diagnostics.test.ts).

Reads tests/unit/fixtures/diagnostics-samples.json (scripts/validation/diagnostics_samples.ts) and writes
tests/unit/fixtures/diagnostics-reference.json: OLS coefficients and SEs, HC3 SEs (cov_type='HC3'),
OLSInfluence hat values, internally studentised residuals and Cook's distance, variance_inflation_factor,
and het_breuschpagan (Koenker's studentised LM, statsmodels' default).
Run: python3 -I scripts/validation/diagnostics_reference.py
"""
import json
import pathlib

import numpy as np
import statsmodels.api as sm
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.outliers_influence import OLSInfluence, variance_inflation_factor

root = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((root / "tests/unit/fixtures/diagnostics-samples.json").read_text())
out = {}
for c in S["cases"]:
    cols = [c["x"]] + ([c["x2"]] if c["x2"] else [])
    X = sm.add_constant(np.column_stack(cols).astype(float))
    y = np.array(c["y"], dtype=float)
    fit = sm.OLS(y, X).fit()
    hc3 = sm.OLS(y, X).fit(cov_type="HC3")
    inf = OLSInfluence(fit)
    lm, lmp, _, _ = het_breuschpagan(fit.resid, X)
    out[c["id"]] = {
        "coef": fit.params.tolist(),
        "se": fit.bse.tolist(),
        "seHC3": hc3.bse.tolist(),
        "hat": inf.hat_matrix_diag.tolist(),
        "stdRes": inf.resid_studentized_internal.tolist(),
        "cooks": inf.cooks_distance[0].tolist(),
        "r2": float(fit.rsquared),
        "vif": [variance_inflation_factor(X, j) for j in range(1, X.shape[1])] if X.shape[1] > 2 else None,
        "bp": {"lm": float(lm), "p": float(lmp)},
    }
(root / "tests/unit/fixtures/diagnostics-reference.json").write_text(json.dumps(out) + "\n")
print("wrote", len(out))
