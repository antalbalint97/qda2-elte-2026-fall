import { CaseSection, Exhibit, HypotheticalTag, ResearchQuestion, SyntheticTag } from "@/components/bonus/sopranos/Case";
import { Crosstab2x2 } from "@/components/bonus/sopranos/Crosstab2x2";
import { DataFile } from "@/components/bonus/sopranos/DataFile";
import { FrequencyExercise } from "@/components/bonus/sopranos/FrequencyExercise";
import { Gate } from "@/components/bonus/sopranos/Gate";
import { GuessSwearing } from "@/components/bonus/sopranos/GuessSwearing";
import { LzVisualizer } from "@/components/bonus/sopranos/LzVisualizer";
import { Profile } from "@/components/bonus/sopranos/Profile";
import { ShareLink } from "@/components/bonus/sopranos/ShareLink";
import { UShapePlot } from "@/components/bonus/sopranos/UShapePlot";
import { WriteUp } from "@/components/bonus/sopranos/WriteUp";
import { MiniTable } from "@/components/learning/MiniTable";
import { BeforeSpss, MenuPath, SpssDialog, SpssOutput } from "@/components/learning/Spss";
import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import { OrderQuestionView } from "@/components/quiz/OrderQuestionView";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { Scatter } from "@/components/viz/Scatter";
import {
  BENCHMARK,
  col,
  N,
  ONE_SAMPLE,
  PAIRED,
  PARTIAL_FINALE,
  PARTIAL_NON_FINALE,
  PARTIAL_NON_FINALE_TEST,
  pct,
  rLabel,
  RUNTIME_VIOLENCE,
  THERAPY_D,
  THERAPY_G,
  THERAPY_GROUPS,
  THERAPY_LEVENE,
  THERAPY_ROW,
  THERAPY_SP,
  THERAPY_T,
  ZERO_ORDER,
  ZERO_ORDER_TEST,
} from "@/content/sopranos/analysis";
import {
  BOSS_QUESTIONS,
  CROSSTAB_QUESTIONS,
  DESC_QUESTIONS,
  EARLY_PCT,
  LATE_PCT,
  LEVEL_QUESTIONS,
  P_TXT,
  qCorCause,
  qCorLevels,
  qCorMethod,
  qCrosstabMethod,
  qFuckMethod,
  qLevene1,
  qLevene2,
  qLzA,
  qLzB,
  qLzC,
  qLzCWhere,
  qLzD,
  qLzDWhere,
  qTA,
  qTAH0,
  qTB,
  qTBRoles,
  qTC,
  qTCWhy,
  qTempting,
  qTrial,
  qUShape,
  qVerdictStrength,
  ROLE_QUESTIONS,
  SOP_SEQUENCE,
  T_OUTPUT_QUESTIONS,
  V_TXT,
} from "@/content/sopranos/questions";
import { SYNTHETIC_NOTICE } from "@/content/sopranos/variables";
import { noLeadingZero } from "@/lib/stats";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The Sopranos QDA2 Lab",
  description: "An optional bonus practice lab for Quantitative Data Analysis 2, built on a synthetic Sopranos-inspired dataset.",
  robots: { index: false, follow: false },
};

/** SPSS-style significance: three decimals, no leading zero, "<.001" for tiny values. */
const sig = (p: number) => (p < 0.001 ? "<.001" : noLeadingZero(p, 3));
const f3 = (x: number) => noLeadingZero(x, 3);

const NAV = [
  ["evidence", "Data"],
  ["variables", "1 Variables"],
  ["frequencies", "2 Frequencies"],
  ["crosstab", "3 Crosstab"],
  ["trial", "4 The trial"],
  ["lazarsfeld", "5 Lazarsfeld"],
  ["order", "6 Order"],
  ["correlation", "7 Correlation"],
  ["swearing", "7½ Bonus round"],
  ["nonlinear", "8 Nonlinearity"],
  ["t-tests", "9 t-tests"],
  ["t-output", "10 Output"],
  ["levene", "11 Levene"],
  ["final-boss", "12 Final boss"],
  ["report", "Report"],
] as const;

