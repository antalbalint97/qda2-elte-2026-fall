import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssDialog, SpssOutput } from "@/components/learning/Spss";
import { TexBlock } from "@/components/learning/Tex";
import { CORRECT_REVERSED, fmt3, ITEMS, scoredMatrix } from "@/components/modules/indices/data";
import { IndexBuilder } from "@/components/modules/indices/IndexBuilder";
import { IndexCutter } from "@/components/modules/indices/IndexCutter";
import { SameScore } from "@/components/modules/indices/SameScore";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { MODULES } from "@/content/modules";
import {
  INDEX_PIPELINE,
  qIdxAlphaValidity,
  qIdxForgotReverse,
  qIdxHighAlpha,
  qIdxRelative,
  qIdxSameScore,
  qIdxWhichDrop,
} from "@/content/questions";
import { cronbachAlpha, itemTotalStatistics } from "@/lib/reliability";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Building an Index" };
const meta = MODULES.find((m) => m.slug === "indices")!;

const ALL = ITEMS.map(() => true);
const VARS = ITEMS.map((it) => (it.negative ? `${it.id.toLowerCase()}_r` : it.id.toLowerCase()));
const six = scoredMatrix(ALL, CORRECT_REVERSED);
const sixAlpha = cronbachAlpha(six);
const sixRows = itemTotalStatistics(six);
const worst = sixRows.reduce((best, r, j) => (r.alphaIfDeleted > sixRows[best].alphaIfDeleted ? j : best), 0);
const five = scoredMatrix(ITEMS.map((_, j) => j !== worst), CORRECT_REVERSED);
const fiveAlpha = cronbachAlpha(five);
const f2 = (v: number) => v.toFixed(2);
/** SPSS prints correlations and alphas without a leading zero. */
const spss = (v: number) => fmt3(v).replace(/^(-?)0\./, "$1.");

const PIPELINE = [
  ["Clean", "Frequencies on every item; set ‘don't know’ and refusals as missing."],
  ["Align", "Reverse-score the items worded the other way, into new variables."],
  ["Select", "Reliability Analysis; delete the weakest item, one at a time, while alpha rises. Keep ≥ 3."],
  ["Compute", "Index = mean of the kept items. Label what a high value means."],
  ["Categorise", "Optional: recode into absolute, relative or percentile categories."],
] as const;

