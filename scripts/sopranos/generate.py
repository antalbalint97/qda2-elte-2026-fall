"""Generates the synthetic Sopranos teaching dataset used by /bonus/sopranos.

Every value is synthetic. The generator is seeded and deterministic: it draws a plausible
episode-level dataset and then nudges the integer counts (hill climbing) until the teaching
targets hold, so that the statistics quoted in the exercises are actually computed from the data.

Run:  python3 scripts/sopranos/generate.py      (writes src/content/sopranos/dataset.ts)
Then: python3 scripts/sopranos/verify.py        (independent check with scipy)
"""

from pathlib import Path

import numpy as np
from scipy import stats

SEED = 1999
rng = np.random.default_rng(SEED)

SEASON_SIZES = [13, 13, 13, 12, 12, 11]  # 74 synthetic episodes (not the real episode structure)
N = sum(SEASON_SIZES)

season = np.repeat(np.arange(1, 7), SEASON_SIZES)
episode_number = np.concatenate([np.arange(1, k + 1) for k in SEASON_SIZES])
order = np.arange(1, N + 1)
early_late = (season >= 4).astype(int)
finale = np.zeros(N, int)
finale[np.cumsum(SEASON_SIZES) - 1] = 1

# ---------------- major_violence: 16/39 early, 24/35 late (p ≈ .018) ----------------
# Finales: 2 of 3 early, 3 of 3 late. Non-finales get the rest.
major = np.zeros(N, int)
for el, total in [(0, 16), (1, 24)]:
    fin_idx = np.where((early_late == el) & (finale == 1))[0]
    non_idx = np.where((early_late == el) & (finale == 0))[0]
    k_fin = 2 if el == 0 else 3
    major[fin_idx[:k_fin]] = 1
    major[rng.choice(non_idx, total - k_fin, replace=False)] = 1

# ---------------- runtime, therapy ----------------
runtime = np.clip(np.round(rng.normal(55, 4.3, N) + 2.5 * finale), 46, 70).astype(int)
tony = np.ones(N, int)
tony[rng.choice(N, 2, replace=False)] = 0
# Therapy scenes need Tony on screen in this synthetic coding scheme.
therapy = ((rng.random(N) < np.where(season <= 3, 0.5, 0.33)) & (tony == 1)).astype(int)

# ---------------- violence_event_count: hill climbing towards the targets ----------------
u = ((order - 37.5) / 36.5) ** 2  # U-shape over the series
lam = np.clip(1.4 + 2.6 * u + 0.12 * (runtime - 55) - 0.7 * therapy + 0.8 * major, 0.3, None)
viol = rng.poisson(lam)
viol = np.maximum(viol, major)  # major violence implies at least one violent event


def loss(v):
    mt = v[therapy == 1].mean()
    mn = v[therapy == 0].mean()
    r_rt = np.corrcoef(runtime, v)[0, 1]
    r_ord = np.corrcoef(order, v)[0, 1]
    r_u = np.corrcoef(u, v)[0, 1]
    sm = [v[season == s].mean() for s in range(1, 7)]
    lev = stats.levene(v[therapy == 1], v[therapy == 0], center="mean").pvalue
    skew = stats.skew(v)
    pen = 0.0
    pen += 400 * (mt - 2.10) ** 2 + 400 * (mn - 3.00) ** 2
    pen += 300 * (r_rt - 0.34) ** 2
    pen += 300 * r_ord**2
    pen += 50 * max(0, 0.5 - r_u) ** 2
    pen += 20 * max(0, sm[3] - sm[0] + 0.8) ** 2 + 20 * max(0, sm[3] - sm[5] + 0.8) ** 2
    pen += 5 * max(0, 0.3 - lev) ** 2
    p_t = stats.ttest_ind(v[therapy == 1], v[therapy == 0]).pvalue
    pen += 2000 * (p_t - 0.031) ** 2
    pen += 5 * max(0, 0.9 - skew) ** 2
    pen += 2 * max(0, v.max() - 9) ** 2
    return pen


best = loss(viol)
for it in range(120000):
    i = rng.integers(N)
    step = rng.choice([-1, 1])
    cand = viol.copy()
    cand[i] += step
    if cand[i] < major[i] or cand[i] < 0:
        continue
    lc = loss(cand)
    if lc < best:
        viol, best = cand, lc
    if best < 1e-4:
        break

