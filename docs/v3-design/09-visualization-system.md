# 09 · Scientific Visualization System

One visual grammar for every laboratory. The rule: **a mathematical object keeps its visual identity wherever it appears.** A squared deviation in the variance lab is the squared deviation in the t-Test SE² squares, in ANOVA's within-group squares and in the Studio's variance picture.

## 1. Semantic palette (from the QDA2 design system)

| Role | Colour | Used for |
|---|---|---|
| ink | #101B2B | truth/parameter lines, means, formulas |
| data | #548FD0 | observations, group 1, empirical bars |
| model | #20BFA9 / ink #0F8C7B | fitted line, group 2, "covers", Hájek, design-based |
| residual | #ED896F / ink #C8694F | residuals, misses, differences, naive/unweighted, tails |
| explained | #9688E8 / ink #6A5BC9 | between-group, SE, CI bands, calibration, probability regions |
| attention | #D9A441 (outline only) | frame mean, β region, bounds, notes |
| paper / line | #F7F6F1 / #DDD9CE / #E6E2D8 | canvases and axes |

Text never conveys meaning by colour alone; every colour has a label or a readout.

## 2. Object families → primitives

### Data objects
- **Observation** → `DraggableObservation` (circle r=6, white stroke; role=slider, arrow keys ±1/Shift ±5; 44 px hit halo).
- **Population / Sample** → `PopulationField` (dot grid in PSU blocks; frame = hollow, sampled = ink ring, nonrespondent = 0.2 opacity + coral ring) and `SampleSelection` (the ring layer alone, reusable over any field).
- **Weight** → `WeightedObservation` (radius 3.2 + 5·√(w/w_max)); never area-coded by colour.
- **Group / Category** → hue from the categorical ramp (blue, teal, violet, then amber/coral only for ≤5 levels).

### Geometric objects
- **Distance / Deviation** → `DeviationSegment` (2 px bar from point to reference).
- **Squared deviation** → `SquaredDeviation` (true square, side = |dev| in y-units, fill .18 + stroke; opens away from the canvas edge). Same component for SE² squares (side = √(s²/n)) in the t-Test lab and for α's variance picture.
- **Line / Reference** → `ReferenceLine` (mean 2.5 px ink; truth dashed 4 3; frame mean amber solid; μ₀ coral dashed 6 4).
- **Area / Region** → `ProbabilityRegion` (fill explained .35–.45; endpoints draggable; label "P(a<X≤b)=…" always present).
- **Vector / Projection** → `VectorProjection` (arrow, perpendicular as residual-coloured segment, projected tick on the axis).
- **Surface** → `LossSurface` (contours in greys, minimum marker model-coloured, slice as a `DistributionCurve`-styled profile). No decorative 3D.
- **Transformation** → `MatrixTransformation` (before ghost .25 opacity, after solid, 550 ms).

### Statistical objects
- **Parameter** → ink dashed line + Greek label; fixed, never animated except on preset change.
- **Statistic / Estimator** → solid line/dot in the estimator's semantic colour; always paired with its method label.
- **Standard error** → explained colour; as a bar (t fraction), a square (SE²), or an `IntervalBand`.
- **Confidence interval** → `IntervalBand`: estimate dot + horizontal/vertical band; covers = model, misses = residual; reference line = parameter.
- **Residual / Prediction** → residual segment + square; prediction line model-coloured.
- **Hypothesis** → H₀ curve ink, H₁ curve explained; `ProbabilityRegion` for α (residual) and β (attention outline).
- **Sampling distribution** → `SamplingDistributionPlot`: residual-coloured bars .75 (it is made of statistics, i.e. repeated "errors"), theory overlay as explained-coloured `DistributionCurve`; empirical sample histograms are data-coloured — the two are never confusable.
- **Effect size** → overlap of two `DistributionCurve`s or η² share on a `DecompositionBar`.

### Mathematical operations (how motion shows the math)
- **Summation** → `SigmaExpander`: terms appear one per 120 ms and stack into the total (`DecompositionBar`).
- **Averaging / Weighting** → `ExpectedValueBalance` fulcrum slide; weight = radius.
- **Squaring** → `SquaredDeviation` grows from the segment (height first, then width, 550 ms).
- **Standardization** → axis relabels, geometry unchanged.
- **Projection** → perpendiculars drop, then the axis rotates (PCA) or the line fits (OLS).
- **Optimization** → marker slides down the `LossSurface`; fitted model updates live.
- **Integration** → region fills left→right while the CDF point climbs.
- **Matrix transformation** → ghost → solid interpolation.
- **Conditionalization** → the conditioning column expands to full width (eikosogram), everything else dims to .15.

## 3. Primitive contract template

Each primitive is documented with: mathematical meaning · input schema (TypeScript) · geometry (px rules, viewBox) · state & transforms (which props animate; `cls` swap to no-transition while dragging) · direct manipulation (pointer capture via `getScreenCTM().inverse()`) · keyboard alternative (role, aria-valuenow/valuetext, keys) · visual encoding (table above) · labels (text outside geometry; SVG dynamic text via `TXT()` helper, see 08 §3) · animation (550 ms `cubic-bezier(.2,.7,.2,1)`; 60 ms linear while dragging; none under `prefers-reduced-motion`) · API (`props`, `onChange`) · edge cases (null → "—" + note; never clipped silently).

Example — `IntervalBand`:
```ts
interface IntervalBandProps { lo: number|null; hi: number|null; estimate: number|null; reference: number;
  orientation: "h"|"v"; covers?: boolean|null; naive?: {lo:number;hi:number}|null; label: string; method: string }
```
Geometry: band 2.5 px (1.6 px when >50 rows), estimate dot r=3; naive band dashed 2 2 offset +4 px. Keyboard: not interactive (output). Edge: lo/hi null → no band, row shows "—" and the method note.

## 4. Canvas layout rule

One **primary canvas** per lab (top), one **secondary synchronized panel** whose content depends on the lab stage/design (below), one **side panel** (controls → readouts → formula → task) that hides in Teach mode. Max two SVGs visible at once. Tabs/segments for stages (Survey Studio) or designs (t-Test), never six competing charts.

## 5. Localization and text

All strings in `T()` dictionaries (en/hu); labels never drawn as part of geometry; glyphs with poor font coverage (π, x̄ at small sizes) are avoided in SVG labels (use "pi", "mean" or larger font).

## 6. Accessibility baseline

Every direct manipulation has: a numeric or keyboard alternative in the side panel; `role="slider"` with `aria-valuenow`; a live region sentence summarising the key statistics after each change; tables for every chart; reduced-motion respected; focus rings 2 px #0F8C7B. Teach mode scales with CSS `zoom` and hides the side panel; projection target 1920×1080.
