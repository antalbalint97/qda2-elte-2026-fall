import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssDialog, SpssOutput } from "@/components/learning/Spss";
import { Checklist } from "@/components/modules/crosstab/Checklist";
import { ChiDemo } from "@/components/modules/crosstab/ChiDemo";
import { CrosstabViz } from "@/components/modules/crosstab/CrosstabViz";
import { COUNTS } from "@/components/modules/crosstab/data";
import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { MODULES } from "@/content/modules";
import { qChiV, qColWhenXInCols, qExpected, qMissing, qRowCol } from "@/content/questions";
import { chiSquareTest, noLeadingZero } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crosstabs" };
const meta = MODULES[1];

export default function Page() {
  const t = chiSquareTest(COUNTS);
  return (
    <ModuleShell
      meta={meta}
      lede={
        <>
          A crosstab only answers your question if the percentages are computed in the right direction. The rule:{" "}
          <strong className="text-ink">percentage within the categories of the independent variable</strong>, then
          compare across them.
        </>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="Which total is the percentage computed from?"
        intro={
          <>
            <Role r="X">age group</Role> and <Role r="Y">speaks a foreign language</Role>, N = 1,600. Switch between
            counts and percentages and watch which cells are shaded together: shaded cells share a denominator and add
            up to 100%.
          </>
        }
      >
        <CrosstabViz />
        <Callout tone="key" className="mt-6" title="Row or column is not the point">
          The question is never “row % or column %?” in the abstract. It is “where is X?”. Use the Transpose button: the
          right percentages switch from row to column, but the numbers you compare stay the same.
        </Callout>
      </Step>

      <Step kind="try" id="try" title="Which percentages should we compare?">
        <div className="space-y-8">
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <ChoiceQuestionView q={qRowCol} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <ChoiceQuestionView q={qColWhenXInCols} />
          </div>
          <Checklist />
        </div>
      </Step>

      <Step
        kind="understand"
        id="chi"
        title="χ², Cramer's V and p answer different questions"
        intro="Keep the three apart and most interpretation errors disappear."
      >
        <ChiDemo />
      </Step>

      <Step kind="spss" id="spss" title="Crosstabs in SPSS">
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "What is the research question?", a: "Do age groups differ in whether people speak a foreign language?" },
              { q: "What are X and Y?", a: <><Role r="X">age group</Role> <Role r="Y">speaks a foreign language</Role></> },
              { q: "Measurement levels?", a: "Ordinal (age group) and nominal (yes/no): categorical, so a crosstab." },
              { q: "Compare or associate?", a: "Compare the distribution of Y across categories of X." },
              { q: "Which method?", a: "Crosstab with percentages within X, χ² test, Cramer's V." },
            ]}
          />
          <MenuPath path={["Analyze", "Descriptive Statistics", "Crosstabs"]} />
          <SpssDialog
            title="Crosstabs"
            variables={["gender", "educ", "settlement", "polint"]}
            fields={[
              { label: "Row(s):", values: ["agegroup (X)"], note: "X in the rows…" },
              { label: "Column(s):", values: ["forlang (Y)"], note: "…and Y in the columns, so row percentages are percentages within X." },
            ]}
            options={[
              { label: "Cells › Observed", checked: true },
              { label: "Cells › Expected", checked: true, note: "Lets you see where observed and expected counts differ most." },
              { label: "Cells › Row", checked: true, note: "Percentages within each row, i.e. within X." },
              { label: "Statistics › Chi-square", checked: true },
              { label: "Statistics › Phi and Cramer's V", checked: true },
            ]}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <SpssOutput
              title="Chi-Square Tests"
              headers={["", "Value", "df", "Asymptotic Sig. (2-sided)"]}
              rows={[
                ["Pearson Chi-Square", { v: t.chi2.toFixed(3), hl: 1 }, String(t.df), { v: ".000", hl: 2 }],
                ["Likelihood Ratio", { v: "—", dim: true }, { v: "2", dim: true }, { v: ".000", dim: true }],
                ["N of Valid Cases", "1600", "", ""],
              ]}
              annotations={{
                1: "Read the Pearson Chi-Square row.",
                2: ".000 means p < .001: evidence of an association.",
              }}
              footnote={`a. 0 cells (0.0%) have expected count less than 5. The minimum expected count is ${t.minExpected.toFixed(2)}.`}
            />
            <SpssOutput
              title="Symmetric Measures"
              headers={["", "", "Value", "Approximate Sig."]}
              rows={[
                ["Nominal by Nominal", "Phi", { v: noLeadingZero(t.cramersV, 3), dim: true }, { v: ".000", dim: true }],
                ["", "Cramer's V", { v: noLeadingZero(t.cramersV, 3), hl: 3 }, ".000"],
                ["N of Valid Cases", "", "1600", ""],
              ]}
              annotations={{ 3: "Strength of the association: moderate. (For a 2-column table, Phi and V coincide in size.)" }}
            />
          </div>
          <Callout tone="note" title="Reporting">
            Speaking a foreign language differs by age group: 62.4% of 18–34-year-olds, 45.0% of 35–54-year-olds and
            24.0% of those aged 55+ speak one (χ²({t.df}) = {t.chi2.toFixed(1)}, p &lt; .001, Cramer&apos;s V ={" "}
            {noLeadingZero(t.cramersV)}). The association is moderate; the data do not show why it exists.
          </Callout>
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qRowCol, qColWhenXInCols, qChiV, qMissing, qExpected]} />
      </Step>
    </ModuleShell>
  );
}
