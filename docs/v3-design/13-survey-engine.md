# 13 · Survey engine (`survey-stats.js` → `src/lib/survey-stats.ts`)

Deterministic, pure, design-based. Six separated layers, no UI code:

1. **Data-generation model** — `makePopulation(spec)`: N units, groups with (share, μ, σ), K clusters with a shared effect sized by `icc`, auxiliary `x` (binary), frame membership by group coverage. Known truth `Ȳ`, `Ȳ_frame`, `N_g`, `x` margins. Seeded (`mulberry32`).
2. **Sampling mechanism** — `select(pop, design, rand)`: SRS (π=n/N_F), stratified SRS (π_h=n_h/N_h; proportional/equal/custom), one-stage cluster (π=a/A), two-stage (π=(a/A)(m/M_i)). Returns per unit `{pi, d=1/pi, stratum, psu}` and `info.method`.
3. **Response mechanism** — `respond(sample, mech, rand)`: none, MCAR, by group, by outcome (logistic in standardised y). Keeps `pResp` for teaching.
4. **Estimators** — `estimates(resp, N)`: unweighted, HT total, HT mean (÷N), Hájek (÷Σw). `postStratify(resp, counts, key)`, `rake(resp, margins)` (IPF with convergence trace and flag). `applyAdjust`.
5. **Uncertainty** — `linearizedVarMean` (Taylor-linearised Hájek mean; with-replacement ultimate-cluster approximation; strata honoured; no fpc = `svydesign` default), `closedFormVar` (SRS/strat/cluster with fpc), `naiveVar` (s²/n), `kishNeff`, `deff` (V_design / V_SRS at the same n, S² estimated with weights).
6. **Repeated experiment** — `repeat(pop, design, mech, adjust, reps, seed)`: Monte-Carlo sampling distribution of Hájek/HT/unweighted means, empirical SD, mean linearised SE, bias vs Ȳ and Ȳ_frame. Labelled "finite-simulation estimate".

## Sample-design object (shared by all survey labs)

```ts
interface SampleDesign { type:"srs"|"strat"|"cluster"|"twostage"|"pps"; n?:number; allocation?:"prop"|"equal"|"neyman"|"custom"; nh?:Record<string,number>; a?:number; m?:number; sizeMeasure?:string }
interface SampledUnit { id:number; y:number; g:string; x:0|1; pi:number; d:number; stratum:string; psu:number; r?:boolean; pResp?:number; w:number }
interface DesignInfo { method:string; frameN:number; pi?:number; Nh?:Record<string,number>; nh?:Record<string,number>; A?:number; a?:number; psus?:number[] }
```
Estimands: mean, total, domain mean (planned), proportion (y binary), regression coefficient (planned). Variance estimators: linearised (implemented), closed form (implemented), JK1/JKn/BRR (designed), replicate weights export (designed).

## Honesty rules enforced by the engine
- Undefined → `null` with `reason`/`degenerate` flags; never NaN.
- Every variance result carries `method`; the UI prints it.
- `validation.unchecked` lists everything not yet compared with R; labs show the badge until `scripts/validation/survey_reference.R` passes.
- HT mean divides by `N_frame` before calibration and by `N` after calibration to population totals; the UI states which.

## Known limitations
- With-replacement approximation inflates SE when n/N is large (fpc only in closed forms).
- Two-stage closed form not shown.
- PPS, GREG, bounded calibration, replication, Rao–Scott, svyglm: specified in `docs/labs/`, not implemented.
- Population N=600 for rendering; engine is O(N) and handles 5 000.

## Validation protocol (before pilot)
Export 200 samples per design × mechanism × adjustment combination from the Studio (seeded), run the R script, compare: estimates 1e−6, SE 1e−4 (linearised), deff 1 %, raked weights 1e−9. Record results in `fixtures/survey_reference.json` and flip `validation.checked`.