const [rt, rn] = ZERO_ORDER.map((r) => r[0] + r[1]);
const phi = (ZERO_ORDER[0][0] * ZERO_ORDER[1][1] - ZERO_ORDER[0][1] * ZERO_ORDER[1][0]) /
  Math.sqrt(rt * rn * (ZERO_ORDER[0][0] + ZERO_ORDER[1][0]) * (ZERO_ORDER[0][1] + ZERO_ORDER[1][1]));
const nfN = PARTIAL_NON_FINALE.flat().reduce((a, b) => a + b, 0);
const fiN = PARTIAL_FINALE.flat().reduce((a, b) => a + b, 0);
const nfPct = PARTIAL_NON_FINALE.map((r) => (r[1] / (r[0] + r[1])) * 100);
const fiPct = PARTIAL_FINALE.map((r) => (r[1] / (r[0] + r[1])) * 100);

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">{children}</div>;
}

function CrosstabSpss({ title }: { title: string }) {
  return (
    <SpssDialog
      title={title}
      variables={["season", "runtime_minutes", "therapy_scene", "violence_event_count", "fuck_count"]}
      fields={[
        { label: "Row(s):", values: ["early_late (X)"], note: "X in the rows, so row percentages are percentages within X." },
        { label: "Column(s):", values: ["major_violence (Y)"], note: "The dependent variable goes in the columns." },
        {
          label: "Layer 1 of 1:",
          values: ["(empty) or finale_episode (Z)"],
          note: "Empty for the zero-order table. Add Z here for one partial table per category of Z.",
        },
      ]}
      options={[
        { label: "Cells… › Row percentages", checked: true, note: "Percentages within each category of X." },
        { label: "Statistics… › Chi-square", checked: true },
        { label: "Statistics… › Phi and Cramer's V", checked: true },
      ]}
    />
  );
}

