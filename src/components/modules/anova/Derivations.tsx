import { MiniTable } from "@/components/learning/MiniTable";
import { SpssOutput } from "@/components/learning/Spss";
import { Tex, TexBlock } from "@/components/learning/Tex";
import { Callout } from "@/components/ui/Callout";
import type { ReactNode } from "react";
import { anova, fmt, mean, ORIGINAL } from "./data";

/** Number formatted for TeX (thousands separators must not add spacing). */
const t = (x: number, digits = 3) => fmt(x, digits).replace(/,/g, "{,}");
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold">{children}</strong>;

/** A numbered step: what we do, why we do it, then the arithmetic. */
export function Walk({ children }: { children: ReactNode }) {
  return <ol className="mt-6 space-y-8">{children}</ol>;
}

export function WalkStep({ n, title, children }: { n: number; title: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:gap-4">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h4 className="pt-1 font-semibold text-ink">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h4>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

/* ---------------- Symbol key ---------------- */

const SYMBOLS: Array<[string, ReactNode]> = [
  [String.raw`\Sigma`, "“Add up”: do the calculation for every row (person or cell), then sum the results."],
  [String.raw`\bar{x}`, "The mean of x (read “x-bar”): add up the values and divide by how many there are."],
  ["n,\\ N", "Number of cases: n in a group, N in the whole sample."],
  ["(\\ldots)^2", "Square: multiply a number by itself. It turns negative distances positive, so distances above and below the mean do not cancel out."],
  [String.raw`\sqrt{\ldots}`, "Square root: undoes a square, bringing the result back to the original scale."],
  [
    "x_i,\\ y_{ij}",
    <>
      Subscripts name a case: <Tex>x_i</Tex> is person i&rsquo;s value; <Tex>{"y_{ij}"}</Tex> is person i in group j.
    </>,
  ],
];

export function SymbolKey() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="font-semibold text-ink">Reading the formulas</h3>
      <p className="mt-1 text-sm text-muted">
        Every formula below is just a recipe. These six symbols are all you need; each step also says the recipe in
        words.
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {SYMBOLS.map(([sym, desc]) => (
          <div key={sym} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-3">
            <dt className="text-ink">
              <Tex>{sym}</Tex>
            </dt>
            <dd className="text-muted">{desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------- A. Crosstab → χ² → Cramér's V ---------------- */

const XT_ROWS = ["Low", "Medium", "High"];
const XT_COLS = ["Failed", "Passed"];
const OBS = [
  [12, 8],
  [8, 12],
  [4, 16],
];

export function CramerDerivation() {
  const rowTot = OBS.map(sum);
  const colTot = XT_COLS.map((_, c) => sum(OBS.map((r) => r[c])));
  const N = sum(rowTot);
  const exp = OBS.map((_, r) => XT_COLS.map((_, c) => (rowTot[r] * colTot[c]) / N));
  const cells = OBS.flatMap((row, r) =>
    row.map((o, c) => {
      const e = exp[r][c];
      return { label: `${XT_ROWS[r]}, ${XT_COLS[c].toLowerCase()}`, o, e, d: o - e, q: (o - e) ** 2 / e };
    }),
  );
  const chi = sum(cells.map((c) => c.q));
  const df = (XT_ROWS.length - 1) * (XT_COLS.length - 1);
  const p = Math.exp(-chi / 2); // exact upper tail of χ² with df = 2
  const k = Math.min(XT_ROWS.length, XT_COLS.length);
  const v = Math.sqrt(chi / (N * (k - 1)));

  return (
    <section>
      <h3 className="font-serif text-xl font-semibold text-ink">A. From a crosstab to χ² and Cramér&rsquo;s V</h3>
      <p className="mt-2 text-muted">
        {N} students are grouped by how intensively they studied (X) and whether they passed the exam (Y). The
        question: is passing associated with study intensity?
      </p>
      <MiniTable
        className="mt-4"
        caption="Observed counts (O)"
        head={["Study intensity", "Failed", "Passed", "Row total"]}
        rows={[
          ...OBS.map((row, r) => [XT_ROWS[r], ...row, rowTot[r]]),
          [<B key="t">Column total</B>, ...colTot.map((c, i) => <B key={i}>{c}</B>), <B key="n">{N}</B>],
        ]}
      />
      <Walk>
        <WalkStep n={1} title="Look at the pattern: row percentages">
          <p>
            X is in the rows, so we compute percentages within each row. That tells us what share of each study group
            passed.
          </p>
          <TexBlock>{String.raw`\begin{gathered}\text{pass rate} = \frac{\text{passed}}{\text{row total}} \\[6pt] \text{Low: } \frac{8}{20} = 40\% \qquad \text{Medium: } \frac{12}{20} = 60\% \qquad \text{High: } \frac{16}{20} = 80\%\end{gathered}`}</TexBlock>
          <p>
            The pass rate rises with study intensity. The rest of the calculation asks two things: could a pattern
            like this easily arise by chance (χ², p), and how strong is it (V)?
          </p>
        </WalkStep>
        <WalkStep n={2} title="Imagine there were no association: expected counts">
          <p>
            Overall, {colTot[1]} of {N} students passed ({fmt((colTot[1] / N) * 100, 0)}%). If study intensity made
            no difference, every group would have that same pass rate: 60% of 20 = 12 passed and 8 failed in each
            group. These are the <B>expected counts</B> (E). The general recipe:
          </p>
          <TexBlock>{String.raw`\begin{gathered}E = \frac{\text{row total} \times \text{column total}}{N} \\[6pt] \text{e.g. } E_{\text{Low, failed}} = \frac{20 \times 24}{60} = 8\end{gathered}`}</TexBlock>
          <MiniTable
            caption="Expected counts (E) if there were no association"
            head={["Study intensity", "Failed", "Passed"]}
            rows={exp.map((row, r) => [XT_ROWS[r], ...row.map((e) => fmt(e, 0))])}
          />
        </WalkStep>
        <WalkStep n={3} title="Measure the gap in every cell, then add up: χ²">
          <p>
            For each cell: take observed minus expected, square it (so negative gaps do not cancel positive ones), and
            divide by the expected count (a gap of 4 matters more when we expected 8 than when we expected 800).
          </p>
          <TexBlock>{String.raw`\chi^2 = \sum_{\text{cells}} \frac{(O - E)^2}{E}`}</TexBlock>
          <MiniTable
            head={["Cell", "O", "E", "O − E", "(O − E)²", "(O − E)² / E"]}
            rows={[
              ...cells.map((c) => [c.label, c.o, fmt(c.e, 0), fmt(c.d, 0).replace("-", "−"), fmt(c.d ** 2, 0), fmt(c.q, 3)]),
              [<B key="s">Sum = χ²</B>, "", "", "", "", <B key="c">{fmt(chi, 3)}</B>],
            ]}
          />
        </WalkStep>
        <WalkStep n={4} title="Is χ² large enough? Degrees of freedom and p">
          <p>
            The degrees of freedom count how many cells can vary freely once the totals are fixed. With 3 rows and 2
            columns:
          </p>
          <TexBlock>{String.raw`\begin{aligned} df &= (\text{rows} - 1)(\text{columns} - 1) \\ &= (3 - 1)(2 - 1) = ${df} \end{aligned}`}</TexBlock>
          <p>
            With df = 2, χ² values above 5.991 occur in fewer than 5% of samples when there is no association in the
            population. Our {fmt(chi, 3)} is above that, so p &lt; .05. SPSS gives the exact value (Asymptotic
            Significance): p = {fmt(p, 3).replace(/^0/, "")}.
          </p>
          <p className="text-sm">
            Optional: for df = 2 only, there is a shortcut that gives the exact p by hand:{" "}
            <Tex>{String.raw`p = e^{-\chi^2/2} = e^{-${t(chi)}/2} \approx ${t(p)}`}</Tex>.
          </p>
        </WalkStep>
        <WalkStep n={5} title="How strong? Cramér’s V">
          <p>
            χ² grows with the sample size: doubling every count doubles χ². Cramér&rsquo;s V removes the sample size
            so the result always lies between 0 (no association) and 1 (perfect association). Here k is the smaller
            of the number of rows and columns (k = 2), so k − 1 = 1.
          </p>
          <TexBlock>{String.raw`\begin{aligned} V &= \sqrt{\frac{\chi^2}{N\,(k - 1)}} \\[4pt] &= \sqrt{\frac{${t(chi)}}{${N} \times 1}} = \sqrt{${t(chi / N, 4)}} \\[4pt] &= ${t(v)} \end{aligned}`}</TexBlock>
        </WalkStep>
      </Walk>
      <Callout className="mt-6" title="What we can say">
        Study intensity and passing are associated (χ²(2) = {fmt(chi, 2)}, p = .036, V = .33). The p-value tests
        independence; V describes the strength; the row percentages show the direction. None of these shows that
        studying more causes passing.
      </Callout>
    </section>
  );
}

/* ---------------- B. Pearson and Spearman ---------------- */

const HOURS = [1, 2, 3, 4, 5, 6];
const SCORES = [50, 52, 61, 59, 68, 75];

function ranks(xs: number[]) {
  const sorted = [...xs].sort((a, b) => a - b);
  return xs.map((x) => sorted.indexOf(x) + 1); // no ties in this example
}

export function CorrelationDerivation() {
  const n = HOURS.length;
  const mx = mean(HOURS);
  const my = mean(SCORES);
  const rows = HOURS.map((x, i) => {
    const dx = x - mx;
    const dy = SCORES[i] - my;
    return { x, y: SCORES[i], dx, dy, p: dx * dy, dx2: dx * dx, dy2: dy * dy };
  });
  const sp = sum(rows.map((r) => r.p));
  const sx = sum(rows.map((r) => r.dx2));
  const sy = sum(rows.map((r) => r.dy2));
  const r = sp / Math.sqrt(sx * sy);
  const rx = ranks(HOURS);
  const ry = ranks(SCORES);
  const d2 = rx.map((a, i) => (a - ry[i]) ** 2);
  const sd2 = sum(d2);
  const rho = 1 - (6 * sd2) / (n * (n * n - 1));
  const sign = (v: number, d = 3) => (v > 0 ? "+" : "") + fmt(v, d).replace("-", "−");

  return (
    <section>
      <h3 className="font-serif text-xl font-semibold text-ink">B. Pearson and Spearman, one row at a time</h3>
      <p className="mt-2 text-muted">
        Six students: weekly study hours (x) and exam score (y). Pearson&rsquo;s r uses the original numbers;
        Spearman&rsquo;s ρ uses only their ranks.
      </p>
      <Walk>
        <WalkStep n={1} title="Find the two means">
          <TexBlock>{String.raw`\begin{gathered} \bar{x} = \frac{1 + 2 + 3 + 4 + 5 + 6}{6} = \frac{21}{6} = ${t(mx, 1)} \\[8pt] \bar{y} = \frac{50 + 52 + 61 + 59 + 68 + 75}{6} = \frac{${sum(SCORES)}}{6} = ${t(my)} \end{gathered}`}</TexBlock>
        </WalkStep>
        <WalkStep n={2} title="How far is each student from the means, and do the distances point the same way?">
          <p>
            For each student, subtract the mean from both values. Then multiply the two distances. If a student is
            above average on both (or below on both), the product is positive; if above on one and below on the
            other, it is negative. Mostly positive products mean a positive association.
          </p>
          <MiniTable
            head={[
              "Student",
              <Tex key="x">x</Tex>,
              <Tex key="y">y</Tex>,
              <Tex key="dx">{String.raw`x - \bar{x}`}</Tex>,
              <Tex key="dy">{String.raw`y - \bar{y}`}</Tex>,
              <Tex key="p">{String.raw`(x - \bar{x})(y - \bar{y})`}</Tex>,
              <Tex key="dx2">{String.raw`(x - \bar{x})^2`}</Tex>,
              <Tex key="dy2">{String.raw`(y - \bar{y})^2`}</Tex>,
            ]}
            rows={[
              ...rows.map((row, i) => [
                i + 1,
                row.x,
                row.y,
                sign(row.dx, 1),
                sign(row.dy),
                sign(row.p),
                fmt(row.dx2, 2),
                fmt(row.dy2, 3),
              ]),
              [<B key="s">Sum</B>, "", "", "0", "0", <B key="a">{fmt(sp, 1)}</B>, <B key="b">{fmt(sx, 1)}</B>, <B key="c">{fmt(sy, 3)}</B>],
            ]}
          />
          <p className="text-sm">The distances themselves always add up to 0; that is why we need products and squares.</p>
        </WalkStep>
        <WalkStep n={3} title="Put the sums into the formula">
          <p>
            The top of the fraction is the shared movement of x and y. The bottom rescales it by how much each
            variable varies on its own, which forces r between −1 and +1.
          </p>
          <TexBlock>{String.raw`\begin{aligned} r &= \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i - \bar{x})^2 \cdot \sum (y_i - \bar{y})^2}} \\[6pt] &= \frac{${t(sp, 1)}}{\sqrt{${t(sx, 1)} \times ${t(sy)}}} = \frac{${t(sp, 1)}}{\sqrt{${t(sx * sy)}}} \\[6pt] &= \frac{${t(sp, 1)}}{${t(Math.sqrt(sx * sy))}} = ${t(r)} \end{aligned}`}</TexBlock>
        </WalkStep>
        <WalkStep n={4} title="Spearman: replace values with ranks">
          <p>
            Rank each variable separately (smallest = 1). Then take the difference between the two ranks for each
            student (d) and square it.
          </p>
          <MiniTable
            head={["Student", "x", "rank of x", "y", "rank of y", "d", "d²"]}
            rows={[
              ...HOURS.map((x, i) => [i + 1, x, rx[i], SCORES[i], ry[i], fmt(rx[i] - ry[i], 0).replace("-", "−"), d2[i]]),
              [<B key="s">Sum</B>, "", "", "", "", "", <B key="d">{sd2}</B>],
            ]}
          />
          <p>Only students 3 and 4 swap places in the ranking. With no tied values, the recipe is:</p>
          <TexBlock>{String.raw`\begin{aligned} \rho &= 1 - \frac{6 \sum d_i^2}{n\,(n^2 - 1)} \\[6pt] &= 1 - \frac{6 \times ${sd2}}{6 \times (36 - 1)} = 1 - \frac{${6 * sd2}}{${n * (n * n - 1)}} \\[6pt] &= 1 - ${t((6 * sd2) / (n * (n * n - 1)))} = ${t(rho)} \end{aligned}`}</TexBlock>
          <p className="text-sm">
            With tied values, SPSS gives the tied cases the average of their ranks and computes Pearson&rsquo;s r on
            the ranks; the result is then slightly different from this shortcut.
          </p>
        </WalkStep>
      </Walk>
      <Callout className="mt-6" title="What we can say">
        Both coefficients show a strong positive association (r = .96, ρ = .94): students who studied more tended to
        score higher. Correlation is not proof of causation; always look at the scatterplot and the variable coding.
      </Callout>
    </section>
  );
}

/* ---------------- C. One-way ANOVA ---------------- */

export function AnovaDerivation() {
  const r = anova(ORIGINAL);
  const all = ORIGINAL.flat();
  const N = all.length;
  const gm = r.overall;
  const obs = ORIGINAL.flatMap((xs, j) => xs.map((y) => ({ j, y, m: r.means[j] })));
  const between = ORIGINAL.map((xs, j) => {
    const d = r.means[j] - gm;
    return { j, n: xs.length, m: r.means[j], d, d2: d * d, w: xs.length * d * d };
  });
  const signed = (v: number, d = 3) => (v > 0 ? "+" : "") + fmt(v, d).replace("-", "−");

  return (
    <div>
      <Walk>
        <WalkStep n={1} title="Mean of each group">
          <p>Add up the values in each group and divide by the number of people in that group.</p>
          <TexBlock>{ORIGINAL.map((xs, j) => String.raw`\bar{y}_${j + 1} = \frac{${xs.join(" + ")}}{${xs.length}} = \frac{${sum(xs)}}{${xs.length}} = ${fmt(mean(xs), 2).replace(/\.?0+$/, "")}`).join(String.raw` \\[4pt] `).replace(/^/, String.raw`\begin{gathered}`).concat(String.raw`\end{gathered}`)}</TexBlock>
        </WalkStep>
        <WalkStep n={2} title="Grand mean: the mean of all eleven people">
          <p>
            Add up every observation and divide by N = {N}. Note this is <em>not</em> the average of the three group
            means ({fmt(mean(r.means), 3)}), because the groups have different sizes.
          </p>
          <TexBlock>{String.raw`\begin{aligned} \bar{y} &= \frac{\sum y}{N} = \frac{${ORIGINAL.map((xs) => sum(xs)).join(" + ")}}{${N}} \\[6pt] &= \frac{${sum(all)}}{${N}} = ${t(gm)} \end{aligned}`}</TexBlock>
        </WalkStep>
        <WalkStep n={3} title="Two distances for every person">
          <p>
            For each person we measure two distances and square them: from <B>their own group mean</B> (how far they
            are from people in the same group) and from the <B>grand mean</B> (how far they are from everyone). Adding
            up a squared column gives a <em>sum of squares</em> (SS): the first is SS Within, the second SS Total.
          </p>
          <MiniTable
            head={[
              "Group",
              <Tex key="y">y</Tex>,
              <Tex key="m">{String.raw`\bar{y}_j`}</Tex>,
              <Tex key="w">{String.raw`y - \bar{y}_j`}</Tex>,
              <Tex key="w2">{String.raw`(y - \bar{y}_j)^2`}</Tex>,
              <Tex key="t">{String.raw`y - \bar{y}`}</Tex>,
              <Tex key="t2">{String.raw`(y - \bar{y})^2`}</Tex>,
            ]}
            rows={[
              ...obs.map((o) => [
                o.j + 1,
                o.y,
                fmt(o.m, 2),
                signed(o.y - o.m, 2),
                fmt((o.y - o.m) ** 2, 4).replace(/\.?0+$/, ""),
                signed(o.y - gm),
                fmt((o.y - gm) ** 2, 3),
              ]),
              [
                <B key="s">Sum</B>,
                "",
                "",
                "0",
                <B key="w">{fmt(r.within, 2)}</B>,
                "0",
                <B key="t">{fmt(r.total, 3)}</B>,
              ],
            ]}
          />
          <TexBlock>{String.raw`\begin{gathered} SS_{\text{Within}} = \sum_j \sum_i (y_{ij} - \bar{y}_j)^2 = ${t(r.within, 2)} \\[8pt] SS_{\text{Total}} = \sum_j \sum_i (y_{ij} - \bar{y})^2 = ${t(r.total)} \end{gathered}`}</TexBlock>
          <p>
            SS Within is the variation that group membership cannot explain: people differ even inside their own
            group. SS Total is all the variation in the data.
          </p>
        </WalkStep>
        <WalkStep n={4} title="Between-group variation: how far are the group means from the grand mean?">
          <p>
            Every person in a group &ldquo;carries&rdquo; their group&rsquo;s distance from the grand mean, so we
            multiply each squared distance by the group size n<sub>j</sub>.
          </p>
          <MiniTable
            head={[
              "Group",
              <Tex key="n">{String.raw`n_j`}</Tex>,
              <Tex key="m">{String.raw`\bar{y}_j`}</Tex>,
              <Tex key="d">{String.raw`\bar{y}_j - \bar{y}`}</Tex>,
              <Tex key="d2">{String.raw`(\bar{y}_j - \bar{y})^2`}</Tex>,
              <Tex key="w">{String.raw`n_j(\bar{y}_j - \bar{y})^2`}</Tex>,
            ]}
            rows={[
              ...between.map((b) => [b.j + 1, b.n, fmt(b.m, 2), signed(b.d), fmt(b.d2, 3), fmt(b.w, 3)]),
              [<B key="s">Sum</B>, "", "", "", "", <B key="b">{fmt(r.between, 3)}</B>],
            ]}
          />
          <TexBlock>{String.raw`\begin{aligned} SS_{\text{Between}} &= \sum_j n_j (\bar{y}_j - \bar{y})^2 \\ &= ${between.map((b) => t(b.w)).join(" + ")} \\ &= ${t(r.between)} \end{aligned}`}</TexBlock>
        </WalkStep>
        <WalkStep n={5} title="Check: the two parts add up to the total">
          <p>
            This is the core idea of ANOVA: all variation splits into a part between the groups and a part within
            them.
          </p>
          <TexBlock>{String.raw`\begin{gathered} SS_{\text{Total}} = SS_{\text{Between}} + SS_{\text{Within}} \\[4pt] ${t(r.total)} = ${t(r.between)} + ${t(r.within)} \end{gathered}`}</TexBlock>
        </WalkStep>
        <WalkStep n={6} title="Degrees of freedom">
          <p>
            Sums of squares grow simply because more numbers are added up. To compare them fairly, we divide by their
            degrees of freedom: the number of independent pieces of information in each part. With k = 3 groups and
            N = {N} people:
          </p>
          <TexBlock>{String.raw`\begin{aligned} df_{\text{Between}} &= k - 1 = 3 - 1 = ${r.dfBetween} \\ df_{\text{Within}} &= N - k = ${N} - 3 = ${r.dfWithin} \\ df_{\text{Total}} &= N - 1 = ${N - 1} \end{aligned}`}</TexBlock>
        </WalkStep>
        <WalkStep n={7} title="Mean squares and the F ratio">
          <p>
            A mean square (MS) is a sum of squares divided by its degrees of freedom: an average squared distance. F
            compares the two averages. If the groups did not differ in the population, the group means would scatter
            only about as much as individual noise allows, and F would be close to 1. A large F means the group means
            are much further apart than the within-group scatter would suggest.
          </p>
          <TexBlock>{String.raw`\begin{aligned} MS_{\text{Between}} &= \frac{SS_{\text{Between}}}{df_{\text{Between}}} = \frac{${t(r.between)}}{${r.dfBetween}} = ${t(r.msBetween)} \\[8pt] MS_{\text{Within}} &= \frac{SS_{\text{Within}}}{df_{\text{Within}}} = \frac{${t(r.within, 2)}}{${r.dfWithin}} = ${t(r.msWithin)} \\[8pt] F &= \frac{MS_{\text{Between}}}{MS_{\text{Within}}} = \frac{${t(r.msBetween)}}{${t(r.msWithin)}} = ${t(r.f, 2)} \end{aligned}`}</TexBlock>
        </WalkStep>
        <WalkStep n={8} title="Is F large enough? The p-value">
          <p>
            For F with df = (2, 8), values above 4.459 occur in fewer than 5% of samples if the population means are
            equal; values above 18.49 occur in fewer than 0.1%. Our F = {fmt(r.f, 2)} is above both, so p &lt; .001.
            The exact value is p = .00029; SPSS rounds it and prints Sig. = .000, which you report as p &lt; .001.
          </p>
        </WalkStep>
        <WalkStep n={9} title="Effect size: eta squared">
          <p>What share of all the variation lies between the groups?</p>
          <TexBlock>{String.raw`\eta^2 = \frac{SS_{\text{Between}}}{SS_{\text{Total}}} = \frac{${t(r.between)}}{${t(r.total)}} = ${t(r.eta)}`}</TexBlock>
          <p>
            About {fmt(r.eta * 100, 0)}% of the variation in this sample is associated with group membership. That is
            a description of the sample, not proof that the groups cause the differences.
          </p>
        </WalkStep>
      </Walk>
      <div className="mt-8">
        <SpssOutput
          title="ANOVA (the same numbers as SPSS prints them)"
          headers={["", "Sum of Squares", "df", "Mean Square", "F", "Sig."]}
          rows={[
            ["Between Groups", fmt(r.between, 3), String(r.dfBetween), fmt(r.msBetween, 3), fmt(r.f, 3), ".000"],
            ["Within Groups", fmt(r.within, 3), String(r.dfWithin), fmt(r.msWithin, 3), "", ""],
            ["Total", fmt(r.total, 3), String(N - 1), "", "", ""],
          ]}
        />
      </div>
    </div>
  );
}
