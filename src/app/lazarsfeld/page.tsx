import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssDialog } from "@/components/learning/Spss";
import { DecisionTree, PatternSummary } from "@/components/modules/lazarsfeld/DecisionTree";
import { Explorer } from "@/components/modules/lazarsfeld/Explorer";
import { Scenarios } from "@/components/modules/lazarsfeld/Scenarios";
import { OrderQuestionView } from "@/components/quiz/OrderQuestionView";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { Term } from "@/components/ui/Term";
import { MODULES } from "@/content/modules";
import {
  LAZARSFELD_SEQUENCE,
  qLzAntecedent,
  qLzInterpretation,
  qLzReplication,
  qLzSpecification,
  qLzWhy2D,
} from "@/content/questions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lazarsfeld Paradigm" };
const meta = MODULES[2];

export default function Page() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <>
          Start with a <Term k="zeroOrder">zero-order relationship</Term> between <Role r="X" /> and <Role r="Y" />.
          Introduce a <Term k="control">control variable</Term> <Role r="Z" />. Then ask one question: what happened to
          the original relationship?
        </>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="One relationship, four possible stories"
        intro="Graduates are 25 points more likely to be politically active. Pick a control variable, split the data into partial tables, and watch what happens to the 25-point gap."
      >
        <Explorer />
        <Callout tone="key" className="mt-6" title="The comparison that matters">
          Every Lazarsfeld pattern is defined by comparing the <strong>partial relationships</strong> with the{" "}
          <strong>zero-order relationship</strong>, and the partial relationships with each other.
        </Callout>
      </Step>

      <Step
        kind="understand"
        id="tree"
        title="The decision tree"
        intro="Two questions are enough to classify any pattern. Explanation and interpretation produce identical tables; only the position of Z in the causal or temporal sequence tells them apart."
      >
        <DecisionTree />
        <div className="mt-10">
          <h3 className="mb-4 font-semibold text-ink">Summary</h3>
          <PatternSummary />
        </div>
        <Callout tone="warn" className="mt-6" title="Careful with causal language">
          Arrows show the <em>proposed</em> sequence, which comes from theory and timing, not from the tables. Survey
          crosstabs show associations; ‘explained by’ and ‘operates through’ describe how the pattern fits the model.
        </Callout>
      </Step>

      <Step
        kind="try"
        id="sequence"
        title="Put the analysis in order"
        intro="A Lazarsfeld analysis has five steps. Drag them into the right order (or use the arrow buttons)."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <OrderQuestionView q={LAZARSFELD_SEQUENCE} showFormat={false} />
          </div>
          <Callout tone="key" title="Why do we need the 2D table first?" className="self-start">
            Because the purpose of the three-dimensional analysis is to examine what changes relative to the original
            zero-order relationship.
          </Callout>
        </div>
      </Step>

      <Step
        kind="try"
        id="scenarios"
        title="Practice scenarios"
        intro="Ten short sociology scenarios. For each one: identify X, Y and Z, decide whether Z is antecedent or intervening, read the partial tables, and name the pattern."
      >
        <Scenarios />
      </Step>

      <Step
        kind="spss"
        id="spss"
        title="Zero-order and partial tables in SPSS"
        intro="The same Crosstabs dialog produces both tables: without a layer variable you get the zero-order table, with Z in the Layer box you get one partial table per category of Z."
      >
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "What is the research question?", a: "Is education associated with political participation, and does this change when controlling for Z?" },
              { q: "What are X, Y and Z?", a: <><Role r="X">education</Role> <Role r="Y">participation</Role> <Role r="Z">control variable</Role></> },
              { q: "What are their measurement levels?", a: "Categorical (nominal or ordinal), so crosstabs fit." },
              { q: "What are we comparing?", a: "The distribution of Y within categories of X, first overall, then within each category of Z." },
              { q: "Which method?", a: "Two- and three-dimensional crosstabs with percentages within X, χ² and Cramer's V." },
            ]}
          />
          <MenuPath path={["Analyze", "Descriptive Statistics", "Crosstabs"]} />
          <SpssDialog
            title="Crosstabs"
            variables={["gender", "settlement", "parstatus", "polint", "age"]}
            fields={[
              { label: "Row(s):", values: ["educ (X)"], note: "Put X in the rows so you can request row percentages (percentages within X)." },
              { label: "Column(s):", values: ["polpart (Y)"], note: "The dependent variable goes in the columns." },
              {
                label: "Layer 1 of 1:",
                values: ["Z (e.g. gender)"],
                note: "Leave empty for the zero-order table. Add Z here to get one partial table per category of Z.",
              },
            ]}
            options={[
              { label: "Cells… › Row percentages", checked: true, note: "Percentages within each category of X (because X is in the rows)." },
              { label: "Statistics… › Chi-square", checked: true },
              { label: "Statistics… › Phi and Cramer's V", checked: true, note: "SPSS reports χ² and V separately for each layer, so you can compare partial relationships." },
            ]}
            footerNote="Run it twice: first without a layer (zero-order), then with Z as the layer (partial tables)."
          />
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qLzReplication, qLzSpecification, qLzAntecedent, qLzInterpretation, qLzWhy2D]} />
      </Step>
    </ModuleShell>
  );
}