export default function SopranosLab() {
  return (
    <div className="sopranos bg-[var(--charcoal)] pb-24">
      {/* ---------- Opening ---------- */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #efe5d1 0 1px, transparent 1px 80px)" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--cream-muted)]">
            QDA2 · Bonus case file · Prepared for Simon Nicholas Hill
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[var(--cream)] sm:text-6xl">
            THE SOPRANOS
            <br />
            QDA2 LAB
          </h1>
          <p className="mt-4 font-serif text-xl italic text-[var(--stamp)] sm:text-2xl">
            “Never rat on your friends. Always check your measurement level.”
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--cream-muted)]">Bada Bing, Bivariate Analysis</p>

          <div className="mt-10 max-w-2xl space-y-4 text-lg leading-relaxed text-[var(--cream)]">
            <p>Simon, you said you were watching The Sopranos.</p>
            <p>Unfortunately, this means The Sopranos is now homework.</p>
            <p>Your task is to determine whether six seasons of organized crime can survive quantitative analysis.</p>
            <p className="text-sm text-[var(--cream-muted)]">No prior knowledge of New Jersey waste management is required.</p>
          </div>

          <div className="mt-10 grid gap-4 border-t border-white/10 pt-6 text-sm text-[var(--cream-muted)] sm:grid-cols-3">
            <p>
              <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--cream)]">Status</span>
              Optional practice. Not graded.
            </p>
            <p>
              <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--cream)]">Covers</span>
              Everything in QDA2 so far, from measurement levels to t-tests.
            </p>
            <p>
              <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--cream)]">Progress</span>
              Saved in this browser only. No login.
            </p>
          </div>
          <div className="mt-6">
            <ShareLink />
          </div>
        </div>
      </header>

      <nav aria-label="Lab parts" className="sticky top-14 z-20 border-b border-white/10 bg-[var(--charcoal)]/95 backdrop-blur">
        <ol className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 text-xs sm:px-6">
          {NAV.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="block whitespace-nowrap rounded-md px-2.5 py-1.5 font-mono text-[var(--cream-muted)] hover:bg-white/10 hover:text-[var(--cream)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mx-auto mt-10 max-w-5xl space-y-12 px-4 sm:px-6">
        {/* ---------- The evidence ---------- */}
        <CaseSection
          part="0"
          id="evidence"
          kicker="The evidence"
          title="The dataset"
          intro="Every exercise below uses one episode-level dataset. Before analysing anything, know where the numbers come from."
        >
          <DataFile />
        </CaseSection>

        {/* ---------- Part 1 ---------- */}
        <CaseSection
          part="1"
          id="variables"
          kicker="Know your variables"
          title="Measurement levels, then roles"
          intro="Classify each variable as nominal, ordinal or scale. Then decide which variable is X and which is Y in a few research questions."
        >
          <QuizRunner questions={LEVEL_QUESTIONS} title="Classify the variables" />
          <Callout tone="key" title="Measurement level ≠ variable role">
            The <strong>level</strong> describes what the values mean. The <strong>role</strong> (<Role r="X" />, <Role r="Y" />, <Role r="Z" />)
            comes from the research question. A variable keeps its level while it moves between roles.
          </Callout>
          <QuizRunner questions={ROLE_QUESTIONS} title="In each research question, which is X and which is Y?" />
        </CaseSection>

        {/* ---------- Part 2 ---------- */}
        <CaseSection
          part="2"
          id="frequencies"
          kicker="Frequencies"
          title="How peaceful is The Sopranos, statistically speaking?"
          intro="Descriptive statistics first: N, mean, median, minimum, maximum and standard deviation for death_count, violence_event_count, fuck_count and runtime_minutes."
          aside="Never rat on your friends. Always report N."
        >
          <ResearchQuestion>How peaceful is The Sopranos, statistically speaking?</ResearchQuestion>
          <FrequencyExercise />
          <QuizRunner questions={DESC_QUESTIONS} title="Mean, median and skew" />
        </CaseSection>

        {/* ---------- Part 3 ---------- */}
        <CaseSection
          part="3"
          id="crosstab"
          kicker="The Bada Bing crosstab"
          title="Are later seasons more likely to contain major violence?"
          intro={
            <>
              <Role r="X">early_late</Role> × <Role r="Y">major_violence</Role>, a 2 × 2 crosstab. Switch between counts, row percentages and
              column percentages and watch which total becomes the denominator.
            </>
          }
          aside="Check the denominator before you disrespect the family."
        >
          <ResearchQuestion>Are later seasons more likely to contain major violence?</ResearchQuestion>
          <div className="space-y-2">
            <Crosstab2x2
              table={ZERO_ORDER}
              xName="early_late"
              yName="major_violence"
              xCats={["Seasons 1–3", "Seasons 4–6"]}
              yCats={["No major violence", "Major violence"]}
            />
            <SyntheticTag />
          </div>
          <QuizRunner questions={CROSSTAB_QUESTIONS} title="Seven questions about one table" />
          <Card>
            <ChoiceQuestionView q={qTempting} />
          </Card>
          <Exhibit label="SPSS mode" title="Now, and only now, the software">
            <Gate q={qCrosstabMethod}>
              <BeforeSpss
                items={[
                  { q: "What is the research question?", a: "Are later seasons more likely to contain major violence?" },
                  { q: "What are the variables?", a: <><Role r="X">early_late</Role> <Role r="Y">major_violence</Role></> },
                  { q: "What are their measurement levels?", a: "Both nominal (dichotomous)." },
                  { q: "What statistical question?", a: "Is the distribution of Y the same in both categories of X?" },
                  { q: "Which method fits?", a: "Crosstab, percentages within X, χ², Cramer's V." },
                ]}
              />
              <MenuPath path={["Analyze", "Descriptive Statistics", "Crosstabs"]} />
              <CrosstabSpss title="Crosstabs" />
              <div className="grid gap-5 lg:grid-cols-2">
                <SpssOutput
                  title="Chi-Square Tests"
                  headers={["", "Value", "df", "Asymptotic Significance (2-sided)"]}
                  rows={[
                    ["Pearson Chi-Square", { v: ZERO_ORDER_TEST.chi2.toFixed(3), hl: 1 }, "1", { v: sig(ZERO_ORDER_TEST.p), hl: 2 }],
                    ["N of Valid Cases", String(N), "", ""],
                  ]}
                  annotations={{
                    1: "χ² compares observed and expected counts.",
                    2: `p ${P_TXT}: below .05, so reject independence.`,
                  }}
                  footnote={`Smallest expected count: ${ZERO_ORDER_TEST.minExpected.toFixed(2)} (well above 5).`}
                />
                <SpssOutput
                  title="Symmetric Measures"
                  headers={["", "Value", "Approximate Significance"]}
                  rows={[
                    ["Phi", f3(phi), sig(ZERO_ORDER_TEST.p)],
                    ["Cramer's V", { v: f3(ZERO_ORDER_TEST.cramersV), hl: 3 }, sig(ZERO_ORDER_TEST.p)],
                  ]}
                  annotations={{ 3: `V = ${V_TXT}: strength of the association (weak-to-moderate).` }}
                />
              </div>
            </Gate>
          </Exhibit>
        </CaseSection>

        {/* ---------- Part 4 ---------- */}
        <CaseSection
          part="4"
          id="trial"
          kicker="p-value: the trial"
          title={<>The People of New Jersey v. H₀</>}
          intro="The court presumes innocence. Statistics presumes H₀. The question is how embarrassing the evidence would be for H₀ if H₀ were true."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">The defendant (H₀)</p>
              <p className="mt-1 font-serif text-[17px] text-ink">
                Major violence is independent of whether an episode comes from an early or late season.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">The evidence</p>
              <p className="mt-1 font-mono text-[15px] text-ink">
                χ²(1) = {ZERO_ORDER_TEST.chi2.toFixed(2)}, p {P_TXT}
                <br />
                Cramer&apos;s V = {V_TXT}, N = {N}
              </p>
            </div>
          </div>
          <Card>
            <ChoiceQuestionView q={qTrial} />
          </Card>
          <Callout tone="key" title="The ruling">
            <strong>p tells us about evidence against H₀. Cramer&apos;s V tells us about strength.</strong> A tiny p with a tiny V is a
            convincing case about a small matter.
          </Callout>
          <Card>
            <ChoiceQuestionView q={qVerdictStrength} />
          </Card>
        </CaseSection>

        {/* ---------- Part 5 ---------- */}
        <CaseSection
          part="5"
          id="lazarsfeld"
          kicker="Lazarsfeld meets Tony Soprano"
          title="What happens to X → Y when Z walks in?"
          intro={
            <>
              Start from the zero-order relationship between <Role r="X">later season</Role> and <Role r="Y">major violence</Role>. Then
              introduce a control variable <Role r="Z" /> and compare the partial relationships with the original one.
            </>
          }
          aside="Bivariate analysis. Whatever happened there."
        >
          <Exhibit label="Zero-order relationship (from the dataset)">
            <MiniTable
              caption="% of episodes with major violence"
              head={["", "Seasons 1–3", "Seasons 4–6", "Difference"]}
              rows={[["All episodes", pct(EARLY_PCT), pct(LATE_PCT), `+${(LATE_PCT - EARLY_PCT).toFixed(1)} points`]]}
            />
            <SyntheticTag />
          </Exhibit>
          <Exhibit label="Lazarsfeld visualizer" title="Four ways a story can end">
            <LzVisualizer />
          </Exhibit>
          <Exhibit label="Scenarios" title="Same X and Y, four hypothetical sets of partial tables">
            <p className="text-sm text-muted">
              <HypotheticalTag className="mr-2" />
              The partial tables in scenarios A–D are invented to illustrate each pattern. They are not computed from the dataset.
            </p>
            <Card>
              <ChoiceQuestionView q={qLzA} />
            </Card>
            <Card>
              <ChoiceQuestionView q={qLzB} />
            </Card>
            <Card>
              <div className="space-y-8">
                <ChoiceQuestionView q={qLzCWhere} />
                <ChoiceQuestionView q={qLzC} />
              </div>
            </Card>
            <Card>
              <div className="space-y-8">
                <ChoiceQuestionView q={qLzDWhere} />
                <ChoiceQuestionView q={qLzD} />
              </div>
            </Card>
            <Callout tone="warn" title="Same tables, different story">
              Scenarios C and D produce identical-looking partial tables. Only the position of Z in the story (intervening vs antecedent)
              separates interpretation from explanation, and that position comes from theory and timing, not from the tables.
            </Callout>
          </Exhibit>
        </CaseSection>

        {/* ---------- Part 6 ---------- */}
        <CaseSection
          part="6"
          id="order"
          kicker="Put the analysis in order"
          title="Five steps, one correct sequence"
          intro="Drag the steps into order (or use the arrow buttons)."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <Card>
              <OrderQuestionView q={SOP_SEQUENCE} showFormat={false} />
            </Card>
            <Callout tone="key" title="Why the 2D table comes first" className="self-start">
              We cannot say what changed after controlling for Z unless we first know what the original zero-order relationship looked like.
            </Callout>
          </div>
        </CaseSection>

        {/* ---------- Part 7 ---------- */}
        <CaseSection
          part="7"
          id="correlation"
          kicker="Correlation"
          title="Do longer episodes contain more violence?"
          aside="Correlation does not imply whacking."
        >
          <ResearchQuestion>Do longer episodes contain more violence?</ResearchQuestion>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Scatter
                xs={col("runtime_minutes")}
                ys={col("violence_event_count")}
                xLabel="runtime_minutes"
                yLabel="violence_event_count"
                ariaLabel="Scatterplot of runtime against violent events: a loose upward cloud."
              />
              <SyntheticTag />
            </div>
            <Card>
              <ChoiceQuestionView q={qCorLevels} compact />
            </Card>
          </div>
          <Gate q={qCorMethod}>
            <MenuPath path={["Analyze", "Correlate", "Bivariate"]} />
            <SpssOutput
              title="Correlations"
              headers={["", "", "runtime_minutes", "violence_event_count"]}
              rows={[
                ["runtime_minutes", { v: "Pearson Correlation", align: "left" }, "1", { v: noLeadingZero(RUNTIME_VIOLENCE.r, 3) + "**", hl: 1 }],
                ["", { v: "Sig. (2-tailed)", align: "left" }, "", { v: sig(RUNTIME_VIOLENCE.p), hl: 2 }],
                ["", { v: "N", align: "left" }, String(N), { v: String(N), hl: 3 }],
                ["violence_event_count", { v: "Pearson Correlation", align: "left" }, noLeadingZero(RUNTIME_VIOLENCE.r, 3) + "**", "1"],
                ["", { v: "Sig. (2-tailed)", align: "left" }, sig(RUNTIME_VIOLENCE.p), ""],
                ["", { v: "N", align: "left" }, String(N), String(N)],
              ]}
              annotations={{
                1: `r = ${noLeadingZero(RUNTIME_VIOLENCE.r)}: positive and ${rLabel(RUNTIME_VIOLENCE.r)}.`,
                2: `p ${sig(RUNTIME_VIOLENCE.p).startsWith("<") ? "" : "= "}${sig(RUNTIME_VIOLENCE.p)}: statistically significant.`,
                3: "Always report N.",
              }}
              footnote="** Correlation is significant at the 0.01 level (2-tailed). Synthetic teaching data."
            />
            <WriteUp
              id="cor-result"
              prompt="Write the result in one sentence, the way you would in a report."
              model={`There is a statistically significant ${rLabel(RUNTIME_VIOLENCE.r)} positive association between episode runtime and the number of violent events (r = ${noLeadingZero(RUNTIME_VIOLENCE.r)}, p ${sig(RUNTIME_VIOLENCE.p).startsWith("<") ? "" : "= "}${sig(RUNTIME_VIOLENCE.p)}, N = ${N}).`}
              checklist={[
                "names both variables",
                "gives the direction (positive)",
                "gives the strength (moderate)",
                "says whether it is statistically significant",
                "reports r, p and N",
                "uses association language, not causal language",
              ]}
            />
            <Card>
              <ChoiceQuestionView q={qCorCause} />
            </Card>
          </Gate>
        </CaseSection>

        <CaseSection
          part="7½"
          id="swearing"
          kicker="Bonus round"
          title="Does Tony swear more in longer episodes?"
          intro={
            <>
              <Role r="X">runtime_minutes</Role> and <Role r="Y">fuck_count</Role>. Guess the correlation from the scatterplot before it is
              revealed, then decide which coefficient deserves to be reported.
            </>
          }
        >
          <GuessSwearing />
          <Card>
            <ChoiceQuestionView q={qFuckMethod} />
          </Card>
        </CaseSection>

        {/* ---------- Part 8 ---------- */}
        <CaseSection
          part="8"
          id="nonlinear"
          kicker="Nonlinearity trap"
          title="Is violence unrelated to the passage of the series?"
          intro="Violent events per episode, in series order. Look at the plot before you trust the coefficient."
        >
          <UShapePlot />
          <Card>
            <ChoiceQuestionView q={qUShape} />
          </Card>
          <Callout tone="note" title="Two measures of ‘violence’, two stories">
            The number of violent events is U-shaped over the series, while the share of episodes with <em>major</em> violence rises in later
            seasons (Part 3). Different operationalisations of the same idea can behave differently, which is why the research question has
            to name the variable.
          </Callout>
        </CaseSection>

        {/* ---------- Part 9 ---------- */}
        <CaseSection
          part="9"
          id="t-tests"
          kicker="The three t-tests"
          title="One mean, two groups, or two measurements?"
          intro="For each question: choose the test first. The SPSS procedure appears only after you have answered."
        >
          <Exhibit label="Question A">
            <Gate q={qTA}>
              <Card>
                <ChoiceQuestionView q={qTAH0} compact />
              </Card>
              <MenuPath path={["Analyze", "Compare Means", "One-Sample T Test"]} />
              <SpssOutput
                title={`One-Sample Test (Test Value = ${BENCHMARK})`}
                headers={["", "Mean", "t", "df", "Sig. (2-tailed)", "Mean Difference"]}
                rows={[["runtime_minutes", ONE_SAMPLE.m.toFixed(2), ONE_SAMPLE.t.toFixed(3), String(ONE_SAMPLE.df), sig(ONE_SAMPLE.p), ONE_SAMPLE.meanDiff.toFixed(2)]]}
                footnote={`The average synthetic episode runs ${ONE_SAMPLE.m.toFixed(1)} minutes, significantly longer than ${BENCHMARK}: t(${ONE_SAMPLE.df}) = ${ONE_SAMPLE.t.toFixed(2)}, p < .001.`}
              />
            </Gate>
          </Exhibit>
          <Exhibit label="Question B">
            <Gate q={qTB}>
              <Card>
                <ChoiceQuestionView q={qTBRoles} compact />
              </Card>
              <MenuPath path={["Analyze", "Compare Means", "Independent-Samples T Test"]} />
              <p className="text-sm text-muted">
                Test Variable: <span className="font-mono text-ink">violence_event_count</span> · Grouping Variable:{" "}
                <span className="font-mono text-ink">therapy_scene (1 0)</span>. The output is in Part 10.
              </p>
            </Gate>
          </Exhibit>
          <Exhibit label="Question C">
            <Gate q={qTC}>
              <Card>
                <ChoiceQuestionView q={qTCWhy} compact />
              </Card>
              <MenuPath path={["Analyze", "Compare Means", "Paired-Samples T Test"]} />
              <SpssOutput
                title="Paired Samples Test"
                headers={["", "Mean Difference", "t", "df", "Sig. (2-tailed)"]}
                rows={[["crime_conflict_count − family_conflict_count", PAIRED.meanDiff.toFixed(2), PAIRED.t.toFixed(3), String(PAIRED.df), sig(PAIRED.p)]]}
                footnote={`Within the same episodes, crime conflicts (M = ${PAIRED.crime.toFixed(2)}) outnumber family conflicts (M = ${PAIRED.family.toFixed(2)}). Synthetic teaching data.`}
              />
            </Gate>
          </Exhibit>
        </CaseSection>

        {/* ---------- Part 10 ---------- */}
        <CaseSection
          part="10"
          id="t-output"
          kicker="Reading t-test output"
          title="Therapy scenes and violent events"
          intro={
            <>
              <Role r="X">therapy_scene</Role> as the grouping variable, <Role r="Y">violence_event_count</Role> as the test variable.
            </>
          }
          aside={THERAPY_ROW.p < 0.05 ? "Statistically significant. Emotionally complicated." : undefined}
        >
          <SpssOutput
            title="Group Statistics"
            headers={["therapy_scene", "N", "Mean", "Std. Deviation", "Std. Error Mean"]}
            rows={THERAPY_GROUPS.map((g) => [g.label, String(g.n), g.m.toFixed(2), g.s.toFixed(3), (g.s / Math.sqrt(g.n)).toFixed(3)])}
          />
          <SpssOutput
            title="Independent Samples Test"
            groupHeaders={[
              { label: "", span: 1 },
              { label: "Levene's Test", span: 2 },
              { label: "t-test for Equality of Means", span: 4 },
            ]}
            headers={["", "F", "Sig.", "t", "df", "Sig. (2-tailed)", "Mean Difference"]}
            rows={[
              [
                "Equal variances assumed",
                THERAPY_LEVENE.f.toFixed(3),
                { v: f3(THERAPY_LEVENE.p), hl: 1 },
                THERAPY_T.equal.t.toFixed(3),
                String(THERAPY_T.equal.df),
                { v: sig(THERAPY_T.equal.p), hl: 2 },
                THERAPY_T.equal.meanDiff.toFixed(3),
              ],
              [
                "Equal variances not assumed",
                "",
                "",
                THERAPY_T.welch.t.toFixed(3),
                THERAPY_T.welch.df.toFixed(3),
                sig(THERAPY_T.welch.p),
                THERAPY_T.welch.meanDiff.toFixed(3),
              ],
            ]}
            activeRow={THERAPY_LEVENE.p >= 0.05 ? 0 : 1}
            annotations={{
              1: `Levene's p = ${f3(THERAPY_LEVENE.p)} ≥ .05: read the ‘Equal variances assumed’ row.`,
              2: `Sig. (2-tailed) ${sig(THERAPY_ROW.p).startsWith("<") ? "" : "= "}${sig(THERAPY_ROW.p)}.`,
            }}
          />
          <SpssOutput
            title="Independent Samples Effect Sizes"
            headers={["", "Standardizer", "Point Estimate"]}
            rows={[
              ["Cohen's d", THERAPY_SP.toFixed(3), noLeadingZero(THERAPY_D, 3)],
              ["Hedges' correction", (THERAPY_SP * (THERAPY_D / THERAPY_G)).toFixed(3), { v: noLeadingZero(THERAPY_G, 3), hl: 3 }],
            ]}
            annotations={{ 3: "Hedges' g: Cohen's d with a small-sample correction. Ignore the sign when judging size." }}
            footnote="Synthetic teaching data."
          />
          <QuizRunner questions={T_OUTPUT_QUESTIONS} title="Four questions about the output" />
        </CaseSection>

        {/* ---------- Part 11 ---------- */}
        <CaseSection
          part="11"
          id="levene"
          kicker="Levene's test mini-boss"
          title="Before you interpret the t-test, Paulie has one more question."
          intro="Levene's H₀: the two groups have equal variances. Its p-value only decides which row of the t-test table to read."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <ChoiceQuestionView q={qLevene1} compact />
            </Card>
            <Card>
              <ChoiceQuestionView q={qLevene2} compact />
            </Card>
          </div>
        </CaseSection>

        {/* ---------- Part 12 ---------- */}
        <CaseSection
          part="12"
          id="final-boss"
          kicker="Final boss"
          title="Did later seasons become more violent, or is it the finales?"
          intro="One research problem, every step: roles, measurement levels, the zero-order table, χ² and V, the partial tables, the Lazarsfeld classification, and what you can and cannot claim."
        >
          <ResearchQuestion>
            Did later Sopranos seasons become more violent, or is the apparent relationship mainly due to season finales?
          </ResearchQuestion>
          <Exhibit label="The tables (from the dataset)">
            <div className="grid gap-4 lg:grid-cols-2">
              <MiniTable
                caption={`Zero-order: early_late × major_violence (N = ${N})`}
                head={["", "No major violence", "Major violence", "Total"]}
                rows={ZERO_ORDER.map((r, i) => [
                  i ? "Seasons 4–6" : "Seasons 1–3",
                  `${r[0]} (${pct((r[0] / (r[0] + r[1])) * 100)})`,
                  `${r[1]} (${pct((r[1] / (r[0] + r[1])) * 100)})`,
                  String(r[0] + r[1]),
                ])}
              />
              <MiniTable
                caption="Three-dimensional: % with major violence, by finale_episode"
                head={["Layer (Z)", "Seasons 1–3", "Seasons 4–6", "n"]}
                rows={[
                  ["Ordinary episodes", pct(nfPct[0]), pct(nfPct[1]), String(nfN)],
                  ["Finales", pct(fiPct[0]), pct(fiPct[1]), String(fiN)],
                ]}
              />
            </div>
            <p className="font-mono text-xs text-muted">
              Zero-order: χ²(1) = {ZERO_ORDER_TEST.chi2.toFixed(2)}, p {P_TXT}, V = {V_TXT}. Ordinary episodes: χ²(1) ={" "}
              {PARTIAL_NON_FINALE_TEST.chi2.toFixed(2)}, p = {sig(PARTIAL_NON_FINALE_TEST.p)}, V = {noLeadingZero(PARTIAL_NON_FINALE_TEST.cramersV)}.
              Finales: too few episodes for a χ² test.
            </p>
            <SyntheticTag />
          </Exhibit>
          <QuizRunner questions={BOSS_QUESTIONS} title="The case, step by step" />
          <Exhibit label="SPSS mode" title="The three-dimensional crosstab">
            <MenuPath path={["Analyze", "Descriptive Statistics", "Crosstabs"]} />
            <p className="text-sm text-muted">
              Same dialog as Part 3, with <span className="font-mono text-ink">finale_episode</span> in the Layer box: SPSS prints one partial
              table (with χ² and V) per category of Z.
            </p>
          </Exhibit>
          <WriteUp
            id="final-conclusion"
            rows={6}
            prompt="Write your research conclusion in 3–4 sentences."
            model={`In this (synthetic) dataset, episodes from seasons 4–6 were more likely to contain major violence than episodes from seasons 1–3 (${pct(LATE_PCT)} vs ${pct(EARLY_PCT)}; χ²(1) = ${ZERO_ORDER_TEST.chi2.toFixed(2)}, p ${P_TXT}, Cramer's V = ${V_TXT}), a weak-to-moderate association. Controlling for season finales left the relationship essentially unchanged: among ordinary episodes the difference was similar (${pct(nfPct[1])} vs ${pct(nfPct[0])}), and the finale table is too small (n = ${fiN}) to suggest otherwise, so the pattern is replication. Finale status is neither antecedent nor intervening and is practically unrelated to season period, so it cannot account for the relationship. The analysis shows an association that is not explained by finales; it does not show that later seasons caused more violence.`}
            checklist={[
              "states the zero-order relationship with percentages within X",
              "reports χ², p and Cramer's V",
              "describes what happened in the partial tables",
              "names the Lazarsfeld pattern (replication)",
              "says what role Z plays (neither antecedent nor intervening)",
              "notes the small finale table",
              "avoids a causal claim",
            ]}
          />
        </CaseSection>

        {/* ---------- Report ---------- */}
        <section id="report" className="scroll-mt-28">
          <div className="rounded-2xl border border-line-strong bg-bg p-4 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)] sm:p-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Final report</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">Case closed (for now)</h2>
            <div className="mt-6">
              <Profile />
            </div>
          </div>
        </section>

        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-[var(--cream-muted)]">
          {SYNTHETIC_NOTICE} This page is an independent teaching exercise. It is not affiliated with or endorsed by HBO or the makers of The
          Sopranos, and it uses no images, logos or scripts from the show.
        </p>
      </div>
    </div>
  );
}