# ---------------- remaining variables ----------------
death = np.where(major == 1, rng.choice([0, 1, 1, 1, 2, 2, 3, 4], N), 0)
death = np.minimum(death, viol)
death_present = (death > 0).astype(int)
violence_present = (viol > 0).astype(int)
therapy_count = np.where(therapy == 1, rng.choice([1, 1, 1, 2, 2, 3], N), 0)
dinner = (rng.random(N) < 0.35).astype(int)
food = np.maximum(rng.poisson(2.2, N), dinner)
threat = rng.poisson(1.5 + 0.6 * viol)
chars = rng.integers(6, 13, N)
locs = np.clip(np.round(rng.normal(9, 2.2, N)), 4, 16).astype(int)
tone = np.where(viol + rng.normal(0, 1.4, N) < 2, 1, np.where(viol + rng.normal(0, 1.4, N) < 4, 2, 3))
rating = np.clip(np.round(rng.normal(8.4, 0.35, N) + 0.5 * finale + 0.05 * viol, 1), 7.4, 9.7)
fam_conf = rng.poisson(2.6, N)
crime_conf = np.maximum(0, np.round(fam_conf * 0.5 + rng.poisson(1.9, N) + 0.2 * viol)).astype(int)

# fuck_count: right-skewed, with two very long, very sweary outliers that inflate Pearson's r.
fc = np.round(rng.gamma(2.2, 6.0, N) + 0.15 * (runtime - 55)).astype(int)
fc = np.clip(fc, 0, None)
long_eps = np.argsort(runtime)[-2:]
fc[long_eps] = [74, 88]

# ---------------- write the TypeScript module ----------------
cols = [
    ("episode_id", None),
    ("season", season),
    ("episode_number", episode_number),
    ("runtime_minutes", runtime),
    ("episode_rating", rating),
    ("tony_present", tony),
    ("therapy_scene", therapy),
    ("family_dinner_scene", dinner),
    ("violence_present", violence_present),
    ("major_violence", major),
    ("death_present", death_present),
    ("death_count", death),
    ("violence_event_count", viol),
    ("fuck_count", fc),
    ("threat_count", threat),
    ("food_scene_count", food),
    ("therapy_scene_count", therapy_count),
    ("family_conflict_count", fam_conf),
    ("crime_conflict_count", crime_conf),
    ("number_major_characters", chars),
    ("number_locations", locs),
    ("episode_tone", tone),
    ("finale_episode", finale),
    ("early_late", early_late),
]

lines = []
for i in range(N):
    parts = []
    for name, arr in cols:
        if name == "episode_id":
            parts.append(f'episode_id: "S{season[i]}E{episode_number[i]:02d}"')
        elif name == "episode_rating":
            parts.append(f"{name}: {float(arr[i]):.1f}")
        else:
            parts.append(f"{name}: {int(arr[i])}")
    lines.append("  { " + ", ".join(parts) + " },")

out = Path(__file__).resolve().parents[2] / "src/content/sopranos/dataset.ts"
out.parent.mkdir(parents=True, exist_ok=True)
header = '''// GENERATED by scripts/sopranos/generate.py (seed {seed}). Do not edit by hand.
//
// Synthetic teaching dataset inspired by The Sopranos. Values are created for statistical
// practice and are not factual episode statistics. Episode ids are generic labels (S1E01, ...)
// and do not correspond to real episodes; the number of episodes per season is also synthetic.

export interface Episode {{
{fields}
}}

export const EPISODES: Episode[] = [
'''.format(
    seed=SEED,
    fields="\n".join(
        f"  {n}: {'string' if n == 'episode_id' else 'number'};" for n, _ in cols
    ),
)
out.write_text(header + "\n".join(lines) + "\n];\n")

print("loss", round(best, 6))
print("therapy n", therapy.sum(), "means", viol[therapy == 1].mean().round(3), viol[therapy == 0].mean().round(3))
print("r runtime-viol", round(np.corrcoef(runtime, viol)[0, 1], 3))
print("r order-viol", round(np.corrcoef(order, viol)[0, 1], 3))
print("season means", [round(viol[season == s].mean(), 2) for s in range(1, 7)])
print("levene", round(stats.levene(viol[therapy == 1], viol[therapy == 0], center="mean").pvalue, 3))
print("skew", round(stats.skew(viol), 2))
print("wrote", out)