export default function IndicesPage() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <p className="font-serif text-2xl text-ink">
          Some concepts are too big for one question. How several survey items become one number, and what that number
          can and cannot tell you.
        </p>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="Why ask more than one question?"
        intro="Trust in science, xenophobia, religiosity: these are latent concepts. Nobody can answer them directly, so we ask several concrete items, each covering one aspect, and combine the answers afterwards. That combining step is data reduction."
      >
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="tracking-tight text-xl font-semibold text-ink">More valid</h3>
              <p className="mt-2 text-sm text-muted">
                Validity: measuring what you mean to measure. A single question such as &ldquo;Do you trust
                science?&rdquo; leaves every respondent to decide what &ldquo;science&rdquo; and &ldquo;trust&rdquo;
                mean. Several concrete items (relying on findings, following advice in a crisis, suspecting hidden
                results) pin the concept down and cover its different sides.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <h3 className="tracking-tight text-xl font-semibold text-ink">More reliable</h3>
              <p className="mt-2 text-sm text-muted">
                Reliability: getting the same result when you measure again under the same conditions. One answer on a
                0–10 scale wobbles from day to day; the average of several answers wobbles much less, because the
                random ups and downs of single items partly cancel out.
              </p>
            </div>
          </div>
          <SameScore />
          <div className="grid gap-4 md:grid-cols-2">
            <Callout title="Index: same direction, then average">
              Every item measures more or less of the same concept, so after aligning their direction we can add them
              up or average them. The result is a scale-level variable from 1 to 5.
            </Callout>
            <Callout title="Typology: combine categories, never average">
              A typology crosses categorical variables into types (for example, attends services often or rarely × prays
              often or rarely gives four types). Codes such as 11, 12, 21, 22 are labels of a nominal variable: their
              mean means nothing.
            </Callout>
          </div>
          <ol className="grid gap-3 sm:grid-cols-5" aria-label="The five steps of building an index">
            {PIPELINE.map(([head, body], i) => (
              <li key={head} className="rounded-xl border border-line bg-surface-2 p-4">
                <p className="font-mono text-xs text-faint">{i + 1}</p>
                <p className="mt-1 font-semibold text-ink">{head}</p>
                <p className="mt-1 text-xs text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Step>

      <Step
        kind="try"
        id="try"
        title="Build the index yourself"
        intro="Steps 2 and 3, live: reverse, read the correlations, watch alpha, delete one item at a time."
      >
        <div className="space-y-6">
          <IndexBuilder />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <TexBlock>{String.raw`\alpha = \frac{k}{k-1}\left(1 - \frac{\sum_i s_i^2}{s_{\text{sum}}^2}\right)`}</TexBlock>
              <p className="text-sm text-muted">
                k is the number of items, <em>s</em>
                <sub>i</sub>² the variance of item i, <em>s</em>
                <sub>sum</sub>² the variance of the summed score. Alpha runs up to 1, and it can drop below 0 when items
                contradict each other.
              </p>
            </div>
            <Callout tone="key" title="Rules of thumb used in the course">
              .90 or more: excellent, but suspect redundant items · .80–.89 good · .70–.79 acceptable · .60–.69
              questionable · .50–.59 weak · below .50 unacceptable. An item whose corrected item-total correlation is
              below about .25 does not fit the others. Delete one item at a time, and never go below three.
            </Callout>
          </div>
        </div>
      </Step>

      <Step
        kind="try"
        id="categories"
        title="From index to categories"
        intro="Step 5 is optional: a crosstab needs a categorical variable, so the 1–5 index is sometimes cut into three groups. Where you cut decides what the groups mean."
      >
        <div className="space-y-6">
          <IndexCutter />
          <Callout tone="warn" title="Recode ranges must touch">
            If one range ends at 2.10 and the next starts at 2.20, a value such as 2.15 belongs to neither and silently
            becomes missing. Write the limits with enough decimals (2.10 / 2.11) and always compare the number of missing
            cases in the index and in its categorical version: they must be equal.
          </Callout>
        </div>
      </Step>

      <Step
        kind="spss"
        id="spss"
        title="The same steps in SPSS"
        intro="The reliability analysis below is calculated from the same synthetic data as the builder, with T3 and T5 already reversed."
      >
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "Which concept?", a: "Trust in science, high value = more trust." },
              { q: "Which items?", a: "t1–t6, answered on the same 1–5 agreement scale." },
              { q: "Which run the other way?", a: "t3 and t5 (agreeing means less trust): reverse them into t3_r and t5_r." },
              { q: "What do I need from the output?", a: "Cronbach's alpha, and per item the corrected item-total correlation and alpha if item deleted." },
            ]}
          />
          <MenuPath path={["Transform", "Recode into Different Variables"]} />
          <p className="text-sm text-muted">
            Old → new values: 1 → 5, 2 → 4, 3 → 3, 4 → 2, 5 → 1. Recode into a <em>different</em> variable so that the
            original answers stay untouched, then check that the number of missing values did not change.
          </p>
          <MenuPath path={["Analyze", "Scale", "Reliability Analysis"]} />
          <SpssDialog
            title="Reliability Analysis"
            variables={["t1", "t2", "t3", "t4", "t5", "t6", "t3_r", "t5_r"]}
            fields={[
              {
                label: "Items",
                values: VARS,
                note: "Always the reversed versions (t3_r, t5_r), never the originals.",
              },
            ]}
            options={[
              { label: "Model: Alpha", checked: true, note: "The default model is Cronbach's alpha." },
              { label: "Statistics… › Scale if item deleted", checked: true, note: "Produces the Item-Total Statistics table." },
            ]}
            footerNote="Click Paste to save the syntax, or OK to run."
          />
          <SpssOutput
            title="Reliability Statistics"
            headers={["Cronbach's Alpha", "N of Items"]}
            rows={[[{ v: spss(sixAlpha), hl: 1 }, String(ITEMS.length)]]}
            annotations={{ 1: `${spss(sixAlpha)}: questionable, just short of .70. Try to improve it before computing the index.` }}
          />
          <SpssOutput
            title="Item-Total Statistics"
            headers={["", "Scale Mean if Item Deleted", "Scale Variance if Item Deleted", "Corrected Item-Total Correlation", "Cronbach's Alpha if Item Deleted"]}
            rows={sixRows.map((r, j) => [
              VARS[j],
              f2(r.scaleMeanIfDeleted),
              f2(r.scaleVarianceIfDeleted),
              j === worst ? { v: spss(r.itemTotal), hl: 2 } : spss(r.itemTotal),
              j === worst ? { v: spss(r.alphaIfDeleted), hl: 3 } : spss(r.alphaIfDeleted),
            ])}
            activeRow={worst}
            annotations={{
              2: `${VARS[worst]} barely correlates with the sum of the other items: well below .25.`,
              3: `Deleting ${VARS[worst]} would raise alpha from ${spss(sixAlpha)} to ${spss(sixRows[worst].alphaIfDeleted)}, the largest gain of any item.`,
            }}
            footnote={`After deleting ${VARS[worst]} and rerunning: alpha = ${spss(fiveAlpha)} with five items, and no further deletion raises it. Stop there.`}
          />
          <MenuPath path={["Transform", "Compute Variable"]} />
          <div className="rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed text-ink">
            <p>COMPUTE trust_idx = MEAN(t1, t2, t3_r, t4, t5_r).</p>
            <p>VARIABLE LABELS trust_idx &apos;Trust in science index (1-5, high = more trust)&apos;.</p>
            <p>RECODE trust_idx (1 thru 2.49=1) (2.50 thru 3.50=2) (3.51 thru 5=3) INTO trust_3abs.</p>
            <p>EXECUTE.</p>
          </div>
          <p className="text-sm text-muted">
            <code className="font-mono text-ink">MEAN()</code> averages the items a respondent did answer. Writing the
            mean out as <code className="font-mono text-ink">(t1 + t2 + t3_r + t4 + t5_r) / 5</code> instead gives a
            missing index to anyone who skipped an item. Use the one your course asks for, and know which
            it is. Then run Frequencies on the new variables to check the result and the missing counts.
          </p>
          <p className="text-sm text-muted">
            Next, the categorical version can go into a <Link href="/crosstabs" className="text-accent underline">crosstab</Link>,
            and the 1–5 index into a <Link href="/t-tests" className="text-accent underline">t-test</Link> or{" "}
            <Link href="/correlation" className="text-accent underline">correlation</Link>.
          </p>
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner
          questions={[qIdxAlphaValidity, qIdxForgotReverse, qIdxWhichDrop, qIdxHighAlpha, qIdxSameScore, qIdxRelative, INDEX_PIPELINE]}
        />
      </Step>
    </ModuleShell>
  );
}
