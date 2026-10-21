# Statistical validation

All statistics shown in the interactive parts of the site are computed live in the browser by
`src/lib/stats.ts` and the module data files. This document records how they were checked, what was corrected, and
which simplifications are deliberate teaching choices rather than errors.

## 1. Method

1. **Independent reference values.** `scripts/validation/reference.py` computes the same quantities with SciPy 1.18.1 /
   NumPy 2.5.3 and writes `tests/unit/fixtures/reference.json`. The fixture also stores the inputs, and the tests check
   that the app's teaching data still equals them, so a silent change on either side fails the tests.
2. **Analytical identities.** Properties that must hold regardless of the reference software, checked across every
   slider position of the interactive demos (for example SS(total) = SS(between) + SS(within)).
3. **Static SPSS mock-ups.** Every numerical SPSS output reproduced on the pages was recomputed from its own printed
   inputs (t, df, means, SDs) to check that the printed Sig. and confidence limits are consistent.
4. **Decision logic.** For every slider combination that prints a p-value, the printed (rounded) value is checked
   against the significance decision shown next to it.

Run with `npm run test:unit` (Node's built-in test runner; 93 checks, all passing on 20 October 2026; 106 checks after module 08 was added on 21 October 2026). The bonus lab
has its own check: `python3 scripts/sopranos/verify.py` (43/43 statistics agree with SciPy).

Tolerances: distribution functions within 2 × 10⁻⁷ (normal CDF) or 10⁻⁸ (t, χ², F tails); test statistics within
10⁻¹⁰ relative. Values on screen are rounded to 2–3 decimals, so numerical error is several orders of magnitude below
what a student can see.

## 2. Library functions (`src/lib/stats.ts`)

| Function | Checked against | Result |
| --- | --- | --- |
| `normalCdf` | `scipy.stats.norm.cdf`, 11 points from −4 to 5 | pass (max error < 2e-7, the documented accuracy of the erfc approximation) |
| `tCdf`, `tTwoTailedP` | `scipy.stats.t`, 132 (t, df) pairs incl. non-integer Welch df 961.4 | pass; symmetry in t checked |
| `tCritical` | `scipy.stats.t.ppf`, α = .01/.05/.10, df 5–1000 | pass |
| `chiSquareP` | `scipy.stats.chi2.sf`, df 1–10 | pass; χ² = 0 gives p = 1 |
| `fP` | `scipy.stats.f.sf`, five (df1, df2) pairs | pass; F = 0 gives p = 1 |
| `chiSquareTest` (χ², df, p, Cramér's V, expected counts) | `scipy.stats.chi2_contingency(correction=False)` (= SPSS "Pearson Chi-Square") on five tables (2×2, 3×2, 3×3) | pass; expected counts reproduce the observed row and column totals; independence gives χ² = 0, V = 0; perfect 2×2 association gives V = 1 |
| `pearson`, `correlationP` | `scipy.stats.pearsonr` | pass; invariance under linear transformations; r = ±1 handled without division by zero; a constant variable yields `NaN` (never a misleading number) |
| `ranks`, `spearman` | `scipy.stats.rankdata`, `spearmanr` with ties | pass; average ranks for ties; invariance under monotone transformations |
| `independentT` (both SPSS rows) | `scipy.stats.ttest_ind` with `equal_var=True/False`; Welch–Satterthwaite df | pass |
| `leveneTest` | `scipy.stats.levene(center="mean")`, as SPSS | pass |
| `oneSampleT`, `pairedT` | `ttest_1samp`, `ttest_rel` | pass |
| `hedgesG` | Cohen's d × (1 − 3/(4(n₁+n₂) − 9)), as SPSS 27+ | pass |
| `skewness` | `scipy.stats.skew(bias=False)` (SPSS G1) | pass |
| `variance`, `sumOfSquares` | `numpy.var(ddof=1)`; sum of squared deviations, on the four trust groups and the books example of module 08 | pass; a constant variable gives 0 |
| `linearFit`, `ssAroundLine` | `scipy.stats.linregress` (slope, intercept, r, SE of the slope, p) on the module 08 news/knowledge data | pass; residuals sum to 0; r² equals Pearson r²; the slope t-test p equals `correlationP` |
| `formatP` | SPSS/APA conventions | ".000"-style values shown as "< .001"; three decimals; no leading zero |

## 3. Modules

| Module | What was checked | Result |
| --- | --- | --- |
| 01 Measurement levels | No computation; classification answers follow the course convention that 0–10 rating scales are treated as scale ("ordinal" accepted as defensible) | Reviewed, unchanged |
| 02 Crosstabs | Teaching table equals the SciPy fixture (χ²(2) = 150.20, p < .001, V = .306); row and column percentages sum to 100 within their denominator; expected counts reproduce the marginals; in the sample-size demo V is constant at every slider position while χ² scales linearly with N; SPSS mock prints Sig. ".000" (p ≈ 2 × 10⁻³³); Phi = V for an r × 2 table | pass |
| 03 Lazarsfeld | For all 14 examples (explorer and scenarios), each zero-order percentage lies between its two partial percentages (a marginal percentage is a weighted average of the conditional ones); partial differences fit the stated pattern (replication: within 25 % of the zero-order gap; specification: partial gaps differ by at least half the zero-order gap; explanation/interpretation: partial gaps at most 35 % of it) | pass |
| 04 p-values | Explorer: two- and one-tailed tail areas for all 81 slider positions; the α = .05 cut-off line agrees with the p-value decision at every position; sample-size demo: p falls monotonically with N; SPSS mock "t(24) = 2.06, Sig. .050" is p = .0504, correctly described on the page as not below .05; M = 64.0, SD = 9.7, n = 25 reproduces t = 2.06 | pass |
| 04 p-values, maths panel | 41 × 41 × 39 × 15 slider combinations (≈ 980,000): every printed p is unambiguous with respect to α = .05 | **found and fixed**: some combinations give p ≈ .04996, printed as ".050". A note with the unrounded value now appears in exactly that case (see §4) |
| 05 Correlation | Generator `rhoSample` reproduces its stated population ρ (n = 20,000, within ±.02) for six values; playground presets give the requested population r; slider extremes are finite; U-shape example has |r| < .2; the monotonic example has Spearman > Pearson | pass |
| 06 t-tests | Static SPSS mock-ups recomputed: t(1198) = 2.14 → .033; Welch t(961.4) = 2.08 → .038; Levene F(1, 1198) = 0.67 → .412 (consistent with the rounding of F) and 8.32 → .004; one-sample t(199) = 3.12 → .002 with 95 % CI 1.04 to 4.64; paired mean 0.42, SD 2.10, n = 1050 → t = 6.48, Sig. < .001. Effect-size overlap 2Φ(−d/2) equals the numerically integrated overlap of the two curves | pass |
| 07 ANOVA | The 11 observations match `scipy.stats.f_oneway`: SSB = 3468.16, SSW = 520.75, SST = 3988.91, F(2, 8) = 26.64, p = .00029 (printed ".000"), η² = .869. For all 25 × 17 slider positions: SST = SSB + SSW (to 10⁻¹⁰), df add up to 10, F = MSB/MSW, η² = SSB/SST, and F = (η²/df₁)/((1 − η²)/df₂). Spreading individuals scales SSW by spread² and leaves SSB unchanged | pass |
| 08 Spread, variance & error | The four trust groups (n = 20 each) all have mean 5 and median 5 and four different SDs (0.92, 2.83, 4.07, 1.75), checked against SciPy with variance, SD and skewness (G1) for the SPSS mock-up; income slider (all 91 positions): median fixed at 390, mean strictly rising; squares chart (21 values × 6 respondents): deviations sum to 0, variance = SS/(n − 1), the average square fits the chart; residual squares (101 tilt positions): SS(b) = SS residual + (b − b̂)²Σ(x − x̄)², so the least-squares line leaves the smallest area and slope 0 leaves SS total; r² = .825; error demo: over 2,000 seeded samples the SD of the fitted slopes equals the average standard error within 7 % and the slopes centre on the population slope; every slider position (29 error SDs × 20 sample sizes) prints an unambiguous p; spread patterns: equal average error SD (10) in all three patterns, residual spread ratio high/low X between 0.75 and 1.33 for constant spread, above 2 for the growing and below 0.5 for the shrinking funnel | pass |
| Go Further (optional) | Residual table: χ², p and V checked against SciPy; the adjusted standardized residual formula (O − E)/√(E(1 − rᵢ/n)(1 − cⱼ/n)) reviewed against the standard definition (reference values are in the fixture); pairwise 2×2 χ² values checked against SciPy; every slider combination of the p-value panel checked for unambiguous rounding; simulated p-value | **found and fixed**: see §4 |
| Sopranos bonus lab | `scripts/sopranos/verify.py` recomputes all 43 quoted statistics from the synthetic dataset with SciPy | 43/43 agree |

## 4. Content corrections (material changes)

1. **Go Further, "p-value: go deeper" simulation.** The simulation drew a standard normal z for each simulated study
   and compared it with the observed t, whose p-value comes from the t distribution with n − 1 df. For small n this
   undercounts extreme results (the normal has thinner tails), so the "empirical p" was systematically smaller than the
   analytical p it was meant to illustrate. Each simulated study now draws n observations and computes t with its own
   sample SD, exactly like the observed study (`simulateNullT` in `src/lib/stats.ts`). A test confirms that with 4,000
   simulated studies the empirical p agrees with the analytical p within sampling error. The teaching message is
   unchanged.
2. **p-values that round to .050.** Where a page prints only a p-value (maths panel in module 04, Go Further panel), a
   value such as .04996 was printed as ".050" without any way to tell which side of α it lies on. The page now adds:
   "Rounded to three decimals. Unrounded p ≈ .04996, which is just below α = .05." Rounding never changed a decision
   (decisions always used the unrounded p), and the SPSS mock-up deliberately keeps SPSS's own rounding, as the course
   teaches.
3. **Pairwise follow-up (Go Further).** The χ² values treat each age group's percentages as counts out of 100. This
   assumption was implicit; it is now stated under the selectors.
4. **Quick review description** said "all six modules"; it now says "the first six modules", since the ANOVA lab has its
   own mastery check and no quick-review questions.

No other wording, curriculum content or conventions were changed.

## 5. Pedagogical simplifications (deliberate, not errors)

- Strength labels for r (≤ .2 weak, ≤ .4 moderate, > .4 strong) and Cohen's d benchmarks follow the course's
  conventions and are presented as rules of thumb.
- 0–10 rating scales are treated as scale variables, with "ordinal" accepted as defensible.
- The chi-square demo multiplies counts by a non-integer factor, producing non-integer "counts"; χ² and V are still
  well defined and the demo's point (V does not depend on N) holds exactly.
- The ANOVA explorer is labelled a teaching simulation and computes no p-values.
- Module 08 introduces the least-squares line and the standard error of its slope only at intuition level, framed as the line behind Pearson r (its t-test is the correlation t-test). Heteroscedasticity is shown visually with a typical residual per third of the X range (root mean square), not with a formal test; the page points to Levene/Welch as the group version the course already uses.
- The explanation of n − 1 ("deviations from the sample's own mean come out slightly too small") is an intuition, not a derivation.
- Language throughout is associational ("is associated with", "differs between"); the Lazarsfeld module states that
  arrows reflect theory and timing, not the tables.

## 6. Data provenance

| Material | Nature | Labelling on the site |
| --- | --- | --- |
| Core modules (crosstab, Lazarsfeld, SPSS mock-ups, scatterplots) | Constructed numbers or seeded simulations written for teaching | New line under every module title: "Examples on this page use constructed or simulated teaching data, not empirical findings", linking to `/about`. Owner to confirm that no numbers were copied from a real dataset ([open-issues.md](open-issues.md)) |
| SPSS variable names (`stfedu`, `stfhlth`, `trustprl`, `polint`) | Follow European Social Survey naming; no ESS data included | — |
| ANOVA lab | 11 observations from the course's calculation video | Stated on the page |
| Spread, variance & error (module 08) | Constructed small datasets (trust groups, incomes, books, news/knowledge) and seeded simulations from an invented population model (knowledge = 30 + 3 × hours + error) | "Synthetic data" / "simulation" stated in every panel, plus the module-wide notice |
| Sopranos bonus lab | Fully synthetic, generated by `scripts/sopranos/generate.py` (seeded); no real episode data | Prominent synthetic-data notice and non-affiliation statement on the page |

## 7. Not covered

- Browser floating-point behaviour on exotic platforms was not tested beyond Chromium; all computations use standard
  IEEE double arithmetic.
- The reference fixture should be regenerated (`npm run validate:reference`) whenever teaching data changes.
