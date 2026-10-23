"""Reference values for the Linear Algebra & PCA Studio (tests/unit/pca-studio.test.ts).

Reads tests/unit/fixtures/pca-studio-samples.json (scripts/validation/pca_studio_samples.ts) and writes
tests/unit/fixtures/pca-studio-reference.json:
  * numpy.linalg.eigh of the covariance and correlation matrices of each probe cloud and item matrix;
  * scikit-learn PCA on the standardised (ddof = 1) items: explained variance, ratio, |components|;
  * one-factor principal-axis factoring: an independent numpy implementation (SMC start, iterated to 1e-12) and
    factor_analyzer's MINRES (unrotated), which converges to the same least-squares solution;
  * scikit-learn KMeans (Lloyd, n_init = 1) started from the lab's seeded centroids: inertia and labels.
Run: python3 -I scripts/validation/pca_studio_reference.py   (factor_analyzer must be importable)
"""
import json
import pathlib

import numpy as np
from factor_analyzer import FactorAnalyzer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

root = pathlib.Path(__file__).resolve().parents[2]
S = json.loads((root / "tests/unit/fixtures/pca-studio-samples.json").read_text())


def eig(M):
    w, v = np.linalg.eigh(M)
    o = np.argsort(w)[::-1]
    return w[o].tolist(), np.abs(v[:, o]).T.tolist()


def paf_numpy(R, nf, tol=1e-12, max_it=10000):
    h = 1 - 1 / np.diag(np.linalg.inv(R))
    for _ in range(max_it):
        Rr = R.copy()
        np.fill_diagonal(Rr, h)
        w, v = np.linalg.eigh(Rr)
        o = np.argsort(w)[::-1][:nf]
        L = v[:, o] * np.sqrt(np.maximum(w[o], 0))
        hn = (L**2).sum(1)
        if np.max(np.abs(hn - h)) < tol:
            h = hn
            break
        h = hn
    return h


out = {"clouds": {}, "items": {}, "kmeans": {}}
for c in S["clouds"]:
    X = np.column_stack([c["xs"], c["ys"]])
    out["clouds"][c["id"]] = {
        "cov": eig(np.cov(X, rowvar=False)),
        "corr": eig(np.corrcoef(X, rowvar=False)),
    }
for it in S["items"]:
    X = np.column_stack(it["cols"]).astype(float)
    R = np.corrcoef(X, rowvar=False)
    Z = (X - X.mean(0)) / X.std(0, ddof=1)
    sk = PCA().fit(Z)
    fa = FactorAnalyzer(n_factors=1, rotation=None, method="minres").fit(X)
    out["items"][it["id"]] = {
        "corr": eig(R),
        "cov": eig(np.cov(X, rowvar=False)),
        "skExplained": sk.explained_variance_.tolist(),
        "skRatio": sk.explained_variance_ratio_.tolist(),
        "skAbsComponents": np.abs(sk.components_).tolist(),
        "pafComm1": paf_numpy(R, 1).tolist(),
        "minresComm1": fa.get_communalities().tolist(),
        "minresAbsLoad1": np.abs(fa.loadings_[:, 0]).tolist(),
    }
for k in S["kmeans"]:
    P = np.array(k["points"])
    km = KMeans(n_clusters=k["k"], init=np.array(k["init"]), n_init=1, algorithm="lloyd", max_iter=300, tol=0).fit(P)
    out["kmeans"][k["id"]] = {"inertia": float(km.inertia_), "labels": km.labels_.tolist(), "centers": km.cluster_centers_.tolist()}

(root / "tests/unit/fixtures/pca-studio-reference.json").write_text(json.dumps(out) + "\n")
print("wrote", len(out["clouds"]), len(out["items"]), len(out["kmeans"]))
